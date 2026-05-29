export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { order: { select: { customerName: true, deliveryCity: true, productTitle: true } } },
  });
  const unread = await db.notification.count({ where: { read: false } });
  return NextResponse.json({ notifications, unread });
}

export async function PUT() {
  // Mark all as read
  await db.notification.updateMany({ where: { read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
