import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Zap, Music, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Other"
};

export default function EventCard({ event }) {
  const { toast } = useToast();
  const spotsLeft = event.total_capacity - (event.tickets_sold || 0);
  const soldPct = Math.min(100, Math.round(((event.tickets_sold || 0) / event.total_capacity) * 100));
  const sellingFast = soldPct >= 70 && spotsLeft > 0;

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      navigator.share({ title: event.title, text: `Join me at ${event.title} on FestChain 🎟️`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast({ title: "Event link copied!", description: "Share it on WhatsApp or Instagram." });
      }).catch(() => {});
    }
  };

  return (
    <Link to={`/events/${event.id}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-[0_0_20px_-4px_rgba(255,85,0,0.2)]">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1f1f1f]">
              <Music className="w-10 h-10 text-primary/30" strokeWidth={1.5} />
            </div>
          )}

          {/* Top-left status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {event.status === "live" && (
              <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
            {sellingFast && event.status !== "live" && (
              <div className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Selling Fast</div>
            )}
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${event.visibility === "private" ? "bg-amber-900/80 text-amber-300" : "bg-black/70 text-white backdrop-blur-sm"}`}>
              {event.visibility === "private" ? "Private" : "Public"}
            </div>
          </div>

          {/* Top-right: genre + share */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {event.genre && (
              <Badge className="bg-black/70 backdrop-blur-sm text-white text-xs border-0">
                {genreLabels[event.genre] || event.genre}
              </Badge>
            )}
            <button
              onClick={handleShare}
              className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Share event"
            >
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-base text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-2 text-[#888] text-sm">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{moment(event.date).format("MMM D, YYYY · h:mm A")}</span>
            </div>
            <div className="flex items-center gap-2 text-[#888] text-sm">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="truncate">{event.location_name}</span>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-[#666] mb-1">
              <span>{event.tickets_sold || 0} sold</span>
              <span>{spotsLeft > 0 ? `${spotsLeft} left` : "Sold out"}</span>
            </div>
            <div className="h-1 bg-[#252525] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${sellingFast ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${soldPct}%` }}
              />
            </div>
          </div>

          {/* Pricing row */}
          <div className="flex items-end justify-between pt-3 border-t border-border">
            <div>
              <span className="text-[10px] text-[#555] block mb-0.5">
                {event.ticket_price === 0 ? "Free / RSVP" : "Ticket"}
              </span>
              <span className="font-heading font-bold text-white text-sm">
                {event.ticket_price === 0 ? "Free" : `R$ ${event.ticket_price?.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-lg">
              <Zap className="w-3 h-3" strokeWidth={2} />
              +{event.festcoin_reward || 50} FTC
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}