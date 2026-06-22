import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, Zap, Ticket, Camera, Shield, ArrowRight, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";

const features = [
  {
    icon: Ticket,
    title: "NFT Tickets",
    desc: "Secure, verifiable, and transferable. No fakes, no scalping."
  },
  {
    icon: Zap,
    title: "FestCoin Rewards",
    desc: "Earn tokens with every ticket purchase. Spend at events or save for VIP."
  },
  {
    icon: Shield,
    title: "Anonymous Privacy",
    desc: "Share moments and connect with the community without revealing your identity."
  },
  {
    icon: TrendingUp,
    title: "Fair Economy",
    desc: "Lower fees than traditional platforms. More value for organizers and fans."
  }
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
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-border p-8 lg:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" strokeWidth={1.5} />
            The Future of Party Culture
          </div>
          <h1 className="font-heading font-bold text-4xl lg:text-[56px] leading-[1.1] tracking-tight text-foreground mb-4">
            From Idea to Global
            <span className="text-primary"> Party Ecosystem</span>
          </h1>
          <p className="text-warmgray text-lg leading-relaxed mb-8 max-w-lg">
            Secure NFT tickets, FestCoin rewards, and a fair digital economy — connecting festivals, organizers, DJs, and party lovers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/events">
              <Button className="bg-foreground hover:bg-foreground/90 text-white h-12 px-6 text-sm font-semibold rounded-xl">
                <Calendar className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Explore Events
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="h-12 px-6 text-sm font-semibold rounded-xl border-border">
                Organizer Dashboard
                <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="font-heading font-semibold text-2xl text-foreground mb-6">Why FestChain</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-5 hover:shadow-[0_4px_20px_-4px_rgba(45,42,38,0.08)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{f.title}</h3>
              <p className="text-warmgray text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-2xl text-foreground">Upcoming Events</h2>
          <Link to="/events" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
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
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-warmgray/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-warmgray text-sm">No events yet. Create your first event from the Dashboard.</p>
            <Link to="/dashboard">
              <Button variant="outline" className="mt-4" size="sm">Go to Dashboard</Button>
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-white border border-border rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-amber/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-3">
            Ready to Transform Your Events?
          </h2>
          <p className="text-warmgray max-w-md mx-auto mb-6">
            Join the decentralized party economy. Create events, sell NFT tickets, and build your community.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/events">
              <Button className="bg-foreground hover:bg-foreground/90 text-white h-11 px-6 rounded-xl font-semibold">
                Find Events
              </Button>
            </Link>
            <Link to="/moments">
              <Button variant="outline" className="h-11 px-6 rounded-xl font-semibold">
                See Moments
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}