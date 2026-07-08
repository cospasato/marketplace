"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/registry", label: "🎁 Gift Registry" },
    { href: "/products", label: "Marketplace" },
    { href: "/search", label: "Search" },
  ];

  const isActive = (href) => path.startsWith(href);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
        height: 62, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 8,
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: "flex", flexDirection: "column", lineHeight: 1, marginRight: 12, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--maroon)", letterSpacing: "-0.01em" }}>NIZAWADIE</span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.14em", color: "var(--gold)", textTransform: "uppercase", marginTop: 1 }}>Self Service Platform</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "center" }} className="hide-mobile">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: "7px 14px", borderRadius: "var(--radius)",
              fontSize: 14, fontWeight: isActive(href) ? 600 : 400,
              color: isActive(href) ? "var(--maroon)" : "var(--text2)",
              background: isActive(href) ? "var(--maroon-bg)" : "transparent",
              transition: "all 0.15s",
            }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <Link href="/account/dashboard" className="hide-mobile" style={{
          padding: "8px 16px", borderRadius: "var(--radius)",
          fontSize: 13, color: "var(--text2)", fontWeight: 500,
          border: "1px solid var(--border2)",
          transition: "all 0.15s", flexShrink: 0,
        }}>
          My Account
        </Link>

        <Link href="/registry" style={{
          padding: "9px 20px", borderRadius: "var(--radius-lg)",
          background: "var(--maroon)", color: "var(--white)",
          fontSize: 13, fontWeight: 600,
          transition: "all 0.15s", flexShrink: 0,
        }} className="hide-mobile">
          Create Registry
        </Link>

        <Link href="/admin" style={{
          padding: "7px 13px", borderRadius: "var(--radius)",
          background: "var(--bg2)", border: "1px solid var(--border2)",
          fontSize: 12, color: "var(--text3)", fontWeight: 500, flexShrink: 0,
        }}>
          Admin
        </Link>

        {/* Hamburger */}
        <button onClick={() => setOpen(!open)} style={{ padding: 8, color: "var(--text2)", fontSize: 20, lineHeight: 1 }} className="show-mobile">
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: "fixed", top: 62, left: 0, right: 0, zIndex: 99,
          background: "var(--white)", borderBottom: "1px solid var(--border)",
          padding: "12px 16px 18px", display: "flex", flexDirection: "column", gap: 4,
          boxShadow: "var(--shadow-lg)",
        }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              padding: "12px 16px", borderRadius: "var(--radius-lg)", fontSize: 15,
              color: isActive(href) ? "var(--maroon)" : "var(--text)",
              background: isActive(href) ? "var(--maroon-bg)" : "transparent",
              fontWeight: isActive(href) ? 600 : 400,
            }}>
              {label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 6, display: "flex", gap: 8 }}>
            <Link href="/registry" onClick={() => setOpen(false)} style={{ flex: 1, padding: "11px", textAlign: "center", background: "var(--maroon)", borderRadius: "var(--radius-lg)", color: "var(--white)", fontSize: 14, fontWeight: 600 }}>
              🎁 Create Registry
            </Link>
            <Link href="/account/dashboard" onClick={() => setOpen(false)} style={{ padding: "11px 16px", background: "var(--bg2)", borderRadius: "var(--radius-lg)", color: "var(--text2)", fontSize: 14, border: "1px solid var(--border2)" }}>
              Account
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
