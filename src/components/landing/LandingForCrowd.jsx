import React from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "./landingData";
import Reveal from "./Reveal";
import { useAuth } from "@/lib/AuthContext";

export default function LandingForCrowd() {
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const c = COPY["pt-BR"];
  const findEventsTo = authed ? "/events" : "/register";

  return (
    <section id="crowd" className="py-24 sm:py-28 px-5 bg-white/[0.015] border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="mb-12">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.crowd.kicker}</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-[-0.02em]">
            {c.crowd.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {c.crowd.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <div className="group">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-heading font-bold text-white text-base mb-2">{item.t}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{item.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <Link to={findEventsTo}>
            <Button className="bg-primary hover:bg-primary/90 text-white h-11 px-6 rounded-2xl font-semibold text-sm shadow-[0_4px_16px_-4px_rgba(255,101,0,0.4)] hover:shadow-[0_4px_24px_-4px_rgba(255,101,0,0.6)] hover:scale-[1.02] transition-all duration-300">
              <Search className="w-4 h-4 mr-2" /> {c.crowd.cta}
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}