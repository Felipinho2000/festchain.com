import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Zap, Ticket, Shield, TrendingUp, Globe, Heart, ChevronRight,
  ExternalLink, Mail, MapPin, Phone, Send, Check, Music, Lock, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const features = [
  { icon: Ticket, title: "NFT Tickets", desc: "Every ticket is a unique NFT — transferable, verifiable, and impossible to forge." },
  { icon: Zap, title: "FestCoin Rewards", desc: "Earn FTC with every purchase. Spend at partner venues or stake for yield." },
  { icon: Shield, title: "Anonymous Identity", desc: "Party freely. Share moments and connect without revealing your real identity." },
  { icon: TrendingUp, title: "Staking & Yield", desc: "Lock FTC for up to 40% APY. Your tokens work while you dance." },
  { icon: Globe, title: "Global Ecosystem", desc: "One platform connecting festivals, DJs, venues, and fans worldwide." },
  { icon: Heart, title: "Charity Protocol", desc: "3% of every transaction supports community causes through our charity fund." },
];

const stats = [
  { value: "50K+", label: "Tickets Minted" },
  { value: "R$2M+", label: "Transactions" },
  { value: "120+", label: "Events" },
  { value: "8,400+", label: "Holders" },
];

const charityProjects = [
  { emoji: "🌱", title: "Favela Music Schools", desc: "Funding music education in São Paulo underserved communities.", raised: "R$ 24,000", goal: "R$ 50,000", pct: 48 },
  { emoji: "🎵", title: "Open Air DJ Stages", desc: "Building free public stages in city parks across Brazil.", raised: "R$ 61,000", goal: "R$ 100,000", pct: 61 },
  { emoji: "♻️", title: "Festival Zero Waste", desc: "Supporting festivals transitioning to 100% recyclable operations.", raised: "R$ 18,500", goal: "R$ 40,000", pct: 46 },
];

const team = [
  { name: "Ana Luiza", role: "CEO & Co-founder", emoji: "👩‍💻" },
  { name: "Marcos Vinicius", role: "CTO", emoji: "👨‍🔧" },
  { name: "Sofia Chen", role: "Head of Partnerships", emoji: "👩‍🤝‍👩" },
  { name: "DJ Renato K", role: "Community Lead", emoji: "🎧" },
];

