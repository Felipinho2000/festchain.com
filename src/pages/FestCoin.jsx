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
  earned: { icon: ArrowDownRight, color: "text-emerald-600", bg: "bg-emerald-50", label: "Earned" },
  spent: { icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-50", label: "Spent" },
  staked: { icon: Lock, color: "text-primary", bg: "bg-primary/10", label: "Staked" },
  unstaked: { icon: Lock, color: "text-warmgray", bg: "bg-secondary", label: "Unstaked" },
  transferred_in: { icon: ArrowDownRight, color: "text-blue-600", bg: "bg-blue-50", label: "Received" },
  transferred_out: { icon: ArrowUpRight, color: "text-orange-500", bg: "bg-orange-50", label: "Sent" }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">FestCoin Wallet</h1>
        <p className="text-warmgray text-sm">Your universal party currency — earn, spend, and stake.</p>
      </div>

      {/* Balance Card */}
      <div className="bg-white border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber/5 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs text-warmgray mb-1 uppercase tracking-wider font-medium">Total Balance</p>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-heading font-bold text-5xl text-foreground tracking-tight">{balance.toLocaleString()}</span>
            <span className="flex items-center gap-1 text-amber font-semibold text-lg">
              <Zap className="w-5 h-5" strokeWidth={1.5} />
              FC
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
                <span className="text-xs text-emerald-700 font-medium">Total Earned</span>
              </div>
              <p className="font-heading font-bold text-xl text-emerald-700">{totalEarned.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <span className="text-xs text-red-600 font-medium">Total Spent</span>
              </div>
              <p className="font-heading font-bold text-xl text-red-600">{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-amber" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">Purchase Rewards</p>
            <p className="text-xs text-warmgray">Earn 50+ FC per ticket</p>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">Pay with FestCoin</p>
            <p className="text-xs text-warmgray">20% discount on tickets</p>
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">Stake for VIP</p>
            <p className="text-xs text-warmgray">Unlock perks & access</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="font-heading font-semibold text-lg text-foreground mb-4">Transaction History</h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white border border-border rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-12 text-center">
            <Zap className="w-10 h-10 text-warmgray/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-warmgray text-sm">No transactions yet. Buy a ticket to earn your first FestCoins.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const config = typeConfig[tx.type] || typeConfig.earned;
              const isPositive = ["earned", "transferred_in", "unstaked"].includes(tx.type);
              return (
                <div key={tx.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-warmgray">{moment(tx.created_date).fromNow()}</p>
                  </div>
                  <span className={`font-heading font-bold text-sm ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                    {isPositive ? "+" : "-"}{tx.amount?.toLocaleString()} FC
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