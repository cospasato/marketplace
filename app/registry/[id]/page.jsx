export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PublicRegistryClient from "./PublicRegistryClient";

export default async function PublicRegistryPage({ params }) {
  const { id } = params;

  const registry = await db.registry.findFirst({
    where: { OR: [{ slug: id }, { id }] },
    include: {
      items: {
        orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
      },
      contributions: {
        where: { status: { in: ["claimed", "purchased"] } },
        select: { gifterName: true, message: true, createdAt: true, status: true, item: { select: { title: true } } },
      },
    },
  });

  if (!registry) notFound();

  return <PublicRegistryClient registry={registry} />;
}
