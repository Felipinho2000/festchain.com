import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  ArrowLeft, HelpCircle, Percent, CalendarClock, RefreshCw, ScanLine,
  WifiOff, ArrowLeftRight, Users, Gift, Coins, Package,
} from "lucide-react";
import moment from "moment";

const CONTENT = {
  "pt-BR": {
    title: "Central de Ajuda",
    subtitle: "Tudo que um organizador precisa saber — com seus números reais.",
    back: "Voltar ao painel",
    loading: "Carregando suas informações…",
    questions: [
      {
        key: "fee",
        icon: Percent,
        title: "Qual é a minha taxa?",
      },
      {
        key: "payout",
        icon: CalendarClock,
        title: "Como e quando eu recebo?",
      },
      {
        key: "refund",
        icon: RefreshCw,
        title: "Meus clientes podem pedir reembolso?",
      },
      {
        key: "validate",
        icon: ScanLine,
        title: "Como eu valido os ingressos na entrada?",
      },
      {
        key: "offline",
        icon: WifiOff,
        title: "E se a internet cair na portaria?",
      },
      {
        key: "transfer",
        icon: ArrowLeftRight,
        title: "Posso transferir ingressos?",
      },
      {
        key: "comps",
        icon: Users,
        title: "Posso emitir cortesias?",
      },
      {
        key: "loyalty",
        icon: Gift,
        title: "Como eu recompenso quem sempre vem?",
      },
      {
        key: "ftc",
        icon: Coins,
        title: "O que o cliente faz com o crédito FestCoin?",
      },
      {
        key: "rewards",
        icon: Package,
        title: "Eu escolho quais recompensas existem?",
      },
    ],
  },
  en: {
    title: "Help Centre",
    subtitle: "Everything an organizer needs to know — with your real numbers.",
    back: "Back to dashboard",
    loading: "Loading your information…",
    questions: [
      { key: "fee", icon: Percent, title: "What is my fee?" },
      { key: "payout", icon: CalendarClock, title: "How and when do I get paid?" },
      { key: "refund", icon: RefreshCw, title: "Can my customers request a refund?" },
      { key: "validate", icon: ScanLine, title: "How do I validate tickets at the door?" },
      { key: "offline", icon: WifiOff, title: "What if the internet drops at the gate?" },
      { key: "transfer", icon: ArrowLeftRight, title: "Can I transfer tickets?" },
      { key: "comps", icon: Users, title: "Can I issue complimentary tickets?" },
      { key: "loyalty", icon: Gift, title: "How do I reward repeat attendees?" },
      { key: "ftc", icon: Coins, title: "What does the customer do with FestCoin credit?" },
      { key: "rewards", icon: Package, title: "Do I choose which rewards exist?" },
    ],
  },
};

