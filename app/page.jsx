import Link from "next/link";
import { db } from "@/lib/db";
import { getFeaturedProducts } from "@/lib/aggregator";
import ProductCard from "@/components/ui/ProductCard";

export const revalidate = 300; // revalidate every 5 minutes

async function getHomeData() {
  const [stores, featured] = await Promise.all([
    db.store.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { productCount: "desc" }],
      take: 8,
    }),
    getFeaturedProducts(12),
  ]);
  return { stores, featured };
}

export default async function HomePage() {
  const { stores, featured } = await getHomeData();

  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: "100px 24px 80px",
        maxWidth: 1200,
        margin: "0 auto",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--accent2)",
          background: "rgba(196,168,112,0.1)",
          border: "1px solid rgba(196,168,112,0.2)",
          padding: "5px 16px",
          borderRadius: 100,
          marginBottom: 28,
          fontFamily: "var(--font-body)",
        }}>
          {stores.length} stores · {featured.length > 0 ? "Thousands of products" : "No products yet"}
        </div>

        <h1 style={{ fontSize: "clamp(48px, 8vw, 96px)", marginBottom: 24, color: "var(--text)" }}>
          Every store.<br />
          <span style={{ color: "var(--accent)" }}>One place.</span>
        </h1>

        <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 520, margin: "0 auto 40px", fontWeight: 300, lineHeight: 1.7 }}>
          Browse products from all our curated partner stores without ever leaving the platform.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/products" style={{
            padding: "14px 32px",
            background: "var(--accent)",
            color: "#0a0a0a",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.01em",
            transition: "opacity 0.15s",
          }}>
            Browse All Products
          </Link>
          <Link href="/search" style={{
            padding: "14px 32px",
            background: "transparent",
            color: "var(--text2)",
            border: "1px solid var(--border2)",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 15,
          }}>
            Search
          </Link>
        </div>
      </section>

      {/* Partner stores */}
      {stores.length > 0 && (
        <section style={{ padding: "0 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
            <h2 style={{ fontSize: 22 }}>Partner stores</h2>
            <Link href="/products" style={{ fontSize: 13, color: "var(--text3)" }}>View all →</Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}>
            {stores.map((store) => (
              <Link key={store.id} href={`/store/${store.shopDomain}`} style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "20px",
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={undefined}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: "var(--radius)",
                  background: store.primaryColor || "var(--bg4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800,
                  fontFamily: "var(--font-display)",
                  color: "var(--accent)",
                }}>
                  {store.storeName[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{store.storeName}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{store.productCount} products</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section style={{ padding: "0 24px 100px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
            <h2 style={{ fontSize: 22 }}>Featured products</h2>
            <Link href="/products" style={{ fontSize: 13, color: "var(--text3)" }}>See all →</Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {stores.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text3)" }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>No stores connected yet.</p>
          <Link href="/admin" style={{ color: "var(--accent)", fontSize: 14 }}>Go to Admin to add your first store →</Link>
        </div>
      )}
    </div>
  );
}
