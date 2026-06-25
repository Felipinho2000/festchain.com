import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Ticket, QrCode, Wallet, ShieldCheck, Sparkles, LayoutDashboard,
  Music2, Target, Zap, Users, TrendingUp, Globe, Coins, ChevronRight,
  ArrowLeft, Menu, X, ChevronDown, ChevronUp, Layers, Lightbulb, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

// Table of contents sections
const SECTIONS = [
  { id: "intro",       icon: Lightbulb },
  { id: "problem",     icon: Zap },
  { id: "solution",    icon: ShieldCheck },
  { id: "festcoin",    icon: Coins },
  { id: "mvp",         icon: Layers },
  { id: "organizers",  icon: LayoutDashboard },
  { id: "djs",         icon: Music2 },
  { id: "brands",      icon: Building2 },
  { id: "partygoers",  icon: Ticket },
  { id: "roadmap",     icon: TrendingUp },
  { id: "business",    icon: Target },
  { id: "technology",  icon: QrCode },
  { id: "mission",     icon: Globe },
  { id: "cta",         icon: Users },
];

const AUDIENCE_ICONS = { organizers: LayoutDashboard, djs: Music2, brands: Building2, partygoers: Ticket };

const ROADMAP_STYLES = {
  live:    { dot: "bg-primary", badge: "text-primary bg-primary/10 border-primary/30" },
  next:    { dot: "bg-amber-400", badge: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  planned: { dot: "bg-[#555]",   badge: "text-[#888] bg-[#1a1a1a] border-[#333]" },
  vision:  { dot: "bg-purple-500", badge: "text-purple-400 bg-purple-900/20 border-purple-700/30" },
};

function SectionHeading({ kicker, title, subtitle }) {
  return (
    <div className="mb-8">
      {kicker && <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">{kicker}</p>}
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-2">{title}</h2>
      {subtitle && <p className="text-[#888] text-sm leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[#aaa] text-sm leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function AudienceCard({ sectionKey, icon: Icon, title, items }) {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all">
      <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="font-heading font-bold text-white text-lg mb-4">{title}</h3>
      <BulletList items={items} />
    </div>
  );
}

function MobileAccordion({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#111] hover:bg-[#141414] transition-colors text-left"
      >
        <span className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <span className="font-heading font-semibold text-white text-sm">{title}</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
      </button>
      {open && <div className="px-5 py-5 bg-[#0d0d0d] border-t border-[#1f1f1f]">{children}</div>}
    </div>
  );
}

export default function Whitepaper() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const isOrganizer = currentUser?.role === "admin" || currentUser?.approved_organizer === true;
  const wp = t("whitepaper");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(`wp-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const organizerTo = !authed ? "/register" : !isOrganizer ? null : "/dashboard";
  const partygoerTo = authed ? "/events" : "/register";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/"><Logo size={26} /></Link>
            <span className="hidden sm:block text-[#333]">|</span>
            <span className="hidden sm:block text-xs text-[#666] font-medium uppercase tracking-wider">Whitepaper</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/">
              <Button variant="ghost" className="text-[#888] hover:text-white h-9 text-sm hidden sm:flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> {wp.nav.back}
              </Button>
            </Link>
            <button className="sm:hidden p-2 text-[#888] hover:text-white" onClick={() => setMobileMenuOpen(m => !m)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#1f1f1f] px-5 py-3 bg-[#0d0d0d]/98 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="text-left text-sm text-[#888] hover:text-primary py-1 flex items-center gap-2">
                <s.icon className="w-3.5 h-3.5" />
                {wp.toc[s.id]}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-5 pt-24 pb-20 flex gap-10">

        {/* ── DESKTOP TOC ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-[10px] text-[#555] uppercase tracking-widest font-bold mb-3 px-2">{wp.toc.heading}</p>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="w-full text-left px-2 py-1.5 text-xs text-[#666] hover:text-primary rounded-lg hover:bg-primary/5 transition-all flex items-center gap-2 group">
                <s.icon className="w-3 h-3 text-[#444] group-hover:text-primary flex-shrink-0" />
                {wp.toc[s.id]}
              </button>
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 space-y-16">

          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-[#1f1f1f] p-8 sm:p-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {wp.hero.badge}
              </div>
              <h1 className="font-heading font-bold text-3xl sm:text-[44px] leading-[1.1] tracking-tight text-white mb-4">
                {wp.hero.title}
              </h1>
              <p className="text-[#aaa] text-base sm:text-lg leading-relaxed">{wp.hero.sub}</p>
            </div>
          </div>

          {/* 1. Introduction */}
          <section id="wp-intro">
            <SectionHeading kicker={wp.intro.kicker} title={wp.intro.title} />
            <div className="space-y-4">
              {wp.intro.paras.map((p, i) => <p key={i} className="text-[#aaa] text-sm sm:text-base leading-relaxed">{p}</p>)}
            </div>
          </section>

          {/* 2. Problem */}
          <section id="wp-problem" className="bg-[#111] rounded-2xl p-7 sm:p-9 border border-[#1f1f1f]">
            <SectionHeading kicker={wp.problem.kicker} title={wp.problem.title} subtitle={wp.problem.sub} />
            <BulletList items={wp.problem.items} />
          </section>

          {/* 3. Solution */}
          <section id="wp-solution">
            <SectionHeading kicker={wp.solution.kicker} title={wp.solution.title} />
            <p className="text-[#aaa] text-sm sm:text-base leading-relaxed mb-6">{wp.solution.intro}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wp.solution.features.map((f, i) => (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 hover:border-primary/20 transition-all">
                  <p className="text-white text-sm font-semibold">{f}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. FestCoin */}
          <section id="wp-festcoin" className="bg-gradient-to-br from-primary/5 to-[#111] rounded-2xl p-7 sm:p-9 border border-primary/20">
            <SectionHeading kicker={wp.festcoin.kicker} title={wp.festcoin.title} />
            <p className="text-[#aaa] text-sm sm:text-base leading-relaxed mb-6">{wp.festcoin.intro}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {wp.festcoin.uses.map((u, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Coins className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <p className="text-[#bbb] text-sm">{u}</p>
                </div>
              ))}
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-[#888] text-xs leading-relaxed italic">{wp.festcoin.disclaimer}</p>
            </div>
          </section>

          {/* 5. MVP Phase */}
          <section id="wp-mvp">
            <SectionHeading kicker={wp.mvp.kicker} title={wp.mvp.title} subtitle={wp.mvp.sub} />
            <BulletList items={wp.mvp.items} />
          </section>

          {/* 6–9. Audience Benefits — desktop grid, mobile accordion */}
          <section>
            <div className="mb-8">
              <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">{wp.benefits.kicker}</p>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">{wp.benefits.title}</h2>
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-5">
              {(["organizers", "djs", "brands", "partygoers"]).map(key => (
                <div key={key} id={`wp-${key}`}>
                  <AudienceCard
                    sectionKey={key}
                    icon={AUDIENCE_ICONS[key]}
                    title={wp.benefits[key].title}
                    items={wp.benefits[key].items}
                  />
                </div>
              ))}
            </div>

            {/* Mobile */}
            <div className="sm:hidden space-y-3">
              {(["organizers", "djs", "brands", "partygoers"]).map(key => (
                <div key={key} id={`wp-${key}`}>
                  <MobileAccordion title={wp.benefits[key].title} icon={AUDIENCE_ICONS[key]}>
                    <BulletList items={wp.benefits[key].items} />
                  </MobileAccordion>
                </div>
              ))}
            </div>
          </section>

          {/* 10. Roadmap */}
          <section id="wp-roadmap" className="bg-[#111] rounded-2xl p-7 sm:p-9 border border-[#1f1f1f]">
            <SectionHeading kicker={wp.roadmap.kicker} title={wp.roadmap.title} subtitle={wp.roadmap.sub} />
            <div className="relative">
              <div className="absolute left-4 top-3 bottom-3 w-px bg-[#222]" />
              <div className="space-y-5">
                {wp.roadmap.phases.map((phase, i) => {
                  const style = ROADMAP_STYLES[phase.status] || ROADMAP_STYLES.planned;
                  return (
                    <div key={i} className="relative pl-11">
                      <div className={`absolute left-[13px] top-3 w-3 h-3 rounded-full border-2 border-[#111] ${style.dot}`} />
                      <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-heading font-bold text-white text-sm">{phase.label}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}>
                            {phase.statusLabel}
                          </span>
                        </div>
                        <p className="text-[#777] text-sm leading-relaxed">{phase.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 11. Business Model */}
          <section id="wp-business">
            <SectionHeading kicker={wp.business.kicker} title={wp.business.title} subtitle={wp.business.sub} />
            <BulletList items={wp.business.items} />
          </section>

          {/* 12. Technology Vision */}
          <section id="wp-technology" className="bg-[#111] rounded-2xl p-7 sm:p-9 border border-[#1f1f1f]">
            <SectionHeading kicker={wp.technology.kicker} title={wp.technology.title} subtitle={wp.technology.sub} />
            <BulletList items={wp.technology.items} />
          </section>

          {/* 13. Mission */}
          <section id="wp-mission">
            <div className="bg-gradient-to-br from-primary/8 to-[#0d0d0d] border border-primary/20 rounded-2xl p-8 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
                <Target className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{wp.mission.kicker}</p>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-5">{wp.mission.title}</h2>
              <p className="text-[#bbb] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto italic">
                "{wp.mission.body}"
              </p>
            </div>
          </section>

          {/* 14. CTA */}
          <section id="wp-cta" className="bg-[#111] rounded-2xl p-8 sm:p-10 border border-[#1f1f1f] text-center">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{wp.cta.kicker}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">{wp.cta.title}</h2>
            <p className="text-[#888] text-sm mb-8 max-w-xl mx-auto">{wp.cta.sub}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to={partygoerTo}>
                <Button className="bg-primary hover:bg-primary/90 text-white h-11 px-6 rounded-xl font-bold text-sm">
                  {wp.cta.pilot} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              {organizerTo ? (
                <Link to={organizerTo}>
                  <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a] h-11 px-6 rounded-xl font-semibold text-sm">
                    {wp.cta.organizer}
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="border-[#333] text-white h-11 px-6 rounded-xl font-semibold text-sm" disabled>
                  {wp.cta.organizer}
                </Button>
              )}
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a] h-11 px-6 rounded-xl font-semibold text-sm" onClick={() => window.location.href = "/#contact"}>
                {wp.cta.dj}
              </Button>
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a] h-11 px-6 rounded-xl font-semibold text-sm" onClick={() => window.location.href = "/#contact"}>
                {wp.cta.brand}
              </Button>
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a] h-11 px-6 rounded-xl font-semibold text-sm" onClick={() => window.location.href = "/#contact"}>
                {wp.cta.contact}
              </Button>
            </div>
          </section>

          {/* Footer note */}
          <div className="text-center text-[#444] text-xs pb-4">
            <Link to="/" className="text-primary hover:underline text-xs inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> {wp.nav.back}
            </Link>
            <span className="mx-3">·</span>
            <Link to="/legal" className="hover:text-[#888] transition-colors">{wp.nav.legal}</Link>
          </div>

        </main>
      </div>
    </div>
  );
}