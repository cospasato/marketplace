"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const TAB_ITEMS = [
  { href: "/",         icon: HomeIcon,     label: "Home"     },
  { href: "/registry", icon: GiftIcon,     label: "Registry" },
  { href: "/products", icon: ShopIcon,     label: "Shop"     },
  { href: "/search",   icon: SearchIcon,   label: "Search"   },
  { href: "/account/dashboard", icon: UserIcon, label: "Account" },
];

export default function AppShell({ children }) {
  const path = usePathname();

  const isAdmin = path.startsWith("/admin");
  const isLive  = path.startsWith("/registry/live");
  const hideTabs = isAdmin || isLive;

  // Admin gets its own layout
  if (isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f5" }}>
        {children}
      </div>
    );
  }

  // Live dashboard — full screen, no chrome
  if (isLive) {
    return <div style={{ minHeight: "100vh" }}>{children}</div>;
  }

  const isHome = path === "/";
  const activeTab = TAB_ITEMS.find(t =>
    t.href === "/" ? isHome : path.startsWith(t.href)
  )?.href;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", position: "relative", background: "#fdfbf8" }}>
      {/* Status bar spacer on mobile */}
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />

      {/* Top header */}
      <AppHeader path={path} />

      {/* Page content */}
      <div className="page-content">
        {children}
      </div>

      {/* Bottom tab bar */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        height: "calc(var(--tab-bar-h) + env(safe-area-inset-bottom, 0px))",
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "flex-start",
        paddingTop: 6,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 200,
      }}>
        {TAB_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? isHome : path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, padding: "6px 4px",
              color: active ? "var(--maroon)" : "var(--gray-lt)",
              transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: active ? "var(--maroon-bg)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, transform 0.12s",
              }}>
                <Icon size={20} active={active} />
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, lineHeight: 1, letterSpacing: "0.02em" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ── App header — context-aware ─────────────────────────────────────────────
function AppHeader({ path }) {
  const isHome = path === "/";
  const isRegistry = path.startsWith("/registry") && !path.startsWith("/registry/live");
  const isProducts = path.startsWith("/products");
  const isSearch = path.startsWith("/search");
  const isAccount = path.startsWith("/account");
  const isPay = path.startsWith("/pay");

  if (isPay) return null; // no header on payment page

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(253,251,248,0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      padding: "0 16px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      {isHome ? (
        <>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, color: "var(--maroon)", lineHeight: 1 }}>NIZAWADIE</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Gift Registry</div>
          </div>
          <Link href="/admin" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            ⚙️
          </Link>
        </>
      ) : isRegistry ? (
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Gift Registry</span>
          <Link href="/registry" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--maroon)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>+</span>
          </Link>
        </>
      ) : isProducts ? (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Marketplace</span>
      ) : isSearch ? (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>Search</span>
      ) : isAccount ? (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>My Account</span>
      ) : (
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, color: "var(--maroon)" }}>NIZAWADIE</div>
      )}
    </header>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
function HomeIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "var(--maroon)" : "none"} stroke={active ? "var(--maroon)" : "currentColor"} strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      {active
        ? <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        : <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9,22 9,12 15,12 15,22"/></>
      }
    </svg>
  );
}
function GiftIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "var(--maroon)" : "none"} stroke={active ? "var(--maroon)" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,12 20,22 4,22 4,12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  );
}
function ShopIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "var(--maroon)" : "none"} stroke={active ? "var(--maroon)" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}
function SearchIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "var(--maroon)" : "currentColor"} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function UserIcon({ size, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "var(--maroon)" : "none"} stroke={active ? "var(--maroon)" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
