export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

export async function GET(request, { params }) {
  const { slug } = params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Send initial state
      const registry = await db.registry.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        include: {
          items: {
            orderBy: [{ status: "asc" }, { priority: "asc" }],
          },
          contributions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (registry) {
        send({ type: "init", registry });
      } else {
        send({ type: "error", message: "Registry not found" });
        controller.close();
        return;
      }

      // Poll for updates every 3 seconds
      const interval = setInterval(async () => {
        try {
          const updated = await db.registry.findFirst({
            where: { OR: [{ slug }, { id: slug }] },
            include: {
              items: { orderBy: [{ status: "asc" }, { priority: "asc" }] },
              contributions: {
                orderBy: { createdAt: "desc" },
                take: 20,
              },
            },
          });
          if (updated) {
            send({ type: "update", registry: updated });
          }
        } catch {
          clearInterval(interval);
        }
      }, 3000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
