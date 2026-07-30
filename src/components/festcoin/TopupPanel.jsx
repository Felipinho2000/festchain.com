import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Zap, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ftcToBrlString } from "@/lib/rewardConfig";

const PRESETS = {
  BRL: [25, 50, 100, 200],
  USD: [5, 10, 20, 50],
  EUR: [5, 10, 20, 50],
};

const symbolFor = (code) => {
  if (code === "BRL") return "R$";
  if (code === "USD") return "$";
  if (code === "EUR") return "€";
  return "";
};

export default function TopupPanel({ selectedEvent, onSuccess }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const rate = selectedEvent?.ftc_conversion_rate || 1;
  const currencyCode = selectedEvent?.currency_code || "BRL";
  const symbol = symbolFor(currencyCode);
  const nativeAmount = parseFloat(amount) || 0;
  const ftcToReceive = rate > 0 ? Math.floor(nativeAmount / rate) : 0;
  const presetList = PRESETS[currencyCode] || PRESETS.BRL;

  const handleTopup = async () => {
    if (!selectedEvent) {
      toast({ title: t("festcoin.selectEventFirst"), variant: "destructive" });
      return;
    }
    if (nativeAmount <= 0) return;
    setLoading(true);
    setSuccess(null);
    try {
      const res = await base44.functions.invoke("ftcTopup", {
        event_id: selectedEvent.id,
        native_amount: nativeAmount,
      });
      const data = res.data || res;
      if (data.status === "success") {
        setSuccess({ ftc: data.ftc_amount, native: data.native_amount });
        setAmount("");
        toast({ title: t("festcoin.topupSuccess") });
        if (onSuccess) onSuccess();
      } else {
        toast({ title: data.message || "Erro ao adicionar saldo", variant: "destructive" });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Erro ao adicionar saldo";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedEvent) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <Zap className="w-8 h-8 text-[#444] mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-[#666] text-sm">{t("festcoin.noEventSelected")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-heading font-semibold text-white text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> {t("festcoin.topupTitle")}
        </h2>
        <p className="text-xs text-[#666] mt-0.5">{t("festcoin.topupSubtitle")}</p>
      </div>

      {/* Conversion rate */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2 text-xs">
        <span className="text-[#888]">{t("festcoin.conversionRate")}</span>
        <span className="text-white font-medium">1 FTC = {symbol}{rate}</span>
      </div>

      {/* Preset amounts */}
      <div>
        <p className="text-xs text-[#888] mb-2">{t("festcoin.presetAmounts")}</p>
        <div className="grid grid-cols-4 gap-2">
          {presetList.map(amt => (
            <button
              key={amt}
              onClick={() => setAmount(amt.toString())}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${amount === amt.toString() ? "bg-primary text-white" : "bg-secondary text-[#888] hover:text-white"}`}
            >
              {symbol}{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <p className="text-xs text-[#888] mb-1">{t("festcoin.customAmount")}</p>
        <div className="flex items-center gap-2">
          <span className="text-[#888] text-sm">{symbol}</span>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-lg" placeholder="0" />
        </div>
      </div>

      {/* FTC to receive */}
      {nativeAmount > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-3">
          <span className="text-sm text-[#bbb]">{t("festcoin.ftcToReceive")}</span>
          <span className="font-heading font-bold text-lg text-primary">{ftcToReceive.toLocaleString()} FTC <span className="text-xs font-normal text-[#888]">({ftcToBrlString(ftcToReceive)} em consumação)</span></span>
        </div>
      )}

      {/* Pilot warning */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-400 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("festcoin.pilotWarning")}</p>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 text-xs text-emerald-400 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{success.ftc} FTC — {t("festcoin.topupSuccess").toLowerCase()}</p>
        </div>
      )}

      {/* Confirm button */}
      <Button
        onClick={handleTopup}
        disabled={loading || nativeAmount <= 0}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("festcoin.confirmTopup")}…</>
          : <><Zap className="w-4 h-4 mr-2" /> {t("festcoin.confirmTopup")}</>}
      </Button>
    </div>
  );
}