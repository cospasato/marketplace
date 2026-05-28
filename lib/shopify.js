export const dynamic = "force-dynamic";

export function createStorefrontClient(shopDomain, storefrontToken) {
  const cleanDomain = shopDomain
    .replace("https://", "")
    .replace("http://", "")
    .replace(/\/$/, "")
    .trim();

  const cleanToken = storefrontToken.trim();

  // Headless app tokens are long strings (not shpat_)
  // They use the same Storefront API endpoint but different auth
  // Try both header formats — Headless uses "Shopify-Storefront-Private-Token" 
  // or "X-Shopify-Storefront-Access-Token" depending on token type
  const isHeadlessToken = !cleanToken.startsWith("shpat_");

  const endpoint = `https://${cleanDomain}/api/2024-10/graphql.json`;

  return {
    async query(graphql, variables = {}) {
      // Build headers based on token type
      const headers = {
        "Content-Type": "application/json",
      };

      if (isHeadlessToken) {
        // Headless app "Public access token" uses this header
        headers["Shopify-Storefront-Private-Token"] = cleanToken;
        // Also send the standard header as fallback
        headers["X-Shopify-Storefront-Access-Token"] = cleanToken;
      } else {
        // Standard custom app Storefront token
        headers["X-Shopify-Storefront-Access-Token"] = cleanToken;
      }

      let res;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers,
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
          `Token type detected: ${isHeadlessToken ? "Headless/Public" : "Custom app/shpat_"}. ` +
          `Raw response: ${text.slice(0, 300)}`
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
