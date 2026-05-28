"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function StoreViewer({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const shopDomain = params.shopDomain;
  const rawUrl = searchParams.get("url");
  const backUrl = searchParams.get("back") || "/products";
  const initialUrl = rawUrl ? decodeURIComponent(rawUrl) : `https://${shopDomain}`;

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    // Try to detect if iframe was blocked (some browsers fire load even when blocked)
  };

  const handleError = () => {
    setLoading(false);
    setBlocked(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Platform top bar — always visible */}
      <div style={{
        height: 52, flexShrink: 0, zIndex: 200,
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
      }}>
        <button onClick={() => router.push(backUrl)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: "var(--radius)",
          border: "1px solid var(--border2)", color: "var(--text2)",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: "transparent", whiteSpace: "nowrap",
        }}>
          ← Marketplace
        </button>

        <div style={{
          flex: 1, background: "var(--bg3)", borderRadius: "var(--radius)",
          padding: "6px 14px", fontSize: 13, color: "var(--text3)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          border: "1px solid var(--border)",
        }}>
          🔒 {shopDomain}
        </div>

        {/* Open in new tab button */}
        <a href={initialUrl} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: "var(--radius)",
          border: "1px solid var(--border2)", color: "var(--text2)",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: "transparent", whiteSpace: "nowrap", textDecoration: "none",
        }}>
          Open full site ↗
        </a>

        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          color: "var(--accent2)", background: "rgba(196,168,112,0.1)",
          border: "1px solid rgba(196,168,112,0.2)",
          padding: "4px 10px", borderRadius: 100,
          fontFamily: "var(--font-display)", whiteSpace: "nowrap",
        }}>
          MARKET
        </div>
      </div>

      {/* Loading bar */}
      {loading && !blocked && (
        <div style={{ height: 2, background: "var(--accent)", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
      )}

      {/* Blocked message — shown when Shopify refuses the iFrame */}
      {blocked && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center", gap: 20,
        }}>
          <div style={{ fontSize: 48 }}>🏪</div>
          <h2 style={{ fontSize: 22, color: "var(--text)" }}>
            {shopDomain.replace(".myshopify.com", "")}
          </h2>
          <p style={{ fontSize: 15, color: "var(--text2)", maxWidth: 420, lineHeight: 1.7 }}>
            This store needs a small one-time setup to display inside the marketplace.
            For now, you can visit it directly — it opens in a new tab and you can come back here after.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a href={initialUrl} target="_blank" rel="noopener noreferrer" style={{
              padding: "13px 28px", background: "var(--accent)", color: "#0a0a0a",
              borderRadius: "var(--radius)", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}>
              Visit store →
            </a>
            <button onClick={() => router.push(backUrl)} style={{
              padding: "13px 28px", background: "transparent",
              border: "1px solid var(--border2)", color: "var(--text2)",
              borderRadius: "var(--radius)", fontSize: 15, cursor: "pointer",
            }}>
              Back to marketplace
            </button>
          </div>
          <div style={{
            marginTop: 20, padding: "16px 20px", background: "var(--bg2)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
            fontSize: 12, color: "var(--text3)", maxWidth: 480, lineHeight: 1.8, textAlign: "left",
          }}>
            <strong style={{ color: "var(--text2)", display: "block", marginBottom: 6 }}>
              Store owner: how to enable embedded browsing
            </strong>
            In your Shopify Admin → Online Store → Themes → Edit code → open <code style={{ background: "var(--bg3)", padding: "1px 5px", borderRadius: 3 }}>theme.liquid</code> →
            paste this inside the <code style={{ background: "var(--bg3)", padding: "1px 5px", borderRadius: 3 }}>&lt;head&gt;</code> tag:<br /><br />
            <code style={{ background: "var(--bg3)", padding: "6px 10px", borderRadius: 4, display: "block", fontSize: 11, wordBreak: "break-all" }}>
              {`<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://${typeof window !== "undefined" ? window.location.hostname : "your-marketplace.vercel.app"};">`}
            </code>
          </div>
        </div>
      )}

      {/* The iFrame — hidden when blocked */}
      {!blocked && (
        <iframe
          src={initialUrl}
          style={{ flex: 1, border: "none", width: "100%", display: blocked ? "none" : "block" }}
          onLoad={handleLoad}
          onError={handleError}
          title={`Store: ${shopDomain}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
