"use client";
import { useState } from "react";
import Link from "next/link";

const OCC_EMOJI = { Wedding:"💍", Birthday:"🎂", "Baby Shower":"👶", Christmas:"🎄", Graduation:"🎓", Housewarming:"🏠", Anniversary:"💝" };
const OCC_GRADIENT = {
  Wedding: "linear-gradient(135deg,#d4af37,#8b6914)",
  Birthday: "linear-gradient(135deg,#e8334a,#9e1c2e)",
  "Baby Shower": "linear-gradient(135deg,#7eb8f7,#2563a8)",
  Graduation: "linear-gradient(135deg,#2e7d4f,#1a4f30)",
  Housewarming: "linear-gradient(135deg,#ea7c2b,#a0501a)",
  Anniversary: "linear-gradient(135deg,#9b59b6,#6c3483)",
  Christmas: "linear-gradient(135deg,#c0392b,#2e7d4f)",
};
const PRIORITY_COLORS = { high: "#c0392b", medium: "#b7680f", low: "#2e7d4f" };
const PRIORITY_LABELS = { high: "Must have", medium: "Would love", low: "Nice to have" };

function GroupBuyBar({ item }) {
  const pct = item.targetAmount > 0 ? Math.min(100, Math.round((item.collectedAmount / item.targetAmount) * 100)) : 0;
  const remaining = Math.max(0, (item.targetAmount || item.price) - (item.collectedAmount || 0));
  return (
    <div style={{ background: "rgba(201,150,42,0.08)", border: "1px solid rgba(201,150,42,0.2)", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
        <span style={{ color: "#9a7020" }}>👥 Group gift — {pct}% funded</span>
        <span style={{ color: "#c9962a" }}>{item.currency} {(item.collectedAmount || 0).toFixed(0)} / {(item.targetAmount || item.price).toFixed(0)}</span>
      </div>
      <div style={{ height: 6, background: "rgba(201,150,42,0.15)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#c9962a,#e8b84b)", borderRadius: 3, transition: "width 0.5s" }} />
      </div>
      {remaining > 0 && <div style={{ fontSize: 11, color: "#9a7020", marginTop: 5 }}>Still needs {item.currency} {remaining.toFixed(2)} more to be fully funded</div>}
    </div>
  );
}

export default function PublicRegistryClient({ registry }) {
  const [claimModal, setClaimModal] = useState(null);
  const [form, setForm] = useState({ gifterName: "", gifterEmail: "", message: "", contributionAmount: "" });
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [filter, setFilter] = useState("all");

  const expired = registry.expired;
  const items = registry.items || [];
  const contributions = registry.contributions || [];
  const purchased = items.filter(i => i.status === "purchased").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  const available = items.filter(i => i.status === "available").length;
  const progress = items.length > 0 ? Math.round(((purchased + claimed) / items.length) * 100) : 0;

  const daysUntil = registry.eventDate && !expired
    ? Math.ceil((new Date(registry.eventDate) - Date.now()) / 86400000)
    : null;

  const emoji = OCC_EMOJI[registry.occasion] || "🎁";
  const gradient = OCC_GRADIENT[registry.occasion] || "linear-gradient(135deg,#c9962a,#7b1c2e)";

  // Gifter leaderboard
  const gifterMap = {};
  contributions.forEach(c => {
    const k = c.gifterEmail || c.gifterName;
    const amt = c.payment?.totalAmount || c.contributionAmount || c.amount || 0;
    if (!gifterMap[k]) gifterMap[k] = { name: c.gifterName, total: 0, count: 0 };
    gifterMap[k].total += amt;
    gifterMap[k].count++;
  });
  const topGifters = Object.values(gifterMap).sort((a, b) => b.total - a.total).slice(0, 3);
  const currency = items[0]?.currency || "USD";

  const filteredItems = items.filter(i =>
    filter === "available" ? i.status === "available" :
    filter === "claimed" ? i.status !== "available" : true
  );

  const handleClaim = async () => {
    if (!form.gifterName || !form.gifterEmail) return;
    if (claimModal?.groupBuy && !form.contributionAmount) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/registry/claim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: claimModal.id,
          gifterName: form.gifterName,
          gifterEmail: form.gifterEmail,
          message: form.message,
          contributionAmount: claimModal.groupBuy ? parseFloat(form.contributionAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setClaimResult(data);
      else setClaimResult({ error: data.error });
    } catch { setClaimResult({ error: "Network error. Please try again." }); }
    setClaiming(false);
  };

  const s = {
    inp: { padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", background: "#f8f4ef", color: "#0f0d0b" },
  };

  return (
    <div>
      {/* ── Festive Hero ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Occasion gradient banner */}
        <div style={{ background: gradient, padding: "52px 24px 80px", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize: "24px 24px" }} />

          {expired && (
            <div style={{ display: "inline-block", padding: "5px 14px", background: "rgba(0,0,0,0.35)", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", marginBottom: 14 }}>
              ⚠️ THIS REGISTRY HAS EXPIRED
            </div>
          )}

          <div style={{ fontSize: 64, marginBottom: 12, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }}>{emoji}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", marginBottom: 12 }}>{registry.occasion} Registry</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 54px)", fontWeight: 900, color: "#fff", lineHeight: 1.08, marginBottom: 12, letterSpacing: "-0.02em" }}>
            {registry.title}
          </h1>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>Created by <strong style={{ color: "#fff" }}>{registry.ownerName}</strong></div>
          {registry.eventDate && (
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: daysUntil > 0 ? 8 : 0 }}>
              📅 {new Date(registry.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          )}
          {daysUntil !== null && daysUntil >= 0 && (
            <div style={{ display: "inline-block", padding: "6px 18px", background: "rgba(255,255,255,0.2)", borderRadius: 100, fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 6, backdropFilter: "blur(8px)" }}>
              {daysUntil === 0 ? "🎉 Today is the day!" : `🗓 ${daysUntil} days to go`}
            </div>
          )}
          {registry.description && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", maxWidth: 500, margin: "16px auto 0", lineHeight: 1.7 }}>{registry.description}</p>}
        </div>

        {/* Progress card floating */}
        <div style={{ background: "#0f0d0b", margin: "0 24px", borderRadius: "var(--radius-xl)", padding: "20px 24px", transform: "translateY(-30px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxWidth: 860, marginLeft: "auto", marginRight: "auto", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Total Gifts", value: items.length, color: "#f5f0e8" },
              { label: "Available", value: available, color: "#5dd68c" },
              { label: "Claimed", value: claimed, color: "#e8b84b" },
              { label: "Purchased", value: purchased, color: "#60a5fa" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: "#5a5650", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a5650", marginBottom: 6 }}>
              <span>{purchased + claimed} of {items.length} gifts taken</span>
              <span style={{ color: "#c9962a", fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: "#1e1b18", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#c9962a,#a02540)", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "-10px auto 0", padding: "0 24px 60px" }}>

        {/* Top gifters */}
        {topGifters.length > 0 && topGifters.some(g => g.total > 0) && (
          <div style={{ background: "var(--gold-bg)", border: "1px solid rgba(201,150,42,0.2)", borderRadius: "var(--radius-xl)", padding: "18px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--gold-dk)", letterSpacing: "0.1em", flexShrink: 0 }}>🏆 TOP GIFTERS</div>
            {topGifters.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--black)" }}>{g.name}</div>
                  {g.total > 0 && <div style={{ fontSize: 11, color: "var(--gold-dk)" }}>{currency} {g.total.toFixed(0)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gifter activity strip */}
        {contributions.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray)", letterSpacing: "0.08em", flexShrink: 0, textTransform: "uppercase" }}>Recent gifters</div>
            {contributions.slice(0, 8).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--white)", border: "1px solid var(--border2)", borderRadius: 100, padding: "5px 12px 5px 5px", flexShrink: 0, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--maroon)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                  {c.gifterName[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>{c.gifterName.split(" ")[0]}</span>
                {c.status === "purchased" && <span style={{ fontSize: 10 }}>✅</span>}
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--black)" }}>Gift List <span style={{ fontWeight: 400, fontStyle: "italic", color: "var(--gray)" }}>({items.length})</span></h2>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"], ["available",`Available (${available})`], ["claimed",`Taken (${claimed+purchased})`]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                fontSize: 12, fontFamily: "inherit", fontWeight: filter === k ? 700 : 400,
                border: `1px solid ${filter === k ? "var(--maroon)" : "var(--border2)"}`,
                background: filter === k ? "var(--maroon)" : "var(--white)",
                color: filter === k ? "#fff" : "var(--text2)",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Gift items grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--gray)" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🎁</div>
            <p>No items in this filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filteredItems.map(item => {
              const isAvailable = item.status === "available" || (item.groupBuy && item.status !== "purchased");
              const isPurchased = item.status === "purchased";
              const groupPct = item.groupBuy && item.targetAmount > 0
                ? Math.min(100, Math.round(((item.collectedAmount || 0) / item.targetAmount) * 100))
                : 0;

              return (
                <div key={item.id} style={{
                  background: "#0f0d0b",
                  borderRadius: "var(--radius-xl)", overflow: "hidden",
                  opacity: isPurchased ? 0.8 : 1,
                  transition: "all 0.2s",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                }}
                onMouseEnter={e => isAvailable && (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  {/* Top accent */}
                  <div style={{ height: 3, background: isPurchased ? "#2e7d4f" : item.groupBuy ? "linear-gradient(90deg,#c9962a,#e8b84b)" : "linear-gradient(90deg,var(--gold),var(--maroon))" }} />

                  {/* Image */}
                  <div style={{ position: "relative", aspectRatio: "4/3", background: "#1a1614", overflow: "hidden" }}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: isPurchased ? "brightness(0.6)" : "none" }} />}
                    {!item.imageUrl && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, opacity: 0.4 }}>🎁</div>}

                    {isPurchased && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                        <div style={{ padding: "8px 20px", background: "#2e7d4f", color: "#fff", borderRadius: 100, fontSize: 12, fontWeight: 800 }}>✅ Fully gifted!</div>
                      </div>
                    )}
                    {item.status === "claimed" && !item.groupBuy && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
                        <div style={{ padding: "8px 20px", background: "#b7680f", color: "#fff", borderRadius: 100, fontSize: 12, fontWeight: 800 }}>🔖 Claimed</div>
                      </div>
                    )}

                    {/* Priority badge */}
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", borderRadius: 6, fontSize: 10, color: PRIORITY_COLORS[item.priority] || "#c9962a", fontWeight: 700 }}>
                      {PRIORITY_LABELS[item.priority] || "Gift"}
                    </div>

                    {/* Group buy badge */}
                    {item.groupBuy && (
                      <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px", background: "rgba(201,150,42,0.9)", borderRadius: 6, fontSize: 10, color: "#fff", fontWeight: 800 }}>
                        👥 GROUP
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "#f5f0e8", marginBottom: 4, lineHeight: 1.3 }}>{item.title}</div>
                    {item.note && <p style={{ fontSize: 11, color: "#7a7268", marginBottom: 8, fontStyle: "italic", lineHeight: 1.5 }}>{item.note}</p>}
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#e8b84b", marginBottom: 8 }}>
                      {item.currency} {item.price.toFixed(2)}
                    </div>

                    {/* Group buy progress */}
                    {item.groupBuy && <GroupBuyBar item={item} />}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      {isAvailable && !isPurchased ? (
                        <button onClick={() => { setClaimModal(item); setClaimResult(null); setForm({ gifterName: "", gifterEmail: "", message: "", contributionAmount: "" }); }} style={{
                          flex: 1, padding: "11px", background: "var(--maroon)", color: "#fff",
                          borderRadius: "var(--radius-lg)", border: "none",
                          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer",
                          transition: "background 0.15s",
                        }}>
                          {item.groupBuy ? "👥 Contribute" : "🎁 Gift this"}
                        </button>
                      ) : (
                        <div style={{ flex: 1, padding: "11px", background: "#1a1614", borderRadius: "var(--radius-lg)", textAlign: "center", fontSize: 13, color: "#5a5650" }}>
                          {isPurchased ? "Fully gifted ✅" : "Claimed 🔖"}
                        </div>
                      )}
                      <a href={item.productUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "11px 14px", background: "#1a1614", borderRadius: "var(--radius-lg)", color: "#7a7268", fontSize: 13, fontWeight: 600 }}>↗</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Thank you message */}
        {registry.thankYouMsg && (
          <div style={{ textAlign: "center", padding: "48px 24px 0", borderTop: "1px solid var(--border)", marginTop: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💌</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text2)", lineHeight: 1.8, fontStyle: "italic", maxWidth: 480, margin: "0 auto" }}>"{registry.thankYouMsg}"</p>
            <p style={{ fontSize: 14, color: "var(--gray)", marginTop: 10 }}>— {registry.ownerName}</p>
          </div>
        )}
      </div>

      {/* ── Claim / Contribute Modal ── */}
      {claimModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setClaimModal(null)}>
          <div style={{ background: "#0f0d0b", borderRadius: "var(--radius-xl)", padding: 0, maxWidth: 500, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ height: 4, background: claimModal.groupBuy ? "linear-gradient(90deg,#c9962a,#e8b84b)" : "linear-gradient(90deg,var(--maroon),#a02540)", borderRadius: "20px 20px 0 0" }} />
            <div style={{ padding: "22px 24px 0" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
                {claimModal.imageUrl && <div style={{ width: 68, height: 68, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><img src={claimModal.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#c9962a", fontWeight: 800, letterSpacing: "0.1em", marginBottom: 4 }}>{claimModal.groupBuy ? "👥 GROUP GIFT CONTRIBUTION" : "🎁 YOU ARE GIFTING"}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#f5f0e8", marginBottom: 4, lineHeight: 1.3 }}>{claimModal.title}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "#e8b84b" }}>{claimModal.currency} {claimModal.price.toFixed(2)}</div>
                </div>
                <button onClick={() => setClaimModal(null)} style={{ color: "#5a5650", fontSize: 20, padding: 4, flexShrink: 0, marginLeft: 4 }}>✕</button>
              </div>

              {claimModal.groupBuy && !claimResult && <GroupBuyBar item={claimModal} />}
            </div>

            {!claimResult ? (
              <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                {claimModal.groupBuy && (
                  <div style={{ padding: "12px 14px", background: "rgba(201,150,42,0.08)", border: "1px solid rgba(201,150,42,0.2)", borderRadius: 10, fontSize: 13, color: "#c9962a", lineHeight: 1.6 }}>
                    This is a group gift! Multiple people can contribute any amount. The item will be marked as fully gifted once the target is reached.
                  </div>
                )}
                {!claimModal.groupBuy && (
                  <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 10, fontSize: 13, color: "#7a7268", lineHeight: 1.6 }}>
                    Claiming this item lets others know it's taken. You'll be directed to complete payment after claiming.
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a7268", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your name *</label>
                    <input value={form.gifterName} onChange={e => setForm(f => ({ ...f, gifterName: e.target.value }))} placeholder="Your name" style={s.inp} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a7268", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your email *</label>
                    <input type="email" value={form.gifterEmail} onChange={e => setForm(f => ({ ...f, gifterEmail: e.target.value }))} placeholder="your@email.com" style={s.inp} />
                  </div>
                </div>

                {claimModal.groupBuy && (
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a7268", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your contribution amount * ({claimModal.currency})</label>
                    <input type="number" min="1" step="0.01" value={form.contributionAmount} onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))} placeholder={`e.g. ${(claimModal.price / 4).toFixed(0)}`} style={s.inp} />
                    <div style={{ fontSize: 11, color: "#5a5650", marginTop: 4 }}>
                      Remaining: {claimModal.currency} {Math.max(0, (claimModal.targetAmount || claimModal.price) - (claimModal.collectedAmount || 0)).toFixed(2)}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a7268", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Message (optional)</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={`A message for ${registry.ownerName}...`} rows={2} style={{ ...s.inp, resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleClaim} disabled={claiming || !form.gifterName || !form.gifterEmail || (claimModal.groupBuy && !form.contributionAmount)} style={{
                    flex: 1, padding: "14px", background: claiming ? "#2a2520" : "var(--maroon)", color: claiming ? "#5a5650" : "#fff",
                    borderRadius: "var(--radius-xl)", border: "none",
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, cursor: claiming ? "not-allowed" : "pointer",
                  }}>
                    {claiming ? "Processing..." : claimModal.groupBuy ? `Contribute ${form.contributionAmount ? claimModal.currency + " " + parseFloat(form.contributionAmount).toFixed(2) : ""}` : "Claim & Gift →"}
                  </button>
                  <button onClick={() => setClaimModal(null)} style={{ padding: "14px 18px", background: "#1a1614", borderRadius: "var(--radius-xl)", color: "#7a7268", fontSize: 14 }}>Cancel</button>
                </div>
              </div>
            ) : claimResult.error ? (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                <p style={{ color: "#f07070", marginBottom: 16 }}>{claimResult.error}</p>
                <button onClick={() => setClaimModal(null)} style={{ padding: "10px 24px", background: "#1a1614", borderRadius: "var(--radius-lg)", color: "#7a7268", fontSize: 13 }}>Close</button>
              </div>
            ) : (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#5dd68c", marginBottom: 10 }}>
                  {claimResult.targetMet ? "Gift fully funded! 🎊" : claimResult.groupBuy ? "Contribution received!" : "Gift claimed!"}
                </h3>
                <p style={{ fontSize: 14, color: "#7a7268", marginBottom: 20, lineHeight: 1.7 }}>{claimResult.message}</p>

                {claimResult.groupBuy && !claimResult.targetMet && (
                  <div style={{ padding: "12px 16px", background: "rgba(201,150,42,0.1)", border: "1px solid rgba(201,150,42,0.2)", borderRadius: 10, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: "#c9962a", fontWeight: 700 }}>
                      {claimResult.newCollected?.toFixed(2)} / {claimResult.targetAmount?.toFixed(2)} {claimModal.currency} raised
                    </div>
                    <div style={{ height: 4, background: "#1e1b18", borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (claimResult.newCollected / claimResult.targetAmount) * 100)}%`, background: "linear-gradient(90deg,#c9962a,#e8b84b)", borderRadius: 2 }} />
                    </div>
                  </div>
                )}

                {!claimResult.groupBuy && claimResult.contribution?.id && (
                  <Link href={`/pay/${claimResult.contribution.id}`} style={{ display: "inline-block", padding: "13px 32px", background: "var(--maroon)", color: "#fff", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
                    Complete Payment →
                  </Link>
                )}
                <br />
                <button onClick={() => setClaimModal(null)} style={{ padding: "8px 20px", background: "transparent", border: "none", color: "#5a5650", cursor: "pointer", fontSize: 13, marginTop: 8 }}>
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
