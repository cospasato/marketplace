// lib/shopify.js — Storefront API client factory + product sync

export function createStorefrontClient(shopDomain, storefrontToken) {
  const endpoint = `https://${shopDomain}/api/2024-10/graphql.json`;

  return {
    async query(graphql, variables = {}) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({ query: graphql, variables }),
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
      const json = await res.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      return json.data;
    },
  };
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        handle
        description
        availableForSale
        tags
        productType
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        compareAtPriceRange {
          minVariantPrice { amount }
        }
        featuredImage { url altText }
        onlineStoreUrl
      }
    }
  }
`;

export async function fetchStoreProducts(store, opts = {}) {
  const client = createStorefrontClient(store.shopDomain, store.storefrontToken);
  let allProducts = [];
  let cursor = null;
  let hasMore = true;
  const limit = opts.limit || 250;

  while (hasMore && allProducts.length < limit) {
    const data = await client.query(PRODUCTS_QUERY, {
      first: Math.min(50, limit - allProducts.length),
      after: cursor,
      query: opts.searchQuery || null,
    });

    const nodes = data.products.nodes;
    allProducts = allProducts.concat(nodes);
    hasMore = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return allProducts.map((p) => ({
    id: p.id,
    storeId: store.id,
    title: p.title,
    handle: p.handle,
    description: p.description?.slice(0, 500) || null,
    price: parseFloat(p.priceRange.minVariantPrice.amount),
    comparePrice: p.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(p.compareAtPriceRange.minVariantPrice.amount)
      : null,
    currency: p.priceRange.minVariantPrice.currencyCode,
    imageUrl: p.featuredImage?.url || null,
    productUrl:
      p.onlineStoreUrl || `https://${store.shopDomain}/products/${p.handle}`,
    tags: p.tags || [],
    category: p.productType || null,
    available: p.availableForSale,
    updatedAt: new Date(),
  }));
}

// Verify Shopify webhook HMAC signature
export async function verifyWebhookSignature(body, hmacHeader) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Buffer.from(sig).toString("base64");
  return computed === hmacHeader;
}
