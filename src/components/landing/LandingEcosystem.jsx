import React from "react";
import { COPY } from "./landingData";
import Reveal from "./Reveal";

export default function LandingEcosystem() {
  const c = COPY["pt-BR"];

  return (
    <section className="py-24 sm:py-28 px-5 bg-white/[0.015] border-t border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.ecosystem.kicker}</p>
          <h2 className="font-heading font-bold text-3xl sm:text-5xl text-white leading-[1.05] tracking-[-0.02em] mb-4">
            {c.ecosystem.title}
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-2xl mx-auto">{c.ecosystem.sub}</p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {c.ecosystem.cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <div className="group h-full bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-3xl p-7 transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_60px_-20px_rgba(255,101,0,0.2)]">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-lg mb-2">{card.t}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{card.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}