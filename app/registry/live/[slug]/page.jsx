import { Suspense } from "react";
import LiveDashboard from "./LiveDashboard";

export const dynamic = "force-dynamic";

export default function LivePage({ params }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>
        Loading live dashboard...
      </div>
    }>
      <LiveDashboard slug={params.slug} />
    </Suspense>
  );
}
