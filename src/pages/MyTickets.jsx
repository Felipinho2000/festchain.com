import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Ticket, QrCode, Calendar, MapPin, Award, Check, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FestCoinBadge from "@/components/shared/FestCoinBadge";
import Qr from "@/components/shared/Qr";
import moment from "moment";

const statusColors = {
  active: "bg-emerald-900/40 text-emerald-400",
  used: "bg-[#222] text-[#888]",
  transferred: "bg-blue-900/30 text-blue-400",
  expired: "bg-red-900/30 text-red-400",
  refunded: "bg-orange-900/30 text-orange-400"
};

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);
  // Load QR from localStorage cache (works offline at door)
  const cachedQR = (() => {
    try { return JSON.parse(localStorage.getItem("fc_tickets") || "{}")[ticket.id]?.qr_code; } catch (_) { return null; }
  })();
  const qrCode = ticket.qr_code || cachedQR;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
      <div className="flex">
        {/* Left: Image */}
        <div className="w-28 sm:w-36 flex-shrink-0 bg-secondary relative">
          {ticket.event_image ? (
            <img src={ticket.event_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-8 h-8 text-warmgray/30" strokeWidth={1.5} />
            </div>
          )}
          {ticket.checked_in && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-semibold text-white text-sm line-clamp-1">{ticket.event_title}</h3>
              <Badge className={`text-[10px] px-2 py-0.5 ${statusColors[ticket.status] || ""} border-0 flex-shrink-0`}>
                {ticket.status}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 text-xs text-warmgray">
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
            <div className="flex items-center gap-3">
              <FestCoinBadge amount={`+${ticket.festcoin_earned || 0}`} size="sm" />
              {ticket.poap_minted && (
                <span className="flex items-center gap-1 text-amber text-xs font-medium">
                  <Award className="w-3 h-3" strokeWidth={1.5} />
                  POAP
                </span>
              )}
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
            >
              <QrCode className="w-3 h-3" strokeWidth={1.5} />
              {showQR ? "Hide" : "Show QR"}
            </button>
          </div>

          {showQR && (
            <div className="mt-3 pt-3 border-t border-[#222] text-center">
              <div className="inline-flex flex-col items-center gap-2 bg-white rounded-2xl p-5">
                <Qr value={qrCode} size={200} />
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

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    base44.entities.Ticket.filter({ created_by_id: currentUser?.id }, "-created_date", 50)
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const active = tickets.filter(t => t.status === "active");
  const past = tickets.filter(t => t.status !== "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">My Tickets</h1>
        <p className="text-warmgray text-sm">Your digital ticket wallet — secure and verifiable.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Ticket className="w-10 h-10 text-warmgray/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-warmgray text-sm mb-1">No tickets yet</p>
          <p className="text-warmgray text-xs">Browse events and get your first digital ticket.</p>
        </div>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="bg-transparent p-0 gap-4 border-b border-border rounded-none h-auto">
            <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3">
            {active.length > 0 ? active.map(t => <TicketCard key={t.id} ticket={t} />) : (
              <p className="text-warmgray text-sm py-8 text-center">No active tickets.</p>
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-3">
            {past.length > 0 ? past.map(t => <TicketCard key={t.id} ticket={t} />) : (
              <p className="text-warmgray text-sm py-8 text-center">No past tickets.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}