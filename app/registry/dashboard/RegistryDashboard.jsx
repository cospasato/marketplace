"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const PRIORITY_LABELS = { high: "🔴 Must have", medium: "🟡 Would love", low: "🟢 Nice to have" };
const STATUS_COLORS = { available: "#4ade80", claimed: "#f59e0b", purchased: "#3b82f6" };

export default function RegistryDashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params?.get("id");

  const [registry, setRegistry] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");
  const [copied, setCopied] = useState(false);
  const [addingProduct, setAddingProduct] = useState(null);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");
  const [searchProducts, setSearchProducts] = useState("");

  // ── Load registry ────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) { setLoading(false); setError("No registry ID in URL."); return; }
    try {
      const res = await fetch(`/api/registry/${id}`);
      if (res.ok) {
        setRegistry(await res.json());
        setError("");
      } else {
        const d = await res.json();
        setError(d.error || "Registry not found.");
      }
    } catch {
      setError("Network error. Please refresh.");
    }
    setLoading(false);
  }, [id]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products?limit=100&sort=newest");
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
    loadProducts();
  }, [load, loadProducts]);

  // ── Actions ──────────────────────────────────────────────
  const flash = (text, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const addToRegistry = async (product) => {
    if (!id || addingProduct) return;
    setAddingProduct(product.id);
    try {
      const res = await fetch(`/api/registry/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          storeId: product.storeId || product.store?.id,
          title: product.title,
          imageUrl: product.imageUrl || null,
          productUrl: product.productUrl,
          price: product.price,
          currency: product.currency || "USD",
          quantity: 1,
          priority: "medium",
        }),
      });
      if (res.ok) {
        flash(`✓ "${product.title}" added to registry`);
        await load();
      } else {
        const d = await res.json();
        flash(d.error || "Failed to add", "error");
      }
    } catch {
      flash("Network error", "error");
    }
    setAddingProduct(null);
  };

  const removeItem = async (itemId, title) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/registry/${id}?itemId=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        flash(`"${title}" removed`);
        await load();
      }
    } catch {
      flash("Failed to remove", "error");
    }
  };

  const updateItemPriority = async (itemId, priority) => {
    try {
      const res = await fetch(`/api/registry/item/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) { await load(); flash("Priority updated"); }
    } catch {}
  };

  const toggleVisibility = async () => {
    if (!registry) return;
    try {
      const res = await fetch(`/api/registry/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !registry.isPublic }),
      });
      if (res.ok) { await load(); flash(`Registry ${!registry.isPublic ? "published" : "hidden"}`); }
    } catch {}
  };

  const copyLink = () => {
    if (!registry?.slug) return;
    const link = `${window.location.origin}/registry/${registry.slug}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ── Guards ───────────────────────────────────────────────
  if (!id) return (
    <div style={{ padding: "80px 24px", textAlign: "center", color: "#5a5650" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
      <p style={{ marginBottom: 16, color: "#f87171" }}>No registry ID provided.</p>
      <Link href="/registry" style={{ color: "#e8d5b0", fontSize: 14 }}>← Browse registries</Link>
    </div>
  );

  if (loading) return (
    <div style={{ padding: "80px 24px", textAlign: "center", color: "#5a5650" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #2a2a2a", borderTop: "3px solid #e8d5b0", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
      <div>Loading your registry...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !registry) return (
    <div style={{ padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
      <p style={{ color: "#f87171", marginBottom: 16 }}>{error || "Registry not found."}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={load} style={{ padding: "10px 20px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", cursor: "pointer", fontFamily: "inherit" }}>
          Try again
        </button>
        <Link href="/registry" style={{ padding: "10px 20px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
          ← Back to registries
        </Link>
      </div>
    </div>
  );

  // ── Derived data ─────────────────────────────────────────
  const items = registry.items || [];
  const contributions = registry.contributions || [];
  const purchased = items.filter(i => i.status === "purchased").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  const available = items.filter(i => i.status === "available").length;
  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/registry/${registry.slug}`
    : `/registry/${registry.slug}`;

  const filteredProducts = searchProducts.trim()
    ? products.filter(p => p.title?.toLowerCase().includes(searchProducts.toLowerCase()) || p.store?.storeName?.toLowerCase().includes(searchProducts.toLowerCase()))
    : products;

  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setActiveTab(key)} style={{
      padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer",
      fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
      background: activeTab === key ? "#e8d5b0" : "transparent",
      color: activeTab === key ? "#0a0a0a" : "#5a5650",
    }}>{label}</button>
  );

  const inp = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "9px 12px", color: "#f0ede8", fontSize: 13, fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#c4a870", letterSpacing: "0.12em", marginBottom: 4 }}>
            {(registry.occasion || "").toUpperCase()} REGISTRY
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#f0ede8", marginBottom: 4 }}>
            {registry.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#5a5650" }}>
            <span>{registry.ownerEmail}</span>
            {registry.eventDate && <span>· {new Date(registry.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>}
            <span style={{
              padding: "2px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
              background: registry.isPublic ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: registry.isPublic ? "#4ade80" : "#f87171",
              border: `1px solid ${registry.isPublic ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
            }}>
              {registry.isPublic ? "Public" : "Hidden"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={toggleVisibility} style={{ padding: "8px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {registry.isPublic ? "🙈 Hide" : "👁 Publish"}
          </button>
          <button onClick={copyLink} style={{ padding: "8px 14px", background: copied ? "rgba(74,222,128,0.1)" : "#1a1a1a", border: `1px solid ${copied ? "#4ade80" : "#2a2a2a"}`, borderRadius: 8, color: copied ? "#4ade80" : "#9a9690", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "✓ Copied!" : "🔗 Copy link"}
          </button>
          <a href={`/registry/live/${registry.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", background: "#1a1a1a", border: "1px solid rgba(196,168,112,0.3)", borderRadius: 8, color: "#c4a870", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            🔴 Live
          </a>
          <Link href={`/registry/${registry.slug}`} style={{ padding: "8px 14px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            Preview →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total", value: items.length, color: "#f0ede8" },
          { label: "Available", value: available, color: "#4ade80" },
          { label: "Claimed", value: claimed, color: "#f59e0b" },
          { label: "Purchased", value: purchased, color: "#3b82f6" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: "#5a5650", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Flash */}
      {msg && (
        <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 8, fontSize: 13,
          background: msg.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
          border: `1px solid ${msg.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
          color: msg.type === "error" ? "#f87171" : "#4ade80",
        }}>{msg.text}</div>
      )}

      {/* Share strip */}
      <div style={{ background: "rgba(232,213,176,0.04)", border: "1px solid rgba(232,213,176,0.12)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 10, color: "#c4a870", fontWeight: 700, marginBottom: 2, letterSpacing: "0.07em" }}>SHARE LINK</div>
          <div style={{ fontSize: 12, color: "#9a9690", fontFamily: "monospace", wordBreak: "break-all" }}>{shareLink}</div>
        </div>
        <a href={`https://wa.me/?text=${encodeURIComponent("My gift registry: " + shareLink)}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, color: "#9a9690", fontSize: 11, textDecoration: "none", fontWeight: 600 }}>WhatsApp</a>
        <a href={`mailto:?subject=My Gift Registry&body=${encodeURIComponent("Check my gift registry: " + shareLink)}`} style={{ padding: "6px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, color: "#9a9690", fontSize: 11, textDecoration: "none", fontWeight: 600 }}>Email</a>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#111", padding: 4, borderRadius: 10 }}>
        {tabBtn("items", `🎁 Items (${items.length})`)}
        {tabBtn("add", "➕ Add Products")}
        {tabBtn("gifters", `🤝 Gifters (${contributions.length})`)}
        {tabBtn("settings", "⚙️ Settings")}
      </div>

      {/* ── ITEMS TAB ─────────────────────────────── */}
      {activeTab === "items" && (
        <div>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🎁</div>
              <p style={{ marginBottom: 16, fontSize: 15 }}>Your registry is empty.</p>
              <p style={{ marginBottom: 24, fontSize: 13, color: "#3a3a3a" }}>Go to "Add Products" to add gifts from our partner stores.</p>
              <button onClick={() => setActiveTab("add")} style={{ padding: "11px 28px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
                Browse products →
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ position: "relative", aspectRatio: "4/3", background: "#1a1a1a" }}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 9px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                      background: `${STATUS_COLORS[item.status] || "#6b7280"}20`,
                      color: STATUS_COLORS[item.status] || "#6b7280",
                      border: `1px solid ${STATUS_COLORS[item.status] || "#6b7280"}40`,
                    }}>
                      {(item.status || "available").toUpperCase()}
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0ede8", marginBottom: 4, lineHeight: 1.3 }}>{item.title}</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 800, color: "#e8d5b0", marginBottom: 8 }}>
                      {item.currency || "USD"} {(item.price || 0).toFixed(2)}
                    </div>

                    {/* Priority selector */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                      {["high", "medium", "low"].map(p => (
                        <button key={p} onClick={() => updateItemPriority(item.id, p)} style={{
                          flex: 1, padding: "4px", fontSize: 10, border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
                          background: item.priority === p ? (p === "high" ? "rgba(248,113,113,0.2)" : p === "medium" ? "rgba(245,158,11,0.2)" : "rgba(74,222,128,0.2)") : "#1a1a1a",
                          color: item.priority === p ? (p === "high" ? "#f87171" : p === "medium" ? "#f59e0b" : "#4ade80") : "#5a5650",
                          border: `1px solid ${item.priority === p ? "currentColor" : "#2a2a2a"}`,
                        }}>
                          {p === "high" ? "🔴 Must" : p === "medium" ? "🟡 Love" : "🟢 Nice"}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={item.productUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "7px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, color: "#9a9690", fontSize: 12, textAlign: "center", textDecoration: "none", fontWeight: 600 }}>
                        View ↗
                      </a>
                      {item.status === "available" && (
                        <button onClick={() => removeItem(item.id, item.title)} style={{ padding: "7px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 7, color: "#f87171", fontSize: 12, cursor: "pointer" }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD PRODUCTS TAB ──────────────────────── */}
      {activeTab === "add" && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <input
              value={searchProducts}
              onChange={e => setSearchProducts(e.target.value)}
              placeholder="Search products by name or store..."
              style={{ ...inp, width: "100%", padding: "11px 16px", fontSize: 14 }}
            />
          </div>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <p>{products.length === 0 ? "No products synced yet. Ask admin to sync stores." : `No results for "${searchProducts}"`}</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#5a5650", marginBottom: 14 }}>{filteredProducts.length} products available · click any to add</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 45%), 1fr))", gap: 12 }}>
                {filteredProducts.map(product => {
                  const inRegistry = items.some(i => i.productId === product.id);
                  const isAdding = addingProduct === product.id;
                  return (
                    <div key={product.id} style={{ background: "#111", border: `1px solid ${inRegistry ? "rgba(74,222,128,0.3)" : "#1e1e1e"}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}
                      onMouseEnter={e => !inRegistry && (e.currentTarget.style.borderColor = "#2a2a2a")}
                      onMouseLeave={e => !inRegistry && (e.currentTarget.style.borderColor = "#1e1e1e")}
                    >
                      <div style={{ aspectRatio: "1", background: "#1a1a1a", position: "relative", overflow: "hidden" }}>
                        {product.imageUrl && <img src={product.imageUrl} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        {inRegistry && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>
                        )}
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#5a5650", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.store?.storeName || "Store"}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#f0ede8", marginBottom: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {product.title}
                        </div>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 800, color: "#e8d5b0", marginBottom: 8 }}>
                          {product.currency || "USD"} {(product.price || 0).toFixed(2)}
                        </div>
                        <button
                          onClick={() => !inRegistry && !isAdding && addToRegistry(product)}
                          disabled={inRegistry || isAdding}
                          style={{
                            width: "100%", padding: "7px", border: "none", borderRadius: 7, cursor: inRegistry || isAdding ? "default" : "pointer",
                            background: inRegistry ? "rgba(74,222,128,0.1)" : "#e8d5b0",
                            color: inRegistry ? "#4ade80" : "#0a0a0a",
                            fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                            opacity: isAdding ? 0.6 : 1, transition: "opacity 0.15s",
                          }}>
                          {inRegistry ? "✓ Added" : isAdding ? "Adding..." : "+ Add to registry"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── GIFTERS TAB ───────────────────────────── */}
      {activeTab === "gifters" && (
        <div>
          {contributions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🤝</div>
              <p>No gifters yet. Share your registry link!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contributions.map(c => (
                <div key={c.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 16, color: "#e8d5b0", flexShrink: 0 }}>
                    {(c.gifterName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0ede8" }}>{c.gifterName}</div>
                    <div style={{ fontSize: 12, color: "#5a5650" }}>
                      {c.item?.title ? `"${c.item.title}" · ` : ""}
                      <span style={{ color: c.status === "purchased" ? "#4ade80" : "#f59e0b" }}>
                        {c.status === "purchased" ? "✅ Purchased" : "🔖 Claimed"}
                      </span>
                    </div>
                    {c.message && <div style={{ fontSize: 12, color: "#9a9690", marginTop: 3, fontStyle: "italic" }}>"{c.message}"</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#3a3a3a" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ──────────────────────────── */}
      {activeTab === "settings" && (
        <RegistrySettings registry={registry} id={id} onSave={() => { load(); flash("Registry updated"); }} />
      )}
    </div>
  );
}

function RegistrySettings({ registry, id, onSave }) {
  const router = typeof window !== "undefined" ? { push: (url) => { window.location.href = url; } } : null;
  const [form, setForm] = useState({
    title: registry.title || "",
    occasion: registry.occasion || "",
    eventDate: registry.eventDate ? new Date(registry.eventDate).toISOString().slice(0, 10) : "",
    description: registry.description || "",
    thankYouMsg: registry.thankYouMsg || "",
    isPublic: registry.isPublic,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inp = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", color: "#f0ede8", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/registry/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) onSave();
    } catch {}
    setSaving(false);
  };

  const deleteRegistry = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/registry/${id}`, { method: "DELETE" });
      window.location.href = "/account/dashboard";
    } catch { setDeleting(false); }
  };

  return (
    <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>
      <div><label style={lbl}>Registry title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} /></div>
      <div><label style={lbl}>Occasion</label><input value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))} style={inp} /></div>
      <div><label style={lbl}>Event date</label><input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} style={inp} /></div>
      <div><label style={lbl}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
      <div><label style={lbl}>Thank you message (shown at bottom of registry)</label><textarea value={form.thankYouMsg} onChange={e => setForm(f => ({ ...f, thankYouMsg: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="Thank you for your love and support!" /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))} style={{ padding: "8px 16px", background: form.isPublic ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${form.isPublic ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 8, color: form.isPublic ? "#4ade80" : "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {form.isPublic ? "👁 Public — visible to all" : "🙈 Hidden — only you can see"}
        </button>
      </div>
      <button onClick={save} disabled={saving} style={{ padding: "13px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving..." : "Save changes"}
      </button>

      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 20, marginTop: 8 }}>
        <div style={{ fontSize: 12, color: "#5a5650", marginBottom: 12, fontWeight: 600 }}>DANGER ZONE</div>
        {confirmDelete ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={deleteRegistry} disabled={deleting} style={{ padding: "10px 18px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {deleting ? "Deleting..." : "Yes, delete permanently"}
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: "10px 18px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ padding: "10px 18px", background: "#1a1a1a", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Delete this registry
          </button>
        )}
      </div>
    </div>
  );
}
