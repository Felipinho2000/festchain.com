import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Calendar, Zap, Ticket, ArrowRight, TrendingUp, Users,
  QrCode, ShieldCheck, Sparkles, Wallet, LayoutDashboard, MapPin, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";
import moment from "moment";

const pillars = [
  { icon: QrCode, label: "Ingressos QR seguros", desc: "Códigos únicos e invioláveis — nada de print falso." },
  { icon: Zap, label: "Funciona offline", desc: "Seu QR fica no celular e é lido na portaria sem internet." },
  { icon: ShieldCheck, label: "Sem entrada dupla", desc: "Check-in validado no servidor; cada ingresso é lido uma vez." },
  { icon: Sparkles, label: "Recompensas", desc: "Ganha crédito por aparecer — perks no app." },
];

const flow = [
  { step: "01", icon: Ticket, title: "Compra seu ingresso", desc: "O ingresso QR sai na hora, direto na carteira." },
  { step: "02", icon: QrCode, title: "Mostra o QR na porta", desc: "Abre a carteira e mostra o QR — funciona offline." },
  { step: "03", icon: ShieldCheck, title: "Entrada liberada", desc: "O porteiro escaneia e a entrada dupla é bloqueada." },
  { step: "04", icon: Sparkles, title: "Ganha recompensa", desc: "Acumula crédito por aparecer. Usa em perks." },
];

const forOrganizers = [
  { icon: QrCode, label: "Emitir e validar ingressos QR" },
  { icon: TrendingUp, label: "Vendas e check-in em tempo real" },
  { icon: Users, label: "Saiba quem está na porta" },
  { icon: ShieldCheck, label: "Sem caô, sem fraude" },
];

const genres = [
  "techno", "house", "trance", "drum_and_bass", "hip_hop",
  "reggaeton", "funk", "pop", "rock", "sertanejo"
];
const genreLabels = {
  techno: "Techno", house: "House", trance: "Trance",
  drum_and_bass: "Drum & Bass", hip_hop: "Hip Hop",
  reggaeton: "Reggaeton", funk: "Funk", pop: "Pop",
  rock: "Rock", sertanejo: "Sertanejo"
};

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const featured = events[0];
  const restEvents = events.slice(1);

  useEffect(() => {
    base44.entities.Event.filter({ status: "published" }, "-date", 5)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featuredDate = featured ? moment(featured.date) : null;

  return (
    <div className="min-h-screen">
      {/* ── FEATURED HERO ── */}
      <section className="relative">
        {loading ? (
          <div className="relative h-[420px] lg:h-[520px] shimmer rounded-b-3xl overflow-hidden" />
        ) : featured ? (
          <Link to={`/events/${featured.id}`} className="group block relative h-[420px] lg:h-[520px] overflow-hidden">
            {featured.image_url ? (
              <img
                src={featured.image_url}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />

            <div className="relative h-full flex flex-col justify-end max-w-6xl mx-auto px-4 lg:px-8 pb-8 lg:pb-12">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider w-fit">
                <Sparkles className="w-3 h-3" strokeWidth={2} />
                Destaque da semana
              </div>
              <h1 className="font-heading font-extrabold text-3xl lg:text-6xl leading-[1.05] tracking-tight text-white mb-3 max-w-3xl text-balance">
                {featured.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-muted-foreground mb-6">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-primary" strokeWidth={1.75} />
                  {featuredDate?.format("ddd, D [de] MMMM")}
                </span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" strokeWidth={1.75} />
                  {featured.location_name}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 text-sm font-bold rounded-xl shadow-glow">
                  <Ticket className="w-4 h-4 mr-2" strokeWidth={1.75} />
                  Garantir ingresso
                </Button>
                <Button variant="outline" className="h-12 px-7 text-sm font-bold rounded-xl border-border bg-black/30 backdrop-blur-sm text-white hover:bg-primary/10 hover:border-primary/40">
                  Ver detalhes <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </Link>
        ) : (
          /* Empty-state hero */
          <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-secondary to-background border-b border-border px-4 lg:px-8 py-12 lg:py-16">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="relative max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Piloto privado · Ingressos QR
              </div>
              <h1 className="font-heading font-extrabold text-4xl lg:text-[52px] leading-[1.08] tracking-tight text-white mb-4 text-balance">
                Compra ingresso. <span className="text-primary">Corta fila.</span> Curte mais.
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                Descobre rolê, guarda ingresso e compra bebida antes mesmo de chegar no local.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/events">
                  <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 text-sm font-bold rounded-xl shadow-glow">
                    <Calendar className="w-4 h-4 mr-2" strokeWidth={1.75} />
                    Explorar eventos
                  </Button>
                </Link>
                <Link to="/wallet">
                  <Button variant="outline" className="h-12 px-7 text-sm font-bold rounded-xl border-border text-white hover:bg-primary/10 hover:border-primary/40">
                    <Wallet className="w-4 h-4 mr-2" strokeWidth={1.75} />
                    Abrir carteira
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </section>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-14">
        {/* ── GENRE QUICK FILTERS ── */}
        {events.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
            <Link
              to="/events"
              className="flex-shrink-0 flex items-center gap-2 bg-secondary border border-border rounded-full px-4 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={2} />
              Todos
            </Link>
            {genres.map(g => (
              <Link
                key={g}
                to="/events"
                className="flex-shrink-0 bg-secondary border border-border rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
              >
                {genreLabels[g]}
              </Link>
            ))}
          </div>
        )}

        {/* ── PILLARS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <p.icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.75} />
              </div>
              <p className="text-foreground text-sm font-semibold mb-1">{p.label}</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* ── UPCOMING EVENTS ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-2xl text-foreground">Próximos eventos</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Garanta seu lugar antes que esgote</p>
            </div>
            <Link to="/events" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="aspect-[4/5] shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : restEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {restEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : null}
        </section>

        {/* ── HOW IT WORKS ── */}
        <section>
          <div className="text-center mb-8">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Simples e rápido</p>
            <h2 className="font-heading font-bold text-2xl text-foreground">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flow.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden hover:border-primary/20 transition-colors">
                <div className="absolute -top-2 -right-2 text-[44px] font-heading font-extrabold text-secondary leading-none select-none">{f.step}</div>
                <div className="relative w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4">
                  <f.icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="relative font-heading font-semibold text-sm text-foreground mb-1.5">{f.title}</h3>
                <p className="relative text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOR ORGANIZERS ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary to-card border border-border rounded-3xl p-7 lg:p-12">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Para organizadores</p>
              <h2 className="font-heading font-extrabold text-3xl text-foreground mb-3 leading-tight text-balance">
                Controle de acesso sem enrolação.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
                Cria rolê, emite ingresso QR e escaneia a galera na porta — sem entrada dupla e com lista de participantes em tempo real.
              </p>
              <Link to="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11 rounded-xl text-sm shadow-glow">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" strokeWidth={1.75} />
                  Abrir painel <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />
                </Button>
              </Link>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              {forOrganizers.map((item, i) => (
                <div key={i} className="bg-background/60 border border-border rounded-xl p-4 flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.75} />
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}