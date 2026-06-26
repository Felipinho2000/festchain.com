import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ_EN = [
  {
    q: "Is FestChain free to use?",
    a: "Yes — during the public beta, FestChain is completely free for both organizers and partygoers. No payment processing is enabled yet. Tickets are issued as secure QR credentials for testing and real event check-ins."
  },
  {
    q: "Do guests need crypto or a blockchain wallet?",
    a: "No. FestChain works like any regular app — sign up with your email, get a ticket, show your QR at the door. No crypto knowledge, no wallet setup, no technical steps required."
  },
  {
    q: "What is FestCoin (FTC)?",
    a: "FestCoin is FestChain's in-app loyalty credit. Earn FTC by attending events and use it for pilot redemptions (drinks, perks) at participating events. FTC is not a cryptocurrency, has no cash value, and cannot be sold or withdrawn — it's a reward layer for the event experience."
  },
  {
    q: "How do I get access as an organizer?",
    a: "Organizer access is approved manually during the pilot. Fill out the contact form below with your event details and we'll get back to you quickly. DJs and brands can also reach out the same way."
  }
];

const FAQ_PT = [
  {
    q: "O FestChain é gratuito?",
    a: "Sim — durante o beta público, o FestChain é completamente gratuito tanto para organizadores quanto para participantes. Nenhum pagamento real é processado ainda. Os ingressos são emitidos como credenciais QR seguras para testes e check-ins em eventos reais."
  },
  {
    q: "Os convidados precisam de cripto ou carteira blockchain?",
    a: "Não. O FestChain funciona como qualquer app comum — cadastre-se com seu e-mail, receba um ingresso, mostre seu QR na porta. Sem conhecimento técnico, sem configuração de carteira, sem passos complicados."
  },
  {
    q: "O que é FestCoin (FTC)?",
    a: "FestCoin é o crédito de fidelidade interno do FestChain. Ganhe FTC participando de eventos e use para resgates piloto (drinks, benefícios) em eventos participantes. FTC não é criptomoeda, não tem valor em dinheiro e não pode ser vendido ou sacado — é uma camada de recompensa para a experiência do evento."
  },
  {
    q: "Como consigo acesso como organizador?",
    a: "O acesso de organizador é aprovado manualmente durante o piloto. Preencha o formulário de contato abaixo com os detalhes do seu evento e entraremos em contato rapidamente. DJs e marcas também podem usar o mesmo formulário."
  }
];

export default function LandingFAQ({ lang = "en" }) {
  const [open, setOpen] = useState(null);
  const faqs = lang === "pt-BR" ? FAQ_PT : FAQ_EN;
  const title = lang === "pt-BR" ? "Perguntas Frequentes" : "Frequently Asked Questions";
  const kicker = lang === "pt-BR" ? "Dúvidas" : "FAQ";

  return (
    <section className="py-16 px-5">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{kicker}</p>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">{title}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-heading font-semibold text-white text-sm pr-4">{item.q}</span>
                {open === i
                  ? <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-[#555] flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-6 pb-5 border-t border-[#1f1f1f]">
                  <p className="text-[#aaa] text-sm leading-relaxed pt-4">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}