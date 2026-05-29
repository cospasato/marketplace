export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

function hashPassword(password) {
  return createHash("sha256").update(password + process.env.ADMIN_SECRET_KEY).digest("hex");
}

export async function POST(request) {
  const { name, email, password, phone } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const existing = await db.registryAccount.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const account = await db.registryAccount.create({
    data: { name, email, passwordHash: hashPassword(password), phone: phone || null },
  });

  // Create session token
  const token = randomBytes(32).toString("hex");
  await db.accountSession.create({
    data: {
      accountId: account.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return NextResponse.json({ ok: true, token, account: { id: account.id, name: account.name, email: account.email } }, { status: 201 });
}
