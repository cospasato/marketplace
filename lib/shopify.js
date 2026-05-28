export const dynamic = "force-dynamic";

// Always use the .myshopify.com domain for API calls
// Custom domains (berogenge.com) don't work with the Storefront API
function getApiDomain(shopDomain) {
  if (shopDomain.includes(".myshopify.com")) return shopDomain;
  // If someone entered a custom domain, we can't fix it automatically
  // They must enter the myshopify.com domain in the admin panel
  throw new Error(
    `Invalid shop domain: "${shopDomain}". ` +
    `You must use the original Shopify domain (e.g. your-store.myshopify.com), ` +
    `not a custom domain (e.g. berogenge.com). ` +
    `Find it in Shopify Admin → Settings → Domains.`
  );
}

export function createStorefrontClient(shopDomain, storefrontToken) {
  const apiDomain = getApiDomain(shopDomain);
  const endpoint = `https://${apiDomain}/api/2024-10/graphql.json`;

  return {
    async query(graphql, variables = {}) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({ query: graphql, variables }),
        cache: "no-store",
      });

      if (res.status === 401) {
        throw new Error(
          "401 Unauthorized — your Storefront API token is wrong or expired. " +
          "Go to Shopify Admin → Settings → Apps → Develop apps → your app → " +
          "API credentials tab → copy the Storefront API access token (starts with shpat_)."
        );
      }

      if (res.status === 403) {
        throw new Error(
          "403 Forbidden — your app is missing the required scopes. " +
          "Go to Shopify Admin → Apps → your app → Configuration → " +
          "enable unauthenticated_read_product_listings → Save → Reinstall app."
        );
      }

      if (!res.ok) {
        throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      return json.data;
    },
  };
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
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
    productUrl: p.onlineStoreUrl || `https://${store.shopDomain}/products/${p.handle}`,
    tags: p.tags || [],
    category: p.productType || null,
    available: p.availableForSale,
    updatedAt: new Date(),
  }));
}

export async function verifyWebhookSignature(body, hmacHeader) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Buffer.from(sig).toString("base64");
  return computed === hmacHeader;
}
