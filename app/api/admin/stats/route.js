export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [stores, products, syncs] = await Promise.all([
    db.store.count({ where: { active: true } }),
    db.product.count({ where: { available: true } }),
    db.syncLog.count(),
  ]);
  return NextResponse.json({ stores, products, syncs });
}
