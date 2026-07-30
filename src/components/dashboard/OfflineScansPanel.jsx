import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, RefreshCw, Clock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

// Organizer dashboard panel: shows offline-scan sync results and
// flags conflicts (same ticket scanned on two devices) for review.
export default function OfflineScansPanel({ events }) {
  const { t } = useLanguage();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!events?.length) { setLoading(false); return; }
    setLoading(true);
    try {
      const all = [];
      for (const ev of events) {
        const s = await base44.entities.DoorScan.filter({ event_id: ev.id }, "-synced_at", 200).catch(() => []);
        all.push(...s);
      }
      setScans(all);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [events]);

  const conflicts = scans.filter(s => s.sync_status === "conflito_duplicado");
  const applied = scans.filter(s => s.sync_status === "applied").length;
  const known = scans.filter(s => s.sync_status === "already_known").length;

  const summary = t("doorDashboard.summary")
    .replace("{applied}", applied)
    .replace("{conflicts}", conflicts.length)
    .replace("{known}", known);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-white text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" strokeWidth={1.5} />
            {t("doorDashboard.panelTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("doorDashboard.panelSubtitle")}</p>
        </div>
        <Button onClick={load} size="sm" variant="ghost" disabled={loading} className="h-8 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {conflicts.length > 0 ? (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 border">
            {conflicts.length} {t("doorDashboard.panelSubtitle").toLowerCase()}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">
            {t("doorDashboard.noConflicts")}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">{summary}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />)}
        </div>
      ) : conflicts.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">{t("doorDashboard.noConflicts")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conflicts.map(c => (
            <div key={c.id} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
                <span className="text-xs font-medium text-amber-400">{t("doorDashboard.conflictDesc")}</span>
              </div>
              {c.event_title && <p className="text-xs text-muted-foreground">{c.event_title}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">{t("doorDashboard.firstScan").replace("{time}", c.conflicting_scan_at ? moment(c.conflicting_scan_at).format("D MMM, HH:mm") : "—")}</p>
                  {c.conflicting_scanned_by && <p className="text-muted-foreground/70">{t("doorDashboard.byStaff").replace("{name}", c.conflicting_scanned_by)}</p>}
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">{t("doorDashboard.secondScan").replace("{time}", c.scanned_at ? moment(c.scanned_at).format("D MMM, HH:mm") : "—")}</p>
                  <p className="text-muted-foreground/70">{t("doorDashboard.byStaff").replace("{name}", c.staff_user_name || "—")}</p>
                  <p className="text-muted-foreground/50">{t("doorDashboard.onDevice").replace("{id}", c.device_id?.slice(0, 8) || "—")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}