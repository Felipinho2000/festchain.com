import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Check, Clock, Circle } from "lucide-react";

const formatBRL = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);

const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso))
    : "—";

function Timeline({ payout }) {
  const { t } = useLanguage();
  const status = payout.status;
  const hasTickets = (payout.tickets_sold || 0) > 0;

  const steps = [
    { label: t("financeiro.timelineSold"), done: hasTickets, active: !hasTickets },
    { label: t("financeiro.timelineEvent"), done: ["settlement_window", "payable", "paid"].includes(status) },
    { label: t("financeiro.timelineWindow"), done: ["payable", "paid"].includes(status), active: status === "settlement_window" },
    { label: t("financeiro.timelinePayout"), done: status === "paid" },
  ];

  return (
    <div className="flex items-start justify-between">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                step.done
                  ? "bg-primary border-primary text-primary-foreground"
                  : step.active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {step.done ? (
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              ) : step.active ? (
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <Circle className="w-2 h-2 fill-current" />
              )}
            </div>
            <span
              className={`text-[10px] text-center leading-tight ${
                step.done || step.active ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-3 mx-0.5 mt-3.5 rounded-full ${step.done ? "bg-primary" : "bg-border"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function PayoutStatement({ statement }) {
  const { t } = useLanguage();
  const { event, organizer, payout } = statement;
  if (!payout) return null;

  const feeRate = Math.round(organizer?.fee_percentage || 8);

  const rows = [
    { label: t("financeiro.grossSales"), value: formatBRL(payout.gross_sales_cents) },
    { label: t("financeiro.refunds"), value: formatBRL(payout.refunded_amount_cents) },
    { label: t("financeiro.platformFee").replace("{rate}", feeRate), value: formatBRL(payout.platform_fee_cents) },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">{event.title}</h3>
        {event.date && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(event.date))}
          </p>
        )}
      </div>

      {/* Statement table */}
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-foreground font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-foreground font-semibold">{t("financeiro.netPayable")}</span>
          <span className="text-primary font-bold text-lg">{formatBRL(payout.net_payable_cents)}</span>
        </div>
      </div>

      {/* Timeline */}
      <Timeline payout={payout} />

      {/* Payout date */}
      <div className="pt-3 border-t border-border">
        {payout.status === "paid" && payout.paid_at ? (
          <p className="text-xs text-success font-medium">
            ✓ {t("financeiro.payoutDone").replace("{date}", formatDate(payout.paid_at))}
          </p>
        ) : payout.payout_due_at ? (
          <p className="text-xs text-muted-foreground">
            {t("financeiro.expectedPayoutDate")}: <span className="font-medium text-foreground">{formatDate(payout.payout_due_at)}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}