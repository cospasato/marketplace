"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const MODES = ["cash","mpesa","tigopesa","airtel","bank","other"];
const MODE_ICONS = { cash:"💵", mpesa:"📱", tigopesa:"📱", airtel:"📱", bank:"🏦", other:"💳" };

function money(n, cur="TZS") {
  return `${cur} ${Number(n||0).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
}

export default function PublicFundClient({ slug }) {
  const [fund, setFund]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({ name:"", phone:"", email:"", amount:"", paymentMode:"mpesa", reference:"", note:"", anonymous:false });
  const [saving, setSaving]   = useState(false);
  const [result, setResult]   = useState(null);

  useEffect(()=>{
    fetch(`/api/michango/${slug}`).then(r=>r.json()).then(d=>{ setFund(d); setLoading(false); }).catch(()=>setLoading(false));
  },[slug]);

  const contribute = async () => {
    if (!form.name || !form.phone || !form.amount) return;
    setSaving(true);
    const res = await fetch("/api/michango/contributors", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ fundId:fund.id, ...form, amount:parseFloat(form.amount) }) });
    const d = await res.json();
    if (res.ok) { setResult(d); setFund(prev=>({ ...prev, contributors:[d,...(prev.contributors||[])] })); }
    else setResult({ error: d.error });
    setSaving(false);
  };

  if (loading) return <div style={{padding:"60px",textAlign:"center",color:"var(--gray)"}}>Loading...</div>;
  if (!fund || fund.error) return <div style={{padding:"60px",textAlign:"center",color:"var(--red)"}}>Fund not found.</div>;

  const contributors = fund.contributors || [];
  const raised = contributors.reduce((s,c)=>s+c.amount,0);
  const pct = fund.targetAmount>0 ? Math.min(100,Math.round((raised/fund.targetAmount)*100)) : null;
  const cur = fund.currency || "TZS";
  const visible = contributors.filter(c=>!c.anonymous).slice(0,20);
  const anon = contributors.filter(c=>c.anonymous).length;

  const S = {
    inp: { padding:"12px 14px", border:"1.5px solid var(--border2)", borderRadius:"var(--r-md)", fontSize:14, fontFamily:"inherit", fontWeight:500, color:"var(--text)", background:"var(--white)", outline:"none", width:"100%" },
    lbl: { display:"block", fontSize:11, fontWeight:700, color:"var(--text)", marginBottom:5, letterSpacing:"0.06em", textTransform:"uppercase" },
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ background:"linear-gradient(160deg,var(--maroon-dk),var(--maroon))", padding:"36px 20px 28px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize:"24px 24px" }} />
        <div style={{ fontSize:52, marginBottom:10 }}>{({ Wedding:"💍",Birthday:"🎂",Graduation:"🎓",Funeral:"🕊️","Church Event":"⛪" })[fund.occasion]||"🎉"}</div>
        <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.7)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:8 }}>{fund.occasion} · Michango</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,5vw,40px)", fontWeight:900, color:"#fff", marginBottom:8, lineHeight:1.1, letterSpacing:"-0.02em" }}>{fund.title}</h1>
        <p style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.8)", marginBottom: fund.description?12:0 }}>Organised by <strong style={{color:"#fff"}}>{fund.organiserName}</strong></p>
        {fund.description && <p style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.75)", maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>{fund.description}</p>}
        {fund.eventDate && (
          <div style={{ display:"inline-block", marginTop:12, padding:"5px 16px", background:"rgba(255,255,255,0.15)", borderRadius:100, fontSize:13, fontWeight:700, color:"#fff" }}>
            📅 {new Date(fund.eventDate).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ background:"var(--maroon-dk)", padding:"14px 20px 16px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
        {[
          { label:"Raised", value:money(raised,cur), color:"var(--gold-lt)" },
          { label:"Contributors", value:contributors.length, color:"#fff" },
          { label:"Target", value:fund.targetAmount?money(fund.targetAmount,cur):"Open", color:"rgba(255,255,255,0.75)" },
        ].map(({label,value,color})=>(
          <div key={label} style={{ textAlign:"center", padding:"4px 0" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(16px,4vw,24px)", fontWeight:900, color }}>{value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {pct !== null && (
        <div style={{ background:"var(--white)", padding:"14px 20px 16px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8 }}>
            <span>{pct}% of target reached</span>
            <span style={{ color:"var(--maroon)" }}>{money(fund.targetAmount-raised>0?fund.targetAmount-raised:0,cur)} remaining</span>
          </div>
          <div style={{ height:10, background:"var(--cream2)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,var(--gold),var(--maroon))", borderRadius:99, transition:"width .7s ease", boxShadow:"0 0 8px rgba(201,150,42,0.3)" }} />
          </div>
        </div>
      )}

      <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px 60px" }}>
        {/* Contribute button */}
        <button onClick={()=>{ setModal(true); setResult(null); setForm({name:"",phone:"",email:"",amount:"",paymentMode:"mpesa",reference:"",note:"",anonymous:false}); }} className="btn-primary" style={{ marginBottom:24, fontSize:16 }}>
          💰 Contribute Now
        </button>

        {/* Top contributors */}
        {visible.length > 0 && (
          <div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, marginBottom:14 }}>
              Wachangiaji ({contributors.length}{anon>0?`, +${anon} anonymous`:""})
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {visible.map((c,i)=>(
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--white)", borderRadius:"var(--r-lg)", boxShadow:"var(--shadow-xs)" }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:i<3?"var(--maroon)":"var(--cream)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:900, fontSize:16, color:i<3?"#fff":"var(--maroon)", flexShrink:0 }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":c.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--text)" }}>{c.name}</div>
                    {c.note && <div style={{ fontSize:12, fontWeight:500, color:"var(--gray)", fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{c.note}"</div>}
                    <div style={{ fontSize:11, fontWeight:600, color:"var(--gray-lt)" }}>{MODE_ICONS[c.paymentMode]||"💳"} {c.paymentMode} · {c.paidAt ? new Date(c.paidAt).toLocaleDateString("en-GB") : ""}</div>
                  </div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:900, color:"var(--maroon)", flexShrink:0 }}>{money(c.amount,cur)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contribute modal */}
      {modal && (
        <div onClick={()=>setModal(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"var(--white)", borderRadius:"var(--r-xl) var(--r-xl) 0 0", width:"100%", maxWidth:500, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 -8px 48px rgba(0,0,0,0.3)" }}>
            <div style={{ padding:"12px 0 2px", display:"flex", justifyContent:"center" }}><div style={{ width:36, height:4, borderRadius:99, background:"var(--border2)" }} /></div>
            {!result ? (
              <div style={{ padding:"12px 20px 28px", display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"var(--gold-dk)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>💰 Mchango wako</div>
                  <h3 style={{ fontFamily:"var(--font-display)", fontSize:19, fontWeight:900, color:"var(--text)" }}>Contribute to {fund.title}</h3>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><label style={S.lbl}>Your name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jina lako" style={S.inp} /></div>
                  <div><label style={S.lbl}>Phone *</label><input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+255 7xx..." style={S.inp} /></div>
                </div>
                <div>
                  <label style={S.lbl}>Amount ({cur}) *</label>
                  <input type="number" min="1" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="e.g. 50000" style={S.inp} />
                </div>
                <div>
                  <label style={S.lbl}>Payment method</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                    {MODES.map(m=>(
                      <button key={m} onClick={()=>setForm(f=>({...f,paymentMode:m}))} style={{ padding:"8px 4px", border:`2px solid ${form.paymentMode===m?"var(--maroon)":"var(--border2)"}`, borderRadius:"var(--r-md)", background:form.paymentMode===m?"var(--maroon-bg)":"var(--white)", cursor:"pointer", fontSize:12, fontWeight:form.paymentMode===m?800:600, color:form.paymentMode===m?"var(--maroon)":"var(--text2)", fontFamily:"inherit", textAlign:"center" }}>
                      {MODE_ICONS[m]} {m.charAt(0).toUpperCase()+m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label style={S.lbl}>Reference/Transaction no. (optional)</label><input value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="e.g. MPESA ref: ABC123XYZ" style={S.inp} /></div>
                <div><label style={S.lbl}>Message (optional)</label><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} placeholder="Hongera sana!" style={{ ...S.inp, resize:"vertical" }} /></div>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, fontWeight:600, color:"var(--text2)" }}>
                  <input type="checkbox" checked={form.anonymous} onChange={e=>setForm(f=>({...f,anonymous:e.target.checked}))} style={{ width:18, height:18, accentColor:"var(--maroon)" }} />
                  Contribute anonymously (name hidden publicly)
                </label>
                <button onClick={contribute} disabled={saving||!form.name||!form.phone||!form.amount} className="btn-primary" style={{ opacity:(saving||!form.name||!form.phone||!form.amount)?0.6:1, fontSize:15 }}>
                  {saving ? "Saving..." : `💰 Contribute ${form.amount ? money(parseFloat(form.amount),cur) : ""} →`}
                </button>
                <button onClick={()=>setModal(false)} style={{ background:"none", border:"none", color:"var(--gray)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              </div>
            ) : result.error ? (
              <div style={{ padding:"36px 20px", textAlign:"center" }}>
                <div style={{ fontSize:44, marginBottom:12 }}>😕</div>
                <p style={{ color:"var(--red)", fontWeight:700, marginBottom:16 }}>{result.error}</p>
                <button onClick={()=>setResult(null)} className="btn-outline" style={{ margin:"0 auto", width:"auto", padding:"11px 28px" }}>Try again</button>
              </div>
            ) : (
              <div style={{ padding:"36px 20px", textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🎉</div>
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:900, color:"var(--green)", marginBottom:10 }}>Asante sana!</h3>
                <p style={{ fontSize:15, fontWeight:600, color:"var(--text2)", marginBottom:6 }}>Your contribution of <strong style={{color:"var(--maroon)"}}>{money(result.amount,cur)}</strong> has been recorded.</p>
                <p style={{ fontSize:13, color:"var(--gray)", marginBottom:20 }}>Thank you for supporting {fund.organiserName}!</p>
                <button onClick={()=>{ setModal(false); setResult(null); }} style={{ background:"none", border:"none", color:"var(--maroon)", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>← Back to fund</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
