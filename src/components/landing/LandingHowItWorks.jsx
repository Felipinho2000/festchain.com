import React from "react";
import { COPY } from "./landingData";
import Reveal from "./Reveal";

export default function LandingHowItWorks() {
  const c = COPY["pt-BR"];

  return (
    <section id="how" className="py-24 sm:py-28 px-5">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.how.kicker}</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-[-0.02em]">
            {c.how.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {c.how.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <div className="group relative h-full bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-3xl p-7 transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_60px_-20px_rgba(255,101,0,0.2)]">
                  <div className="absolute top-6 right-6 text-xs font-bold text-primary/30 font-heading text-lg">
                    0{i + 1}
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-base mb-2">{step.t}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}