import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Info, ListChecks, Sparkles } from "lucide-react";

export default function FestCoinInfo() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* What is FestCoin */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-heading font-semibold text-white text-base flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> {t("festcoin.whatIsTitle")}
        </h2>
        <p className="text-sm text-[#aaa] leading-relaxed">{t("festcoin.whatIsBody")}</p>
        <p className="text-sm text-[#aaa] leading-relaxed">{t("festcoin.whatIsBody2")}</p>
      </div>

      {/* Why use FestCoin */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-heading font-semibold text-white text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> {t("festcoin.whyUseTitle")}
        </h2>
        <ul className="space-y-2">
          {t("festcoin.whyUseItems").map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#aaa]">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-heading font-semibold text-white text-base flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" /> {t("festcoin.howTitle")}
        </h2>
        <ol className="space-y-3">
          {t("festcoin.howSteps").map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-[#aaa] pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}