export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test the connection first
    await db.$connect();

    // Create all tables by running a raw query check
    // Prisma auto-creates tables when you first query them with db push
    // This endpoint just verifies the connection works
    const storeCount = await db.store.count();

    return NextResponse.json({
      ok: true,
      message: "Database connected and tables ready",
      stores: storeCount,
    });
  } catch (error) {
    // If tables don't exist yet, we need db push
    return NextResponse.json({
      ok: false,
      error: error.message,
      hint: "Tables may not exist yet. Check Vercel logs for migration instructions.",
    }, { status: 500 });
  }
}
