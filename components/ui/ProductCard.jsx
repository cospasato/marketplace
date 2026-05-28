"use client";
import { useRouter } from "next/navigation";

export default function ProductCard({ product, size = "md" }) {
  const router = useRouter();

  const handleClick = () => {
    const encodedUrl = encodeURIComponent(product.productUrl);
    router.push(`/store/${product.store?.shopDomain || product.shopDomain}?url=${encodedUrl}&back=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };

  const isLg = size === "lg";

  return (
    <div onClick={handleClick} style={{
      cursor: "pointer",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s",
      display: "flex",
      flexDirection: "column",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {/* Image */}
      <div style={{
        aspectRatio: "1",
        background: "var(--bg3)",
        overflow: "hidden",
        position: "relative",
      }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>
            No image
          </div>
        )}
        {product.comparePrice && product.comparePrice > product.price && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "var(--accent2)", color: "#1a0f00",
            fontSize: 11, fontWeight: 700, padding: "3px 8px",
            borderRadius: 6, fontFamily: "var(--font-display)",
            letterSpacing: "0.05em",
          }}>
            SALE
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isLg ? "14px 16px" : "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {product.store?.storeName || product.storeName}
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: isLg ? 15 : 13,
          color: "var(--text)",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {product.title}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: isLg ? 16 : 14, color: "var(--accent)" }}>
            {product.currency} {product.price.toFixed(2)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span style={{ fontSize: 12, color: "var(--text3)", textDecoration: "line-through" }}>
              {product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
