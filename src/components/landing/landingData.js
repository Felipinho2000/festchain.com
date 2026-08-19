import {
  Users, Zap, Gift, CalendarPlus, Ticket, DoorOpen, Repeat, Search,
} from "lucide-react";

export const WHATSAPP_NUMBER = "5519994174868";
export const CONTACT_EMAIL = "feelipe.oliveeira@hotmail.com";

export const COPY = {
  "pt-BR": {
    nav: { organizers: "Para organizadores", how: "Como funciona", prices: "Preços", openApp: "Abrir app", login: "Entrar", findEvents: "Ver eventos", cta: "Quero levar minha festa" },
    hero: {
      badge: "Bilheteria da noite, no mundo todo",
      title1: "Venda os ingressos.",
      title2: "Fique com o público.",
      sub: "A FestChain é a plataforma de ingressos para casas, festas e coletivos. Checkout rápido, portaria que não trava nem sem internet, e crédito que traz a galera de volta na próxima.",
      ctaPrimary: "Quero levar minha festa",
      ctaSecondary: "Ver como funciona",
      note: "8% por ingresso · Sem mensalidade · Repasse acompanhado pela nossa equipe",
    },
    strip: ["8% por ingresso vendido", "Sem mensalidade", "Portaria funciona offline", "Repasse acompanhado pela nossa equipe"],
    wedge: {
      kicker: "Por que trocar de plataforma",
      title: "Feito pra como a night vende de verdade.",
      sub: "Não é ferramenta genérica de evento. É construída pro que acontece numa noite real — da venda até a porta, e da porta até a próxima festa.",
      cards: [
        { icon: Zap, t: "Checkout que não perde venda",
          d: "Pix e cartão, CPF e meia-entrada do jeito certo, lotes que viram sozinhos quando esgotam. Comprou, o ingresso já está no celular." },
        { icon: DoorOpen, t: "Portaria que aguenta a fila",
          d: "Leitura de QR no celular do seu staff, cada ingresso entra uma vez só. E se a internet cair no meio da festa, a portaria continua funcionando — a lista fica salva no aparelho." },
        { icon: Gift, t: "O público continua com você",
          d: "Quem foi na sua festa deixa o contato e avalia o rolê, e ganha crédito pra usar na próxima. A lista de quem esteve lá é sua, não da plataforma. Você para de alugar o seu próprio público." },
      ],
    },
    how: {
      kicker: "Para organizadores",
      title: "Da criação à próxima lotação.",
      steps: [
        { icon: CalendarPlus, t: "Criar",
          d: "Monte o evento em minutos — lotes, horários, preços e meia-entrada numa página só." },
        { icon: Ticket, t: "Vender",
          d: "Compartilhe o link no WhatsApp e no Instagram. Pix e cartão, confirmação automática, ingresso no celular na hora." },
        { icon: DoorOpen, t: "Portaria",
          d: "Check-in por QR à prova de duplicidade, vários operadores, contador ao vivo de quem já entrou. Cortesia e lista com nome na porta." },
        { icon: Repeat, t: "Trazer de volta",
          d: "Receita e vendas por lote em tempo real. O crédito da galera puxa todo mundo pra próxima. O ciclo recomeça." },
      ],
    },
    objections: {
      kicker: "Sem enrolação",
      title: "As três perguntas que todo mundo faz.",
      items: [
        { q: "Vocês são novos. Por que eu confiaria a bilheteria da minha festa?", a: "Somos. Por isso a primeira festa é acompanhada de perto — eu estou junto no dia, na portaria, do primeiro ingresso ao último. Se algo der errado, você fala comigo, não com um chamado de suporte." },
        { q: "E se travar na entrada?", a: "A lista de quem comprou fica salva no celular do seu staff antes da festa começar. Se a internet cair, a portaria continua lendo QR normalmente e sincroniza sozinha quando a conexão volta." },
        { q: "Quando eu recebo?", a: "Durante o piloto, o repasse é feito via Pix pela nossa equipe depois do evento, com o extrato do valor líquido. Você acompanha o status exato no painel desde o dia que publica o evento." },
      ],
    },
    pricing: {
      kicker: "Preços",
      title: "8%. Só isso.",
      sub: "Sem mensalidade. Sem taxa de adesão. Sem custo pra criar e publicar. Ingresso reembolsado não gera taxa.",
      example: [
        { label: "Total vendido", value: "R$ 6.000,00" },
        { label: "Taxa FestChain (8%)", value: "– R$ 480,00" },
        { label: "Você recebe", value: "R$ 5.520,00", highlight: true },
      ],
      pilotNote: "Casas piloto pagam 5% fixo nos primeiros 12 meses.",
      fullLink: "Ver política completa de preços →",
      fullLinkHref: "/politica-de-precos",
    },
    own: {
      kicker: "Retenção",
      title1: "Uma audiência que é sua.", title2: "De verdade.",
      p1: "Nas plataformas de sempre, o cliente é da plataforma — você aluga acesso ao seu próprio público. Na FestChain, o público, os dados e o relacionamento são seus.",
      p2: "Depois da festa, o crédito, o histórico e o contato ficam com você. Você chama de volta quem foi — e quem ainda tem crédito guardado pra gastar.",
      quote: "É o loop de retenção que uma plataforma genérica de ingressos não consegue fechar.",
      rows: [
        { i: "M", n: "Mari S.", s: "Foi na última · R$18 de crédito", b: "Voltou" },
        { i: "P", n: "Pedro L.", s: "Foi 3x · cliente da casa", b: "Voltou" },
        { i: "J", n: "Jé + 4 amigos", s: "Grupo · comprou junto", b: "Voltou" },
        { i: "R", n: "Rafa D.", s: "R$30 de crédito parado", b: "Chamar" },
      ],
    },
    trust: {
      title: "Seguro por design.",
      body: "Cada ingresso carrega um QR único com validação segura no servidor — nada de ingresso falso, duplicado ou dor de cabeça na porta. Por trás, ticketing seguro, proteção contra fraude e repasses confiáveis, sem ninguém precisar pensar na tecnologia por baixo.",
    },
    footer: {
      tagline: "Plataforma de ingressos para a vida noturna. Feito em São Paulo, Brasil.",
      rights: "Ticketing seguro · Proteção contra fraude · Repasse acompanhado pela nossa equipe",
    },
    contact: {
      kicker: "Comece agora",
      title: "Quer levar sua próxima festa pra FestChain?",
      sub: "Estamos abrindo poucas casas por vez pra fazer bem feito. Chama no WhatsApp e a gente monta seu primeiro evento junto.",
      whatsapp: "Falar no WhatsApp",
      nameL: "Nome", emailL: "E-mail", msgL: "Sobre sua festa",
      namePh: "Seu nome", emailPh: "voce@email.com",
      msgPh: "Nome da festa, cidade, próxima data, como você vende hoje…",
      send: "Enviar", sending: "Enviando…",
      sentTitle: "Recebemos!", sentSub: "Vou te chamar pra ajudar a colocar sua próxima festa no ar. Se quiser adiantar, fala comigo no WhatsApp.",
      errTitle: "Erro", errSub: "Não conseguimos enviar. Tente de novo.",
    },
    ecosystem: {
      kicker: "O ecossistema",
      title: "Uma noite. Todo mundo ganha.",
      sub: "A FestChain não é só ticketing. É a infra da noite inteira — onde cada lado sai ganhando.",
      cards: [
        { icon: Users, t: "Organizadores", d: "Vendem mais, rodam a noite inteira (ingresso, bar, porta), recebem certo e ficam donos do próprio público e dos dados." },
        { icon: Ticket, t: "Público", d: "Compram em segundos no Pix, entram sem fila, ganham crédito que volta pra próxima e têm a noite inteira no celular." },
      ],
    },
    crowd: {
      kicker: "Para a galera",
      title: "A noite, do começo ao fim, no celular.",
      cta: "Encontrar eventos",
      items: [
        { icon: Search, t: "Descubra", d: "O que rola hoje, no fim de semana e pra onde os amigos vão." },
        { icon: Zap, t: "Compre em segundos", d: "Pix ou cartão. Ingresso no celular na hora." },
        { icon: Ticket, t: "Entre rápido", d: "QR na carteira, funciona offline, sem fila na porta." },
        { icon: Gift, t: "Ganhe crédito", d: "Crédito que volta e paga parte do próximo rolê." },
      ],
    },
    waMsg: "Oi! Quero levar minha festa pra FestChain.",
  },
  en: {
    nav: { organizers: "For organizers", how: "How it works", prices: "Pricing", openApp: "Open app", login: "Log in", findEvents: "Find events", cta: "Bring your party" },
    hero: {
      badge: "Nightlife box office, worldwide",
      title1: "Sell the tickets.",
      title2: "Keep the crowd.",
      sub: "FestChain is the ticketing platform for clubs, parties and collectives. Fast checkout, a door that doesn't stall even without internet, and credit that brings people back next time.",
      ctaPrimary: "Bring your party",
      ctaSecondary: "See how it works",
      note: "8% per ticket · No monthly fee · Payout handled by our team",
    },
    strip: ["8% per ticket sold", "No monthly fee", "Door works offline", "Payout handled by our team"],
    wedge: {
      kicker: "Why they switch",
      title: "Built for how nightlife actually sells.",
      sub: "Not generic events tooling. Built for what happens in a real night — from the sale to the door, and from the door to the next party.",
      cards: [
        { icon: Zap, t: "Checkout that doesn't lose sales",
          d: "Pix and card, CPF and half-price done right, phases that flip on their own when they sell out. Once paid, the ticket is already on the phone." },
        { icon: DoorOpen, t: "A door that handles the line",
          d: "QR scanning on your staff's phone, each ticket enters once. And if the internet drops mid-party, the door keeps working — the list is saved on the device." },
        { icon: Gift, t: "The crowd stays with you",
          d: "Everyone who came leaves their contact and reviews the party, and earns credit for the next one. And the list of who was there is yours, not the platform's. You stop renting your own crowd." },
      ],
    },
    how: {
      kicker: "For organizers",
      title: "From creation to the next sellout.",
      steps: [
        { icon: CalendarPlus, t: "Create",
          d: "Build the event in minutes — phases, times, prices and half-price on one page." },
        { icon: Ticket, t: "Sell",
          d: "Share the link on WhatsApp and Instagram. Pix and card, automatic confirmation, ticket on the phone right away." },
        { icon: DoorOpen, t: "Door",
          d: "Duplicate-proof QR check-in, multiple operators, a live counter of who's inside. Comps and list with name at the door." },
        { icon: Repeat, t: "Bring them back",
          d: "Revenue and sales by phase in real time. The crowd's credit pulls everyone to the next one. The cycle restarts." },
      ],
    },
    objections: {
      kicker: "No spin",
      title: "The three questions everyone asks.",
      items: [
        { q: "You're new. Why would I trust you with my party's box office?", a: "We are. That's why the first party is handled close up — I'm there on the day, at the door, from the first ticket to the last. If something goes wrong, you talk to me, not a support ticket." },
        { q: "What if the door stalls?", a: "The list of who bought is saved on your staff's phone before the party starts. If the internet drops, the door keeps scanning QR normally and syncs on its own when the connection comes back." },
        { q: "When do I get paid?", a: "During the pilot, our team handles payouts via Pix after the event, with a statement of the net amount. You can track the exact status in your dashboard from the day you publish the event." },
      ],
    },
    pricing: {
      kicker: "Pricing",
      title: "8%. That's it.",
      sub: "No monthly fee. No signup fee. No cost to create and publish. Refunded tickets don't incur a fee.",
      example: [
        { label: "Total sold", value: "R$ 6.000,00" },
        { label: "FestChain fee (8%)", value: "– R$ 480,00" },
        { label: "You receive", value: "R$ 5.520,00", highlight: true },
      ],
      pilotNote: "Pilot venues pay a fixed 5% for the first 12 months.",
      fullLink: "See full pricing policy →",
      fullLinkHref: "/politica-de-precos",
    },
    own: {
      kicker: "Retention",
      title1: "An audience that is", title2: "actually yours.",
      p1: "On the usual platforms, the customer belongs to the platform — you're renting access to your own crowd. On FestChain, the audience, the data and the relationship are yours.",
      p2: "After the party, the credit, the history and the contact stay with you. You call back everyone who came — and everyone still holding credit to spend.",
      quote: "It's the retention loop a generic ticketing platform structurally can't close.",
      rows: [
        { i: "M", n: "Mari S.", s: "Last event · R$18 credit", b: "Returned" },
        { i: "P", n: "Pedro L.", s: "3 events · house regular", b: "Returned" },
        { i: "J", n: "Jé + 4 friends", s: "Group · bought together", b: "Returned" },
        { i: "R", n: "Rafa D.", s: "R$30 credit unused", b: "Invite" },
      ],
    },
    trust: {
      title: "Secure by design.",
      body: "Every ticket carries a unique QR with secure server-side validation — no fakes, no doubles, no hassle at the door. Behind the scenes, secure ticketing, fraud protection and reliable payouts, without anyone needing to think about the technology underneath.",
    },
    footer: {
      tagline: "Ticketing platform for nightlife. Made in São Paulo, Brazil.",
      rights: "Secure ticketing · Fraud protection · Payout handled by our team",
    },
    contact: {
      kicker: "Get started",
      title: "Want to bring your next party to FestChain?",
      sub: "We're onboarding a few clubs at a time to do it right. Message us on WhatsApp and we'll set up your first event together.",
      whatsapp: "Message on WhatsApp",
      nameL: "Name", emailL: "Email", msgL: "About your party",
      namePh: "Your name", emailPh: "you@email.com",
      msgPh: "Party name, city, next date, how you sell today…",
      send: "Send", sending: "Sending…",
      sentTitle: "Got it!", sentSub: "I'll reach out to help you get your next party live. Want to move faster? Message me on WhatsApp.",
      errTitle: "Error", errSub: "Could not submit. Please try again.",
    },
    ecosystem: {
      kicker: "The ecosystem",
      title: "One night. Everyone wins.",
      sub: "FestChain isn't just ticketing. It's the infrastructure for the whole night — where every side comes out ahead.",
      cards: [
        { icon: Users, t: "Organizers", d: "Sell more, run the whole night (tickets, bar, door), get paid correctly and own their own crowd and data." },
        { icon: Ticket, t: "Crowd", d: "Buy in seconds with Pix, walk in without a line, earn credit that comes back next time, and carry the whole night on their phone." },
      ],
    },
    crowd: {
      kicker: "For the crowd",
      title: "The whole night, start to finish, on your phone.",
      cta: "Find events",
      items: [
        { icon: Search, t: "Discover", d: "What's on tonight, this weekend, and where your friends are going." },
        { icon: Zap, t: "Buy in seconds", d: "Pix or card. Ticket on your phone right away." },
        { icon: Ticket, t: "Get in fast", d: "QR in your wallet, works offline, no queue at the door." },
        { icon: Gift, t: "Earn credit", d: "Credit that comes back and covers part of the next night out." },
      ],
    },
    waMsg: "Hi! I want to run my event on FestChain.",
  },
};

export const getWaHref = (lang = "pt-BR") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(COPY[lang]?.waMsg ?? COPY["pt-BR"].waMsg)}`;