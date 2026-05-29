import { Suspense } from "react";
import RegistryHomeClient from "./RegistryHomeClient";

export const dynamic = "force-dynamic";

export default function RegistryPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "#5a5650" }}>Loading...</div>}>
      <RegistryHomeClient />
    </Suspense>
  );
}
