"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function StoreViewer({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iframeRef = useRef(null);
  const timerRef = useRef(null);

  const shopDomain = params.shopDomain;
  const rawUrl = searchParams.get("url");
  const backUrl = searchParams.get("back") || "/products";
  const initialUrl = rawUrl ? decodeURIComponent(rawUrl) : `https://${shopDomain}`;

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Detect iframe block: if onLoad never fires within 8s, assume blocked
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setBlocked(true);
    }, 8000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleLoad = () => {
    clearTimeout(timerRef.current);
    setLoading(false);
    // Try to detect X-Frame-Options block by checking if iframe has content
    try {
      // If store blocked iframes, accessing contentDocument throws
      const doc = iframeRef.current?.contentDocument;
      if (!doc || doc.body === null) {
        setBlocked(true);
      }
    } catch {
      setBlocked(true);
    }
  };

  // Extract the myshopify domain from the URL for the "open full site" link
  const fullSiteUrl = initialUrl;
  const storeName = shopDomain.replace(".myshopify.com", "");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Top nav bar */}
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

        <a href={fullSiteUrl} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 14px", borderRadius: "var(--radius)",
          border: "1px solid var(--border2)", color: "var(--text2)",
          fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
          textDecoration: "none",
        }}>
          Open ↗
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
      {loading && (
        <div style={{ height: 2, background: "var(--accent)", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
      )}

      {/* Blocked screen */}
      {blocked && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center", gap: 16,
        }}>
          <div style={{ fontSize: 52 }}>🏪</div>
          <h2 style={{ fontSize: 24, color: "var(--text)" }}>{storeName}</h2>
          <p style={{ fontSize: 15, color: "var(--text2)", maxWidth: 440, lineHeight: 1.8 }}>
            This store hasn't enabled embedded browsing yet.
            You can visit it directly — it opens in a new tab.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            <a href={fullSiteUrl} target="_blank" rel="noopener noreferrer" style={{
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

          {/* Instructions for store owner */}
          <div style={{
            marginTop: 16, padding: "18px 22px",
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", fontSize: 12,
            color: "var(--text3)", maxWidth: 520, lineHeight: 1.9,
            textAlign: "left", width: "100%",
          }}>
            <strong style={{ color: "var(--accent2)", display: "block", marginBottom: 8, fontSize: 13 }}>
              Fix this in 2 minutes — paste one line into your theme
            </strong>
            <strong style={{ color: "var(--text2)" }}>Step 1:</strong> Shopify Admin → Online Store → Themes → ··· → Edit code<br />
            <strong style={{ color: "var(--text2)" }}>Step 2:</strong> Open <code style={{ background: "var(--bg3)", padding: "1px 5px", borderRadius: 3 }}>layout/theme.liquid</code><br />
            <strong style={{ color: "var(--text2)" }}>Step 3:</strong> Find <code style={{ background: "var(--bg3)", padding: "1px 5px", borderRadius: 3 }}>&lt;head&gt;</code> and paste this right after it:<br /><br />
            <code style={{
              background: "var(--bg3)", padding: "8px 12px", borderRadius: 6,
              display: "block", fontSize: 11, wordBreak: "break-all",
              color: "var(--accent)", lineHeight: 1.7,
            }}>
              {`<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://${typeof window !== "undefined" ? window.location.hostname : "your-marketplace.vercel.app"};">`}
            </code>
            <br />
            <strong style={{ color: "var(--text2)" }}>Step 4:</strong> Click Save — refresh this page and the store will load inside the marketplace.
          </div>
        </div>
      )}

      {/* iFrame */}
      <iframe
        ref={iframeRef}
        src={initialUrl}
        style={{
          flex: 1, border: "none", width: "100%",
          display: blocked ? "none" : "block",
        }}
        onLoad={handleLoad}
        title={`Store: ${shopDomain}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
      />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
