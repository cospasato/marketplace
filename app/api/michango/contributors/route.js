export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req) {
  const body = await req.json();
  const { fundId, name, phone, email, amount, paymentMode, reference, note, anonymous } = body;
  if (!fundId || !name || !amount)
    return NextResponse.json({ error: "fundId, name and amount required" }, { status: 400 });
  try {
    const fund = await db.eventFund.findUnique({ where: { id: fundId } });
    if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    const c = await db.eventContributor.create({
      data: { fundId, name, phone, email, amount: parseFloat(amount), currency: fund.currency || "TZS", paymentMode: paymentMode || "cash", reference, note, anonymous: anonymous || false, paidAt: new Date() },
    });
    return NextResponse.json(c, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  await db.eventContributor.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
