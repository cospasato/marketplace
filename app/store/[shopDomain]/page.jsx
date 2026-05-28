"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function StoreViewer({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iframeRef = useRef(null);

  const shopDomain = params.shopDomain;
  const rawUrl = searchParams.get("url");
  const backUrl = searchParams.get("back") || "/products";
  const initialUrl = rawUrl ? decodeURIComponent(rawUrl) : `https://${shopDomain}`;

  const [currentUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Platform nav bar — always on top */}
      <div style={{
        height: 52,
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 16px",
        flexShrink: 0,
        zIndex: 200,
      }}>
        {/* Back to marketplace */}
        <button
          onClick={() => router.push(backUrl)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: "var(--radius)",
            border: "1px solid var(--border2)",
            color: "var(--text2)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", background: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          ← Marketplace
        </button>

        {/* Store domain pill */}
        <div style={{
          flex: 1,
          background: "var(--bg3)",
          borderRadius: "var(--radius)",
          padding: "6px 14px",
          fontSize: 13,
          color: "var(--text3)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-body)",
        }}>
          <span style={{ color: "var(--text3)", marginRight: 6 }}>🔒</span>
          {shopDomain}
        </div>

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
        <div style={{
          height: 2,
          background: "var(--accent)",
          flexShrink: 0,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      )}

      {/* iFrame */}
      <iframe
        ref={iframeRef}
        src={currentUrl}
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
        onLoad={() => setLoading(false)}
        title={`Store: ${shopDomain}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
      />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
