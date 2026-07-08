"use client";
import { useState } from "react";
import Link from "next/link";

const PRIORITY_COLORS = { high: "var(--red)", medium: "var(--yellow)", low: "var(--green)" };
const PRIORITY_LABELS = { high: "Must have", medium: "Would love", low: "Nice to have" };

export default function PublicRegistryClient({ registry }) {
  const [claimModal, setClaimModal] = useState(null);
  const [claimForm, setClaimForm] = useState({ gifterName: "", gifterEmail: "", message: "" });
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [filter, setFilter] = useState("all");

  const purchased = registry.items.filter(i => i.status === "purchased").length;
  const claimed = registry.items.filter(i => i.status === "claimed").length;
  const available = registry.items.filter(i => i.status === "available").length;
  const progress = registry.items.length > 0
    ? Math.round(((purchased + claimed) / registry.items.length) * 100)
    : 0;

  const filteredItems = registry.items.filter(i => {
    if (filter === "available") return i.status === "available";
    if (filter === "claimed") return i.status !== "available";
    return true;
  });

  // Top gifters by amount paid
  const gifterMap = {};
  (registry.contributions || []).forEach(c => {
    const key = c.gifterEmail || c.gifterName;
    const amt = c.payment?.totalAmount || c.amount || 0;
    if (!gifterMap[key]) gifterMap[key] = { name: c.gifterName, total: 0, count: 0 };
    gifterMap[key].total += amt;
    gifterMap[key].count += 1;
  });
  const topGifters = Object.values(gifterMap).sort((a, b) => b.total - a.total).slice(0, 3);
  const currency = registry.items?.[0]?.currency || "USD";

  const daysUntil = registry.eventDate
    ? Math.ceil((new Date(registry.eventDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleClaim = async () => {
    if (!claimForm.gifterName || !claimForm.gifterEmail) return;
    setClaiming(true);
    const res = await fetch("/api/registry/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: claimModal.id, ...claimForm }),
    });
    const data = await res.json();
    setClaiming(false);
    if (res.ok) setClaimResult(data);
    else setClaimResult({ error: data.error });
  };

  const inp = { background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: 10, padding: "11px 14px", color: "var(--black)", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #111 0%, #0f0f0f 50%, #111 100%)",
        borderBottom: "1px solid var(--border)",
        padding: "56px 24px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(232,213,176,0.03) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(232,213,176,0.02) 0%, transparent 60%)" }} />

        <div style={{ fontSize: 52, marginBottom: 16 }}>
          {{ "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" }[registry.occasion] || "🎁"}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--gold-dk)", marginBottom: 10, textTransform: "uppercase" }}>
          {registry.occasion} Registry
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "var(--black)", lineHeight: 1.1, marginBottom: 12 }}>
          {registry.title}
        </h1>
        <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 8 }}>Created by {registry.ownerName}</p>
        {registry.eventDate && (
          <div style={{ fontSize: 13, color: daysUntil > 0 ? "var(--gold-dk)" : "var(--gray)" }}>
            📅 {new Date(registry.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {daysUntil > 0 && <span style={{ marginLeft: 8, color: "var(--gold-dk)" }}>— {daysUntil} days away</span>}
          </div>
        )}
        {registry.description && (
          <p style={{ fontSize: 14, color: "var(--text2)", maxWidth: 520, margin: "16px auto 0", lineHeight: 1.7 }}>{registry.description}</p>
        )}

        {/* Progress bar */}
        {registry.items.length > 0 && (
          <div style={{ maxWidth: 420, margin: "28px auto 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gray)", marginBottom: 6 }}>
              <span>{purchased} purchased · {claimed} claimed · {available} available</span>
              <span>{progress}% complete</span>
            </div>
            <div style={{ height: 6, background: "var(--cream)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #4ade80, #e8d5b0)", borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Top Gifters Leaderboard */}
      {topGifters.length > 0 && topGifters.some(g => g.total > 0) && (
        <div style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border)", padding: "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dk)", letterSpacing: "0.08em", flexShrink: 0 }}>🏆 TOP GIFTERS</span>
            {topGifters.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--off-white)", border: `1px solid ${i === 0 ? "rgba(232,213,176,0.25)" : "#1e1e1e"}`, borderRadius: 100, padding: "6px 14px 6px 8px" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: i === 0 ? "rgba(232,213,176,0.15)" : "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: i === 0 ? "var(--gold)" : "var(--gray)" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </div>
                <div>
                  <span style={{ fontSize: 13, color: i === 0 ? "var(--gold)" : "var(--text2)", fontWeight: i === 0 ? 700 : 400 }}>{g.name}</span>
                  {g.total > 0 && <span style={{ fontSize: 11, color: "var(--gold-dk)", marginLeft: 6 }}>· {registry.items?.[0]?.currency || "USD"} {g.total.toFixed(0)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gifter activity */}
      {registry.contributions.length > 0 && (
        <div style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border)", padding: "16px 24px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", maxWidth: 1100, margin: "0 auto", minWidth: "max-content" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gray)", letterSpacing: "0.08em", flexShrink: 0 }}>GIFTERS</span>
            {registry.contributions.slice(0, 8).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--off-white)", border: "1px solid var(--border)", borderRadius: 100, padding: "5px 14px 5px 6px" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--gold)" }}>
                  {c.gifterName[0].toUpperCase()}
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>{c.gifterName}</span>
                  {c.status === "purchased" && <span style={{ marginLeft: 4, fontSize: 10, color: "var(--green)" }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Gifters Leaderboard */}

      {/* Items */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Filter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "var(--black)" }}>
            {registry.items.length} gifts
          </div>
          <div style={{ display: "flex", gap: 6, background: "var(--off-white)", padding: 4, borderRadius: 10 }}>
            {[["all", "All gifts"], ["available", `Available (${available})`], ["claimed", `Claimed (${claimed + purchased})`]].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "7px 14px", border: "none", borderRadius: 7, cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
                background: filter === key ? "var(--gold)" : "transparent",
                color: filter === key ? "var(--white)" : "var(--gray)",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--gray)" }}>
            <p>No items in this filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filteredItems.map(item => {
              const isAvailable = item.status === "available";
              return (
                <div key={item.id} style={{
                  background: "var(--off-white)", border: "1px solid var(--border)",
                  borderRadius: 16, overflow: "hidden",
                  opacity: isAvailable ? 1 : 0.7,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => isAvailable && (e.currentTarget.style.borderColor = "var(--gray-bg)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e1e")}
                >
                  <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--cream)" }}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {!isAvailable && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ padding: "8px 20px", background: item.status === "purchased" ? "var(--blue)" : "var(--yellow)", color: "#fff", borderRadius: 100, fontSize: 12, fontWeight: 800 }}>
                          {item.status === "purchased" ? "✅ Purchased" : "🔖 Claimed"}
                        </div>
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", background: "rgba(0,0,0,0.7)", borderRadius: 6, fontSize: 10, color: PRIORITY_COLORS[item.priority], fontWeight: 700 }}>
                      {PRIORITY_LABELS[item.priority]}
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "var(--black)", marginBottom: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {item.title}
                    </div>
                    {item.note && <p style={{ fontSize: 12, color: "var(--gray)", marginBottom: 8, lineHeight: 1.5, fontStyle: "italic" }}>{item.note}</p>}
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 800, color: "var(--gold)", marginBottom: 14 }}>
                      {item.currency} {item.price.toFixed(2)}
                    </div>

                    {isAvailable ? (
                      <button onClick={() => { setClaimModal(item); setClaimResult(null); setClaimForm({ gifterName: "", gifterEmail: "", message: "" }); }} style={{
                        width: "100%", padding: "10px", background: "var(--gold)", color: "var(--white)",
                        borderRadius: 10, border: "none", fontFamily: "Georgia, serif",
                        fontWeight: 800, fontSize: 14, cursor: "pointer",
                      }}>
                        🎁 Gift this
                      </button>
                    ) : (
                      <div style={{ width: "100%", padding: "10px", background: "var(--cream)", borderRadius: 10, textAlign: "center", fontSize: 13, color: "var(--gray)" }}>
                        Already {item.status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thank you message */}
      {registry.thankYouMsg && (
        <div style={{ background: "var(--off-white)", borderTop: "1px solid var(--border)", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💌</div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "var(--text2)", lineHeight: 1.8, fontStyle: "italic" }}>"{registry.thankYouMsg}"</p>
            <p style={{ fontSize: 13, color: "var(--gray)", marginTop: 12 }}>— {registry.ownerName}</p>
          </div>
        </div>
      )}

      {/* Claim modal */}
      {claimModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setClaimModal(null)}>
          <div style={{ background: "var(--white)", border: "1px solid var(--border2)", boxShadow: "var(--shadow-lg)", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            {!claimResult ? (
              <>
                <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", background: "var(--cream)", flexShrink: 0 }}>
                    {claimModal.imageUrl && <img src={claimModal.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--gold-dk)", marginBottom: 4, fontWeight: 700, letterSpacing: "0.08em" }}>YOU'RE GIFTING</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "var(--black)", lineHeight: 1.3 }}>{claimModal.title}</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 800, color: "var(--gold)", marginTop: 4 }}>{claimModal.currency} {claimModal.price.toFixed(2)}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6, background: "var(--cream)", padding: "12px 14px", borderRadius: 10 }}>
                  Claim this gift to let others know it's taken. You'll then be redirected to buy it directly from the store.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gray)", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your name *</label>
                    <input value={claimForm.gifterName} onChange={e => setClaimForm(f => ({ ...f, gifterName: e.target.value }))} placeholder="Your name" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gray)", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your email *</label>
                    <input type="email" value={claimForm.gifterEmail} onChange={e => setClaimForm(f => ({ ...f, gifterEmail: e.target.value }))} placeholder="your@email.com" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gray)", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Message (optional)</label>
                    <textarea value={claimForm.message} onChange={e => setClaimForm(f => ({ ...f, message: e.target.value }))} placeholder={`A note for ${registry.ownerName}...`} rows={2} style={{ ...inp, resize: "vertical" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleClaim} disabled={claiming || !claimForm.gifterName || !claimForm.gifterEmail} style={{
                    flex: 1, padding: "13px", background: "var(--gold)", color: "var(--white)",
                    borderRadius: 10, border: "none", fontFamily: "Georgia, serif",
                    fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: claiming ? 0.7 : 1,
                  }}>
                    {claiming ? "Claiming..." : "Claim & Buy Gift →"}
                  </button>
                  <button onClick={() => setClaimModal(null)} style={{ padding: "13px 18px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text2)", cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            ) : claimResult.error ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                <p style={{ color: "var(--red)", marginBottom: 16 }}>{claimResult.error}</p>
                <button onClick={() => setClaimModal(null)} style={{ padding: "10px 24px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text2)", cursor: "pointer" }}>Close</button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "var(--green)", marginBottom: 12 }}>Gift claimed!</h3>
                <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.7 }}>
                  {claimModal.title} is now reserved for {registry.ownerName}. Complete payment on the next page — we'll purchase and deliver the gift for you.
                </p>
                <a href={`/pay/${claimResult.contribution?.id}`} style={{
                  display: "inline-block", padding: "13px 32px",
                  background: "var(--gold)", color: "var(--white)",
                  borderRadius: 10, fontFamily: "Georgia, serif",
                  fontWeight: 800, fontSize: 15, textDecoration: "none",
                  marginBottom: 12,
                }}>
                  Pay & complete gift →
                </a>
                <br />
                <button onClick={() => setClaimModal(null)} style={{ padding: "8px 20px", background: "transparent", border: "none", color: "var(--gray)", cursor: "pointer", fontSize: 13 }}>
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
