"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inp = { background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 16px", color: "var(--text)", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%" };

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/account/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("registry_token", data.token);
        localStorage.setItem("registry_account", JSON.stringify(data.account));
        router.push("/account/dashboard");
      } else setError(data.error || "Login failed");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px" }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 20 }}>🎁</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "var(--text)", marginBottom: 6, textAlign: "center" }}>Sign in</h1>
        <p style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", marginBottom: 28 }}>Access your gift registry</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Your password" style={inp} />
          </div>
        </div>

        {error && <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>{error}</div>}

        <button onClick={submit} disabled={loading} style={{ width: "100%", marginTop: 20, padding: "14px", background: "var(--accent)", color: "var(--bg)", borderRadius: 12, border: "none", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in..." : "Sign in →"}
        </button>

        <p style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", marginTop: 18 }}>
          No account? <Link href="/account/signup" style={{ color: "var(--accent)" }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
