import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Zap, Ticket, Shield, TrendingUp, Globe, Heart, ChevronRight,
  ExternalLink, Mail, MapPin, Send, Check, Lock, Users, DollarSign,
  BarChart3, Fingerprint, ArrowRight, Quote, Star, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  { before: "10–15% ticketing fees", after: "2% flat fee on FestChain", icon: DollarSign },
  { before: "Zero attendee data", after: "Full CRM + behavioral data", icon: BarChart3 },
  { before: "Rampant ticket fraud", after: "Blockchain-verified NFT tickets", icon: Shield },
  { before: "No secondary market control", after: "Organizer-set resale rules", icon: Fingerprint },
];

const KILLER_FEATURES = [
  {
    icon: "💸",
    title: "2% Flat Fee",
    subtitle: "vs. 10–15% on incumbents",
    desc: "Stop donating your revenue to middlemen. FestChain charges a flat 2% — the rest stays with you and your artists.",
    badge: "Save up to 13%"
  },
  {
    icon: "🔐",
    title: "Fraud-Proof Tickets",
    subtitle: "NFT ownership on-chain",
    desc: "Every ticket is a unique blockchain asset. Fakes are mathematically impossible. Chargebacks eliminated.",
    badge: "Zero Fraud"
  },
  {
    icon: "📊",
    title: "You Own the Data",
    subtitle: "Email, habits, genres, spend",
    desc: "Know exactly who came to your event. Build a direct channel. No more renting your audience from a platform.",
    badge: "Full CRM"
  },
  {
    icon: "🔄",
    title: "Programmable Resale",
    subtitle: "Set rules. Earn royalties.",
    desc: "Cap resale prices. Earn a % on every secondary sale. Completely eliminate scalpers if you want to.",
    badge: "Organizer Control"
  },
];

const WHY_BLOCKCHAIN = [
  { q: "Why does this need blockchain?", a: "Blockchain enables verifiable ownership, programmable resale rules, and direct digital relationships between organizers and attendees — without a middleman. No platform can revoke your tickets, own your data, or change fees mid-contract." },
  { q: "What about gas fees?", a: "FestChain runs on a Layer-2 network with sub-cent transaction costs. Attendees never think about gas. It's invisible infrastructure — like HTTPS is for the web." },
  { q: "What if the app goes down?", a: "Ticket ownership is on-chain and verifiable independently. Even in a worst case, QR codes can be validated against the public blockchain. The truth lives outside our servers." },
];

const TIERS = [
  { name: "Starter", price: "Free", fee: "2%", features: ["Up to 500 tickets/event", "Basic analytics", "FestCoin rewards", "NFT tickets"], highlight: false },
  { name: "Pro", price: "R$ 299/mo", fee: "1.5%", features: ["Unlimited tickets", "Full attendee CRM", "Secondary market controls", "Priority support", "Custom branding"], highlight: true },
  { name: "Enterprise", price: "Custom", fee: "1%", features: ["White-label platform", "Dedicated account manager", "Custom integrations", "SLA guarantee", "On-site support"], highlight: false },
];

const TESTIMONIALS = [
  { quote: "I was paying Sympla 12% per ticket. With FestChain I saved R$18,000 on one event alone.", name: "DJ Renato K", role: "Promoter, São Paulo", emoji: "🎧" },
  { quote: "For the first time I actually know who my audience is. The data alone is worth switching.", name: "Club Nova", role: "Venue, Rio de Janeiro", emoji: "🏠" },
  { quote: "My fans love the FestCoin rewards. Repeat attendance went up 34% after our first FestChain event.", name: "Ana Beats", role: "Artist & Event Organizer", emoji: "🎵" },
];

const MARKET = [
  { value: "R$ 12B", label: "Brazilian live events market" },
  { value: "480M", label: "Tickets sold annually in LATAM" },
  { value: "$70B", label: "Global live events by 2030" },
  { value: "2.4%", label: "FestChain addressable revenue at scale" },
];

