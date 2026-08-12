import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Loader2, CheckCircle2 } from "lucide-react";
import { ftcToBrlString, DEFAULT_FTC_TO_BRL_RATE } from "@/lib/rewardConfig";

export default function RewardCatalogue({ balance, t }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState({ ftc_to_brl_rate: DEFAULT_FTC_TO_BRL_RATE });
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [result, setResult] = useState(null);
  const [userTicketEventIds, setUserTicketEventIds] = useState(new Set());
  const [organizerIds, setOrganizerIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) { setLoading(false); return; }

      // Fetch config, user's active+used tickets, and all active reward items in parallel
      const [configs, activeTickets, usedTickets, allItems] = await Promise.all([
        base44.entities.FestChainConfig.filter({ label: "global" }, "-created_date", 1).catch(() => []),
        base44.entities.Ticket.filter({ created_by_id: currentUser.id, status: "active" }, "-created_date", 100).catch(() => []),
        base44.entities.Ticket.filter({ created_by_id: currentUser.id, status: "used" }, "-created_date", 100).catch(() => []),
        base44.entities.RewardItem.filter({ active: true }, "-created_date", 200).catch(() => []),
      ]);

      if (configs.length > 0) setConfig({ ftc_to_brl_rate: configs[0].ftc_to_brl_rate || DEFAULT_FTC_TO_BRL_RATE });

      const allTickets = [...activeTickets, ...usedTickets];
      const eventIds = new Set(allTickets.map((tk) => tk.event_id).filter(Boolean));
      const orgIds = new Set(allTickets.map((tk) => tk.organizer_id).filter(Boolean));
      setUserTicketEventIds(eventIds);
      setOrganizerIds(orgIds);

      // Filter: organizer must match AND (event_id is null OR event_id is in user's ticket events)
      const eligible = allItems.filter((item) => {
        const org = item.organizer_id || item.created_by_id;
        if (!orgIds.has(org)) return false;
        if (item.event_id && !eventIds.has(item.event_id)) return false;
        return true;
      });
      setItems(eligible);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  const redeem = async (item) => {
    setRedeeming(item.id);
    setResult(null);
    try {
      const res = await base44.functions.invoke("redeemReward", {
        reward_item_id: item.id,
        event_id: item.event_id || null,
        idempotency_key: "rwd-" + item.id + "-" + Date.now(),
      });
      const data = res?.data || res;
      if (data?.success) {
        setResult({ ok: true, redemption: data.redemption, item });
      } else {
        setResult({ ok: false, error: data?.error, message: data?.message || "Erro" });
      }
    } catch (err) {
      setResult({ ok: false, error: "network", message: err.message });
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return <div className="bg-card border border-border rounded-2xl h-32 shimmer" />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <Gift className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-foreground text-sm font-medium mb-1">{t("rewardsCatalogue.noRewards")}</p>
        <p className="text-muted-foreground text-xs max-w-xs mx-auto">{t("rewardsCatalogue.noRewardsDesc")}</p>
      </div>
    );
  }

  const rate = config.ftc_to_brl_rate;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-heading font-semibold text-foreground text-sm mb-0.5">{t("rewardsCatalogue.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("rewardsCatalogue.subtitle")}</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
        {t("rewardsCatalogue.disclaimer")}
      </div>

      {result?.ok && (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-5 text-center">
          <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" strokeWidth={1.5} />
          <p className="font-heading font-bold text-foreground text-base mb-2">{t("rewardsCatalogue.redeemed")}</p>
          <p className="text-xs text-muted-foreground mb-3">{t("rewardsCatalogue.showCode")}</p>
          <div className="bg-background border border-border rounded-xl py-3 px-4 inline-block">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("rewardsCatalogue.codeLabel")}</p>
            <p className="font-mono font-bold text-primary text-lg">{result.redemption.redemption_code}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const brl = ftcToBrlString(item.ftc_cost, rate);
          const canAfford = balance >= item.ftc_cost;
          const outOfStock = item.stock_total != null && (item.stock_remaining ?? 0) <= 0;
          const isRedeeming = redeeming === item.id;
          return (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Gift className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-foreground text-sm">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2">
                <div>
                  <p className="font-bold text-primary text-lg">{item.ftc_cost} FTC</p>
                  <p className="text-[11px] text-muted-foreground">{brl}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {outOfStock ? (
                    <Badge className="text-[10px] px-2 py-0.5 border-0 bg-destructive/15 text-destructive">{t("rewardsCatalogue.outOfStock")}</Badge>
                  ) : !canAfford ? (
                    <Badge className="text-[10px] px-2 py-0.5 border-0 bg-secondary text-muted-foreground">{t("rewardsCatalogue.insufficientBalance")}</Badge>
                  ) : (
                    <Button
                      onClick={() => redeem(item)}
                      disabled={isRedeeming}
                      className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold h-8 px-3 rounded-lg"
                    >
                      {isRedeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("rewardsCatalogue.redeem")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {result && !result.ok && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive">
          {result.message}
        </div>
      )}
    </div>
  );
}