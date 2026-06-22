import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Zap, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Other"
};

export default function EventCard({ event }) {
  const spotsLeft = event.total_capacity - (event.tickets_sold || 0);
  const soldOutPercent = Math.round(((event.tickets_sold || 0) / event.total_capacity) * 100);

  return (
    <Link to={`/events/${event.id}`} className="group block">
      <div className="bg-white border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(45,42,38,0.12)] hover:border-primary/30 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Music className="w-10 h-10 text-primary/30" strokeWidth={1.5} />
            </div>
          )}
          {event.status === "live" && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          {event.genre && (
            <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-foreground text-xs">
              {genreLabels[event.genre] || event.genre}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-base text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-2 text-warmgray text-sm">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{moment(event.date).format("MMM D, YYYY · h:mm A")}</span>
            </div>
            <div className="flex items-center gap-2 text-warmgray text-sm">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="truncate">{event.location_name}</span>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex flex-col">
              <span className="text-xs text-warmgray">From</span>
              <span className="font-heading font-bold text-foreground">
                R$ {event.ticket_price?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-amber" title="FestCoin reward">
                <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="font-semibold">+{event.festcoin_reward || 50}</span>
              </div>
              <div className="flex items-center gap-1 text-warmgray">
                <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{spotsLeft > 0 ? `${spotsLeft} left` : "Sold out"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}