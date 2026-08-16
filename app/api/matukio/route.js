// Matukio re-uses EventFund with isSupport=true
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function slug(title) {
  return "mtk-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + Math.random().toString(36).slice(2, 6);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone  = searchParams.get("phone");
  const search = searchParams.get("search");
  try {
    const where = { isSupport: true, isPublic: true };
    if (phone)  where.organiserPhone = phone;
    if (search) where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { organiserName: { contains: search, mode: "insensitive" } },
    ];
    const funds = await db.eventFund.findMany({
      where,
      include: {
        contributors: { select: { amountPaid:true, amount:true, status:true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(funds);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req) {
  const body = await req.json();
  const { title, occasion, description, organiserName, organiserEmail,
          organiserPhone, eventDate, targetAmount, currency, thankYouMsg } = body;
  if (!title || !organiserName || !organiserPhone)
    return NextResponse.json({ error: "Title, organiser name and phone are required" }, { status: 400 });
  try {
    const fund = await db.eventFund.create({
      data: {
        slug: slug(title),
        title, occasion: occasion || "Funeral / Msiba", description,
        organiserName, organiserEmail, organiserPhone,
        eventDate: eventDate ? new Date(eventDate) : null,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        currency: currency || "TZS",
        isSupport: true,
        thankYouMsg,
      },
    });
    return NextResponse.json(fund, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
