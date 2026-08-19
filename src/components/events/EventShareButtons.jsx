import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle, Send, Instagram, Copy, Check, Share2, AlertTriangle } from "lucide-react";
import moment from "moment";

function XIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function EventShareButtons({ eventName, eventUrl, visibility, eventDate }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const isPrivate = visibility === "private";
  const dateStr = eventDate ? moment(eventDate).format("D MMM, YYYY") : "";

  const shareText = `Bora comigo pro ${eventName}${dateStr ? ` dia ${dateStr}` : ""} 🎟️\nIngresso digital seguro, entrada por QR e recompensas FestChain.\n${eventUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(eventUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl).then(() => {
      setCopied(true);
      toast({ title: "Link do evento copiado!" });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: eventName, text: shareText, url: eventUrl }); } catch (_) {}
    }
  };

  const handleInstagram = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: eventName, text: shareText, url: eventUrl }); return; } catch (_) {}
    }
    navigator.clipboard.writeText(eventUrl).then(() => {
      toast({ title: "Link copiado para o Instagram!" });
    }).catch(() => {});
  };

  const buttons = [
    { label: "WhatsApp", icon: MessageCircle, onClick: () => window.open(`https://wa.me/?text=${encodedText}`, "_blank") },
    { label: "X", icon: XIcon, onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank") },
    { label: "Telegram", icon: Send, onClick: () => window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, "_blank") },
    { label: "Instagram", icon: Instagram, onClick: handleInstagram },
    { label: copied ? "Copiado!" : "Copiar link", icon: copied ? Check : Copy, onClick: handleCopy },
  ];

  if (typeof navigator !== "undefined" && navigator.share) {
    buttons.push({ label: "Compartilhar", icon: Share2, onClick: handleNativeShare });
  }

  return (
    <div className="space-y-3">
      {isPrivate && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Este evento é privado. Só quem tem o link ou foi convidado consegue acessar.</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {buttons.map((btn, i) => (
          <button key={i} onClick={btn.onClick}
            className="flex items-center gap-2 justify-center bg-card border border-border rounded-xl py-2.5 px-3 text-xs font-medium text-[#888] hover:text-primary hover:border-primary/40 transition-colors">
            <btn.icon className="w-4 h-4" />
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}