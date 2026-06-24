import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Calendar, MapPin, Users, Zap, Music, ArrowLeft, Ticket,
  CreditCard, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import EventPreOrder from "@/components/events/EventPreOrder";
import moment from "moment";

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Other"
};

export default function EventDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("credit_card");
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    base44.entities.Event.get(id)
      .then(setEvent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePurchase = async () => {
    setPurchasing(true);
    const price = payMethod === "festcoin" ? (event.festcoin_price || event.ticket_price * 0.8) : event.ticket_price;
    const qrCode = `FC-${event.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const ticket = await base44.entities.Ticket.create({
      event_id: event.id,
      event_title: event.title,
      event_date: event.date,
      event_image: event.image_url,
      event_location: event.location_name,
      price_paid: price,
      payment_method: payMethod,
      qr_code: qrCode,
      festcoin_earned: event.festcoin_reward || 50
    });

    // Cache QR locally so it works offline at the door
    try {
      const cached = JSON.parse(localStorage.getItem("fc_tickets") || "{}");
      cached[ticket.id] = { qr_code: qrCode, event_title: event.title, event_date: event.date, event_location: event.location_name };
      localStorage.setItem("fc_tickets", JSON.stringify(cached));
    } catch (_) {}

    await base44.entities.Event.update(event.id, {
      tickets_sold: (event.tickets_sold || 0) + 1
    });

    await base44.entities.FestCoinTransaction.create({
      type: "earned",
      amount: event.festcoin_reward || 50,
      description: `Ticket purchase: ${event.title}`,
      event_id: event.id,
      event_title: event.title
    });

    if (payMethod === "festcoin") {
      await base44.entities.FestCoinTransaction.create({
        type: "spent",
        amount: price,
        description: `Payment for ticket: ${event.title}`,
        event_id: event.id,
        event_title: event.title
      });
    }

    // Award badges based on ticket history
    const allTickets = await base44.entities.Ticket.filter({ created_by_id: currentUser?.id });
    const existingBadges = await base44.entities.UserBadge.filter({ created_by_id: currentUser?.id });
    const badgeKeys = new Set(existingBadges.map(b => b.badge_key));
    const ticketCount = allTickets.length + 1; // +1 for the one just created

    const toAward = [];
    if (!badgeKeys.has("first_ticket")) toAward.push({ badge_key: "first_ticket", badge_name: "First Timer", badge_emoji: "🎟️", badge_description: "Bought your first ticket", event_id: event.id, event_title: event.title });
    if (ticketCount >= 5 && !badgeKeys.has("five_events")) toAward.push({ badge_key: "five_events", badge_name: "Party Starter", badge_emoji: "🔥", badge_description: "Attended 5 events", event_id: event.id, event_title: event.title });
    if (ticketCount >= 10 && !badgeKeys.has("ten_events")) toAward.push({ badge_key: "ten_events", badge_name: "Festival Veteran", badge_emoji: "💎", badge_description: "Attended 10 events", event_id: event.id, event_title: event.title });
    if (ticketCount >= 20 && !badgeKeys.has("twenty_events")) toAward.push({ badge_key: "twenty_events", badge_name: "Party Royalty", badge_emoji: "👑", badge_description: "Attended 20 events", event_id: event.id, event_title: event.title });
    if (event.genre === "techno" && !badgeKeys.has("genre_techno")) toAward.push({ badge_key: "genre_techno", badge_name: "Techno Head", badge_emoji: "🤖", badge_description: "Attended a techno event", event_id: event.id, event_title: event.title });
    if (event.genre === "house" && !badgeKeys.has("genre_house")) toAward.push({ badge_key: "genre_house", badge_name: "House Lover", badge_emoji: "🏠", badge_description: "Attended a house event", event_id: event.id, event_title: event.title });
    if (toAward.length > 0) await base44.entities.UserBadge.bulkCreate(toAward);

    setPurchasing(false);
    setBuyOpen(false);
    toast({
      title: "Ticket secured!",
      description: `Your ticket for ${event.title} is ready. QR code saved.`
    });
    setEvent(prev => ({ ...prev, tickets_sold: (prev.tickets_sold || 0) + 1 }));
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
  const festcoinPrice = event.festcoin_price || Math.round(event.ticket_price * 0.8);

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
                <p className="font-medium text-foreground text-sm">{event.tickets_sold || 0} / {event.total_capacity} tickets sold</p>
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

          {/* Pre-order Menu */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-foreground">Pre-order Menu</h3>
                <p className="text-xs text-[#666] mt-0.5">Order now, skip the bar queue. 10% off vs. cash prices.</p>
              </div>
            </div>
            <EventPreOrder eventId={event.id} eventTitle={event.title} />
          </div>
        </div>

        {/* Purchase Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-8 space-y-5">
            <div>
              <p className="text-xs text-warmgray mb-1">Ticket Price</p>
              <p className="font-heading font-bold text-3xl text-foreground">R$ {event.ticket_price?.toFixed(2)}</p>
              <p className="text-xs text-warmgray mt-1">
                or <span className="text-amber font-semibold">{festcoinPrice} FestCoin</span> (20% off)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3">
              <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-semibold text-sm text-foreground">Pay with wallet balance</p>
                <p className="text-xs text-warmgray">20% off when you use your balance</p>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              onClick={() => setBuyOpen(true)}
              disabled={spotsLeft <= 0}
            >
              <Ticket className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {spotsLeft > 0 ? "Buy Ticket" : "Sold Out"}
            </Button>
            <p className="text-xs text-warmgray text-center">Instant delivery • QR check-in</p>
          </div>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Choose Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={payMethod} onValueChange={setPayMethod} className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${payMethod === "credit_card" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="credit_card" />
                <CreditCard className="w-5 h-5 text-warmgray" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="font-medium text-sm">Credit Card</p>
                  <p className="text-xs text-warmgray">R$ {event.ticket_price?.toFixed(2)}</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${payMethod === "pix" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="pix" />
                <QrCode className="w-5 h-5 text-warmgray" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="font-medium text-sm">Pix</p>
                  <p className="text-xs text-warmgray">R$ {event.ticket_price?.toFixed(2)} • Instant</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${payMethod === "festcoin" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="festcoin" />
                <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="font-medium text-sm">Wallet Balance</p>
                  <p className="text-xs text-primary font-semibold">R${festcoinPrice?.toFixed(2)} • 20% off</p>
                </div>
              </label>
            </RadioGroup>

            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-warmgray space-y-1">
            <p>You'll receive a ticket with QR code instantly. Saved for offline use at the door.</p>
            </div>

            <Button
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Pay ${payMethod === "festcoin" ? `R$${festcoinPrice?.toFixed(2)} (wallet)` : `R$ ${event.ticket_price?.toFixed(2)}`}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}