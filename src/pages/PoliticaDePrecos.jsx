import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Logo from "@/components/shared/Logo";
import {
  ArrowLeft, Percent, Users, RefreshCw, CalendarClock, Calculator,
  ShieldCheck, X,
} from "lucide-react";

const CONTENT = {
  "pt-BR": {
    back: "Voltar",
    title: "Política de Preços",
    subtitle: "Tudo que você paga — e nada que não paga.",
    s01Title: "01 · Quanto você paga",
    s01Body: "Uma única taxa sobre cada ingresso vendido. Sem mensalidade, sem taxa de configuração, sem custo para criar ou publicar um evento. A taxa incide apenas sobre ingressos pagos e ativos. Ingressos reembolsados nunca geram taxa.",
    feeTableTitle: "Tabela de taxas",
    pilot: "Organizador piloto",
    pilotRate: "5%",
    pilotDesc: "Fixa por 12 meses a partir do primeiro evento",
    standard: "Padrão",
    standardRate: "8%",
    standardDesc: "Todo evento fora do período piloto",
    s02Title: "02 · Quem paga a taxa",
    s02Body: "Por padrão, a taxa é deduzida da sua receita — o cliente paga apenas o valor do ingresso. Opcionalmente, você pode repassar a taxa ao comprador, mostrada com clareza no checkout. O processamento de pagamento é feito por um provedor licenciado (Stripe); a FestChain absorve esse custo — os 8% é a única coisa deduzida do seu repasse. A FestChain nunca armazena dados de cartão.",
    s03Title: "03 · Reembolsos",
    s03Body: "Reembolso integral ao comprador; a taxa da FestChain sobre essa venda é revertida — você nunca paga taxa sobre uma venda desfeita. Se o organizador cancelar o evento inteiro, a equipe FestChain processa o reembolso de cada ingresso individualmente.",
    s04Title: "04 · Quando você recebe",
    step1: "Ingresso vendido",
    step1Desc: "A venda é registrada e o valor fica acumulado no seu extrato.",
    step2: "Evento acontece",
    step2Desc: "O evento acontece e a janela de acerto começa.",
    step3: "Janela de acerto",
    step3Desc: "Os valores são consolidados — reembolsos são deduzidos, taxas calculadas.",
    step4: "Repasse enviado",
    step4Desc: "Durante o piloto, o repasse é feito via Pix pela nossa equipe após o acerto, líquido da taxa.",
    s05Title: "05 · Exemplo prático",
    exampleGross: "Receita bruta",
    exampleFee: "Taxa FestChain (8%)",
    exampleNet: "Você recebe (líquido)",
    closing: "Tudo isso — cálculo da taxa, reembolsos, repasses — é auditável e nunca definido por um número enviado pelo comprador ou organizador. É sempre calculado pelo servidor a partir do valor efetivamente pago.",
    cta: "Criar seu evento",
    noSetup: "Sem taxa de configuração",
    noMonthly: "Sem mensalidade",
    noPublish: "Sem custo para publicar",
  },
  en: {
    back: "Back",
    title: "Pricing Policy",
    subtitle: "Everything you pay — and nothing you don't.",
    s01Title: "01 · How much you pay",
    s01Body: "A single fee on each ticket sold. No monthly fee, no setup fee, no cost to create or publish an event. Fee applies only to active, paid tickets. Refunded tickets never generate a fee.",
    feeTableTitle: "Fee table",
    pilot: "Pilot organizer",
    pilotRate: "5%",
    pilotDesc: "Fixed for 12 months from first event",
    standard: "Standard",
    standardRate: "8%",
    standardDesc: "Any event outside the pilot period",
    s02Title: "02 · Who pays the fee",
    s02Body: "By default, the fee is deducted from your proceeds — the buyer pays only the ticket price. Optionally, you can pass the fee to the buyer, shown clearly at checkout. Payment processing is handled by a licensed provider (Stripe); FestChain absorbs that cost — the 8% is the only thing deducted from your payout. FestChain never stores card data.",
    s03Title: "03 · Refunds",
    s03Body: "Full refund to the buyer; FestChain's fee on that sale is reversed — you never pay a fee on a sale that was undone. If the organizer cancels the whole event, our team processes the refund for each ticket individually.",
    s04Title: "04 · When you get paid",
    step1: "Ticket sold",
    step1Desc: "The sale is recorded and the amount accrues in your statement.",
    step2: "Event happens",
    step2Desc: "The event takes place and the settlement window opens.",
    step3: "Settlement window",
    step3Desc: "Amounts are consolidated — refunds deducted, fees calculated.",
    step4: "Payout sent",
    step4Desc: "During the pilot, our team sends the payout via Pix after settlement, net of fee.",
    s05Title: "05 · Worked example",
    exampleGross: "Gross revenue",
    exampleFee: "FestChain fee (8%)",
    exampleNet: "You receive (net)",
    closing: "All of this — fee calculation, refunds, payouts — is auditable and never set by a number sent from a buyer or organizer. It is always computed by the server from the amount actually paid.",
    cta: "Create your event",
    noSetup: "No setup fee",
    noMonthly: "No monthly fee",
    noPublish: "No cost to publish",
  },
};

