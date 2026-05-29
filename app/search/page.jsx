import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "#5a5650" }}>Loading search...</div>}>
      <SearchClient />
    </Suspense>
  );
}
