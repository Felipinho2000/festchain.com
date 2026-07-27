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
  active: "bg-success/15 text-success",
  used: "bg-secondary text-muted-foreground",
  transferred: "bg-blue-900/30 text-blue-400",
  expired: "bg-destructive/15 text-destructive",
  refunded: "bg-warning/15 text-warning",
  burned: "bg-destructive/20 text-destructive",
  listed: "bg-warning/15 text-warning"
};

const ticketStatusLabels = {
  active: "Válido",
  used: "Usado",
  transferred: "Transferido",
  expired: "Expirado",
  refunded: "Reembolsado",
  pending: "Pendente",
};

const txTypeConfig = {
  earned:         { icon: ArrowDownLeft, color: "text-success", bg: "bg-success/15", label: "Recompensa" },
  spent:          { icon: ArrowUpRight,  color: "text-destructive",  bg: "bg-destructive/10",  label: "Gasto" },
  transferred_in: { icon: ArrowDownLeft, color: "text-blue-400",   bg: "bg-blue-900/20",   label: "Recebido" },
  transferred_out:{ icon: ArrowUpRight,  color: "text-warning",    bg: "bg-warning/10",    label: "Enviado" }
};

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);
  const cachedQR = (() => {
    try { return JSON.parse(localStorage.getItem("fc_tickets") || "{}")[ticket.id]?.qr_code; } catch (_) { return null; }
  })();
  const qrCode = ticket.qr_code || cachedQR;

  return (
    <Link to={`/tickets/${ticket.id}`} className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-raised transition-all duration-200">
      <div className="flex">
        <div className="w-24 sm:w-32 flex-shrink-0 bg-secondary relative">
          {ticket.event_image ? (
            <img src={ticket.event_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full min-h-[96px] flex items-center justify-center">
              <Music className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.5} />
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
              <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{ticket.event_title}</h3>
              <Badge className={`text-[10px] px-2 py-0.5 ${ticketStatusColors[ticket.status] || ""} border-0 flex-shrink-0`}>
                {ticketStatusLabels[ticket.status] || ticket.status}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {ticket.event_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" strokeWidth={1.5} />
                  {moment(ticket.event_date).format("D MMM, YYYY · HH:mm")}
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
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">{ticket.payment_method === "test" ? "Ingresso piloto" : `R$ ${ticket.price_paid?.toFixed(2)}`}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQR(!showQR); }}
                className="text-muted-foreground text-xs font-medium hover:text-primary flex items-center gap-1 transition-colors"
              >
                <QrCode className="w-3 h-3" strokeWidth={1.5} />
                {showQR ? "Ocultar QR" : "Ver QR"}
              </button>
              <span className="text-primary text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                Abrir <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
          {showQR && (
            <div className="mt-3 pt-3 border-t border-border text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-lg"><Qr value={qrCode} size={160} /></div>
                <span className="text-[10px] font-mono text-muted-foreground break-all max-w-[200px]">{qrCode || "—"}</span>
              </div>
              <p className="text-[10px] text-primary font-medium mt-1.5">Mostre este QR na entrada</p>
              {cachedQR && <p className="text-[10px] text-success">✓ Funciona offline</p>}
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

  const validTx = transactions.filter(t => t.status === "confirmed");
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
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-1 tracking-tight">Minha Carteira</h1>
          <p className="text-muted-foreground text-sm">Seus ingressos, QR e recompensas.</p>
        </div>
        {currentUser?.role === "admin" && (
          <button onClick={() => setShowTopup(t => !t)} className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/25 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Adicionar saldo
          </button>
        )}
      </div>

      {/* Pilot disclaimer */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">Piloto privado.</span> As recompensas FestChain são créditos de fidelidade no app — usa em perks dos eventos. Não têm valor em dinheiro, não são investimento e não dá pra sacar. <Link to="/legal" className="text-primary hover:underline">Saiba mais</Link>.
      </div>

      {showTopup && (
        <PilotTopupCard onSuccess={() => {
          setShowTopup(false);
          base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser?.id }, "-created_date", 100)
            .then(setTransactions).catch(() => {});
        }} />
      )}

      {/* Balance summary card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary to-card border border-border rounded-3xl p-6 lg:p-8 shadow-card">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saldo disponível</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-heading font-bold text-5xl text-foreground tracking-tight">{balance.toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">FTC</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-4">Créditos do piloto · sem valor em dinheiro</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background/60 border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Ativos</p>
              <p className="font-heading font-bold text-xl text-foreground">{activeTickets.length}</p>
            </div>
            <div className="bg-success/10 border border-success/20 rounded-xl p-3">
              <p className="text-[10px] text-success/80 uppercase tracking-wider mb-1">Ganhos</p>
              <p className="font-heading font-bold text-xl text-success">{totalEarned.toLocaleString()}</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <p className="text-[10px] text-destructive/80 uppercase tracking-wider mb-1">Gastos</p>
              <p className="font-heading font-bold text-xl text-destructive">{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="bg-transparent p-0 gap-4 border-b border-border rounded-none h-auto">
          {[
            { value: "tickets", label: `Ingressos (${tickets.length})` },
            { value: "transactions", label: "Extrato" },
            { value: "rewards", label: "Benefícios" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-2xl h-28 shimmer" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-base mb-2">Sem ingressos ainda</h3>
              <p className="text-muted-foreground text-sm mb-1 max-w-xs mx-auto">Bate num rolê FestChain pra receber seu primeiro ingresso e ganhar recompensa automática.</p>
              <p className="text-muted-foreground/60 text-xs mb-5">Seus ingressos e recompensas aparecem aqui depois da compra.</p>
              <Link to="/events"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl">Ver eventos</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTickets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos ({activeTickets.length})</p>
                  <div className="space-y-3">{activeTickets.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
                </div>
              )}
              {pastTickets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Anteriores ({pastTickets.length})</p>
                  <div className="space-y-3">{pastTickets.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-2xl h-16 shimmer" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-base mb-2">Seu extrato aparece aqui</h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">Bate num rolê FestChain pra ganhar suas primeiras recompensas. Os créditos caem sozinhos depois da compra.</p>
              <Link to="/events"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl">Ver eventos</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const cfg = txTypeConfig[tx.type] || txTypeConfig.earned;
                const Icon = cfg.icon;
                const isPositive = ["earned", "transferred_in"].includes(tx.type);
                return (
                  <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/80 transition-colors">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{moment(tx.created_date).fromNow()}{tx.status && tx.status !== "confirmed" ? ` · ${tx.status}` : ""}</p>
                    </div>
                    <span className={`font-heading font-bold text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
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
            <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-soft">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-foreground text-2xl">{tickets.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ingressos emitidos</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-soft">
              <div className="w-10 h-10 bg-success/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowDownLeft className="w-5 h-5 text-success" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-foreground text-2xl">{totalEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recompensas recebidas</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-soft">
              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Gift className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-foreground text-2xl">{tickets.length >= 10 ? "VIP" : tickets.length >= 5 ? "Regular" : "Novo"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Seu nível</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-soft">
            <p className="text-sm font-semibold text-foreground">Seu progresso</p>
            {[
              { label: "Regular — 5 eventos", target: 5 },
              { label: "VIP — 10 eventos", target: 10 },
              { label: "Elite — 20 eventos", target: 20 },
            ].map((tier, i) => {
              const pct = Math.min(100, Math.round((tickets.length / tier.target) * 100));
              const done = tickets.length >= tier.target;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={done ? "text-success" : "text-muted-foreground"}>{tier.label}</span>
                    <span className={done ? "text-success font-bold" : "text-muted-foreground/60"}>
                      {done ? "✓ Desbloqueado" : `${tickets.length}/${tier.target}`}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${done ? "bg-success" : "bg-primary"} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
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