import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "NIZAWADIE — Self Service Gift Registry Platform",
  description: "Create a gift registry for weddings, birthdays, baby showers and more. Share with loved ones. Receive exactly what you wish for.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
      <style>{`
        .occasion-card:hover { transform: translateY(-5px) !important; box-shadow: var(--shadow-lg) !important; }
        .registry-card:hover { transform: translateY(-4px) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important; }
        .nav-link:hover { color: var(--maroon) !important; }
        footer a:hover { color: var(--maroon) !important; }
      `}</style>
        <main>{children}</main>
        <footer style={{
          borderTop: "1px solid var(--border)",
          background: "var(--off-white)",
          padding: "32px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--maroon)", marginBottom: 4 }}>NIZAWADIE</div>
          <div style={{ fontSize: 11, color: "var(--gray)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Self Service Gift Registry Platform</div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", fontSize: 13, color: "var(--gray)" }}>
            <a href="/registry" style={{ color: "var(--gray)" }}>Gift Registry</a>
            <a href="/products" style={{ color: "var(--gray)" }}>Marketplace</a>
            <a href="/account/signup" style={{ color: "var(--gray)" }}>Create Account</a>
            <a href="/account/login" style={{ color: "var(--gray)" }}>Sign In</a>
          </div>
          <div style={{ fontSize: 11, color: "var(--gray-lt)", marginTop: 20 }}>© {new Date().getFullYear()} NIZAWADIE. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}
