"use client";
import { useRouter } from "next/navigation";

export default function ProductCard({ product, size = "md" }) {
  const router = useRouter();
  const store = product.store || {};
  const isLg = size === "lg";

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  return (
    <div
      onClick={() => router.push(`/products/${encodeURIComponent(product.id)}`)}
      style={{
        cursor: "pointer", background: "var(--bg2)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
        overflow: "hidden", transition: "all 0.2s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Image */}
      <div style={{ aspectRatio: "1", background: "var(--bg3)", overflow: "hidden", position: "relative" }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>No image</div>
        )}
        {discount && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "var(--accent2)", color: "#1a0f00", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, fontFamily: "var(--font-display)" }}>
            -{discount}%
          </div>
        )}
        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.2s",
          fontSize: 12, fontWeight: 700, color: "var(--accent)",
          fontFamily: "var(--font-display)", letterSpacing: "0.08em",
          gap: 6,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
        onMouseLeave={e => e.currentTarget.style.opacity = "0"}
        >
          VIEW & ORDER ↗
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: isLg ? "14px 16px" : "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {store.storeName || product.storeName}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: isLg ? 14 : 13, color: "var(--text)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.title}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto", paddingTop: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: isLg ? 16 : 14, color: "var(--accent)" }}>
            {product.currency} {product.price.toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span style={{ fontSize: 11, color: "var(--text3)", textDecoration: "line-through" }}>
              {product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 8px",
            borderRadius: 100,
            background: "rgba(232,213,176,0.08)",
            color: "var(--accent2)",
            border: "1px solid rgba(232,213,176,0.12)",
          }}>
            🚚 Delivery available
          </span>
        </div>
      </div>
    </div>
  );
}
