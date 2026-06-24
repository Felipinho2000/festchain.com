import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Zap, Ticket, QrCode, LayoutDashboard, Wallet, ShieldCheck,
  ChevronRight, Mail, MapPin, Send, Check, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const WORKS_NOW = [
  { icon: Ticket, title: "Event discovery", desc: "Create & browse published pilot events with full event detail." },
  { icon: QrCode, title: "Secure QR tickets", desc: "Tickets are issued server-side with a unique QR code — no fakes, no double scans." },
  { icon: Wallet, title: "Wallet & pilot credits", desc: "See your tickets and FestCoin pilot/test credits in one mobile wallet." },
  { icon: LayoutDashboard, title: "Organizer dashboard", desc: "Approved organizers create events, track sales, and manage inventory." },
  { icon: ShieldCheck, title: "Check-in scanner", desc: "Door staff scan guest QR once for instant, validated entry." },
];

const COMING_LATER = [
  "Real payments (Pix / card)",
  "NFT tickets on-chain",
  "Ticket resale, transfer & burn",
  "In-venue ordering & payments",
  "Social moments feed",
  "DAO / governance",
  "FestCard (physical NFC card)",
];

export default function Landing() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "hello@festchain.io",
        subject: `Pilot contact from ${form.name}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nMessage: ${form.message}`
      }).catch(() => {});
      setSent(true);
      toast({ title: "Message sent!", description: "We'll get back to you about the pilot." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-heading font-bold text-lg text-white">FestChain</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded hidden sm:inline">Pilot</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#888]">
            <a href="#now" className="hover:text-white transition-colors">What works</a>
            <a href="#later" className="hover:text-white transition-colors">Coming later</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <Link to="/legal" className="hover:text-white transition-colors">Legal &amp; Pilot</Link>
          </div>
          <Link to="/login">
            <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">Launch App</Button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Private MVP Pilot · Invite-only
          </div>
          <h1 className="font-heading font-bold text-4xl lg:text-6xl leading-[1.05] tracking-tight mb-6">
            QR tickets, check-ins &amp; <span className="text-primary">pilot loyalty credits</span> for event organizers
          </h1>
          <p className="text-[#aaa] text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            FestChain is a mobile-first private pilot platform for organizers to issue QR tickets, manage attendees, and validate check-ins. FestCoin is used today as in-app pilot loyalty / test credits — no cash value.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold text-base">Join the pilot <ChevronRight className="w-5 h-5 ml-1" /></Button>
            </Link>
            <a href="#contact">
              <Button variant="outline" className="h-12 px-6 rounded-xl font-bold text-base border-[#333] text-white hover:bg-[#1a1a1a]">Request access</Button>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[#666]">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> No public token sale</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Secure single-use QR check-in</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Mobile-first</span>
          </div>
        </div>
      </section>

      {/* WHAT WORKS NOW */}
      <section id="now" className="py-20 px-6 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">What works in the pilot</p>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">A complete ticket &amp; check-in pilot, today</h2>
            <p className="text-[#888] text-lg max-w-2xl mx-auto">The core flow is built and testable with real organizers and guests.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKS_NOW.map((f, i) => {
              const Icon = f.icon;
              return (
              <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-bold text-white text-lg mb-1.5">{f.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{f.desc}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PILOT FLOW */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">The pilot flow</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Two roles, one app</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
              <p className="text-primary font-bold text-sm uppercase tracking-wide mb-4">Guest</p>
              <ol className="space-y-2.5">
                {["Register / login", "Browse published events", "Get a ticket (issued instantly)", "See the QR in your wallet", "Earn pilot credits if enabled"].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#bbb]">
                    <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
              <p className="text-primary font-bold text-sm uppercase tracking-wide mb-4">Organizer</p>
              <ol className="space-y-2.5">
                {["Login as approved organizer", "Create & publish an event", "Open the scanner", "Select your event", "Scan guest QR — valid", "Scan again — already used"].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#bbb]">
                    <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* COMING LATER */}
      <section id="later" className="py-20 px-6 bg-[#111]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Coming later</p>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">On the roadmap — not live yet</h2>
            <p className="text-[#888] text-lg max-w-2xl mx-auto">We're intentionally keeping the pilot focused. These will come after the core is proven.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {COMING_LATER.map(c => (
              <span key={c} className="inline-flex items-center gap-2 bg-[#0d0d0d] border border-[#1f1f1f] text-[#888] text-sm px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-primary/60" /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <ShieldCheck className="w-7 h-7 text-primary mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-heading font-bold text-white text-xl mb-2">Private MVP pilot</h3>
          <p className="text-[#aaa] text-sm leading-relaxed max-w-xl mx-auto">
            FestChain is in private beta. FestCoin (FTC) is an in-app loyalty / test credit with no cash value — it is not an investment, not a security, and not guaranteed to have future value. No token sale, staking, or public crypto features are live.{" "}
            <Link to="/legal" className="text-primary hover:underline">Read the full disclaimer</Link>.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-6 bg-[#111]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Request pilot access</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Want to run a pilot event?</h2>
            <p className="text-[#888]">We're onboarding a small set of organizers for the private pilot.</p>
          </div>
          {sent ? (
            <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-emerald-400" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-white text-xl mb-2">Thanks — we'll be in touch</h3>
              <p className="text-[#888]">We'll reply to {form.email} about pilot access.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Name</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Tell us about your event</label>
                <textarea required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Event name, city, date…" />
              </div>
              <Button type="submit" disabled={sending || !form.name || !form.email} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                {sending ? "Sending…" : "Request access"} <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-sm text-[#888]">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> hello@festchain.io</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> São Paulo, Brazil</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" strokeWidth={2} /></div>
            <span className="font-heading font-bold text-white">FestChain</span>
          </div>
          <p className="text-[#555] text-sm text-center">© 2026 FestChain · Private MVP Pilot. FestCoin is an in-app test credit, not an investment.</p>
          <div className="flex items-center gap-4 text-[#555] text-sm">
            <Link to="/legal" className="hover:text-white transition-colors">Legal &amp; Pilot</Link>
            <Link to="/login" className="hover:text-white transition-colors">App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}