export const dynamic = "force-dynamic";
import { Suspense } from "react";
import MatukioPublicClient from "./MatukioPublicClient";
export default function MatukioPublicPage({ params }) {
  return <Suspense fallback={<div style={{padding:"48px",textAlign:"center"}}>Loading...</div>}><MatukioPublicClient slug={params.id} /></Suspense>;
}
