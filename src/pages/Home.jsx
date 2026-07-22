import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Calendar, Zap, Ticket, ArrowRight, TrendingUp, Users,
  QrCode, ShieldCheck, Sparkles, Wallet, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";

const pillars = [
  { icon: QrCode, label: "Ingressos QR seguros", desc: "Códigos únicos e invioláveis — nada de print falso." },
  { icon: Zap, label: "Funciona offline", desc: "Seu QR fica no celular e é lido na portaria mesmo sem internet." },
  { icon: ShieldCheck, label: "Sem entrada dupla", desc: "O check-in é validado no servidor; cada ingresso é lido só uma vez." },
  { icon: Sparkles, label: "Recompensas", desc: "Ganhe créditos por participar — benefícios dentro do app." },
];

const flow = [
  { step: "1", icon: Ticket, title: "Compre seu ingresso", desc: "O ingresso QR é emitido na hora direto na sua carteira." },
  { step: "2", icon: QrCode, title: "Mostre o QR na porta", desc: "Abra a carteira e apresente o QR — funciona offline." },
  { step: "3", icon: ShieldCheck, title: "Entrada liberada", desc: "O porteiro escaneia e a entrada dupla é bloqueada." },
  { step: "4", icon: Sparkles, title: "Ganhe recompensas", desc: "Acumule créditos por participar. Use em benefícios." },
];

const forOrganizers = [
  { icon: QrCode, label: "Emitir e validar ingressos QR" },
  { icon: TrendingUp, label: "Vendas e check-in em tempo real" },
  { icon: Users, label: "Saiba quem está na porta" },
  { icon: ShieldCheck, label: "Sem repasse, sem fraude" },
];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Event.filter({ status: "published" }, "-date", 4)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1c] to-[#111] border border-border p-8 lg:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Piloto privado · Ingressos QR
          </div>
          <h1 className="font-heading font-extrabold text-4xl lg:text-[52px] leading-[1.08] tracking-tight text-white mb-4 uppercase">
            Compre ingressos.<br />
            <span className="text-primary">Evite filas.</span><br />
            Aproveite mais.
          </h1>
          <p className="text-[#888] text-lg leading-relaxed mb-8 max-w-xl">
            Plataforma para descobrir eventos, guardar ingressos e comprar produtos antes mesmo de chegar ao local.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/events">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 text-sm font-bold rounded-xl">
                <Calendar className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Explorar eventos
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" className="h-12 px-7 text-sm font-bold rounded-xl border-border text-white hover:bg-primary/10 hover:border-primary/40">
                <Wallet className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Abrir carteira
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pillars.map((p, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
              <p.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-white text-sm font-semibold mb-1">{p.label}</p>
            <p className="text-[#555] text-[11px] leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section>
        <h2 className="font-heading font-semibold text-xl text-white mb-5 uppercase">Como funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {flow.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 relative">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center mb-4">
                <f.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="absolute top-4 right-4 text-[#333] font-heading font-bold text-2xl">{f.step}</span>
              <h3 className="font-heading font-semibold text-sm text-white mb-1.5">{f.title}</h3>
              <p className="text-[#666] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-xl text-white uppercase">Próximos eventos</h2>
          <Link to="/events" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="aspect-[16/10] bg-secondary animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[#666] text-sm">Nenhum evento por enquanto. Crie seu primeiro evento no painel.</p>
          </div>
        )}
      </section>

      {/* ── FOR ORGANIZERS ── */}
      <section className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-border rounded-2xl p-7 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Para organizadores</p>
            <h2 className="font-heading font-extrabold text-2xl text-white mb-3 leading-tight uppercase">
              Controle de acesso<br />em escala.
            </h2>
            <p className="text-[#666] text-sm leading-relaxed mb-5">
              Crie eventos, emita ingressos QR e escaneie o público na porta com proteção contra entrada dupla e lista de participantes em tempo real.
            </p>
            <Link to="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-10 rounded-xl text-sm">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Abrir painel <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            {forOrganizers.map((item, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-white font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}