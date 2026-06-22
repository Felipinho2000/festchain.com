import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, Zap, Ticket, Camera, Shield, ArrowRight, TrendingUp, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";

const features = [
  { icon: Ticket, title: "NFT Tickets", desc: "Secure, verifiable, no fakes, no scalping." },
  { icon: Zap, title: "FestCoin Rewards", desc: "Earn tokens with every ticket. Spend or invest." },
  { icon: Shield, title: "Anonymous Moments", desc: "Share without revealing your identity." },
  { icon: TrendingUp, title: "FTC Investment", desc: "Deflationary token. Holder perks. Real value." }
];

const sponsors = [
  { logo: "🍺", name: "Heineken", desc: "Official Beer Partner" },
  { logo: "🎧", name: "Beats by Dre", desc: "Official Sound Partner" },
  { logo: "🎵", name: "Spotify", desc: "Music Streaming Partner" },
  { logo: "🚗", name: "Uber", desc: "Official Ride Partner" },
  { logo: "👟", name: "Nike", desc: "Culture Partner" },
  { logo: "📱", name: "Samsung", desc: "Tech Partner" },
];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Event.list("-created_date", 4)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f1f1f] to-[#111] border border-border p-8 lg:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <Zap className="w-3 h-3" />
            The Future of Party Culture
          </div>
          <h1 className="font-heading font-bold text-4xl lg:text-[56px] leading-[1.1] tracking-tight text-white mb-4">
            From Ticket to
            <span className="text-primary"> Global Ecosystem</span>
          </h1>
          <p className="text-[#888] text-lg leading-relaxed mb-8 max-w-lg">
            NFT tickets, FestCoin rewards, and a fair digital economy — connecting festivals, DJs, and party lovers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/events">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-6 text-sm font-bold rounded-xl">
                <Calendar className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Explore Events
              </Button>
            </Link>
            <Link to="/buy-ftc">
              <Button variant="outline" className="h-12 px-6 text-sm font-bold rounded-xl border-border text-white hover:bg-primary/10 hover:border-primary/40">
                <ShoppingCart className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Buy FestCoin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FTC Promo Banner */}
      <section className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-lg">FestCoin is live — R$0.50/FTC</p>
            <p className="text-[#888] text-sm">Deflationary supply · 20% ticket discount · Holder perks · +8.4% this week</p>
          </div>
        </div>
        <Link to="/buy-ftc">
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shrink-0">
            Buy FTC <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section>
        <h2 className="font-heading font-semibold text-xl text-white mb-4">Why FestChain</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                <f.icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-sm text-white mb-1">{f.title}</h3>
              <p className="text-[#666] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-xl text-white">Upcoming Events</h2>
          <Link to="/events" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="aspect-[16/10] bg-secondary animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[#666] text-sm">No events yet. Create your first event from the Dashboard.</p>
          </div>
        )}
      </section>

      {/* Sponsors strip */}
      <section>
        <p className="text-[10px] text-[#555] uppercase tracking-widest mb-4 text-center">Ecosystem Sponsors & Partners</p>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {sponsors.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/20 transition-colors cursor-pointer">
              <p className="text-2xl mb-1">{s.logo}</p>
              <p className="text-white text-xs font-semibold">{s.name}</p>
              <p className="text-[#555] text-[9px] mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card border border-border rounded-2xl p-8 lg:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="font-heading font-bold text-2xl lg:text-3xl text-white mb-3">
            Ready to Join the Party Economy?
          </h2>
          <p className="text-[#888] max-w-md mx-auto mb-6">
            Buy FestCoin, get tickets at a discount, earn rewards, and build your collection.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/buy-ftc">
              <Button className="bg-primary hover:bg-primary/90 text-white h-11 px-6 rounded-xl font-bold">
                <Zap className="w-4 h-4 mr-2" /> Buy FTC
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="h-11 px-6 rounded-xl font-semibold border-border text-white">
                Find Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}