export default function Landing() {
  const { toast } = useToast();
  const [demoForm, setDemoForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [demoSent, setDemoSent] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const handleDemo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.integrations.Core.SendEmail({
      to: "hello@festchain.io",
      subject: `Demo Request from ${demoForm.name} @ ${demoForm.company}`,
      body: `Name: ${demoForm.name}\nEmail: ${demoForm.email}\nCompany: ${demoForm.company}\nMessage: ${demoForm.message}`
    }).catch(() => {});
    setSubmitting(false);
    setDemoSent(true);
    toast({ title: "Demo request sent!", description: "Our team will reach out within 24 hours." });
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    await base44.integrations.Core.SendEmail({
      to: "hello@festchain.io",
      subject: `Contact from ${contactForm.name}`,
      body: `Name: ${contactForm.name}\nEmail: ${contactForm.email}\nMessage: ${contactForm.message}`
    }).catch(() => {});
    setContactSubmitting(false);
    setContactSent(true);
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-heading font-bold text-lg text-white">FestChain</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#888]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#charity" className="hover:text-white transition-colors">Charity</a>
            <a href="#whitepaper" className="hover:text-white transition-colors">Whitepaper</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#demo" className="text-sm text-[#888] hover:text-white transition-colors hidden sm:block">Request Demo</a>
            <Link to="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <Zap className="w-3 h-3" /> The Future of Party Culture
          </div>
          <h1 className="font-heading font-bold text-5xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
            From Ticket to<br /><span className="text-primary">Global Ecosystem</span>
          </h1>
          <p className="text-[#888] text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            NFT tickets, FestCoin rewards, and a fair digital economy — connecting festivals, DJs, and party lovers around the world.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold text-base">
                Get Started Free <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" className="h-12 px-8 rounded-xl font-bold text-base border-[#333] text-white hover:bg-[#1a1a1a]">
                Request a Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[#1f1f1f]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-heading font-bold text-3xl text-white mb-1">{s.value}</p>
              <p className="text-[#666] text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-3">Everything you need to run a party economy</h2>
            <p className="text-[#888] text-lg max-w-xl mx-auto">One platform. Multiple revenue streams. A loyal community.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity Protocol */}
      <section id="charity" className="py-20 px-6 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-rose-900/30 border border-rose-800/40 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Heart className="w-3 h-3" /> Charity Protocol
              </div>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">Giving back to the culture</h2>
              <p className="text-[#888] text-lg leading-relaxed mb-6">
                3% of every FestChain transaction is automatically routed to our Charity Protocol — a decentralized fund that supports music education, community stages, and sustainable festival initiatives.
              </p>
              <div className="space-y-3">
                {["Music education in underserved communities", "Free public concert infrastructure", "Festival environmental sustainability", "Emerging DJ grants & mentorship"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-[#ccc] text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 space-y-4 w-full">
              {charityProjects.map((proj, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl">{proj.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-heading font-semibold text-white mb-1">{proj.title}</h4>
                      <p className="text-[#666] text-sm">{proj.desc}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-[#666] mb-2">
                    <span>Raised: <span className="text-emerald-400 font-semibold">{proj.raised}</span></span>
                    <span>Goal: {proj.goal}</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${proj.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Whitepaper */}
      <section id="whitepaper" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-primary/20 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
            <div className="relative flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                  📄 Whitepaper v2.1
                </div>
                <h2 className="font-heading font-bold text-3xl text-white mb-3">The FestChain Technical Whitepaper</h2>
                <p className="text-[#888] leading-relaxed mb-6">
                  Read our full technical documentation covering the FTC token economics, NFT ticket architecture, staking protocol, governance model, and charity fund mechanics.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Token Economics", "NFT Architecture", "Staking Protocol", "Governance", "Roadmap"].map(tag => (
                    <span key={tag} className="bg-[#1f1f1f] border border-[#2a2a2a] text-[#888] text-xs px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <a
                  href="/whitepaper.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Download Whitepaper
                </a>
              </div>
              <div className="flex-shrink-0 w-32 h-40 bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl flex flex-col items-center justify-center gap-3 text-center">
                <span className="text-4xl">📄</span>
                <p className="text-white font-semibold text-sm">FestChain</p>
                <p className="text-[#666] text-xs">Whitepaper</p>
                <p className="text-[#555] text-[10px]">v2.1 · 48 pages</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request */}
      <section id="demo" className="py-20 px-6 bg-[#111]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Request a Demo</h2>
            <p className="text-[#888]">See FestChain in action. Our team will walk you through the full platform.</p>
          </div>
          {demoSent ? (
            <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-emerald-400" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-white text-xl mb-2">Demo Request Received!</h3>
              <p className="text-[#888]">We'll reach out to {demoForm.email} within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleDemo} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Full Name</label>
                  <input required value={demoForm.name} onChange={e => setDemoForm(p => ({...p, name: e.target.value}))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Work Email</label>
                  <input required type="email" value={demoForm.email} onChange={e => setDemoForm(p => ({...p, email: e.target.value}))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@company.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Company / Festival Name</label>
                <input value={demoForm.company} onChange={e => setDemoForm(p => ({...p, company: e.target.value}))}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                  placeholder="Lollapalooza Brasil, Club Nova..." />
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">What are you looking for?</label>
                <textarea value={demoForm.message} onChange={e => setDemoForm(p => ({...p, message: e.target.value}))} rows={3}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Tell us about your event or venue..." />
              </div>
              <Button type="submit" disabled={submitting || !demoForm.name || !demoForm.email} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                {submitting ? "Sending..." : "Request Demo"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl text-white mb-10">Built by people who live the culture</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((m, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 text-center hover:border-primary/20 transition-all">
                <div className="text-4xl mb-3">{m.emoji}</div>
                <p className="font-heading font-semibold text-white text-sm">{m.name}</p>
                <p className="text-[#666] text-xs mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Get in Touch</h2>
            <p className="text-[#888]">Partnership inquiries, press, or general questions — we're here.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-0.5">Email</p>
                  <p className="text-[#888] text-sm">hello@festchain.io</p>
                  <p className="text-[#888] text-sm">press@festchain.io</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-0.5">HQ</p>
                  <p className="text-[#888] text-sm">Av. Paulista, 1000</p>
                  <p className="text-[#888] text-sm">São Paulo, SP — Brazil</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-0.5">Social</p>
                  <div className="flex gap-3 mt-1">
                    {["Twitter", "Instagram", "Discord", "Telegram"].map(s => (
                      <a key={s} href="#" className="text-[#666] hover:text-white text-xs transition-colors">{s}</a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5">
                <p className="text-[#888] text-sm leading-relaxed">
                  <span className="text-white font-semibold">Partnership inquiries:</span> We're actively onboarding festivals, clubs, and DJs across Brazil and Latin America. Let's build together.
                </p>
              </div>
            </div>
            {/* Contact form */}
            {contactSent ? (
              <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-7 h-7 text-emerald-400" strokeWidth={2} />
                </div>
                <h3 className="font-heading font-bold text-white text-xl mb-2">Message Sent!</h3>
                <p className="text-[#888]">We'll reply within 1–2 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Name</label>
                  <input required value={contactForm.name} onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Email</label>
                  <input required type="email" value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Message</label>
                  <textarea required value={contactForm.message} onChange={e => setContactForm(p => ({...p, message: e.target.value}))} rows={4}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us what's on your mind..." />
                </div>
                <Button type="submit" disabled={contactSubmitting} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                  {contactSubmitting ? "Sending..." : "Send Message"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-heading font-bold text-white">FestChain</span>
          </div>
          <p className="text-[#555] text-sm text-center">© 2026 FestChain. All rights reserved. Built for the culture.</p>
          <div className="flex items-center gap-4 text-[#555] text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <Link to="/login" className="hover:text-white transition-colors">App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}