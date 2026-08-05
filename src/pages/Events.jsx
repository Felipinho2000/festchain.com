import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventCard from "@/components/events/EventCard";

const genres = [
  { value: "all", label: "Todos os estilos" },
  { value: "techno", label: "Techno" },
  { value: "house", label: "House" },
  { value: "trance", label: "Trance" },
  { value: "drum_and_bass", label: "Drum & Bass" },
  { value: "hip_hop", label: "Hip Hop" },
  { value: "reggaeton", label: "Reggaeton" },
  { value: "funk", label: "Funk" },
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "sertanejo", label: "Sertanejo" },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");

  useEffect(() => {
    const query = { status: "published", visibility: "public" };
    if (genre !== "all") query.genre = genre;
    // Public list — anonymous visitors hit this directly (no backend function
    // in front of it), so we explicitly allow-list the fields returned.
    // Without this, the raw entity API also returns created_by (the
    // organizer's account email) for every event, which getEventDetails
    // deliberately strips for non-owners. Keep this list in sync with what
    // EventCard.jsx actually renders.
    const publicFields = [
      "id", "title", "date", "end_date", "location_name", "genre",
      "image_url", "ticket_price", "tickets_sold", "total_capacity",
      "status", "visibility", "currency_code",
    ];
    base44.entities.Event.filter(query, "-date", 50, 0, publicFields)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genre]);

  const filtered = events.filter(e =>
    e.visibility !== "private" &&
    (!search || e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.location_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12 space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-1 tracking-tight">Acha seu próximo rolê</h1>
        <p className="text-muted-foreground text-sm">Ingresso QR seguro. Recompensa real. Night melhor.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Busca rolê ou casa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl bg-card border-border text-foreground">
            <SlidersHorizontal className="w-4 h-4 mr-1.5 text-muted-foreground" strokeWidth={1.75} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {genres.map(g => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="aspect-[4/5] shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-muted-foreground/50" strokeWidth={1.5} />
          </div>
          {search || genre !== "all" ? (
            <p className="text-muted-foreground text-sm">Nenhum rolê encontrado. Ajusta a busca aí.</p>
          ) : (
            <>
              <p className="text-foreground text-base font-semibold mb-1">Nenhuma festa no ar ainda.</p>
              <p className="text-muted-foreground text-sm mb-4">Cria o primeiro rolê FestChain.</p>
              <a href="/#contact" className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">Criar evento →</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}