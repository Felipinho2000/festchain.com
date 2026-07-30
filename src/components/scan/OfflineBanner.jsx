import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { WifiOff, AlertTriangle } from "lucide-react";

// Persistent amber banner shown whenever the scanner is in offline mode.
// Not a toast — stays visible until connectivity returns.
export default function OfflineBanner({ ticketCount, lastSyncAgo }) {
  const { t } = useLanguage();

  const countText = t("door.offlineBannerCount").replace("{count}", ticketCount);
  const syncText = t("door.offlineBannerSync").replace("{time}", lastSyncAgo || "—");

  return (
    <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <WifiOff className="w-4 h-4 text-amber-400" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-400 font-bold text-xs uppercase tracking-wider">
            {t("door.offlineMode")} · {countText}
          </p>
          <p className="text-amber-400/70 text-xs">{syncText}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 bg-amber-500/5 rounded-lg p-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-amber-400/80 text-xs leading-relaxed">{t("door.multiDeviceWarning")}</p>
      </div>
    </div>
  );
}