import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft, Search, CheckCircle2, Loader2, XCircle, Package } from "lucide-react";

export default function ValidarRecompensa() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState(null);

  const verify = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.entities.RewardRedemption.filter({ redemption_code: code.trim() });
      if (!res || res.length === 0) {
        setError(t("validarRecompensa.notFound"));
        setVerifying(false);
        return;
      }
      const r = res[0];
      // Verify the caller owns this redemption's organizer
      const orgId = r.organizer_id;
      if (currentUser?.role !== "admin" && String(orgId) !== String(currentUser?.id)) {
        setError(t("validarRecompensa.notFound"));
        setVerifying(false);
        return;
      }
      setResult(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const confirmDelivery = async () => {
    if (!result) return;
    setDelivering(true);
    try {
      const res = await base44.functions.invoke("markRedemptionDelivered", { redemption_code: result.redemption_code });
      const data = res?.data || res;
      if (data?.success) {
        setResult({ ...result, status: "delivered" });
      } else {
        setError(data?.message || data?.error || "Erro");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDelivering(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 lg:pb-8 min-h-screen flex flex-col">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" /> {t("validarRecompensa.backToDashboard")}
      </Link>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-1">{t("validarRecompensa.title")}</h1>
      <p className="text-muted-foreground text-sm mb-6">{t("validarRecompensa.subtitle")}</p>

      {/* Input */}
      <div className="space-y-3 mb-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("validarRecompensa.codeLabel")}</label>
        <div className="flex gap-2">
          <input
            type="text" value={code} onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            placeholder="FC-RWD-XXXX-XXXX-XXXX"
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3.5 text-base font-mono text-foreground focus:outline-none focus:border-primary"
            autoCapitalize="characters" autoCorrect="off"
          />
          <button
            onClick={verify} disabled={verifying || !code.trim()}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-5 rounded-xl flex items-center gap-2 transition-colors"
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" strokeWidth={1.75} />}
            <span className="hidden sm:inline">{t("validarRecompensa.verify")}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3 mb-4">
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex-1 flex flex-col">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-foreground text-lg">{result.reward_item_name}</p>
                <p className="text-sm text-muted-foreground">{result.user_name || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("validarRecompensa.cost")}</p>
                <p className="font-bold text-primary">{result.ftc_spent} FTC</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t("validarRecompensa.item")}</p>
                <p className="font-medium text-foreground">{result.reward_item_name}</p>
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t("validarRecompensa.codeLabel")}</p>
              <p className="font-mono font-bold text-foreground text-sm break-all">{result.redemption_code}</p>
            </div>

            {result.status === "delivered" ? (
              <div className="bg-success/10 border border-success/30 rounded-xl py-4 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
                <p className="font-heading font-bold text-success text-base">{t("validarRecompensa.delivered")}</p>
              </div>
            ) : result.status === "confirmed" ? (
              <button
                onClick={confirmDelivery} disabled={delivering}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-glow"
              >
                {delivering ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />}
                {t("validarRecompensa.confirmDelivery")}
              </button>
            ) : (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-center">
                <p className="text-sm text-warning">{t("validarRecompensa.invalidState")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !error && !verifying && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground max-w-xs">{t("validarRecompensa.subtitle")}</p>
        </div>
      )}
    </div>
  );
}