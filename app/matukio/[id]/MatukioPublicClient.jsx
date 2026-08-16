"use client";
import { useState, useEffect, useRef } from "react";

const SITUATIONS = {
  "Funeral / Msiba":         { emoji:"🕊️", label:"Msiba",    color:"#4a5568" },
  "Sickness / Ugonjwa":      { emoji:"🙏", label:"Ugonjwa", color:"#2d6a9f" },
  "Accident / Ajali":        { emoji:"🚑", label:"Ajali",   color:"#744210" },
  "Fire / Moto":             { emoji:"🔥", label:"Moto",    color:"#9b2335" },
  "Displacement / Kukimbia": { emoji:"🏕️", label:"Kukimbia",color:"#276749" },
  "Hardship / Shida":        { emoji:"🤲", label:"Shida",   color:"#3730a3" },
  "Other Support":           { emoji:"🤝", label:"Support", color:"#1a3a5c" },
};
const MODES = ["mpesa","tigopesa","airtel","cash","bank","other"];
const MODE_ICONS = { cash:"💵", mpesa:"📱", tigopesa:"📱", airtel:"📱", bank:"🏦", other:"💳" };
const MODE_LABELS = { cash:"Cash", mpesa:"M-Pesa", tigopesa:"Tigo Pesa", airtel:"Airtel Money", bank:"Bank Transfer", other:"Other" };

