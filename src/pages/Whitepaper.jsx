import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft, Check } from "lucide-react";
import Logo from "@/components/shared/Logo";

const TOC = ["intro", "problem", "solution", "festcoin", "mvp", "organizers", "djs", "brands", "partygoers", "roadmap", "business", "technology", "mission", "cta"];
const AUDIENCES = ["organizers", "djs", "brands", "partygoers"];

const STATUS_CLASS = {
  live: "bg-success/15 text-success",
  next: "bg-primary/15 text-primary",
  planned: "bg-secondary text-muted-foreground",
  vision: "bg-secondary text-muted-foreground",
};

function Section({ id, kicker, title, sub, children }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-20">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1.5">{kicker}</p>
        <h2 className="font-heading font-bold text-2xl text-foreground leading-tight">{title}</h2>
        {sub && <p className="text-muted-foreground text-sm mt-1.5">{sub}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function Whitepaper() {
  const { t } = useLanguage();
  const w = (key) => t(`whitepaper.${key}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> {w("nav.back")}
          </Link>
          <Logo size={34} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 flex flex-col lg:flex-row gap-10">
        {/* TOC */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{w("toc.heading")}</p>
            <nav className="flex lg:flex-col flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {TOC.map((k) => (
                <a key={k} href={`#${k}`} className="text-muted-foreground hover:text-primary transition-colors">{w(`toc.${k}`)}</a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="flex-1 min-w-0 space-y-16">
          {/* Hero */}
          <section className="space-y-3">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded">{w("hero.badge")}</span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl leading-tight">{w("hero.title")}</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">{w("hero.sub")}</p>
          </section>

          <Section id="intro" kicker={w("intro.kicker")} title={w("intro.title")}>
            {w("intro.paras").map((p, i) => <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>)}
          </Section>

          <Section id="problem" kicker={w("problem.kicker")} title={w("problem.title")} sub={w("problem.sub")}>
            <ul className="space-y-2.5">
              {w("problem.items").map((it, i) => (
                <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed"><span className="text-primary mt-1">•</span><span>{it}</span></li>
              ))}
            </ul>
          </Section>

          <Section id="solution" kicker={w("solution.kicker")} title={w("solution.title")}>
            <p className="text-muted-foreground leading-relaxed">{w("solution.intro")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {w("solution.features").map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground">{f}</div>
              ))}
            </div>
          </Section>

          <Section id="festcoin" kicker={w("festcoin.kicker")} title={w("festcoin.title")}>
            <p className="text-muted-foreground leading-relaxed">{w("festcoin.intro")}</p>
            <ul className="space-y-2.5">
              {w("festcoin.uses").map((u, i) => (
                <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed"><span className="text-primary mt-1">•</span><span>{u}</span></li>
              ))}
            </ul>
            <p className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-xl p-3 leading-relaxed">{w("festcoin.disclaimer")}</p>
          </Section>

          <Section id="mvp" kicker={w("mvp.kicker")} title={w("mvp.title")} sub={w("mvp.sub")}>
            <ul className="space-y-2.5">
              {w("mvp.items").map((it, i) => (
                <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} /><span>{it}</span></li>
              ))}
            </ul>
          </Section>

          {AUDIENCES.map((aud) => (
            <Section key={aud} id={aud} kicker={w("benefits.kicker")} title={w(`benefits.${aud}.title`)}>
              <ul className="space-y-2.5">
                {w(`benefits.${aud}.items`).map((it, i) => (
                  <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} /><span>{it}</span></li>
                ))}
              </ul>
            </Section>
          ))}

          <Section id="roadmap" kicker={w("roadmap.kicker")} title={w("roadmap.title")} sub={w("roadmap.sub")}>
            <div className="space-y-3">
              {w("roadmap.phases").map((ph, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-heading font-semibold text-foreground text-sm">{ph.label}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_CLASS[ph.status] || "bg-secondary text-muted-foreground"}`}>{ph.statusLabel}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{ph.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="business" kicker={w("business.kicker")} title={w("business.title")} sub={w("business.sub")}>
            <ul className="space-y-2.5">
              {w("business.items").map((it, i) => (
                <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed"><span className="text-primary mt-1">•</span><span>{it}</span></li>
              ))}
            </ul>
          </Section>

          <Section id="technology" kicker={w("technology.kicker")} title={w("technology.title")} sub={w("technology.sub")}>
            <ul className="space-y-2.5">
              {w("technology.items").map((it, i) => (
                <li key={i} className="flex gap-2.5 text-muted-foreground leading-relaxed"><span className="text-primary mt-1">•</span><span>{it}</span></li>
              ))}
            </ul>
          </Section>

          <Section id="mission" kicker={w("mission.kicker")} title={w("mission.title")}>
            <p className="text-muted-foreground leading-relaxed">{w("mission.body")}</p>
          </Section>

          <section id="cta" className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-4 scroll-mt-20">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{w("cta.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl text-foreground">{w("cta.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{w("cta.sub")}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/app" className="bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">{w("cta.pilot")}</Link>
              <Link to="/events" className="bg-card border border-border text-foreground hover:border-primary/40 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">{w("cta.organizer")}</Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}