function StepCard({ num, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
        {num}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function PoliticaDePrecos() {
  const { lang } = useLanguage();
  const c = CONTENT[lang] || CONTENT["pt-BR"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> {c.back}
          </Link>
          <Logo size={34} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="font-heading font-extrabold text-4xl text-foreground">{c.title}</h1>
          <p className="text-muted-foreground text-lg">{c.subtitle}</p>
          <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
            {[
              { icon: X, label: c.noSetup },
              { icon: X, label: c.noMonthly },
              { icon: X, label: c.noPublish },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <item.icon className="w-3.5 h-3.5 text-destructive" strokeWidth={2.5} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* 01 — How much */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading font-bold text-xl text-foreground">{c.s01Title}</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{c.s01Body}</p>

          {/* Fee table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card border border-primary/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Pilot</span>
                <p className="font-heading font-semibold text-foreground text-sm">{c.pilot}</p>
              </div>
              <p className="font-heading font-extrabold text-3xl text-primary mt-2">{c.pilotRate}</p>
              <p className="text-muted-foreground text-xs mt-1">{c.pilotDesc}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="font-heading font-semibold text-foreground text-sm">{c.standard}</p>
              <p className="font-heading font-extrabold text-3xl text-foreground mt-2">{c.standardRate}</p>
              <p className="text-muted-foreground text-xs mt-1">{c.standardDesc}</p>
            </div>
          </div>
        </section>

        {/* 02 — Who pays */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading font-bold text-xl text-foreground">{c.s02Title}</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{c.s02Body}</p>
        </section>

        {/* 03 — Refunds */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading font-bold text-xl text-foreground">{c.s03Title}</h2>
          </div>
          <div className="bg-success/5 border border-success/20 rounded-2xl p-4">
            <p className="text-muted-foreground text-sm leading-relaxed">{c.s03Body}</p>
          </div>
        </section>

        {/* 04 — When you get paid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading font-bold text-xl text-foreground">{c.s04Title}</h2>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <StepCard num="1" title={c.step1} desc={c.step1Desc} />
            <StepCard num="2" title={c.step2} desc={c.step2Desc} />
            <StepCard num="3" title={c.step3} desc={c.step3Desc} />
            <StepCard num="4" title={c.step4} desc={c.step4Desc} />
          </div>
        </section>

        {/* 05 — Worked example */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading font-bold text-xl text-foreground">{c.s05Title}</h2>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-muted-foreground text-sm">{c.exampleGross}</span>
              <span className="font-heading font-bold text-lg text-foreground">R$ 6.000,00</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-muted-foreground text-sm">{c.exampleFee}</span>
              <span className="font-heading font-bold text-lg text-destructive">– R$ 480,00</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 bg-success/5">
              <span className="text-foreground text-sm font-semibold">{c.exampleNet}</span>
              <span className="font-heading font-extrabold text-2xl text-success">R$ 5.520,00</span>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-muted-foreground text-sm leading-relaxed">{c.closing}</p>
        </section>

        {/* CTA */}
        <div className="text-center pb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-glow transition-colors"
          >
            {c.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}