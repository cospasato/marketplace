export const dynamic = "force-dynamic";

export function createStorefrontClient(shopDomain, storefrontToken) {
  const cleanDomain = shopDomain
    .replace("https://", "")
    .replace("http://", "")
    .replace(/\/$/, "")
    .trim();

  const endpoint = `https://${cleanDomain}/api/2024-10/graphql.json`;

  return {
    async query(graphql, variables = {}) {
      let res;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": storefrontToken.trim(),
          },
          body: JSON.stringify({ query: graphql, variables }),
          cache: "no-store",
        });
      } catch (networkErr) {
        throw new Error(`Network error reaching ${cleanDomain}: ${networkErr.message}`);
      }

      const text = await res.text();

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Auth error ${res.status} for ${cleanDomain}. ` +
          `Check: (1) token starts with shpat_, (2) Storefront API scopes are enabled, ` +
          `(3) app is installed on the store. Raw response: ${text.slice(0, 200)}`
        );
      }

      if (!res.ok) {
        throw new Error(`Shopify API ${res.status} for ${cleanDomain}: ${text.slice(0, 200)}`);
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON from Shopify: ${text.slice(0, 200)}`);
      }

      if (json.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(json.errors).slice(0, 300)}`);
      }

      return json.data;
    },
  };
}

// Uses only fields available on Storefront API — no onlineStoreUrl
const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        descriptionHtml
        availableForSale
        tags
        productType
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

export async function fetchStoreProducts(store, opts = {}) {
  const client = createStorefrontClient(store.shopDomain, store.storefrontToken);

  // Build the base URL for product links — use customDomain if available
  const storeBaseUrl = store.customDomain
    ? `https://${store.customDomain}`
    : `https://${store.shopDomain}`;

  let allProducts = [];
  let cursor = null;
  let hasMore = true;
  const limit = opts.limit || 250;

  while (hasMore && allProducts.length < limit) {
    const data = await client.query(PRODUCTS_QUERY, {
      first: Math.min(50, limit - allProducts.length),
      after: cursor || undefined,
    });

    const nodes = data.products.nodes;
    allProducts = allProducts.concat(nodes);
    hasMore = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return allProducts.map((p) => {
    const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
    const comparePrice = p.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(p.compareAtPriceRange.minVariantPrice.amount)
      : null;

    // Strip HTML from description
    const description = p.descriptionHtml
      ? p.descriptionHtml.replace(/<[^>]*>/g, "").slice(0, 500)
      : null;

    return {
      id: p.id,
      storeId: store.id,
      title: p.title,
      handle: p.handle,
      description,
      price,
      comparePrice: comparePrice && comparePrice > price ? comparePrice : null,
      currency: p.priceRange?.minVariantPrice?.currencyCode || store.currency || "USD",
      imageUrl: p.featuredImage?.url || null,
      // Build product URL from handle — works for both myshopify and custom domains
      productUrl: `${storeBaseUrl}/products/${p.handle}`,
      tags: p.tags || [],
      category: p.productType || null,
      available: p.availableForSale,
      updatedAt: new Date(),
    };
  });
}

export async function verifyWebhookSignature(body, hmacHeader) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return false;
  try {
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
  } catch {
    return false;
  }
}
