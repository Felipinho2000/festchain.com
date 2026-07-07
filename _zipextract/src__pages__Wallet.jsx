import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  Ticket, QrCode, Calendar, MapPin, Check, Music, ChevronRight,
  ArrowUpRight, ArrowDownLeft, Gift, Wallet as WalletIcon, Zap
} from "lucide-react";
import PilotTopupCard from "@/components/wallet/PilotTopupCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Qr from "@/components/shared/Qr";
import moment from "moment";

const ticketStatusColors = {
  active: "bg-emerald-900/40 text-emerald-400",
  used: "bg-[#222] text-[#888]",
  transferred: "bg-blue-900/30 text-blue-400",
  expired: "bg-red-900/30 text-red-400",
  refunded: "bg-orange-900/30 text-orange-400",
  burned: "bg-red-900/40 text-red-400",
  listed: "bg-amber-900/30 text-amber-400"
};

const txTypeConfig = {
  earned:         { icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-900/30", label: "Earned" },
  spent:          { icon: ArrowUpRight,  color: "text-red-400",     bg: "bg-red-900/20",    label: "Spent" },
  transferred_in: { icon: ArrowDownLeft, color: "text-blue-400",    bg: "bg-blue-900/20",   label: "Received" },
  transferred_out:{ icon: ArrowUpRight,  color: "text-orange-400",  bg: "bg-orange-900/20", label: "Sent" }
};

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);
  const cachedQR = (() => {
    try { return JSON.parse(localStorage.getItem("fc_tickets") || "{}")[ticket.id]?.qr_code; } catch (_) { return null; }
  })();
  const qrCode = ticket.qr_code || cachedQR;

  return (
    <Link to={`/tickets/${ticket.id}`} className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-[0_0_20px_-4px_rgba(255,85,0,0.2)] transition-all">
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
              <h3 className="font-heading font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">{ticket.event_title}</h3>
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
            <span className="text-xs text-[#666]">{ticket.payment_method === "test" ? "Pilot ticket" : `R$${ticket.price_paid?.toFixed(2)}`}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQR(!showQR); }}
                className="text-[#888] text-xs font-medium hover:text-primary flex items-center gap-1 transition-colors"
              >
                <QrCode className="w-3 h-3" strokeWidth={1.5} />
                {showQR ? "Hide QR" : "Show QR"}
              </button>
              <span className="text-primary text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                Open Ticket <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
          {showQR && (
            <div className="mt-3 pt-3 border-t border-[#222] text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-lg"><Qr value={qrCode} size={160} /></div>
                <span className="text-[10px] font-mono text-[#555] break-all max-w-[200px]">{qrCode || "—"}</span>
              </div>
              <p className="text-[10px] text-primary font-medium mt-1.5">Show this QR at the entrance</p>
              {cachedQR && <p className="text-[10px] text-emerald-500">✓ Works offline</p>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function WalletPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);

  const loadWallet = () => {
    if (!currentUser?.id) return;
    setLoading(true);
    Promise.all([
      base44.entities.Ticket.filter({ created_by_id: currentUser.id }, "-created_date", 50).catch(() => []),
      base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser.id }, "-created_date", 100).catch(() => [])
    ]).then(([tix, txs]) => {
      setTickets(tix);
      setTransactions(txs);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWallet();
  }, [currentUser?.id]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") loadWallet(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadWallet);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadWallet);
    };
  }, [currentUser?.id]);

  // Wallet balance counts only confirmed/valid transactions (excludes cancelled/failed).
  const validTx = transactions.filter(t => !["cancelled", "failed"].includes(t.status));
  const balance = validTx.reduce((s, t) => {
    if (["earned", "transferred_in", "pilot_topup"].includes(t.type)) return s + (t.amount || 0);
    if (["spent", "transferred_out"].includes(t.type)) return s - (t.amount || 0);
    return s;
  }, 0);
  const totalEarned = validTx.filter(t => ["earned", "transferred_in", "pilot_topup"].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalSpent  = validTx.filter(t => ["spent", "transferred_out"].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);

  const activeTickets = tickets.filter(t => t.status === "active");
  const pastTickets   = tickets.filter(t => t.status !== "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Tickets &amp; Rewards</h1>
          <p className="text-[#888] text-sm">Your tickets, QR codes &amp; FestCoin rewards.</p>
        </div>
        {currentUser?.role === "admin" && (
          <button onClick={() => setShowTopup(t => !t)} className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/25 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Add Pilot Credits
          </button>
        )}
      </div>

      {/* Pilot disclaimer */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-[#bbb]">
        <span className="text-primary font-semibold">Private pilot.</span> FestCoin is a pilot reward and utility credit used for event perks, loyalty, and future FestChain experiences. During the pilot it has no cash value, is not an investment, and cannot be sold or withdrawn. <Link to="/legal" className="text-primary hover:underline">Learn more</Link>.
      </div>

      {showTopup && (
        <PilotTopupCard onSuccess={() => {
          setShowTopup(false);
          base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser?.id }, "-created_date", 100)
            .then(setTransactions).catch(() => {});
        }} />
      )}

      {/* Balance summary card */}
      <div className="bg-gradient-to-br from-[#1f1f1f] to-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs text-[#666] uppercase tracking-wider mb-1">Pilot Credit Balance (FestCoin)</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-heading font-bold text-5xl text-white tracking-tight">{balance.toLocaleString()}</span>
            <span className="text-[#888] text-sm">FTC</span>
          </div>
          <p className="text-[10px] text-[#555] mb-4">Test credits · no cash value · not an investment</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111] border border-[#222] rounded-xl p-3">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Active Tickets</p>
              <p className="font-heading font-bold text-xl text-white">{activeTickets.length}</p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-3">
              <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider mb-1">Earned</p>
              <p className="font-heading font-bold text-xl text-emerald-400">{totalEarned.toLocaleString()}</p>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3">
              <p className="text-[10px] text-red-400/80 uppercase tracking-wider mb-1">Spent</p>
              <p className="font-heading font-bold text-xl text-red-400">{totalSpent.toLocaleString()}</p>
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
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-white text-base mb-2">No tickets yet</h3>
              <p className="text-[#666] text-sm mb-1 max-w-xs mx-auto">Attend a FestChain pilot event to get your first ticket and earn FestCoin automatically.</p>
              <p className="text-[#555] text-xs mb-5">Your tickets and loyalty credits will appear here after joining a pilot event.</p>
              <Link to="/events"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl">Browse Pilot Events</Button></Link>
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
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-white text-base mb-2">Your FestCoin will appear here</h3>
              <p className="text-[#666] text-sm mb-5 max-w-xs mx-auto">Attend a FestChain pilot event to earn your first FestCoin. Credits are issued automatically when you get a ticket.</p>
              <Link to="/events"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl">Browse Pilot Events</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const cfg = txTypeConfig[tx.type] || txTypeConfig.earned;
                const Icon = cfg.icon;
                const isPositive = ["earned", "transferred_in"].includes(tx.type);
                return (
                  <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{tx.description}</p>
                      <p className="text-xs text-[#666]">{moment(tx.created_date).fromNow()}{tx.status && tx.status !== "confirmed" ? ` · ${tx.status}` : ""}</p>
                    </div>
                    <span className={`font-heading font-bold text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? "+" : "-"}{(tx.amount || 0).toLocaleString()} FTC
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
              <p className="text-xs text-[#666] mt-0.5">Tickets issued</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="w-10 h-10 bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-white text-2xl">{totalEarned.toLocaleString()}</p>
              <p className="text-xs text-[#666] mt-0.5">Pilot credits earned (FTC)</p>
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