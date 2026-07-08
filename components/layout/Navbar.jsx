"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/search", label: "Search" },
    { href: "/registry", label: "🎁 Registry" },
  ];

  const isActive = (href) => href === "/" ? path === "/" : path.startsWith(href);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(12,11,10,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        height: 58, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 8,
      }}>
        {/* Logo */}
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--accent)", letterSpacing: "-0.02em", flexShrink: 0, marginRight: 8 }}>
          MARKET
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", gap: 2, flex: 1 }} className="hide-mobile">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: "6px 13px", borderRadius: "var(--radius)",
              fontSize: 14, fontWeight: isActive(href) ? 600 : 400,
              color: isActive(href) ? "var(--accent)" : "var(--text2)",
              background: isActive(href) ? "var(--accent3)" : "transparent",
              transition: "all 0.15s",
            }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <Link href="/account/dashboard" className="hide-mobile" style={{
          padding: "7px 14px", borderRadius: "var(--radius)",
          border: "1px solid var(--border2)",
          fontSize: 13, color: "var(--text2)", fontWeight: 500,
          transition: "all 0.15s",
        }}>
          My Registry
        </Link>
        <Link href="/admin" style={{
          padding: "7px 14px", borderRadius: "var(--radius)",
          background: "var(--bg3)", border: "1px solid var(--border2)",
          fontSize: 13, color: "var(--text2)", fontWeight: 500,
        }}>
          Admin
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ padding: 8, color: "var(--text2)", fontSize: 18, lineHeight: 1 }}
          className="show-mobile-flex"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: "fixed", top: 58, left: 0, right: 0, zIndex: 99,
          background: "rgba(12,11,10,0.98)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)", padding: "12px 16px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          boxShadow: "var(--shadow-lg)",
        }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              padding: "12px 14px", borderRadius: "var(--radius-lg)", fontSize: 15,
              color: isActive(href) ? "var(--accent)" : "var(--text)",
              background: isActive(href) ? "var(--accent3)" : "transparent",
              fontWeight: isActive(href) ? 600 : 400,
            }}>
              {label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 6, display: "flex", gap: 8 }}>
            <Link href="/account/dashboard" onClick={() => setOpen(false)} style={{ flex: 1, padding: "10px", textAlign: "center", background: "var(--bg3)", borderRadius: "var(--radius)", color: "var(--text2)", fontSize: 13, border: "1px solid var(--border2)" }}>My Registry</Link>
            <Link href="/admin" onClick={() => setOpen(false)} style={{ flex: 1, padding: "10px", textAlign: "center", background: "var(--bg3)", borderRadius: "var(--radius)", color: "var(--text2)", fontSize: 13, border: "1px solid var(--border2)" }}>Admin</Link>
          </div>
        </div>
      )}

      <style>{`
        .hide-mobile { display: flex; }
        .show-mobile-flex { display: none; }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile-flex { display: flex !important; }
        }
      `}</style>
    </>
  );
}
