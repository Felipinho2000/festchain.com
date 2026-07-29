import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import { COPY, getWaHref } from "./landingData";
import { useAuth } from "@/lib/AuthContext";

export default function LandingNav() {
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const c = COPY["pt-BR"];
  const [menuOpen, setMenuOpen] = useState(false);
  const waHref = getWaHref();

  const links = [
    { href: "#promoters", label: c.nav.organizers },
    { href: "#how", label: c.nav.how },
    { href: "#crowd", label: c.nav.crowd },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center">
          <Logo size={40} />
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm text-white/50">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="relative hover:text-white transition-colors duration-200 group">
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {authed ? (
            <Link to="/app" className="hidden sm:block">
              <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold shadow-[0_4px_16px_-4px_rgba(255,101,0,0.4)] transition-all duration-300 hover:shadow-[0_4px_24px_-4px_rgba(255,101,0,0.6)]">
                {c.nav.openApp} <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </Link>
          ) : (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold shadow-[0_4px_16px_-4px_rgba(255,101,0,0.4)] transition-all duration-300 hover:shadow-[0_4px_24px_-4px_rgba(255,101,0,0.6)]">
                {c.nav.cta}
              </Button>
            </a>
          )}
          <button className="md:hidden p-2 text-white/50 hover:text-white transition-colors" onClick={() => setMenuOpen((m) => !m)} aria-label="Menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-5 py-4 flex flex-col gap-4 text-sm text-white/50 bg-black/80 backdrop-blur-xl">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
          <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="text-primary font-semibold">
            {c.nav.cta}
          </a>
        </div>
      )}
    </nav>
  );
}