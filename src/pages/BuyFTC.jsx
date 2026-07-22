import React from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Info, Gift, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BuyFTC() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/wallet" className="inline-flex items-center gap-2 text-warmgray hover:text-foreground text-sm">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar para carteira
      </Link>

      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" /> Créditos do piloto
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-white mb-3 uppercase">Recompensas, não compras</h1>
        <p className="text-[#888] leading-relaxed">
          Durante o piloto, as recompensas FestChain são <span className="text-white font-semibold">créditos de fidelidade dentro do app</span>. Não há venda de tokens nem compra durante o piloto.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 text-sm">
        <div className="flex gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-semibold mb-0.5">Sem valor em dinheiro</p>
            <p className="text-[#888] text-sm">Os créditos não são dinheiro, não são investimento, não são criptomoeda e não têm valor futuro garantido. Não podem ser sacados, vendidos ou negociados.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Gift className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-semibold mb-0.5">Como você ganha</p>
            <p className="text-[#888] text-sm">Ganhe recompensas ao comprar ingressos para eventos. Organizadores e administradores também podem conceder créditos durante o piloto.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-white font-semibold mb-0.5">Onde você usa</p>
            <p className="text-[#888] text-sm">A compra de créditos está desativada durante o piloto. O uso dentro dos eventos chega em breve.</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-[#bbb]">
        <span className="text-primary font-semibold">Piloto privado.</span> As recompensas FestChain são créditos de fidelidade dentro do app. Veja o <Link to="/legal" className="text-primary hover:underline">aviso do piloto</Link>.
      </div>

      <Link to="/events">
        <Button className="bg-primary hover:bg-primary/90 text-white">Ver eventos</Button>
      </Link>
    </div>
  );
}