export default function OrganizerAjuda() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const c = CONTENT[language] || CONTENT["pt-BR"];
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    base44.entities.OrganizerAccount.filter({ user_id: currentUser.id }, "-created_date", 1)
      .then(res => setAccount(res[0] || null))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const isPilot = account?.fee_tier === "pilot";
  const feeRate = account?.fee_percentage ?? (isPilot ? 5 : 8);
  const pilotEnd = account?.pilot_expires_at
    ? moment(account.pilot_expires_at).format("D [de] MMM [de] YYYY")
    : null;

  const answers = {
    fee: isPilot ? (
      <p>
        Sua taxa é <strong className="text-primary">{feeRate}%</strong> (piloto), fixa por 12 meses.
        {pilotEnd ? <> Sua taxa fixa dura até <strong>{pilotEnd}</strong>.</> : null}
        {" "}Após esse período, a taxa padrão de 8% se aplica. Sem mensalidade, sem taxa de configuração.{" "}
        <Link to="/politica-de-precos" className="text-primary hover:underline">Ver política completa →</Link>
      </p>
    ) : (
      <p>
        Sua taxa é <strong className="text-primary">{feeRate}%</strong> sobre cada ingresso vendido.
        Sem mensalidade, sem taxa de configuração. Ingressos reembolsados não geram taxa.{" "}
        <Link to="/politica-de-precos" className="text-primary hover:underline">Ver política completa →</Link>
      </p>
    ),
    payout: (
      <p>
        Durante o piloto, o repasse é feito manualmente pela nossa equipe via Pix, em até 2 dias úteis após a janela de acerto (que abre quando o evento acontece). O valor é líquido da taxa. Veja suas datas previstas no{" "}
        <Link to="/organizer/financeiro" className="text-primary hover:underline">extrato financeiro →</Link>
      </p>
    ),
    refund: (
      <p>
        Sim. O participante solicita reembolso direto pelo ingresso na carteira. Você aprova ou recusa em{" "}
        <Link to="/organizer/reembolsos" className="text-primary hover:underline">Solicitações de reembolso →</Link>
        {" "}A política de reembolso do evento (até 7 dias, 48h, sem reembolso ou caso a caso) é definida no editor do evento e mostrada ao comprador antes do pagamento.
      </p>
    ),
    validate: (
      <p>
        Use o scanner em <Link to="/scan" className="text-primary hover:underline">Check-in →</Link>
        {" "}Aponte para o QR do ingresso. Cada ingresso é de uso único — uma vez validado, não entra de novo.
      </p>
    ),
    offline: (
      <p>
        Baixe a lista offline enquanto conectado (botão no scanner). No modo offline, a validação é local e as leituras ficam na fila. Ao reconectar, sincronize — duplicadas entre dispositivos são detectadas na sincronização.
      </p>
    ),
    transfer: (
      <p>
        <strong className="text-warning">Ainda não.</strong> Está no roteiro. Hoje, se alguém não puder ir, você pode reembolsar e revender, ou emitir uma cortesia para o novo convidado em{" "}
        <Link to="/organizer/convidados" className="text-primary hover:underline">Convidados →</Link>
      </p>
    ),
    comps: (
      <p>
        Sim, em <Link to="/organizer/convidados" className="text-primary hover:underline">Convidados →</Link>
        {" "}Escolha a categoria (cortesia, lista, staff, artista, imprensa, parceria), a quantidade e envie direto ou gere códigos para compartilhar. Cortesias consomem capacidade real e não geram crédito.
      </p>
    ),
    loyalty: (
      <p>
        Todo ingresso pago gera crédito FestChain automaticamente. Configure recompensas em{" "}
        <Link to="/organizer/recompensas" className="text-primary hover:underline">Recompensas →</Link>
        {" "}O participante resgata no evento usando o código no bar.
      </p>
    ),
    ftc: (
      <p>
        O cliente usa o crédito para bebida, comida, upgrade, brinde ou experiência nos eventos participantes. Ele vê o catálogo na carteira e resgata com um código que a equipe confere no bar em{" "}
        <Link to="/organizer/validar-recompensa" className="text-primary hover:underline">Validar recompensa →</Link>
      </p>
    ),
    rewards: (
      <p>
        Sim, você cria e gerencia as recompensas em{" "}
        <Link to="/organizer/recompensas" className="text-primary hover:underline">Recompensas →</Link>
        {" "}Define nome, custo em FTC, valor em R$, estoque, limite por pessoa e janela de resgate. Pode usar os itens sugeridos para começar em menos de 1 minuto.
      </p>
    ),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-6 py-8 pb-24">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> {c.back}
      </Link>

      <div>
        <h1 className="font-heading font-extrabold text-3xl text-foreground flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-primary" strokeWidth={1.75} /> {c.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{c.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground text-sm py-8">
          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          {c.loading}
        </div>
      ) : (
        <div className="space-y-3">
          {c.questions.map((q, i) => {
            const Icon = q.icon;
            return (
              <div key={q.key} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="font-heading font-semibold text-foreground text-base">{q.title}</h2>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm leading-relaxed pl-12">
                  {answers[q.key]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}