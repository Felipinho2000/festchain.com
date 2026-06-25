import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Ticket, QrCode, Wallet, ShieldCheck, Sparkles, LayoutDashboard,
  Mail, MapPin, Send, Check, ChevronRight, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/shared/Logo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

const WORKS_ICONS = [Ticket, QrCode, Wallet, ShieldCheck, Sparkles];
const AUDIENCE_ICONS = { organizer: LayoutDashboard, partygoer: Sparkles };

export default function Landing() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const { toast } = useToast();
  const [menu, setMenu] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const works = t("landing.works.items");
  const coming = t("landing.coming.items");

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "hello@festchain.io",
        subject: `Beta access — ${form.name}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nMessage: ${form.message}`,
      }).catch(() => {});
      setSent(true);
      toast({ title: t("landing.contact.sentTitle"), description: t("landing.contact.sentSub") });
    } finally {
      setSending(false);
    }
  };

  const navLinks = (onClick) => (
    <>
      <a href="#what" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.whatWorks")}</a>
      <a href="#audiences" onClick={onClick} className="hover:text-white transition-colors">{t("landing.audiences.title")}</a>
      <a href="#later" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.comingLater")}</a>
      <a href="#contact" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.contact")}</a>
      <Link to="/legal" onClick={onClick} className="hover:text-white transition-colors">{t("landing.nav.legal")}</Link>
    </>
  );

  const organizerTo = authed ? "/dashboard" : "/register";
  const partygoerTo = authed ? "/events" : "/register";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex-shrink-0"><Logo size={28} /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#888]">{navLinks()}</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link to={authed ? "/" : "/login"} className="hidden sm:block">
              <Button variant="ghost" className="text-[#bbb] hover:text-white h-9 text-sm">
                {authed ? t("landing.nav.launchApp") : t("landing.cta.login")}
              </Button>
            </Link>
            <button className="md:hidden p-2 text-[#888] hover:text-white" onClick={() => setMenu(m => !m)} aria-label="Menu">
              {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="md:hidden border-t border-[#1f1f1f] px-5 py-4 flex flex-col gap-3 text-sm text-[#888]">
            {navLinks(() => setMenu(false))}
            <Link to={authed ? "/" : "/login"} onClick={() => setMenu(false)} className="text-primary font-medium">
              {authed ? t("landing.nav.launchApp") : t("landing.cta.login")}
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
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
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-5">
            <Link to={organizerTo}>
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-xl font-bold text-base w-full sm:w-auto">
                {t("landing.hero.organizer")} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to={partygoerTo}>
              <Button variant="outline" className="h-12 px-7 rounded-xl font-bold text-base border-[#333] text-white hover:bg-[#1a1a1a] w-full sm:w-auto">
                {t("landing.hero.partygoer")}
              </Button>
            </Link>
          </div>
          {!authed && (
            <p className="text-sm text-[#666] mb-8">
              {t("landing.hero.already")}{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">{t("landing.cta.login")}</Link>
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#666]">
            {t("landing.hero.pills").map((p, i) => (
              <span key={i} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> {p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS FESTCHAIN ── */}
      <section id="what" className="py-16 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.whatIs.kicker")}</p>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-4">{t("landing.whatIs.title")}</h2>
          <p className="text-[#aaa] text-sm sm:text-base leading-relaxed mb-4">{t("landing.whatIs.short")}</p>
          <p className="text-[#777] text-sm leading-relaxed">{t("landing.whatIs.long")}</p>
        </div>
      </section>

      {/* ── AUDIENCES ── */}
      <section id="audiences" className="py-16 px-5 sm:px-6 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">{t("landing.audiences.title")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(["organizer", "partygoer"]).map((key) => {
              const a = t(`landing.audiences.${key}`);
              const Icon = AUDIENCE_ICONS[key];
              const to = key === "organizer" ? organizerTo : partygoerTo;
              return (
                <div key={key} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-7 hover:border-primary/30 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-xl mb-2">{a.name}</h3>
                  <p className="text-[#888] text-sm leading-relaxed mb-5">{a.desc}</p>
                  <Link to={to} className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                    {a.cta} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT WORKS ── */}
      <section id="works" className="py-16 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.works.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">{t("landing.works.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.works.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map((f, i) => {
              const Icon = WORKS_ICONS[i] || Ticket;
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

      {/* ── COMING LATER ── */}
      <section id="later" className="py-16 px-5 sm:px-6 bg-[#111]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.coming.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">{t("landing.coming.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.coming.subtitle")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {coming.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 bg-[#0d0d0d] border border-[#1f1f1f] text-[#888] text-sm px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-primary/60" /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA DISCLAIMER ── */}
      <section className="py-12 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/25 rounded-2xl p-6 text-center">
          <ShieldCheck className="w-7 h-7 text-primary mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-heading font-bold text-white text-lg mb-2">{t("landing.disclaimer.title")}</h3>
          <p className="text-[#aaa] text-sm leading-relaxed max-w-xl mx-auto">{t("beta.disclaimer")}</p>
          <Link to="/legal" className="inline-block mt-3 text-primary text-sm hover:underline">{t("landing.disclaimer.readMore")}</Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 px-5 sm:px-6 bg-[#111]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{t("landing.contact.kicker")}</p>
            <h2 className="font-heading font-bold text-2xl text-white mb-2">{t("landing.contact.title")}</h2>
            <p className="text-[#888] text-sm">{t("landing.contact.subtitle")}</p>
          </div>
          {sent ? (
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-2xl p-8 text-center">
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

      {/* ── FOOTER ── */}
      <footer className="py-10 px-5 sm:px-6 border-t border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link to="/"><Logo size={24} /></Link>
          <p className="text-[#555] text-xs text-center max-w-md">{t("landing.footer.rights")}</p>
          <div className="flex items-center gap-4 text-[#777] text-sm">
            <Link to="/legal" className="hover:text-white transition-colors">{t("landing.footer.legal")}</Link>
            <a href="#contact" className="hover:text-white transition-colors">{t("landing.footer.contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}