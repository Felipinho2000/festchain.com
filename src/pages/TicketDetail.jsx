import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Calendar, MapPin, Music, QrCode, Sparkles, Clock,
  Ticket as TicketIcon, Users, Share2, ShoppingBag, Loader2,
  ShieldCheck, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Qr from "@/components/shared/Qr";
import EventShareButtons from "@/components/events/EventShareButtons";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const statusConfig = {
  active:     { label: "Valid",       color: "bg-emerald-900/40 text-emerald-400", Icon: CheckCircle2 },
  used:       { label: "Used",        color: "bg-[#222] text-[#888]",              Icon: CheckCircle2 },
  transferred:{ label: "Transferred", color: "bg-blue-900/30 text-blue-400",        Icon: TicketIcon },
  expired:    { label: "Expired",     color: "bg-red-900/30 text-red-400",          Icon: XCircle },
  refunded:   { label: "Refunded",    color: "bg-orange-900/30 text-orange-400",    Icon: XCircle },
};

const ticketTypeLabels = { general: "General Admission", vip: "VIP", backstage: "Backstage" };

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-5 w-24 bg-secondary rounded animate-pulse" />
        <div className="h-56 bg-secondary rounded-2xl animate-pulse" />
        <div className="h-8 bg-secondary rounded w-2/3 animate-pulse" />
        <div className="h-40 bg-secondary rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-7 h-7 text-red-400" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading font-bold text-xl text-white mb-2">Ticket unavailable</h1>
        <p className="text-[#888] text-sm mb-6">{error || "We couldn't load this ticket."}</p>
        <Link to="/wallet"><Button variant="outline">Back to Tickets</Button></Link>
      </div>
    );
  }

  const { ticket, event, perks } = data;
  const sc = statusConfig[ticket.status] || statusConfig.active;
  const isUsed = ticket.checked_in || ticket.status === "used";
  const effectiveStatus = isUsed && ticket.status === "active" ? "used" : ticket.status;
  const statusInfo = statusConfig[effectiveStatus] || statusConfig.active;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/wallet" className="inline-flex items-center gap-2 text-[#888] hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to Tickets
      </Link>

      {/* ── TICKET PASS ── */}
      <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-primary/25 rounded-3xl overflow-hidden shadow-[0_0_40px_-8px_rgba(255,85,0,0.25)]">
        {/* Hero image */}
        <div className="relative aspect-[21/9] overflow-hidden">
          {(event?.image_url || ticket.event_image) ? (
            <img src={event?.image_url || ticket.event_image} alt={ticket.event_title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-[#1a1a1a]">
              <Music className="w-16 h-16 text-primary/20" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

          {/* Status + visibility badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={`text-xs border-0 ${statusInfo.color} flex items-center gap-1`}>
              <statusInfo.Icon className="w-3 h-3" /> {statusInfo.label}
            </Badge>
            {event && (
              <Badge className={`text-xs border-0 ${event.visibility === "private" ? "bg-amber-900/80 text-amber-300" : "bg-black/70 text-white"}`}>
                {event.visibility === "private" ? "Private" : "Public"}
              </Badge>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <h1 className="font-heading font-bold text-2xl text-white mb-1">{ticket.event_title}</h1>
            {event?.organizer_name && <p className="text-[#888] text-sm">by {event.organizer_name}</p>}
            {!event && ticket.organizer_id && (
              <p className="text-[#888] text-sm italic">Event details unavailable, but your ticket is still saved.</p>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-[#666] mb-0.5">Date</p>
                <p className="font-medium text-white text-sm">{ticket.event_date ? moment(ticket.event_date).format("ddd, MMM D, YYYY") : "—"}</p>
                <p className="text-[#888] text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{ticket.event_date ? moment(ticket.event_date).format("h:mm A") : ""}{event?.end_date ? ` – ${moment(event.end_date).format("h:mm A")}` : ""}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-[#666] mb-0.5">Location</p>
                <p className="font-medium text-white text-sm">{ticket.event_location || event?.location_name || "—"}</p>
                {event?.location_address && <p className="text-[#888] text-xs">{event.location_address}</p>}
              </div>
            </div>
          </div>

          {/* Ticket type + price */}
          <div className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
            <div className="flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm text-white font-medium">{ticketTypeLabels[ticket.ticket_type] || "Ticket"}</span>
            </div>
            <span className="text-sm font-heading font-bold text-white">
              {ticket.price_paid === 0 ? "Free / RSVP" : `R$ ${ticket.price_paid?.toFixed(2)}`}
            </span>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center bg-[#111] border border-primary/20 rounded-2xl p-6">
            <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-primary" /> Your Entry QR
            </p>
            <div className={isUsed ? "opacity-40" : ""}>
              <Qr value={ticket.qr_code} size={200} />
            </div>
            {isUsed ? (
              <p className="text-sm font-semibold text-[#888] mt-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Checked in — ticket used
              </p>
            ) : (
              <p className="text-sm font-medium text-primary mt-4 text-center">Show this QR code at the entrance.</p>
            )}
            {ticket.qr_code && (
              <span className="text-[10px] font-mono text-[#444] mt-2 break-all max-w-[240px]">{ticket.qr_code}</span>
            )}
          </div>

          {/* FestCoin reward */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{ticket.festcoin_earned || (event?.festcoin_reward || 0)} FTC reward</p>
              <p className="text-[#888] text-xs">Earned when you attend — added to your FestCoin balance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── EVENT DETAILS (works for private events via ticket ownership) ── */}
      {event && (
        <>
          {event.description && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading font-semibold text-white text-base mb-2">About this party</h3>
              <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.dj_lineup && event.dj_lineup.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" strokeWidth={1.5} /> Lineup
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.dj_lineup.map((dj, i) => (
                  <Badge key={i} variant="outline" className="text-sm py-1.5 px-3">{dj}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available perks */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" strokeWidth={1.5} /> Perks &amp; Drinks
            </h3>
            {perks && perks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perks.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded-xl p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{p.emoji || "🎟️"}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{p.name}</p>
                        {p.description && <p className="text-[10px] text-[#666] truncate">{p.description}</p>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary flex-shrink-0 ml-2">{p.price_ftc} FTC</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#666] text-xs">No perks listed for this event yet. Redeem FestCoin at the venue where available.</p>
            )}
          </div>

          {/* Capacity */}
          {event.total_capacity && (
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <Users className="w-4 h-4 text-[#666]" strokeWidth={1.5} />
              <p className="text-xs text-[#888]">{event.tickets_sold || 0} / {event.total_capacity} tickets issued</p>
            </div>
          )}

          {/* Share */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" strokeWidth={1.5} /> Share this event
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

      {/* Pilot disclaimer */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-[#bbb] flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p>FestCoin rewards are part of the pilot experience and can be used for event perks where available. Tickets are validated securely at the door.</p>
      </div>
    </div>
  );
}