import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Package } from "lucide-react";
import moment from "moment";

const statusConfig = {
  pending: { label: "status_pending", color: "bg-warning/15 text-warning" },
  confirmed: { label: "status_confirmed", color: "bg-blue-900/30 text-blue-400" },
  delivered: { label: "status_delivered", color: "bg-success/15 text-success" },
  cancelled: { label: "status_cancelled", color: "bg-destructive/15 text-destructive" },
};

export default function RedemptionReport({ rewardItemIds, t }) {
  const { currentUser } = useAuth();
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!rewardItemIds || rewardItemIds.length === 0 || !currentUser?.id) {
        setRedemptions([]);
        setLoading(false);
        return;
      }
      const all = await base44.entities.RewardRedemption.filter(
        { organizer_id: currentUser.id }, "-created_date", 200
      ).catch(() => []);
      setRedemptions(all.filter((r) => rewardItemIds.includes(r.reward_item_id)));
      setLoading(false);
    }
    load();
  }, [rewardItemIds, currentUser]);

  if (loading) return <div className="bg-card border border-border rounded-xl h-20 shimmer" />;
  if (redemptions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-muted-foreground text-sm">{t("recompensas.reportEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {redemptions.map((r) => {
        const cfg = statusConfig[r.status] || statusConfig.pending;
        return (
          <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{r.reward_item_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.user_name || "—"} · {moment(r.created_date).format("D MMM, HH:mm")}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">{r.redemption_code}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-primary text-sm">{r.ftc_spent} FTC</p>
              <Badge className={`text-[10px] px-1.5 py-0 border-0 ${cfg.color}`}>{t("recompensas." + cfg.label)}</Badge>
            </div>
            {r.status === "delivered" && (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.5} />
            )}
            {r.status === "confirmed" && (
              <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" strokeWidth={1.5} />
            )}
          </div>
        );
      })}
    </div>
  );
}