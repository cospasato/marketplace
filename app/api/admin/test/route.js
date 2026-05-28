export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createStorefrontClient } from "@/lib/shopify";

// Test a token without syncing — call GET /api/admin/test?domain=x.myshopify.com&token=shpat_xxx
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const token = searchParams.get("token");

  if (!domain || !token) {
    return NextResponse.json({ error: "Provide ?domain=x.myshopify.com&token=shpat_xxx" }, { status: 400 });
  }

  try {
    const client = createStorefrontClient(domain, token);
    const data = await client.query(`
      {
        shop {
          name
          primaryDomain { url }
        }
      }
    `);
    return NextResponse.json({
      ok: true,
      shop: data.shop.name,
      domain: data.shop.primaryDomain.url,
      message: "Token is valid! You can now sync this store.",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err.message,
    }, { status: 400 });
  }
}
