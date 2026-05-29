"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StoreRedirect({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  const shopDomain = params.shopDomain;
  const rawUrl = searchParams.get("url");
  const backUrl = searchParams.get("back") || "/products";
  const productUrl = rawUrl ? decodeURIComponent(rawUrl) : `https://${shopDomain}`;

  // Auto-redirect after 3 seconds
  useEffect(() => {
    if (countdown === 0) {
      window.open(productUrl, "_blank");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, productUrl]);

  const goNow = () => window.open(productUrl, "_blank");

  const storeName = shopDomain
    .replace(".myshopify.com", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
    }}>

      {/* Your platform branding stays on top */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 52,
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 100,
      }}>
        <button onClick={() => router.push(backUrl)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: "var(--radius)",
          border: "1px solid var(--border2)", color: "var(--text2)",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: "transparent",
        }}>
          ← Back to Marketplace
        </button>

        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 16, color: "var(--accent)", letterSpacing: "-0.02em",
        }}>
          MARKET
        </div>
      </div>

      {/* Store logo / avatar */}
      <div style={{
        width: 80, height: 80,
        borderRadius: "var(--radius-xl)",
        background: "var(--bg3)",
        border: "1px solid var(--border2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: 32, color: "var(--accent)",
        marginBottom: 24,
      }}>
        {storeName[0]}
      </div>

      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text3)", marginBottom: 10,
      }}>
        You are leaving the marketplace
      </div>

      <h1 style={{ fontSize: 28, marginBottom: 12, color: "var(--text)" }}>
        {storeName}
      </h1>

      <p style={{
        fontSize: 15, color: "var(--text2)", maxWidth: 400,
        lineHeight: 1.7, marginBottom: 32,
      }}>
        This store opens in a new tab so you can shop and come back to the marketplace easily.
      </p>

      {/* Countdown + CTA */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <button onClick={goNow} style={{
          padding: "15px 40px",
          background: "var(--accent)", color: "#0a0a0a",
          borderRadius: "var(--radius)", fontFamily: "var(--font-display)",
          fontWeight: 800, fontSize: 16, cursor: "pointer",
          border: "none", letterSpacing: "-0.01em",
          display: "flex", alignItems: "center", gap: 10,
          transition: "opacity 0.15s",
        }}>
          Visit {storeName} ↗
        </button>

        <div style={{ fontSize: 13, color: "var(--text3)" }}>
          Opens automatically in <span style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            color: "var(--accent)", fontSize: 16,
          }}>{countdown}</span> seconds
        </div>

        <button onClick={() => router.push(backUrl)} style={{
          padding: "10px 24px",
          background: "transparent",
          border: "1px solid var(--border2)",
          color: "var(--text3)",
          borderRadius: "var(--radius)", fontSize: 13,
          cursor: "pointer",
        }}>
          Stay in marketplace
        </button>
      </div>

      {/* Product preview card */}
      <div style={{
        marginTop: 48, padding: "16px 20px",
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", maxWidth: 380, width: "100%",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>
          You clicked
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", wordBreak: "break-all", lineHeight: 1.5 }}>
          {productUrl}
        </div>
      </div>
    </div>
  );
}
