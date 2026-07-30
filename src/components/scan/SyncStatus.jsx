import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shows pending offline-scan queue count and a sync button.
export default function SyncStatus({ pendingCount, syncing, syncResult, syncError, onSync }) {
  const { t } = useLanguage();

  if (pendingCount === 0 && !syncResult && !syncError) return null;

  const pendingText = pendingCount === 1
    ? t("door.pendingSingular").replace("{count}", 1)
    : t("door.pendingScans").replace("{count}", pendingCount);

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            pendingCount > 0 ? "bg-amber-500/15" : "bg-emerald-500/15"
          }`}>
            {pendingCount > 0
              ? <RefreshCw className="w-4 h-4 text-amber-400" strokeWidth={2} />
              : <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />}
          </div>
          <span className={`text-sm font-medium ${pendingCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {pendingText}
          </span>
        </div>
        {pendingCount > 0 && (
          <Button
            onClick={onSync}
            disabled={syncing}
            size="sm"
            className="h-8 bg-amber-500 hover:bg-amber-500/90 text-black font-semibold text-xs"
          >
            {syncing
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t("door.syncing")}</>
              : t("door.syncNow")}
          </Button>
        )}
      </div>
      {syncResult && !syncError && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          {t("door.syncSuccess")
            .replace("{applied}", syncResult.applied || 0)
            .replace("{conflicts}", syncResult.conflicts || 0)
            .replace("{known}", syncResult.already_known || 0)}
        </div>
      )}
      {syncError && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
          {t("door.syncError")}
        </div>
      )}
    </div>
  );
}