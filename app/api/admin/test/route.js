export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const token = searchParams.get("token");

  if (!domain || !token) {
    return NextResponse.json({
      error: "Provide ?domain=x.myshopify.com&token=YOUR_TOKEN"
    }, { status: 400 });
  }

  const cleanDomain = domain.replace("https://", "").replace(/\/$/, "").trim();
  const cleanToken = token.trim();
  const isHeadless = !cleanToken.startsWith("shpat_");
  const endpoint = `https://${cleanDomain}/api/2024-10/graphql.json`;

  const query = `{ shop { name primaryDomain { url } } }`;

  // Try Headless header first, then standard header
  const attempts = isHeadless
    ? [
        { "Content-Type": "application/json", "Shopify-Storefront-Private-Token": cleanToken },
        { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": cleanToken },
      ]
    : [
        { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": cleanToken },
      ];

  const results = [];

  for (const headers of attempts) {
    const headerName = headers["Shopify-Storefront-Private-Token"]
      ? "Shopify-Storefront-Private-Token"
      : "X-Shopify-Storefront-Access-Token";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
        cache: "no-store",
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = null; }

      results.push({
        header: headerName,
        status: res.status,
        ok: res.ok && json?.data?.shop,
        shop: json?.data?.shop?.name || null,
        shopDomain: json?.data?.shop?.primaryDomain?.url || null,
        error: json?.errors ? JSON.stringify(json.errors) : null,
        raw: res.ok ? null : text.slice(0, 200),
      });

      // If this one worked, stop trying
      if (res.ok && json?.data?.shop) break;

    } catch (err) {
      results.push({ header: headerName, status: "network_error", error: err.message });
    }
  }

  const success = results.find((r) => r.ok);

  return NextResponse.json({
    tokenType: isHeadless ? "Headless app / Public access token" : "Custom app / shpat_ token",
    domain: cleanDomain,
    tokenPreview: cleanToken.slice(0, 8) + "...",
    success: !!success,
    workingHeader: success?.header || null,
    shop: success?.shop || null,
    attempts: results,
    message: success
      ? `SUCCESS — token works! Shop name: "${success.shop}". You can now sync.`
      : "FAILED — see attempts for details.",
  });
}
