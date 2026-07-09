"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const OCCASION_EMOJIS = { "Wedding":"💍","Birthday":"🎂","Baby Shower":"👶","Christmas":"🎄","Graduation":"🎓","Housewarming":"🏠","Anniversary":"💝" };
const OCCASION_COLORS = { "Wedding":"#d4af37","Birthday":"#e8334a","Baby Shower":"#7eb8f7","Graduation":"#4ade80","Housewarming":"#ea7c2b","Anniversary":"#a78bfa","Christmas":"#e8334a" };

// ── Confetti ────────────────────────────────────────────────────────────────
function useConfetti(canvasRef) {
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  return useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#e8b84b","#c9962a","#5dd68c","#60a5fa","#f87171","#a78bfa","#ffffff","#f5f0e8"];
    for (let i = 0; i < 160; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width, y: -10 - Math.random() * 120,
        w: Math.random() * 12 + 4, h: Math.random() * 7 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6, vy: Math.random() * 5 + 3,
        rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 7, opacity: 1,
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.05);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.opacity -= 0.011; p.rot += p.rotV;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
      });
      if (particlesRef.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  }, []);
}

// ── Design tokens (dark screen optimised) ───────────────────────────────────
const D = {
  // Backgrounds
  bg:       "#0a0806",
  card:     "#131210",
  card2:    "#1a1714",
  cardBdr:  "rgba(255,255,255,0.08)",

  // Text — all high contrast on dark
  white:    "#ffffff",
  light:    "#f0ece6",       // primary text
  muted:    "#b8b2aa",       // secondary text — clearly readable
  subtle:   "#7a746c",       // tertiary — labels only

  // Brand accents
  gold:     "#e8b84b",       // bright gold — very visible
  goldDk:   "#c9962a",
  maroon:   "#e05575",       // lightened maroon for dark bg
  green:    "#5dd68c",       // bright green
  blue:     "#60a5fa",       // bright blue
  yellow:   "#fbbf24",       // bright yellow
  purple:   "#a78bfa",       // bright purple
};

