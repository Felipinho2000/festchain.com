import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react";
import FeeCard from "@/components/financeiro/FeeCard";
import PayoutStatement from "@/components/financeiro/PayoutStatement";

export default function OrganizerFinanceiro() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState([]);
  const [feeInfo, setFeeInfo] = useState(null);

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      try {
        // Fetch organizer's own events (RLS shows own + public; filter to own)
        const allEvents = await base44.entities.Event.list("-created_date", 50);
        const myEvents = (allEvents || []).filter((e) => e.created_by_id === currentUser.id);

        const results = [];
        for (const event of myEvents) {
          try {
            const res = await base44.functions.invoke("getOrganizerPayoutStatement", { event_id: event.id });
            if (res?.data) results.push(res.data);
          } catch (e) {
            console.error("Failed to load statement for", event.id, e);
          }
        }
        setStatements(results);
        if (results.length > 0 && results[0].organizer) {
          setFeeInfo(results[0].organizer);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <header>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("financeiro.backToDashboard")}
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t("financeiro.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("financeiro.subtitle")}</p>
      </header>

      {feeInfo && <FeeCard feeInfo={feeInfo} />}

      {statements.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <p className="text-foreground font-medium">{t("financeiro.noEvents")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("financeiro.noEventsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {statements.map((stmt, i) => (
            <PayoutStatement key={stmt.event?.id || i} statement={stmt} />
          ))}
        </div>
      )}
    </div>
  );
}