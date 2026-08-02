import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Calendar, MapPin, Music, QrCode, Sparkles, Clock,
  Ticket as TicketIcon, Users, Share2, ShoppingBag, Loader2,
  ShieldCheck, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Qr from "@/components/shared/Qr";
import EventShareButtons from "@/components/events/EventShareButtons";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";

const statusConfig = {
  active:      { label: "Válido",        color: "bg-success/15 text-success",         Icon: CheckCircle2 },
  pending:     { label: "Pagamento pendente", color: "bg-warning/15 text-warning",      Icon: Clock },
  used:        { label: "Usado",         color: "bg-secondary text-muted-foreground",  Icon: CheckCircle2 },
  transferred: { label: "Transferido",   color: "bg-primary/15 text-primary",          Icon: TicketIcon },
  expired:     { label: "Expirado",      color: "bg-destructive/15 text-destructive",  Icon: XCircle },
  refunded:    { label: "Reembolsado",   color: "bg-warning/15 text-warning",         Icon: XCircle },
};

const ticketTypeLabels = { general: "Pista", vip: "VIP", backstage: "Backstage" };

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Other"
};

export default function TicketDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [refundReq, setRefundReq] = useState(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.functions.invoke("getTicketDetails", { ticket_id: id })
      .then(res => {
        if (!active) return;
        const d = res.data || res;
        if (d.status === "success") setData(d);
        else setError(d.message || "Could not load ticket");
      })
      .catch(e => { if (active) setError(e.message || "Could not load ticket"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!id || !currentUser?.id) return;
    let active = true;
    base44.entities.RefundRequest.filter({ ticket_id: id, created_by_id: currentUser.id }, "-requested_at", 1)
      .then(res => { if (active) setRefundReq(res[0] || null); })
      .catch(() => {});
    return () => { active = false; };
  }, [id, currentUser]);

  const submitRefund = async () => {
    if (!data?.ticket) return;
    setRefundSubmitting(true);
    try {
      const req = await base44.entities.RefundRequest.create({
        ticket_id: data.ticket.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        event_id: data.ticket.event_id,
        event_title: data.ticket.event_title,
        organizer_id: data.ticket.organizer_id,
        reason: refundReason,
        status: "pendente",
        requested_at: new Date().toISOString(),
      });
      setRefundReq(req);
      setShowRefundForm(false);
      setRefundReason("");
      toast({ title: "Solicitação enviada", description: "O organizador vai responder." });
    } catch (e) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setRefundSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 space-y-4 py-8">
        <div className="h-5 w-24 shimmer rounded" />
        <div className="h-56 shimmer rounded-2xl" />
        <div className="h-8 shimmer rounded w-2/3" />
        <div className="h-40 shimmer rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-destructive" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading font-bold text-xl text-foreground mb-2">Ingresso indisponível</h1>
        <p className="text-muted-foreground text-sm mb-6">{error || "Não foi possível carregar este ingresso."}</p>
        <Link to="/wallet"><Button variant="outline">Voltar para ingressos</Button></Link>
      </div>
    );
  }

  const { ticket, event, perks } = data;
  const isUsed = ticket.checked_in || ticket.status === "used";
  const isPending = ticket.status === "pending";
  const effectiveStatus = isUsed && ticket.status === "active" ? "used" : ticket.status;
  const statusInfo = statusConfig[effectiveStatus] || statusConfig.pending;

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 space-y-5 py-8">
      <Link to="/wallet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar para ingressos
      </Link>

      {/* ── TICKET PASS ── */}
      <div className="relative bg-gradient-to-br from-secondary to-card border border-primary/25 rounded-3xl overflow-hidden shadow-glow">
        {/* Hero image */}
        <div className="relative aspect-[21/9] overflow-hidden">
          {(event?.image_url || ticket.event_image) ? (
            <img src={event?.image_url || ticket.event_image} alt={ticket.event_title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary">
              <Music className="w-16 h-16 text-primary/20" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Status + visibility badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={`text-xs border-0 ${statusInfo.color} flex items-center gap-1`}>
              <statusInfo.Icon className="w-3 h-3" strokeWidth={1.75} /> {statusInfo.label}
            </Badge>
            {event && (
              <Badge className={`text-xs border-0 ${event.visibility === "private" ? "bg-warning/15 text-warning" : "bg-black/70 text-white"}`}>
                {event.visibility === "private" ? "Privado" : "Público"}
              </Badge>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground mb-1">{ticket.event_title}</h1>
            {event?.organizer_name && <p className="text-muted-foreground text-sm">by {event.organizer_name}</p>}
            {!event && ticket.organizer_id && (
              <p className="text-muted-foreground text-sm italic">Detalhes do evento indisponíveis, mas seu ingresso está salvo.</p>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-secondary border border-border rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Data</p>
                <p className="font-medium text-foreground text-sm">{ticket.event_date ? moment(ticket.event_date).format("ddd, D MMM, YYYY") : "—"}</p>
                <p className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.75} />{ticket.event_date ? moment(ticket.event_date).format("HH:mm") : ""}{event?.end_date ? ` – ${moment(event.end_date).format("HH:mm")}` : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-secondary border border-border rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Local</p>
                <p className="font-medium text-foreground text-sm">{ticket.event_location || event?.location_name || "—"}</p>
                {event?.location_address && <p className="text-muted-foreground text-xs">{event.location_address}</p>}
              </div>
            </div>
          </div>

          {/* Ticket type + price */}
          <div className="flex items-center justify-between bg-secondary border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <TicketIcon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm text-foreground font-medium">{ticketTypeLabels[ticket.ticket_type] || "Ingresso"}</span>
              {ticket.ticket_phase && <Badge className="text-[10px] border-0 bg-primary/15 text-primary">{ticket.ticket_phase}</Badge>}
            </div>
            <span className="text-sm font-heading font-bold text-foreground">
              {ticket.price_paid === 0 ? "Cortesia / RSVP" : `R$ ${ticket.price_paid?.toFixed(2)}`}
            </span>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center bg-secondary border border-primary/20 rounded-2xl p-6">
            <p className="text-xs font-semibold text-foreground tracking-wider mb-4 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-primary" strokeWidth={1.75} /> Seu QR de entrada
            </p>
            <div className={(isUsed || isPending) ? "opacity-40" : ""}>
              <Qr value={ticket.qr_code} size={200} />
            </div>
            {isUsed ? (
              <p className="text-sm font-semibold text-muted-foreground mt-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> Check-in realizado — ingresso usado
              </p>
            ) : isPending ? (
              <p className="text-sm font-semibold text-warning mt-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4" strokeWidth={1.75} /> Aguardando confirmação do pagamento — esse QR ainda não vale entrada.
              </p>
            ) : (
              <p className="text-sm font-medium text-primary mt-4 text-center">Mostra esse QR na porta.</p>
            )}
            {ticket.qr_code && (
              <span className="text-[10px] font-mono text-muted-foreground/50 mt-2 break-all max-w-[240px]">{ticket.qr_code}</span>
            )}
          </div>

          {/* FestCoin reward */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{ticket.festcoin_earned || (event?.festcoin_reward || 0)} FTC de recompensa</p>
              <p className="text-muted-foreground text-xs">Ganha quando você aparece — cai no seu saldo.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── EVENT DETAILS ── */}
      {event && (
        <>
          {event.description && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <h3 className="font-heading font-semibold text-foreground text-base mb-2">Sobre a festa</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {(() => {
            const lineup = (event.lineup && event.lineup.length) ? event.lineup : (event.dj_lineup || []).map(name => ({ name }));
            if (!lineup.length) return null;
            return (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <h3 className="font-heading font-semibold text-foreground text-base mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" strokeWidth={1.5} /> Line-up
                </h3>
                <div className="space-y-3">
                  {lineup.map((dj, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground text-sm">{dj.name}</p>
                          {dj.set_time && <span className="text-xs text-primary flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.75} /> {dj.set_time}</span>}
                        </div>
                        {dj.bio && <p className="text-xs text-muted-foreground mt-0.5">{dj.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Available perks */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h3 className="font-heading font-semibold text-foreground text-base mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" strokeWidth={1.5} /> Bebidas &amp; Perks
            </h3>
            {perks && perks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perks.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-secondary border border-border rounded-xl p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{p.emoji || "🎟️"}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{p.name}</p>
                        {p.description && <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary flex-shrink-0 ml-2">{p.price_ftc} FTC</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Nada disponível pra esse rolê ainda. Usa seu saldo no local quando tiver.</p>
            )}
          </div>

          {/* Capacity */}
          {event.total_capacity && (
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-soft">
              <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground">{event.tickets_sold || 0} / {event.total_capacity} ingressos emitidos</p>
            </div>
          )}

          {/* Share */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h3 className="font-heading font-semibold text-foreground text-base mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" strokeWidth={1.5} /> Compartilhar evento
            </h3>
            <EventShareButtons
              eventName={event.title}
              eventUrl={`${window.location.origin}/events/${event.id}`}
              visibility={event.visibility}
              eventDate={event.date}
            />
          </div>
        </>
      )}

      {/* Refund request */}
      {ticket && ticket.status === "active" && !isUsed && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          {refundReq ? (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                refundReq.status === "aprovado" ? "bg-success/15" : refundReq.status === "recusado" ? "bg-destructive/15" : "bg-warning/15"
              }`}>
                <RefreshCw className={`w-5 h-5 ${
                  refundReq.status === "aprovado" ? "text-success" : refundReq.status === "recusado" ? "text-destructive" : "text-warning"
                }`} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-heading font-semibold text-foreground text-sm">
                  {refundReq.status === "aprovado" ? "Reembolso aprovado" : refundReq.status === "recusado" ? "Reembolso recusado" : "Solicitação enviada"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {refundReq.status === "aprovado" ? "O reembolso está sendo processado." : refundReq.status === "recusado" ? (refundReq.organizer_note || "O organizador recusou.") : "Aguardando resposta do organizador."}
                </p>
              </div>
            </div>
          ) : showRefundForm ? (
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" strokeWidth={1.75} /> Solicitar reembolso
              </h3>
              <Textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Conte por que você precisa do reembolso…"
                className="bg-secondary border-border text-foreground resize-none rounded-xl"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowRefundForm(false); setRefundReason(""); }}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl"
                  onClick={submitRefund}
                  disabled={refundSubmitting}
                >
                  {refundSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar solicitação"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-heading font-semibold text-foreground text-sm">Não vai conseguir ir?</p>
                <p className="text-muted-foreground text-xs">Solicite reembolso — o organizador aprova ou recusa.</p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setShowRefundForm(true)}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" strokeWidth={1.75} /> Solicitar reembolso
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pilot disclaimer */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
        <p>As recompensas FestChain fazem parte da experiência piloto e podem ser usadas em benefícios dos eventos quando disponíveis. Os ingressos são validados com segurança na portaria.</p>
      </div>
    </div>
  );
}