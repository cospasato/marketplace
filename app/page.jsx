export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/lib/db";

async function getHomeData() {
  try {
    const [registries, totalContribs, totalItems] = await Promise.all([
      db.registry.findMany({ where:{isPublic:true}, include:{items:{select:{status:true}}}, orderBy:{createdAt:"desc"}, take:8 }).catch(()=>[]),
      db.contribution.count().catch(()=>0),
      db.registryItem.count().catch(()=>0),
    ]);
    return { registries, totalContribs, totalItems };
  } catch { return { registries:[], totalContribs:0, totalItems:0 }; }
}

function isExpired(r) {
  return r.eventDate && new Date(r.eventDate) < new Date(Date.now() - 86400000);
}

const OCC_EMOJI = { Wedding:"💍", Birthday:"🎂", "Baby Shower":"👶", Christmas:"🎄", Graduation:"🎓", Housewarming:"🏠", Anniversary:"💝" };
const OCC_GRAD  = {
  Wedding:     ["#c9a227","#7b6200"],
  Birthday:    ["#e8334a","#8b0020"],
  "Baby Shower":["#4aa3e8","#1a5a9a"],
  Graduation:  ["#2e9e5e","#135e32"],
  Housewarming:["#e87c2b","#8b3e00"],
  Anniversary: ["#9b59b6","#5b1e8c"],
  Christmas:   ["#c0392b","#1e7a3c"],
};
const OCCASIONS = [
  {label:"Wedding",emoji:"💍"},{label:"Birthday",emoji:"🎂"},{label:"Baby Shower",emoji:"👶"},
  {label:"Graduation",emoji:"🎓"},{label:"Housewarming",emoji:"🏠"},{label:"Anniversary",emoji:"💝"},
];

