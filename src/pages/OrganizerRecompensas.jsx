import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Gift, Sparkles, Settings, Loader2 } from "lucide-react";
import RewardItemForm from "@/components/recompensas/RewardItemForm";
import RewardItemList from "@/components/recompensas/RewardItemList";
import RedemptionReport from "@/components/recompensas/RedemptionReport";
import { ftcToBrlString, DEFAULT_FTC_TO_BRL_RATE, DEFAULT_EARN_RATE_PERCENT } from "@/lib/rewardConfig";

const STARTER_ITEMS = [
  { name: "Chopp 300ml", description: "Chopp gelado 300ml no bar", ftc_cost: 50, brl_value_cents: 500, category: "bebida", stock_total: null, per_user_limit: 5 },
  { name: "Entrada antecipada", description: "Pule a fila na entrada", ftc_cost: 100, brl_value_cents: 1000, category: "upgrade", stock_total: null, per_user_limit: 1 },
  { name: "Guarda-volumes grátis", description: "Guarde seus itens sem custo", ftc_cost: 30, brl_value_cents: 300, category: "brinde", stock_total: null, per_user_limit: 1 },
];

export default function OrganizerRecompensas() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState({ ftc_to_brl_rate: DEFAULT_FTC_TO_BRL_RATE, ftc_earn_rate_percent: DEFAULT_EARN_RATE_PERCENT });
  const [configForm, setConfigForm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === "admin";

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    const [evts, allItems, configs] = await Promise.all([
      base44.entities.Event.filter({ created_by_id: currentUser.id }, "-created_date", 50).catch(() => []),
      base44.entities.RewardItem.filter({ created_by_id: currentUser.id }, "-created_date", 200).catch(() => []),
      base44.entities.FestChainConfig.filter({ label: "global" }, "-created_date", 1).catch(() => []),
    ]);
    setEvents(evts);
    setItems(allItems);
    if (configs.length > 0) {
      setConfig({ ftc_to_brl_rate: configs[0].ftc_to_brl_rate || DEFAULT_FTC_TO_BRL_RATE, ftc_earn_rate_percent: configs[0].ftc_earn_rate_percent ?? DEFAULT_EARN_RATE_PERCENT, _id: configs[0].id });
      setConfigForm({ ftc_to_brl_rate: configs[0].ftc_to_brl_rate || DEFAULT_FTC_TO_BRL_RATE, ftc_earn_rate_percent: configs[0].ftc_earn_rate_percent ?? DEFAULT_EARN_RATE_PERCENT });
    } else {
      setConfigForm({ ftc_to_brl_rate: DEFAULT_FTC_TO_BRL_RATE, ftc_earn_rate_percent: DEFAULT_EARN_RATE_PERCENT });
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  const saveItem = async (payload) => {
    try {
      if (editing) {
        await base44.entities.RewardItem.update(editing.id, payload);
        toast({ title: t("recompensas.save") + " ✓" });
      } else {
        await base44.entities.RewardItem.create({ ...payload, organizer_id: currentUser.id });
        toast({ title: t("recompensas.save") + " ✓" });
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  const deleteItem = async (item) => {
    if (!confirm(t("recompensas.deleteConfirm"))) return;
    await base44.entities.RewardItem.delete(item.id);
    load();
  };

  const toggleItem = async (item) => {
    await base44.entities.RewardItem.update(item.id, { active: !item.active });
    load();
  };

  const useStarter = async () => {
    try {
      const toCreate = STARTER_ITEMS.map((s) => ({
        ...s,
        organizer_id: currentUser.id,
        stock_remaining: s.stock_total,
        active: true,
        redeem_window: "qualquer_momento",
      }));
      await base44.entities.RewardItem.bulkCreate(toCreate);
      toast({ title: t("recompensas.starterApplied") + " ✓" });
      load();
    } catch (err) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  const saveConfig = async () => {
    try {
      if (config._id) {
        await base44.entities.FestChainConfig.update(config._id, configForm);
      } else {
        const created = await base44.entities.FestChainConfig.create({ ...configForm, label: "global" });
        setConfig((c) => ({ ...c, _id: created.id }));
      }
      setConfig((c) => ({ ...c, ...configForm }));
      toast({ title: t("recompensas.configSaved") + " ✓" });
    } catch (err) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> {t("recompensas.backToDashboard")}
        </Link>
        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">{t("recompensas.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("recompensas.subtitle")}</p>
      </div>

      {/* Config */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-heading font-semibold text-foreground text-sm">{t("recompensas.configTitle")}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("recompensas.ftcRate")}</label>
            <input
              type="number" step="0.1" min="0.1" disabled={!isAdmin}
              value={configForm?.ftc_to_brl_rate ?? ""}
              onChange={(e) => setConfigForm((f) => ({ ...f, ftc_to_brl_rate: parseFloat(e.target.value) || 1 }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{t("recompensas.ftcRateHint")}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("recompensas.earnRate")}</label>
            <input
              type="number" step="0.1" min="0" disabled={!isAdmin}
              value={configForm?.ftc_earn_rate_percent ?? ""}
              onChange={(e) => setConfigForm((f) => ({ ...f, ftc_earn_rate_percent: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{t("recompensas.earnRateHint")}</p>
          </div>
        </div>
        {isAdmin ? (
          <button onClick={saveConfig} className="text-xs font-semibold text-primary hover:underline">{t("recompensas.saveConfig")}</button>
        ) : (
          <p className="text-[10px] text-muted-foreground">{t("recompensas.adminOnly")}</p>
        )}
        <div className="bg-primary/5 border border-primary/15 rounded-lg p-2.5 text-xs text-muted-foreground">
          <span className="text-primary font-semibold">{t("recompensas.ftcRate")}: </span>
          {config.ftc_to_brl_rate} FTC = R$ 1,00 → 50 FTC = {ftcToBrlString(50, config.ftc_to_brl_rate)}
        </div>
      </div>

      {/* Starter items */}
      {items.length === 0 && !showForm && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-heading font-semibold text-foreground text-sm">{t("recompensas.starterTitle")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t("recompensas.starterHint")}</p>
          <div className="space-y-1.5 mb-3">
            {STARTER_ITEMS.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{s.name}</span>
                <span className="text-muted-foreground text-xs">{s.ftc_cost} FTC ({ftcToBrlString(s.ftc_cost, config.ftc_to_brl_rate)})</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={useStarter} className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2 rounded-lg">{t("recompensas.useStarter")}</button>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-secondary">{t("recompensas.addReward")}</button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <RewardItemForm
          events={events} initial={editing} onSave={saveItem}
          onCancel={() => { setShowForm(false); setEditing(null); }} t={t}
        />
      )}

      {/* List */}
      {!showForm && items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-foreground text-sm">{t("recompensas.title")} ({items.length})</h3>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-2 rounded-lg">
              <Gift className="w-3.5 h-3.5" /> {t("recompensas.addReward")}
            </button>
          </div>
          <RewardItemList items={items} config={config} onEdit={(item) => { setEditing(item); setShowForm(true); }} onDelete={deleteItem} onToggle={toggleItem} t={t} />
        </div>
      )}

      {/* Redemption report */}
      {!showForm && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-foreground text-sm">{t("recompensas.reportTitle")}</h3>
          <RedemptionReport rewardItemIds={items.map((i) => i.id)} t={t} />
        </div>
      )}
    </div>
  );
}