import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  Ticket, QrCode, Calendar, MapPin, Check, Music,
  Zap, TrendingUp, TrendingDown, Plus, Wallet,
  ArrowUpRight, ArrowDownLeft, Gift
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import moment from "moment";

const ticketStatusColors = {
  active: "bg-emerald-900/40 text-emerald-400",
  used: "bg-[#222] text-[#888]",
  transferred: "bg-blue-900/30 text-blue-400",
  expired: "bg-red-900/30 text-red-400",
  refunded: "bg-orange-900/30 text-orange-400"
};

const txTypeConfig = {
  earned:         { icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-900/30", label: "Earned" },
  spent:          { icon: ArrowUpRight,  color: "text-red-400",     bg: "bg-red-900/20",    label: "Spent" },
  transferred_in: { icon: ArrowDownLeft, color: "text-blue-400",    bg: "bg-blue-900/20",   label: "Received" },
  transferred_out:{ icon: ArrowUpRight,  color: "text-orange-400",  bg: "bg-orange-900/20", label: "Sent" },
  staked:         { icon: Zap,           color: "text-primary",     bg: "bg-primary/10",    label: "Staked" },
  unstaked:       { icon: Zap,           color: "text-primary",     bg: "bg-primary/10",    label: "Unstaked" },
};

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);
  const cachedQR = (() => {
    try { return JSON.parse(localStorage.getItem("fc_tickets") || "{}")[ticket.id]?.qr_code; } catch (_) { return null; }
  })();
  const qrCode = ticket.qr_code || cachedQR;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
      <div className="flex">
        <div className="w-24 sm:w-32 flex-shrink-0 bg-secondary relative">
          {ticket.event_image ? (
            <img src={ticket.event_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full min-h-[96px] flex items-center justify-center">
              <Music className="w-7 h-7 text-[#444]" strokeWidth={1.5} />
            </div>
          )}
          {ticket.checked_in && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <Check className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-semibold text-white text-sm line-clamp-1">{ticket.event_title}</h3>
              <Badge className={`text-[10px] px-2 py-0.5 ${ticketStatusColors[ticket.status] || ""} border-0 flex-shrink-0`}>
                {ticket.status}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 text-xs text-[#888]">
              {ticket.event_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" strokeWidth={1.5} />
                  {moment(ticket.event_date).format("MMM D, YYYY · h:mm A")}
                </span>
              )}
              {ticket.event_location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" strokeWidth={1.5} />
                  {ticket.event_location}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#222]">
            <span className="text-xs text-[#666]">R${ticket.price_paid?.toFixed(2)}</span>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
            >
              <QrCode className="w-3 h-3" strokeWidth={1.5} />
              {showQR ? "Hide QR" : "Show QR"}
            </button>
          </div>
          {showQR && (
            <div className="mt-3 pt-3 border-t border-[#222] text-center">
              <div className="inline-flex flex-col items-center gap-2 bg-white rounded-2xl p-5">
                <QrCode className="w-24 h-24 text-[#0d0d0d]" strokeWidth={0.8} />
                <span className="text-[10px] font-mono text-[#333] break-all max-w-[200px]">{qrCode || "—"}</span>
              </div>
              {cachedQR && <p className="text-[10px] text-emerald-500 mt-1.5">✓ Works offline</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Ticket.filter({ created_by_id: currentUser?.id }, "-created_date", 50).catch(() => []),
      base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser?.id }, "-created_date", 100).catch(() => [])
    ]).then(([tix, txs]) => {
      setTickets(tix);
      setTransactions(txs);
    }).finally(() => setLoading(false));
  }, [currentUser]);

  const balance = transactions.reduce((s, t) => {
    if (["earned", "transferred_in", "unstaked"].includes(t.type)) return s + (t.amount || 0);
    if (["spent", "transferred_out", "staked"].includes(t.type)) return s - (t.amount || 0);
    return s;
  }, 0);
  const balanceBRL = (balance * 0.5).toFixed(2);

  const totalEarned = transactions.filter(t => ["earned", "transferred_in"].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalSpent  = transactions.filter(t => ["spent", "transferred_out"].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);

  const activeTickets = tickets.filter(t => t.status === "active");
  const pastTickets   = tickets.filter(t => t.status !== "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Wallet</h1>
          <p className="text-[#888] text-sm">Your tickets, balance, and transaction history.</p>
        </div>
        <Link to="/buy-ftc">
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-4 h-10 rounded-xl text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Balance
          </Button>
        </Link>
      </div>

      {/* Balance summary card */}
      <div className="bg-gradient-to-br from-[#1f1f1f] to-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs text-[#666] uppercase tracking-wider mb-1">Available Balance</p>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-heading font-bold text-5xl text-white tracking-tight">R${balanceBRL}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111] border border-[#222] rounded-xl p-3">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Active Tickets</p>
              <p className="font-heading font-bold text-xl text-white">{activeTickets.length}</p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1"><TrendingUp className="w-3 h-3 text-emerald-400" /><p className="text-[10px] text-emerald-400 uppercase tracking-wider">Loaded</p></div>
              <p className="font-heading font-bold text-xl text-emerald-400">R${(totalEarned * 0.5).toFixed(0)}</p>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1"><TrendingDown className="w-3 h-3 text-red-400" /><p className="text-[10px] text-red-400 uppercase tracking-wider">Spent</p></div>
              <p className="font-heading font-bold text-xl text-red-400">R${(totalSpent * 0.5).toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="bg-transparent p-0 gap-4 border-b border-border rounded-none h-auto">
          {[
            { value: "tickets", label: `Tickets (${tickets.length})` },
            { value: "transactions", label: "Transactions" },
            { value: "rewards", label: "Rewards" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium text-[#888] data-[state=active]:text-white">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-28 animate-pulse" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Ticket className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[#666] text-sm mb-1">No tickets yet</p>
              <p className="text-[#555] text-xs mb-4">Browse events and get your first ticket.</p>
              <Link to="/events"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl">Browse Events</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTickets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Upcoming ({activeTickets.length})</p>
                  <div className="space-y-3">{activeTickets.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
                </div>
              )}
              {pastTickets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Past ({pastTickets.length})</p>
                  <div className="space-y-3">{pastTickets.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Wallet className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[#666] text-sm mb-4">No transactions yet. Add balance to get started.</p>
              <Link to="/buy-ftc"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl">Add Balance</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const cfg = txTypeConfig[tx.type] || txTypeConfig.earned;
                const isPositive = ["earned", "transferred_in", "unstaked"].includes(tx.type);
                return (
                  <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <cfg.icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{tx.description}</p>
                      <p className="text-xs text-[#666]">{moment(tx.created_date).fromNow()}</p>
                    </div>
                    <span className={`font-heading font-bold text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? "+" : "-"}R${(tx.amount * 0.5).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-white text-2xl">{tickets.length}</p>
              <p className="text-xs text-[#666] mt-0.5">Events attended</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-white text-2xl">R${(totalEarned * 0.5).toFixed(0)}</p>
              <p className="text-xs text-[#666] mt-0.5">Total rewards earned</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Gift className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-white text-2xl">{tickets.length >= 10 ? "VIP" : tickets.length >= 5 ? "Regular" : "New"}</p>
              <p className="text-xs text-[#666] mt-0.5">Member tier</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-white">Tier Progress</p>
            {[
              { label: "Regular — 5 events", target: 5 },
              { label: "VIP — 10 events", target: 10 },
              { label: "Elite — 20 events", target: 20 },
            ].map((tier, i) => {
              const pct = Math.min(100, Math.round((tickets.length / tier.target) * 100));
              const done = tickets.length >= tier.target;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={done ? "text-emerald-400" : "text-[#888]"}>{tier.label}</span>
                    <span className={done ? "text-emerald-400 font-bold" : "text-[#555]"}>
                      {done ? "✓ Unlocked" : `${tickets.length}/${tier.target}`}
                    </span>
                  </div>
                  <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                    <div className={`h-full ${done ? "bg-emerald-500" : "bg-primary"} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}