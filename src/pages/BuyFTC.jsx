import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Zap, TrendingUp, Shield, Star, ChevronRight, CreditCard, Banknote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const FTC_RATE = 0.50; // 1 FTC = R$0.50

const packages = [
  { id: "starter", label: "Starter", ftc: 500, brl: 250, bonus: 0, tag: null },
  { id: "fan", label: "Fan Pack", ftc: 1200, brl: 500, bonus: 200, tag: "Most Popular" },
  { id: "vip", label: "VIP Pack", ftc: 3000, brl: 1000, bonus: 600, tag: "Best Value" },
  { id: "whale", label: "Whale Pack", ftc: 10000, brl: 3000, bonus: 2500, tag: "🐳 Exclusive" },
];

const perks = [
  { icon: TrendingUp, title: "Investment Upside", desc: "FTC supply is capped. As FestChain grows, early holders benefit from network demand." },
  { icon: Shield, title: "Deflationary Token", desc: "20% of every ticket fee is burned, reducing supply over time and protecting your value." },
  { icon: Star, title: "Holder Perks", desc: "Hold 1,000+ FTC for priority ticket access. Hold 5,000+ for exclusive backstage NFTs." },
  { icon: Zap, title: "20% Ticket Discount", desc: "Pay with FTC on any event and save 20% vs. fiat — instant utility from day one." },
];

const sponsors = [
  { name: "Heineken", logo: "🍺", msg: "Scan your ticket at Heineken bars for a free beer" },
  { name: "Spotify", logo: "🎵", msg: "Earn 2x FTC on events featuring Spotify artists" },
];

