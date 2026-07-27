import React from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Info, Gift, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BuyFTC() {
  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 space-y-6 py-8">
      <Link to="/wallet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar para carteira
      </Link>

      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <Info className="w-3.5 h-3.5" strokeWidth={2} /> Créditos do piloto
        </div>
        <h1 className="font-heading font-bold text-3xl text-foreground mb-3">Recompensas, não compras</h1>
        <p className="text-muted-foreground leading-relaxed">
          No piloto, as recompensas FestChain são <span className="text-foreground font-semibold">créditos de fidelidade no app</span>. Sem venda de token nem compra durante o piloto.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 text-sm shadow-soft">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-foreground font-semibold mb-0.5">Sem valor em dinheiro</p>
            <p className="text-muted-foreground text-sm">Os créditos não são dinheiro, não são investimento, não são criptomoeda e não têm valor futuro garantido. Não podem ser sacados, vendidos ou negociados.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-foreground font-semibold mb-0.5">Como você ganha</p>
            <p className="text-muted-foreground text-sm">Ganha recompensa ao comprar ingresso pra rolê. Organizadores e admins também podem dar créditos no piloto.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-foreground font-semibold mb-0.5">Onde você usa</p>
            <p className="text-muted-foreground text-sm">A compra de créditos tá desativada no piloto. O uso dentro dos rolês chega em breve.</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">Piloto privado.</span> As recompensas FestChain são créditos de fidelidade dentro do app. Veja o <Link to="/legal" className="text-primary hover:underline">aviso do piloto</Link>.
      </div>

      <Link to="/events">
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-glow">Ver eventos</Button>
      </Link>
    </div>
  );
}