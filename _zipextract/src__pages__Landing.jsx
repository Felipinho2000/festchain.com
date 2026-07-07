import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Ticket, Wallet, ShieldCheck, Sparkles, LayoutDashboard,
  Mail, MapPin, Send, Check, ChevronRight, Menu, X, ArrowRight,
  Music, Users, Building2, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/shared/Logo";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

const STEP_ICONS = [Music, Ticket, Sparkles, Wallet];

export default function Landing() {
  const { lang } = useLanguage();
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", role: "Organizer" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const findEventsTo = authed ? "/events" : "/register";
  const createEventTo = authed ? "/dashboard" : "/register";

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.entities.PilotApplication.create({
        name: form.name, email: form.email, role: form.role || "",
        message: form.message, status: "new", source: "landing_form"
      });
      base44.integrations.Core.SendEmail({
        to: "hello@festchain.app",
        subject: `Pilot application — ${form.name}${form.role ? ` (${form.role})` : ""}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nRole: ${form.role || "not specified"}\nMessage: ${form.message}`,
      }).catch(() => {});
      setSent(true);
      toast({ title: "Application sent!", description: "We'll be in touch soon." });
    } catch (err) {
      toast({ title: "Error", description: "Could not submit. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const steps = [
    { title: "Discover or create a party", desc: "Find live events near you, or launch your own in minutes." },
    { title: "Get a secure QR ticket", desc: "Reserve your spot. Each ticket has a unique QR code for entry." },
    { title: "Earn FestCoin rewards", desc: "Show up, get rewarded. FestCoin lands in your balance after check-in." },
    { title: "Redeem perks inside", desc: "Use FestCoin for drinks, VIP access, and perks at the event." },
  ];

  const NavLinks = ({ onClick }) => (
    <>
      <a href="#how" onClick={onClick} className="hover:text-white transition-colors">How it works</a>
      <a href="#audiences" onClick={onClick} className="hover:text-white transition-colors">For You</a>
      <Link to="/legal" onClick={onClick} className="hover:text-white transition-colors">Trust &amp; Safety</Link>
      <a href="#contact" onClick={onClick} className="hover:text-white transition-colors">Create Event</a>
    </>
  );

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
                  Find Events <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link to="/register" className="hidden sm:block">
                <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">
                  Join the Pilot
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
              {authed ? "Find Events" : "Join the Pilot"}
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-36 pb-20 px-5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Private Pilot · Now Onboarding
          </div>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6">
            The new way<br />to <span className="text-primary">party.</span>
          </h1>
          <p className="text-[#aaa] text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Discover events, enter with secure tickets, earn FestCoin rewards, and unlock perks inside the party.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10">
            <Link to={findEventsTo}>
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold text-base">
                <Ticket className="w-5 h-5 mr-2" strokeWidth={2} /> Find Events
              </Button>
            </Link>
            <Link to={createEventTo}>
              <Button variant="outline" className="w-full sm:w-auto h-12 px-7 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                <LayoutDashboard className="w-5 h-5 mr-2" strokeWidth={2} /> Create Event
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#666]">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Secure QR tickets</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Real rewards</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Fast check-in</span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">How it works</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">Your night, in four steps.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all relative">
                  <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-base mb-1.5">{step.title}</h3>
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
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Built for the night</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">One app. Two sides of the party.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 hover:border-primary/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-bold text-white text-2xl mb-2">For Partygoers</h3>
              <p className="text-[#888] text-sm leading-relaxed mb-6 flex-1">
                Find parties, get secure QR tickets, skip the line at the door, and earn FestCoin rewards every time you show up.
              </p>
              <Link to={findEventsTo} className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                Find Events <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 hover:border-primary/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-bold text-white text-2xl mb-2">For Organizers</h3>
              <p className="text-[#888] text-sm leading-relaxed mb-6 flex-1">
                Create your party, sell tickets, scan guests at the door, and reward your crowd with FestCoin — all from one dashboard.
              </p>
              <Link to={createEventTo} className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
                Create Event <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="py-14 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">Secure by design.</h2>
          <p className="text-[#aaa] text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-2">
            Every ticket carries a unique QR code with secure ticket validation powered by blockchain technology — so no fakes, no doubles, no hassle at the door.
          </p>
          <Link to="/legal" className="inline-block mt-3 text-primary text-sm hover:underline font-medium">
            Read our Trust &amp; Safety promise →
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-5 bg-[#111]">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 to-[#0d0d0d] border border-primary/25 p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest">
                <Star className="w-3 h-3" /> Join the Pilot
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-3">Your ticket. Your rewards. Your night.</h2>
              <p className="text-[#888] text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">
                FestChain is running a private pilot. Be among the first to party with secure tickets and real rewards.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link to={findEventsTo}>
                  <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-xl font-bold text-base">
                    Find Events <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                <a href="#contact">
                  <Button variant="outline" className="h-12 px-6 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                    I want to organize
                  </Button>
                </a>
              </div>
              {!authed && (
                <p className="text-sm text-[#666] mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Get in touch</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-2">Want to run a pilot event?</h2>
            <p className="text-[#888] text-sm">Tell us about your party. We onboard organizers for the private pilot.</p>
          </div>
          {sent ? (
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">Application sent!</h3>
              <p className="text-[#888] text-sm">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Name</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder="you@email.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">I am a…</label>
                <div className="flex flex-wrap gap-2">
                  {["Organizer", "DJ", "Brand", "Partygoer", "Investor"].map(r => (
                    <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${form.role === r ? "bg-primary/20 border-primary text-primary" : "bg-[#0d0d0d] border-[#2a2a2a] text-[#666] hover:border-primary/50 hover:text-white"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Message</label>
                <textarea required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Tell us about your event or idea..." />
              </div>
              <Button type="submit" disabled={sending || !form.name || !form.email} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                {sending ? "Sending..." : "Send Application"} <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-sm text-[#888]">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> hello@festchain.app</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> São Paulo, BR</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <LandingFAQ lang={lang} />

      {/* ── FOOTER ── */}
      <footer className="py-10 px-5 border-t border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link to="/"><Logo size={24} /></Link>
          <p className="text-[#555] text-xs text-center max-w-md">© {new Date().getFullYear()} FestChain. Secure tickets. Real rewards. Better nights.</p>
          <div className="flex items-center gap-4 text-[#777] text-sm">
            <Link to="/legal" className="hover:text-white transition-colors">Trust &amp; Safety</Link>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}