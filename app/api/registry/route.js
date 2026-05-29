export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateSlug(name, occasion) {
  const base = `${name}-${occasion}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json([], { status: 200 });

  const registries = await db.registry.findMany({
    where: { ownerEmail: email },
    include: {
      items: true,
      contributions: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(registries);
}

export async function POST(request) {
  const body = await request.json();
  const { ownerName, ownerEmail, title, occasion, eventDate, description, coverImage, thankYouMsg } = body;

  if (!ownerName || !ownerEmail || !title || !occasion) {
    return NextResponse.json({ error: "Name, email, title and occasion are required" }, { status: 400 });
  }

  const slug = generateSlug(ownerName, occasion);

  const registry = await db.registry.create({
    data: {
      slug,
      ownerName,
      ownerEmail,
      title,
      occasion,
      eventDate: eventDate ? new Date(eventDate) : null,
      description: description || null,
      coverImage: coverImage || null,
      thankYouMsg: thankYouMsg || null,
    },
  });

  return NextResponse.json(registry, { status: 201 });
}
