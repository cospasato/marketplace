export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request) {
  const body = await request.json();
  const { itemId, gifterName, gifterEmail, message, contributionAmount } = body;

  if (!itemId || !gifterName || !gifterEmail) {
    return NextResponse.json({ error: "itemId, gifterName and gifterEmail required" }, { status: 400 });
  }

  const item = await db.registryItem.findUnique({ where: { id: itemId }, include: { registry: true } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Group buy: anyone can contribute, item stays "available" until target met
  if (item.groupBuy) {
    const amount = parseFloat(contributionAmount) || 0;
    if (amount <= 0) return NextResponse.json({ error: "Enter a contribution amount" }, { status: 400 });

    const newCollected = (item.collectedAmount || 0) + amount;
    const targetMet = item.targetAmount && newCollected >= item.targetAmount;

    const [contribution] = await db.$transaction([
      db.contribution.create({
        data: {
          registryId: item.registryId,
          itemId,
          gifterName,
          gifterEmail,
          message: message || null,
          contributionAmount: amount,
          amount: amount,
          status: "claimed",
        },
      }),
      db.registryItem.update({
        where: { id: itemId },
        data: {
          collectedAmount: newCollected,
          status: targetMet ? "purchased" : "available",
          purchasedAt: targetMet ? new Date() : null,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true, contribution,
      groupBuy: true,
      targetMet,
      newCollected,
      targetAmount: item.targetAmount,
      message: targetMet ? "Target reached! Gift fully funded." : `Thank you! ${((newCollected / (item.targetAmount || item.price)) * 100).toFixed(0)}% of target reached.`,
    });
  }

  // Regular claim: one person claims the whole item
  if (item.status !== "available") {
    return NextResponse.json({ error: "This item has already been claimed" }, { status: 409 });
  }

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
    ok: true, contribution,
    productUrl: item.productUrl,
    message: "Item claimed. Complete your purchase to gift it.",
  });
}
