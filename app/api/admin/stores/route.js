export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const stores = await db.store.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(stores);
}

export async function POST(request) {
  const body = await request.json();
  const { shopDomain, customDomain, storeName, storefrontToken, description, currency, primaryColor } = body;

  if (!shopDomain || !storeName || !storefrontToken) {
    return NextResponse.json({ error: "shopDomain, storeName, and storefrontToken are required" }, { status: 400 });
  }

  const cleanDomain = shopDomain.replace("https://", "").replace(/\/$/, "").trim();

  if (!cleanDomain.includes(".myshopify.com")) {
    return NextResponse.json({
      error: `"${cleanDomain}" is not a valid myshopify domain. It must end in .myshopify.com — e.g. your-store.myshopify.com. Find it in Shopify Admin → Settings → Domains.`
    }, { status: 400 });
  }

  try {
    const store = await db.store.create({
      data: {
        shopDomain: cleanDomain,
        customDomain: customDomain?.replace("https://", "").replace(/\/$/, "").trim() || null,
        storeName,
        storefrontToken,
        description: description || null,
        currency: currency || "USD",
        primaryColor: primaryColor || null,
      },
    });
    return NextResponse.json(store, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A store with this domain already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
