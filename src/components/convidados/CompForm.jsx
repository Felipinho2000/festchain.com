import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Send, QrCode, Loader2, Gift, AlertTriangle } from "lucide-react";

const CATEGORIES = ["cortesia", "lista", "staff", "artista", "imprensa", "parceria"];
const TIERS = ["general", "vip", "backstage"];

export default function CompForm({ event, onIssued }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("codes");
  const [category, setCategory] = useState("cortesia");
  const [note, setNote] = useState("");
  const [tier, setTier] = useState("general");
  const [quantity, setQuantity] = useState(1);
  const [recipients, setRecipients] = useState([{ name: "", contact: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [overCap, setOverCap] = useState(null);

  const submit = async (confirmCap = false) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setOverCap(null);
    try {
      const payload = {
        event_id: event.id,
        ticket_type_id: tier,
        comp_category: category,
        note,
        idempotency_key: `comp-${event.id}-${Date.now()}`,
        confirm_over_cap: confirmCap,
      };
      if (mode === "direct") {
        payload.recipients = recipients
          .map((r) => {
            const isEmail = r.contact.includes("@");
            return isEmail ? { name: r.name, email: r.contact } : { name: r.name, phone: r.contact };
          })
          .filter((r) => r.name || r.email || r.phone);
        if (payload.recipients.length === 0) {
          setError(t("convidados.errorNoRecipients"));
          setLoading(false);
          return;
        }
      } else {
        payload.quantity = quantity;
      }

      const res = await base44.functions.invoke("issueComplimentaryTickets", payload);
      const data = res.data;
      if (data?.error === "cap_exceeded") {
        setOverCap(data);
      } else if (data?.error) {
        setError(data.message || data.error);
      } else {
        setSuccess(mode === "codes" ? t("convidados.codesGenerated") : "OK");
        onIssued();
        setRecipients([{ name: "", contact: "" }]);
        setQuantity(1);
        setNote("");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const catLabel = (c) => t(`convidados.category_${c}`);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          {t("convidados.formTitle")}
        </h3>
        <p className="text-xs text-warning mt-1 font-medium">{t("convidados.zeroFestcoin")}</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        <button
          onClick={() => setMode("direct")}
          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${mode === "direct" ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          <Send className="w-3.5 h-3.5 inline mr-1.5" /> {t("convidados.modeDirect")}
        </button>
        <button
          onClick={() => setMode("codes")}
          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${mode === "codes" ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          <QrCode className="w-3.5 h-3.5 inline mr-1.5" /> {t("convidados.modeCodes")}
        </button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        {mode === "direct" ? t("convidados.modeDirectDesc") : t("convidados.modeCodesDesc")}
      </p>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("convidados.tier")}</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            {TIERS.map((tr) => (
              <option key={tr} value={tr}>{tr}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("convidados.category")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{catLabel(c)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">{t("convidados.note")}</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("convidados.notePlaceholder")}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        />
      </div>

      {/* Mode-specific fields */}
      {mode === "direct" ? (
        <div className="space-y-2">
          {recipients.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.name}
                onChange={(e) => {
                  const next = [...recipients];
                  next[i] = { ...next[i], name: e.target.value };
                  setRecipients(next);
                }}
                placeholder={t("convidados.recipientName")}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <input
                value={r.contact}
                onChange={(e) => {
                  const next = [...recipients];
                  next[i] = { ...next[i], contact: e.target.value };
                  setRecipients(next);
                }}
                placeholder={t("convidados.recipientContact")}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
              {recipients.length > 1 && (
                <button
                  onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setRecipients([...recipients, { name: "", contact: "" }])}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> {t("convidados.addRecipient")}
          </button>
        </div>
      ) : (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("convidados.quantity")}</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}

      {/* Error / Success */}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-success font-medium">{success}</p>}

      {/* Over-cap confirmation */}
      {overCap && (
        <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 space-y-2">
          <p className="text-xs text-warning flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {t("convidados.capWarning").replace(
              "{percent}",
              overCap.total_capacity > 0 ? Math.round(((overCap.existing_comps + overCap.requested) / overCap.total_capacity) * 100) : 0
            )}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOverCap(null)}>
              {t("convidados.cancel")}
            </Button>
            <Button size="sm" onClick={() => submit(true)} disabled={loading}>
              {t("convidados.confirmCap")}
            </Button>
          </div>
        </div>
      )}

      {/* Submit */}
      {!overCap && (
        <Button onClick={() => submit(false)} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
          {loading ? t("convidados.issuing") : t("convidados.issue")}
        </Button>
      )}
    </div>
  );
}