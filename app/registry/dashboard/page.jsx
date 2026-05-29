import { Suspense } from "react";
import RegistryDashboard from "./RegistryDashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "#5a5650" }}>Loading your registry...</div>}>
      <RegistryDashboard />
    </Suspense>
  );
}
