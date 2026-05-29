"use client";
import { useState, useEffect } from "react";

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

const emptyStore = { shopDomain: "", customDomain: "", storeName: "", description: "", currency: "USD", primaryColor: "" };

export default function AdminPage() {
  const [stores, setStores] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ stores: 0, products: 0, syncs: 0 });
  const [form, setForm] = useState(emptyStore);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("stores");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    const [storesRes, logsRes, statsRes] = await Promise.all([
      fetch("/api/admin/stores"),
      fetch("/api/admin/logs"),
      fetch("/api/admin/stats"),
    ]);
    setStores(await storesRes.json());
    setLogs(await logsRes.json());
    setStats(await statsRes.json());
  };

  useEffect(() => { load(); }, []);

  const flash = (text, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const saveStore = async () => {
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/stores/${editing}` : "/api/admin/stores";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      flash(editing ? "Store updated" : "Store added — click Sync to pull products");
      setForm(emptyStore);
      setEditing(null);
      setTab("stores");
      await load();
    } else {
      const err = await res.json();
      flash(err.error || "Error saving store", "error");
    }
  };

  const deleteStore = async (id) => {
    const res = await fetch(`/api/admin/stores/${id}`, { method: "DELETE" });
    if (res.ok) { flash("Store removed"); setDeleteConfirm(null); await load(); }
  };

  const syncStore = async (id) => {
    setSyncing(id);
    const res = await fetch("/api/admin/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: id }),
    });
    const data = await res.json();
    setSyncing(null);
    if (data.ok) flash(data.message || "Sync complete");
    else flash(data.error || "Sync failed", "error");
    await load();
  };

  const syncAll = async () => {
    setSyncing("all");
    setSyncResult(null);
    const res = await fetch("/api/admin/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const data = await res.json();
    setSyncing(null);
    setSyncResult(data.results);
    await load();
  };

  const editStore = (store) => {
    setEditing(store.id);
    setForm({
      shopDomain: store.shopDomain,
      customDomain: store.customDomain || "",
      storeName: store.storeName,
      storefrontToken: store.storefrontToken,
      description: store.description || "",
      currency: store.currency,
      primaryColor: store.primaryColor || "",
    });
    setTab("add");
  };

  const tabStyle = (t) => ({
    padding: "8px 18px", borderRadius: "var(--radius)",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    color: tab === t ? "var(--accent)" : "var(--text3)",
    background: tab === t ? "rgba(232,213,176,0.08)" : "transparent",
    border: "1px solid transparent", transition: "all 0.15s",
  });

  const fields = [
    {
      key: "shopDomain",
      label: "Myshopify domain",
      placeholder: "your-store.myshopify.com",
      disabled: !!editing,
      note: "Must end in .myshopify.com — used for API calls",
    },
    {
      key: "customDomain",
      label: "Custom domain (optional)",
      placeholder: "berogenge.com",
      note: "If your store has a custom domain, enter it here for the embedded viewer",
    },
    { key: "storeName", label: "Store display name", placeholder: "My Awesome Store" },
    
    { key: "description", label: "Short description (optional)", placeholder: "Fashion & accessories" },
    { key: "currency", label: "Currency", placeholder: "USD" },
    { key: "primaryColor", label: "Brand color (optional)", placeholder: "#4a90e2" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent2)", marginBottom: 6 }}>ADMIN PANEL</div>
          <h1 style={{ fontSize: 28 }}>Marketplace Control</h1>
        </div>
        <button onClick={syncAll} disabled={!!syncing} style={{
          padding: "10px 22px",
          background: syncing ? "var(--bg4)" : "var(--accent)",
          color: syncing ? "var(--text3)" : "#0a0a0a",
          borderRadius: "var(--radius)", fontFamily: "var(--font-display)",
          fontWeight: 700, fontSize: 14, cursor: syncing ? "not-allowed" : "pointer",
        }}>
          {syncing === "all" ? "Syncing..." : "Sync All Stores"}
        </button>
      </div>

      {msg && (
        <div style={{
          marginBottom: 20, padding: "12px 18px",
          background: msg.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
          border: `1px solid ${msg.type === "error" ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.2)"}`,
          borderRadius: "var(--radius)", fontSize: 13,
          color: msg.type === "error" ? "var(--red)" : "var(--green)",
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        <StatCard label="Connected stores" value={stats.stores} />
        <StatCard label="Total products" value={stats.products.toLocaleString()} />
        <StatCard label="Sync operations" value={stats.syncs} sub="All time" />
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
        <button style={tabStyle("stores")} onClick={() => setTab("stores")}>Stores ({stores.length})</button>
        <button style={tabStyle("add")} onClick={() => { setTab("add"); setEditing(null); setForm(emptyStore); }}>
          {editing ? "Edit Store" : "+ Add Store"}
        </button>
        <button style={tabStyle("logs")} onClick={() => setTab("logs")}>Sync Logs</button>
      </div>

      {/* Stores list */}
      {tab === "stores" && (
        <div>
          {stores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)" }}>
              <p>No stores yet.</p>
              <button onClick={() => setTab("add")} style={{ marginTop: 16, color: "var(--accent)", fontSize: 14, cursor: "pointer", background: "none", border: "none" }}>+ Add store →</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stores.map((store) => (
                <div key={store.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "var(--radius)", background: store.primaryColor || "var(--bg4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--accent)", flexShrink: 0 }}>
                    {store.storeName[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{store.storeName}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 100, background: store.active ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: store.active ? "var(--green)" : "var(--red)", border: `1px solid ${store.active ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
                        {store.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>
                      {store.shopDomain}
                      {store.customDomain && <span style={{ color: "var(--accent2)", marginLeft: 8 }}>→ {store.customDomain}</span>}
                      {" · "}{store.productCount} products
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => syncStore(store.id)} disabled={syncing === store.id} style={{ padding: "7px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border2)", background: "transparent", color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {syncing === store.id ? "Syncing..." : "Sync"}
                    </button>
                    <button onClick={() => editStore(store)} style={{ padding: "7px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border2)", background: "transparent", color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                    {deleteConfirm === store.id ? (
                      <>
                        <button onClick={() => deleteStore(store.id)} style={{ padding: "7px 14px", borderRadius: "var(--radius)", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: "7px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "transparent", color: "var(--text3)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(store.id)} style={{ padding: "7px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "transparent", color: "var(--text3)", fontSize: 12, cursor: "pointer" }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {syncResult && (
            <div style={{ marginTop: 24, padding: 20, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Last sync results</div>
              {syncResult.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--text2)" }}>{r.store}</span>
                  <span style={{ color: r.status === "ok" ? "var(--green)" : "var(--red)" }}>
                    {r.status === "ok" ? `${r.count} products synced` : r.error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit store */}
      {tab === "add" && (
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: 20, marginBottom: 24 }}>{editing ? "Edit store" : "Connect a new store"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map(({ key, label, placeholder, disabled, note }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
                {note && <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>{note}</div>}
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  disabled={disabled && key === "shopDomain"}
                  style={{ opacity: disabled && key === "shopDomain" ? 0.5 : 1 }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={saveStore} disabled={saving} style={{ flex: 1, padding: "13px", background: "var(--accent)", color: "#0a0a0a", borderRadius: "var(--radius)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add store"}
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm(emptyStore); setTab("stores"); }} style={{ padding: "13px 20px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text2)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 14 }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {tab === "logs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {logs.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: 14 }}>No sync logs yet.</div>}
          {logs.map((log) => (
            <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: log.status === "success" ? "var(--green)" : "var(--red)" }} />
              <div style={{ flex: 1, color: "var(--text2)" }}>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>{log.store?.storeName || "Unknown"}</span>
                {" · "}{log.message}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 11 }}>{new Date(log.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
