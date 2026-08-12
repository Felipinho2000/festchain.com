import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, QrCode, Lock, Eye, Camera, Coins, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const items = [
  {
    icon: QrCode,
    title: "Ingressos QR seguros",
    body: "Cada ingresso carrega um QR único com validação segura no servidor. Nada de falso, duplicado ou papel pra perder.",
  },
  {
    icon: ShieldCheck,
    title: "Validação anti-fraude",
    body: "Cada ingresso só pode ser escaneado uma vez. Depois do check-in, é marcado como usado — o mesmo código não entra duas vezes.",
  },
  {
    icon: Users,
    title: "Eventos controlados pelo organizador",
    body: "Os organizadores criam e rodam seus próprios eventos. Definem capacidade, tipos de ingresso e recompensas. Eventos públicos aparecem na busca; privados são só por link.",
  },
  {
    icon: Eye,
    title: "Eventos públicos e privados",
    body: "Eventos públicos aparecem na descoberta. Privados ficam ocultos — só quem tem o link direto encontra e compra o ingresso.",
  },
  {
    icon: Lock,
    title: "Seus dados são seus",
    body: "Guardamos só o necessário pra emitir seu ingresso e recompensas. Nunca vendemos seus dados. Seu histórico é visível só pra você e o organizador.",
  },
  {
    icon: Camera,
    title: "Câmera só pro check-in",
    body: "O scanner usa sua câmera só pra ler o QR na porta, direto no navegador. Não guardamos fotos nem gravamos vídeo.",
  },
  {
    icon: Coins,
    title: "O que é o FestCoin",
    body: "Durante o piloto, FestCoin é um crédito de recompensa no app — não é criptomoeda, não é dinheiro e não é investimento. Ganhe com ingressos e gaste em perks nos eventos participantes.",
  },
];

export default function TrustSafety() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">
      <nav className="border-b border-[#1f1f1f] bg-[#0d0d0d]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/"><Logo size={26} /></Link>
          <Link to="/"><Button variant="ghost" className="text-[#888] hover:text-white text-sm">← Voltar ao início</Button></Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading font-extrabold text-4xl text-white mb-3 uppercase">Confiança &amp; Segurança</h1>
          <p className="text-[#aaa] text-base leading-relaxed max-w-xl mx-auto">
            Curta a noite com tranquilidade. É assim que a FestChain mantém suas noites seguras — do ingresso à portaria.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-white text-base mb-1">{item.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FestCoin in the MVP */}
        <div className="mt-10 bg-[#111] border border-primary/20 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-heading font-bold text-2xl text-white">{t("festcoin.wpTitle")}</h2>
          </div>
          <p className="text-[#aaa] text-sm leading-relaxed">{t("festcoin.wpIntro")}</p>
          <p className="text-[#aaa] text-sm leading-relaxed">{t("festcoin.wpIntro2")}</p>
          <p className="text-[#aaa] text-sm leading-relaxed">{t("festcoin.wpIntro3")}</p>

          <div>
            <h3 className="font-heading font-bold text-white text-base mb-3">{t("festcoin.wpPrinciplesTitle")}</h3>
            <div className="space-y-3">
              {[
                { title: t("festcoin.wpP1Title"), body: t("festcoin.wpP1Body") },
                { title: t("festcoin.wpP2Title"), body: t("festcoin.wpP2Body") },
                { title: t("festcoin.wpP3Title"), body: t("festcoin.wpP3Body") },
                { title: t("festcoin.wpP4Title"), body: t("festcoin.wpP4Body") },
                { title: t("festcoin.wpP5Title"), body: t("festcoin.wpP5Body") },
                { title: t("festcoin.wpP6Title"), body: t("festcoin.wpP6Body") },
                { title: t("festcoin.wpP7Title"), body: t("festcoin.wpP7Body") },
              ].map((p, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
                  <p className="text-primary font-semibold text-sm mb-1">{p.title}</p>
                  <p className="text-[#888] text-xs leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-white text-base mb-3">{t("festcoin.wpHowTitle")}</h3>
            <ol className="space-y-2">
              {t("festcoin.wpHowSteps").map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-[#888] text-xs leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[#666] text-xs italic">{t("festcoin.wpPilotNote")}</p>
        </div>

        <div className="mt-10 bg-primary/5 border border-primary/25 rounded-2xl p-6 text-center">
          <p className="text-[#aaa] text-sm leading-relaxed max-w-lg mx-auto">
            A FestChain está em <span className="text-primary font-semibold">piloto privado</span>. Recursos são testados com eventos reais antes do lançamento público. Dúvidas? Fale com a gente.
          </p>
          <Link to="/#contact" className="inline-block mt-4">
            <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a]">
              Contact us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}