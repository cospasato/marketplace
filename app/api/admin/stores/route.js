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
  const { shopDomain, storeName, storefrontToken, description, currency, primaryColor } = body;

  if (!shopDomain || !storeName || !storefrontToken) {
    return NextResponse.json({ error: "shopDomain, storeName, and storefrontToken are required" }, { status: 400 });
  }

  try {
    const store = await db.store.create({
      data: {
        shopDomain: shopDomain.replace("https://", "").replace(/\/$/, ""),
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
