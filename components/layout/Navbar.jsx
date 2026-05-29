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
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,10,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)", height: 56,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 8,
      }}>
        <Link href="/" style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 17, color: "var(--accent)", flexShrink: 0, letterSpacing: "-0.01em", textDecoration: "none" }}>
          MARKET
        </Link>

        {/* Desktop links */}
        <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "center" }} className="desktop-links">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 13, fontWeight: 400,
              color: isActive(href) ? "var(--accent)" : "var(--text2)",
              background: isActive(href) ? "rgba(232,213,176,0.08)" : "transparent",
              transition: "all 0.12s", textDecoration: "none", whiteSpace: "nowrap",
            }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ flex: 1 }} className="mobile-spacer" />

        <Link href="/account/dashboard" style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border2)", fontSize: 12, color: "var(--text2)", fontWeight: 500, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}>
          My Registry
        </Link>
        <Link href="/admin" style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border2)", fontSize: 12, color: "var(--text2)", fontWeight: 500, textDecoration: "none", flexShrink: 0 }}>
          Admin
        </Link>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: 6, fontSize: 18 }} className="hamburger">
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: "fixed", top: 56, left: 0, right: 0, zIndex: 49,
          background: "rgba(10,10,10,0.98)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)", padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              padding: "11px 14px", borderRadius: 8, fontSize: 15,
              color: isActive(href) ? "var(--accent)" : "var(--text2)",
              background: isActive(href) ? "rgba(232,213,176,0.06)" : "transparent",
              textDecoration: "none", display: "block",
            }}>
              {label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6, display: "flex", gap: 8 }}>
            <Link href="/account/dashboard" onClick={() => setOpen(false)} style={{ flex: 1, padding: "10px", textAlign: "center", background: "var(--bg3)", borderRadius: 8, color: "var(--text2)", fontSize: 13, textDecoration: "none" }}>My Registry</Link>
            <Link href="/admin" onClick={() => setOpen(false)} style={{ flex: 1, padding: "10px", textAlign: "center", background: "var(--bg3)", borderRadius: 8, color: "var(--text2)", fontSize: 13, textDecoration: "none" }}>Admin</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-links { display: none !important; }
          .mobile-spacer { display: flex !important; }
          .hamburger { display: flex !important; }
        }
        @media (min-width: 641px) {
          .mobile-spacer { display: none; }
          .hamburger { display: none !important; }
        }
      `}</style>
    </>
  );
}
