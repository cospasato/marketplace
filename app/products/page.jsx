export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getProducts, getCategories } from "@/lib/aggregator";
import ProductCard from "@/components/ui/ProductCard";
import ProductsClient from "./ProductsClient";

export const revalidate = 120;

export default async function ProductsPage({ searchParams }) {
  const { q, store, category, minPrice, maxPrice, sort, page } = searchParams;

  const [{ products, total, pages }, stores, categories] = await Promise.all([
    getProducts({
      search: q,
      storeId: store,
      category,
      minPrice,
      maxPrice,
      sortBy: sort || "random",
      page: parseInt(page) || 1,
      limit: 48,
    }),
    db.store.findMany({ where: { active: true }, select: { id: true, storeName: true } }),
    getCategories(),
  ]);

  return (
    <ProductsClient
      initialProducts={products}
      total={total}
      pages={pages}
      stores={stores}
      categories={categories}
      searchParams={searchParams}
    />
  );
}