const TEAM = [
  { name: "Ana Luiza", role: "CEO — 8 years in music tech", why: "Former Spotify LATAM. Watched promoters lose millions to fees.", emoji: "👩‍💻" },
  { name: "Marcos Vinicius", role: "CTO — ex-Mercado Pago", why: "Built payment infra processing R$2B/year. Now applying it to live events.", emoji: "👨‍🔧" },
  { name: "Sofia Chen", role: "Head of Partnerships", why: "Signed 40+ festivals in 6 months. Former festival director.", emoji: "👩‍🤝‍👩" },
  { name: "DJ Renato K", role: "Community Lead", why: "Playing clubs for 15 years. Lives the problem every weekend.", emoji: "🎧" },
];

const TRACTION = [
  { value: "12", label: "Pilot events completed" },
  { value: "4,800+", label: "Real tickets issued" },
  { value: "R$380K", label: "Gross ticket volume" },
  { value: "94%", label: "Organizer retention rate" },
];

const CHARITY_PROJECTS = [
  { emoji: "🌱", title: "Favela Music Schools", desc: "Music education in São Paulo communities.", raised: "R$ 24,000", goal: "R$ 50,000", pct: 48 },
  { emoji: "🎵", title: "Open Air DJ Stages", desc: "Free public stages in city parks.", raised: "R$ 61,000", goal: "R$ 100,000", pct: 61 },
  { emoji: "♻️", title: "Festival Zero Waste", desc: "100% recyclable festival operations.", raised: "R$ 18,500", goal: "R$ 40,000", pct: 46 },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Landing() {
  const { toast } = useToast();
  const [demoForm, setDemoForm] = useState({ name: "", email: "", company: "", message: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [demoSent, setDemoSent] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-heading font-bold text-lg text-white">FestChain</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#888]">
            <a href="#problem" className="hover:text-white transition-colors">Problem</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#traction" className="hover:text-white transition-colors">Traction</a>
            <a href="#charity" className="hover:text-white transition-colors">Charity</a>
            <a href="#whitepaper" className="hover:text-white transition-colors">Whitepaper</a>
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

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            12 pilot events · 4,800+ tickets issued · R$380K in volume
          </div>
          <h1 className="font-heading font-bold text-5xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
            Ticket infrastructure<br />for <span className="text-primary">modern organizers</span>
          </h1>
          {/* ONE-SENTENCE VALUE PROP */}
          <p className="text-[#aaa] text-xl leading-relaxed mb-4 max-w-2xl mx-auto">
            FestChain helps event organizers <span className="text-white font-semibold">reduce ticketing costs</span>, <span className="text-white font-semibold">own their customer data</span>, and <span className="text-white font-semibold">eliminate ticket fraud</span> — using blockchain as invisible infrastructure.
          </p>
          <p className="text-[#666] text-sm mb-10">For festival promoters, club owners, and independent DJs. No blockchain knowledge required.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold text-base">
                Start Free — No Credit Card <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" className="h-12 px-8 rounded-xl font-bold text-base border-[#333] text-white hover:bg-[#1a1a1a]">
                See a Demo
              </Button>
            </a>
          </div>
          <p className="text-[#555] text-xs mt-5">2% flat fee · Cancel any time · Setup in under 10 minutes</p>
        </div>
      </section>

      {/* ── PROBLEM (BEFORE/AFTER) ── */}
      <section id="problem" className="py-20 px-6 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">The Problem</p>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">
              The incumbents charge too much<br />and give too little
            </h2>
            <p className="text-[#888] text-lg max-w-xl mx-auto">
              Platforms like Sympla and Eventbrite charge 10–15% per ticket, keep the attendee data, and leave organizers with zero secondary market control.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5">
                <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <X className="w-3 h-3" /> Before
                </p>
                <p className="text-[#666] text-sm mb-4 line-through">{p.before}</p>
                <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> FestChain
                </p>
                <p className="text-white text-sm font-medium">{p.after}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KILLER FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Why FestChain</p>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-3">Four reasons organizers switch — and never go back</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {KILLER_FEATURES.map((f, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-7 hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{f.badge}</span>
                </div>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-heading font-bold text-white text-xl mb-1">{f.title}</h3>
                <p className="text-primary text-sm font-medium mb-3">{f.subtitle}</p>
                <p className="text-[#666] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRACTION ── */}
      <section id="traction" className="py-20 px-6 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Traction</p>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">Real events. Real tickets. Real revenue.</h2>
            <p className="text-[#888]">Not just a demo. Organizers have already trusted FestChain with their events.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {TRACTION.map((t, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 text-center">
                <p className="font-heading font-bold text-3xl text-white mb-1">{t.value}</p>
                <p className="text-[#666] text-sm">{t.label}</p>
              </div>
            ))}
          </div>
          {/* Testimonials */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
                <Quote className="w-6 h-6 text-primary/40 mb-3" strokeWidth={1.5} />
                <p className="text-[#ccc] text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{t.emoji}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-[#666] text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONBOARDING STEPS ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Onboarding</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Sell your first ticket in under 10 minutes</h2>
            <p className="text-[#888]">No blockchain knowledge required. No engineers. No contracts to sign.</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            {[
              { step: "1", title: "Create an account", desc: "Sign up with email. No credit card required.", time: "1 min" },
              { step: "2", title: "Create your event", desc: "Add name, date, venue, lineup, and ticket price.", time: "5 min" },
              { step: "3", title: "Share your link", desc: "Drop it anywhere — your fans start buying instantly.", time: "1 min" },
              { step: "4", title: "Get paid", desc: "Revenue settles to your account. No 30-day holds.", time: "Instant" },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 relative">
                <div className="w-8 h-8 bg-primary/20 border border-primary/40 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-sm">{s.step}</span>
                </div>
                <h3 className="font-heading font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-[#666] text-sm mb-3">{s.desc}</p>
                <span className="text-primary text-xs font-bold">{s.time}</span>
                {i < 3 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#333] z-10" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKET SIZE ── */}
      <section className="py-20 px-6 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Market Opportunity</p>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">
              Starting in electronic music.<br />Expanding to all live events.
            </h2>
            <p className="text-[#888] text-lg max-w-2xl mx-auto">
              Electronic music is just the entry point. The same infrastructure works for sports, theater, comedy, and every live event category.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {MARKET.map((m, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 text-center">
                <p className="font-heading font-bold text-2xl text-white mb-1">{m.value}</p>
                <p className="text-[#666] text-sm">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#0d0d0d] border border-primary/20 rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="font-heading font-bold text-white text-xl mb-2">Unfair Advantage</h3>
              <p className="text-[#888] leading-relaxed">
                Incumbents cannot launch FestCoin. They cannot offer staking yield. They cannot give organizers on-chain data ownership without rebuilding from scratch. <span className="text-white font-semibold">We built native to blockchain; they'd have to bolt it on.</span>
              </p>
            </div>
            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
              {["Lower fees", "Data ownership", "FestCoin economy", "Resale royalties"].map(adv => (
                <div key={adv} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-white text-xs font-medium">{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Pricing</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Simple, transparent pricing</h2>
            <p className="text-[#888]">No hidden fees. No surprise deductions. Cancel any time.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {TIERS.map((tier, i) => (
              <div key={i} className={`rounded-2xl border p-7 flex flex-col relative ${tier.highlight ? "bg-primary/10 border-primary/40" : "bg-[#111] border-[#1f1f1f]"}`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</span>
                  </div>
                )}
                <p className="font-heading font-semibold text-[#888] text-sm mb-2">{tier.name}</p>
                <p className="font-heading font-bold text-3xl text-white mb-1">{tier.price}</p>
                <p className="text-primary text-sm font-bold mb-5">+ {tier.fee} per ticket</p>
                <div className="space-y-2.5 flex-1">
                  {tier.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 bg-emerald-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={3} />
                      </div>
                      <span className="text-[#ccc] text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#demo" className={`mt-6 flex items-center justify-center h-11 rounded-xl font-bold text-sm transition-colors ${tier.highlight ? "bg-primary hover:bg-primary/90 text-white" : "bg-[#1a1a1a] border border-[#333] text-white hover:bg-[#222]"}`}>
                  {tier.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </a>
              </div>
            ))}
          </div>
          {/* Unit economics note */}
          <div className="mt-8 bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
            <p className="text-[#888] text-sm text-center">
              <span className="text-white font-semibold">Unit economics:</span> At R$100 avg ticket price, Pro plan earns FestChain R$1.50/ticket. A 1,000-person event = R$1,500 revenue. A 500-event platform = R$750K/event-month at scale. <span className="text-primary font-semibold">Gross margin: ~82%.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY BLOCKCHAIN FAQ ── */}
      <section className="py-20 px-6 bg-[#111]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Technology</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Why blockchain? We'll give you the real answer.</h2>
          </div>
          <div className="space-y-3">
            {WHY_BLOCKCHAIN.map((item, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-white">{item.q}</span>
                  <ChevronRight className={`w-5 h-5 text-[#888] flex-shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[#888] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHARITY PROTOCOL ── */}
      <section id="charity" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-rose-900/30 border border-rose-800/40 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Heart className="w-3 h-3" /> Charity Protocol
              </div>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white mb-4">Giving back to the culture</h2>
              <p className="text-[#888] text-lg leading-relaxed mb-6">
                3% of every FestChain transaction is automatically routed to our Charity Protocol — supporting music education, community stages, and sustainable festival initiatives.
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
              {CHARITY_PROJECTS.map((proj, i) => (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
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

      {/* ── WHITEPAPER ── */}
      <section id="whitepaper" className="py-20 px-6 bg-[#111]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-primary/20 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
            <div className="relative flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                  📄 Whitepaper v2.1
                </div>
                <h2 className="font-heading font-bold text-3xl text-white mb-3">The FestChain Technical Whitepaper</h2>
                <p className="text-[#888] leading-relaxed mb-6">
                  Token economics, NFT ticket architecture, staking protocol, governance model, charity fund mechanics, and our full roadmap to global scale.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Token Economics", "NFT Architecture", "Staking Protocol", "Governance", "Roadmap"].map(tag => (
                    <span key={tag} className="bg-[#1f1f1f] border border-[#2a2a2a] text-[#888] text-xs px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  <ExternalLink className="w-4 h-4" /> Download Whitepaper
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

      {/* ── TEAM ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">The Team</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Why us. Why now. Why this.</h2>
            <p className="text-[#888] max-w-xl mx-auto">We're not outsiders looking at the music industry. We live in it. We've felt the pain firsthand.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((m, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-primary/20 transition-all">
                <div className="text-4xl mb-3">{m.emoji}</div>
                <p className="font-heading font-bold text-white mb-0.5">{m.name}</p>
                <p className="text-primary text-xs font-semibold mb-3">{m.role}</p>
                <p className="text-[#666] text-xs leading-relaxed">{m.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO REQUEST ── */}
      <section id="demo" className="py-20 px-6 bg-[#111]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Request a Demo</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">See FestChain in action</h2>
            <p className="text-[#888]">We'll walk you through the full platform and answer every hard question.</p>
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
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Festival / Company Name</label>
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
              <Button type="submit" disabled={submitting || !demoForm.name || !demoForm.email}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                {submitting ? "Sending..." : "Request Demo"} <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl text-white mb-3">Get in Touch</h2>
            <p className="text-[#888]">Partnerships, press, investor inquiries — we read everything.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              {[
                { icon: Mail, title: "Email", lines: ["hello@festchain.io", "investors@festchain.io"] },
                { icon: MapPin, title: "HQ", lines: ["Av. Paulista, 1000", "São Paulo, SP — Brazil"] },
                { icon: Globe, title: "Social", lines: ["Twitter · Instagram · Discord · Telegram"] },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-0.5">{c.title}</p>
                    {c.lines.map((l, j) => <p key={j} className="text-[#888] text-sm">{l}</p>)}
                  </div>
                </div>
              ))}
            </div>
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
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Email</label>
                  <input required type="email" value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">Message</label>
                  <textarea required value={contactForm.message} onChange={e => setContactForm(p => ({...p, message: e.target.value}))} rows={4}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us what's on your mind..." />
                </div>
                <Button type="submit" disabled={contactSubmitting}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                  {contactSubmitting ? "Sending..." : "Send Message"} <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6 border-t border-[#1f1f1f] bg-[#0d0d0d]">
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