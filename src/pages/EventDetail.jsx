import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Calendar, MapPin, Users, Music, ArrowLeft, Ticket, ShoppingBag } from "lucide-react";
import EventMenuPanel from "@/components/events/EventMenuPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Other"
};

export default function EventDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    base44.entities.Event.get(id)
      .then(setEvent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Load FTC balance for menu redemptions
  useEffect(() => {
    if (!currentUser?.id) return;
    base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser.id })
      .then(txs => {
        const valid = txs.filter(t => !["cancelled", "failed"].includes(t.status));
        const bal = valid.reduce((s, t) => {
          if (["earned", "transferred_in", "pilot_topup"].includes(t.type)) return s + (t.amount || 0);
          if (["spent", "transferred_out"].includes(t.type)) return s - (t.amount || 0);
          return s;
        }, 0);
        setUserBalance(bal);
      }).catch(() => {});
  }, [currentUser]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await base44.functions.invoke("reserveTicket", { event_id: event.id, payment_method: "test" });
      const data = res.data || res;
      if (data.status === "success") {
        try {
          const cached = JSON.parse(localStorage.getItem("fc_tickets") || "{}");
          cached[data.ticket.id] = {
            qr_code: data.ticket.qr_code,
            event_title: data.ticket.event_title,
            event_date: data.ticket.event_date,
            event_location: data.ticket.event_location
          };
          localStorage.setItem("fc_tickets", JSON.stringify(cached));
        } catch (_) {}
        // Badge awarding removed from critical path
        setBuyOpen(false);
        toast({ title: "Ticket secured!", description: `Your ticket for ${event.title} is in your wallet.` });
        setEvent(prev => ({ ...prev, tickets_sold: (prev.tickets_sold || 0) + 1 }));
      } else {
        toast({ title: "Could not issue ticket", description: data.message || "Try again", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Could not issue ticket", description: e.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-secondary rounded-2xl animate-pulse" />
        <div className="h-8 bg-secondary rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-secondary rounded w-1/2 animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-warmgray mb-4">Event not found.</p>
        <Link to="/events"><Button variant="outline">Back to Events</Button></Link>
      </div>
    );
  }

  const spotsLeft = event.total_capacity - (event.tickets_sold || 0);

  return (
    <div className="space-y-6">
      <Link to="/events" className="inline-flex items-center gap-2 text-warmgray hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Back to Events
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
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE NOW
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {event.genre && (
                <Badge variant="secondary" className="text-xs">{genreLabels[event.genre]}</Badge>
              )}
            </div>
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-2">{event.title}</h1>
            {event.organizer_name && (
              <p className="text-warmgray text-sm">by {event.organizer_name}</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{moment(event.date).format("dddd, MMMM D, YYYY")}</p>
                <p className="text-warmgray text-sm">
                  {moment(event.date).format("h:mm A")}
                  {event.end_date && ` – ${moment(event.end_date).format("h:mm A")}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{event.location_name}</p>
                {event.location_address && <p className="text-warmgray text-sm">{event.location_address}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{event.tickets_sold || 0} / {event.total_capacity} tickets issued</p>
                <p className="text-warmgray text-sm">{spotsLeft > 0 ? `${spotsLeft} spots remaining` : "Sold out"}</p>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-2">About</h3>
              <p className="text-warmgray text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.dj_lineup && event.dj_lineup.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3">Lineup</h3>
              <div className="flex flex-wrap gap-2">
                {event.dj_lineup.map((dj, i) => (
                  <Badge key={i} variant="outline" className="text-sm py-1.5 px-3">
                    <Music className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                    {dj}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pilot Event Menu */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <h3 className="font-heading font-semibold text-foreground">Event Menu · Pilot</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Pilot</span>
              </div>
              <button onClick={() => setShowMenu(m => !m)} className="text-xs text-primary hover:underline">
                {showMenu ? "Hide" : "Show"} menu
              </button>
            </div>
            {showMenu ? (
              <EventMenuPanel
                eventId={id}
                userBalance={userBalance}
                onRedeemed={(newBal) => setUserBalance(newBal)}
              />
            ) : (
              <p className="text-xs text-[#666]">Use FTC pilot credits to redeem items at this event. No real payment.</p>
            )}
          </div>
        </div>

        {/* Purchase Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-8 space-y-5">
            <div>
              <p className="text-xs text-warmgray mb-1">Ticket</p>
              <p className="font-heading font-bold text-3xl text-foreground">R$ {event.ticket_price?.toFixed(2)}</p>
              <p className="text-xs text-warmgray mt-1">Secure QR · issued instantly · check-in at the door</p>
            </div>

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              onClick={() => setBuyOpen(true)}
              disabled={spotsLeft <= 0}
            >
              <Ticket className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {spotsLeft > 0 ? "Get Ticket" : "Sold Out"}
            </Button>
            <p className="text-[10px] text-[#666] text-center">Public beta · no real payment is processed</p>
            <Link to="/legal" className="block text-center text-[10px] text-primary hover:underline">Pilot terms</Link>
          </div>
        </div>
      </div>

      {/* Confirm Ticket Dialog */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Confirm your ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-warmgray">
              <p>You'll receive a secure QR ticket in your wallet. <strong className="text-foreground">No real payment is processed during the public beta</strong> — tickets are issued for testing and check-in.</p>
            </div>
            <Button
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Issuing...
                </span>
              ) : (
                `Get Ticket · R$ ${event.ticket_price?.toFixed(2)}`
              )}
            </Button>
            <p className="text-[10px] text-[#555] text-center">By getting a ticket you accept the <Link to="/legal" className="text-primary hover:underline">pilot terms</Link>.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}