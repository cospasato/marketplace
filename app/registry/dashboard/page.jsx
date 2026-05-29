"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const PRIORITY_LABELS = { high: "🔴 Must have", medium: "🟡 Would love", low: "🟢 Nice to have" };
const STATUS_COLORS = { available: "#4ade80", claimed: "#f59e0b", purchased: "#3b82f6" };

export default function RegistryDashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const email = params.get("email");

  const [registry, setRegistry] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");
  const [copied, setCopied] = useState(false);
  const [addingProduct, setAddingProduct] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    if (!id) return;
    const res = await fetch(`/api/registry/${id}`);
    if (res.ok) setRegistry(await res.json());
    setLoading(false);
  };

  const loadProducts = async () => {
    const res = await fetch("/api/products?limit=48");
    if (res.ok) { const d = await res.json(); setProducts(d.products || []); }
  };

  useEffect(() => { load(); loadProducts(); }, [id]);

  const flash = (text, type = "ok") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const addToRegistry = async (product) => {
    setAddingProduct(product.id);
    const res = await fetch(`/api/registry/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        storeId: product.storeId,
        title: product.title,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        price: product.price,
        currency: product.currency,
        quantity: 1,
        priority: "medium",
      }),
    });
    setAddingProduct(null);
    if (res.ok) { flash(`"${product.title}" added to registry`); await load(); }
    else flash("Failed to add product", "error");
  };

  const removeItem = async (itemId) => {
    await fetch(`/api/registry/${id}?itemId=${itemId}`, { method: "DELETE" });
    await load();
    flash("Item removed");
  };

  const copyLink = () => {
    if (!registry) return;
    navigator.clipboard.writeText(`${window.location.origin}/registry/${registry.slug}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = registry ? `${typeof window !== "undefined" ? window.location.origin : ""}/registry/${registry.slug}` : "";

  const purchased = registry?.items?.filter(i => i.status === "purchased").length || 0;
  const claimed = registry?.items?.filter(i => i.status === "claimed").length || 0;
  const available = registry?.items?.filter(i => i.status === "available").length || 0;
  const totalValue = registry?.items?.reduce((s, i) => s + i.price, 0) || 0;

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "#5a5650" }}>Loading your registry...</div>;
  if (!registry) return <div style={{ padding: 80, textAlign: "center", color: "#f87171" }}>Registry not found.</div>;

  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setActiveTab(key)} style={{
      padding: "9px 20px", border: "none", borderRadius: 8, cursor: "pointer",
      fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
      background: activeTab === key ? "#e8d5b0" : "transparent",
      color: activeTab === key ? "#0a0a0a" : "#5a5650",
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#c4a870", letterSpacing: "0.12em", marginBottom: 6 }}>
            {registry.occasion.toUpperCase()} REGISTRY
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#f0ede8", marginBottom: 6 }}>{registry.title}</h1>
          <p style={{ fontSize: 13, color: "#5a5650" }}>
            by {registry.ownerEmail}
            {registry.eventDate && ` · ${new Date(registry.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <button onClick={copyLink} style={{ padding: "9px 18px", background: copied ? "rgba(74,222,128,0.1)" : "#1a1a1a", border: `1px solid ${copied ? "#4ade80" : "#2a2a2a"}`, borderRadius: 10, color: copied ? "#4ade80" : "#9a9690", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            {copied ? "✓ Copied!" : "🔗 Copy link"}
          </button>
          <Link href={`/registry/${registry.slug}`} style={{ padding: "9px 18px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            Preview →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total items", value: registry.items?.length || 0, color: "#f0ede8" },
          { label: "Available", value: available, color: "#4ade80" },
          { label: "Claimed", value: claimed, color: "#f59e0b" },
          { label: "Purchased", value: purchased, color: "#3b82f6" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#5a5650", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Flash */}
      {msg && <div style={{ marginBottom: 16, padding: "10px 16px", background: msg.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", border: `1px solid ${msg.type === "error" ? "rgba(248,113,113,0.25)" : "rgba(74,222,128,0.25)"}`, borderRadius: 8, fontSize: 13, color: msg.type === "error" ? "#f87171" : "#4ade80" }}>{msg.text}</div>}

      {/* Share box */}
      <div style={{ background: "rgba(232,213,176,0.05)", border: "1px solid rgba(232,213,176,0.15)", borderRadius: 14, padding: "18px 22px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 24 }}>🔗</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#c4a870", marginBottom: 4 }}>YOUR REGISTRY LINK</div>
          <div style={{ fontSize: 13, color: "#9a9690", fontFamily: "monospace", wordBreak: "break-all" }}>{shareLink}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <a href={`https://wa.me/?text=Check%20my%20registry%3A%20${encodeURIComponent(shareLink)}`} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>WhatsApp</a>
          <a href={`mailto:?subject=My%20Gift%20Registry&body=Hi!%20I've%20created%20a%20gift%20registry%3A%20${encodeURIComponent(shareLink)}`} style={{ padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>Email</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#111", padding: 4, borderRadius: 12 }}>
        {tabBtn("items", `🎁 My Items (${registry.items?.length || 0})`)}
        {tabBtn("add", "➕ Add Products")}
        {tabBtn("gifters", `🤝 Gifters (${registry.contributions?.length || 0})`)}
      </div>

      {/* Items tab */}
      {activeTab === "items" && (
        <div>
          {registry.items?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
              <p style={{ marginBottom: 16 }}>No items yet. Add products from our partner stores!</p>
              <button onClick={() => setActiveTab("add")} style={{ padding: "10px 24px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Browse products →</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {registry.items.map(item => (
                <div key={item.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ position: "relative", aspectRatio: "16/9", background: "#1a1a1a" }}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 100, background: `${STATUS_COLORS[item.status]}18`, color: STATUS_COLORS[item.status], fontSize: 10, fontWeight: 700, border: `1px solid ${STATUS_COLORS[item.status]}30` }}>
                      {item.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#c4a870", marginBottom: 4 }}>{PRIORITY_LABELS[item.priority]}</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#f0ede8", marginBottom: 6, lineHeight: 1.3 }}>{item.title}</div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 800, color: "#e8d5b0", marginBottom: item.note ? 8 : 0 }}>{item.currency} {item.price.toFixed(2)}</div>
                    {item.note && <p style={{ fontSize: 12, color: "#5a5650", marginBottom: 8, lineHeight: 1.5 }}>{item.note}</p>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={item.productUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "7px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#9a9690", fontSize: 12, textAlign: "center", textDecoration: "none", fontWeight: 600 }}>View product ↗</a>
                      <button onClick={() => removeItem(item.id)} style={{ padding: "7px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, cursor: "pointer" }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add products tab */}
      {activeTab === "add" && (
        <div>
          <p style={{ fontSize: 14, color: "#9a9690", marginBottom: 24 }}>Click any product to add it to your registry instantly.</p>
          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#5a5650" }}>Loading products...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {products.map(product => {
                const inRegistry = registry.items?.some(i => i.productId === product.id);
                return (
                  <div key={product.id} style={{ background: "#111", border: `1px solid ${inRegistry ? "#4ade8040" : "#1e1e1e"}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ aspectRatio: "1", background: "#1a1a1a", position: "relative" }}>
                      {product.imageUrl && <img src={product.imageUrl} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      {inRegistry && <div style={{ position: "absolute", inset: 0, background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: "#5a5650", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{product.store?.storeName}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f0ede8", marginBottom: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.title}</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 800, color: "#e8d5b0", marginBottom: 10 }}>{product.currency} {product.price.toFixed(2)}</div>
                      <button
                        onClick={() => !inRegistry && addToRegistry(product)}
                        disabled={inRegistry || addingProduct === product.id}
                        style={{
                          width: "100%", padding: "8px", border: "none", borderRadius: 8, cursor: inRegistry ? "default" : "pointer",
                          background: inRegistry ? "rgba(74,222,128,0.1)" : "#e8d5b0",
                          color: inRegistry ? "#4ade80" : "#0a0a0a",
                          fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                          opacity: addingProduct === product.id ? 0.7 : 1,
                        }}>
                        {inRegistry ? "✓ In registry" : addingProduct === product.id ? "Adding..." : "+ Add to registry"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gifters tab */}
      {activeTab === "gifters" && (
        <div>
          {registry.contributions?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
              <p>No gifters yet. Share your registry link to get started!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {registry.contributions.map(c => (
                <div key={c.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 16, color: "#e8d5b0", flexShrink: 0 }}>
                    {c.gifterName[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0ede8" }}>{c.gifterName}</div>
                    <div style={{ fontSize: 12, color: "#5a5650" }}>
                      {c.item?.title && `"${c.item.title}" · `}
                      {c.status === "purchased" ? "✅ Purchased" : "🔖 Claimed"}
                    </div>
                    {c.message && <div style={{ fontSize: 12, color: "#9a9690", marginTop: 4, fontStyle: "italic" }}>"{c.message}"</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#3a3a3a" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
