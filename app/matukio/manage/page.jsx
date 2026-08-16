import { Suspense } from "react";
import MatukioManage from "./MatukioManage";
export const dynamic = "force-dynamic";
export default function MatukioManagePage() {
  return <Suspense fallback={<div style={{padding:"48px",textAlign:"center"}}>Loading...</div>}><MatukioManage /></Suspense>;
}