export default function LiveDashboard({ slug }) {
  const canvasRef = useRef(null);
  const burst = useConfetti(canvasRef);
  const prevContribsRef = useRef([]);

  const [registry, setRegistry] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [lastGift, setLastGift] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
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
        cache: "no-store", headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Error ${res.status}`);
        setConnected(false);
        return;
      }
      const data = await res.json();
      setConnected(true);
      setError("");
      setPollCount(n => n + 1);
      setRegistry(prev => {
        const prevC = prevContribsRef.current;
        const newC = (data.contributions || []).filter(c => !prevC.find(p => p.id === c.id));
        if (newC.length > 0 && prevC.length > 0) {
          newC.forEach(c => {
            setLastGift(c);
            setShowCelebration(true);
            burst();
            setTimeout(() => setShowCelebration(false), 6000);
          });
        }
        prevContribsRef.current = data.contributions || [];
        return data;
      });
    } catch {
      setConnected(false);
    }
  }, [slug, burst]);

  useEffect(() => {
    if (!slug) { setError("No registry slug in URL"); return; }
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [poll, slug]);

  // ── Loading / error states ──────────────────────────────────────────────
  if (!slug) return (
    <div style={{ minHeight:"100vh", background:D.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", padding:40 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <p style={{ color:"#f87171", fontSize:18, marginBottom:8 }}>No registry slug in URL.</p>
        <p style={{ color:D.muted, fontSize:14 }}>URL should be: /registry/live/your-registry-slug</p>
      </div>
    </div>
  );

  if (error && !registry) return (
    <div style={{ minHeight:"100vh", background:D.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", padding:40, maxWidth:420 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>😕</div>
        <p style={{ color:"#f87171", fontSize:18, marginBottom:8 }}>{error}</p>
        <p style={{ color:D.muted, fontSize:14, marginBottom:24 }}>Slug: <code style={{ color:D.gold }}>{slug}</code></p>
        <button onClick={poll} style={{ padding:"12px 28px", background:D.gold, color:"#000", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:15 }}>
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!registry) return (
    <div style={{ minHeight:"100vh", background:D.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <div style={{ width:48, height:48, border:`3px solid ${D.card2}`, borderTop:`3px solid ${D.gold}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <div style={{ color:D.muted, fontSize:16 }}>Connecting to live feed...</div>
      <div style={{ color:D.subtle, fontSize:13 }}>{slug}</div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  // ── Derived data ────────────────────────────────────────────────────────
  const items = registry.items || [];
  const contributions = registry.contributions || [];
  const purchased = items.filter(i => i.status === "purchased").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  const available = items.filter(i => i.status === "available").length;
  const total = items.length;
  const pct = total > 0 ? Math.round(((purchased + claimed) / total) * 100) : 0;
  const totalValue = items.reduce((s, i) => s + (i.price || 0), 0);
  const giftedValue = contributions.reduce((s, c) => s + (c.payment?.totalAmount || c.contributionAmount || c.amount || 0), 0);
  const currency = items[0]?.currency || "USD";
  const occasionEmoji = OCCASION_EMOJIS[registry.occasion] || "🎁";
  const occasionColor = OCCASION_COLORS[registry.occasion] || D.gold;

  const gifterMap = {};
  contributions.forEach(c => {
    const k = c.gifterEmail || c.gifterName;
    const amt = c.payment?.totalAmount || c.contributionAmount || c.amount || 0;
    if (!gifterMap[k]) gifterMap[k] = { name: c.gifterName, total: 0, count: 0 };
    gifterMap[k].total += amt;
    gifterMap[k].count++;
  });
  const topGifters = Object.values(gifterMap).sort((a, b) => b.total - a.total).slice(0, 5);

  // ── Shared card style ───────────────────────────────────────────────────
  const card = (borderColor = D.cardBdr) => ({
    background: D.card,
    border: `1px solid ${borderColor}`,
    borderRadius: 16,
    padding: "20px 22px",
  });

  return (
    <div style={{ minHeight:"100vh", background:D.bg, color:D.light, fontFamily:"Georgia,serif", overflow:"hidden", position:"relative", paddingBottom:52 }}>
      <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:200 }} />

      {/* Ambient glow */}
      <div style={{ position:"fixed", inset:0, background:`radial-gradient(ellipse at 30% 20%, ${occasionColor}0a 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(201,150,42,0.05) 0%, transparent 55%)`, pointerEvents:"none" }} />

      {/* ── Top bar ── */}
      <div style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 28px", borderBottom:`1px solid ${D.cardBdr}`, background:"rgba(10,8,6,0.92)", backdropFilter:"blur(16px)" }}>

        {/* Live indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, background: connected ? "rgba(93,214,140,0.12)" : "rgba(251,191,36,0.12)", border:`1px solid ${connected ? "rgba(93,214,140,0.3)" : "rgba(251,191,36,0.3)"}`, borderRadius:100, padding:"5px 12px 5px 8px" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: connected ? D.green : D.yellow, animation: connected ? "pulse 2s infinite" : "none", boxShadow: connected ? `0 0 8px ${D.green}` : "none" }} />
            <span style={{ fontSize:11, fontWeight:800, color: connected ? D.green : D.yellow, letterSpacing:"0.1em" }}>
              {connected ? "LIVE" : "RECONNECTING"}
            </span>
          </div>
          <span style={{ fontSize:12, color:D.subtle, fontFamily:"sans-serif" }}>{pollCount} updates</span>
          {error && <span style={{ fontSize:11, color:"#f87171", fontFamily:"sans-serif" }}>⚠ {error}</span>}
        </div>

        {/* Title */}
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:D.subtle, fontFamily:"sans-serif", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:3 }}>
            {registry.occasion} Registry
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:D.white, letterSpacing:"-0.01em" }}>{registry.title}</div>
        </div>

        {/* Clock */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:26, fontWeight:700, color:D.white, fontFamily:"sans-serif", letterSpacing:"0.02em" }}>
            {clock.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
          </div>
          <div style={{ fontSize:11, color:D.muted, fontFamily:"sans-serif", marginTop:2 }}>
            {clock.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ padding:"24px 28px", display:"grid", gridTemplateColumns:"1fr 360px", gap:20, maxWidth:1440, margin:"0 auto" }}>

        {/* LEFT column */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Total Gifts",  value:total,     icon:"🎁", color:D.white,  bg:"rgba(255,255,255,0.06)" },
              { label:"Purchased",    value:purchased,  icon:"✅", color:D.green,  bg:"rgba(93,214,140,0.08)"  },
              { label:"Claimed",      value:claimed,    icon:"🔖", color:D.yellow, bg:"rgba(251,191,36,0.08)"  },
              { label:"Available",    value:available,  icon:"💝", color:D.muted,  bg:"rgba(255,255,255,0.04)" },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} style={{ background:bg, border:`1px solid ${D.cardBdr}`, borderRadius:16, padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
                <div style={{ fontSize:40, fontWeight:900, color, lineHeight:1, marginBottom:6, fontFamily:"Georgia,serif" }}>{value}</div>
                <div style={{ fontSize:11, color:D.muted, fontFamily:"sans-serif", letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={card()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:15, color:D.muted, fontFamily:"sans-serif" }}>Registry progress</span>
              <span style={{ fontSize:32, fontWeight:900, color:D.gold, fontFamily:"Georgia,serif" }}>{pct}%</span>
            </div>
            <div style={{ height:16, background:D.card2, borderRadius:8, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${D.green},${D.gold})`, borderRadius:8, transition:"width 1.2s ease" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:13, color:D.muted, fontFamily:"sans-serif" }}>
              <span style={{ color:D.light }}>{purchased + claimed} of {total} gifts taken</span>
              <span>{available} still available</span>
            </div>
          </div>

          {/* Value summary */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{ background:D.card, border:`1px solid rgba(232,184,75,0.2)`, borderRadius:16, padding:"20px 22px" }}>
              <div style={{ fontSize:11, color:D.gold, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:10 }}>Total Registry Value</div>
              <div style={{ fontSize:30, fontWeight:800, color:D.white, fontFamily:"Georgia,serif" }}>{currency} {totalValue.toLocaleString("en",{ minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
            </div>
            <div style={{ background:D.card, border:`1px solid rgba(93,214,140,0.2)`, borderRadius:16, padding:"20px 22px" }}>
              <div style={{ fontSize:11, color:D.green, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:10 }}>Gifts Contributed</div>
              <div style={{ fontSize:30, fontWeight:800, color:D.green, fontFamily:"Georgia,serif" }}>{currency} {giftedValue.toLocaleString("en",{ minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
            </div>
          </div>

          {/* Gift grid */}
          <div style={card()}>
            <div style={{ fontSize:11, color:D.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:16 }}>Gift List</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  background: item.status==="purchased" ? "rgba(93,214,140,0.1)" : item.status==="claimed" ? "rgba(251,191,36,0.08)" : D.card2,
                  border:`1px solid ${item.status==="purchased" ? "rgba(93,214,140,0.25)" : item.status==="claimed" ? "rgba(251,191,36,0.2)" : D.cardBdr}`,
                  borderRadius:12, overflow:"hidden", transition:"all 0.6s ease",
                }}>
                  {item.imageUrl && (
                    <div style={{ aspectRatio:"1", position:"relative", overflow:"hidden" }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover", filter:item.status!=="available" ? "brightness(0.55)" : "none" }} />
                      {item.status==="purchased" && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>✅</div>}
                      {item.status==="claimed" && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🔖</div>}
                    </div>
                  )}
                  {!item.imageUrl && (
                    <div style={{ aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, background:D.card2 }}>🎁</div>
                  )}
                  <div style={{ padding:"8px 10px" }}>
                    <div style={{ fontSize:11, color:D.muted, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"sans-serif" }}>{item.title}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:D.gold, marginTop:3, fontFamily:"sans-serif" }}>{item.currency} {(item.price||0).toFixed(0)}</div>
                    {item.groupBuy && item.targetAmount > 0 && (
                      <div style={{ marginTop:5 }}>
                        <div style={{ height:3, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min(100,((item.collectedAmount||0)/item.targetAmount)*100)}%`, background:D.gold, borderRadius:2 }} />
                        </div>
                        <div style={{ fontSize:9, color:D.gold, marginTop:2, fontFamily:"sans-serif" }}>{Math.round(((item.collectedAmount||0)/item.targetAmount)*100)}% funded</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Celebration banner */}
          {showCelebration && lastGift && (
            <div style={{ background:`linear-gradient(135deg, rgba(232,184,75,0.18), rgba(201,150,42,0.1))`, border:`1px solid rgba(232,184,75,0.35)`, borderRadius:20, padding:"24px 20px", textAlign:"center", animation:"popIn 0.4s ease" }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:11, color:D.gold, letterSpacing:"0.14em", fontFamily:"sans-serif", fontWeight:800, marginBottom:8 }}>NEW GIFT!</div>
              <div style={{ fontSize:26, fontWeight:900, color:D.white, marginBottom:4, fontFamily:"Georgia,serif" }}>{lastGift.gifterName}</div>
              <div style={{ fontSize:14, color:D.muted, fontFamily:"sans-serif", marginBottom:6 }}>gifted</div>
              <div style={{ fontSize:17, fontWeight:700, color:D.light, lineHeight:1.35 }}>{lastGift.item?.title || "a gift"}</div>
              {(lastGift.payment?.totalAmount || lastGift.contributionAmount || lastGift.amount) > 0 && (
                <div style={{ fontSize:26, fontWeight:900, color:D.green, marginTop:12, fontFamily:"Georgia,serif" }}>
                  {currency} {(lastGift.payment?.totalAmount || lastGift.contributionAmount || lastGift.amount || 0).toFixed(2)}
                </div>
              )}
              {lastGift.message && (
                <div style={{ fontSize:13, color:D.muted, marginTop:12, fontStyle:"italic", lineHeight:1.6, padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:10 }}>
                  "{lastGift.message}"
                </div>
              )}
            </div>
          )}

          {/* 🏆 Top Gifters */}
          {topGifters.length > 0 && (
            <div style={{ background:D.card, border:`1px solid rgba(232,184,75,0.2)`, borderRadius:16, padding:"18px 20px" }}>
              <div style={{ fontSize:13, color:D.gold, fontWeight:800, letterSpacing:"0.08em", marginBottom:16, fontFamily:"sans-serif", display:"flex", alignItems:"center", gap:8 }}>
                🏆 <span>TOP GIFTERS</span>
              </div>
              {topGifters.map((g, i) => (
                <div key={g.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i < topGifters.length-1 ? `1px solid ${D.cardBdr}` : "none" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
                    background: i===0 ? "rgba(232,184,75,0.2)" : i===1 ? "rgba(192,192,192,0.12)" : i===2 ? "rgba(180,120,60,0.12)" : "rgba(255,255,255,0.06)",
                  }}>
                    {i===0 ? "🥇" : i===1 ? "🥈" : i===2 ? "🥉" : <span style={{ fontFamily:"sans-serif", fontSize:13, fontWeight:700, color:D.muted }}>{i+1}</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:700, color: i===0 ? D.gold : D.light, fontFamily:"sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</div>
                    <div style={{ fontSize:11, color:D.muted, fontFamily:"sans-serif" }}>{g.count} gift{g.count!==1?"s":""}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:800, color: i===0 ? D.gold : D.muted, fontFamily:"Georgia,serif", flexShrink:0 }}>
                    {g.total > 0 ? `${currency} ${g.total.toFixed(0)}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live gift feed */}
          <div style={{ background:D.card, border:`1px solid ${D.cardBdr}`, borderRadius:16, padding:"18px 20px" }}>
            <div style={{ fontSize:12, color:D.muted, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:14 }}>
              Gift Feed · {contributions.length} total
            </div>
            {contributions.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:D.subtle, fontSize:14, fontFamily:"sans-serif" }}>Waiting for first gift... 🎁</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:280, overflowY:"auto" }}>
                {contributions.slice(0,20).map((c, i) => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: i===0 ? "rgba(232,184,75,0.08)" : D.card2, border:`1px solid ${i===0 ? "rgba(232,184,75,0.2)" : D.cardBdr}`, borderRadius:10, animation: i===0 ? "slideIn 0.4s ease" : "none" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background: i===0 ? "rgba(232,184,75,0.2)" : "rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color: i===0 ? D.gold : D.muted, flexShrink:0, fontFamily:"Georgia,serif" }}>
                      {(c.gifterName||"?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:D.white, fontFamily:"sans-serif" }}>{c.gifterName}</div>
                      <div style={{ fontSize:11, color:D.muted, fontFamily:"sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {c.item?.title || "Gift"} · {c.status==="purchased" ? "✅ Purchased" : "🔖 Claimed"}
                      </div>
                    </div>
                    {(c.payment?.totalAmount || c.contributionAmount || c.amount) > 0 && (
                      <div style={{ fontSize:13, fontWeight:800, color:D.gold, fontFamily:"Georgia,serif", flexShrink:0 }}>
                        {currency} {(c.payment?.totalAmount || c.contributionAmount || c.amount || 0).toFixed(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registry info card */}
          <div style={{ background:D.card, border:`1px solid ${D.cardBdr}`, borderRadius:16, padding:"20px", textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:10 }}>{occasionEmoji}</div>
            <div style={{ fontSize:18, fontWeight:800, color:D.white, fontFamily:"Georgia,serif", marginBottom:4 }}>{registry.ownerName}</div>
            {registry.eventDate && (
              <div style={{ fontSize:13, color:occasionColor, fontFamily:"sans-serif", fontWeight:600 }}>
                {new Date(registry.eventDate).toLocaleDateString("en-US",{ month:"long", day:"numeric", year:"numeric" })}
              </div>
            )}
            {registry.description && (
              <p style={{ fontSize:12, color:D.muted, marginTop:10, lineHeight:1.65, fontFamily:"sans-serif", fontStyle:"italic" }}>{registry.description}</p>
            )}
            <div style={{ fontSize:11, color:D.subtle, marginTop:14, fontFamily:"monospace", wordBreak:"break-all", padding:"8px 12px", background:D.card2, borderRadius:8 }}>
              {typeof window!=="undefined" ? window.location.origin : ""}/registry/{registry.slug}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom ticker ── */}
      {contributions.length > 0 && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(10,8,6,0.96)", borderTop:`1px solid ${D.cardBdr}`, padding:"10px 0", overflow:"hidden", zIndex:50 }}>
          <div style={{ display:"inline-flex", gap:56, animation:"ticker 28s linear infinite", whiteSpace:"nowrap", fontSize:13, fontFamily:"sans-serif" }}>
            {[...contributions.slice(0,10), ...contributions.slice(0,10)].map((c, i) => (
              <span key={i} style={{ color: i%2===0 ? D.gold : D.muted }}>
                🎁 <strong style={{ color:D.white }}>{c.gifterName}</strong> gifted "{c.item?.title || "a gift"}"
                {(c.payment?.totalAmount || c.contributionAmount || c.amount) > 0
                  ? <span style={{ color:D.green }}> · {currency} {(c.payment?.totalAmount || c.contributionAmount || c.amount||0).toFixed(0)}</span>
                  : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn  { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes slideIn{ from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
