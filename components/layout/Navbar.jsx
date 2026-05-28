"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const isViewer = path.startsWith("/store/");

  if (isViewer) return null; // viewer has its own nav

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(10,10,10,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      height: 60,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 32,
    }}>
      <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: "var(--accent)" }}>
        MARKET
      </Link>

      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {[
          { href: "/", label: "Home" },
          { href: "/products", label: "All Products" },
          { href: "/search", label: "Search" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: "6px 14px",
            borderRadius: "var(--radius)",
            fontSize: 14,
            fontWeight: 400,
            color: path === href ? "var(--accent)" : "var(--text2)",
            background: path === href ? "rgba(232,213,176,0.08)" : "transparent",
            transition: "all 0.15s",
          }}>
            {label}
          </Link>
        ))}
      </div>

      <Link href="/admin" style={{
        padding: "7px 16px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border2)",
        fontSize: 13,
        color: "var(--text2)",
        fontWeight: 500,
        transition: "all 0.15s",
      }}>
        Admin
      </Link>
    </nav>
  );
}
