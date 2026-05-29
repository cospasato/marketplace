export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function getAccountFromRequest(request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const session = await db.accountSession.findUnique({
    where: { token },
    include: { account: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.account;
}

export async function GET(request) {
  const account = await getAccountFromRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const registries = await db.registry.findMany({
    where: { ownerEmail: account.email },
    include: {
      items: { select: { id: true, status: true, price: true } },
      contributions: {
        select: { id: true, status: true, gifterName: true },
        include: { payment: { select: { status: true, totalAmount: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ account: { id: account.id, name: account.name, email: account.email, phone: account.phone }, registries });
}

export async function PUT(request) {
  const account = await getAccountFromRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, phone } = await request.json();
  const updated = await db.registryAccount.update({
    where: { id: account.id },
    data: { name: name || account.name, phone: phone || null },
  });
  return NextResponse.json({ account: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone } });
}