export default function BuyFTC() {
  const [selected, setSelected] = useState("fan");
  const [customBrl, setCustomBrl] = useState("");
  const [method, setMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const pkg = packages.find(p => p.id === selected);
  const isCustom = selected === "custom";
  const customFtc = customBrl ? Math.floor(parseFloat(customBrl) / FTC_RATE) : 0;
  const totalFtc = isCustom ? customFtc : (pkg?.ftc + pkg?.bonus);
  const totalBrl = isCustom ? parseFloat(customBrl) || 0 : pkg?.brl;

  const handleBuy = async () => {
    if (!totalBrl || totalBrl < 10) {
      toast({ title: "Minimum purchase is R$10", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await base44.entities.FestCoinTransaction.create({
        type: "earned",
        amount: totalFtc,
        description: `Purchased ${totalFtc.toLocaleString()} FTC via ${method.toUpperCase()}`,
        balance_after: totalFtc,
      });
      setSuccess({ ftc: totalFtc, brl: totalBrl });
    } catch (e) {
      toast({ title: "Purchase failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-heading font-bold text-3xl text-white mb-2">FTC Purchased!</h2>
        <p className="text-[#888] mb-6">
          <span className="text-primary font-bold text-2xl">{success.ftc.toLocaleString()} FTC</span>
          {" "}has been added to your wallet.
        </p>
        <p className="text-[#555] text-sm mb-8">R${success.brl.toFixed(2)} charged via {method.toUpperCase()}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setSuccess(null)} className="bg-primary hover:bg-primary/90 text-white">
            Buy More
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/festcoin"} className="border-border text-white">
            View Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
          <Zap className="w-3.5 h-3.5" /> FestCoin Economy
        </div>
        <h1 className="font-heading font-bold text-4xl text-white mb-2">Load Your FTC Wallet</h1>
        <p className="text-[#888] text-base max-w-xl">
          FTC is a <span className="text-white font-semibold">utility token and payment rail</span> — use it to buy tickets, pay for drinks and VIP tables inside the venue, earn loyalty rewards, and skip every queue.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {["10% venue discount", "Skip bar queues", "Pre-order drinks & tables", "Earn on every event", "Stake for yield"].map(tag => (
            <span key={tag} className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Price ticker */}
      <div className="flex items-center gap-6 bg-card border border-border rounded-xl px-5 py-4">
        <div>
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Current Rate</p>
          <p className="font-heading font-bold text-2xl text-white">R$0.50 <span className="text-primary text-base">/ FTC</span></p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Market Cap</p>
          <p className="font-heading font-bold text-xl text-white">R$2.4M</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">24h Change</p>
          <p className="font-heading font-bold text-xl text-emerald-400">+8.4%</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-[#666]">
          <TrendingUp className="w-4 h-4 text-primary" />
          Powered by FestChain Protocol
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: package selection */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading font-semibold text-white text-lg">Choose a Pack</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packages.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`relative text-left rounded-xl border p-4 transition-all ${
                  selected === p.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-[#444]"
                }`}
              >
                {p.tag && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                    {p.tag}
                  </span>
                )}
                <p className="font-heading font-bold text-white text-base mb-1">{p.label}</p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-primary" strokeWidth={2} />
                  <span className="text-primary font-bold text-xl">{(p.ftc + p.bonus).toLocaleString()}</span>
                  <span className="text-[#666] text-xs">FTC</span>
                </div>
                {p.bonus > 0 && (
                  <p className="text-[10px] text-emerald-400 mb-1">Includes {p.bonus.toLocaleString()} bonus FTC</p>
                )}
                <p className="text-[#888] text-sm font-semibold">R${p.brl.toFixed(2)}</p>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              selected === "custom" ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
            onClick={() => setSelected("custom")}
          >
            <p className="font-semibold text-white text-sm mb-2">Custom Amount</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-sm">R$</span>
                <Input
                  type="number"
                  min="10"
                  placeholder="Enter amount"
                  value={customBrl}
                  onChange={e => { setCustomBrl(e.target.value); setSelected("custom"); }}
                  className="pl-9 bg-[#111] border-border text-white"
                />
              </div>
              {customBrl && (
                <div className="flex items-center gap-1 text-primary font-bold text-sm whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5" /> {customFtc.toLocaleString()} FTC
                </div>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <h2 className="font-heading font-semibold text-white text-lg mb-3">Payment Method</h2>
            <div className="flex gap-3">
              {[
                { id: "pix", icon: Banknote, label: "Pix" },
                { id: "credit_card", icon: CreditCard, label: "Card" },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    method === m.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-[#888] hover:border-[#444]"
                  }`}
                >
                  <m.icon className="w-4 h-4" strokeWidth={1.5} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: summary + perks */}
        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-heading font-semibold text-white text-sm mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">FestCoin</span>
                <span className="text-white font-medium">{(isCustom ? customFtc : pkg?.ftc)?.toLocaleString() || 0} FTC</span>
              </div>
              {!isCustom && pkg?.bonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Bonus</span>
                  <span className="text-emerald-400 font-medium">+{pkg.bonus.toLocaleString()} FTC</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-[#888] text-sm">Total FTC</span>
                <span className="text-primary font-bold">{totalFtc?.toLocaleString() || 0} FTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888] text-sm">You pay</span>
                <span className="text-white font-bold">R${(totalBrl || 0).toFixed(2)}</span>
              </div>
            </div>
            {/* Disclosure + Terms */}
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3 text-xs text-[#666] leading-relaxed">
              <p className="font-semibold text-[#888] mb-1">⚠️ Important disclosure</p>
              FestCoin (FTC) is a <strong className="text-white">utility token</strong> used to pay for tickets and venue services inside the FestChain platform. It is <strong className="text-white">not an investment</strong> and does not represent equity or guaranteed returns. Value may fluctuate.
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-orange-500 cursor-pointer flex-shrink-0" />
              <span className="text-[11px] text-[#666]">I understand FTC is a utility token, not a financial product. I accept the <span className="underline text-[#888]">Terms of Use</span>.</span>
            </label>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11"
              onClick={handleBuy}
              disabled={loading || !totalBrl || totalBrl < 10 || !termsAccepted}
            >
              {loading ? "Processing..." : `Buy ${totalFtc?.toLocaleString() || 0} FTC`}
            </Button>
            <p className="text-[10px] text-[#555] text-center mt-2">Instant credit to your wallet</p>
          </div>

          {/* Sponsor ad */}
          <div className="bg-card border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Sponsored by</p>
            <p className="text-2xl mb-1">🍺</p>
            <p className="text-white font-semibold text-sm">Heineken</p>
            <p className="text-[#666] text-xs mt-1">Buy 500+ FTC and get a free Heineken at partner festivals</p>
          </div>
        </div>
      </div>

      {/* Investment perks */}
      <div>
        <h2 className="font-heading font-bold text-xl text-white mb-4">Why Hold FestCoin?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {perks.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                <p.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-white text-sm mb-1">{p.title}</p>
              <p className="text-[#666] text-xs leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor strip */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] text-[#555] uppercase tracking-wider mb-4">Ecosystem Partners</p>
        <div className="flex flex-wrap gap-4">
          {sponsors.map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl px-4 py-3">
              <span className="text-2xl">{s.logo}</span>
              <div>
                <p className="text-white text-xs font-bold">{s.name}</p>
                <p className="text-[#555] text-[10px]">{s.msg}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 bg-[#111] border border-dashed border-[#333] rounded-xl px-4 py-3 text-[#444] cursor-pointer hover:border-primary/30 transition-colors">
            <ChevronRight className="w-4 h-4" />
            <p className="text-xs">Become a sponsor</p>
          </div>
        </div>
      </div>
    </div>
  );
}