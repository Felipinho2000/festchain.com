import React from "react";
import { Link } from "react-router-dom";
import { Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Social() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Users className="w-8 h-8 text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="font-heading font-extrabold text-3xl text-white uppercase mb-3">Em breve</h1>
      <p className="text-[#888] text-sm leading-relaxed mb-8 max-w-xs mx-auto">
        O Social da FestChain está chegando — só quem vai às festas vai entrar.
      </p>
      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
        <Sparkles className="w-3.5 h-3.5" /> Acesso com presença verificada
      </div>
      <div className="mt-8">
        <Link to="/events">
          <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a]">
            Ver eventos
          </Button>
        </Link>
      </div>
    </div>
  );
}