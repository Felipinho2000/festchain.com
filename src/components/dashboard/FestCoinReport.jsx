import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Zap, TrendingUp, TrendingDown, Gift, RotateCcw, ShoppingBag } from "lucide-react";

export default function FestCoinReport({ events }) {
  const { t } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!events || events.length === 0) { setLoading(false); return; }
    setLoading(true);
    base44.functions.invoke("getFestCoinReport", {})
      .then(res => {
        const data = res.data || res;
        if (data.status === "success") setReport(data.report);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [events]);

  if (loading) {
    return <div className="bg-card border border-border rounded-xl p-5 animate-pulse h-32" />;
  }

  if (!report || !report.totals || !report.events?.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <Zap className="w-8 h-8 text-[#444] mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-[#666] text-sm">{t("festcoin.reportNoData")}</p>
      </div>
    );
  }

  const totals = report.totals;
  const currencyCode = report.events[0]?.currency_code || "BRL";

  const cards = [
    { label: t("festcoin.reportTopups"), value: totals.topups, icon: TrendingUp, color: "text-emerald-400 bg-emerald-900/20" },
    { label: t("festcoin.reportSpent"), value: totals.spent, icon: TrendingDown, color: "text-red-400 bg-red-900/20" },
    { label: t("festcoin.reportCashback"), value: totals.cashback, icon: Gift, color: "text-primary bg-primary/10" },
    { label: t("festcoin.reportTicketRewards"), value: totals.ticket_rewards, icon: Zap, color: "text-primary bg-primary/10" },
    { label: t("festcoin.reportRefunds"), value: totals.refunds, icon: RotateCcw, color: "text-amber-400 bg-amber-900/20" },
    { label: t("festcoin.reportPurchaseCount"), value: totals.purchase_count, icon: ShoppingBag, color: "text-primary bg-primary/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
              <card.icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <p className="font-heading font-bold text-xl text-white">{(card.value || 0).toLocaleString()}</p>
            <p className="text-xs text-[#888]">{card.label}</p>
          </div>
        ))}
      </div>
      {totals.native_topup_value > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-[#888]">{t("festcoin.reportNativeValue")}</span>
          <span className="font-heading font-bold text-white">
            {currencyCode} {totals.native_topup_value.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}