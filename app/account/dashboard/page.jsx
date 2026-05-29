"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountDashboard() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("registries");
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const flash = (text, type = "ok") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  useEffect(() => {
    const token = localStorage.getItem("registry_token");
    if (!token) { router.push("/account/login"); return; }
    fetch("/api/account/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { router.push("/account/login"); return; }
        setAccount(data.account);
        setRegistries(data.registries || []);
        setProfileForm({ name: data.account.name, phone: data.account.phone || "" });
      })
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const token = localStorage.getItem("registry_token");
    const res = await fetch("/api/account/me", {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      const data = await res.json();
      setAccount(data.account);
      localStorage.setItem("registry_account", JSON.stringify(data.account));
      setEditProfile(false);
      flash("Profile updated");
    } else flash("Failed to update", "error");
    setSaving(false);
  };

  const logout = () => {
    localStorage.removeItem("registry_token");
    localStorage.removeItem("registry_account");
    router.push("/registry");
  };

  const toggleVisibility = async (regId, current) => {
    const token = localStorage.getItem("registry_token");
    const res = await fetch(`/api/registry/${regId}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isPublic: !current }),
    });
    if (res.ok) {
      setRegistries(prev => prev.map(r => r.id === regId ? { ...r, isPublic: !current } : r));
      flash(`Registry ${!current ? "published" : "hidden"}`);
    }
  };

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "#5a5650" }}>Loading your account...</div>;
  if (!account) return null;

  const inp = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "11px 14px", color: "#f0ede8", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };
  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setTab(key)} style={{ padding: "9px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: tab === key ? "#e8d5b0" : "transparent", color: tab === key ? "#0a0a0a" : "#5a5650", transition: "all 0.15s" }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 20, color: "#e8d5b0" }}>
            {account.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#f0ede8" }}>{account.name}</div>
            <div style={{ fontSize: 12, color: "#5a5650" }}>{account.email}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/registry" style={{ padding: "8px 16px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>+ New Registry</Link>
          <button onClick={logout} style={{ padding: "8px 16px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 13, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, fontSize: 13, background: msg.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", border: `1px solid ${msg.type === "error" ? "rgba(248,113,113,0.25)" : "rgba(74,222,128,0.25)"}`, color: msg.type === "error" ? "#f87171" : "#4ade80" }}>{msg.text}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#111", padding: 4, borderRadius: 12 }}>
        {tabBtn("registries", `🎁 My Registries (${registries.length})`)}
        {tabBtn("profile", "👤 Profile")}
      </div>

      {/* Registries tab */}
      {tab === "registries" && (
        <div>
          {registries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
              <p style={{ marginBottom: 16 }}>You haven't created any registries yet.</p>
              <Link href="/registry?tab=create" style={{ padding: "10px 24px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Create your first registry →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {registries.map(reg => {
                const items = reg.items || [];
                const purchased = items.filter(i => i.status === "purchased").length;
                const claimed = items.filter(i => i.status === "claimed").length;
                const contribs = reg.contributions || [];
                const totalGifted = contribs.filter(c => c.payment?.status === "verified").reduce((s, c) => s + (c.payment?.totalAmount || 0), 0);
                const progress = items.length > 0 ? Math.round(((purchased + claimed) / items.length) * 100) : 0;
                const emoji = { "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" }[reg.occasion] || "🎁";

                return (
                  <div key={reg.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 28, flexShrink: 0 }}>{emoji}</div>
                        <div>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#f0ede8", marginBottom: 4 }}>{reg.title}</div>
                          <div style={{ fontSize: 12, color: "#5a5650" }}>
                            {reg.occasion}
                            {reg.eventDate && ` · ${new Date(reg.eventDate).toLocaleDateString()}`}
                            <span style={{ marginLeft: 10, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: reg.isPublic ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: reg.isPublic ? "#4ade80" : "#f87171" }}>
                              {reg.isPublic ? "Public" : "Hidden"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                        <Link href={`/registry/dashboard?id=${reg.id}&email=${encodeURIComponent(account.email)}`} style={{ padding: "7px 14px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Manage</Link>
                        <a href={`/registry/live/${reg.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#c4a870", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🔴 Live</a>
                        <Link href={`/registry/${reg.slug}`} style={{ padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Preview</Link>
                        <button onClick={() => toggleVisibility(reg.id, reg.isPublic)} style={{ padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, cursor: "pointer" }}>
                          {reg.isPublic ? "Hide" : "Publish"}
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
                      {[
                        { label: "Items", value: items.length },
                        { label: "Claimed", value: claimed, color: "#f59e0b" },
                        { label: "Purchased", value: purchased, color: "#4ade80" },
                        { label: "Gifters", value: contribs.length },
                        { label: "Gifted (verified)", value: `USD ${totalGifted.toFixed(0)}`, color: "#4ade80" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 800, color: color || "#f0ede8" }}>{value}</div>
                          <div style={{ fontSize: 10, color: "#5a5650", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress */}
                    {items.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #4ade80, #e8d5b0)", borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#5a5650", marginTop: 4 }}>{progress}% complete</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === "profile" && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#f0ede8" }}>Profile details</h3>
              <button onClick={() => setEditProfile(!editProfile)} style={{ padding: "6px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, cursor: "pointer" }}>
                {editProfile ? "Cancel" : "Edit"}
              </button>
            </div>

            {editProfile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Name</label>
                  <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Phone</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
                </div>
                <button onClick={saveProfile} disabled={saving} style={{ padding: "12px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[["Name", account.name], ["Email", account.email], ["Phone", account.phone || "—"]].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <span style={{ fontSize: 12, color: "#5a5650" }}>{label}</span>
                    <span style={{ fontSize: 14, color: "#f0ede8" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
