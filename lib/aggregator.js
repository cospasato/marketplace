// lib/aggregator.js — fetch, merge, normalize products from all stores

import { db } from "./db";
import { fetchStoreProducts } from "./shopify";

// Full sync: fetch all products from all stores and upsert into DB
export async function syncAllStores() {
  const stores = await db.store.findMany({ where: { active: true } });
  const results = [];

  for (const store of stores) {
    try {
      const products = await fetchStoreProducts(store, { limit: 250 });

      // Upsert all products
      await db.$transaction(
        products.map((p) =>
          db.product.upsert({
            where: { id: p.id },
            update: {
              title: p.title,
              handle: p.handle,
              description: p.description,
              price: p.price,
              comparePrice: p.comparePrice,
              currency: p.currency,
              imageUrl: p.imageUrl,
              productUrl: p.productUrl,
              tags: p.tags,
              category: p.category,
              available: p.available,
              syncedAt: new Date(),
              updatedAt: new Date(),
            },
            create: { ...p, syncedAt: new Date() },
          })
        )
      );

      // Update store product count
      await db.store.update({
        where: { id: store.id },
        data: { productCount: products.length, updatedAt: new Date() },
      });

      await db.syncLog.create({
        data: {
          storeId: store.id,
          status: "success",
          products: products.length,
          message: `Synced ${products.length} products`,
        },
      });

      results.push({ store: store.storeName, status: "ok", count: products.length });
    } catch (err) {
      await db.syncLog.create({
        data: {
          storeId: store.id,
          status: "error",
          message: err.message,
        },
      });
      results.push({ store: store.storeName, status: "error", error: err.message });
    }
  }

  return results;
}

// Sync a single store (called from webhooks)
export async function syncStore(storeId) {
  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Store not found");

  const products = await fetchStoreProducts(store, { limit: 250 });

  await db.$transaction(
    products.map((p) =>
      db.product.upsert({
        where: { id: p.id },
        update: { ...p, syncedAt: new Date() },
        create: { ...p, syncedAt: new Date() },
      })
    )
  );

  await db.store.update({
    where: { id: store.id },
    data: { productCount: products.length, updatedAt: new Date() },
  });

  return products.length;
}

// Query products from DB with filtering
export async function getProducts({
  search = "",
  storeId = null,
  category = null,
  minPrice = null,
  maxPrice = null,
  available = true,
  sortBy = "random",
  page = 1,
  limit = 48,
} = {}) {
  const where = {
    ...(available ? { available: true } : {}),
    ...(storeId ? { storeId } : {}),
    ...(category ? { category } : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
            ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy =
    sortBy === "price_asc"
      ? { price: "asc" }
      : sortBy === "price_desc"
      ? { price: "desc" }
      : sortBy === "newest"
      ? { syncedAt: "desc" }
      : { syncedAt: "desc" }; // random handled post-query

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { store: { select: { storeName: true, shopDomain: true, logoUrl: true, primaryColor: true } } },
    }),
    db.product.count({ where }),
  ]);

  const finalProducts =
    sortBy === "random"
      ? products.sort(() => Math.random() - 0.5)
      : products;

  return { products: finalProducts, total, pages: Math.ceil(total / limit) };
}

// Get featured products for homepage
export async function getFeaturedProducts(limit = 12) {
  const products = await db.product.findMany({
    where: { available: true },
    orderBy: { syncedAt: "desc" },
    take: limit * 3,
    include: { store: { select: { storeName: true, shopDomain: true, logoUrl: true, primaryColor: true } } },
  });
  return products.sort(() => Math.random() - 0.5).slice(0, limit);
}

// Get all categories across stores
export async function getCategories() {
  const cats = await db.product.groupBy({
    by: ["category"],
    where: { available: true, category: { not: null } },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });
  return cats.filter((c) => c.category).map((c) => ({ name: c.category, count: c._count.category }));
}
