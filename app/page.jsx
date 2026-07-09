export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/lib/db";

async function getHomeData() {
  try {
    const [registries, totalItems, totalContribs] = await Promise.all([
      db.registry.findMany({ where: { isPublic: true }, include: { items: { select: { status: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
      db.registryItem.count(),
      db.contribution.count(),
    ]);
    return { registries, totalItems, totalContribs };
  } catch { return { registries: [], totalItems: 0, totalContribs: 0 }; }
}

const OCCASIONS = [
  { emoji: "💍", label: "Wedding", gradient: "linear-gradient(135deg,#d4af37,#8b6914)", desc: "Plan your perfect wedding wishlist" },
  { emoji: "🎂", label: "Birthday", gradient: "linear-gradient(135deg,#e8334a,#9e1c2e)", desc: "Celebrate another trip around the sun" },
  { emoji: "👶", label: "Baby Shower", gradient: "linear-gradient(135deg,#7eb8f7,#2563a8)", desc: "Welcome the newest family member" },
  { emoji: "🎓", label: "Graduation", gradient: "linear-gradient(135deg,#2e7d4f,#1a4f30)", desc: "Mark an incredible milestone" },
  { emoji: "🏠", label: "Housewarming", gradient: "linear-gradient(135deg,#ea7c2b,#a0501a)", desc: "Make a new house a home" },
  { emoji: "💝", label: "Anniversary", gradient: "linear-gradient(135deg,#9b59b6,#6c3483)", desc: "Celebrate years of love" },
];

const OCC_EMOJI = { Wedding:"💍", Birthday:"🎂", "Baby Shower":"👶", Christmas:"🎄", Graduation:"🎓", Housewarming:"🏠", Anniversary:"💝" };

function isExpired(reg) {
  if (!reg.eventDate) return false;
  return new Date(reg.eventDate) < new Date(Date.now() - 86400000);
}

export default async function HomePage() {
  const { registries, totalItems, totalContribs } = await getHomeData();
  const activeRegs = registries.filter(r => !isExpired(r));

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 600, display: "flex", alignItems: "center" }}>
        {/* Background */}
        <div style={{ position: "absolute", inset: 0, background: "var(--maroon-grd)" }} />
        {/* Pattern overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -100, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,42,0.18) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "96px 24px 88px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,150,42,0.2)", border: "1px solid rgba(201,150,42,0.4)", borderRadius: 100, padding: "6px 16px 6px 8px", marginBottom: 28 }}>
              <span style={{ width: 22, height: 22, background: "var(--gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎁</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#e8b84b", letterSpacing: "0.1em" }}>SELF SERVICE GIFT REGISTRY</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: 20, letterSpacing: "-0.02em" }}>
              The Gift They<br />
              <span style={{ background: "var(--gold-shine)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "italic" }}>
                Actually Want.
              </span>
            </h1>
            <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.78)", lineHeight: 1.8, marginBottom: 36, maxWidth: 480 }}>
              Create a registry for weddings, birthdays, baby showers and more. Share with loved ones. Receive exactly what you wish for — no duplicates, no returns.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/registry" style={{ padding: "15px 36px", background: "var(--gold)", color: "#fff", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, display: "inline-block", boxShadow: "var(--shadow-gold)", letterSpacing: "-0.01em" }}>
                Create Free Registry →
              </Link>
              <Link href="/registry" style={{ padding: "15px 28px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, display: "inline-block", backdropFilter: "blur(8px)" }}>
                Find a Registry 🔍
              </Link>
            </div>

            {/* Mini stats */}
            {totalItems > 0 && (
              <div style={{ display: "flex", gap: 28, marginTop: 48, flexWrap: "wrap" }}>
                {[
                  { v: activeRegs.length + "+", l: "Active Registries" },
                  { v: totalItems + "+", l: "Gift Items Listed" },
                  { v: totalContribs + "+", l: "Gifts Exchanged" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "#e8b84b", lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side visual */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="hide-mobile">
            {OCCASIONS.slice(0, 4).map(({ emoji, label, gradient }) => (
              <Link key={label} href={`/registry?occasion=${encodeURIComponent(label)}`} style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16, padding: "20px 16px", textAlign: "center", backdropFilter: "blur(8px)",
                transition: "all 0.2s", display: "block",
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "#fff" }}>{label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── OCCASIONS ── */}
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--gold-dk)", textTransform: "uppercase", marginBottom: 14 }}>Every Occasion</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", marginBottom: 14 }}>Built for celebrations</h2>
          <p style={{ fontSize: 16, color: "var(--gray)", maxWidth: 460, margin: "0 auto" }}>Whether it's a wedding or a housewarming, NIZAWADIE has you covered.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {OCCASIONS.map(({ emoji, label, gradient, desc }) => (
            <Link key={label} href={`/registry?occasion=${encodeURIComponent(label)}`} style={{ display: "block" }}>
              <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", transition: "all 0.22s", boxShadow: "var(--shadow-sm)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
                {/* Gradient top */}
                <div style={{ background: gradient, padding: "28px 16px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 44, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{emoji}</div>
                </div>
                {/* Label */}
                <div style={{ background: "#0f0d0b", padding: "12px 14px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#f5f0e8", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#7a7268", lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "#0f0d0b", padding: "80px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold), var(--maroon), var(--gold))" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 14 }}>How It Works</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", color: "#f5f0e8", fontWeight: 900 }}>
              Gifting made <span style={{ color: "var(--gold-lt)", fontStyle: "italic" }}>beautifully</span> simple
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
            {[
              { n: "01", icon: "✍️", title: "Create in 60 seconds", desc: "Enter your name, pick your occasion, set your event date. No account needed to start." },
              { n: "02", icon: "🛍", title: "Add any product", desc: "Browse our partner stores, or paste any product link from anywhere on the internet." },
              { n: "03", icon: "🔗", title: "Share your link", desc: "Send your unique registry link via WhatsApp, email or social — works everywhere." },
              { n: "04", icon: "🎉", title: "Celebrate perfectly", desc: "Guests claim gifts, contribute as a group, and you receive exactly what you wished for." },
            ].map(({ n, icon, title, desc }, i) => (
              <div key={n} style={{ padding: "32px 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none", background: "transparent", position: "relative" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", marginBottom: 10 }}>STEP {n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, color: "#f5f0e8", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#7a7268", lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 52 }}>
            <Link href="/registry" style={{ padding: "16px 48px", background: "var(--gold)", color: "#fff", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, display: "inline-block", boxShadow: "var(--shadow-gold)", letterSpacing: "-0.01em" }}>
              Start Your Free Registry →
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE REGISTRIES ── */}
      {activeRegs.length > 0 && (
        <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--gold-dk)", textTransform: "uppercase", marginBottom: 12 }}>Live Now</div>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)" }}>Active registries</h2>
            </div>
            <Link href="/registry" style={{ fontSize: 14, color: "var(--maroon)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, borderBottom: "1px solid var(--maroon)", paddingBottom: 1 }}>
              Browse all →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {activeRegs.map(reg => {
              const items = reg.items || [];
              const pct = items.length > 0 ? Math.round((items.filter(i => i.status !== "available").length / items.length) * 100) : 0;
              const emoji = OCC_EMOJI[reg.occasion] || "🎁";
              const daysUntil = reg.eventDate ? Math.ceil((new Date(reg.eventDate) - Date.now()) / 86400000) : null;
              return (
                <Link key={reg.id} href={`/registry/${reg.slug}`} style={{ display: "block" }}>
                  <div style={{ background: "#0f0d0b", borderRadius: "var(--radius-xl)", overflow: "hidden", transition: "all 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)"; }}>
                    <div style={{ height: 3, background: "linear-gradient(90deg, var(--gold), var(--maroon))" }} />
                    <div style={{ padding: "22px 20px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ fontSize: 36 }}>{emoji}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: "rgba(201,150,42,0.18)", color: "#e8b84b", border: "1px solid rgba(201,150,42,0.28)" }}>{reg.occasion}</div>
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#f5f0e8", marginBottom: 5, lineHeight: 1.25 }}>{reg.title}</div>
                      <div style={{ fontSize: 12, color: "#7a7268", marginBottom: 14 }}>
                        by {reg.ownerName}
                        {daysUntil !== null && daysUntil > 0 && <span style={{ marginLeft: 8, color: "#c9962a", fontWeight: 600 }}>· {daysUntil}d to go</span>}
                        {daysUntil === 0 && <span style={{ marginLeft: 8, color: "#e8b84b", fontWeight: 700 }}>· Today! 🎉</span>}
                      </div>
                      {items.length > 0 && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a5650", marginBottom: 6 }}>
                            <span>{items.length} gifts</span><span style={{ color: "#c9962a", fontWeight: 600 }}>{pct}% claimed</span>
                          </div>
                          <div style={{ height: 4, background: "#1e1b18", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--gold), var(--maroon-lt))", borderRadius: 2 }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section style={{ background: "var(--cream)", borderTop: "1px solid var(--border)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--gold-dk)", textTransform: "uppercase", marginBottom: 14 }}>Why NIZAWADIE</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>Everything gifting needs</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {[
              { icon: "👥", title: "Group purchasing", desc: "Too expensive for one person? Let guests pool money together for big-ticket gifts. Track contributions live." },
              { icon: "🌐", title: "Any product, any store", desc: "Add items from our partner stores or paste any link from any website worldwide." },
              { icon: "📱", title: "Live event screen", desc: "Project our live dashboard at your wedding. Confetti fires when someone gives a gift!" },
              { icon: "🚫", title: "Zero duplicates", desc: "Guests claim before buying. Your registry updates instantly so nobody doubles up." },
              { icon: "💳", title: "Easy payments", desc: "Pay via M-Pesa or bank transfer. We buy and deliver on your behalf. 5% service fee." },
              { icon: "⏳", title: "Auto-expires", desc: "Registries automatically expire after your event date so guests know it's still active." },
            ].map(({ icon, title, desc }) => (
              <div key={title}>
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--maroon-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--gray)", lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 24px", textAlign: "center", background: "var(--white)", position: "relative" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <div style={{ fontSize: 60, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>🎁</div>
          <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            Ready to create<br /><span style={{ color: "var(--maroon)", fontStyle: "italic" }}>your registry?</span>
          </h2>
          <p style={{ fontSize: 16, color: "var(--gray)", marginBottom: 36, lineHeight: 1.75 }}>Free forever. No account required. Ready to share in under 60 seconds.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registry" style={{ padding: "16px 44px", background: "var(--maroon)", color: "#fff", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, display: "inline-block", boxShadow: "var(--shadow-maroon)" }}>
              Create Your Registry →
            </Link>
            <Link href="/registry" style={{ padding: "16px 32px", color: "var(--maroon)", border: "2px solid var(--maroon)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, display: "inline-block" }}>
              Find a Registry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
