"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const OCCASION_EMOJIS = { "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" };

function useConfetti(canvasRef) {
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const burst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["var(--accent)","var(--yellow)","var(--green)","var(--blue)","var(--red)","var(--accent2)","#fff","#a78bfa"];
    for (let i = 0; i < 150; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width, y: -10 - Math.random() * 100,
        w: Math.random() * 10 + 4, h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 5, vy: Math.random() * 5 + 3,
        rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 6,
        opacity: 1,
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.05);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.opacity -= 0.012; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (particlesRef.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  }, []);
  return burst;
}

export default function LiveDashboard({ slug }) {
  const canvasRef = useRef(null);
  const burst = useConfetti(canvasRef);
  const prevContribsRef = useRef([]);

  const [registry, setRegistry] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [lastGift, setLastGift] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentGifts, setRecentGifts] = useState([]);
  const [clock, setClock] = useState(new Date());
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const poll = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/registry/live?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Error ${res.status} — check the registry slug in the URL`);
        setConnected(false);
        return;
      }
      const data = await res.json();
      setConnected(true);
      setError("");
      setPollCount(n => n + 1);

      setRegistry(prev => {
        const prevContribs = prevContribsRef.current;
        const newContribs = (data.contributions || []).filter(c => !prevContribs.find(p => p.id === c.id));
        if (newContribs.length > 0 && prevContribs.length > 0) {
          newContribs.forEach(c => {
            setLastGift(c);
            setShowCelebration(true);
            burst();
            setTimeout(() => setShowCelebration(false), 6000);
            setRecentGifts(r => [c, ...r].slice(0, 5));
          });
        }
        prevContribsRef.current = data.contributions || [];
        return data;
      });
    } catch (err) {
      setConnected(false);
      setError("Cannot connect. Check your internet connection.");
    }
  }, [slug, burst]);

  useEffect(() => {
    if (!slug) { setError("No registry slug in URL. Use /registry/live/YOUR-REGISTRY-SLUG"); return; }
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [poll, slug]);

  if (!slug) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--red)", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <p>No registry slug in URL.</p>
        <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 8 }}>URL should be: /registry/live/your-registry-slug</p>
      </div>
    </div>
  );

  if (error && !registry) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--red)", padding: 40, maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <p style={{ marginBottom: 8 }}>{error}</p>
        <p style={{ fontSize: 13, color: "var(--text3)" }}>Slug used: <code style={{ color: "var(--accent2)" }}>{slug}</code></p>
        <button onClick={poll} style={{ marginTop: 20, padding: "10px 24px", background: "var(--accent)", color: "var(--bg)", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 }}>Retry</button>
      </div>
    </div>
  );

  if (!registry) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, border: "3px solid #2a2a2a", borderTop: "3px solid #e8d5b0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "var(--text3)", fontSize: 14 }}>Connecting to {slug}...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const items = registry.items || [];
  const contributions = registry.contributions || [];
  const purchased = items.filter(i => i.status === "purchased").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  const available = items.filter(i => i.status === "available").length;
  const total = items.length;
  const progressPct = total > 0 ? Math.round(((purchased + claimed) / total) * 100) : 0;
  const totalValue = items.reduce((s, i) => s + (i.price || 0), 0);
  const giftedValue = contributions.reduce((s, c) => s + (c.payment?.totalAmount || c.amount || 0), 0);
  const currency = items[0]?.currency || "USD";
  const occasionEmoji = OCCASION_EMOJIS[registry.occasion] || "🎁";

  // Top gifters by amount paid
  const gifterMap = {};
  contributions.forEach(c => {
    const key = c.gifterEmail || c.gifterName;
    const amt = c.payment?.totalAmount || c.amount || 0;
    if (!gifterMap[key]) gifterMap[key] = { name: c.gifterName, email: key, total: 0, count: 0 };
    gifterMap[key].total += amt;
    gifterMap[key].count += 1;
  });
  const topGifters = Object.values(gifterMap).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "var(--text)", fontFamily: "Georgia, serif", overflow: "hidden", position: "relative", paddingBottom: 48 }}>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(196,168,112,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #1a1a1a", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "var(--green)" : "var(--yellow)", boxShadow: connected ? "0 0 8px #4ade80" : "none", animation: connected ? "pulse 2s infinite" : "none" }} />
          <span style={{ fontSize: 11, color: connected ? "var(--green)" : "var(--yellow)", fontFamily: "sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>
            {connected ? "LIVE" : "CONNECTING"} · {pollCount} updates
          </span>
          {error && <span style={{ fontSize: 11, color: "var(--red)", fontFamily: "sans-serif" }}>⚠ {error}</span>}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>{registry.occasion?.toUpperCase()} REGISTRY</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{registry.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "sans-serif" }}>
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "sans-serif" }}>{clock.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, maxWidth: 1400, margin: "0 auto" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total Gifts", value: total, icon: "🎁", color: "var(--text)" },
              { label: "Purchased", value: purchased, icon: "✅", color: "var(--green)" },
              { label: "Claimed", value: claimed, icon: "🔖", color: "var(--yellow)" },
              { label: "Available", value: available, icon: "💝", color: "var(--text2)" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: "var(--bg2)", border: "1px solid #1a1a1a", borderRadius: 14, padding: "18px", textAlign: "center" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div style={{ background: "var(--bg2)", border: "1px solid #1a1a1a", borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: "var(--text2)", fontFamily: "sans-serif" }}>Registry progress</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{progressPct}%</span>
            </div>
            <div style={{ height: 14, background: "var(--bg3)", borderRadius: 7, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #4ade80, #e8d5b0)", borderRadius: 7, transition: "width 1s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text3)", fontFamily: "sans-serif" }}>
              <span>{purchased + claimed} of {total} gifts taken</span><span>{available} remaining</span>
            </div>
          </div>

          {/* Value */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid rgba(232,213,176,0.1)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 10, color: "var(--accent2)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>TOTAL REGISTRY VALUE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{currency} {totalValue.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ background: "var(--bg2)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 10, color: "var(--green)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>GIFTS CONTRIBUTED</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)" }}>{currency} {giftedValue.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Gift grid */}
          <div style={{ background: "var(--bg2)", border: "1px solid #1a1a1a", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.08em", marginBottom: 14, fontFamily: "sans-serif" }}>GIFT LIST</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  background: item.status === "purchased" ? "rgba(74,222,128,0.08)" : item.status === "claimed" ? "rgba(245,158,11,0.08)" : "var(--bg2)",
                  border: `1px solid ${item.status === "purchased" ? "rgba(74,222,128,0.2)" : item.status === "claimed" ? "rgba(245,158,11,0.2)" : "#1e1e1e"}`,
                  borderRadius: 10, overflow: "hidden", transition: "all 0.8s ease",
                }}>
                  {item.imageUrl && (
                    <div style={{ aspectRatio: "1", position: "relative" }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: item.status !== "available" ? "brightness(0.6)" : "none", transition: "filter 0.8s" }} />
                      {item.status === "purchased" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✅</div>}
                      {item.status === "claimed" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔖</div>}
                    </div>
                  )}
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>{item.title}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginTop: 2, fontFamily: "sans-serif" }}>{item.currency} {(item.price || 0).toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Celebration */}
          {showCelebration && lastGift && (
            <div style={{ background: "linear-gradient(135deg, rgba(232,213,176,0.12), rgba(196,168,112,0.08))", border: "1px solid rgba(232,213,176,0.25)", borderRadius: 18, padding: "22px 18px", textAlign: "center", animation: "popIn 0.4s ease" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 11, color: "var(--accent2)", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "sans-serif" }}>NEW GIFT!</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>{lastGift.gifterName}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", fontFamily: "sans-serif" }}>gifted</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{lastGift.item?.title || "a gift"}</div>
              {(lastGift.payment?.totalAmount || lastGift.amount) > 0 && (
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--green)", marginTop: 8 }}>
                  {currency} {(lastGift.payment?.totalAmount || lastGift.amount || 0).toFixed(2)}
                </div>
              )}
              {lastGift.message && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, fontStyle: "italic", fontFamily: "sans-serif" }}>"{lastGift.message}"</div>}
            </div>
          )}

          {/* 🏆 Top Gifters leaderboard */}
          {topGifters.length > 0 && (
            <div style={{ background: "var(--bg2)", border: "1px solid rgba(196,168,112,0.15)", borderRadius: 16, padding: "18px 18px" }}>
              <div style={{ fontSize: 11, color: "var(--accent2)", letterSpacing: "0.1em", marginBottom: 14, fontFamily: "sans-serif" }}>🏆 TOP GIFTERS</div>
              {topGifters.map((g, i) => (
                <div key={g.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < topGifters.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13,
                    background: i === 0 ? "rgba(232,213,176,0.2)" : i === 1 ? "rgba(180,180,180,0.15)" : i === 2 ? "rgba(180,120,60,0.15)" : "var(--bg3)",
                    color: i === 0 ? "var(--accent)" : i === 1 ? "#c0c0c0" : i === 2 ? "#b47830" : "var(--text3)",
                    border: `1px solid ${i === 0 ? "rgba(232,213,176,0.3)" : i === 1 ? "rgba(180,180,180,0.2)" : i === 2 ? "rgba(180,120,60,0.2)" : "var(--bg5)"}`,
                  }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--text)", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "sans-serif" }}>{g.count} gift{g.count !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? "var(--accent)" : "var(--text2)", fontFamily: "sans-serif", flexShrink: 0 }}>
                    {g.total > 0 ? `${currency} ${g.total.toFixed(0)}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live gifters feed */}
          <div style={{ background: "var(--bg2)", border: "1px solid #1a1a1a", borderRadius: 16, padding: "18px" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "sans-serif" }}>GIFT FEED ({contributions.length})</div>
            {contributions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13, fontFamily: "sans-serif" }}>Waiting for first gift... 🎁</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                {contributions.slice(0, 20).map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: i === 0 ? "rgba(232,213,176,0.06)" : "var(--bg2)", border: `1px solid ${i === 0 ? "rgba(232,213,176,0.12)" : "var(--bg3)"}`, borderRadius: 10, animation: i === 0 ? "slideIn 0.4s ease" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "var(--accent)", flexShrink: 0 }}>
                      {(c.gifterName || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "sans-serif" }}>{c.gifterName}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.item?.title || "Gift"} · {c.status === "purchased" ? "✅" : "🔖"}
                      </div>
                    </div>
                    {(c.payment?.totalAmount || c.amount) > 0 && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent2)", fontFamily: "sans-serif", flexShrink: 0 }}>
                        {(c.payment?.totalAmount || c.amount || 0).toFixed(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registry info */}
          <div style={{ background: "var(--bg2)", border: "1px solid #1a1a1a", borderRadius: 16, padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{occasionEmoji}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{registry.ownerName}</div>
            {registry.eventDate && <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 4, fontFamily: "sans-serif" }}>{new Date(registry.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>}
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10, fontFamily: "monospace", wordBreak: "break-all" }}>
              {typeof window !== "undefined" ? window.location.origin : ""}/registry/{registry.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      {contributions.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.95)", borderTop: "1px solid #1a1a1a", padding: "8px 0", overflow: "hidden", zIndex: 50 }}>
          <div style={{ display: "inline-flex", gap: 48, animation: "ticker 25s linear infinite", whiteSpace: "nowrap", fontSize: 13, color: "var(--text2)", fontFamily: "sans-serif" }}>
            {[...contributions.slice(0, 10), ...contributions.slice(0, 10)].map((c, i) => (
              <span key={i} style={{ color: i % 2 === 0 ? "var(--accent2)" : "var(--text2)" }}>
                🎁 {c.gifterName} gifted "{c.item?.title || "a gift"}"
                {(c.payment?.totalAmount || c.amount) > 0 ? ` · ${currency} ${(c.payment?.totalAmount || c.amount || 0).toFixed(0)}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }
      `}</style>
    </div>
  );
}
