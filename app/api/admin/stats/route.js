export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [stores, products, syncs, orders, pending, delivering, registries, gifts, giftsPurchased, accounts] = await Promise.all([
    db.store.count({ where: { active: true } }),
    db.product.count({ where: { available: true } }),
    db.syncLog.count(),
    db.order.count(),
    db.order.count({ where: { status: "pending" } }),
    db.order.count({ where: { deliveryStatus: "out_for_delivery" } }),
    db.registry.count(),
    db.registryItem.count(),
    db.registryItem.count({ where: { status: "purchased" } }),
    db.registryAccount.count(),
  ]);
  return NextResponse.json({ stores, products, syncs, orders, pending, delivering, registries, gifts, giftsPurchased, accounts });
}
