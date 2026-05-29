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

function RegistryCard({ r }) {
  const items = r.items || [];
  const purchased = items.filter(i => i.status === "purchased").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  const progress = items.length > 0 ? Math.round(((purchased + claimed) / items.length) * 100) : 0;
  const emoji = { "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" }[r.occasion] || "🎁";
  const daysUntil = r.eventDate ? Math.ceil((new Date(r.eventDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Link href={`/registry/${r.slug}`} style={{ textDecoration: "none" }}>
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "20px", cursor: "pointer", transition: "all 0.2s", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = "translateY(0)"; }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 32 }}>{emoji}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#c4a870", background: "rgba(196,168,112,0.1)", border: "1px solid rgba(196,168,112,0.2)", padding: "3px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>
            {r.occasion}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#f0ede8", marginBottom: 4, lineHeight: 1.3 }}>{r.title}</div>
          <div style={{ fontSize: 12, color: "#5a5650" }}>
            by {r.ownerName}
            {daysUntil !== null && daysUntil > 0 && <span style={{ color: "#c4a870", marginLeft: 6 }}>· {daysUntil}d away</span>}
          </div>
        </div>
        {items.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a5650", marginBottom: 5, fontFamily: "sans-serif" }}>
              <span>{items.length} gifts</span><span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #4ade80, #e8d5b0)", borderRadius: 2 }} />
            </div>
          </div>
        )}
        {r.eventDate && (
          <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "sans-serif" }}>
            📅 {new Date(r.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        )}
      </div>
    </Link>
  );
}

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

  const inp = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 16px", color: "#f0ede8", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" };

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
    const t = setTimeout(loadRegistries, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadRegistries]);

  const createRegistry = async () => {
    if (!form.ownerName || !form.ownerEmail || !form.occasion) {
      setError("Please fill in your name, email and select an occasion."); return;
    }
    setCreating(true); setError("");
    try {
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, title: form.title || `${form.ownerName}'s ${form.occasion} Registry` }),
      });
      const data = await res.json();
      if (res.ok) {
        // Store registry info for easy return
        const stored = JSON.parse(localStorage.getItem("my_registries") || "[]");
        stored.unshift({ id: data.id, slug: data.slug, title: data.title, email: form.ownerEmail });
        localStorage.setItem("my_registries", JSON.stringify(stored.slice(0, 10)));
        router.push(`/registry/dashboard?id=${data.id}&email=${encodeURIComponent(form.ownerEmail)}`);
      }
      else setError(data.error || "Failed to create registry.");
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

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "64px 24px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎁</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 800, color: "#f0ede8", lineHeight: 1.1, marginBottom: 14 }}>Gift Registry</h1>
        <p style={{ fontSize: 17, color: "#9a9690", maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.7, fontWeight: 300 }}>
          Create a wishlist for any occasion. Share it. Friends buy gifts — no duplicates, no guessing.
        </p>

        {/* Search bar */}
        <div style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setTab("browse"); }}
            placeholder="Search registries by name, occasion..."
            style={{ ...inp, padding: "14px 52px 14px 20px", fontSize: 15, borderRadius: 14 }}
          />
          <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#5a5650", fontSize: 18, pointerEvents: "none" }}>⌕</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 4, padding: "16px 0", borderBottom: "1px solid #1a1a1a", overflowX: "auto" }}>
          {[["browse", "🎊 Browse Registries"], ["create", "✨ Create Registry"], ["find", "🔍 Find by Email"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "9px 20px", border: "none", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
              background: tab === key ? "#e8d5b0" : "transparent",
              color: tab === key ? "#0a0a0a" : "#5a5650", transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* BROWSE TAB */}
        {tab === "browse" && (
          <div>
            {/* Occasion filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
              {OCCASIONS.map(o => (
                <button key={o.id} onClick={() => { setFilterOccasion(o.id); setSearch(""); }} style={{
                  padding: "7px 16px", borderRadius: 100, cursor: "pointer",
                  fontSize: 13, fontFamily: "inherit", border: `1px solid ${filterOccasion === o.id ? "#e8d5b0" : "#2a2a2a"}`,
                  background: filterOccasion === o.id ? "rgba(232,213,176,0.1)" : "#111",
                  color: filterOccasion === o.id ? "#e8d5b0" : "#9a9690", transition: "all 0.15s",
                }}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>Loading registries...</div>
            ) : registries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎁</div>
                <p style={{ marginBottom: 16 }}>No registries found{search ? ` for "${search}"` : ""}.</p>
                <button onClick={() => setTab("create")} style={{ padding: "10px 24px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Create the first one →
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: "#5a5650", marginBottom: 20, fontFamily: "sans-serif" }}>
                  {registries.length} registries{search ? ` matching "${search}"` : ""}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {registries.map(r => <RegistryCard key={r.id} r={r} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE TAB */}
        {tab === "create" && (
          <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#f0ede8", marginBottom: 4 }}>Create your registry</h2>
              <p style={{ fontSize: 13, color: "#5a5650" }}>Takes 60 seconds. Free forever.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Your name *</label>
                <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="Jane Doe" style={inp} />
              </div>
              <div>
                <label style={lbl}>Your email *</label>
                <input type="email" value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="jane@email.com" style={inp} />
              </div>
            </div>

            <div>
              <label style={lbl}>Occasion *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {OCCASION_CREATE.map(o => (
                  <button key={o.id} onClick={() => setForm(f => ({ ...f, occasion: o.label }))} style={{
                    padding: "10px 8px", textAlign: "center", cursor: "pointer", fontFamily: "inherit", borderRadius: 10,
                    border: `1px solid ${form.occasion === o.label ? "#e8d5b0" : "#2a2a2a"}`,
                    background: form.occasion === o.label ? "rgba(232,213,176,0.08)" : "#1a1a1a",
                    color: form.occasion === o.label ? "#e8d5b0" : "#9a9690", fontSize: 12, transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{o.emoji}</div>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Registry title (optional)</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={`${form.ownerName || "Your"}'s ${form.occasion || "Registry"}`} style={inp} />
              </div>
              <div>
                <label style={lbl}>Event date (optional)</label>
                <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} style={inp} />
              </div>
            </div>

            <div>
              <label style={lbl}>Message to guests (optional)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="A note for your friends and family..." rows={3} style={{ ...inp, resize: "vertical" }} />
            </div>

            {error && <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, fontSize: 13, color: "#f87171" }}>{error}</div>}

            <button onClick={createRegistry} disabled={creating} style={{ padding: "16px", background: creating ? "#2a2a2a" : "#e8d5b0", color: creating ? "#5a5650" : "#0a0a0a", borderRadius: 12, border: "none", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 16, cursor: creating ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
              {creating ? "Creating..." : "Create My Registry →"}
            </button>
          </div>
        )}

        {/* FIND BY EMAIL TAB */}
        {tab === "find" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#f0ede8", marginBottom: 8 }}>Find by email</h2>
            <p style={{ fontSize: 14, color: "#9a9690", marginBottom: 24 }}>Enter the registry owner's email to find their list.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input value={findEmail} onChange={e => setFindEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && findByEmail()} placeholder="owner@email.com" style={{ ...inp, flex: 1 }} />
              <button onClick={findByEmail} disabled={finding} style={{ padding: "12px 22px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                {finding ? "..." : "Search"}
              </button>
            </div>
            {foundRegistries !== null && (
              foundRegistries.length === 0 ? (
                <p style={{ color: "#5a5650", fontSize: 14 }}>No registries found for that email.</p>
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
