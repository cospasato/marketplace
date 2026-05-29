"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Shared styles ───────────────────────────────────────────────────────────
const card = { background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "20px 22px" };
const badge = (color) => ({ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, letterSpacing: "0.06em", textTransform: "uppercase", background: `${color}18`, color, border: `1px solid ${color}30` });
const inputStyle = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#f0ede8", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" };
const btn = (bg, color = "#0a0a0a") => ({ padding: "8px 16px", background: bg, color, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "opacity 0.15s" });

const STATUS_COLORS = { pending: "#f59e0b", confirmed: "#3b82f6", out_for_delivery: "#8b5cf6", delivered: "#4ade80", cancelled: "#f87171", unassigned: "#6b7280" };
const STATUS_LABELS = { pending: "Pending", confirmed: "Confirmed", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", unassigned: "Unassigned" };

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#e8d5b0" }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a5650", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#5a5650", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function NotificationBell({ count, onClick }) {
  return (
    <button onClick={onClick} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
      <span style={{ fontSize: 22 }}>🔔</span>
      {count > 0 && (
        <span style={{ position: "absolute", top: -2, right: -4, background: "#f87171", color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// ─── Main admin page ──────────────────────────────────────────────────────────
const emptyStore = { shopDomain: "", customDomain: "", storeName: "", description: "", currency: "USD", primaryColor: "" };

export default function AdminPage() {
  const [tab, setTab] = useState("orders");
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ stores: 0, products: 0, syncs: 0, orders: 0, pending: 0, delivering: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [form, setForm] = useState(emptyStore);
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverForm, setDriverForm] = useState({ driverName: "", driverPhone: "", estimatedAt: "" });

  const load = useCallback(async () => {
    const [storesRes, logsRes, statsRes, ordersRes, notifsRes] = await Promise.all([
      fetch("/api/admin/stores"),
      fetch("/api/admin/logs"),
      fetch("/api/admin/stats"),
      fetch("/api/admin/orders"),
      fetch("/api/admin/notifications"),
    ]);
    setStores(await storesRes.json());
    setLogs(await logsRes.json());
    const s = await statsRes.json();
    const o = await ordersRes.json();
    const n = await notifsRes.json();
    setOrders(o);
    setStats({ ...s, orders: o.length, pending: o.filter(x => x.status === "pending").length, delivering: o.filter(x => x.deliveryStatus === "out_for_delivery").length });
    setNotifications(n.notifications || []);
    setUnread(n.unread || 0);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll for new orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const flash = (text, type = "ok") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 4000); };

  const saveStore = async () => {
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/stores/${editing}` : "/api/admin/stores";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { flash(editing ? "Store updated" : "Store added — click Sync to pull products"); setForm(emptyStore); setEditing(null); setTab("stores"); await load(); }
    else { const err = await res.json(); flash(err.error || "Error saving store", "error"); }
  };

  const syncStore = async (id) => {
    setSyncing(id);
    const res = await fetch("/api/admin/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId: id }) });
    const data = await res.json();
    setSyncing(null);
    if (data.ok) flash(data.message);
    else flash(data.error || "Sync failed", "error");
    await load();
  };

  const syncAll = async () => {
    setSyncing("all"); setSyncResult(null);
    const res = await fetch("/api/admin/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    const data = await res.json();
    setSyncing(null); setSyncResult(data.results); await load();
  };

  const updateOrder = async (id, updates) => {
    const res = await fetch("/api/admin/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    if (res.ok) { flash("Order updated"); await load(); setSelectedOrder(null); }
    else flash("Failed to update order", "error");
  };

  const markNotifsRead = async () => {
    await fetch("/api/admin/notifications", { method: "PUT" });
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const filteredOrders = orderFilter === "all" ? orders : orders.filter(o =>
    orderFilter === "pending" ? o.status === "pending" :
    orderFilter === "delivering" ? o.deliveryStatus === "out_for_delivery" :
    orderFilter === "delivered" ? o.deliveryStatus === "delivered" :
    o.status === orderFilter
  );

  const tabStyle = (t) => ({
    padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", transition: "all 0.15s",
    color: tab === t ? "#e8d5b0" : "#5a5650",
    background: tab === t ? "rgba(232,213,176,0.1)" : "transparent",
  });

  const fields = [
    { key: "shopDomain", label: "Myshopify domain *", placeholder: "your-store.myshopify.com", note: "Must end in .myshopify.com" },
    { key: "customDomain", label: "Custom domain (optional)", placeholder: "berogenge.com" },
    { key: "storeName", label: "Store display name *", placeholder: "My Awesome Store" },
    { key: "description", label: "Short description", placeholder: "Fashion & accessories" },
    { key: "currency", label: "Currency", placeholder: "USD" },
    { key: "primaryColor", label: "Brand color (hex)", placeholder: "#4a90e2" },
  ];

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 24px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#c4a870", marginBottom: 6 }}>MARKETPLACE ADMIN</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 800, color: "#f0ede8" }}>Control Center</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <NotificationBell count={unread} onClick={() => { setShowNotifs(!showNotifs); if (unread > 0) markNotifsRead(); }} />
            {showNotifs && (
              <div style={{ position: "absolute", right: 0, top: 40, width: 340, background: "#111", border: "1px solid #2a2a2a", borderRadius: 14, zIndex: 100, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e1e", fontSize: 13, fontWeight: 700, color: "#f0ede8" }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "#5a5650", fontSize: 13 }}>No notifications yet</div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1a", background: n.read ? "transparent" : "rgba(232,213,176,0.04)" }}>
                        <div style={{ fontSize: 12, color: n.read ? "#5a5650" : "#f0ede8", lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 3 }}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={syncAll} disabled={!!syncing} style={{ ...btn(syncing ? "#1a1a1a" : "#e8d5b0"), padding: "10px 20px", fontSize: 13 }}>
            {syncing === "all" ? "⟳ Syncing..." : "↺ Sync All Stores"}
          </button>
        </div>
      </div>

      {/* Flash */}
      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: msg.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", border: `1px solid ${msg.type === "error" ? "rgba(248,113,113,0.25)" : "rgba(74,222,128,0.25)"}`, borderRadius: 10, fontSize: 13, color: msg.type === "error" ? "#f87171" : "#4ade80" }}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 28 }}>
        <StatCard label="Stores" value={stats.stores} />
        <StatCard label="Products" value={stats.products?.toLocaleString()} />
        <StatCard label="Total Orders" value={stats.orders} color="#c4a870" />
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard label="Delivering" value={stats.delivering} color="#8b5cf6" />
        <StatCard label="Syncs" value={stats.syncs} color="#4ade80" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #1a1a1a", paddingBottom: 12 }}>
        {[
          { key: "orders", label: `🛍 Orders (${orders.length})` },
          { key: "delivery", label: `🚚 Delivery Board` },
          { key: "stores", label: `🏪 Stores (${stores.length})` },
          { key: "add", label: editing ? "✏️ Edit Store" : "＋ Add Store" },
          { key: "logs", label: "📋 Sync Logs" },
        ].map(({ key, label }) => (
          <button key={key} style={tabStyle(key)} onClick={() => { setTab(key); if (key === "add" && !editing) setForm(emptyStore); }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ─────────────────────────────────────────────── */}
      {tab === "orders" && (
        <div>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
            {[["all", "All"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["delivering", "Delivering"], ["delivered", "Delivered"]].map(([val, label]) => (
              <button key={val} onClick={() => setOrderFilter(val)} style={{ ...btn(orderFilter === val ? "#e8d5b0" : "#1a1a1a", orderFilter === val ? "#0a0a0a" : "#9a9690"), border: "1px solid #2a2a2a" }}>
                {label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p>No orders yet. When customers request delivery, orders appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredOrders.map(order => (
                <div key={order.id} style={{ ...card, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => { setSelectedOrder(order); setDriverForm({ driverName: order.driverName || "", driverPhone: order.driverPhone || "", estimatedAt: "" }); }}>
                  {/* Product image */}
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", background: "#1a1a1a", flexShrink: 0 }}>
                    {order.productImageUrl ? <img src={order.productImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0ede8", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.productTitle}</div>
                    <div style={{ fontSize: 12, color: "#5a5650" }}>
                      {order.customerName} · {order.deliveryCity}
                      {order.store && <span style={{ color: "#3a3a3a" }}> · {order.store.storeName}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 15, color: "#e8d5b0", marginBottom: 4 }}>
                      {order.currency} {(order.productPrice * order.quantity).toFixed(2)}
                    </div>
                    <span style={badge(STATUS_COLORS[order.deliveryStatus] || "#6b7280")}>{STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}</span>
                  </div>
                  <div style={{ color: "#3a3a3a", fontSize: 11, flexShrink: 0 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}

          {/* Order detail modal */}
          {selectedOrder && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setSelectedOrder(null)}>
              <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 20, padding: 28, maxWidth: 540, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#5a5650", marginBottom: 4, letterSpacing: "0.08em" }}>ORDER #{selectedOrder.id.slice(-6).toUpperCase()}</div>
                    <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#f0ede8" }}>{selectedOrder.productTitle}</h3>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", color: "#5a5650", cursor: "pointer", fontSize: 20 }}>✕</button>
                </div>

                {/* Customer info */}
                <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#5a5650", marginBottom: 10 }}>CUSTOMER</div>
                  <div style={{ fontSize: 13, color: "#f0ede8", marginBottom: 4 }}>{selectedOrder.customerName}</div>
                  <div style={{ fontSize: 12, color: "#9a9690" }}>{selectedOrder.customerEmail}</div>
                  {selectedOrder.customerPhone && <div style={{ fontSize: 12, color: "#9a9690" }}>{selectedOrder.customerPhone}</div>}
                </div>

                {/* Delivery info */}
                <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#5a5650", marginBottom: 10 }}>DELIVERY ADDRESS</div>
                  <div style={{ fontSize: 13, color: "#f0ede8" }}>{selectedOrder.deliveryAddress}</div>
                  <div style={{ fontSize: 12, color: "#9a9690" }}>{selectedOrder.deliveryCity}{selectedOrder.deliveryRegion && `, ${selectedOrder.deliveryRegion}`}</div>
                </div>

                {selectedOrder.notes && (
                  <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#5a5650", marginBottom: 6 }}>NOTES</div>
                    <div style={{ fontSize: 13, color: "#9a9690" }}>{selectedOrder.notes}</div>
                  </div>
                )}

                {/* Order value */}
                <div style={{ background: "rgba(232,213,176,0.06)", border: "1px solid rgba(232,213,176,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9a9690", marginBottom: 4 }}>
                    <span>{selectedOrder.productTitle}</span><span>x{selectedOrder.quantity}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 18, color: "#e8d5b0" }}>
                    <span>Total</span><span>{selectedOrder.currency} {(selectedOrder.productPrice * selectedOrder.quantity).toFixed(2)}</span>
                  </div>
                </div>

                {/* Driver assignment */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 10, letterSpacing: "0.08em" }}>ASSIGN DRIVER</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "#5a5650", display: "block", marginBottom: 4 }}>Driver name</label>
                      <input value={driverForm.driverName} onChange={e => setDriverForm(f => ({ ...f, driverName: e.target.value }))} placeholder="John Doe" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "#5a5650", display: "block", marginBottom: 4 }}>Driver phone</label>
                      <input value={driverForm.driverPhone} onChange={e => setDriverForm(f => ({ ...f, driverPhone: e.target.value }))} placeholder="+255 7xx xxx xxx" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#5a5650", display: "block", marginBottom: 4 }}>Estimated delivery time</label>
                    <input type="datetime-local" value={driverForm.estimatedAt} onChange={e => setDriverForm(f => ({ ...f, estimatedAt: e.target.value }))} style={inputStyle} />
                  </div>
                </div>

                {/* Status actions */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 10, letterSpacing: "0.08em" }}>UPDATE STATUS</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => updateOrder(selectedOrder.id, { status: "confirmed", deliveryStatus: "confirmed", ...driverForm })} style={btn("#3b82f6", "#fff")}>✓ Confirm</button>
                  <button onClick={() => updateOrder(selectedOrder.id, { deliveryStatus: "out_for_delivery", ...driverForm })} style={btn("#8b5cf6", "#fff")}>🚚 Out for Delivery</button>
                  <button onClick={() => updateOrder(selectedOrder.id, { status: "completed", deliveryStatus: "delivered" })} style={btn("#4ade80", "#0a0a0a")}>✅ Delivered</button>
                  <button onClick={() => updateOrder(selectedOrder.id, { status: "cancelled", deliveryStatus: "cancelled" })} style={btn("#f87171", "#fff")}>✕ Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DELIVERY BOARD TAB ─────────────────────────────────────── */}
      {tab === "delivery" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { key: "pending", label: "📥 New Orders", color: "#f59e0b" },
              { key: "confirmed", label: "✓ Confirmed", color: "#3b82f6" },
              { key: "out_for_delivery", label: "🚚 Out for Delivery", color: "#8b5cf6" },
              { key: "delivered", label: "✅ Delivered", color: "#4ade80" },
            ].map(({ key, label, color }) => {
              const colOrders = orders.filter(o => o.deliveryStatus === key || (key === "pending" && o.status === "pending" && o.deliveryStatus === "unassigned"));
              return (
                <div key={key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
                    <span style={{ fontSize: 11, background: `${color}18`, color, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>{colOrders.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {colOrders.map(order => (
                      <div key={order.id} onClick={() => { setSelectedOrder(order); setDriverForm({ driverName: order.driverName || "", driverPhone: order.driverPhone || "", estimatedAt: "" }); setTab("orders"); }}
                        style={{ background: "#111", border: `1px solid ${color}25`, borderRadius: 12, padding: "14px", cursor: "pointer", transition: "border-color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = `${color}60`}
                        onMouseLeave={e => e.currentTarget.style.borderColor = `${color}25`}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#f0ede8", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.productTitle}</div>
                        <div style={{ fontSize: 11, color: "#9a9690", marginBottom: 4 }}>👤 {order.customerName}</div>
                        <div style={{ fontSize: 11, color: "#9a9690", marginBottom: 4 }}>📍 {order.deliveryCity}</div>
                        {order.driverName && <div style={{ fontSize: 11, color: "#c4a870" }}>🏍 {order.driverName}</div>}
                        <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 6 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div style={{ background: "#0d0d0d", border: "1px dashed #1e1e1e", borderRadius: 12, padding: "20px 14px", textAlign: "center", color: "#3a3a3a", fontSize: 12 }}>Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STORES TAB ────────────────────────────────────────────── */}
      {tab === "stores" && (
        <div>
          {stores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>
              <p>No stores yet.</p>
              <button onClick={() => setTab("add")} style={{ marginTop: 12, ...btn("#e8d5b0"), padding: "10px 20px" }}>+ Add your first store</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stores.map(store => (
                <div key={store.id} style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: store.primaryColor || "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 18, color: "#e8d5b0", flexShrink: 0 }}>
                    {store.storeName[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0ede8", marginBottom: 3 }}>{store.storeName}</div>
                    <div style={{ fontSize: 11, color: "#5a5650" }}>
                      {store.shopDomain}
                      {store.customDomain && <span style={{ color: "#c4a870", marginLeft: 6 }}>→ {store.customDomain}</span>}
                      <span style={{ marginLeft: 8 }}>· {store.productCount} products</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => syncStore(store.id)} disabled={syncing === store.id} style={btn("#1a1a1a", "#9a9690")}>
                      {syncing === store.id ? "⟳" : "↺"} Sync
                    </button>
                    <button onClick={() => { setEditing(store.id); setForm({ shopDomain: store.shopDomain, customDomain: store.customDomain || "", storeName: store.storeName, description: store.description || "", currency: store.currency, primaryColor: store.primaryColor || "" }); setTab("add"); }} style={btn("#1a1a1a", "#9a9690")}>Edit</button>
                    {deleteConfirm === store.id ? (
                      <>
                        <button onClick={async () => { await fetch(`/api/admin/stores/${store.id}`, { method: "DELETE" }); setDeleteConfirm(null); flash("Store removed"); await load(); }} style={btn("rgba(248,113,113,0.15)", "#f87171")}>Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} style={btn("#1a1a1a", "#5a5650")}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(store.id)} style={btn("#1a1a1a", "#5a5650")}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {syncResult && (
            <div style={{ ...card, marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f0ede8", marginBottom: 12 }}>Last sync results</div>
              {syncResult.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1a1a1a", fontSize: 12 }}>
                  <span style={{ color: "#9a9690" }}>{r.store}</span>
                  <span style={{ color: r.status === "ok" ? "#4ade80" : "#f87171" }}>{r.status === "ok" ? `${r.count} products` : r.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD/EDIT STORE TAB ────────────────────────────────────── */}
      {tab === "add" && (
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 24, color: "#f0ede8" }}>{editing ? "Edit store" : "Connect a new store"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map(({ key, label, placeholder, note }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#5a5650", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
                {note && <div style={{ fontSize: 11, color: "#3a3a3a", marginBottom: 5 }}>{note}</div>}
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} disabled={!!editing && key === "shopDomain"} style={{ ...inputStyle, opacity: editing && key === "shopDomain" ? 0.5 : 1 }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={saveStore} disabled={saving} style={{ ...btn("#e8d5b0"), flex: 1, padding: "13px", fontSize: 15, fontFamily: "Georgia, serif", fontWeight: 800 }}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add store"}
              </button>
              {editing && <button onClick={() => { setEditing(null); setForm(emptyStore); setTab("stores"); }} style={{ ...btn("#1a1a1a", "#9a9690"), padding: "13px 20px" }}>Cancel</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── SYNC LOGS TAB ─────────────────────────────────────────── */}
      {tab === "logs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {logs.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "#5a5650" }}>No sync logs yet.</div>}
          {logs.map(log => (
            <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, fontSize: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: log.status === "success" ? "#4ade80" : "#f87171", flexShrink: 0 }} />
              <span style={{ color: "#f0ede8", fontWeight: 600 }}>{log.store?.storeName || "?"}</span>
              <span style={{ color: "#5a5650", flex: 1 }}>{log.message}</span>
              <span style={{ color: "#3a3a3a" }}>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
