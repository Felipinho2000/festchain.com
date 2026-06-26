import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Ticket, QrCode, Wallet, ShieldCheck, Sparkles, LayoutDashboard,
  Mail, MapPin, Send, Check, ChevronRight, Menu, X, Target,
  Music, Star, Building2, Users, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/shared/Logo";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

const HOW_ICONS = [LayoutDashboard, Ticket, QrCode, Wallet];

export default function Landing() {
  const { t, lang } = useLanguage();
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const isOrganizer = currentUser?.role === "admin" || currentUser?.approved_organizer === true;
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const partygoerTo = authed ? "/events" : "/register";

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "hello@festchain.io",
        subject: `Pilot request — ${form.name}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nMessage: ${form.message}`,
      }).catch(() => {});
      setSent(true);
      toast({ title: t("landing.contact.sentTitle"), description: t("landing.contact.sentSub") });
    } finally {
      setSending(false);
    }
  };

  const NavLinks = ({ onClick }) => (
    <>
      <a href="#how" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.howItWorks")}</a>
      <a href="#audiences" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.audiences")}</a>
      <a href="#roadmap" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.roadmap")}</a>
      <a href="#contact" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.contact")}</a>
      <Link to="/legal" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.legal")}</Link>
    </>
  );

  const audiences = t("landing.audiences.cards");
  const howSteps = t("landing.how.steps");
  const trustPills = t("landing.hero.trustPills");
  const phases = t("landing.roadmap.phases");

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/"><Logo size={28} /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#888]"><NavLinks /></div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {authed ? (
              <Link to="/events">
                <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">
                  {t("landing.nav.launchApp")} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link to="/register" className="hidden sm:block">
                <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">
                  {t("landing.hero.joinPilot")}
                </Button>
              </Link>
            )}
            <button className="md:hidden p-2 text-[#888] hover:text-white" onClick={() => setMenuOpen(m => !m)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#1f1f1f] px-5 py-4 flex flex-col gap-3 text-sm text-[#888]">
            <NavLinks onClick={() => setMenuOpen(false)} />
            <Link to={authed ? "/events" : "/register"} onClick={() => setMenuOpen(false)} className="text-primary font-semibold">
              {authed ? t("landing.nav.launchApp") : t("landing.hero.joinPilot")}
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-7 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {t("landing.hero.badge")}
          </div>
          <h1 className="font-heading font-bold text-4xl lg:text-[52px] leading-[1.08] tracking-tight mb-5">
            {t("landing.hero.title")}
          </h1>
          <p className="text-[#aaa] text-base sm:text-lg leading-relaxed mb-9 max-w-2xl mx-auto">
            {t("landing.hero.sub")}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link to={authed ? "/events" : "/register"}>
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-xl font-bold text-base">
                {t("landing.hero.joinPilot")} <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <a href="#audiences">
              <Button variant="outline" className="h-12 px-5 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                {t("landing.hero.forOrganizers")}
              </Button>
            </a>
            <a href="#audiences">
              <Button variant="outline" className="h-12 px-5 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                {t("landing.hero.forDJs")}
              </Button>
            </a>
            <a href="#audiences">
              <Button variant="outline" className="h-12 px-5 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                {t("landing.hero.forBrands")}
              </Button>
            </a>
          </div>

          {!authed && (
            <p className="text-sm text-[#666] mb-8">
              {t("landing.hero.already")}{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">{t("landing.cta.login")}</Link>
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#666]">
            {trustPills.map((p, i) => (
              <span key={i} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> {p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS FESTCHAIN ── */}
      <section className="py-12 px-5 bg-[#111]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.whatIs.kicker")}</p>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-4">{t("landing.whatIs.title")}</h2>
          <p className="text-[#aaa] text-sm sm:text-base leading-relaxed mb-4">{t("landing.whatIs.short")}</p>
          <p className="text-[#777] text-sm leading-relaxed">{t("landing.whatIs.long")}</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.how.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-2">{t("landing.how.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.how.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howSteps.map((step, i) => {
              const Icon = HOW_ICONS[i] || Ticket;
              return (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-primary/30 transition-all relative">
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-sm mb-1.5">{step.title}</h3>
                  <p className="text-[#888] text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AUDIENCES ── */}
      <section id="audiences" className="py-16 px-5 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.audiences.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">{t("landing.audiences.title")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {audiences.map((card, i) => {
              const icons = [LayoutDashboard, Music, Building2, Users];
              const Icon = icons[i] || Ticket;
              const to = i === 3 ? partygoerTo : (authed && isOrganizer ? "/dashboard" : "/register");
              return (
                <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-7 hover:border-primary/30 transition-all flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-xl mb-2">{card.name}</h3>
                  <p className="text-[#888] text-sm leading-relaxed mb-5 flex-1">{card.desc}</p>
                  <Link to={i === 3 ? partygoerTo : "/register"} className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                    {card.cta} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT WORKS ── */}
      <section id="works" className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.works.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-2">{t("landing.works.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.works.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t("landing.works.items").map((f, i) => {
              const icons = [Ticket, QrCode, Wallet, ShieldCheck, Sparkles, LayoutDashboard];
              const Icon = icons[i] || Ticket;
              return (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-base mb-1.5">{f.title}</h3>
                  <p className="text-[#888] text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" className="py-16 px-5 bg-[#111]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.roadmap.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-2">{t("landing.roadmap.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.roadmap.subtitle")}</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-3 bottom-3 w-px bg-[#222]" />
            <div className="space-y-6">
              {phases.map((phase, i) => {
                const styles = {
                  live:    { dot: "bg-primary", label: "Live",    cls: "text-primary bg-primary/10 border-primary/30" },
                  next:    { dot: "bg-amber-400", label: "Next",  cls: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
                  planned: { dot: "bg-[#555]", label: "Planned",  cls: "text-[#888] bg-[#1a1a1a] border-[#333]" },
                  vision:  { dot: "bg-purple-500", label: "Vision", cls: "text-purple-400 bg-purple-900/20 border-purple-700/30" },
                };
                const s = styles[phase.status] || styles.planned;
                return (
                  <div key={i} className="relative pl-12">
                    <div className={`absolute left-[13px] top-3 w-3 h-3 rounded-full border-2 border-[#0d0d0d] ${s.dot}`} />
                    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-heading font-bold text-white text-sm">{phase.label}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-[#888] text-sm leading-relaxed">{phase.items}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section id="mission" className="py-16 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <Target className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.mission.kicker")}</p>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-4">{t("landing.mission.title")}</h2>
          <p className="text-[#aaa] text-sm sm:text-base leading-relaxed">{t("landing.mission.body")}</p>
        </div>
      </section>

      {/* ── PILOT CTA ── */}
      <section className="py-16 px-5 bg-[#111]">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-[#0d0d0d] border border-primary/25 p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest">
                <Star className="w-3 h-3" /> {t("landing.pilotCta.badge")}
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">{t("landing.pilotCta.title")}</h2>
              <p className="text-[#888] text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">{t("landing.pilotCta.sub")}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to={authed ? "/events" : "/register"}>
                  <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-xl font-bold text-base">
                    {t("landing.hero.joinPilot")} <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                <a href="#contact">
                  <Button variant="outline" className="h-12 px-5 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                    {t("landing.hero.forOrganizers")}
                  </Button>
                </a>
                <a href="#contact">
                  <Button variant="outline" className="h-12 px-5 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                    {t("landing.hero.forDJs")}
                  </Button>
                </a>
                <a href="#contact">
                  <Button variant="outline" className="h-12 px-5 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                    {t("landing.hero.forBrands")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BETA DISCLAIMER ── */}
      <section className="py-10 px-5">
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/25 rounded-2xl p-6 text-center">
          <ShieldCheck className="w-7 h-7 text-primary mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-heading font-bold text-white text-lg mb-2">{t("landing.disclaimer.title")}</h3>
          <p className="text-[#aaa] text-sm leading-relaxed max-w-xl mx-auto">{t("beta.disclaimer")}</p>
          <Link to="/legal" className="inline-block mt-3 text-primary text-sm hover:underline">{t("landing.disclaimer.readMore")}</Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 px-5 bg-[#111]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.contact.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl text-white mb-2">{t("landing.contact.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.contact.subtitle")}</p>
          </div>
          {sent ? (
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">{t("landing.contact.sentTitle")}</h3>
              <p className="text-[#888] text-sm">{t("landing.contact.sentSub")}</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{t("landing.contact.nameL")}</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder={t("landing.contact.namePh")} />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{t("landing.contact.emailL")}</label>
                  <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder={t("landing.contact.emailPh")} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{t("landing.contact.msgL")}</label>
                <textarea required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none" placeholder={t("landing.contact.msgPh")} />
              </div>
              <Button type="submit" disabled={sending || !form.name || !form.email} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                {sending ? t("landing.contact.sending") : t("landing.contact.send")} <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-sm text-[#888]">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {t("landing.contact.emailVal")}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t("landing.contact.locale")}</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <LandingFAQ lang={lang} />

      {/* ── FOUNDER ── */}
      <section className="py-12 px-5 bg-[#111]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0 text-2xl font-heading font-bold text-primary">
            FO
          </div>
          <div>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">{t("landing.founder.kicker")}</p>
            <h3 className="font-heading font-bold text-white text-lg mb-2">{t("landing.founder.name")}</h3>
            <p className="text-[#aaa] text-sm leading-relaxed mb-4">{t("landing.founder.bio")}</p>
            <a href="#contact">
              <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-5 rounded-xl font-semibold text-sm">
                {t("landing.founder.cta")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-5 border-t border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link to="/"><Logo size={24} /></Link>
          <p className="text-[#555] text-xs text-center max-w-md">{t("landing.footer.rights")}</p>
          <div className="flex items-center gap-4 text-[#777] text-sm">
            <Link to="/legal" className="hover:text-white transition-colors">{t("landing.footer.legal")}</Link>
            <a href="#contact" className="hover:text-white transition-colors">{t("landing.footer.contact")}</a>
            <Link to="/whitepaper" className="hover:text-white transition-colors">{t("landing.footer.whitepaper")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}