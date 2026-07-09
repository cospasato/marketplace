"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OCCASIONS = [
  { id: "all", emoji: "✨", label: "All" },
  { id: "wedding", emoji: "💍", label: "Wedding" },
  { id: "baby-shower", emoji: "👶", label: "Baby Shower" },
  { id: "birthday", emoji: "🎂", label: "Birthday" },
  { id: "christmas", emoji: "🎄", label: "Christmas" },
  { id: "graduation", emoji: "🎓", label: "Graduation" },
  { id: "housewarming", emoji: "🏠", label: "Housewarming" },
  { id: "anniversary", emoji: "💝", label: "Anniversary" },
  { id: "other", emoji: "🎁", label: "Other" },
];

const OCCASION_CREATE = OCCASIONS.slice(1);
const OCCASION_EMOJIS = { "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" };

// ── Registry Card — Black ──────────────────────────────────────────────────
function RegistryCard({ r }) {
  const items = r.items || [];
  const purchased = items.filter(i => i.status === "purchased").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  const progress = items.length > 0 ? Math.round(((purchased + claimed) / items.length) * 100) : 0;
  const emoji = OCCASION_EMOJIS[r.occasion] || "🎁";
  const expired = r.expired;
  const daysUntil = r.eventDate && !expired
    ? Math.ceil((new Date(r.eventDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={expired ? "#" : `/registry/${r.slug}`} style={{ textDecoration: "none", pointerEvents: expired ? "none" : "auto" }}>
      <div style={{
        background: "#0f0d0b",
        borderRadius: 18,
        overflow: "hidden",
        transition: "all 0.22s ease",
        cursor: expired ? "default" : "pointer",
        opacity: expired ? 0.65 : 1,
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => !expired && (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {/* Top accent strip */}
        <div style={{ height: 4, background: expired ? "#4a4540" : "linear-gradient(90deg, #c9962a, #7b1c2e)" }} />

        {/* Expired overlay badge */}
        {expired && (
          <div style={{ position: "absolute", top: 16, right: 14, background: "#4a4540", color: "#9a9690", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em" }}>
            EXPIRED
          </div>
        )}

        <div style={{ padding: "20px 20px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 34 }}>{emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: "rgba(201,150,42,0.18)", color: "#e8b84b", border: "1px solid rgba(201,150,42,0.25)", letterSpacing: "0.05em" }}>
              {r.occasion}
            </div>
          </div>

          {/* Title & Owner */}
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "#f5f0e8", lineHeight: 1.25, marginBottom: 5 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: "#7a7268" }}>
              by {r.ownerName}
              {daysUntil !== null && daysUntil > 0 && (
                <span style={{ marginLeft: 8, color: "#c9962a", fontWeight: 600 }}>· {daysUntil}d away</span>
              )}
              {r.eventDate && expired && (
                <span style={{ marginLeft: 8, color: "#6b6560" }}>· {new Date(r.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              )}
              {r.eventDate && !expired && daysUntil === 0 && (
                <span style={{ marginLeft: 8, color: "#e8b84b", fontWeight: 700 }}>· Today!</span>
              )}
            </div>
          </div>

          {/* Progress */}
          {items.length > 0 && (
            <div style={{ marginTop: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a5650", marginBottom: 6 }}>
                <span>{items.length} gifts</span>
                <span style={{ color: expired ? "#5a5650" : "#c9962a", fontWeight: 600 }}>{progress}% claimed</span>
              </div>
              <div style={{ height: 4, background: "#1e1b18", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: expired ? "#3a3530" : "linear-gradient(90deg, #c9962a, #a02540)", borderRadius: 2, transition: "width 0.5s" }} />
              </div>
            </div>
          )}

          {/* Event date */}
          {r.eventDate && (
            <div style={{ fontSize: 11, color: "#4a4540", borderTop: "1px solid #1e1b18", paddingTop: 10, marginTop: 4 }}>
              📅 {new Date(r.eventDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function RegistryHomeClient() {
  const router = useRouter();
  const [tab, setTab] = useState("browse");
  const [search, setSearch] = useState("");
  const [filterOccasion, setFilterOccasion] = useState("all");
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findEmail, setFindEmail] = useState("");
  const [finding, setFinding] = useState(false);
  const [foundRegistries, setFoundRegistries] = useState(null);
  const [form, setForm] = useState({ ownerName: "", ownerEmail: "", title: "", occasion: "", eventDate: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadRegistries = useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim()
        ? `?search=${encodeURIComponent(search)}`
        : filterOccasion !== "all"
        ? `?occasion=${encodeURIComponent(filterOccasion)}`
        : "";
      const res = await fetch(`/api/registry${q}`);
      const data = await res.json();
      setRegistries(Array.isArray(data) ? data : []);
    } catch { setRegistries([]); }
    setLoading(false);
  }, [search, filterOccasion]);

  useEffect(() => {
    const t = setTimeout(loadRegistries, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [loadRegistries]);

  const createRegistry = async () => {
    if (!form.ownerName || !form.ownerEmail || !form.occasion) {
      setError("Please fill in your name, email and select an occasion."); return;
    }
    setCreating(true); setError("");
    try {
      const res = await fetch("/api/registry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title: form.title || `${form.ownerName}'s ${form.occasion} Registry` }),
      });
      const data = await res.json();
      if (res.ok) {
        try {
          const stored = JSON.parse(localStorage.getItem("my_registries") || "[]");
          stored.unshift({ id: data.id, slug: data.slug, title: data.title, email: form.ownerEmail });
          localStorage.setItem("my_registries", JSON.stringify(stored.slice(0, 10)));
        } catch {}
        router.push(`/registry/dashboard?id=${data.id}&email=${encodeURIComponent(form.ownerEmail)}`);
      } else setError(data.error || "Failed to create registry.");
    } catch { setError("Network error. Please try again."); }
    setCreating(false);
  };

  const findByEmail = async () => {
    if (!findEmail.trim()) return;
    setFinding(true);
    try {
      const res = await fetch(`/api/registry?email=${encodeURIComponent(findEmail)}`);
      setFoundRegistries(await res.json());
    } catch { setFoundRegistries([]); }
    setFinding(false);
  };

  const inp = {
    padding: "12px 16px", borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border2)", fontSize: 14,
    fontFamily: "var(--font-body)", outline: "none", width: "100%",
    background: "var(--white)", color: "var(--black)",
  };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--gray)", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" };

  return (
    <div>
      {/* ── Hero strip ── */}
      <div style={{ background: "#0f0d0b", padding: "52px 24px 44px", textAlign: "center", borderBottom: "3px solid var(--gold)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 14 }}>Gift Registry</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, color: "#f5f0e8", marginBottom: 14, lineHeight: 1.1 }}>
            Create · Share · Celebrate
          </h1>
          <p style={{ fontSize: 16, color: "#7a7268", lineHeight: 1.7, marginBottom: 32 }}>
            Search all active registries or create your own in 60 seconds.
          </p>
          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setTab("browse"); }}
              placeholder="Search by name, occasion, or title..."
              style={{ ...inp, padding: "14px 52px 14px 18px", borderRadius: 100, background: "#1a1816", border: "1px solid #2a2520", color: "#f5f0e8", fontSize: 15 }}
            />
            <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", color: "#5a5650", fontSize: 18, pointerEvents: "none" }}>⌕</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--white)", position: "sticky", top: 62, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
          {[["browse", "🎊 Browse Registries"], ["create", "✨ Create Registry"], ["find", "📧 Find by Email"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "14px 20px", border: "none", background: "transparent",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              color: tab === key ? "var(--maroon)" : "var(--gray)",
              borderBottom: tab === key ? "2px solid var(--maroon)" : "2px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── BROWSE ── */}
        {tab === "browse" && (
          <div>
            {/* Occasion filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              {OCCASIONS.map(o => (
                <button key={o.id} onClick={() => { setFilterOccasion(o.id); setSearch(""); }} style={{
                  padding: "7px 16px", borderRadius: 100, cursor: "pointer",
                  fontSize: 13, fontFamily: "inherit",
                  border: `1px solid ${filterOccasion === o.id ? "var(--maroon)" : "var(--border2)"}`,
                  background: filterOccasion === o.id ? "var(--maroon)" : "var(--white)",
                  color: filterOccasion === o.id ? "var(--white)" : "var(--text2)",
                  fontWeight: filterOccasion === o.id ? 600 : 400,
                  transition: "all 0.15s",
                }}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--gray)" }}>
                <div style={{ width: 36, height: 36, border: "3px solid var(--border2)", borderTop: "3px solid var(--maroon)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Loading registries...
              </div>
            ) : registries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--gray)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
                <p style={{ marginBottom: 16, fontSize: 16 }}>No registries found{search ? ` for "${search}"` : ""}.</p>
                <button onClick={() => setTab("create")} style={{ padding: "11px 28px", background: "var(--maroon)", color: "var(--white)", borderRadius: "var(--radius-lg)", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Create the first one →
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: "var(--gray)", marginBottom: 20 }}>
                  {registries.filter(r => !r.expired).length} active · {registries.filter(r => r.expired).length} expired
                  {search && ` · matching "${search}"`}
                </div>
                {/* Active registries */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
                  {registries.filter(r => !r.expired).map(r => <RegistryCard key={r.id} r={r} />)}
                </div>
                {/* Expired registries (collapsed) */}
                {registries.filter(r => r.expired).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      Expired Registries
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                      {registries.filter(r => r.expired).map(r => <RegistryCard key={r.id} r={r} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CREATE ── */}
        {tab === "create" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 6 }}>Start your registry</h2>
              <p style={{ fontSize: 14, color: "var(--gray)" }}>Takes 60 seconds. Free forever. No account required.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={lbl}>Your name *</label><input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="Jane Doe" style={inp} /></div>
                <div><label style={lbl}>Your email *</label><input type="email" value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="jane@email.com" style={inp} /></div>
              </div>

              <div>
                <label style={lbl}>Occasion *</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {OCCASION_CREATE.map(o => (
                    <button key={o.id} onClick={() => setForm(f => ({ ...f, occasion: o.label }))} style={{
                      padding: "12px 8px", textAlign: "center", cursor: "pointer", fontFamily: "inherit",
                      border: `2px solid ${form.occasion === o.label ? "var(--maroon)" : "var(--border2)"}`,
                      borderRadius: "var(--radius-lg)",
                      background: form.occasion === o.label ? "var(--maroon)" : "var(--white)",
                      color: form.occasion === o.label ? "var(--white)" : "var(--text2)",
                      fontSize: 13, fontWeight: form.occasion === o.label ? 600 : 400, transition: "all 0.15s",
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 5 }}>{o.emoji}</div>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={lbl}>Registry title (optional)</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={`${form.ownerName || "Your"}'s ${form.occasion || "Registry"}`} style={inp} /></div>
                <div><label style={lbl}>Event date (optional)</label><input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} style={inp} /></div>
              </div>

              <div>
                <label style={lbl}>Message to guests (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="A note for your friends and family..." rows={3} style={{ ...inp, resize: "vertical" }} />
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: "var(--red-bg)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "var(--radius-lg)", fontSize: 13, color: "var(--red)" }}>{error}</div>
              )}

              <button onClick={createRegistry} disabled={creating} style={{
                padding: "15px", background: creating ? "var(--gray-bg)" : "var(--maroon)",
                color: creating ? "var(--gray)" : "var(--white)",
                borderRadius: "var(--radius-xl)", border: "none",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
                cursor: creating ? "not-allowed" : "pointer", transition: "all 0.15s",
              }}>
                {creating ? "Creating your registry..." : "Create My Registry →"}
              </button>
            </div>
          </div>
        )}

        {/* ── FIND BY EMAIL ── */}
        {tab === "find" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>Find by email</h2>
            <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 24 }}>Enter the registry owner's email to find their list.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input value={findEmail} onChange={e => setFindEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && findByEmail()} placeholder="owner@email.com" style={{ ...inp, flex: 1 }} />
              <button onClick={findByEmail} disabled={finding} style={{ padding: "12px 22px", background: "var(--maroon)", color: "var(--white)", borderRadius: "var(--radius-lg)", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {finding ? "..." : "Search"}
              </button>
            </div>
            {foundRegistries !== null && (
              foundRegistries.length === 0 ? (
                <p style={{ color: "var(--gray)", fontSize: 14 }}>No registries found for that email.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {foundRegistries.map(r => <RegistryCard key={r.id} r={r} />)}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
