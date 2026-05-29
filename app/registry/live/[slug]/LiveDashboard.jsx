"use client";
import { useState, useEffect, useRef } from "react";

const OCCASION_EMOJIS = { "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" };

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#e8d5b0", "#f59e0b", "#4ade80", "#3b82f6", "#f87171", "#c4a870", "#fff"];
    for (let i = 0; i < 120; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -20,
        r: Math.random() * 8 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2,
        opacity: 1,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.05);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.opacity -= 0.008; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.5);
        ctx.restore();
      });
      if (particlesRef.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animRef.current); particlesRef.current = []; ctx.clearRect(0, 0, canvas.width, canvas.height); };
  }, [active]);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100 }} />;
}

export default function LiveDashboard({ slug }) {
  const [registry, setRegistry] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [lastGift, setLastGift] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentGifts, setRecentGifts] = useState([]);
  const prevContribsRef = useRef([]);
  const [ticker, setTicker] = useState([]);
  const [clock, setClock] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    const evtSource = new EventSource(`/api/registry/live?slug=${slug}`);

    evtSource.onopen = () => setConnected(true);

    evtSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "error") { setError(data.message); return; }

        const reg = data.registry;
        setRegistry(reg);

        // Detect new contributions (gifts claimed/purchased)
        const newContribs = (reg.contributions || []).filter(c =>
          !prevContribsRef.current.find(p => p.id === c.id)
        );

        if (newContribs.length > 0 && prevContribsRef.current.length > 0) {
          newContribs.forEach(c => {
            setLastGift(c);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000);
            setRecentGifts(prev => [c, ...prev].slice(0, 6));
            setTicker(prev => [`🎁 ${c.gifterName} gifted "${c.item?.title || "a gift"}"`, ...prev].slice(0, 10));
          });
        }

        prevContribsRef.current = reg.contributions || [];
      } catch {}
    };

    evtSource.onerror = () => {
      setConnected(false);
      evtSource.close();
    };

    return () => evtSource.close();
  }, [slug]);

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: 18 }}>
      {error}
    </div>
  );

  if (!registry) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: "3px solid #2a2a2a", borderTop: "3px solid #e8d5b0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#5a5650", fontSize: 14 }}>Connecting to live feed...</div>
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
  const giftedValue = contributions.reduce((s, c) => s + (c.amount || 0), 0);
  const occasionEmoji = OCCASION_EMOJIS[registry.occasion] || "🎁";

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#f0ede8", fontFamily: "Georgia, serif", overflow: "hidden", position: "relative" }}>

      <Confetti active={showCelebration} />

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(196,168,112,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(232,213,176,0.03) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #1a1a1a", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#4ade80" : "#f87171", boxShadow: connected ? "0 0 8px #4ade80" : "0 0 8px #f87171" }} />
          <span style={{ fontSize: 12, color: connected ? "#4ade80" : "#f87171", fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.08em" }}>
            {connected ? "LIVE" : "RECONNECTING"}
          </span>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#5a5650", marginBottom: 2, fontFamily: "sans-serif", letterSpacing: "0.1em" }}>{registry.occasion?.toUpperCase()} REGISTRY</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e8d5b0" }}>{registry.title}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f0ede8", fontFamily: "sans-serif" }}>
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: 11, color: "#5a5650", fontFamily: "sans-serif" }}>
            {clock.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, maxWidth: 1400, margin: "0 auto" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Hero stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "Total Gifts", value: total, color: "#f0ede8", icon: "🎁" },
              { label: "Purchased", value: purchased, color: "#4ade80", icon: "✅" },
              { label: "Claimed", value: claimed, color: "#f59e0b", icon: "🔖" },
              { label: "Available", value: available, color: "#9a9690", icon: "💝" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
                <div style={{ fontSize: 11, color: "#5a5650", fontFamily: "sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: "#9a9690", fontFamily: "sans-serif" }}>Registry progress</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#e8d5b0" }}>{progressPct}%</span>
            </div>
            <div style={{ height: 12, background: "#1a1a1a", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #4ade80, #e8d5b0)", borderRadius: 6, transition: "width 1s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "#3a3a3a", fontFamily: "sans-serif" }}>
              <span>{purchased + claimed} of {total} gifts claimed or purchased</span>
              <span>{available} remaining</span>
            </div>
          </div>

          {/* Value stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,213,176,0.1)", borderRadius: 16, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, color: "#c4a870", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "sans-serif" }}>TOTAL REGISTRY VALUE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#e8d5b0" }}>
                {(registry.items?.[0]?.currency || "USD")} {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ background: "#0d0d0d", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 16, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "sans-serif" }}>GIFTS GIVEN SO FAR</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#4ade80" }}>
                {(registry.items?.[0]?.currency || "USD")} {giftedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Gift items grid */}
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, color: "#5a5650", letterSpacing: "0.08em", marginBottom: 16, fontFamily: "sans-serif" }}>GIFT LIST</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  background: item.status === "purchased" ? "rgba(74,222,128,0.08)" : item.status === "claimed" ? "rgba(245,158,11,0.08)" : "#111",
                  border: `1px solid ${item.status === "purchased" ? "rgba(74,222,128,0.2)" : item.status === "claimed" ? "rgba(245,158,11,0.2)" : "#1e1e1e"}`,
                  borderRadius: 12, overflow: "hidden",
                  transition: "all 0.5s ease",
                }}>
                  {item.imageUrl && (
                    <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative" }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: item.status !== "available" ? "brightness(0.7)" : "none" }} />
                      {item.status === "purchased" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✅</div>}
                      {item.status === "claimed" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🔖</div>}
                    </div>
                  )}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9a9690", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>{item.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e8d5b0", marginTop: 3, fontFamily: "sans-serif" }}>{item.currency} {(item.price || 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - live feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Celebration banner */}
          {showCelebration && lastGift && (
            <div style={{
              background: "linear-gradient(135deg, rgba(232,213,176,0.15), rgba(196,168,112,0.1))",
              border: "1px solid rgba(232,213,176,0.3)",
              borderRadius: 20, padding: "24px 20px",
              textAlign: "center",
              animation: "fadeIn 0.4s ease",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 13, color: "#c4a870", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>NEW GIFT!</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#e8d5b0", marginBottom: 6 }}>{lastGift.gifterName}</div>
              <div style={{ fontSize: 13, color: "#9a9690", fontFamily: "sans-serif" }}>just gifted</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f0ede8", marginTop: 6 }}>{lastGift.item?.title || "a gift"}</div>
              {lastGift.message && <div style={{ fontSize: 13, color: "#9a9690", marginTop: 10, fontStyle: "italic" }}>"{lastGift.message}"</div>}
              <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
            </div>
          )}

          {/* Gifter wall */}
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 13, color: "#5a5650", letterSpacing: "0.08em", marginBottom: 14, fontFamily: "sans-serif" }}>GIFTERS ({contributions.length})</div>
            {contributions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#3a3a3a", fontSize: 13, fontFamily: "sans-serif" }}>Waiting for first gift...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {contributions.map((c, i) => (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: i === 0 ? "rgba(232,213,176,0.06)" : "#111",
                    border: `1px solid ${i === 0 ? "rgba(232,213,176,0.15)" : "#1a1a1a"}`,
                    borderRadius: 10,
                    animation: i === 0 ? "fadeIn 0.5s ease" : "none",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#e8d5b0", flexShrink: 0 }}>
                      {(c.gifterName || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0ede8", fontFamily: "sans-serif" }}>{c.gifterName}</div>
                      <div style={{ fontSize: 11, color: "#5a5650", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.item?.title || "Gift"} · {c.status === "purchased" ? "✅" : "🔖"}
                      </div>
                    </div>
                    {c.amount && <div style={{ fontSize: 12, fontWeight: 700, color: "#c4a870", fontFamily: "sans-serif", flexShrink: 0 }}>{c.amount.toFixed(0)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registry details */}
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{occasionEmoji}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f0ede8", marginBottom: 4 }}>{registry.ownerName}</div>
              {registry.eventDate && (
                <div style={{ fontSize: 12, color: "#c4a870", fontFamily: "sans-serif" }}>
                  {new Date(registry.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
              {registry.description && (
                <p style={{ fontSize: 12, color: "#5a5650", marginTop: 10, lineHeight: 1.6, fontFamily: "sans-serif", fontStyle: "italic" }}>{registry.description}</p>
              )}
            </div>
          </div>

          {/* QR/share hint */}
          <div style={{ background: "rgba(232,213,176,0.04)", border: "1px solid rgba(232,213,176,0.1)", borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#c4a870", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>GIFT FROM YOUR PHONE</div>
            <div style={{ fontSize: 12, color: "#5a5650", fontFamily: "monospace", wordBreak: "break-all" }}>
              {typeof window !== "undefined" ? window.location.origin : ""}/registry/{registry.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      {ticker.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.9)", borderTop: "1px solid #1a1a1a", padding: "10px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 48, animation: "ticker 20s linear infinite", whiteSpace: "nowrap", fontSize: 13, color: "#9a9690", fontFamily: "sans-serif" }}>
            {[...ticker, ...ticker].map((t, i) => <span key={i}>{t}</span>)}
          </div>
          <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>
      )}
    </div>
  );
}
