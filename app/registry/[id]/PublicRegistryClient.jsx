"use client";
import { useState } from "react";
import Link from "next/link";

const OCC_EMOJI = { Wedding:"💍", Birthday:"🎂", "Baby Shower":"👶", Christmas:"🎄", Graduation:"🎓", Housewarming:"🏠", Anniversary:"💝" };
const OCC_GRAD  = {
  Wedding:      "linear-gradient(135deg,#c9a227,#7b6200)",
  Birthday:     "linear-gradient(135deg,#e8334a,#9e1c2e)",
  "Baby Shower":"linear-gradient(135deg,#4aa3e8,#1a5a9a)",
  Graduation:   "linear-gradient(135deg,#2e9e5e,#135e32)",
  Housewarming: "linear-gradient(135deg,#e87c2b,#8b3e00)",
  Anniversary:  "linear-gradient(135deg,#9b59b6,#5b1e8c)",
  Christmas:    "linear-gradient(135deg,#c0392b,#1e7a3c)",
};
const OCC_ACCENT = {
  Wedding:"#c9a227", Birthday:"#e8334a", "Baby Shower":"#4aa3e8",
  Graduation:"#2e9e5e", Housewarming:"#e87c2b", Anniversary:"#9b59b6", Christmas:"#c0392b",
};
const PRI_COLOR = { high:"#c0392b", medium:"#b7680f", low:"#1e9e5e" };
const PRI_LABEL = { high:"Must have", medium:"Would love", low:"Nice to have" };

