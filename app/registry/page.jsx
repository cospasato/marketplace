"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OCCASIONS = [
  { id: "wedding", emoji: "💍", label: "Wedding" },
  { id: "baby-shower", emoji: "👶", label: "Baby Shower" },
  { id: "birthday", emoji: "🎂", label: "Birthday" },
  { id: "christmas", emoji: "🎄", label: "Christmas" },
  { id: "graduation", emoji: "🎓", label: "Graduation" },
  { id: "housewarming", emoji: "🏠", label: "Housewarming" },
  { id: "anniversary", emoji: "💝", label: "Anniversary" },
  { id: "other", emoji: "🎁", label: "Other" },
];

export default function RegistryHome() {
  const router = useRouter();
  const [tab, setTab] = useState("create");
  const [findEmail, setFindEmail] = useState("");
  const [form, setForm] = useState({ ownerName: "", ownerEmail: "", title: "", occasion: "", eventDate: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [finding, setFinding] = useState(false);
  const [foundRegistries, setFoundRegistries] = useState(null);
  const [error, setError] = useState("");

  const createRegistry = async () => {
    if (!form.ownerName || !form.ownerEmail || !form.occasion) {
      setError("Please fill in your name, email and occasion."); return;
    }
    setCreating(true); setError("");
    const res = await fetch("/api/registry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, title: form.title || `${form.ownerName}'s ${form.occasion}` }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) router.push(`/registry/dashboard?id=${data.id}&email=${encodeURIComponent(form.ownerEmail)}`);
    else setError(data.error || "Failed to create registry");
  };

  const findRegistry = async () => {
    setFinding(true);
    const res = await fetch(`/api/registry?email=${encodeURIComponent(findEmail)}`);
    const data = await res.json();
    setFinding(false);
    setFoundRegistries(data);
  };

  const inp = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 16px", color: "#f0ede8", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)", borderBottom: "1px solid #1a1a1a", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, color: "#f0ede8", lineHeight: 1.1, marginBottom: 16 }}>
          Gift Registry
        </h1>
        <p style={{ fontSize: 18, color: "#9a9690", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 300 }}>
          Create a registry for any occasion. Add products from any of our partner stores. Share with friends and family — no duplicate gifts.
        </p>

        {/* Occasions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 600, margin: "0 auto" }}>
          {OCCASIONS.map(o => (
            <div key={o.id} style={{ padding: "8px 18px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 100, fontSize: 14, color: "#9a9690", cursor: "pointer" }}
              onClick={() => { setForm(f => ({ ...f, occasion: o.label })); document.getElementById("create-form")?.scrollIntoView({ behavior: "smooth" }); }}>
              {o.emoji} {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main form area */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }} id="create-form">
        {/* Tabs */}
        <div style={{ display: "flex", background: "#111", padding: 4, borderRadius: 14, marginBottom: 32, gap: 4 }}>
          {[["create", "🎁 Create Registry"], ["find", "🔍 Find a Registry"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "12px", border: "none", borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              background: tab === key ? "#e8d5b0" : "transparent",
              color: tab === key ? "#0a0a0a" : "#5a5650",
              fontFamily: "inherit", transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>

        {/* Create tab */}
        {tab === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#f0ede8", marginBottom: 4 }}>Start your registry</h2>
            <p style={{ fontSize: 14, color: "#9a9690", marginBottom: 8 }}>Takes 60 seconds. No account needed.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                {OCCASIONS.map(o => (
                  <button key={o.id} onClick={() => setForm(f => ({ ...f, occasion: o.label }))} style={{
                    padding: "10px 8px", border: `1px solid ${form.occasion === o.label ? "#e8d5b0" : "#2a2a2a"}`,
                    borderRadius: 10, cursor: "pointer", textAlign: "center",
                    background: form.occasion === o.label ? "rgba(232,213,176,0.1)" : "#1a1a1a",
                    color: form.occasion === o.label ? "#e8d5b0" : "#9a9690",
                    fontSize: 12, fontFamily: "inherit", transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{o.emoji}</div>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Registry title (optional)</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={`${form.ownerName || "Your name"}'s ${form.occasion || "Registry"}`} style={inp} />
              </div>
              <div>
                <label style={lbl}>Event date (optional)</label>
                <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} style={inp} />
              </div>
            </div>

            <div>
              <label style={lbl}>Short description (optional)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="A note to your guests..." rows={3} style={{ ...inp, resize: "vertical" }} />
            </div>

            {error && <p style={{ fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(248,113,113,0.1)", borderRadius: 8 }}>{error}</p>}

            <button onClick={createRegistry} disabled={creating} style={{
              padding: "16px", background: "#e8d5b0", color: "#0a0a0a",
              borderRadius: 12, border: "none", fontFamily: "Georgia, serif",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
              opacity: creating ? 0.7 : 1, transition: "opacity 0.15s",
            }}>
              {creating ? "Creating..." : "Create My Registry →"}
            </button>
          </div>
        )}

        {/* Find tab */}
        {tab === "find" && (
          <div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#f0ede8", marginBottom: 8 }}>Find a registry</h2>
            <p style={{ fontSize: 14, color: "#9a9690", marginBottom: 24 }}>Enter the registry owner's email to find their list.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={findEmail} onChange={e => setFindEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && findRegistry()} placeholder="owner@email.com" style={{ ...inp, flex: 1 }} />
              <button onClick={findRegistry} disabled={finding} style={{ padding: "12px 24px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                {finding ? "Searching..." : "Search"}
              </button>
            </div>

            {foundRegistries !== null && (
              <div style={{ marginTop: 24 }}>
                {foundRegistries.length === 0 ? (
                  <p style={{ color: "#5a5650", fontSize: 14 }}>No registries found for that email.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {foundRegistries.map(r => (
                      <Link key={r.id} href={`/registry/${r.slug}`} style={{ textDecoration: "none" }}>
                        <div style={{ padding: "18px 20px", background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, transition: "border-color 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#2a2a2a"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#f0ede8", marginBottom: 4 }}>{r.title}</div>
                          <div style={{ fontSize: 13, color: "#5a5650" }}>
                            {r.occasion} · {r.items?.length || 0} items · by {r.ownerName}
                            {r.eventDate && ` · ${new Date(r.eventDate).toLocaleDateString()}`}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#f0ede8", textAlign: "center", marginBottom: 48 }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { n: "01", icon: "🎁", title: "Create your registry", desc: "Set up your list in 60 seconds. Choose your occasion, add details, and get a shareable link." },
              { n: "02", icon: "🛍", title: "Add gifts from any store", desc: "Browse products from all our partner Shopify stores and add them to your registry with one click." },
              { n: "03", icon: "🎊", title: "Share and celebrate", desc: "Share your registry link. Friends claim and buy gifts — no duplicates, no surprises about what you get." },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "28px 24px" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#c4a870", letterSpacing: "0.12em", marginBottom: 8 }}>STEP {n}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#f0ede8", marginBottom: 10 }}>{title}</div>
                <p style={{ fontSize: 13, color: "#9a9690", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
