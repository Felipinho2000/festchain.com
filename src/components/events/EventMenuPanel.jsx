import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle } from "lucide-react";

export default function EventMenuPanel({ eventId, userBalance, onRedeemed }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    if (!eventId) return;
    Promise.all([
      base44.asServiceRole.entities.VenueMenuItem.filter({ event_id: eventId, is_available: true }).catch(() => []),
      base44.entities.EventRedemption.filter({ event_id: eventId, created_by_id: currentUser?.id }).catch(() => []),
    ]).then(([menuItems, rdps]) => {
      setItems(menuItems.filter(i => !i.pilot_only || true)); // show pilot items
      setRedemptions(rdps);
    }).finally(() => setLoading(false));
  }, [eventId, currentUser]);

  const handleRedeem = async (item) => {
    setRedeeming(item.id);
    try {
      const res = await base44.functions.invoke("redeemEventItem", { event_id: eventId, menu_item_id: item.id });
      const data = res.data || res;
      if (data.status === "success") {
        toast({
          title: t("menu.successTitle"),
          description: `${t("menu.codeLabel")}: ${data.redemption_code}. ${t("menu.successDesc")}`,
        });
        // Refresh
        const rdps = await base44.entities.EventRedemption.filter({ event_id: eventId, created_by_id: currentUser?.id }).catch(() => []);
        setRedemptions(rdps);
        onRedeemed && onRedeemed(data.balance_after);
      } else {
        toast({ title: "Error", description: data.message || data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return <div className="h-24 bg-secondary rounded-xl animate-pulse" />;
  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <p className="text-[#666] text-sm">{t("menu.noItems")}</p>
      </div>
    );
  }

  const statusColor = { pending: "bg-[#222] text-[#888]", redeemed: "bg-primary/20 text-primary", claimed: "bg-emerald-900/40 text-emerald-400", cancelled: "bg-red-900/30 text-red-400" };
  const statusLabel = { pending: t("menu.statusPending"), redeemed: t("menu.statusRedeemed"), claimed: t("menu.statusClaimed"), cancelled: t("menu.statusCancelled") };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <p className="text-xs text-[#aaa]">{t("menu.disclaimer")}</p>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const myRdp = redemptions.find(r => r.menu_item_id === item.id && r.status !== "cancelled");
          const canAfford = (userBalance ?? Infinity) >= item.price_ftc;
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{item.emoji || "🎟️"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{item.name}</p>
                {item.description && <p className="text-xs text-[#666] truncate">{item.description}</p>}
                <p className="text-xs text-primary font-bold mt-0.5">{item.price_ftc} FTC</p>
              </div>
              <div className="flex-shrink-0">
                {myRdp ? (
                  <div className="text-right">
                    <Badge className={`text-[10px] border-0 ${statusColor[myRdp.status]}`}>{statusLabel[myRdp.status]}</Badge>
                    <p className="text-[10px] font-mono text-primary mt-1">{myRdp.redemption_code}</p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(item)}
                    disabled={redeeming === item.id || !canAfford}
                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg h-8 px-3 disabled:opacity-50"
                    title={!canAfford ? t("menu.insufficientBalance") : ""}
                  >
                    {redeeming === item.id ? t("menu.redeeming") : t("menu.redeemBtn")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {redemptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">{t("menu.redemptionHistory")}</p>
          <div className="space-y-2">
            {redemptions.map(r => (
              <div key={r.id} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{r.item_name}</p>
                  <p className="text-[10px] font-mono text-[#555]">{r.redemption_code}</p>
                </div>
                <Badge className={`text-[10px] border-0 ${statusColor[r.status]}`}>{statusLabel[r.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}