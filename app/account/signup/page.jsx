"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inp = { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 16px", color: "#f0ede8", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#5a5650", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" };

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { setError("All fields required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/account/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("registry_token", data.token);
        localStorage.setItem("registry_account", JSON.stringify(data.account));
        router.push("/account/dashboard");
      } else setError(data.error || "Signup failed");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#111", border: "1px solid #1e1e1e", borderRadius: 20, padding: "36px 32px" }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 20 }}>🎁</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#f0ede8", marginBottom: 6, textAlign: "center" }}>Create account</h1>
        <p style={{ fontSize: 13, color: "#5a5650", textAlign: "center", marginBottom: 28 }}>Manage your gift registry</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={lbl}>Full name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" style={inp} /></div>
          <div><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" style={inp} /></div>
          <div><label style={lbl}>Password *</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} placeholder="At least 6 characters" style={inp} /></div>
          <div><label style={lbl}>Phone (optional)</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+255 7xx xxx xxx" style={inp} /></div>
        </div>

        {error && <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: 13, color: "#f87171" }}>{error}</div>}

        <button onClick={submit} disabled={loading} style={{ width: "100%", marginTop: 20, padding: "14px", background: "#e8d5b0", color: "#0a0a0a", borderRadius: 12, border: "none", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Creating..." : "Create account →"}
        </button>

        <p style={{ fontSize: 13, color: "#5a5650", textAlign: "center", marginTop: 18 }}>
          Already have an account? <Link href="/account/login" style={{ color: "#e8d5b0" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
