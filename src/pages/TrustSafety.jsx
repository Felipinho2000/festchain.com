import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, QrCode, Lock, Eye, Camera, Coins, Users, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";

const items = [
  {
    icon: QrCode,
    title: "Secure QR tickets",
    body: "Every ticket carries a unique QR code with secure validation powered by blockchain technology. No fakes, no duplicates, no paper to lose.",
  },
  {
    icon: ShieldCheck,
    title: "Anti-fake validation",
    body: "Each ticket can only be scanned once. Once checked in, it's marked as used — so the same code can't enter twice.",
  },
  {
    icon: Users,
    title: "Organizer-controlled events",
    body: "Organizers create and run their own events. They set capacity, ticket types, and rewards. Public events are discoverable; private events are link-only.",
  },
  {
    icon: Eye,
    title: "Public & private events",
    body: "Public events appear in discovery. Private events are hidden — only people with the direct link can find and reserve a ticket.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    body: "We only store what's needed to issue your ticket and rewards. We never sell your data. Your ticket history is visible only to you and the event organizer.",
  },
  {
    icon: Camera,
    title: "Camera for check-in",
    body: "Our scanner uses your camera only to read QR codes at the door, right in your browser. We don't store photos or record video.",
  },
  {
    icon: Coins,
    title: "What FestCoin means now",
    body: "During the pilot, FestCoin is an in-app reward credit — not a cryptocurrency, not cash, and not an investment. Earn it from tickets and spend it on perks at participating events.",
  },
];

export default function TrustSafety() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">
      <nav className="border-b border-[#1f1f1f] bg-[#0d0d0d]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/"><Logo size={26} /></Link>
          <Link to="/"><Button variant="ghost" className="text-[#888] hover:text-white text-sm">← Back to home</Button></Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading font-bold text-4xl text-white mb-3">Trust &amp; Safety</h1>
          <p className="text-[#aaa] text-base leading-relaxed max-w-xl mx-auto">
            Party hard, party safe. Here's how FestChain keeps your nights secure — from ticket to check-in.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-white text-base mb-1">{item.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-primary/5 border border-primary/25 rounded-2xl p-6 text-center">
          <p className="text-[#aaa] text-sm leading-relaxed max-w-lg mx-auto">
            FestChain is currently in a <span className="text-primary font-semibold">private pilot</span>. Features are tested with real events before public launch. Questions? Reach out anytime.
          </p>
          <Link to="/#contact" className="inline-block mt-4">
            <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a]">
              Contact us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}