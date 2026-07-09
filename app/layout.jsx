import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "NIZAWADIE",
  description: "Self Service Gift Registry Platform",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "NIZAWADIE" },
  themeColor: "#7b1c2e",
};

export default function RootLayout({ children }) {
  const isAdmin = false; // detected client-side in AppShell
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
