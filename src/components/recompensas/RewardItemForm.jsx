import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Gift, Save, X } from "lucide-react";

const CATEGORIES = ["bebida", "comida", "upgrade", "brinde", "experiencia"];
const WINDOWS = ["qualquer_momento", "durante_evento"];

export default function RewardItemForm({ events, initial, onSave, onCancel, t }) {
  const [form, setForm] = useState(() => ({
    name: "", description: "", image_url: "", ftc_cost: 50, brl_value_cents: 500,
    category: "bebida", stock_total: "", per_user_limit: 1, redeem_window: "qualquer_momento",
    active: true, event_id: "", ...initial,
  }));

  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }));
  }, [initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const brlDisplay = ((form.brl_value_cents || 0) / 100).toFixed(2).replace(".", ",");

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      ftc_cost: parseInt(form.ftc_cost, 10) || 0,
      brl_value_cents: parseInt(form.brl_value_cents, 10) || 0,
      stock_total: form.stock_total === "" ? null : parseInt(form.stock_total, 10),
      stock_remaining: initial?.stock_remaining != null
        ? form.stock_remaining
        : (form.stock_total === "" ? null : parseInt(form.stock_total, 10)),
      per_user_limit: parseInt(form.per_user_limit, 10) || 1,
      event_id: form.event_id || null,
    };
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-heading font-semibold text-foreground text-sm">
          {initial ? t("recompensas.editReward") : t("recompensas.addReward")}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldName")}</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required
            className="bg-background h-9" placeholder="Chopp 300ml" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldDescription")}</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            className="bg-background text-sm" rows={2} placeholder="Descrição opcional" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldCategory")}</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{t("recompensas.category_" + c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldEvent")}</Label>
          <Select value={form.event_id || "all"} onValueChange={(v) => set("event_id", v === "all" ? "" : v)}>
            <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("recompensas.allEvents")}</SelectItem>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldFtcCost")}</Label>
          <Input type="number" min="1" value={form.ftc_cost} onChange={(e) => set("ftc_cost", e.target.value)}
            required className="bg-background h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldBrlValue")}</Label>
          <Input type="text" inputMode="decimal" value={brlDisplay}
            onChange={(e) => {
              const cents = Math.round(parseFloat(e.target.value.replace(",", ".")) * 100) || 0;
              set("brl_value_cents", cents);
            }}
            className="bg-background h-9" placeholder="5,00" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("recompensas.fieldStock")} <span className="text-muted-foreground/60">({t("recompensas.fieldStockHint")})</span>
          </Label>
          <Input type="number" min="0" value={form.stock_total ?? ""} onChange={(e) => set("stock_total", e.target.value)}
            className="bg-background h-9" placeholder="∞" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldPerUserLimit")}</Label>
          <Input type="number" min="1" value={form.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)}
            className="bg-background h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldRedeemWindow")}</Label>
          <Select value={form.redeem_window} onValueChange={(v) => set("redeem_window", v)}>
            <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w} value={w}>{t("recompensas.window_" + w)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2">
          <Label className="text-xs text-muted-foreground">{t("recompensas.fieldActive")}</Label>
          <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold h-9">
          <Save className="w-4 h-4 mr-1.5" /> {t("recompensas.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-muted-foreground text-sm h-9">
          <X className="w-4 h-4 mr-1.5" /> {t("recompensas.cancel")}
        </Button>
      </div>
    </form>
  );
}