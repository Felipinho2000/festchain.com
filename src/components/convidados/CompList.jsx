import React from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Download, Trash2, CheckCircle2, Clock, Ban } from "lucide-react";

const catColors = {
  cortesia: "bg-primary/20 text-primary",
  lista: "bg-blue-900/30 text-blue-400",
  staff: "bg-emerald-900/30 text-emerald-400",
  artista: "bg-purple-900/30 text-purple-400",
  imprensa: "bg-amber-900/30 text-amber-400",
  parceria: "bg-pink-900/30 text-pink-400",
};

export default function CompList({ comps, onRevoke }) {
  const { t } = useLanguage();

  const catLabel = (c) => t(`convidados.category_${c}`) || c;

  const exportCsv = () => {
    const headers = ["Category", "Name", "Email", "Phone", "Code", "Status", "Checked In"];
    const rows = comps.map((c) => [
      c.comp_category || "",
      c.buyer_name || "",
      c.buyer_email || "",
      c.buyer_phone || "",
      c.qr_code || "",
      c.status || "",
      c.checked_in ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guest-list.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const revoke = async (ticketId) => {
    if (!confirm(t("convidados.revokeConfirm"))) return;
    try {
      await base44.functions.invoke("revokeComplimentaryTicket", { ticket_id: ticketId });
      onRevoke();
    } catch (e) {
      console.error(e);
    }
  };

  const statusInfo = (comp) => {
    if (comp.status === "used" || comp.checked_in)
      return { label: t("convidados.statusUsed"), icon: CheckCircle2, color: "text-success" };
    if (comp.status === "expired")
      return { label: t("convidados.statusExpired"), icon: Ban, color: "text-muted-foreground" };
    return { label: t("convidados.statusActive"), icon: Clock, color: "text-primary" };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">{t("convidados.listTitle")}</h3>
        {comps.length > 0 && (
          <Button size="sm" variant="outline" onClick={exportCsv} className="h-8 text-xs">
            <Download className="w-3.5 h-3.5" /> {t("convidados.exportCsv")}
          </Button>
        )}
      </div>

      {comps.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("convidados.noComps")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comps.map((comp) => {
            const s = statusInfo(comp);
            return (
              <div key={comp.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    catColors[comp.comp_category] || "bg-secondary text-muted-foreground"
                  }`}
                >
                  {catLabel(comp.comp_category)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">
                    {comp.buyer_name || t("convidados.unassigned")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {comp.buyer_email || comp.buyer_phone || comp.qr_code?.slice(-12)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-xs ${s.color}`}>
                  <s.icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </div>
                {comp.status === "active" && !comp.checked_in && (
                  <button
                    onClick={() => revoke(comp.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}