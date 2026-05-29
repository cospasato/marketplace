import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

export default function PayPage({ params }) {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "#5a5650" }}>Loading payment...</div>}>
      <PaymentClient contributionId={params.contributionId} />
    </Suspense>
  );
}
