import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { COPY } from "./landingData";
import Reveal from "./Reveal";

export default function LandingObjections() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY["pt-BR"];

  return (
    <section id="objections" className="py-24 sm:py-28 px-5 bg-white/[0.015] border-t border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="max-w-2xl mb-14">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.objections.kicker}</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-[1.05] tracking-[-0.02em]">
            {c.objections.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {c.objections.items.map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="group h-full bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-3xl p-8 transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_60px_-20px_rgba(255,101,0,0.2)]">
                <h3 className="font-heading font-bold text-white text-lg mb-3 leading-snug">{item.q}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}