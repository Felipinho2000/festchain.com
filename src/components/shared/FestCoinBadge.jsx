import React from "react";
import { Zap } from "lucide-react";

export default function FestCoinBadge({ amount, size = "md" }) {
  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2"
  };
  const iconSizes = { sm: "w-3 h-3", md: "w-3.5 h-3.5", lg: "w-4 h-4" };

  return (
    <span className={`inline-flex items-center ${sizes[size]} rounded-full bg-amber/10 text-amber font-semibold font-heading`}>
      <Zap className={iconSizes[size]} strokeWidth={1.5} />
      {typeof amount === "number" ? amount.toLocaleString() : amount}
    </span>
  );
}