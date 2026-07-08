export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";

async function getHomeData() {
  try {
    const [registries, totalItems, totalContribs] = await Promise.all([
      db.registry.findMany({
        where: { isPublic: true },
        include: { items: { select: { status: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.registryItem.count(),
      db.contribution.count(),
    ]);
    return { registries, totalItems, totalContribs };
  } catch {
    return { registries: [], totalItems: 0, totalContribs: 0 };
  }
}

export default async function HomePage() {
  const { registries, totalItems, totalContribs } = await getHomeData();

  const occasions = [
    { emoji: "💍", label: "Wedding", href: "/registry?occasion=Wedding" },
    { emoji: "👶", label: "Baby Shower", href: "/registry?occasion=Baby+Shower" },
    { emoji: "🎂", label: "Birthday", href: "/registry?occasion=Birthday" },
    { emoji: "🎓", label: "Graduation", href: "/registry?occasion=Graduation" },
    { emoji: "🏠", label: "Housewarming", href: "/registry?occasion=Housewarming" },
    { emoji: "💝", label: "Anniversary", href: "/registry?occasion=Anniversary" },
  ];

  const occasionEmojis = { "Wedding": "💍", "Birthday": "🎂", "Baby Shower": "👶", "Christmas": "🎄", "Graduation": "🎓", "Housewarming": "🏠", "Anniversary": "💝" };

  return (
    <div style={{ background: "var(--white)" }}>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(160deg, var(--maroon-dk) 0%, var(--maroon) 55%, var(--maroon-lt) 100%)",
        padding: "100px 24px 90px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative rings */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          {/* Label */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "6px 16px 6px 10px", marginBottom: 32 }}>
            <span style={{ fontSize: 18 }}>🎁</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "0.08em" }}>SELF SERVICE GIFT REGISTRY PLATFORM</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 8vw, 80px)", fontWeight: 800, color: "var(--white)", lineHeight: 1.05, marginBottom: 20, letterSpacing: "-0.02em" }}>
            Make Every Gift{" "}
            <span style={{ color: "var(--gold-lt)", fontStyle: "italic" }}>Perfect.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.7, fontWeight: 300 }}>
            Create your gift registry in 60 seconds. Share with family and friends. Receive exactly the gifts you want — no duplicates, no surprises.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registry" style={{ padding: "15px 36px", background: "var(--gold)", color: "var(--white)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, display: "inline-block", boxShadow: "0 4px 20px rgba(201,150,42,0.4)", transition: "all 0.2s" }}>
              Create Free Registry →
            </Link>
            <Link href="/registry" style={{ padding: "15px 32px", background: "rgba(255,255,255,0.12)", color: "var(--white)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, display: "inline-block", backdropFilter: "blur(8px)", transition: "all 0.2s" }}>
              Find a Registry 🔍
            </Link>
          </div>

          {/* Stats */}
          {(totalItems > 0 || totalContribs > 0) && (
            <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
              {[
                { value: registries.length, label: "Active Registries" },
                { value: totalItems.toLocaleString(), label: "Gift Items Listed" },
                { value: totalContribs.toLocaleString(), label: "Gifts Given" },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "var(--white)", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── OCCASIONS ── */}
      <section style={{ padding: "72px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Any Occasion</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "var(--text)" }}>Create a registry for any celebration</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
          {occasions.map(({ emoji, label, href }) => (
            <Link key={label} href={href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "28px 16px", background: "var(--white)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-xl)",
              transition: "all 0.2s", textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={undefined}>
              <div style={{ fontSize: 38 }}>{emoji}</div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--text)", textAlign: "center" }}>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "var(--maroon)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold-lt)", marginBottom: 14 }}>How It Works</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", color: "var(--white)", fontWeight: 800 }}>Simple. Elegant. Free.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { n: "01", icon: "✍️", title: "Create your registry", desc: "Fill in your name, occasion and event date. No account needed — takes under 60 seconds." },
              { n: "02", icon: "🛍", title: "Add gifts from our stores", desc: "Browse products from our partner stores and add them to your registry with one click." },
              { n: "03", icon: "🔗", title: "Share your link", desc: "Send your unique registry link to family and friends via WhatsApp, email or social media." },
              { n: "04", icon: "🎉", title: "Receive perfect gifts", desc: "Friends claim items before buying — no duplicates. We handle payment and delivery." },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-xl)", padding: "28px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>STEP {n}</div>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--white)", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/registry" style={{ padding: "15px 40px", background: "var(--gold)", color: "var(--white)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, display: "inline-block", boxShadow: "0 4px 20px rgba(201,150,42,0.35)" }}>
              Start Your Registry — Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE REGISTRIES ── */}
      {registries.length > 0 && (
        <section style={{ padding: "72px 24px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Live Registries</div>
              <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)" }}>Recently created</h2>
            </div>
            <Link href="/registry" style={{ fontSize: 14, color: "var(--maroon)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              View all registries →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {registries.map(reg => {
              const items = reg.items || [];
              const purchased = items.filter(i => i.status === "purchased").length;
              const claimed = items.filter(i => i.status === "claimed").length;
              const pct = items.length > 0 ? Math.round(((purchased + claimed) / items.length) * 100) : 0;
              const daysUntil = reg.eventDate ? Math.ceil((new Date(reg.eventDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <Link key={reg.id} href={`/registry/${reg.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "22px", boxShadow: "var(--shadow-sm)", transition: "all 0.2s", height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 32 }}>{occasionEmojis[reg.occasion] || "🎁"}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: "var(--maroon-bg)", color: "var(--maroon)", border: "1px solid rgba(123,28,46,0.15)" }}>{reg.occasion}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>{reg.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 14 }}>
                      by {reg.ownerName}
                      {daysUntil !== null && daysUntil > 0 && <span style={{ marginLeft: 8, color: "var(--gold-dk)", fontWeight: 500 }}>· {daysUntil} days away</span>}
                    </div>
                    {items.length > 0 && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
                          <span>{items.length} gifts</span><span style={{ color: "var(--gold-dk)", fontWeight: 600 }}>{pct}% claimed</span>
                        </div>
                        <div style={{ height: 5, background: "var(--gray-bg)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--gold), var(--maroon-lt))", borderRadius: 3, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section style={{ background: "var(--gold-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Why NIZAWADIE</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>Everything you need for gifting</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {[
              { icon: "🔗", title: "Shareable link", desc: "One link to share anywhere — WhatsApp, email, social media. Works on any device." },
              { icon: "🚫", title: "No duplicates", desc: "Gifters claim items before buying. Your registry auto-updates so nobody buys the same thing twice." },
              { icon: "📱", title: "Live event screen", desc: "Project our live dashboard at your wedding or party. Confetti fires when someone gives a gift!" },
              { icon: "💳", title: "Secure payments", desc: "Pay via M-Pesa or bank transfer. We purchase and deliver on your behalf. 5% service fee." },
              { icon: "🛍", title: "Multi-store products", desc: "Add gifts from any of our partner Shopify stores to your registry with one click." },
              { icon: "🏆", title: "Top gifter leaderboard", desc: "Celebrate your most generous guests publicly on the live screen and registry page." },
            ].map(({ icon, title, desc }) => (
              <div key={title}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "88px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🎁</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "var(--text)", marginBottom: 16, lineHeight: 1.15 }}>
            Ready to create your registry?
          </h2>
          <p style={{ fontSize: 16, color: "var(--text2)", marginBottom: 36, lineHeight: 1.7 }}>
            Free forever. No account required to start. Set up in under 60 seconds.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registry" style={{ padding: "15px 40px", background: "var(--maroon)", color: "var(--white)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, display: "inline-block", boxShadow: "0 4px 20px rgba(123,28,46,0.3)" }}>
              Create Your Registry →
            </Link>
            <Link href="/registry" style={{ padding: "15px 30px", background: "transparent", color: "var(--maroon)", border: "2px solid var(--maroon)", borderRadius: "var(--radius-xl)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, display: "inline-block" }}>
              Find a Registry
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
