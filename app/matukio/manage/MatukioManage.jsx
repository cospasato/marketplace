"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

const EXPENSE_CATS = ["Funeral Expenses / Mazishi","Food / Chakula","Transport / Usafiri","Medical / Dawa","Hospital Bills / Bili ya Hospitali","Coffin / Jeneza","Tent & Chairs / Hema na Viti","Religious / Kidini","Communication","Other / Nyingine"];
const MODE_ICONS = { cash:"💵", mpesa:"📱", tigopesa:"📱", airtel:"📱", bank:"🏦", other:"💳" };
const SITUATIONS = { "Funeral / Msiba":"🕊️", "Sickness / Ugonjwa":"🙏", "Accident / Ajali":"🚑", "Fire / Moto":"🔥", "Displacement / Kukimbia":"🏕️", "Hardship / Shida":"🤲", "Other Support":"🤝" };

function money(n, cur="TZS") {
  return `${cur} ${Number(n||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
}

export default function MatukioManage() {
  const params = useSearchParams();
  const fundId = params?.get("id");
  const [fund,  setFund]  = useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,   setTab]   = useState("overview");
  const [msg,   setMsg]   = useState(null);
  const [approvingC, setApprovingC] = useState(null);
  const [addContrib, setAddContrib] = useState(false);
  const [cForm, setCForm] = useState({ name:"", phone:"", amount:"", paymentMode:"cash", reference:"", note:"", anonymous:false });
  const [savingC, setSavingC] = useState(false);
  const [deleteC, setDeleteC] = useState(null);
  const [addVendor, setAddVendor] = useState(false);
  const [vForm, setVForm] = useState({ name:"", category:EXPENSE_CATS[0], phone:"", totalAmount:"", dueDate:"", notes:"" });
  const [savingV, setSavingV] = useState(false);
  const [payVendor, setPayVendor] = useState(null);
  const [payForm, setPayForm] = useState({ amount:"", reference:"", note:"" });
  const [savingPay, setSavingPay] = useState(false);

  const flash = (text, type="ok") => { setMsg({text,type}); setTimeout(()=>setMsg(null),3200); };

  const load = useCallback(async () => {
    if (!fundId) return;
    const d = await fetch(`/api/michango/${fundId}`).then(r=>r.json()).catch(()=>({}));
    setFund(d); setLoading(false);
  }, [fundId]);

  useEffect(()=>{ load(); },[load]);

  const approveContrib = async (id, action) => {
    setApprovingC(id);
    await fetch("/api/michango/contributors",{ method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,action,approvedBy:fund?.organiserName}) });
    flash(action==="approve"?"✅ Confirmed":"Rejected"); setApprovingC(null); await load();
  };

  if (!fundId) return <div style={{padding:"48px",textAlign:"center",color:"#b91c1c"}}>No fund ID in URL.</div>;
  if (loading)  return <div style={{padding:"48px",textAlign:"center",color:"#6b7280"}}>Loading...</div>;
  if (!fund||fund.error) return <div style={{padding:"48px",textAlign:"center",color:"#b91c1c"}}>Fund not found.</div>;

  const contributors = fund.contributors||[];
  const vendors      = fund.vendors||[];
  const cur = fund.currency||"TZS";
  const raised    = contributors.filter(c=>c.status==="approved").reduce((s,c)=>s+(c.amountPaid||c.amount||0),0);
  const vTotal    = vendors.reduce((s,v)=>s+v.totalAmount,0);
  const vPaid     = vendors.reduce((s,v)=>s+v.paidAmount,0);
  const vBal      = vTotal - vPaid;
  const balance   = raised - vPaid;

  const S = {
    inp:{ padding:"11px 14px", border:"1.5px solid #cbd5e1", borderRadius:9, fontSize:14, fontFamily:"inherit", fontWeight:500, color:"#1e293b", background:"#fff", outline:"none", width:"100%" },
    lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, letterSpacing:"0.06em", textTransform:"uppercase" },
    card:{ background:"#fff", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 5px rgba(0,0,0,0.08)", marginBottom:14 },
  };

  return (
    <div style={{ maxWidth:880, margin:"0 auto", padding:"16px 16px 60px" }}>
      <style>{`.mtk-tabs{display:flex;gap:4px;padding:4px;background:#f1f5f9;border-radius:12px;margin-bottom:22px;overflow-x:auto}.mtk-tab{padding:9px 14px;border:none;border-radius:9px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;white-space:nowrap;flex-shrink:0;transition:all .15s}.mtk-tab--on{background:#fff;color:#1a3a5c;font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,0.1)}.mtk-tab--off{background:transparent;color:#6b7280}`}</style>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div>
          <Link href="/matukio" style={{ fontSize:13, fontWeight:700, color:"#1a3a5c", display:"flex", alignItems:"center", gap:4, marginBottom:6, textDecoration:"none" }}>← All Matukio Funds</Link>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(18px,4vw,24px)", fontWeight:900, color:"#1e293b", lineHeight:1.2 }}>{fund.title}</h1>
            <span style={{ padding:"3px 12px", background:"#dbeafe", border:"1px solid #93c5fd", borderRadius:100, fontSize:11, fontWeight:800, color:"#1a5a8a" }}>
              {SITUATIONS[fund.occasion]||"🤲"} Matukio
            </span>
          </div>
          <p style={{ fontSize:13, fontWeight:600, color:"#6b7280" }}>{fund.organiserName} · {fund.occasion.split(" / ")[0]}{fund.eventDate&&` · ${new Date(fund.eventDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`}</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Link href={`/matukio/${fund.slug}`} target="_blank" style={{ padding:"8px 14px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, fontSize:12, fontWeight:700, color:"#374151", textDecoration:"none" }}>👁 Public Page</Link>
          <button onClick={()=>window.open(`/api/michango/export?fundId=${fundId}&type=contributors`,"_blank")} style={{ padding:"8px 14px", background:"#dcfce7", border:"1px solid rgba(22,163,74,.2)", borderRadius:9, fontSize:12, fontWeight:700, color:"#166534", cursor:"pointer", fontFamily:"inherit" }}>📥 Export CSV</button>
          <button onClick={()=>window.print()} style={{ padding:"8px 14px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, fontSize:12, fontWeight:700, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}>🖨️ Print</button>
        </div>
      </div>

      {msg && <div style={{ marginBottom:14, padding:"11px 16px", borderRadius:9, fontSize:13, fontWeight:700, background:msg.type==="error"?"#fee2e2":"#dcfce7", border:`1px solid ${msg.type==="error"?"rgba(239,68,68,.3)":"rgba(22,163,74,.3)"}`, color:msg.type==="error"?"#b91c1c":"#166534" }}>{msg.text}</div>}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"Total Raised",   value:money(raised,cur),   color:"#1a3a5c", icon:"💰" },
          { label:"Expenses Total", value:money(vTotal,cur),   color:"#374151", icon:"📋" },
          { label:"Expenses Paid",  value:money(vPaid,cur),    color:"#16a34a", icon:"✅" },
          { label:"Balance",        value:money(balance,cur),  color:balance>=0?"#16a34a":"#b91c1c", icon:"🏦" },
        ].map(({label,value,color,icon})=>(
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"14px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:5 }}>{icon}</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(14px,3vw,18px)", fontWeight:900, color }}>{value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", marginTop:4, textTransform:"uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="mtk-tabs">
        {[["overview","📊 Overview"],["supporters","👥 Supporters ("+contributors.length+")"],["expenses","📋 Expenses ("+vendors.length+")"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`mtk-tab mtk-tab--${tab===k?"on":"off"}`}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        <div>
          {/* Quick confirm section */}
          <div style={S.card}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"#1a3a5c", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                Recent Supporters
                {contributors.filter(c=>c.status==="pending").length>0&&(
                  <span style={{ marginLeft:8, padding:"2px 8px", borderRadius:100, background:"#fef9c3", color:"#713f12", fontSize:10 }}>
                    {contributors.filter(c=>c.status==="pending").length} pending
                  </span>
                )}
              </div>
              {contributors.filter(c=>c.status==="pending").length>0&&(
                <button onClick={async()=>{ for(const c of contributors.filter(x=>x.status==="pending")){ await approveContrib(c.id,"approve"); } }} style={{ fontSize:11, fontWeight:800, padding:"4px 12px", background:"#dcfce7", border:"1px solid rgba(22,163,74,.25)", borderRadius:8, color:"#166534", cursor:"pointer", fontFamily:"inherit" }}>
                  Confirm all
                </button>
              )}
            </div>
            {contributors.length===0
              ? <p style={{ color:"#9ca3af", fontSize:13 }}>No supporters yet. Share your fund link!</p>
              : contributors.slice(0,8).map((c,i)=>{
                const isPending=c.status==="pending", isApproved=c.status==="approved";
                const paid=c.amountPaid||c.amount||0;
                return (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<Math.min(contributors.length,8)-1?"1px solid #f1f5f9":"none" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, flexShrink:0,
                      background:isPending?"#fef9c3":isApproved?"#dcfce7":"#fee2e2",
                      color:isPending?"#713f12":isApproved?"#166534":"#b91c1c",
                      border:"2px solid "+(isPending?"#fbbf24":isApproved?"#86efac":"#fca5a5"),
                    }}>{(c.anonymous?"A":c.name[0]).toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.anonymous?"Anonymous":c.name}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af" }}>{MODE_ICONS[c.paymentMode]||"💳"} {c.paymentMode}{c.receiptUrl?" · 📎":""}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:900, color:"#1a3a5c" }}>{money(paid,cur)}</div>
                        <div style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:100, marginTop:2, background:isPending?"#fef9c3":isApproved?"#dcfce7":"#fee2e2", color:isPending?"#713f12":isApproved?"#166534":"#b91c1c" }}>{(c.status||"pending").toUpperCase()}</div>
                      </div>
                      {isPending&&(
                        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                          <button onClick={()=>approveContrib(c.id,"approve")} disabled={approvingC===c.id} style={{ width:28, height:28, borderRadius:7, background:"#dcfce7", border:"1px solid rgba(22,163,74,.3)", color:"#166534", fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, opacity:approvingC===c.id?0.5:1 }}>✓</button>
                          <button onClick={()=>approveContrib(c.id,"reject")} disabled={approvingC===c.id} style={{ width:28, height:28, borderRadius:7, background:"#fee2e2", border:"1px solid rgba(239,68,68,.3)", color:"#b91c1c", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, opacity:approvingC===c.id?0.5:1 }}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            }
            {contributors.length>8&&<button onClick={()=>setTab("supporters")} style={{ width:"100%", marginTop:10, padding:"9px", background:"#f1f5f9", border:"none", borderRadius:9, fontSize:13, fontWeight:700, color:"#1a3a5c", cursor:"pointer", fontFamily:"inherit" }}>View all {contributors.length} →</button>}
          </div>

          {/* Expense summary */}
          <div style={S.card}>
            <div style={{ fontSize:12, fontWeight:800, color:"#374151", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>📋 Expenses / Matumizi</div>
            {vendors.length===0?<p style={{color:"#9ca3af",fontSize:13}}>No expenses added yet.</p>
              :vendors.slice(0,5).map(v=>(
              <div key={v.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{v.category.split(" / ")[0]}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:100, background:v.status==="paid"?"#dcfce7":v.status==="partial"?"#fef9c3":"#fee2e2", color:v.status==="paid"?"#166534":v.status==="partial"?"#713f12":"#b91c1c" }}>{v.status.toUpperCase()}</span>
                  <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginTop:2 }}>{money(v.paidAmount,cur)} / {money(v.totalAmount,cur)}</div>
                </div>
              </div>
            ))}
            {vBal>0&&<div style={{ marginTop:10, padding:"9px 12px", background:"#fee2e2", border:"1px solid rgba(239,68,68,.2)", borderRadius:8, fontSize:12, fontWeight:700, color:"#b91c1c" }}>⚠️ Outstanding: {money(vBal,cur)}</div>}
          </div>
        </div>
      )}

      {/* ── SUPPORTERS ── */}
      {tab==="supporters" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:"#1e293b" }}>Supporters · {contributors.length}</div>
            <button onClick={()=>setAddContrib(true)} style={{ padding:"9px 16px", background:"#1a3a5c", color:"#fff", borderRadius:9, fontWeight:800, fontSize:13, border:"none", cursor:"pointer", fontFamily:"inherit" }}>+ Add</button>
          </div>
          {addContrib&&(
            <div style={{ ...S.card, border:"1px solid #bfdbfe", marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#1a3a5c", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.08em" }}>Add Supporter</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={S.lbl}>Name *</label><input value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} style={S.inp} /></div>
                  <div><label style={S.lbl}>Phone *</label><input type="tel" value={cForm.phone} onChange={e=>setCForm(f=>({...f,phone:e.target.value}))} style={S.inp} /></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={S.lbl}>Amount ({cur}) *</label><input type="number" value={cForm.amount} onChange={e=>setCForm(f=>({...f,amount:e.target.value}))} style={S.inp} /></div>
                  <div><label style={S.lbl}>Payment mode</label><select value={cForm.paymentMode} onChange={e=>setCForm(f=>({...f,paymentMode:e.target.value}))} style={S.inp}>{["cash","mpesa","tigopesa","airtel","bank","other"].map(m=><option key={m}>{m}</option>)}</select></div>
                </div>
                <div><label style={S.lbl}>Reference</label><input value={cForm.reference} onChange={e=>setCForm(f=>({...f,reference:e.target.value}))} style={S.inp} /></div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={async()=>{ if(!cForm.name||!cForm.phone||!cForm.amount)return; setSavingC(true); const res=await fetch("/api/michango/contributors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fundId,...cForm,pledgeAmount:parseFloat(cForm.amount),amountPaid:parseFloat(cForm.amount),amount:parseFloat(cForm.amount)})}); if(res.ok){flash("Added ✓");setAddContrib(false);setCForm({name:"",phone:"",amount:"",paymentMode:"cash",reference:"",note:"",anonymous:false});await load();}else{const d=await res.json();flash(d.error||"Error","error");} setSavingC(false); }} disabled={savingC||!cForm.name||!cForm.phone||!cForm.amount} style={{ flex:1, padding:"11px", background:(savingC||!cForm.name||!cForm.phone||!cForm.amount)?"#94a3b8":"#1a3a5c", color:"#fff", borderRadius:9, border:"none", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit", opacity:(savingC||!cForm.name||!cForm.phone||!cForm.amount)?0.7:1 }}>{savingC?"Saving...":"Add Supporter"}</button>
                  <button onClick={()=>setAddContrib(false)} style={{ padding:"11px 16px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#6b7280" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {(() => {
            const groups = [
              { label:"⏳ Pending", list:contributors.filter(c=>c.status==="pending"), col:"#713f12", bg:"#fef9c3" },
              { label:"✅ Confirmed", list:contributors.filter(c=>c.status==="approved"), col:"#166534", bg:"#dcfce7" },
              { label:"❌ Rejected", list:contributors.filter(c=>c.status==="rejected"), col:"#b91c1c", bg:"#fee2e2" },
            ];
            return groups.map(({label,list,col,bg})=>list.length===0?null:(
              <div key={label} style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:800, color:col, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                  {label} <span style={{ background:"#f1f5f9", color:"#6b7280", padding:"1px 8px", borderRadius:100, fontSize:11 }}>{list.length}</span>
                  {label.includes("Pending")&&<button onClick={async()=>{ for(const c of list){await approveContrib(c.id,"approve");} flash(`All ${list.length} confirmed!`); }} style={{ marginLeft:"auto", padding:"4px 12px", background:"#dcfce7", border:"1px solid rgba(22,163,74,.25)", borderRadius:8, fontSize:11, fontWeight:800, color:"#166534", cursor:"pointer", fontFamily:"inherit" }}>Confirm all</button>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {list.map(c=>{
                    const paid=c.amountPaid||c.amount||0; const bal=c.pledgeAmount-paid;
                    const isPending=c.status==="pending";
                    return (
                      <div key={c.id} style={{ background:"#fff", borderRadius:12, padding:"12px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:`1px solid ${isPending?"#fbbf24":c.status==="approved"?"#86efac":"#fca5a5"}22` }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, flexShrink:0, background:bg, color:col }}>{(c.anonymous?"A":c.name[0]).toUpperCase()}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{c.anonymous?"Anonymous":c.name}</div>
                            {!c.anonymous&&c.phone&&<div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>📞 {c.phone}</div>}
                            <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af" }}>{MODE_ICONS[c.paymentMode]||"💳"} {c.paymentMode}{c.reference?` · Ref: ${c.reference}`:""}</div>
                            {c.note&&<div style={{ fontSize:11, color:"#6b7280", fontStyle:"italic" }}>"{c.note}"</div>}
                            {bal>0&&<div style={{ fontSize:11, fontWeight:700, color:"#d97706", marginTop:3 }}>Pledged: {money(c.pledgeAmount,cur)} · Paid: {money(paid,cur)} · Bal: {money(bal,cur)}</div>}
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, color:"#1a3a5c" }}>{money(paid,cur)}</div>
                            {isPending&&(
                              <div style={{ display:"flex", gap:4, marginTop:6, justifyContent:"flex-end" }}>
                                <button onClick={()=>approveContrib(c.id,"approve")} disabled={approvingC===c.id} style={{ padding:"5px 10px", background:"#dcfce7", border:"1px solid rgba(22,163,74,.3)", borderRadius:7, color:"#166534", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>✓ Confirm</button>
                                <button onClick={()=>approveContrib(c.id,"reject")} disabled={approvingC===c.id} style={{ padding:"5px 10px", background:"#fee2e2", border:"1px solid rgba(239,68,68,.3)", borderRadius:7, color:"#b91c1c", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                        {c.receiptUrl&&<div style={{ marginTop:8 }}><img src={c.receiptUrl} alt="Receipt" onClick={()=>window.open(c.receiptUrl,"_blank")} style={{ maxHeight:80, borderRadius:7, border:"1px solid #e2e8f0", cursor:"pointer" }} /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab==="expenses" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:"#1e293b" }}>Expenses / Matumizi</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>window.open(`/api/michango/export?fundId=${fundId}&type=vendors`,"_blank")} style={{ padding:"8px 12px", background:"#dbeafe", border:"1px solid #93c5fd", borderRadius:8, fontSize:12, fontWeight:700, color:"#1e40af", cursor:"pointer", fontFamily:"inherit" }}>📥 Export</button>
              <button onClick={()=>setAddVendor(true)} style={{ padding:"9px 16px", background:"#1a3a5c", color:"#fff", borderRadius:9, fontWeight:800, fontSize:13, border:"none", cursor:"pointer", fontFamily:"inherit" }}>+ Add Expense</button>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
            {[{l:"Total",v:money(vTotal,cur),c:"#1a3a5c"},{l:"Paid",v:money(vPaid,cur),c:"#166534"},{l:"Balance",v:money(vBal,cur),c:vBal>0?"#b91c1c":"#166534"}].map(({l,v,c})=>(
              <div key={l} style={{ background:"#fff", borderRadius:10, padding:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", textAlign:"center" }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(13px,2.5vw,17px)", fontWeight:900, color:c }}>{v}</div>
                <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", marginTop:3, textTransform:"uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
          {addVendor&&(
            <div style={{ ...S.card, border:"1px solid #bfdbfe", marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#1a3a5c", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.08em" }}>Add Expense</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={S.lbl}>Expense / vendor name *</label><input value={vForm.name} onChange={e=>setVForm(f=>({...f,name:e.target.value}))} placeholder='e.g. "Jeneza — Mkaa wa Yesu"' style={S.inp} /></div>
                  <div><label style={S.lbl}>Category</label><select value={vForm.category} onChange={e=>setVForm(f=>({...f,category:e.target.value}))} style={S.inp}>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={S.lbl}>Total amount ({cur}) *</label><input type="number" value={vForm.totalAmount} onChange={e=>setVForm(f=>({...f,totalAmount:e.target.value}))} style={S.inp} /></div>
                  <div><label style={S.lbl}>Due date</label><input type="date" value={vForm.dueDate} onChange={e=>setVForm(f=>({...f,dueDate:e.target.value}))} style={S.inp} /></div>
                </div>
                <div><label style={S.lbl}>Notes</label><input value={vForm.notes} onChange={e=>setVForm(f=>({...f,notes:e.target.value}))} placeholder="Notes..." style={S.inp} /></div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={async()=>{ if(!vForm.name||!vForm.totalAmount)return; setSavingV(true); const res=await fetch("/api/michango/vendors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fundId,...vForm,totalAmount:parseFloat(vForm.totalAmount),currency:cur})}); if(res.ok){flash("Added ✓");setAddVendor(false);setVForm({name:"",category:EXPENSE_CATS[0],phone:"",totalAmount:"",dueDate:"",notes:""});await load();}else{const d=await res.json();flash(d.error||"Error","error");} setSavingV(false); }} disabled={savingV||!vForm.name||!vForm.totalAmount} style={{ flex:1, padding:"11px", background:(savingV||!vForm.name||!vForm.totalAmount)?"#94a3b8":"#1a3a5c", color:"#fff", borderRadius:9, border:"none", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{savingV?"Saving...":"Add Expense"}</button>
                  <button onClick={()=>setAddVendor(false)} style={{ padding:"11px 14px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#6b7280" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {vendors.length===0?<div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af" }}><div style={{ fontSize:40, marginBottom:10 }}>📋</div><p style={{ fontSize:15, fontWeight:700 }}>No expenses added yet</p></div>
            :vendors.map(v=>{
              const bal=v.totalAmount-v.paidAmount; const pct=Math.min(100,Math.round((v.paidAmount/v.totalAmount)*100));
              return (
                <div key={v.id} style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 5px rgba(0,0,0,0.08)", overflow:"hidden", marginBottom:10 }}>
                  <div style={{ height:4, background:v.status==="paid"?"#16a34a":v.status==="partial"?"#d97706":"#dc2626" }} />
                  <div style={{ padding:"13px 16px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                          <span style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{v.name}</span>
                          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:100, fontWeight:800, background:v.status==="paid"?"#dcfce7":v.status==="partial"?"#fef9c3":"#fee2e2", color:v.status==="paid"?"#166534":v.status==="partial"?"#713f12":"#b91c1c" }}>{v.status.toUpperCase()}</span>
                          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:100, fontWeight:700, background:"#f1f5f9", color:"#6b7280" }}>{v.category.split(" / ")[0]}</span>
                        </div>
                        {v.notes&&<div style={{ fontSize:12, color:"#6b7280", marginTop:2, fontStyle:"italic" }}>{v.notes}</div>}
                        {v.dueDate&&<div style={{ fontSize:11, fontWeight:700, color:new Date(v.dueDate)<new Date()&&v.status!=="paid"?"#b91c1c":"#9ca3af", marginTop:2 }}>Due: {new Date(v.dueDate).toLocaleDateString("en-GB")}</div>}
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, color:"#1e293b" }}>{money(v.totalAmount,cur)}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#16a34a" }}>Paid: {money(v.paidAmount,cur)}</div>
                        {bal>0&&<div style={{ fontSize:11, fontWeight:700, color:"#dc2626" }}>Due: {money(bal,cur)}</div>}
                      </div>
                    </div>
                    <div style={{ height:5, background:"#f1f5f9", borderRadius:99, overflow:"hidden", marginBottom:8 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:v.status==="paid"?"#16a34a":"linear-gradient(90deg,#d97706,#16a34a)", borderRadius:99 }} />
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {v.status!=="paid"&&<button onClick={()=>{ setPayVendor(v); setPayForm({amount:"",reference:"",note:""}); }} style={{ padding:"7px 14px", background:"#1a3a5c", color:"#fff", borderRadius:8, fontSize:12, fontWeight:800, border:"none", cursor:"pointer", fontFamily:"inherit" }}>💳 Pay</button>}
                      <button onClick={async()=>{ await fetch(`/api/michango/vendors?id=${v.id}`,{method:"DELETE"}); await load(); flash("Removed"); }} style={{ marginLeft:"auto", padding:"7px 10px", background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:13 }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })
          }

          {payVendor&&(
            <div onClick={()=>setPayVendor(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
              <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, padding:"20px 20px 32px", boxShadow:"0 -8px 48px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize:10, fontWeight:800, color:"#1a3a5c", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Record Payment</div>
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:900, color:"#1e293b", marginBottom:4 }}>{payVendor.name}</h3>
                <p style={{ fontSize:13, fontWeight:600, color:"#6b7280", marginBottom:16 }}>Balance: {money(payVendor.totalAmount-payVendor.paidAmount,cur)}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div><label style={S.lbl}>Amount ({cur}) *</label><input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} placeholder={String(payVendor.totalAmount-payVendor.paidAmount)} style={S.inp} autoFocus /></div>
                  <div><label style={S.lbl}>Reference</label><input value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))} placeholder="Receipt / ref no." style={S.inp} /></div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={async()=>{ if(!payForm.amount)return; setSavingPay(true); const res=await fetch("/api/michango/vendors/pay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({vendorId:payVendor.id,amount:parseFloat(payForm.amount),reference:payForm.reference,note:payForm.note})}); if(res.ok){flash("Payment recorded ✓");setPayVendor(null);setPayForm({amount:"",reference:"",note:""});await load();}else{const d=await res.json();flash(d.error||"Error","error");} setSavingPay(false); }} disabled={savingPay||!payForm.amount} style={{ flex:1, padding:"12px", background:(savingPay||!payForm.amount)?"#94a3b8":"#1a3a5c", color:"#fff", borderRadius:9, border:"none", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit", opacity:(savingPay||!payForm.amount)?0.7:1 }}>{savingPay?"Saving...":"Record Payment"}</button>
                    <button onClick={()=>setPayVendor(null)} style={{ padding:"12px 16px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#6b7280" }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
