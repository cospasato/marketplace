export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request) {
  const body = await request.json();
  const { itemId, gifterName, gifterEmail, message } = body;

  if (!itemId || !gifterName || !gifterEmail) {
    return NextResponse.json({ error: "itemId, gifterName and gifterEmail required" }, { status: 400 });
  }

  const item = await db.registryItem.findUnique({ where: { id: itemId }, include: { registry: true } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.status !== "available") return NextResponse.json({ error: "This item has already been claimed" }, { status: 409 });

  const [updatedItem, contribution] = await db.$transaction([
    db.registryItem.update({
      where: { id: itemId },
      data: { status: "claimed", claimedBy: gifterEmail, claimedAt: new Date() },
    }),
    db.contribution.create({
      data: {
        registryId: item.registryId,
        itemId,
        gifterName,
        gifterEmail,
        message: message || null,
        amount: item.price,
        status: "claimed",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    contribution,
    productUrl: item.productUrl,
    message: "Item claimed. Please complete your purchase on the store.",
  });
}
