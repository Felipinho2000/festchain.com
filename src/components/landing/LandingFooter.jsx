import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { COPY, getWaHref } from "./landingData";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LandingFooter() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY["pt-BR"];
  const waHref = getWaHref(lang);

  return (
    <footer className="py-12 px-5 border-t border-white/[0.06] bg-black">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2.5">
          <Link to="/"><Logo size={24} /></Link>
          <p className="text-white/30 text-xs text-center sm:text-left max-w-xs">{c.footer.tagline}</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-white/40">
          <Link to="/legal" className="hover:text-white transition-colors">Confiança &amp; Segurança</Link>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
          <a href="#contact" className="hover:text-white transition-colors">{c.contact.kicker}</a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between gap-2 text-white/25 text-xs">
        <span>© {new Date().getFullYear()} FestChain</span>
        <span>{c.footer.rights}</span>
      </div>
    </footer>
  );
}