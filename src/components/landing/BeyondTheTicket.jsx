import React from "react";
import { Check, ArrowRight, ClipboardList, Wine, QrCode } from "lucide-react";

const CHECKLIST = [
  "Shorter bar lines, faster service",
  "No card fee",
  "One wallet for tickets, drinks, merch, and perks",
];

const STEPS = [
  { icon: ClipboardList, title: "Organizer lists the menu", desc: "Drinks, merch, and VIP perks added to the event in seconds." },
  { icon: Wine, title: "Guest browses & redeems", desc: "Pay straight from the FestCoin Wallet — no cash, no cards." },
  { icon: QrCode, title: "Instant redemption code", desc: "Show the code at the bar and collect. Done." },
];

export default function BeyondTheTicket() {
  return (
    <section id="beyond" className="py-16 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Copy + checklist + CTA */}
          <div>
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Beyond the ticket</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4 leading-tight">
              We don't just sell tickets. We upgrade the night inside the venue.
            </h2>
            <p className="text-[#aaa] text-sm sm:text-base leading-relaxed mb-6">
              With the FestCoin Wallet, guests load up before the party and pay for drinks, merch, and VIP perks straight from their phone — no bar queues, and no physical top-up cards charging a fee just to let you spend your own money.
            </p>
            <ul className="space-y-2.5 mb-7">
              {CHECKLIST.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[#ddd] text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a href="#contact" className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors">
              Bring FestCoin to your event <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* 3-step visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 hover:border-primary/30 transition-all relative">
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-sm mb-1">{step.title}</h3>
                  <p className="text-[#888] text-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}