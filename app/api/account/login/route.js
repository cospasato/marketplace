export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

function hashPassword(password) {
  return createHash("sha256").update(password + process.env.ADMIN_SECRET_KEY).digest("hex");
}

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const account = await db.registryAccount.findUnique({ where: { email } });
  if (!account || account.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const token = randomBytes(32).toString("hex");
  await db.accountSession.create({
    data: {
      accountId: account.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, token, account: { id: account.id, name: account.name, email: account.email } });
}