function GroupBuyBar({ item, accent }) {
  const target = item.targetAmount || item.price;
  const collected = item.collectedAmount || 0;
  const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const remaining = Math.max(0, target - collected);
  return (
    <div style={{ background:"rgba(0,0,0,0.04)", border:`1px solid ${accent}30`, borderRadius:10, padding:"10px 12px", marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:700, marginBottom:5 }}>
        <span style={{ color: accent }}>👥 Group gift · {pct}%</span>
        <span style={{ color:"var(--text2)" }}>{item.currency} {collected.toFixed(0)} / {target.toFixed(0)}</span>
      </div>
      <div style={{ height:5, background:"rgba(0,0,0,0.08)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:accent, borderRadius:3, transition:"width 0.5s" }} />
      </div>
      {remaining > 0 && <p style={{ fontSize:11, color:"var(--gray)", marginTop:4, fontWeight:600 }}>Needs {item.currency} {remaining.toFixed(2)} more</p>}
    </div>
  );
}

export default function PublicRegistryClient({ registry }) {
  const [claimModal, setClaimModal]   = useState(null);
  const [form, setForm]               = useState({ gifterName:"", gifterEmail:"", message:"", contributionAmount:"" });
  const [claiming, setClaiming]       = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [filter, setFilter]           = useState("all");

  const expired    = registry.expired;
  const items      = registry.items || [];
  const contribs   = registry.contributions || [];
  const purchased  = items.filter(i => i.status === "purchased").length;
  const claimed    = items.filter(i => i.status === "claimed").length;
  const available  = items.filter(i => i.status === "available").length;
  const progress   = items.length > 0 ? Math.round(((purchased + claimed) / items.length) * 100) : 0;
  const currency   = items[0]?.currency || "USD";
  const gradient   = OCC_GRAD[registry.occasion]   || "linear-gradient(135deg,#c9962a,#7b1c2e)";
  const accent     = OCC_ACCENT[registry.occasion] || "#c9962a";
  const emoji      = OCC_EMOJI[registry.occasion]  || "🎁";
  const daysUntil  = registry.eventDate && !expired
    ? Math.ceil((new Date(registry.eventDate) - Date.now()) / 86400000) : null;

  // Top gifters
  const gifterMap = {};
  contribs.forEach(c => {
    const k   = c.gifterEmail || c.gifterName;
    const amt = c.payment?.totalAmount || c.contributionAmount || c.amount || 0;
    if (!gifterMap[k]) gifterMap[k] = { name:c.gifterName, total:0, count:0 };
    gifterMap[k].total += amt;
    gifterMap[k].count++;
  });
  const topGifters  = Object.values(gifterMap).sort((a,b) => b.total - a.total).slice(0,3);
  const filteredItems = items.filter(i =>
    filter === "available" ? i.status === "available" :
    filter === "claimed"   ? i.status !== "available" : true
  );

  const openClaim = (item) => {
    setClaimModal(item);
    setClaimResult(null);
    setForm({ gifterName:"", gifterEmail:"", message:"", contributionAmount:"" });
  };

  const handleClaim = async () => {
    if (!form.gifterName || !form.gifterEmail) return;
    if (claimModal?.groupBuy && !form.contributionAmount) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/registry/claim", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          itemId: claimModal.id,
          gifterName: form.gifterName,
          gifterEmail: form.gifterEmail,
          message: form.message,
          contributionAmount: claimModal.groupBuy ? parseFloat(form.contributionAmount) : undefined,
        }),
      });
      const data = await res.json();
      setClaimResult(res.ok ? data : { error: data.error });
    } catch { setClaimResult({ error:"Network error. Please try again." }); }
    setClaiming(false);
  };

  const inp = { padding:"11px 14px", border:"1.5px solid var(--border2)", borderRadius:"var(--r-md)", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", background:"var(--white)", color:"var(--black)", fontWeight:500 };
  const lbl = { display:"block", fontSize:11, fontWeight:700, color:"var(--text)", marginBottom:5, letterSpacing:"0.05em", textTransform:"uppercase" };

  return (
    <div>
      <style>{`
        .reg-hero        { background:${gradient}; padding:48px 24px 52px; text-align:center; position:relative; overflow:hidden; }
        .reg-hero-dot    { position:absolute; inset:0; opacity:0.05; background-image:radial-gradient(circle at 1px 1px,#fff 1px,transparent 0); background-size:24px 24px; pointer-events:none; }
        .reg-stats       { display:grid; grid-template-columns:repeat(4,1fr); gap:0; background:#0f0d0b; border-radius:var(--r-lg); margin:0 24px; position:relative; z-index:2; box-shadow:0 8px 32px rgba(0,0,0,0.25); }
        .reg-stat        { padding:18px 12px; text-align:center; border-right:1px solid rgba(255,255,255,0.07); }
        .reg-stat:last-child { border-right:none; }
        .reg-body        { max-width:1100px; margin:0 auto; padding:24px 24px 60px; }
        .reg-gifters-row { display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; }
        .reg-gifter-chip { display:flex; align-items:center; gap:0; background:var(--white); border:1px solid var(--border2); border-radius:var(--r-lg); overflow:hidden; box-shadow:var(--shadow-xs); flex-shrink:0; }
        .reg-items       { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }

        @media(max-width:768px){
          .reg-hero   { padding:36px 16px 40px; }
          .reg-stats  { margin:0 16px; grid-template-columns:repeat(2,1fr); }
          .reg-stat   { border-right:1px solid rgba(255,255,255,0.07); border-bottom:1px solid rgba(255,255,255,0.07); }
          .reg-stat:nth-child(2) { border-right:none; }
          .reg-stat:nth-child(3) { border-bottom:none; }
          .reg-stat:last-child   { border-right:none; border-bottom:none; }
          .reg-body   { padding:16px 16px 48px; }
          .reg-items  { grid-template-columns:1fr 1fr; gap:10px; }
        }
        @media(max-width:400px){
          .reg-items  { grid-template-columns:1fr; }
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="reg-hero">
        <div className="reg-hero-dot" />
        {expired && (
          <div style={{ display:"inline-block", padding:"5px 14px", background:"rgba(0,0,0,0.4)", borderRadius:100, fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.8)", letterSpacing:"0.08em", marginBottom:14 }}>
            ⚠️ THIS REGISTRY HAS EXPIRED
          </div>
        )}
        <div style={{ fontSize:56, marginBottom:10, filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }}>{emoji}</div>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.16em", color:"rgba(255,255,255,0.75)", textTransform:"uppercase", marginBottom:10 }}>{registry.occasion} Registry</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(26px,5vw,52px)", fontWeight:900, color:"#fff", lineHeight:1.08, marginBottom:10, letterSpacing:"-0.02em" }}>
          {registry.title}
        </h1>
        <p style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,0.85)", marginBottom:6 }}>
          by <strong style={{ color:"#fff" }}>{registry.ownerName}</strong>
        </p>
        {registry.eventDate && (
          <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.75)", marginBottom: daysUntil >= 0 ? 10 : 0 }}>
            📅 {new Date(registry.eventDate).toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric", year:"numeric" })}
          </p>
        )}
        {daysUntil !== null && daysUntil >= 0 && (
          <div style={{ display:"inline-block", padding:"7px 20px", background:"rgba(255,255,255,0.18)", borderRadius:100, fontSize:14, fontWeight:800, color:"#fff", marginTop:2, backdropFilter:"blur(8px)" }}>
            {daysUntil === 0 ? "🎉 Today is the day!" : `🗓 ${daysUntil} day${daysUntil!==1?"s":""} to go`}
          </div>
        )}
        {registry.description && (
          <p style={{ fontSize:14, fontWeight:500, color:"rgba(255,255,255,0.82)", maxWidth:520, margin:"16px auto 0", lineHeight:1.75 }}>
            {registry.description}
          </p>
        )}
      </div>

      {/* ── STATS BAR ── */}
      <div className="reg-stats">
        {[
          { label:"Total",     value:items.length, color:"#f5f0e8" },
          { label:"Available", value:available,    color:"#5dd68c" },
          { label:"Claimed",   value:claimed,      color:"#e8b84b" },
          { label:"Purchased", value:purchased,    color:"#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} className="reg-stat">
            <div style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:900, color, lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"#6b6560", marginTop:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
          </div>
        ))}
      </div>
      {/* Progress under stats */}
      <div style={{ background:"#0f0d0b", margin:"0 24px", borderRadius:"0 0 var(--r-lg) var(--r-lg)", padding:"12px 20px 16px", boxShadow:"0 8px 32px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:700, color:"#6b6560", marginBottom:6 }}>
          <span>{purchased+claimed} of {items.length} gifts taken</span>
          <span style={{ color:accent }}>{progress}%</span>
        </div>
        <div style={{ height:5, background:"#1e1b18", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${accent},var(--maroon))`, borderRadius:3, transition:"width 0.5s" }} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="reg-body">

        {/* Top gifters */}
        {topGifters.length > 0 && topGifters.some(g => g.total > 0) && (
          <div style={{ background:"var(--gold-bg)", border:`1px solid ${accent}30`, borderRadius:"var(--r-lg)", padding:"14px 18px", marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--gold-dk)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>🏆 Top Gifters</div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {topGifters.map((g, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>{i===0?"🥇":i===1?"🥈":"🥉"}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--black)" }}>{g.name}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--gold-dk)" }}>{g.count} gift{g.count!==1?"s":""}{g.total>0?` · ${currency} ${g.total.toFixed(0)}`:""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent gifters — NOW shows item gifted */}
        {contribs.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--gray)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
              Recent Gifters
            </div>
            <div className="reg-gifters-row">
              {contribs.slice(0, 10).map((c, i) => (
                <div key={i} className="reg-gifter-chip">
                  {/* Avatar */}
                  <div style={{ width:42, height:42, background:"var(--maroon)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:900, fontSize:16, color:"#fff", flexShrink:0 }}>
                    {(c.gifterName||"?")[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ padding:"8px 12px", minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"var(--black)", whiteSpace:"nowrap" }}>{c.gifterName}</div>
                    {/* Item they gifted */}
                    {c.item?.title && (
                      <div style={{ fontSize:11, fontWeight:600, color:"var(--maroon)", whiteSpace:"nowrap", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", marginTop:1 }}>
                        🎁 {c.item.title}
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                      {c.status === "purchased"
                        ? <span style={{ fontSize:10, fontWeight:700, color:"var(--green)", background:"var(--green-bg)", padding:"1px 7px", borderRadius:100 }}>✅ Purchased</span>
                        : <span style={{ fontSize:10, fontWeight:700, color:"var(--yellow)", background:"var(--yellow-bg)", padding:"1px 7px", borderRadius:100 }}>🔖 Claimed</span>
                      }
                      {(c.payment?.totalAmount || c.contributionAmount || c.amount || 0) > 0 && (
                        <span style={{ fontSize:10, fontWeight:700, color:"var(--gold-dk)" }}>
                          {currency} {(c.payment?.totalAmount || c.contributionAmount || c.amount || 0).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter + heading */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(20px,3vw,26px)", fontWeight:800 }}>
            Gift List
            <span style={{ fontWeight:500, fontStyle:"italic", color:"var(--gray)", fontSize:"0.75em", marginLeft:8 }}>({items.length})</span>
          </h2>
          <div style={{ display:"flex", gap:6 }}>
            {[["all","All"],["available",`Available (${available})`],["claimed",`Taken (${claimed+purchased})`]].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding:"7px 14px", borderRadius:"var(--r-full)", cursor:"pointer",
                fontSize:12, fontFamily:"inherit", fontWeight: filter===k ? 800 : 600,
                border:`1.5px solid ${filter===k ? "var(--maroon)" : "var(--border2)"}`,
                background: filter===k ? "var(--maroon)" : "var(--white)",
                color: filter===k ? "#fff" : "var(--text2)",
                transition:"all 0.15s",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Gift grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign:"center", padding:"52px 0", color:"var(--gray)" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>🎁</div>
            <p style={{ fontSize:15, fontWeight:600 }}>No items in this filter</p>
          </div>
        ) : (
          <div className="reg-items">
            {filteredItems.map(item => {
              const isAvailable = item.status === "available" || (item.groupBuy && item.status !== "purchased");
              const isPurchased = item.status === "purchased";
              const isClaimed   = item.status === "claimed" && !item.groupBuy;
              return (
                <div key={item.id} style={{
                  background:"#0f0d0b", borderRadius:"var(--r-lg)", overflow:"hidden",
                  opacity: isPurchased ? 0.8 : 1,
                  display:"flex", flexDirection:"column",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.12)",
                }}>
                  {/* Accent strip */}
                  <div style={{ height:3, background: isPurchased ? "#1e9e5e" : isClaimed ? "#b7680f" : item.groupBuy ? `linear-gradient(90deg,${accent},#e8b84b)` : `linear-gradient(90deg,${accent},var(--maroon))` }} />

                  {/* Image */}
                  <div style={{ position:"relative", aspectRatio:"4/3", background:"#1a1614", overflow:"hidden" }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover", filter:isPurchased?"brightness(0.5)":"none" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, opacity:0.35 }}>🎁</div>
                    }
                    {/* Status overlay */}
                    {isPurchased && (
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ padding:"7px 18px", background:"#1e9e5e", color:"#fff", borderRadius:100, fontSize:13, fontWeight:800 }}>✅ Gifted!</div>
                      </div>
                    )}
                    {isClaimed && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ padding:"7px 18px", background:"#b7680f", color:"#fff", borderRadius:100, fontSize:13, fontWeight:800 }}>🔖 Claimed</div>
                      </div>
                    )}
                    {/* Priority badge */}
                    <div style={{ position:"absolute", top:8, left:8, padding:"3px 8px", background:"rgba(0,0,0,0.65)", borderRadius:6, fontSize:10, fontWeight:800, color: PRI_COLOR[item.priority] || "#e8b84b" }}>
                      {PRI_LABEL[item.priority] || "Gift"}
                    </div>
                    {/* Group buy badge */}
                    {item.groupBuy && (
                      <div style={{ position:"absolute", top:8, right:8, padding:"3px 8px", background:"rgba(201,150,42,0.9)", borderRadius:6, fontSize:10, fontWeight:800, color:"#fff" }}>
                        👥 GROUP
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding:"12px 14px 14px", flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:"#f5f0e8", lineHeight:1.3 }}>{item.title}</div>
                    {item.note && <p style={{ fontSize:11, fontWeight:500, color:"#7a7268", lineHeight:1.5, fontStyle:"italic" }}>{item.note}</p>}
                    <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:"#e8b84b", marginTop:2 }}>
                      {item.currency} {item.price.toFixed(2)}
                    </div>

                    {item.groupBuy && <GroupBuyBar item={item} accent={accent} />}

                    <div style={{ display:"flex", gap:8, marginTop:"auto", paddingTop:8 }}>
                      {isAvailable && !isPurchased ? (
                        <button onClick={() => openClaim(item)} style={{
                          flex:1, padding:"10px", background:"var(--maroon)", color:"#fff",
                          borderRadius:"var(--r-lg)", border:"none", fontFamily:"var(--font-display)",
                          fontWeight:800, fontSize:13, cursor:"pointer",
                        }}>
                          {item.groupBuy ? "👥 Contribute" : "🎁 Gift this"}
                        </button>
                      ) : (
                        <div style={{ flex:1, padding:"10px", background:"#1e1b18", borderRadius:"var(--r-lg)", textAlign:"center", fontSize:12, fontWeight:700, color:"#5a5650" }}>
                          {isPurchased ? "✅ Gifted" : "🔖 Claimed"}
                        </div>
                      )}
                      <a href={item.productUrl} target="_blank" rel="noopener noreferrer"
                        style={{ padding:"10px 13px", background:"#1e1b18", borderRadius:"var(--r-lg)", color:"#9a9690", fontSize:13, fontWeight:700 }}>
                        ↗
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Thank you message */}
        {registry.thankYouMsg && (
          <div style={{ textAlign:"center", padding:"44px 20px 0", borderTop:"1px solid var(--border)", marginTop:44 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>💌</div>
            <p style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:600, color:"var(--text2)", lineHeight:1.8, fontStyle:"italic", maxWidth:480, margin:"0 auto" }}>
              "{registry.thankYouMsg}"
            </p>
            <p style={{ fontSize:14, fontWeight:700, color:"var(--maroon)", marginTop:10 }}>— {registry.ownerName}</p>
          </div>
        )}
      </div>

      {/* ── CLAIM / CONTRIBUTE MODAL ── */}
      {claimModal && (
        <div onClick={() => setClaimModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0" }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"var(--white)", borderRadius:"var(--r-xl) var(--r-xl) 0 0",
            width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 -8px 48px rgba(0,0,0,0.3)",
            animation:"slideUp 0.28s ease",
          }}>
            <style>{`@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

            {/* Pull handle */}
            <div style={{ padding:"12px 0 4px", display:"flex", justifyContent:"center" }}>
              <div style={{ width:36, height:4, borderRadius:99, background:"var(--border2)" }} />
            </div>

            {/* Item preview */}
            <div style={{ display:"flex", gap:14, alignItems:"center", padding:"12px 20px 16px", borderBottom:"1px solid var(--border)" }}>
              {claimModal.imageUrl && (
                <div style={{ width:60, height:60, borderRadius:"var(--r-md)", overflow:"hidden", flexShrink:0 }}>
                  <img src={claimModal.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:800, color:accent, letterSpacing:"0.1em", marginBottom:3 }}>
                  {claimModal.groupBuy ? "👥 GROUP GIFT CONTRIBUTION" : "🎁 YOU ARE GIFTING"}
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, color:"var(--black)", lineHeight:1.3 }}>{claimModal.title}</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:900, color:"var(--maroon)", marginTop:2 }}>
                  {claimModal.currency} {claimModal.price.toFixed(2)}
                </div>
              </div>
              <button onClick={() => setClaimModal(null)} style={{ color:"var(--gray)", fontSize:20, padding:4, flexShrink:0, background:"none", border:"none", cursor:"pointer" }}>✕</button>
            </div>

            {!claimResult ? (
              <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
                {/* Group buy info */}
                {claimModal.groupBuy && (
                  <>
                    <GroupBuyBar item={claimModal} accent={accent} />
                    <div style={{ padding:"12px 14px", background:accent+"12", border:`1px solid ${accent}30`, borderRadius:"var(--r-md)", fontSize:13, fontWeight:600, color:"var(--text2)", lineHeight:1.6 }}>
                      Multiple people can contribute any amount. The item is marked gifted when the target is reached.
                    </div>
                  </>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={lbl}>Your name *</label>
                    <input value={form.gifterName} onChange={e => setForm(f=>({...f,gifterName:e.target.value}))} placeholder="Jane" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Your email *</label>
                    <input type="email" value={form.gifterEmail} onChange={e => setForm(f=>({...f,gifterEmail:e.target.value}))} placeholder="jane@email.com" style={inp} />
                  </div>
                </div>

                {claimModal.groupBuy && (
                  <div>
                    <label style={lbl}>Your contribution ({claimModal.currency}) *</label>
                    <input type="number" min="1" step="0.01" value={form.contributionAmount} onChange={e => setForm(f=>({...f,contributionAmount:e.target.value}))}
                      placeholder={`e.g. ${Math.round(claimModal.price/4)}`} style={inp} />
                    <p style={{ fontSize:11, fontWeight:600, color:"var(--gray)", marginTop:5 }}>
                      Still needed: {claimModal.currency} {Math.max(0,(claimModal.targetAmount||claimModal.price)-(claimModal.collectedAmount||0)).toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <label style={lbl}>Message (optional)</label>
                  <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))}
                    placeholder={`A warm message for ${registry.ownerName}...`} rows={2}
                    style={{ ...inp, resize:"vertical", lineHeight:1.6 }} />
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={handleClaim}
                    disabled={claiming || !form.gifterName || !form.gifterEmail || (claimModal.groupBuy && !form.contributionAmount)}
                    className="btn-primary"
                    style={{ flex:1, opacity:(claiming||!form.gifterName||!form.gifterEmail)?0.65:1, fontSize:15 }}>
                    {claiming ? "Processing..." : claimModal.groupBuy ? "Contribute →" : "Claim & Gift →"}
                  </button>
                  <button onClick={() => setClaimModal(null)} style={{ padding:"14px 18px", background:"var(--cream)", borderRadius:"var(--r-xl)", color:"var(--text2)", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : claimResult.error ? (
              <div style={{ padding:"32px 20px", textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
                <p style={{ color:"var(--red)", fontWeight:700, fontSize:15, marginBottom:16 }}>{claimResult.error}</p>
                <button onClick={() => setClaimResult(null)} className="btn-outline" style={{ margin:"0 auto", width:"auto", padding:"11px 28px" }}>Try again</button>
              </div>
            ) : (
              <div style={{ padding:"32px 20px", textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🎉</div>
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:900, color:"var(--green)", marginBottom:10 }}>
                  {claimResult.targetMet ? "Gift fully funded! 🎊" : claimResult.groupBuy ? "Contribution received!" : "Gift claimed!"}
                </h3>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--text2)", marginBottom:20, lineHeight:1.7 }}>{claimResult.message}</p>
                {claimResult.groupBuy && !claimResult.targetMet && (
                  <div style={{ padding:"12px 16px", background:"var(--gold-bg)", border:"1px solid rgba(201,150,42,0.25)", borderRadius:"var(--r-md)", marginBottom:20 }}>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:800, color:"var(--gold-dk)", marginBottom:6 }}>
                      {currency} {claimResult.newCollected?.toFixed(2)} raised of {currency} {claimResult.targetAmount?.toFixed(2)}
                    </div>
                    <div style={{ height:5, background:"var(--cream2)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(100,(claimResult.newCollected/claimResult.targetAmount)*100)}%`, background:"var(--gold)", borderRadius:3 }} />
                    </div>
                  </div>
                )}
                {!claimResult.groupBuy && claimResult.contribution?.id && (
                  <Link href={`/pay/${claimResult.contribution.id}`} className="btn-primary" style={{ justifyContent:"center", marginBottom:12 }}>
                    Complete Payment →
                  </Link>
                )}
                <button onClick={() => setClaimModal(null)} style={{ background:"none", border:"none", color:"var(--gray)", cursor:"pointer", fontSize:13, fontWeight:600, padding:"8px 0", display:"block", margin:"8px auto 0" }}>
                  Back to registry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
