import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const FAQ_PT = [
  {
    q: "Qual é a taxa da FestChain?",
    a: "8% sobre cada ingresso pago. Sem mensalidade, sem taxa de adesão, sem custo pra criar e publicar um evento. Ingresso reembolsado não gera taxa. Casas piloto pagam 5% fixo por 12 meses."
  },
  {
    q: "Quando eu recebo o dinheiro das vendas?",
    a: "Até 2 dias úteis depois do evento, via Pix, com o extrato do valor líquido. A data exata aparece no seu painel desde o dia que você publica o evento."
  },
  {
    q: "Meus clientes podem pedir reembolso?",
    a: "Podem. Você define a política antes de vender o primeiro ingresso, ela aparece pro comprador no checkout, e você aprova ou recusa cada pedido no painel."
  },
  {
    q: "Como funciona a validação na entrada?",
    a: "Pelo celular do seu staff. Lê o QR, libera em menos de um segundo, e ingresso duplicado é recusado na hora. Vários operadores podem ler ao mesmo tempo."
  },
  {
    q: "E se a internet cair na portaria?",
    a: "A lista de quem comprou fica salva no aparelho antes da festa. Sem internet, a portaria continua funcionando e sincroniza sozinha quando a conexão volta."
  },
  {
    q: "Dá pra emitir cortesia?",
    a: "Dá. Lista, staff, artista, imprensa, parceria — cada uma com sua categoria, e aparece marcada na portaria. Cortesia não paga taxa."
  },
  {
    q: "Dá pra transferir um ingresso pra outra pessoa?",
    a: "Ainda não — está no roteiro. Hoje dá pra reembolsar e revender, ou emitir uma cortesia pro novo convidado."
  },
  {
    q: "O que é o crédito FestChain?",
    a: "Quem compra ingresso ganha crédito pra usar na próxima festa da mesma casa — consumação, brinde ou upgrade. Você escolhe o que vale o quê. O crédito é usado no app e não é resgatável em dinheiro."
  }
];

const FAQ_EN = [
  {
    q: "What is FestChain's fee?",
    a: "8% on each paid ticket. No monthly fee, no signup fee, no cost to create and publish an event. Refunded tickets don't incur a fee. Pilot venues pay a fixed 5% for 12 months."
  },
  {
    q: "When do I receive the sales money?",
    a: "Within 2 business days after the event, via Pix, with a statement of the net amount. The exact date shows in your dashboard from the day you publish the event."
  },
  {
    q: "Can my customers request a refund?",
    a: "Yes. You set the policy before selling the first ticket, it's shown to the buyer at checkout, and you approve or decline each request in the dashboard."
  },
  {
    q: "How does door validation work?",
    a: "On your staff's phone. It scans the QR, clears entry in under a second, and a duplicate ticket is rejected on the spot. Multiple operators can scan at the same time."
  },
  {
    q: "What if the internet drops at the door?",
    a: "The list of who bought is saved on the device before the party. Without internet, the door keeps working and syncs on its own when the connection comes back."
  },
  {
    q: "Can I issue comps?",
    a: "Yes. List, staff, artist, press, partner — each in its own category, and marked at the door. Comps don't pay a fee."
  },
  {
    q: "Can I transfer a ticket to someone else?",
    a: "Not yet — it's on the roadmap. Today you can refund and resell, or issue a comp for the new guest."
  },
  {
    q: "What is FestChain credit?",
    a: "Anyone who buys a ticket earns credit to use at the next party at the same venue — drinks, merch or upgrades. You decide what's worth what. The credit is used in the app and is not redeemable for cash."
  }
];

export default function LandingFAQ({ lang = "pt-BR" }) {
  const { lang: ctxLang } = useLanguage();
  const active = ctxLang || lang;
  const [open, setOpen] = useState(null);
  const faqs = active === "pt-BR" ? FAQ_PT : FAQ_EN;
  const title = active === "pt-BR" ? "Perguntas Frequentes" : "Frequently Asked Questions";
  const kicker = active === "pt-BR" ? "Dúvidas" : "FAQ";

  return (
    <section id="faq" className="py-16 px-5">
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