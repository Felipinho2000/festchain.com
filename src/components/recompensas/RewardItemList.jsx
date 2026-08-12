import React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Gift } from "lucide-react";
import { ftcToBrlString } from "@/lib/rewardConfig";

export default function RewardItemList({ items, config, onEdit, onDelete, onToggle, t }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <Gift className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-foreground text-sm font-medium mb-1">{t("recompensas.noItems")}</p>
        <p className="text-muted-foreground text-xs">{t("recompensas.noItemsDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const stock = item.stock_total != null
          ? (t("recompensas.stockLeft").replace("{count}", item.stock_remaining ?? 0))
          : t("recompensas.unlimited");
        const brl = ftcToBrlString(item.ftc_cost, config?.ftc_to_brl_rate);
        return (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Gift className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                {!item.active && (
                  <Badge className="text-[10px] px-1.5 py-0 border-0 bg-secondary text-muted-foreground">off</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.ftc_cost} FTC · {brl} · {t("recompensas.category_" + item.category)} · {stock}
              </p>
            </div>
            <Switch checked={item.active} onCheckedChange={() => onToggle(item)} className="data-[state=checked]:bg-primary" />
            <button onClick={() => onEdit(item)} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors">
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button onClick={() => onDelete(item)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}