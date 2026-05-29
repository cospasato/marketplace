export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = params;

  const registry = await db.registry.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      items: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        include: { contributions: true },
      },
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!registry) return NextResponse.json({ error: "Registry not found" }, { status: 404 });
  return NextResponse.json(registry);
}

export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  const registry = await db.registry.update({
    where: { id },
    data: {
      title: body.title,
      occasion: body.occasion,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      description: body.description,
      coverImage: body.coverImage,
      thankYouMsg: body.thankYouMsg,
      isPublic: body.isPublic,
      updatedAt: new Date(),
    },
  });
  return NextResponse.json(registry);
}

export async function POST(request, { params }) {
  const { id } = params;
  const body = await request.json();

  // Add item to registry
  const { productId, storeId, title, imageUrl, productUrl, price, currency, quantity, priority, note } = body;

  const item = await db.registryItem.create({
    data: {
      registryId: id,
      productId: productId || null,
      storeId: storeId || null,
      title,
      imageUrl: imageUrl || null,
      productUrl,
      price,
      currency: currency || "USD",
      quantity: quantity || 1,
      priority: priority || "medium",
      note: note || null,
      status: "available",
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (itemId) {
    await db.registryItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  }

  await db.registry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
