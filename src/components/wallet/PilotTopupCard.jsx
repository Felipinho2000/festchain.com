import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck } from "lucide-react";

const AMOUNTS = [100, 250, 500];

export default function PilotTopupCard({ onSuccess }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selected, setSelected] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleTopup = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("pilotTopup", { amount: selected });
      const data = res.data || res;
      if (data.status === "success") {
        toast({ title: t("ftc.successTitle"), description: `+${data.added} FTC · ${t("ftc.successDesc")}` });
        onSuccess && onSuccess(data);
      } else {
        toast({ title: "Error", description: data.message || data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{t("ftc.topupTitle")}</p>
          <p className="text-xs text-[#666]">{t("ftc.topupSubtitle")}</p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <p className="text-xs text-[#aaa] leading-relaxed">{t("ftc.disclaimer")}</p>
      </div>

      <div className="flex gap-2">
        {AMOUNTS.map(a => (
          <button
            key={a}
            onClick={() => setSelected(a)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              selected === a
                ? "bg-primary text-white border-primary"
                : "bg-[#111] text-[#888] border-[#2a2a2a] hover:border-primary/40 hover:text-white"
            }`}
          >
            {a} FTC
          </button>
        ))}
      </div>

      <Button
        onClick={handleTopup}
        disabled={loading}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t("ftc.adding")}
          </span>
        ) : (
          <>{t("ftc.addBtn")} · {selected} FTC</>
        )}
      </Button>
      <p className="text-[10px] text-[#555] text-center">{t("ftc.dailyLimit")}</p>
    </div>
  );
}