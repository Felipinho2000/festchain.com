import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Search } from "lucide-react";
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
    base44.entities.Event.filter(query, "-date", 50)
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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-3xl text-white mb-1 uppercase">Encontre sua próxima festa</h1>
        <p className="text-[#888] text-sm">Ingressos com QR seguro. Recompensas reais. Noites melhores.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" strokeWidth={1.5} />
          <Input
            placeholder="Buscar eventos ou casas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-card border-border text-white placeholder:text-[#555]"
          />
        </div>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-card border-border text-white">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[16/10] bg-secondary animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Calendar className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
          {search || genre !== "all" ? (
            <p className="text-[#666] text-sm">Nenhum evento encontrado. Tente ajustar sua busca.</p>
          ) : (
            <>
              <p className="text-white text-base font-semibold mb-1">Nenhuma festa no ar ainda.</p>
              <p className="text-[#666] text-sm mb-4">Crie o primeiro evento FestChain.</p>
              <a href="/#contact" className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">Criar evento →</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}