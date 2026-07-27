import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Calendar, MapPin, Users, Music, ArrowLeft, Ticket, ShoppingBag, Share2, Sparkles, Clock, Instagram, Lock, Zap } from "lucide-react";
import EventShareButtons from "@/components/events/EventShareButtons";
import EventMenuPanel from "@/components/events/EventMenuPanel";
import CheckoutDialog from "@/components/events/CheckoutDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Other"
};

function safeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Allow only http/https; prepend https:// for schemeless URLs (e.g. "instagram.com/foo")
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
    } catch (_) {}
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null; // other schemes (javascript:, data:, etc.)
  return `https://${trimmed}`;
}

function getActivePhase(event) {
  if (!event.ticket_phases || !event.ticket_phases.length) return null;
  const now = new Date();
  return event.ticket_phases.find(p => {
    if (!p.active) return false;
    const start = p.sales_start ? new Date(p.sales_start) : null;
    const end = p.sales_end ? new Date(p.sales_end) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  }) || null;
}

export default function EventDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setLoading(true);
    setEvent(null);
    setNotFound(false);
    setDeniedMessage(null);
    base44.functions.invoke("getEventDetails", { event_id: id })
      .then(res => {
        const data = res.data || res;
        if (data.status === "success" && data.event) {
          setEvent(data.event);
        } else if (data.status === "denied") {
          setDeniedMessage(data.message || "This is a private event. You need an invitation or a valid ticket to view the details.");
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser.id })
      .then(txs => {
        const valid = txs.filter(t => t.status === "confirmed");
        const bal = valid.reduce((s, t) => {
          if (["earned", "transferred_in", "pilot_topup"].includes(t.type)) return s + (t.amount || 0);
          if (["spent", "transferred_out"].includes(t.type)) return s - (t.amount || 0);
          return s;
        }, 0);
        setUserBalance(bal);
      }).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      toast({ title: "Payment cancelled", description: "Your ticket was not purchased." });
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-secondary rounded-2xl animate-pulse" />
        <div className="h-8 bg-secondary rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-secondary rounded w-1/2 animate-pulse" />
      </div>
    );
  }

  if (deniedMessage) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading font-bold text-2xl text-white mb-2">Private Event</h1>
        <p className="text-warmgray text-sm mb-6">{deniedMessage}</p>
        <Link to="/events"><Button variant="outline">Back to Events</Button></Link>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="text-center py-20">
        <p className="text-warmgray mb-4">Event not found.</p>
        <Link to="/events"><Button variant="outline">Back to Events</Button></Link>
      </div>
    );
  }

  const spotsLeft = event.total_capacity - (event.tickets_sold || 0);
  const hasPhases = event.ticket_phases && event.ticket_phases.length > 0;
  const phase = getActivePhase(event);
  const reward = phase ? (phase.festcoin_reward ?? event.festcoin_reward ?? 0) : (event.festcoin_reward || 0);
  const displayPrice = phase ? phase.price : (hasPhases ? null : (event.ticket_price || 0));
  const canBuy = spotsLeft > 0 && (!hasPhases || !!phase);
  const lineup = (event.lineup && event.lineup.length) ? event.lineup : (event.dj_lineup || []).map(n => ({ name: n }));
  const schedule = event.schedule || [];

  return (
    <div className="space-y-6">
      <Link to="/events" className="inline-flex items-center gap-2 text-warmgray hover:text-foreground text-sm transition-colors">
      <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar para Eventos
      </Link>

      {/* Hero image */}
      <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-secondary">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Music className="w-16 h-16 text-primary/20" strokeWidth={1.5} />
          </div>
        )}
        {event.status === "live" && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE NOW
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {event.genre && <Badge variant="secondary" className="text-xs">{genreLabels[event.genre]}</Badge>}
              <Badge className={`text-xs border-0 ${event.visibility === "private" ? "bg-amber-900/30 text-amber-400" : "bg-primary/10 text-primary"}`}>
                {event.visibility === "private" ? "Evento Privado" : "Evento Público"}
              </Badge>
            </div>
            <h1 className="font-heading font-extrabold text-3xl lg:text-4xl text-foreground mb-2 uppercase leading-tight">{event.title}</h1>
            {event.organizer_name && <p className="text-warmgray text-sm">by {event.organizer_name}</p>}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} /></div>
              <div>
                <p className="font-medium text-foreground text-sm">{moment(event.date).format("dddd, MMMM D, YYYY")}</p>
                <p className="text-warmgray text-sm">{moment(event.date).format("h:mm A")}{event.end_date && ` – ${moment(event.end_date).format("h:mm A")}`}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} /></div>
              <div>
                <p className="font-medium text-foreground text-sm">{event.location_name}</p>
                {event.location_address && <p className="text-warmgray text-sm">{event.location_address}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-primary" strokeWidth={1.5} /></div>
              <div>
                <p className="font-medium text-foreground text-sm">{event.tickets_sold || 0} / {event.total_capacity} ingressos emitidos</p>
                <p className="text-warmgray text-sm">{spotsLeft > 0 ? `${spotsLeft} ingressos restantes` : "Esgotado"}</p>
              </div>
            </div>
            {event.ftc_enabled && (
              <div className="flex items-start gap-3 border-t border-border pt-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t("festcoin.acceptsFtc")}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-warmgray">1 FTC = {event.currency_code || "BRL"} {event.ftc_conversion_rate || 1}</span>
                    {event.ftc_discount_percent > 0 && <span className="text-xs text-primary">{t("festcoin.ftcDiscount")}: {event.ftc_discount_percent}%</span>}
                    {event.ftc_cashback_enabled && event.ftc_cashback_percent > 0 && <span className="text-xs text-emerald-400">{t("festcoin.cashbackAvailable")}: {event.ftc_cashback_percent}%</span>}
                  </div>
                  <Link to="/festcoin" className="text-xs text-primary hover:underline mt-1 inline-block">Add FTC credits →</Link>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-2">Sobre</h3>
              <p className="text-warmgray text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Schedule timeline */}
          {schedule.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" strokeWidth={1.5} /> Programação</h3>
              <div className="space-y-3">
                {schedule.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="text-xs font-mono text-primary w-16 flex-shrink-0 pt-0.5">{s.time}</div>
                    <div className="border-l border-border pl-3 flex-1">
                      <p className="text-sm text-white font-medium">{s.title}</p>
                      {s.description && <p className="text-xs text-[#888] mt-0.5">{s.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lineup */}
          {lineup.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-primary" strokeWidth={1.5} /> Line-up</h3>
              <div className="space-y-3">
                {lineup.map((dj, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Music className="w-4 h-4 text-primary" strokeWidth={1.5} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white text-sm">{dj.name}</p>
                        {dj.set_time && <span className="text-xs text-primary flex items-center gap-1"><Clock className="w-3 h-3" /> {dj.set_time}</span>}
                      </div>
                      {dj.bio && <p className="text-xs text-[#888] mt-0.5">{dj.bio}</p>}
                      {(() => {
                        const safe = safeUrl(dj.social_link);
                        if (!safe) return null;
                        const label = safe.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
                        return (
                          <a href={safe} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                            <Instagram className="w-3 h-3" /> {label}
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Menu (FestCoin redemptions) */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <h3 className="font-heading font-semibold text-foreground">Drinks &amp; Perks</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">FTC</span>
              </div>
              <button onClick={() => setShowMenu(m => !m)} className="text-xs text-primary hover:underline">{showMenu ? "Ocultar" : "Ver"}</button>
            </div>
            {showMenu ? (
              <EventMenuPanel eventId={id} userBalance={userBalance} onRedeemed={(newBal) => setUserBalance(newBal)} />
            ) : (
              <p className="text-xs text-[#666]">Use seu saldo para resgatar bebidas, produtos e benefícios VIP neste evento.</p>
            )}
          </div>
        </div>

        {/* Purchase Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-8 space-y-5">
            <div>
              <p className="text-xs text-warmgray mb-1">{phase ? `${phase.name}` : "Ingresso piloto"}</p>
              {displayPrice !== null ? (
                <p className="font-heading font-bold text-3xl text-foreground">R$ {displayPrice.toFixed(2)}</p>
              ) : (
                <p className="font-heading font-bold text-2xl text-warmgray">Em breve</p>
              )}
              <p className="text-xs text-warmgray mt-1">Ingresso QR seguro · pague com Pix ou cartão.</p>
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg mt-3">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2} /> +{reward} FTC reward when you attend
              </div>
              {spotsLeft > 0 && spotsLeft <= Math.ceil(event.total_capacity * 0.2) && (
                <div className="inline-flex items-center gap-1.5 bg-red-500/15 text-red-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg mt-2">
                  🔥 Últimos {spotsLeft} ingressos!
                </div>
              )}
              {hasPhases && (
                <p className="text-[10px] text-[#666] mt-2">O preço reflete a fase atual e muda automaticamente conforme os lotes abrem e esgotam.</p>
              )}
            </div>

            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl" onClick={() => setBuyOpen(true)} disabled={!canBuy}>
              <Ticket className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {spotsLeft <= 0 ? "Esgotado" : (hasPhases && !phase) ? "Ingressos em breve" : "Comprar ingresso"}
            </Button>
            <p className="text-[10px] text-[#666] text-center leading-relaxed">As recompensas FestChain fazem parte da experiência piloto e podem ser usadas em perks dos eventos.</p>
            <Link to="/legal" className="block text-center text-[10px] text-primary hover:underline">Termos do piloto</Link>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-primary" /> Compartilhar</p>
              <EventShareButtons eventName={event.title} eventUrl={`${window.location.origin}/events/${event.id}`} visibility={event.visibility} eventDate={event.date} />
            </div>
          </div>
        </div>
      </div>

      <CheckoutDialog event={event} phase={phase} displayPrice={displayPrice} open={buyOpen} onOpenChange={setBuyOpen} />
    </div>
  );
}