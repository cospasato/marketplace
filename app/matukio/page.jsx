import { Suspense } from "react";
import MatukioHome from "./MatukioHome";
export const dynamic = "force-dynamic";
export default function MatukioPage() {
  return <Suspense fallback={<div style={{padding:"48px",textAlign:"center",color:"#6b7280"}}>Loading...</div>}><MatukioHome /></Suspense>;
}
