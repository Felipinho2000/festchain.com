import React from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Info, Gift, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BuyFTC() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/wallet" className="inline-flex items-center gap-2 text-warmgray hover:text-foreground text-sm">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to Wallet
      </Link>

      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" /> Pilot Credits
        </div>
        <h1 className="font-heading font-bold text-3xl text-white mb-3">FestCoin is a test credit, not a purchase</h1>
        <p className="text-[#888] leading-relaxed">
          During the private MVP pilot, FestCoin (FTC) credits are <span className="text-white font-semibold">in-app loyalty / test credits only</span>. There is no token sale and no purchase available during the pilot.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 text-sm">
        <div className="flex gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-semibold mb-0.5">No cash value</p>
            <p className="text-[#888] text-sm">FTC is not cash, not an investment, not a security, not a cryptocurrency, and is not guaranteed to have future value. It cannot be withdrawn, sold, or traded.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Gift className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-semibold mb-0.5">How you get credits</p>
            <p className="text-[#888] text-sm">Earn pilot credits as rewards when you get tickets to pilot events. Organizers / admins may also grant test credits during the pilot.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-semibold mb-0.5">Where you spend them</p>
            <p className="text-[#888] text-sm">Buying credits is disabled during the pilot. In-venue spending features are coming later.</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-[#bbb]">
        <span className="text-primary font-semibold">Private MVP pilot.</span> FestCoin is an in-app loyalty / test credit only. See the <Link to="/legal" className="text-primary hover:underline">pilot disclaimer</Link>.
      </div>

      <Link to="/events">
        <Button className="bg-primary hover:bg-primary/90 text-white">Browse pilot events</Button>
      </Link>
    </div>
  );
}