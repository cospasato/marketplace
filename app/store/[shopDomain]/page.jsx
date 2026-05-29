"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

export default function InAppBrowser({ params }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iframeRef = useRef(null);

  const shopDomain = params.shopDomain;
  const rawUrl = searchParams.get("url");
  const backUrl = searchParams.get("back") || "/products";
  const initialUrl = rawUrl ? decodeURIComponent(rawUrl) : `https://${shopDomain}`;

  const proxyUrl = (url) => `/api/proxy?url=${encodeURIComponent(url)}`;

  const [history, setHistory] = useState([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [addressBar, setAddressBar] = useState(initialUrl);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(initialUrl);
  const [proxyFailed, setProxyFailed] = useState(false);

  const currentUrl = history[historyIndex];

  // Animate loading bar
  useEffect(() => {
    if (!loading) { setLoadProgress(100); return; }
    setLoadProgress(10);
    const t1 = setTimeout(() => setLoadProgress(40), 300);
    const t2 = setTimeout(() => setLoadProgress(70), 800);
    const t3 = setTimeout(() => setLoadProgress(90), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [loading, currentUrl]);

  // Listen for messages from the proxied page
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "NAV") {
        // Page reported its actual URL
        setAddressBar(e.data.url);
        setAddressInput(e.data.url);
        setLoading(false);
      }

      if (e.data.type === "NAV_REQUEST") {
        // User clicked a link inside the proxied page
        navigateTo(e.data.url);
      }

      if (e.data.type === "GO_BACK") {
        goBack();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [historyIndex]);

  const navigateTo = useCallback((url) => {
    setLoading(true);
    setProxyFailed(false);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(url);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setAddressBar(url);
    setAddressInput(url);
  }, [history, historyIndex]);

  const goBack = () => {
    if (historyIndex > 0) {
      setLoading(true);
      setHistoryIndex((i) => i - 1);
      const prev = history[historyIndex - 1];
      setAddressBar(prev);
      setAddressInput(prev);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setLoading(true);
      setHistoryIndex((i) => i + 1);
      const next = history[historyIndex + 1];
      setAddressBar(next);
      setAddressInput(next);
    }
  };

  const reload = () => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = proxyUrl(currentUrl);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    let url = addressInput.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    setEditingAddress(false);
    navigateTo(url);
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setLoadProgress(100);
  };

  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;

  // Display URL — strip proxy wrapper
  const displayUrl = addressBar.includes("api/proxy?url=")
    ? decodeURIComponent(addressBar.split("api/proxy?url=")[1])
    : addressBar;

  const storeName = shopDomain
    .replace(".myshopify.com", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const btnStyle = (disabled) => ({
    width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    background: "transparent",
    color: disabled ? "var(--text3)" : "var(--text2)",
    fontSize: 16, transition: "background 0.1s",
    flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Browser chrome ── */}
      <div style={{
        flexShrink: 0,
        background: "rgba(17,17,17,0.98)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        userSelect: "none",
      }}>

        {/* Top row — marketplace nav */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "8px 12px 0", gap: 8,
        }}>
          {/* Back to marketplace */}
          <button onClick={() => router.push(backUrl)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 8,
            border: "1px solid var(--border2)", color: "var(--text2)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "transparent", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            ← Marketplace
          </button>

          <div style={{ flex: 1 }} />

          {/* Platform brand */}
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 15, color: "var(--accent)", letterSpacing: "-0.02em",
            flexShrink: 0,
          }}>
            MARKET
          </div>
        </div>

        {/* Browser controls row */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "6px 12px 8px", gap: 6,
        }}>
          {/* Back */}
          <button
            onClick={goBack}
            disabled={!canBack}
            style={btnStyle(!canBack)}
            onMouseEnter={e => !canBack || (e.currentTarget.style.background = "var(--bg3)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Go back"
          >
            ←
          </button>

          {/* Forward */}
          <button
            onClick={goForward}
            disabled={!canForward}
            style={btnStyle(!canForward)}
            onMouseEnter={e => !canForward || (e.currentTarget.style.background = "var(--bg3)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Go forward"
          >
            →
          </button>

          {/* Reload */}
          <button
            onClick={reload}
            style={btnStyle(false)}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Reload"
          >
            {loading ? "✕" : "↻"}
          </button>

          {/* Address bar */}
          {editingAddress ? (
            <form onSubmit={handleAddressSubmit} style={{ flex: 1 }}>
              <input
                autoFocus
                value={addressInput}
                onChange={e => setAddressInput(e.target.value)}
                onBlur={() => setEditingAddress(false)}
                style={{
                  width: "100%", padding: "6px 12px",
                  background: "var(--bg)", border: "1.5px solid var(--accent2)",
                  borderRadius: 8, fontSize: 12,
                  color: "var(--text)", fontFamily: "var(--font-body)",
                }}
              />
            </form>
          ) : (
            <div
              onClick={() => { setEditingAddress(true); setAddressInput(displayUrl); }}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 8, cursor: "text",
                fontSize: 12, color: "var(--text2)",
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
              }}
            >
              <span style={{ color: "var(--green)", fontSize: 11, flexShrink: 0 }}>🔒</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayUrl}
              </span>
            </div>
          )}

          {/* Open in new tab */}
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            style={{
              ...btnStyle(false),
              textDecoration: "none", fontSize: 14,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            ↗
          </a>
        </div>

        {/* Loading progress bar */}
        <div style={{
          height: 2, background: "var(--bg4)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${loadProgress}%`,
            background: "var(--accent)",
            transition: loading ? "width 0.4s ease" : "width 0.15s ease, opacity 0.4s ease 0.2s",
            opacity: loadProgress === 100 ? 0 : 1,
          }} />
        </div>
      </div>

      {/* ── Page content via proxy iframe ── */}
      {!proxyFailed ? (
        <iframe
          ref={iframeRef}
          key={currentUrl}
          src={proxyUrl(currentUrl)}
          style={{
            flex: 1, border: "none", width: "100%",
            background: "#fff",
          }}
          onLoad={handleIframeLoad}
          onError={() => setProxyFailed(true)}
          title={`${storeName} — in-app browser`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        /* Proxy failed fallback */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center", gap: 16,
        }}>
          <div style={{ fontSize: 48 }}>🏪</div>
          <h2 style={{ fontSize: 22, color: "var(--text)" }}>{storeName}</h2>
          <p style={{ fontSize: 14, color: "var(--text2)", maxWidth: 380, lineHeight: 1.7 }}>
            This store uses advanced security that prevents proxying.
            Open it in a new tab to shop — you can come back to the marketplace afterwards.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer" style={{
              padding: "12px 28px", background: "var(--accent)", color: "#0a0a0a",
              borderRadius: "var(--radius)", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}>
              Open store ↗
            </a>
            <button onClick={() => router.push(backUrl)} style={{
              padding: "12px 24px", background: "transparent",
              border: "1px solid var(--border2)", color: "var(--text2)",
              borderRadius: "var(--radius)", fontSize: 14, cursor: "pointer",
            }}>
              Back to marketplace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
