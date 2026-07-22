import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Music, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo", other: "Outro"
};

const monthLabels = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default function EventCard({ event }) {
  const { toast } = useToast();
  const spotsLeft = event.total_capacity - (event.tickets_sold || 0);
  const soldOut = spotsLeft <= 0;
  const sellingFast = !soldOut && spotsLeft <= Math.ceil(event.total_capacity * 0.2);
  const price = event.ticket_price || 0;
  const date = moment(event.date);

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      navigator.share({ title: event.title, text: `Bora pra ${event.title} 🎟️`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast({ title: "Link copiado!", description: "Compartilha no WhatsApp ou Instagram." });
      }).catch(() => {});
    }
  };

  return (
    <Link to={`/events/${event.id}`} className="group block">
      <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-[0_0_24px_-4px_rgba(255,101,0,0.25)]">
        {/* Flyer image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-[#1a1a1a]">
              <Music className="w-12 h-12 text-primary/30" strokeWidth={1.5} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Urgency badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {soldOut ? (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Esgotado</span>
            ) : sellingFast ? (
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide animate-pulse">Esgotando</span>
            ) : null}
            {event.status === "live" && (
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> AO VIVO
              </span>
            )}
            {event.visibility === "private" && (
              <span className="bg-black/70 backdrop-blur-sm text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full">Privado</span>
            )}
          </div>

          {/* Share button */}
          <button onClick={handleShare} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary transition-colors" aria-label="Compartilhar">
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {/* Date badge on image */}
          <div className="absolute bottom-3 left-3 bg-primary text-white rounded-lg px-2.5 py-1.5 text-center leading-none">
            <div className="text-[10px] font-bold uppercase">{monthLabels[date.month()]}</div>
            <div className="text-lg font-extrabold">{date.format("D")}</div>
          </div>

          {/* Title overlay on image */}
          <div className="absolute bottom-3 right-3 left-16">
            <h3 className="font-heading font-extrabold text-white text-base uppercase leading-tight line-clamp-2 drop-shadow-lg">{event.title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-2 text-[#888] text-xs">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="truncate">{event.location_name}</span>
            </div>
            <div className="flex items-center gap-2 text-[#888] text-xs">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{date.format("HH:mm")}h</span>
              {event.genre && <span className="text-[#555]">· {genreLabels[event.genre] || event.genre}</span>}
            </div>
          </div>

          {/* Pricing row */}
          <div className="flex items-end justify-between pt-3 border-t border-border">
            <div>
              <span className="text-[10px] text-[#555] block mb-0.5">
                {price === 0 ? "Grátis / RSVP" : "A partir de"}
              </span>
              <span className="font-heading font-extrabold text-white text-lg">
                {price === 0 ? "Grátis" : `R$ ${price.toFixed(2)}`}
              </span>
            </div>
            {spotsLeft > 0 && (
              <span className="text-[10px] text-[#666]">{spotsLeft} restantes</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}