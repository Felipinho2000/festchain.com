import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowUpRight, ArrowDownLeft, Zap } from "lucide-react";
import moment from "moment";

const TX_LABEL_MAP = {
  pilot_topup: "txPilotTopup",
  ticket_reward: "txTicketReward",
  cashback: "txCashback",
  moment_reward: "txMomentReward",
  purchase: "txPurchase",
  redemption: "txRedemption",
  refund: "txRefund",
  admin_adjustment: "txAdminAdjustment",
  demo_data: "txDemoData",
};

const isPositiveType = (type) => ["earned", "transferred_in", "pilot_topup"].includes(type);

export default function TransactionList({ transactions, loading }) {
  const { t } = useLanguage();

  // Filter out demo data from user-facing view
  const visibleTx = transactions.filter(
    tx => tx.source !== "demo_data" && !(tx.description || "").startsWith("[DEMO]")
  );

  const getLabel = (tx) => {
    const key = TX_LABEL_MAP[tx.source] || TX_LABEL_MAP[tx.type];
    return key ? t(`festcoin.${key}`) : (tx.description || tx.type);
  };

  if (loading) {
    return (
      <div>
        <h2 className="font-heading font-semibold text-lg text-white mb-4">{t("festcoin.txHistory")}</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading font-semibold text-lg text-white mb-4">{t("festcoin.txHistory")}</h2>
      {visibleTx.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Zap className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[#666] text-sm">{t("festcoin.noTransactions")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTx.map(tx => {
            const positive = isPositiveType(tx.type);
            const Icon = positive ? ArrowDownLeft : ArrowUpRight;
            return (
              <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${positive ? "bg-emerald-900/30" : "bg-red-900/20"}`}>
                  <Icon className={`w-4 h-4 ${positive ? "text-emerald-400" : "text-red-400"}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{getLabel(tx)}</p>
                  <div className="flex items-center gap-2 text-xs text-[#666]">
                    <span>{moment(tx.created_date).format("MMM D, YYYY · h:mm A")}</span>
                    {tx.event_title && <span className="truncate">· {tx.event_title}</span>}
                  </div>
                  {tx.status && tx.status !== "confirmed" && (
                    <span className="text-[10px] text-amber-400">{tx.status}</span>
                  )}
                </div>
                <span className={`font-heading font-bold text-sm ${positive ? "text-emerald-400" : "text-red-400"}`}>
                  {positive ? "+" : "-"}{(tx.amount || 0).toLocaleString()} FTC
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}