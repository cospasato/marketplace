export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { getFeaturedProducts } from "@/lib/aggregator";
import ProductCard from "@/components/ui/ProductCard";

async function getHomeData() {
  try {
    const [stores, featured] = await Promise.all([
      db.store.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { productCount: "desc" }],
        take: 8,
      }),
      getFeaturedProducts(12),
    ]);
    return { stores, featured };
  } catch {
    return { stores: [], featured: [] };
  }
}

export default async function HomePage() {
  const { stores, featured } = await getHomeData();

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ padding: "88px 24px 72px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 8px", borderRadius: 100, background: "var(--accent3)", border: "1px solid var(--border2)", marginBottom: 28 }}>
          <span style={{ fontSize: 16 }}>🛍</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" }}>
            {stores.length} partner {stores.length === 1 ? "store" : "stores"} · All in one place
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(40px, 7vw, 88px)", marginBottom: 22, fontWeight: 800, lineHeight: 1.05 }}>
          Every store.{" "}
          <span style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            One place.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "var(--text2)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Browse products from all our curated partner stores. Request delivery. Create gift registries. All without leaving our platform.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/products" style={{ padding: "14px 32px", background: "var(--accent)", color: "#0c0b0a", borderRadius: "var(--radius-lg)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", transition: "opacity 0.15s", display: "inline-block" }}>
            Browse Products →
          </Link>
          <Link href="/registry" style={{ padding: "14px 28px", background: "transparent", color: "var(--text)", border: "1px solid var(--border2)", borderRadius: "var(--radius-lg)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, transition: "all 0.15s", display: "inline-block" }}>
            🎁 Gift Registry
          </Link>
        </div>
      </section>

      {/* ── Partner stores ── */}
      {stores.length > 0 && (
        <section style={{ padding: "0 24px 72px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
            <h2 style={{ fontSize: "clamp(18px, 3vw, 24px)" }}>Partner stores</h2>
            <Link href="/products" style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}>All products →</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {stores.map((store) => (
              <Link key={store.id} href={`/products?store=${store.id}`} style={{
                display: "flex", flexDirection: "column", gap: 12, padding: "18px",
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", transition: "all 0.2s",
              }}
              onMouseEnter={undefined}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: store.primaryColor || "var(--bg4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--accent)" }}>
                  {store.storeName[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 3 }}>{store.storeName}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{store.productCount} products</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured products ── */}
      {featured.length > 0 && (
        <section style={{ padding: "0 24px 96px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontSize: "clamp(18px, 3vw, 24px)" }}>Featured products</h2>
            <Link href="/products" style={{ fontSize: 13, color: "var(--text2)" }}>See all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* ── Features strip ── */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "56px 24px", background: "var(--bg2)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
          {[
            { icon: "🛍", title: "Multi-store browsing", desc: "Browse products from all partner stores in one unified feed with filtering and search." },
            { icon: "🚚", title: "Delivery service", desc: "Request delivery of any product directly to your door. We handle the purchase and shipping." },
            { icon: "🎁", title: "Gift registry", desc: "Create wishlists for weddings, birthdays and more. Share with friends and track gifts live." },
            { icon: "💳", title: "Secure payments", desc: "Pay via M-Pesa, bank transfer, or other local methods. 5% service fee included." },
          ].map(({ icon, title, desc }) => (
            <div key={title}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: 15, fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>{title}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {stores.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text2)" }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>No stores connected yet.</p>
          <Link href="/admin" style={{ color: "var(--accent)", fontSize: 14 }}>Go to Admin to add your first store →</Link>
        </div>
      )}
    </div>
  );
}
