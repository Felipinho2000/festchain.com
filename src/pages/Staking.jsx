import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Unlock, TrendingUp, Zap, Calendar, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment";

const TIERS = [
  { days: 30,  apy: 8,  label: "30 Days",  badge: "Starter",   color: "border-[#333] hover:border-primary/50" },
  { days: 90,  apy: 15, label: "90 Days",  badge: "Popular",   color: "border-primary/50 bg-primary/5",  highlight: true },
  { days: 180, apy: 24, label: "180 Days", badge: "High Yield", color: "border-[#333] hover:border-primary/50" },
  { days: 365, apy: 40, label: "1 Year",   badge: "Max APY",   color: "border-amber-500/40 hover:border-amber-500/70" },
];

const AMOUNTS = [500, 1000, 5000, 10000];

export default function Staking() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(TIERS[1]);
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [staking, setStaking] = useState(false);

  const loadPositions = () => {
    base44.entities.StakePosition.filter({ created_by_id: currentUser?.id }, "-created_date", 50)
      .then(setPositions)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPositions(); }, [currentUser]);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const projectedYield = Math.round(finalAmount * (selectedTier.apy / 100) * (selectedTier.days / 365));
  const totalReturn = finalAmount + projectedYield;

  const activePositions = positions.filter(p => p.status === "active");
  const totalStaked = activePositions.reduce((s, p) => s + (p.amount || 0), 0);
  const totalProjected = activePositions.reduce((s, p) => s + (p.projected_yield || 0), 0);

  const handleStake = async () => {
    if (finalAmount < 100) {
      toast({ title: "Minimum stake is 100 FTC", variant: "destructive" });
      return;
    }
    setStaking(true);
    const startDate = new Date().toISOString();
    const endDate = moment().add(selectedTier.days, "days").toISOString();

    await base44.entities.StakePosition.create({
      amount: finalAmount,
      duration_days: selectedTier.days,
      apy: selectedTier.apy,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      projected_yield: projectedYield
    });

    await base44.entities.FestCoinTransaction.create({
      type: "staked",
      amount: finalAmount,
      description: `Staked ${finalAmount.toLocaleString()} FTC for ${selectedTier.days} days @ ${selectedTier.apy}% APY`
    });

    setStaking(false);
    setStakeOpen(false);
    setCustomAmount("");
    setAmount(1000);
    toast({ title: "FTC Staked! 🎉", description: `${finalAmount.toLocaleString()} FTC locked for ${selectedTier.days} days. Projected yield: +${projectedYield.toLocaleString()} FTC` });
    loadPositions();
  };

  const handleUnstake = async (pos) => {
    const now = new Date();
    const endDate = new Date(pos.end_date);
    const early = now < endDate;
    const earnedYield = early ? Math.round(pos.projected_yield * 0.25) : pos.projected_yield;

    await base44.entities.StakePosition.update(pos.id, { status: early ? "unstaked" : "completed", earned_yield: earnedYield });
    await base44.entities.FestCoinTransaction.create({
      type: "unstaked",
      amount: pos.amount + earnedYield,
      description: `Unstaked ${pos.amount.toLocaleString()} FTC + ${earnedYield.toLocaleString()} FTC yield${early ? " (early exit — 75% yield forfeited)" : ""}`
    });

    toast({
      title: early ? "Early unstake — partial yield" : "Stake completed!",
      description: `Received ${(pos.amount + earnedYield).toLocaleString()} FTC back${early ? " (early exit penalty applied)" : " with full yield"}`
    });
    loadPositions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">FTC Staking</h1>
          <p className="text-[#888] text-sm">Lock your FestCoin to earn yield. The longer you lock, the more you earn.</p>
        </div>
        <Button onClick={() => setStakeOpen(true)} className="bg-primary hover:bg-primary/90 text-white h-10 px-4 rounded-xl font-semibold text-sm">
          <Lock className="w-4 h-4 mr-2" /> Stake FTC
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <span className="text-[#888] text-xs uppercase tracking-wide">Total Staked</span>
          </div>
          <p className="font-heading font-bold text-2xl text-white">{totalStaked.toLocaleString()}</p>
          <p className="text-xs text-primary mt-0.5">FTC locked</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            </div>
            <span className="text-[#888] text-xs uppercase tracking-wide">Projected Yield</span>
          </div>
          <p className="font-heading font-bold text-2xl text-emerald-400">+{totalProjected.toLocaleString()}</p>
          <p className="text-xs text-[#666] mt-0.5">FTC at maturity</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <span className="text-[#888] text-xs uppercase tracking-wide">Active Positions</span>
          </div>
          <p className="font-heading font-bold text-2xl text-white">{activePositions.length}</p>
          <p className="text-xs text-[#666] mt-0.5">positions staked</p>
        </div>
      </div>

      {/* APY Tiers Info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TIERS.map(tier => (
          <div key={tier.days} className={`rounded-xl border p-4 text-center transition-all ${tier.highlight ? "bg-primary/10 border-primary/40" : "bg-card border-border"}`}>
            <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">{tier.label}</p>
            <p className={`font-heading font-bold text-2xl ${tier.highlight ? "text-primary" : "text-white"}`}>{tier.apy}%</p>
            <p className="text-[10px] text-[#666] mt-0.5">APY</p>
            {tier.highlight && <p className="text-[10px] text-primary font-semibold mt-1.5">★ Most Popular</p>}
          </div>
        ))}
      </div>

      {/* Active Positions */}
      <div>
        <h2 className="font-heading font-semibold text-white mb-4">Your Positions</h2>
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />)}</div>
        ) : activePositions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Lock className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[#666] text-sm">No active stakes. Lock FTC to start earning yield.</p>
            <Button onClick={() => setStakeOpen(true)} className="mt-4 bg-primary text-white text-sm font-bold px-4 h-9 rounded-xl">
              Stake Now
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activePositions.map(pos => {
              const now = moment();
              const end = moment(pos.end_date);
              const start = moment(pos.start_date);
              const totalDays = end.diff(start, "days");
              const elapsed = now.diff(start, "days");
              const pct = Math.min(100, Math.round((elapsed / totalDays) * 100));
              const daysLeft = Math.max(0, end.diff(now, "days"));
              const matured = now.isAfter(end);

              return (
                <div key={pos.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-4 h-4 text-primary" strokeWidth={1.5} />
                        <span className="font-heading font-bold text-white text-lg">{pos.amount.toLocaleString()} FTC</span>
                        {matured && <span className="bg-emerald-900/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">Matured</span>}
                      </div>
                      <p className="text-[#888] text-sm">{pos.duration_days}-day lock · {pos.apy}% APY</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-sm">+{pos.projected_yield?.toLocaleString()} FTC</p>
                      <p className="text-[#666] text-xs">projected yield</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[#666] mb-1.5">
                      <span>Started {moment(pos.start_date).format("MMM D")}</span>
                      <span>{matured ? "Completed" : `${daysLeft}d remaining`}</span>
                    </div>
                    <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#666]">Unlocks {moment(pos.end_date).format("MMM D, YYYY")}</span>
                    <Button
                      onClick={() => handleUnstake(pos)}
                      size="sm"
                      variant={matured ? "default" : "outline"}
                      className={matured ? "bg-emerald-600 hover:bg-emerald-500 text-white h-8 px-3 text-xs rounded-lg" : "h-8 px-3 text-xs rounded-lg border-[#333] text-[#888] hover:text-white"}
                    >
                      <Unlock className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      {matured ? "Claim Yield" : "Early Unstake"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Positions */}
      {positions.filter(p => p.status !== "active").length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-[#888] text-sm mb-3 uppercase tracking-wide">Past Positions</h2>
          <div className="space-y-2">
            {positions.filter(p => p.status !== "active").map(pos => (
              <div key={pos.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between opacity-70">
                <div>
                  <p className="text-[#888] text-sm">{pos.amount.toLocaleString()} FTC · {pos.duration_days}d · {pos.apy}% APY</p>
                  <p className="text-[#555] text-xs">{moment(pos.end_date).format("MMM D, YYYY")}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#888] text-sm font-medium">+{pos.earned_yield?.toLocaleString() || 0} FTC</p>
                  <p className="text-[10px] text-[#555] capitalize">{pos.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stake Dialog */}
      <Dialog open={stakeOpen} onOpenChange={setStakeOpen}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-white">Stake FestCoin</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Duration tiers */}
            <div>
              <p className="text-xs text-[#888] mb-2 uppercase tracking-wide">Lock Period</p>
              <div className="grid grid-cols-2 gap-2">
                {TIERS.map(tier => (
                  <button
                    key={tier.days}
                    onClick={() => setSelectedTier(tier)}
                    className={`p-3 rounded-xl border text-left transition-all ${selectedTier.days === tier.days ? "border-primary bg-primary/10" : "border-[#333] hover:border-[#444]"}`}
                  >
                    <p className="text-white text-sm font-semibold">{tier.label}</p>
                    <p className="text-primary text-xs font-bold">{tier.apy}% APY</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs text-[#888] mb-2 uppercase tracking-wide">Amount</p>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className={`py-2 rounded-lg border text-sm font-medium transition-all ${amount === a && !customAmount ? "border-primary bg-primary/10 text-primary" : "border-[#333] text-[#888] hover:border-[#444]"}`}
                  >
                    {a >= 1000 ? `${a/1000}K` : a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom amount..."
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-primary"
              />
            </div>

            {/* Projection */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">Staking</span>
                <span className="text-white font-medium">{finalAmount.toLocaleString()} FTC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">APY</span>
                <span className="text-primary font-medium">{selectedTier.apy}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">Lock period</span>
                <span className="text-white">{selectedTier.days} days</span>
              </div>
              <div className="border-t border-[#222] pt-2 flex justify-between">
                <span className="text-[#888] text-sm">Projected yield</span>
                <span className="text-emerald-400 font-bold">+{projectedYield.toLocaleString()} FTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888] text-sm">Total return</span>
                <span className="text-white font-bold">{totalReturn.toLocaleString()} FTC</span>
              </div>
            </div>

            <p className="text-[10px] text-[#555] flex gap-1.5">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              Early unstake forfeits 75% of yield. Minimum stake: 100 FTC.
            </p>

            <Button onClick={handleStake} disabled={staking || finalAmount < 100} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl">
              {staking ? "Staking..." : `Lock ${finalAmount.toLocaleString()} FTC for ${selectedTier.days} days`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}