"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(10,10,10,0.92)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
      height: 60,
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 4,
    }}>
      <Link href="/" style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "var(--accent)", marginRight: 16, flexShrink: 0 }}>
        MARKET
      </Link>

      <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "center" }}>
        {[
          { href: "/", label: "Home" },
          { href: "/products", label: "Products" },
          { href: "/search", label: "Search" },
          { href: "/registry", label: "🎁 Gift Registry" },
        ].map(({ href, label }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              padding: "6px 14px", borderRadius: "var(--radius)",
              fontSize: 14, fontWeight: 400,
              color: active ? "var(--accent)" : "var(--text2)",
              background: active ? "rgba(232,213,176,0.08)" : "transparent",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              {label}
            </Link>
          );
        })}
      </div>

      <Link href="/account/dashboard" style={{ padding: "7px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border2)", fontSize: 13, color: "var(--text2)", fontWeight: 500, flexShrink: 0, transition: "all 0.15s" }}>
        My Registry
      </Link>
      <Link href="/admin" style={{
        padding: "7px 16px", borderRadius: "var(--radius)",
        border: "1px solid var(--border2)", fontSize: 13,
        color: "var(--text2)", fontWeight: 500, flexShrink: 0,
        transition: "all 0.15s",
      }}>
        Admin
      </Link>
    </nav>
  );
}
