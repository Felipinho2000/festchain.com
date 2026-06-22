import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Zap, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, Lock, Gift, Calendar
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import moment from "moment";

const typeConfig = {
  earned: { icon: ArrowDownRight, color: "text-emerald-400", bg: "bg-emerald-900/30", label: "Earned" },
  spent: { icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-900/20", label: "Spent" },
  staked: { icon: Lock, color: "text-primary", bg: "bg-primary/20", label: "Staked" },
  unstaked: { icon: Lock, color: "text-[#888]", bg: "bg-[#222]", label: "Unstaked" },
  transferred_in: { icon: ArrowDownRight, color: "text-blue-400", bg: "bg-blue-900/20", label: "Received" },
  transferred_out: { icon: ArrowUpRight, color: "text-primary", bg: "bg-primary/15", label: "Sent" }
};

export default function FestCoin() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    base44.entities.FestCoinTransaction.filter(
      { created_by_id: currentUser?.id },
      "-created_date",
      100
    )
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const totalEarned = transactions.filter(t => t.type === "earned" || t.type === "transferred_in").reduce((s, t) => s + (t.amount || 0), 0);
  const totalSpent = transactions.filter(t => t.type === "spent" || t.type === "transferred_out").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalEarned - totalSpent;

  const maxEarned = Math.max(totalEarned, 1);
  const tierThresholds = [
    { label: "Holder Perk: Priority Access", target: 1000, color: "bg-primary" },
    { label: "Holder Perk: VIP Backstage NFT", target: 5000, color: "bg-orange-400" },
    { label: "Holder Perk: Lifetime Pass", target: 20000, color: "bg-yellow-400" },
  ];
  const nextTier = tierThresholds.find(t => balance < t.target);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">FestCoin Wallet</h1>
          <p className="text-[#888] text-sm">Your universal party currency — earn, spend, and grow.</p>
        </div>
        <a href="/buy-ftc" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
          <Zap className="w-4 h-4" /> Buy FTC
        </a>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#1f1f1f] to-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs text-[#666] mb-1 uppercase tracking-wider font-medium">Total Balance</p>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-heading font-bold text-5xl text-white tracking-tight">{balance.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-primary font-bold text-lg">
              <Zap className="w-5 h-5" strokeWidth={1.5} />
              FTC
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                <span className="text-xs text-emerald-400 font-medium">Total Earned</span>
              </div>
              <p className="font-heading font-bold text-xl text-emerald-400">{totalEarned.toLocaleString()}</p>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                <span className="text-xs text-red-400 font-medium">Total Spent</span>
              </div>
              <p className="font-heading font-bold text-xl text-red-400">{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holder tier progress bars */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-white">Holder Tier Progress</p>
        {tierThresholds.map((t, i) => {
          const pct = Math.min(100, Math.round((balance / t.target) * 100));
          const achieved = balance >= t.target;
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className={achieved ? "text-emerald-400" : "text-[#888]"}>{t.label}</span>
                <span className={achieved ? "text-emerald-400 font-bold" : "text-[#555]"}>
                  {achieved ? "✓ Unlocked" : `${balance.toLocaleString()} / ${t.target.toLocaleString()} FTC`}
                </span>
              </div>
              <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                <div className={`h-full ${achieved ? "bg-emerald-500" : t.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {nextTier && (
          <p className="text-[11px] text-[#555] pt-1">
            Hold <span className="text-primary font-bold">{(nextTier.target - balance).toLocaleString()} more FTC</span> to unlock your next perk.
          </p>
        )}
      </div>

      {/* Rewards Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-sm text-white">Purchase Rewards</p>
            <p className="text-xs text-[#666]">Earn 50+ FTC per ticket</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-sm text-white">Pay with FestCoin</p>
            <p className="text-xs text-[#666]">20% discount on tickets</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-sm text-white">Stake for VIP</p>
            <p className="text-xs text-[#666]">Unlock perks & access</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="font-heading font-semibold text-lg text-white mb-4">Transaction History</h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Zap className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[#666] text-sm">No transactions yet. Buy FTC or a ticket to get started.</p>
            <a href="/buy-ftc" className="inline-flex items-center gap-1.5 mt-4 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl">
              <Zap className="w-3.5 h-3.5" /> Buy FTC
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const config = typeConfig[tx.type] || typeConfig.earned;
              const isPositive = ["earned", "transferred_in", "unstaked"].includes(tx.type);
              return (
                <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{tx.description}</p>
                    <p className="text-xs text-[#666]">{moment(tx.created_date).fromNow()}</p>
                  </div>
                  <span className={`font-heading font-bold text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : "-"}{tx.amount?.toLocaleString()} FTC
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}