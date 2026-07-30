import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CheckCircle2, Clock, AlertCircle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Compact status strip showing the current manifest state.
export default function ManifestStatus({ status, ticketCount, isOnline, onRefresh }) {
  const { t } = useLanguage();

  const states = {
    loaded: {
      icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15",
      text: t("door.manifestLoaded").replace("{count}", ticketCount),
    },
    loading: {
      icon: Loader2, color: "text-primary", bg: "bg-primary/10",
      text: t("door.manifestLoading"), spin: true,
    },
    error: {
      icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10",
      text: t("door.manifestLoadError"),
    },
    expired: {
      icon: Clock, color: "text-amber-400", bg: "bg-amber-500/15",
      text: t("door.manifestExpired"),
    },
    no_manifest: {
      icon: WifiOff, color: "text-muted-foreground", bg: "bg-secondary",
      text: t("door.noManifest"),
    },
  };

  const s = states[status];
  if (!s) return null;

  return (
    <div className={`flex items-center gap-2.5 rounded-xl p-3 ${s.bg}`}>
      <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0 ${s.spin ? "animate-spin" : ""}`} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${s.color}`}>{s.text}</p>
        {(status === "expired" || status === "no_manifest") && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {status === "expired" ? t("door.manifestExpiredDesc") : t("door.noManifestDesc")}
          </p>
        )}
      </div>
      {isOnline && (status === "loaded" || status === "error" || status === "expired") && (
        <Button onClick={onRefresh} size="sm" variant="ghost" className="h-8 px-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
        </Button>
      )}
    </div>
  );
}