import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { COPY } from "./landingData";
import Reveal from "./Reveal";

export default function LandingPricing() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY["pt-BR"];

  return (
    <section id="pricing" className="py-24 sm:py-28 px-5">
      <div className="max-w-2xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.pricing.kicker}</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 tracking-[-0.02em]">
            {c.pricing.title}
          </h2>
          <p className="text-white/50 text-base leading-relaxed">{c.pricing.sub}</p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] rounded-3xl p-8">
            <div className="divide-y divide-white/[0.06]">
              {c.pricing.example.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-5">
                  <span className={"text-sm " + (row.highlight ? "text-white font-heading font-bold" : "text-white/50")}>
                    {row.label}
                  </span>
                  <span className={"font-heading " + (row.highlight ? "text-primary text-2xl font-bold" : "text-white text-lg font-semibold")}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-center text-white/40 text-sm mt-6">{c.pricing.pilotNote}</p>
          <div className="text-center mt-4">
            <Link to={c.pricing.fullLinkHref} className="text-primary text-sm font-semibold hover:underline">
              {c.pricing.fullLink}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}