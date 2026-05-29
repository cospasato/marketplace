import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Marketplace — All Stores, One Place",
  description: "Browse products from all our partner stores in one unified marketplace.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
