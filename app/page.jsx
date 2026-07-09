export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/lib/db";

async function getHomeData() {
  try {
    const registries = await db.registry.findMany({
      where: { isPublic: true },
      include: { items: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }).catch(() => []);
    const totalContribs = await db.contribution.count().catch(() => 0);
    return { registries, totalContribs };
  } catch { return { registries: [], totalContribs: 0 }; }
}

function isExpired(r) {
  return r.eventDate && new Date(r.eventDate) < new Date(Date.now() - 86400000);
}

const OCC_EMOJI = { Wedding:"💍", Birthday:"🎂", "Baby Shower":"👶", Christmas:"🎄", Graduation:"🎓", Housewarming:"🏠", Anniversary:"💝" };
const OCC_GRAD  = {
  Wedding: ["#c9a227","#7b6200"],
  Birthday: ["#e8334a","#8b0020"],
  "Baby Shower": ["#4aa3e8","#1a5a9a"],
  Graduation: ["#2e9e5e","#135e32"],
  Housewarming: ["#e87c2b","#8b3e00"],
  Anniversary: ["#9b59b6","#5b1e8c"],
  Christmas: ["#c0392b","#1e7a3c"],
};

const OCCASIONS = [
  { label:"Wedding",     emoji:"💍" },
  { label:"Birthday",    emoji:"🎂" },
  { label:"Baby Shower", emoji:"👶" },
  { label:"Graduation",  emoji:"🎓" },
  { label:"Housewarming",emoji:"🏠" },
  { label:"Anniversary", emoji:"💝" },
];

export default async function HomePage() {
  const { registries, totalContribs } = await getHomeData();
  const active = registries.filter(r => !isExpired(r));

  return (
    <div>
      {/* ── Hero banner ── */}
      <div style={{ background:"linear-gradient(160deg,var(--maroon-dk),var(--maroon),var(--maroon-lt))", padding:"28px 20px 36px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-80, left:-20, width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />

        <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.7)", letterSpacing:"0.06em", marginBottom:10, fontFamily:"var(--font-body)" }}>
          {active.length > 0 ? `${active.length} active registries` : "Start celebrating"}
        </p>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:32, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:8, letterSpacing:"-0.02em" }}>
          The gift they<br/><span style={{ color:"var(--gold-lt)", fontStyle:"italic" }}>actually want.</span>
        </h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.72)", marginBottom:24, lineHeight:1.6 }}>
          Create a registry for any occasion. Share with everyone.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <Link href="/registry?tab=create" style={{ flex:1, padding:"14px", background:"var(--gold)", color:"#fff", borderRadius:"var(--r-xl)", fontWeight:700, fontSize:15, textAlign:"center", display:"block" }}>
            Create Registry
          </Link>
          <Link href="/registry" style={{ flex:1, padding:"14px", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:"var(--r-xl)", fontWeight:600, fontSize:15, textAlign:"center", display:"block", backdropFilter:"blur(8px)" }}>
            Find One 🔍
          </Link>
        </div>
      </div>

      {/* ── Occasions horizontal scroll ── */}
      <div style={{ padding:"24px 0 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", marginBottom:14 }}>
          <span style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700 }}>Occasions</span>
          <Link href="/registry" style={{ fontSize:13, color:"var(--maroon)", fontWeight:600 }}>See all</Link>
        </div>
        <div style={{ display:"flex", gap:12, paddingLeft:20, paddingRight:20, overflowX:"auto", paddingBottom:4 }}>
          {OCCASIONS.map(({ label, emoji }) => {
            const [c1, c2] = OCC_GRAD[label] || ["#c9962a","#7b1c2e"];
            return (
              <Link key={label} href={`/registry?occasion=${encodeURIComponent(label)}`} style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:8, textDecoration:"none" }}>
                <div style={{ width:70, height:70, borderRadius:22, background:`linear-gradient(145deg,${c1},${c2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, boxShadow:`0 4px 16px ${c1}44` }}>
                  {emoji}
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:"var(--text2)", textAlign:"center", lineHeight:1.3 }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Stats pill ── */}
      {totalContribs > 0 && (
        <div style={{ margin:"24px 20px 0", padding:"14px 18px", background:"var(--gold-bg)", border:"1px solid rgba(201,150,42,0.2)", borderRadius:"var(--r-lg)", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:28 }}>🎁</div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, color:"var(--maroon)", lineHeight:1 }}>{totalContribs}+ gifts given</div>
            <div style={{ fontSize:12, color:"var(--gold-dk)", marginTop:2 }}>through NIZAWADIE registries</div>
          </div>
        </div>
      )}

      {/* ── Active registries ── */}
      {active.length > 0 && (
        <div style={{ marginTop:28, padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <span style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700 }}>Active Registries</span>
            <Link href="/registry" style={{ fontSize:13, color:"var(--maroon)", fontWeight:600 }}>View all</Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {active.slice(0, 5).map(reg => {
              const items = reg.items || [];
              const taken = items.filter(i => i.status !== "available").length;
              const pct = items.length > 0 ? Math.round((taken / items.length) * 100) : 0;
              const emoji = OCC_EMOJI[reg.occasion] || "🎁";
              const [c1, c2] = OCC_GRAD[reg.occasion] || ["#c9962a","#7b1c2e"];
              const days = reg.eventDate ? Math.ceil((new Date(reg.eventDate) - Date.now()) / 86400000) : null;

              return (
                <Link key={reg.id} href={`/registry/${reg.slug}`} style={{ display:"block", background:"var(--black)", borderRadius:"var(--r-lg)", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.12)", WebkitTapHighlightColor:"transparent" }}>
                  <div style={{ height:4, background:`linear-gradient(90deg,${c1},${c2})` }} />
                  <div style={{ padding:"16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${c1},${c2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{emoji}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"#f5f0e8", lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{reg.title}</div>
                        <div style={{ fontSize:12, color:"#7a7268", marginTop:2 }}>
                          by {reg.ownerName}
                          {days !== null && days >= 0 && <span style={{ color:c1, marginLeft:6, fontWeight:600 }}>· {days === 0 ? "Today! 🎉" : `${days}d away`}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:800, color:c1, fontFamily:"var(--font-display)", flexShrink:0 }}>{pct}%</div>
                    </div>
                    {items.length > 0 && (
                      <div style={{ height:3, background:"#1e1b18", borderRadius:2, overflow:"hidden", marginTop:12 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${c1},${c2})`, borderRadius:2 }} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div style={{ margin:"32px 20px 0", background:"var(--black)", borderRadius:"var(--r-xl)", overflow:"hidden" }}>
        <div style={{ padding:"20px 20px 4px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"var(--gold)", textTransform:"uppercase", marginBottom:8, fontFamily:"var(--font-body)" }}>How it works</div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:"#f5f0e8" }}>Gifting in 4 steps</h2>
        </div>
        {[
          { n:"1", icon:"✍️", title:"Create in 60 sec", desc:"No account needed. Pick your occasion, enter your name, get a link instantly." },
          { n:"2", icon:"🛍", title:"Add any product", desc:"From our stores or paste any link from any website worldwide." },
          { n:"3", icon:"🔗", title:"Share your link", desc:"WhatsApp, email, social — it works everywhere on any device." },
          { n:"4", icon:"🎉", title:"Receive what you love", desc:"Guests claim gifts before buying. No duplicates, ever." },
        ].map(({ n, icon, title, desc }, i, arr) => (
          <div key={n} style={{ display:"flex", gap:14, padding:"16px 20px", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`rgba(201,150,42,0.15)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"#f5f0e8", marginBottom:3 }}>{title}</div>
              <div style={{ fontSize:13, color:"#7a7268", lineHeight:1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
        <div style={{ padding:"20px" }}>
          <Link href="/registry?tab=create" style={{ display:"block", padding:"15px", background:"var(--gold)", color:"#fff", borderRadius:"var(--r-xl)", fontWeight:700, fontSize:15, textAlign:"center" }}>
            Start Free Registry →
          </Link>
        </div>
      </div>

      <div style={{ height:16 }} />
    </div>
  );
}