export default async function HomePage() {
  const { registries, totalContribs, totalItems } = await getHomeData();
  const active = registries.filter(r => !isExpired(r));

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{ background:"var(--maroon-grd)", borderRadius:"var(--r-xl)", padding:"40px 32px 44px", marginBottom:28, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-40, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-80, left:-20, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />
        <div style={{ position:"relative" }}>
          <p style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.65)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10, fontFamily:"var(--font-body)" }}>
            Gift Registry Platform
          </p>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(28px,5vw,52px)", fontWeight:900, color:"#fff", lineHeight:1.08, marginBottom:12, letterSpacing:"-0.02em" }}>
            The gift they<br/><span style={{ color:"var(--gold-lt)", fontStyle:"italic" }}>actually want.</span>
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.72)", marginBottom:28, lineHeight:1.65, maxWidth:480 }}>
            Create a gift registry for weddings, birthdays & more. Share with loved ones. Receive exactly what you wish for — no duplicates.
          </p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Link href="/registry?tab=create" className="btn-gold" style={{ flex:"0 0 auto", padding:"13px 28px" }}>
              Create Free Registry
            </Link>
            <Link href="/registry" className="btn-outline" style={{ flex:"0 0 auto", padding:"12px 24px", borderColor:"rgba(255,255,255,0.5)", color:"#fff" }}>
              Browse Registries
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {(totalContribs > 0 || active.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
          {[
            { value: active.length + "+", label:"Active Registries", color:"var(--maroon)" },
            { value: totalItems + "+",    label:"Gift Items",         color:"var(--gold-dk)" },
            { value: totalContribs + "+", label:"Gifts Given",        color:"var(--green)" },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ background:"var(--white)", borderRadius:"var(--r-lg)", padding:"16px 14px", textAlign:"center", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(20px,3vw,28px)", fontWeight:800, color, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11, color:"var(--gray)", marginTop:5, fontFamily:"var(--font-body)" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Occasions ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <h2 style={{ fontSize:"clamp(17px,3vw,22px)" }}>Browse by Occasion</h2>
          <Link href="/registry" style={{ fontSize:13, color:"var(--maroon)", fontWeight:600 }}>See all →</Link>
        </div>
        {/* Scrollable on mobile, grid on desktop */}
        <div className="occasions-scroll">
          {OCCASIONS.map(({ label, emoji }) => {
            const [c1, c2] = OCC_GRAD[label] || ["#c9962a","#7b1c2e"];
            return (
              <Link key={label} href={`/registry?occasion=${encodeURIComponent(label)}`} className="occasion-chip">
                <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(145deg,${c1},${c2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:6, boxShadow:`0 3px 12px ${c1}55`, flexShrink:0 }}>{emoji}</div>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text2)", textAlign:"center", lineHeight:1.3 }}>{label}</span>
              </Link>
            );
          })}
        </div>
        <style>{`
          .occasions-scroll {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
          }
          .occasion-chip {
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            padding: 14px 8px; background: var(--white);
            border-radius: var(--r-lg); border: 1px solid var(--border);
            box-shadow: var(--shadow-xs); transition: all 0.18s; text-decoration: none;
          }
          .occasion-chip:hover { border-color: var(--maroon); box-shadow: var(--shadow-md); transform: translateY(-2px); }
          @media (max-width: 768px) {
            .occasions-scroll {
              display: flex; overflow-x: auto; gap: 10px;
              padding-bottom: 4px; margin: 0 -16px; padding-left: 16px; padding-right: 16px;
            }
            .occasion-chip { flex-shrink: 0; min-width: 70px; padding: 10px 8px; }
          }
        `}</style>
      </div>

      {/* ── Active registries ── */}
      {active.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <h2 style={{ fontSize:"clamp(17px,3vw,22px)" }}>Active Registries</h2>
            <Link href="/registry" style={{ fontSize:13, color:"var(--maroon)", fontWeight:600 }}>View all →</Link>
          </div>
          <div className="registry-grid">
            {active.slice(0, 6).map(reg => {
              const items = reg.items || [];
              const taken = items.filter(i => i.status !== "available").length;
              const pct = items.length > 0 ? Math.round((taken / items.length) * 100) : 0;
              const [c1, c2] = OCC_GRAD[reg.occasion] || ["#c9962a","#7b1c2e"];
              const days = reg.eventDate ? Math.ceil((new Date(reg.eventDate) - Date.now()) / 86400000) : null;
              return (
                <Link key={reg.id} href={`/registry/${reg.slug}`} style={{ display:"block", background:"var(--black)", borderRadius:"var(--r-lg)", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.12)", textDecoration:"none", transition:"transform 0.18s, box-shadow 0.18s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.12)"; }}>
                  <div style={{ height:3, background:`linear-gradient(90deg,${c1},${c2})` }} />
                  <div style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:40, height:40, borderRadius:11, background:`linear-gradient(135deg,${c1},${c2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{OCC_EMOJI[reg.occasion]||"🎁"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:700, color:"#f0ece6", lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{reg.title}</div>
                        <div style={{ fontSize:11, color:"#6b6560", marginTop:1 }}>
                          {reg.ownerName}
                          {days !== null && days >= 0 && <span style={{ marginLeft:6, color:c1, fontWeight:600 }}>{days===0?"· Today!":"· "+days+"d"}</span>}
                        </div>
                      </div>
                      {pct > 0 && <span style={{ fontSize:12, fontWeight:800, color:c1 }}>{pct}%</span>}
                    </div>
                    {items.length > 0 && (
                      <div style={{ height:3, background:"#1e1b18", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${c1},${c2})`, borderRadius:2 }} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <style>{`
            .registry-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 14px;
            }
            @media (max-width: 768px) {
              .registry-grid { grid-template-columns: 1fr; gap: 10px; }
            }
          `}</style>
        </div>
      )}

      {/* ── How it works ── */}
      <div style={{ background:"var(--black)", borderRadius:"var(--r-xl)", overflow:"hidden", marginBottom:8 }}>
        <div style={{ padding:"24px 24px 8px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"var(--gold)", textTransform:"uppercase", marginBottom:8, fontFamily:"var(--font-body)" }}>How it works</div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(20px,3vw,28px)", fontWeight:800, color:"#f5f0e8" }}>Gifting in 4 simple steps</h2>
        </div>
        <div className="steps-grid">
          {[
            {icon:"✍️",title:"Create in 60 seconds",desc:"No account needed. Pick your occasion, add a date, and get your link instantly."},
            {icon:"🛍",title:"Add any product",desc:"Browse our partner stores or paste any link from any website worldwide."},
            {icon:"🔗",title:"Share your link",desc:"Send via WhatsApp, email or social. Works on any device."},
            {icon:"🎉",title:"Get perfect gifts",desc:"Guests claim before buying. Zero duplicates, zero stress."},
          ].map(({icon,title,desc},i,arr) => (
            <div key={i} style={{ padding:"20px 22px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.07)":"none" }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"#f5f0e8", marginBottom:7 }}>{title}</div>
              <div style={{ fontSize:13, color:"#7a7268", lineHeight:1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:"20px 24px" }}>
          <Link href="/registry?tab=create" className="btn-gold" style={{ justifyContent:"center" }}>Start Free Registry →</Link>
        </div>
        <style>{`
          .steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
          }
          @media (max-width: 768px) {
            .steps-grid { grid-template-columns: 1fr; }
            .steps-grid > div { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.07); }
            .steps-grid > div:last-child { border-bottom: none; }
          }
        `}</style>
      </div>
    </div>
  );
}
