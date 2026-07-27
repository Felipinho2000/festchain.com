import React from "react";
import { Check } from "lucide-react";
import { COPY } from "./landingData";

export default function LandingTrustStrip() {
  const c = COPY["pt-BR"];

  return (
    <div className="border-t border-b border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap justify-center gap-x-10 gap-y-2.5">
        {c.strip.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-white/40 text-sm font-medium">
            <Check className="w-4 h-4 text-primary" strokeWidth={2.5} /> {item}
          </span>
        ))}
      </div>
    </div>
  );
}