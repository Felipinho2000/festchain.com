import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ_EN = [
  {
    q: "Do guests need crypto to use FestChain?",
    a: "No. The pilot is designed to be simple and accessible. Guests can use FestChain without needing any crypto knowledge, wallet setup, or technical steps — just sign up with your email and get your ticket."
  },
  {
    q: "What is FestCoin?",
    a: "FestCoin is the reward and utility credit of the FestChain ecosystem. During the pilot, it is used for perks, loyalty, and event experiences. It is not a cryptocurrency, has no cash value, and cannot be sold or withdrawn."
  },
  {
    q: "Is FestChain already live?",
    a: "FestChain is currently preparing selected pilot events with DJs, organizers, venues, and partner brands. Join the pilot to be part of the first wave."
  },
  {
    q: "How can I join the pilot?",
    a: "DJs, organizers, venues, and brands can request access through the contact form below. We'll review your request and get back to you quickly."
  },
  {
    q: "Is FestCoin an investment?",
    a: "No. FestCoin should be understood as a utility and reward mechanism for the FestChain ecosystem. The pilot does not make financial promises. FTC has no monetary value and is for in-app use only."
  },
  {
    q: "What problem does FestChain solve?",
    a: "FestChain helps reduce ticket fraud, improve event access, reward loyal guests, connect DJs with fans, and give organizers better tools to manage event experiences."
  }
];

const FAQ_PT = [
  {
    q: "Os convidados precisam de cripto para usar o FestChain?",
    a: "Não. O piloto foi criado para ser simples e acessível. Os convidados podem usar o FestChain sem nenhum conhecimento de cripto, configuração de carteira ou passos técnicos — basta criar uma conta com seu e-mail e receber o ingresso."
  },
  {
    q: "O que é FestCoin?",
    a: "FestCoin é o crédito de recompensa e utilidade do ecossistema FestChain. Durante o piloto, é usado para benefícios, fidelidade e experiências no evento. Não é criptomoeda, não tem valor em dinheiro e não pode ser vendido ou sacado."
  },
  {
    q: "O FestChain já está no ar?",
    a: "O FestChain está atualmente preparando eventos piloto selecionados com DJs, organizadores, locais e marcas parceiras. Junte-se ao piloto para fazer parte da primeira onda."
  },
  {
    q: "Como posso entrar no piloto?",
    a: "DJs, organizadores, locais e marcas podem solicitar acesso pelo formulário de contato abaixo. Vamos analisar seu pedido e retornar rapidamente."
  },
  {
    q: "FestCoin é um investimento?",
    a: "Não. FestCoin deve ser entendido como um mecanismo de utilidade e recompensa do ecossistema FestChain. O piloto não faz promessas financeiras. O FTC não tem valor monetário e é apenas para uso no app."
  },
  {
    q: "Qual problema o FestChain resolve?",
    a: "O FestChain ajuda a reduzir fraudes em ingressos, melhorar o acesso aos eventos, recompensar convidados fiéis, conectar DJs com fãs e dar aos organizadores melhores ferramentas para gerenciar experiências de eventos."
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