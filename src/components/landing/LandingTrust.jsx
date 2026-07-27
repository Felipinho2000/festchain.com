import React from "react";
import { ShieldCheck } from "lucide-react";
import { COPY } from "./landingData";
import Reveal from "./Reveal";

export default function LandingTrust() {
  const c = COPY["pt-BR"];

  return (
    <section className="py-20 px-5">
      <Reveal className="max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-7 h-7 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-4 tracking-[-0.02em]">
          {c.trust.title}
        </h2>
        <p className="text-white/40 text-sm sm:text-base leading-relaxed">{c.trust.body}</p>
      </Reveal>
    </section>
  );
}