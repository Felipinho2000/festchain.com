import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import CompForm from "@/components/convidados/CompForm";
import CompList from "@/components/convidados/CompList";

export default function Convidados() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comps, setComps] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      const allEvents = await base44.entities.Event.list("-created_date", 50);
      const myEvents = (allEvents || []).filter((e) => e.created_by_id === currentUser.id);
      setEvents(myEvents);
      if (myEvents.length > 0) setSelectedEvent(myEvents[0]);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedEvent) {
      setComps([]);
      return;
    }
    base44.entities.Ticket.filter(
      { event_id: selectedEvent.id, is_complimentary: true },
      "-created_date",
      500
    )
      .then(setComps)
      .catch(() => setComps([]));
  }, [selectedEvent, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const compCount = comps.filter((c) => c.status === "active" || c.status === "used").length;
  const capacity = selectedEvent?.total_capacity || 0;
  const percent = capacity > 0 ? Math.round((compCount / capacity) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <header>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("convidados.backToDashboard")}
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {t("convidados.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("convidados.subtitle")}</p>
      </header>

      {/* Event selector */}
      {events.length > 1 && (
        <select
          value={selectedEvent?.id || ""}
          onChange={(e) => setSelectedEvent(events.find((ev) => ev.id === e.target.value))}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      )}

      {selectedEvent ? (
        <>
          {/* Live counter */}
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-sm text-foreground font-medium">
              {t("convidados.counter")
                .replace("{count}", compCount)
                .replace("{capacity}", capacity)
                .replace("{percent}", percent)}
            </p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>

          <CompForm event={selectedEvent} onIssued={refresh} />
          <CompList comps={comps} onRevoke={refresh} />
        </>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <p className="text-foreground font-medium">{t("convidados.noComps")}</p>
        </div>
      )}
    </div>
  );
}