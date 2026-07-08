import React from "react";
import {
  Wine, ShoppingBag, Crown, Zap, CreditCard, Clock,
  QrCode, ScanLine, BarChart3, TrendingUp, Package, Eye, Wallet,
} from "lucide-react";

const PERKS = [
  { icon: Wine, title: "Drinks", desc: "Order ahead or redeem at the bar with FestCoin. No queues, no fumbling for cash." },
  { icon: ShoppingBag, title: "Merch", desc: "Exclusive gear and drops, paid straight from your wallet." },
  { icon: Crown, title: "VIP perks", desc: "Tables, bottle service, and upgrades — booked in seconds." },
];

const MVP = [
  { icon: Package, label: "Organizer adds drinks, merch & perks" },
  { icon: Eye, label: "Guest sees items on the event page" },
  { icon: Zap, label: "Guest redeems with FestCoin at the party" },
  { icon: Wallet, label: "Wallet balance & transaction history" },
];

const LATER = [
  { icon: Clock, label: "Pre-order drinks before the party" },
  { icon: QrCode, label: "Pickup QR for drinks & merch" },
  { icon: ScanLine, label: "Separate bar / vendor validation screen" },
  { icon: BarChart3, label: "Dashboard with predicted bar revenue" },
  { icon: TrendingUp, label: "Queue-reduction analytics" },
];

export default function BeyondTheTicket() {
  return (
    <section id="beyond" className="py-16 px-5">
      <div className="max-w-5xl mx-auto">
        {/* Header + framing */}
        <div className="text-center mb-12">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Beyond the ticket</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">The party economy, in your pocket.</h2>
          <p className="text-[#aaa] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            FestChain doesn't only sell tickets — it upgrades the experience inside the venue. With the FestCoin Wallet, guests buy drinks, merch, and VIP perks before the party, cutting bar queues and skipping the annoying physical card system common in Brazil, where people pay a card fee just to consume at the event.
          </p>
        </div>

        {/* Perk cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {PERKS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-bold text-white text-base mb-1.5">{p.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Card-fee callout */}
        <div className="bg-primary/8 border border-primary/25 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mb-14">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-[#ccc] text-sm sm:text-base leading-relaxed">
            <span className="text-white font-semibold">Skip the card fee.</span> Brazilian venues often charge a fee just to load a physical card. FestCoin replaces that with a digital wallet — no fees, no lines, no lost cards.
          </p>
        </div>

        {/* Roadmap */}
        <div className="text-center mb-10">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">Roadmap</p>
          <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white">What's live now — and what's next.</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
          {/* MVP */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Live now
              </span>
              <h4 className="font-heading font-bold text-white text-lg">MVP</h4>
            </div>
            <ul className="space-y-3">
              {MVP.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                    </div>
                    <span className="text-[#bbb] text-sm leading-relaxed">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* After pilot */}
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                <Clock className="w-3 h-3" /> After pilot
              </span>
              <h4 className="font-heading font-bold text-white text-lg">Coming next</h4>
            </div>
            <ul className="space-y-3">
              {LATER.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#222] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#888]" strokeWidth={1.8} />
                    </div>
                    <span className="text-[#777] text-sm leading-relaxed">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Pitch sentence */}
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 to-[#0d0d0d] border border-primary/20 rounded-2xl p-8">
          <p className="font-heading font-bold text-white text-lg sm:text-xl leading-snug mb-2">
            Tickets bring people in; FestCoin keeps the event economy moving inside the party.
          </p>
          <p className="text-[#aaa] text-sm leading-relaxed">
            FestChain helps organizers make more money while guests spend less time in lines and avoid unnecessary card fees.
          </p>
        </div>
      </div>
    </section>
  );
}