function money(n, cur="TZS") {
  return `${cur} ${Number(n||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
}

const initForm = () => ({ name:"", phone:"", email:"", pledgeAmount:"", amountPaid:"", payingAll:true, paymentMode:"mpesa", reference:"", receiptUrl:"", note:"", anonymous:false });

export default function MatukioPublicClient({ slug }) {
  const [fund,    setFund]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [result,  setResult]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState(initForm());
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`/api/michango/${slug}`).then(r=>r.json()).then(d=>{setFund(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [slug]);

  const handleReceipt = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(f=>({...f,receiptUrl:reader.result}));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.name||!form.phone||!form.pledgeAmount) return;
    setSaving(true);
    const pledge = parseFloat(form.pledgeAmount);
    const paid   = form.payingAll ? pledge : parseFloat(form.amountPaid||0);
    const res = await fetch("/api/michango/contributors", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ fundId:fund.id, name:form.name, phone:form.phone, email:form.email, pledgeAmount:pledge, amountPaid:paid, paymentMode:form.paymentMode, reference:form.reference, receiptUrl:form.receiptUrl, note:form.note, anonymous:form.anonymous }),
    });
    const d = await res.json();
    if (res.ok) { setResult(d); await fetch(`/api/michango/${slug}`).then(r=>r.json()).then(setFund); }
    else setResult({error:d.error});
    setSaving(false);
  };

  if (loading) return <div style={{padding:"60px",textAlign:"center",color:"#6b7280"}}>Loading...</div>;
  if (!fund||fund.error) return <div style={{padding:"60px",textAlign:"center",color:"#b91c1c"}}>Fund not found.</div>;

  const sit     = SITUATIONS[fund.occasion] || SITUATIONS["Other Support"];
  const contributors = fund.contributors||[];
  const approved = contributors.filter(c=>c.status==="approved");
  const pending  = contributors.filter(c=>c.status==="pending");
  const raised   = approved.reduce((s,c)=>s+(c.amountPaid||c.amount||0),0);
  const pledged  = contributors.reduce((s,c)=>s+c.pledgeAmount,0);
  const pct      = fund.targetAmount>0 ? Math.min(100,Math.round((raised/fund.targetAmount)*100)) : null;
  const cur      = fund.currency||"TZS";
  const visible  = approved.filter(c=>!c.anonymous).slice(0,20);

  const S = {
    inp:{ padding:"12px 14px", border:"1.5px solid #cbd5e1", borderRadius:10, fontSize:14, fontFamily:"inherit", fontWeight:500, color:"#1e293b", background:"#fff", outline:"none", width:"100%" },
    lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, letterSpacing:"0.06em", textTransform:"uppercase" },
  };

  return (
    <div style={{ fontFamily:"inherit" }}>
      {/* Hero — dignified, subdued */}
      <div style={{ background:"linear-gradient(160deg,#0d1f35,#1a3a5c,#2a4a6a)", padding:"36px 20px 32px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.05, backgroundImage:"radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize:"28px 28px" }} />
        <div style={{ fontSize:52, marginBottom:10 }}>{sit.emoji}</div>
        <div style={{ fontSize:11, fontWeight:800, color:"rgba(168,196,232,0.8)", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:8 }}>
          {sit.label} · Matukio Support
        </div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,5vw,38px)", fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:10, letterSpacing:"-0.02em" }}>{fund.title}</h1>
        <p style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.8)" }}>Organised by <strong style={{color:"#fff"}}>{fund.organiserName}</strong></p>
        {fund.description && <p style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.72)", maxWidth:480, margin:"12px auto 0", lineHeight:1.75 }}>{fund.description}</p>}
        {fund.eventDate && (
          <div style={{ display:"inline-block", marginTop:12, padding:"5px 16px", background:"rgba(255,255,255,0.12)", borderRadius:100, fontSize:13, fontWeight:700, color:"#a8c4e8" }}>
            📅 {new Date(fund.eventDate).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ background:"#1a3a5c", display:"grid", gridTemplateColumns:"repeat(4,1fr)", padding:"14px 12px" }}>
        {[
          { label:"Mkusanyiko", value:money(raised,cur), color:"#a8c4e8" },
          { label:"Waliohakikisha", value:money(pledged,cur), color:"rgba(255,255,255,0.8)" },
          { label:"Confirmed", value:approved.length, color:"#86efac" },
          { label:"Pending", value:pending.length, color:pending.length>0?"#fbbf24":"rgba(255,255,255,0.4)" },
        ].map(({label,value,color})=>(
          <div key={label} style={{ textAlign:"center", padding:"4px 2px" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(13px,3.5vw,20px)", fontWeight:900, color, lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {pct !== null && (
        <div style={{ background:"#fff", padding:"14px 20px 16px", borderBottom:"1px solid #e2e8f0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>
            <span>{pct}% of target</span>
            <span style={{ color:"#1a3a5c" }}>{money(Math.max(0,fund.targetAmount-raised),cur)} remaining</span>
          </div>
          <div style={{ height:10, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#3a6090,#5a9fd4)", borderRadius:99, transition:"width .7s ease" }} />
          </div>
        </div>
      )}

      <div style={{ maxWidth:640, margin:"0 auto", padding:"20px 16px 60px" }}>

        {pending.length>0 && (
          <div style={{ padding:"10px 14px", background:"#fef9c3", border:"1px solid #fbbf24", borderRadius:10, marginBottom:14, fontSize:13, fontWeight:700, color:"#713f12" }}>
            ⏳ {pending.length} contribution{pending.length!==1?"s":""} awaiting confirmation
          </div>
        )}

        <button onClick={()=>{ setModal(true); setResult(null); setForm(initForm()); }}
          style={{ width:"100%", marginBottom:24, padding:"14px", background:"#1a3a5c", color:"#fff", borderRadius:12, border:"none", fontFamily:"inherit", fontWeight:800, fontSize:16, cursor:"pointer" }}>
          🤲 Toa Msaada / Give Support
        </button>

        {visible.length>0 && (
          <div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:"#1e293b", marginBottom:14 }}>
              Wasaidizi ({approved.length}{contributors.filter(c=>c.anonymous&&c.status==="approved").length>0?` · ${contributors.filter(c=>c.anonymous&&c.status==="approved").length} anonymous`:""})
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {visible.map((c,i)=>{
                const paid=c.amountPaid||c.amount||0;
                const bal=c.pledgeAmount-paid;
                return (
                  <div key={c.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", background:"#fff", borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:i<3?"#1a3a5c":"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:i<3?"#fff":"#1a3a5c", flexShrink:0 }}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":c.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{c.name}</div>
                      {c.note && <div style={{ fontSize:12, color:"#6b7280", fontStyle:"italic" }}>"{c.note}"</div>}
                      <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af" }}>{MODE_ICONS[c.paymentMode]||"💳"} {c.paymentMode}{c.paidAt?` · ${new Date(c.paidAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`:""}</div>
                      {bal>0&&<div style={{ fontSize:11, fontWeight:700, color:"#d97706", marginTop:3 }}>Pledged {money(c.pledgeAmount,cur)} · Balance {money(bal,cur)}</div>}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, color:"#1a3a5c" }}>{money(paid,cur)}</div>
                      {bal>0&&<div style={{ fontSize:10, fontWeight:700, color:"#d97706" }}>pledged {money(c.pledgeAmount,cur)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Contribute Modal */}
      {modal && (
        <div onClick={()=>setModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 -8px 48px rgba(0,0,0,0.3)" }}>
            <div style={{ padding:"12px 0 2px", display:"flex", justifyContent:"center" }}>
              <div style={{ width:36, height:4, borderRadius:99, background:"#e2e8f0" }} />
            </div>
            {!result ? (
              <div style={{ padding:"12px 20px 32px", display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"#1a3a5c", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>🤲 Msaada Wako</div>
                  <h3 style={{ fontFamily:"var(--font-display)", fontSize:19, fontWeight:900, color:"#1e293b" }}>Support {fund.title}</h3>
                  <p style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginTop:4, lineHeight:1.6 }}>
                    🙏 Your support will be confirmed by the organiser before appearing publicly.
                  </p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><label style={S.lbl}>Your name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jina lako" style={S.inp} /></div>
                  <div><label style={S.lbl}>Phone *</label><input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+255 7xx..." style={S.inp} /></div>
                </div>
                <div>
                  <label style={S.lbl}>Amount / Kiasi ({cur}) *</label>
                  <input type="number" min="1" value={form.pledgeAmount} onChange={e=>setForm(f=>({...f,pledgeAmount:e.target.value,amountPaid:f.payingAll?e.target.value:f.amountPaid}))} placeholder="Kiasi unachotaka kutoa" style={S.inp} />
                </div>
                <div>
                  <label style={S.lbl}>Giving today</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <button onClick={()=>setForm(f=>({...f,payingAll:true,amountPaid:f.pledgeAmount}))} style={{ padding:"10px", borderRadius:9, border:`2px solid ${form.payingAll?"#1a3a5c":"#cbd5e1"}`, background:form.payingAll?"#dbeafe":"#fff", color:form.payingAll?"#1a3a5c":"#6b7280", fontFamily:"inherit", fontSize:12, fontWeight:form.payingAll?800:600, cursor:"pointer" }}>
                      ✅ Full amount<br/><span style={{fontSize:11,fontWeight:500}}>{form.pledgeAmount?money(parseFloat(form.pledgeAmount),cur):"all now"}</span>
                    </button>
                    <button onClick={()=>setForm(f=>({...f,payingAll:false,amountPaid:""}))} style={{ padding:"10px", borderRadius:9, border:`2px solid ${!form.payingAll?"#1a3a5c":"#cbd5e1"}`, background:!form.payingAll?"#dbeafe":"#fff", color:!form.payingAll?"#1a3a5c":"#6b7280", fontFamily:"inherit", fontSize:12, fontWeight:!form.payingAll?800:600, cursor:"pointer" }}>
                      🔄 Partial<br/><span style={{fontSize:11,fontWeight:500}}>Pay part now</span>
                    </button>
                  </div>
                  {!form.payingAll && (
                    <div style={{ marginTop:8 }}>
                      <input type="number" min="0" value={form.amountPaid} onChange={e=>setForm(f=>({...f,amountPaid:e.target.value}))} placeholder="Amount giving now" style={S.inp} />
                      {form.pledgeAmount&&form.amountPaid&&parseFloat(form.amountPaid)<parseFloat(form.pledgeAmount)&&(
                        <p style={{ fontSize:11, fontWeight:700, color:"#d97706", marginTop:4 }}>Balance: {money(parseFloat(form.pledgeAmount)-parseFloat(form.amountPaid),cur)}</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label style={S.lbl}>Payment method</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                    {MODES.map(m=>(
                      <button key={m} onClick={()=>setForm(f=>({...f,paymentMode:m}))} style={{ padding:"8px 4px", border:`2px solid ${form.paymentMode===m?"#1a3a5c":"#cbd5e1"}`, borderRadius:9, background:form.paymentMode===m?"#dbeafe":"#fff", cursor:"pointer", fontSize:12, fontWeight:form.paymentMode===m?800:600, color:form.paymentMode===m?"#1a3a5c":"#6b7280", fontFamily:"inherit", textAlign:"center" }}>
                        {MODE_ICONS[m]} {MODE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label style={S.lbl}>Reference (optional)</label><input value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="e.g. M-Pesa ref: ABC123" style={S.inp} /></div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleReceipt} style={{display:"none"}} />
                {!form.receiptUrl ? (
                  <button onClick={()=>fileRef.current?.click()} style={{ width:"100%", padding:"11px", border:"2px dashed #cbd5e1", borderRadius:9, background:"#f8fafc", color:"#6b7280", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer" }}>📎 Attach receipt / proof of payment</button>
                ) : (
                  <div style={{ position:"relative" }}>
                    <img src={form.receiptUrl} alt="Receipt" style={{ width:"100%", maxHeight:140, objectFit:"cover", borderRadius:9, border:"1px solid #e2e8f0" }} />
                    <button onClick={()=>setForm(f=>({...f,receiptUrl:""}))} style={{ position:"absolute", top:6, right:6, width:26, height:26, borderRadius:"50%", background:"rgba(0,0,0,0.55)", color:"#fff", border:"none", cursor:"pointer", fontSize:13 }}>✕</button>
                    <p style={{ fontSize:11, fontWeight:700, color:"#16a34a", marginTop:4 }}>✓ Receipt attached</p>
                  </div>
                )}
                <div><label style={S.lbl}>Message (optional)</label><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} placeholder="Pole sana. Mungu akubariki na kukupa nguvu..." style={{...S.inp,resize:"vertical",lineHeight:1.6}} /></div>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, fontWeight:600, color:"#374151" }}>
                  <input type="checkbox" checked={form.anonymous} onChange={e=>setForm(f=>({...f,anonymous:e.target.checked}))} style={{ width:18, height:18, accentColor:"#1a3a5c" }} />
                  Contribute anonymously
                </label>
                <button onClick={submit} disabled={saving||!form.name||!form.phone||!form.pledgeAmount}
                  style={{ width:"100%", padding:"14px", background:(saving||!form.name||!form.phone||!form.pledgeAmount)?"#94a3b8":"#1a3a5c", color:"#fff", borderRadius:12, border:"none", fontFamily:"inherit", fontWeight:800, fontSize:15, cursor:(saving||!form.name||!form.phone||!form.pledgeAmount)?"not-allowed":"pointer" }}>
                  {saving?"Submitting...":form.pledgeAmount&&parseFloat(form.pledgeAmount)>0?`🤲 Give ${money(parseFloat(form.payingAll?form.pledgeAmount:form.amountPaid||0),cur)} →`:"🤲 Submit Support →"}
                </button>
                <button onClick={()=>setModal(false)} style={{ background:"none", border:"none", color:"#6b7280", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              </div>
            ) : result.error ? (
              <div style={{ padding:"36px 20px", textAlign:"center" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>😕</div>
                <p style={{ color:"#b91c1c", fontWeight:700, fontSize:15, marginBottom:16 }}>{result.error}</p>
                <button onClick={()=>setResult(null)} style={{ padding:"11px 28px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:99, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Try again</button>
              </div>
            ) : (
              <div style={{ padding:"36px 20px", textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🙏</div>
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:900, color:"#1a3a5c", marginBottom:10 }}>Asante kwa Msaada</h3>
                <div style={{ padding:"12px 16px", background:"#fef9c3", border:"1px solid #fbbf24", borderRadius:10, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#713f12" }}>⏳ AWAITING CONFIRMATION</div>
                  <p style={{ fontSize:13, fontWeight:600, color:"#374151", marginTop:4, lineHeight:1.6 }}>
                    Your support of <strong style={{color:"#1a3a5c"}}>{money(result.amountPaid||result.amount||0,cur)}</strong> has been submitted.
                    {result.pledgeAmount>(result.amountPaid||0)&&<> (pledged {money(result.pledgeAmount,cur)})</>} The organiser will confirm it shortly.
                  </p>
                </div>
                <p style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>May your kindness be returned many times over. Mungu akulipe.</p>
                <button onClick={()=>{ setModal(false); setResult(null); }} style={{ background:"none", border:"none", color:"#1a3a5c", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back to fund</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
