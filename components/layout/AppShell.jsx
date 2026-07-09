"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/",                  label: "Home",     icon: <HomeIcon /> },
  { href: "/registry",          label: "Registry", icon: <GiftIcon /> },
  { href: "/products",          label: "Shop",     icon: <ShopIcon /> },
  { href: "/search",            label: "Search",   icon: <SearchIcon /> },
  { href: "/account/dashboard", label: "Account",  icon: <UserIcon /> },
];

export default function AppShell({ children }) {
  const path = usePathname();
  const isAdmin = path.startsWith("/admin");
  const isLive  = path.startsWith("/registry/live");

  // Admin — full width, no chrome
  if (isAdmin) return (
    <div style={{ minHeight: "100vh", background: "#faf8f5" }}>
      {children}
    </div>
  );

  // Live dashboard — completely full screen
  if (isLive) return <div style={{ minHeight: "100vh" }}>{children}</div>;

  const isHome = path === "/";
  const active = (href) => href === "/" ? isHome : path.startsWith(href);
  const pageTitle = getPageTitle(path);

  return (
    <div className="layout-root">

      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR
      ══════════════════════════════════════ */}
      <aside className="layout-sidebar">
        {/* Brand */}
        <Link href="/" style={{ padding: "20px 20px 16px", display: "block", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, color: "var(--maroon)", lineHeight: 1 }}>NIZAWADIE</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3 }}>
            Self Service Platform
          </div>
        </Link>

        {/* Nav links */}
        <nav style={{ padding: "12px 10px", flex: 1 }}>
          {NAV.map(({ href, label, icon }) => {
            const on = active(href);
            return (
              <Link key={href} href={href} className={`sidebar-link${on ? " sidebar-link--active" : ""}`}>
                <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
          <Link href="/registry?tab=create" className="btn-primary" style={{ fontSize: 13, padding: "11px 14px", borderRadius: "var(--r-lg)", justifyContent: "flex-start", gap: 8 }}>
            <span>🎁</span> New Registry
          </Link>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginTop: 4, borderRadius: "var(--r-md)", fontSize: 13, color: "var(--text3)", transition: "all 0.14s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--cream)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span>⚙️</span> Admin Portal
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════ */}
      <div className="layout-main">

        {/* Desktop top bar */}
        <div className="layout-topbar">
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
              {pageTitle}
            </h1>
          </div>
          <Link href="/registry?tab=create" className="btn-primary" style={{ padding: "9px 20px", fontSize: 13, borderRadius: "var(--r-lg)" }}>
            + Create Registry
          </Link>
          <Link href="/account/dashboard" style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserIcon />
          </Link>
        </div>

        {/* Mobile header */}
        <div className="layout-mobileheader">
          <Link href="/" style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, color: "var(--maroon)" }}>NIZAWADIE</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Gift Registry</span>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/registry?tab=create" style={{ width: 34, height: 34, borderRadius: "var(--r-md)", background: "var(--maroon)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>+</Link>
            <Link href="/admin" style={{ width: 34, height: 34, borderRadius: "var(--r-md)", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚙️</Link>
          </div>
        </div>

        {/* Page content */}
        <div className="layout-page">
          {children}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ══════════════════════════════════════ */}
      <nav className="layout-tabbar">
        {NAV.map(({ href, label, icon }) => {
          const on = active(href);
          return (
            <Link key={href} href={href} className={`tab-item${on ? " tab-item--active" : ""}`}>
              <div className="tab-icon-wrap">{icon}</div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}

function getPageTitle(path) {
  if (path === "/") return "Home";
  if (path.startsWith("/registry/dashboard")) return "My Registry";
  if (path.startsWith("/registry")) return "Gift Registry";
  if (path.startsWith("/products")) return "Marketplace";
  if (path.startsWith("/search")) return "Search";
  if (path.startsWith("/account/dashboard")) return "My Account";
  if (path.startsWith("/account/login")) return "Sign In";
  if (path.startsWith("/account/signup")) return "Create Account";
  if (path.startsWith("/pay")) return "Complete Payment";
  return "NIZAWADIE";
}

/* ── SVG Icons ───────────────────────────────────────────────────────── */
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,12 20,22 4,22 4,12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  );
}
function ShopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
