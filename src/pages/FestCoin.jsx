import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Zap, Calendar } from "lucide-react";
import TopupPanel from "@/components/festcoin/TopupPanel";
import TransactionList from "@/components/festcoin/TransactionList";
import FestCoinInfo from "@/components/festcoin/FestCoinInfo";

const symbolFor = (code) => {
  if (code === "BRL") return "R$";
  if (code === "USD") return "$";
  if (code === "EUR") return "€";
  return "";
};

export default function FestCoin() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const [txs, evts] = await Promise.all([
      base44.entities.FestCoinTransaction.filter(
        { created_by_id: currentUser.id },
        "-created_date",
        100
      ).catch(() => []),
      base44.entities.Event.filter(
        { ftc_enabled: true, status: "published" },
        "-created_date",
        20
      ).catch(() => []),
    ]);
    setTransactions(txs);
    setEvents(evts);
    setSelectedEvent(prev => {
      if (prev) return prev;
      return evts.length > 0 ? evts[0] : null;
    });
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  // Calculate balance from confirmed, non-demo transactions only.
  const validTx = transactions.filter(
    tx => tx.status === "confirmed" && tx.source !== "demo_data"
  );
  const balance = validTx.reduce((s, tx) => {
    if (["earned", "transferred_in", "pilot_topup"].includes(tx.type)) return s + (tx.amount || 0);
    if (["spent", "transferred_out"].includes(tx.type)) return s - (tx.amount || 0);
    return s;
  }, 0);

  const rate = selectedEvent?.ftc_conversion_rate || 1;
  const estimatedValue = rate > 0 ? balance * rate : 0;
  const currencyCode = selectedEvent?.currency_code || "BRL";
  const symbol = symbolFor(currencyCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-white mb-1">{t("festcoin.navLabel")}</h1>
        <p className="text-[#888] text-sm">{t("festcoin.subtitle")}</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-[#1f1f1f] to-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-[#666] uppercase tracking-wider">{t("festcoin.balance")}</p>
            {(!selectedEvent || selectedEvent?.ftc_pilot_mode !== false) && (
              <span className="text-[9px] font-bold uppercase bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded">
                {t("festcoin.pilotLabel")}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-heading font-bold text-5xl text-white tracking-tight">{balance.toLocaleString()}</span>
            <span className="text-[#888] text-sm">FTC</span>
          </div>
          {selectedEvent && (
            <p className="text-xs text-[#888] mb-1">
              {t("festcoin.estimatedValue")}:{" "}
              <span className="text-white font-semibold">
                {symbol}{estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          )}
          {selectedEvent && (
            <p className="text-[10px] text-[#555]">{t("festcoin.conversionDisclaimer")}</p>
          )}
        </div>
      </div>

      {/* Event selector */}
      {events.length > 0 && (
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <select
            value={selectedEvent?.id || ""}
            onChange={e => setSelectedEvent(events.find(ev => ev.id === e.target.value))}
            className="bg-transparent text-sm text-white flex-1 outline-none cursor-pointer"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id} className="bg-card text-white">
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Top-up panel */}
      <TopupPanel selectedEvent={selectedEvent} onSuccess={loadData} />

      {/* Explanation */}
      <FestCoinInfo />

      {/* Transaction history */}
      <TransactionList transactions={transactions} loading={loading} />
    </div>
  );
}