import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Check } from "lucide-react";

export default function FeeCard({ feeInfo }) {
  const { t } = useLanguage();
  if (!feeInfo) return null;

  const isPilot = feeInfo.fee_tier === "pilot" && feeInfo.pilot_expires_at;
  const pilotDate = isPilot
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(feeInfo.pilot_expires_at)
      )
    : null;
  const rate = Math.round(feeInfo.fee_percentage || 8);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-5">
      <p className="text-xs text-muted-foreground">{t("financeiro.feeCardTitle")}</p>
      <p className="text-3xl font-bold text-foreground mt-1">
        {isPilot
          ? t("financeiro.feePilot").replace("{date}", pilotDate)
          : t("financeiro.feeStandard").replace("{rate}", rate)}
      </p>
      <div className="mt-4 space-y-1.5">
        {[t("financeiro.noMonthly"), t("financeiro.noSignup"), t("financeiro.noPublish")].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.5} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}