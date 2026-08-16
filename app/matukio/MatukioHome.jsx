"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SITUATIONS = [
  { key:"Funeral / Msiba",          emoji:"🕊️", label:"Msiba",      desc:"Bereavement & funeral costs" },
  { key:"Sickness / Ugonjwa",       emoji:"🙏", label:"Ugonjwa",   desc:"Medical bills & care" },
  { key:"Accident / Ajali",         emoji:"🚑", label:"Ajali",     desc:"Accident recovery support" },
  { key:"Fire / Moto",              emoji:"🔥", label:"Moto",      desc:"Fire damage & rebuilding" },
  { key:"Displacement / Kukimbia",  emoji:"🏕️", label:"Kukimbia",  desc:"Displacement & shelter" },
  { key:"Hardship / Shida",         emoji:"🤲", label:"Shida",     desc:"General hardship support" },
  { key:"Other Support",            emoji:"🤝", label:"Other",     desc:"Any other support need" },
];

function money(n, cur = "TZS") {
  return `${cur} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const S = {
  inp: { padding:"12px 14px", border:"1.5px solid #cbd5e1", borderRadius:10, fontSize:14, fontFamily:"inherit", fontWeight:500, color:"#1e293b", background:"#fff", outline:"none", width:"100%" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, letterSpacing:"0.06em", textTransform:"uppercase" },
};

export default function MatukioHome() {
  const router = useRouter();
  const [tab, setTab]       = useState("browse");
  const [funds, setFunds]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError]   = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm]     = useState({
    title:"", occasion:"Funeral / Msiba", description:"",
    organiserName:"", organiserEmail:"", organiserPhone:"",
    eventDate:"", targetAmount:"", currency:"TZS", thankYouMsg:"",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const q = search.trim() ? `?search=${encodeURIComponent(search)}` : "";
    const d = await fetch(`/api/matukio${q}`).then(r => r.json()).catch(() => []);
    setFunds(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [search]);

  useEffect(() => { const t = setTimeout(load, search ? 350 : 0); return () => clearTimeout(t); }, [load]);

  const create = async () => {
    if (!form.title || !form.organiserName || !form.organiserPhone) {
      setError("Title, your name, and phone are required"); return;
    }
    setCreating(true); setError("");
    const res = await fetch("/api/matukio", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (res.ok) router.push(`/matukio/manage?id=${d.id}&phone=${encodeURIComponent(form.organiserPhone)}`);
    else setError(d.error || "Failed to create fund");
    setCreating(false);
  };

  return (
    <div>
      {/* Hero — calm, dignified blue */}
      <div style={{ background:"linear-gradient(160deg,#0d1f35,#1a3a5c,#2a4a6a)", padding:"32px 20px 36px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.06, backgroundImage:"radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"rgba(168,196,232,0.8)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>
            Matukio · Support Contributions
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(26px,5vw,44px)", fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:10, letterSpacing:"-0.02em" }}>
            Msaada wa<br /><span style={{ color:"#a8c4e8", fontStyle:"italic" }}>Jamii</span>
          </h1>
          <p style={{ fontSize:14, fontWeight:500, color:"rgba(255,255,255,0.78)", marginBottom:24, lineHeight:1.8 }}>
            Collect community support for those facing loss, illness, accidents, or hardship. 
            Private, dignified, and easy to manage.
          </p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={() => setTab("create")} style={{ padding:"13px 28px", background:"#3a6090", color:"#fff", borderRadius:"var(--r-xl)", fontWeight:800, fontSize:15, border:"2px solid rgba(255,255,255,0.3)", cursor:"pointer", fontFamily:"inherit" }}>
              🤲 Open Support Fund
            </button>
            <button onClick={() => setTab("manage")} style={{ padding:"13px 24px", background:"rgba(255,255,255,0.1)", color:"#a8c4e8", border:"1px solid rgba(168,196,232,0.3)", borderRadius:"var(--r-xl)", fontWeight:600, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
              Manage Existing →
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", padding:"4px", margin:"16px 16px 0", background:"#f1f5f9", borderRadius:12 }}>
        {[["browse","Browse Funds"],["create","Open Fund"],["manage","My Funds"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:"9px 4px", borderRadius:9, border:"none", fontFamily:"inherit", fontSize:13, fontWeight:tab===k?800:500, background:tab===k?"#fff":"transparent", color:tab===k?"#1a3a5c":"#6b7280", boxShadow:tab===k?"0 1px 4px rgba(0,0,0,0.08)":"none", cursor:"pointer" }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:"20px 16px", maxWidth:720, margin:"0 auto" }}>

        {/* ── BROWSE ── */}
        {tab === "browse" && (
          <div>
            <div style={{ position:"relative", marginBottom:16 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:16 }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or organiser..." style={{ ...S.inp, paddingLeft:40, borderRadius:99 }} />
            </div>

            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height:90, borderRadius:14, background:"#f1f5f9", animation:"pulse 1.5s infinite" }} />)}
              </div>
            ) : funds.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:"#6b7280" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🤲</div>
                <p style={{ fontSize:15, fontWeight:700 }}>No support funds found</p>
                <p style={{ fontSize:13, marginTop:6, marginBottom:20 }}>Open one for someone in need</p>
                <button onClick={() => setTab("create")} style={{ padding:"11px 28px", background:"#1a3a5c", color:"#fff", border:"none", borderRadius:99, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>Open Support Fund →</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {funds.map(f => {
                  const sit = SITUATIONS.find(s => s.key === f.occasion) || SITUATIONS[6];
                  const raised = (f.contributors || []).filter(c => c.status === "approved").reduce((s, c) => s + (c.amountPaid || c.amount || 0), 0);
                  const pct = f.targetAmount > 0 ? Math.min(100, Math.round((raised / f.targetAmount) * 100)) : null;
                  return (
                    <Link key={f.id} href={`/matukio/${f.slug}`} style={{ display:"block", background:"#fff", borderRadius:14, boxShadow:"0 1px 6px rgba(0,0,0,0.08)", overflow:"hidden", textDecoration:"none" }}>
                      <div style={{ height:4, background:"linear-gradient(90deg,#1a3a5c,#5a9fd4)" }} />
                      <div style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:44, height:44, borderRadius:12, background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{sit.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                              <span style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:800, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.title}</span>
                              <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:100, background:"#dbeafe", color:"#1a5a8a" }}>{sit.label.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginTop:2 }}>
                              Organised by {f.organiserName}
                              {f.eventDate && <span style={{ marginLeft:6 }}>· {new Date(f.eventDate).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:900, color:"#1a3a5c" }}>{money(raised, f.currency)}</div>
                            <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", marginTop:1 }}>{(f.contributors || []).length} supporters</div>
                          </div>
                        </div>
                        {pct !== null && (
                          <div style={{ marginTop:10 }}>
                            <div style={{ height:4, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#3a6090,#5a9fd4)", borderRadius:99 }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CREATE ── */}
        {tab === "create" && (
          <div style={{ maxWidth:520 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:"#1e293b", marginBottom:4 }}>Open a Support Fund</h2>
            <p style={{ fontSize:13, fontWeight:500, color:"#6b7280", marginBottom:24, lineHeight:1.7 }}>
              Create a fund to collect support for someone in need. Share the link so family, friends, and community can contribute.
            </p>

            {/* Situation selector */}
            <div style={{ marginBottom:18 }}>
              <label style={S.lbl}>Type of situation *</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {SITUATIONS.map(s => {
                  const active = form.occasion === s.key;
                  return (
                    <button key={s.key} onClick={() => setForm(f => ({ ...f, occasion: s.key }))} style={{ padding:"10px 4px", borderRadius:10, border:`2px solid ${active?"#1a3a5c":"#cbd5e1"}`, background:active?"#dbeafe":"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                      <span style={{ fontSize:20 }}>{s.emoji}</span>
                      <span style={{ fontSize:10, fontWeight:active?800:600, color:active?"#1a3a5c":"#6b7280", fontFamily:"inherit", textAlign:"center", lineHeight:1.2 }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
              {form.occasion && (
                <div style={{ marginTop:8, padding:"8px 12px", background:"#f0f7ff", border:"1px solid #bfdbfe", borderRadius:8, fontSize:12, fontWeight:600, color:"#1a5a8a" }}>
                  {SITUATIONS.find(s => s.key === form.occasion)?.desc}
                </div>
              )}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={S.lbl}>Fund title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder='e.g. "Msaada wa Familia ya Kamau"' style={S.inp} />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={S.lbl}>Your name *</label><input value={form.organiserName} onChange={e => setForm(f => ({ ...f, organiserName: e.target.value }))} placeholder="John Mwangi" style={S.inp} /></div>
                <div><label style={S.lbl}>Phone *</label><input type="tel" value={form.organiserPhone} onChange={e => setForm(f => ({ ...f, organiserPhone: e.target.value }))} placeholder="+255 7xx xxx xxx" style={S.inp} /></div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={S.lbl}>Date (optional)</label><input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} style={S.inp} /></div>
                <div>
                  <label style={S.lbl}>Currency</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={S.inp}>
                    {["TZS","USD","KES","ZAR","NGN","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div><label style={S.lbl}>Target amount (optional)</label><input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="Leave blank if open-ended" style={S.inp} /></div>
              <div><label style={S.lbl}>Brief description (optional)</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the situation to help contributors understand..." style={{ ...S.inp, resize:"vertical", lineHeight:1.6 }} /></div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", border:"1px solid rgba(239,68,68,.3)", borderRadius:9, fontSize:13, fontWeight:700, color:"#b91c1c" }}>{error}</div>}

              <button onClick={create} disabled={creating} style={{ width:"100%", padding:"14px", background:creating?"#94a3b8":"#1a3a5c", color:"#fff", borderRadius:12, border:"none", fontFamily:"inherit", fontWeight:800, fontSize:15, cursor:creating?"not-allowed":"pointer", transition:"background .15s" }}>
                {creating ? "Opening fund..." : "🤲 Open Support Fund →"}
              </button>
            </div>
          </div>
        )}

        {/* ── MY FUNDS ── */}
        {tab === "manage" && <MatukioFindFunds />}
      </div>
    </div>
  );
}

function MatukioFindFunds() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  const find = async () => {
    if (!phone.trim()) return;
    setSearching(true);
    const d = await fetch(`/api/matukio?phone=${encodeURIComponent(phone.trim())}`).then(r => r.json()).catch(() => []);
    setResults(Array.isArray(d) ? d : []);
    setSearching(false);
  };

  return (
    <div style={{ maxWidth:480 }}>
      <h2 style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, color:"#1e293b", marginBottom:6 }}>Find my funds</h2>
      <p style={{ fontSize:13, fontWeight:500, color:"#6b7280", marginBottom:18 }}>Enter your phone number to see all support funds you opened.</p>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && find()} placeholder="+255 7xx xxx xxx" style={{ flex:1, padding:"12px 14px", border:"1.5px solid #cbd5e1", borderRadius:10, fontSize:14, fontFamily:"inherit", fontWeight:500, outline:"none", color:"#1e293b", background:"#fff" }} />
        <button onClick={find} disabled={searching} style={{ padding:"12px 18px", background:"#1a3a5c", color:"#fff", borderRadius:10, fontWeight:800, fontSize:14, border:"none", cursor:"pointer", fontFamily:"inherit" }}>
          {searching ? "..." : "Find"}
        </button>
      </div>
      {results !== null && (results.length === 0 ? (
        <p style={{ color:"#6b7280", fontSize:14 }}>No funds found for that phone number.</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {results.map(f => {
            const sit = [
              { key:"Funeral / Msiba", emoji:"🕊️" }, { key:"Sickness / Ugonjwa", emoji:"🙏" },
              { key:"Accident / Ajali", emoji:"🚑" }, { key:"Fire / Moto", emoji:"🔥" },
              { key:"Other Support", emoji:"🤝" },
            ].find(s => s.key === f.occasion) || { emoji:"🤲" };
            return (
              <button key={f.id} onClick={() => router.push(`/matukio/manage?id=${f.id}&phone=${encodeURIComponent(phone)}`)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                <span style={{ fontSize:26 }}>{sit.emoji}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{f.title}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#6b7280" }}>{f.occasion.split(" / ")[0]} · {new Date(f.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
                <span style={{ marginLeft:"auto", color:"#1a3a5c", fontSize:18 }}>→</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
