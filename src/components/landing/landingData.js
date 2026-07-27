import {
  Users, Zap, Gift, CalendarPlus, Ticket, Wine, DoorOpen, Repeat,
  Search, Music, TrendingUp,
} from "lucide-react";

export const WHATSAPP_NUMBER = "5511999999999";
export const CONTACT_EMAIL = "contato@festchain.com";

export const COPY = {
  "pt-BR": {
    nav: { organizers: "Para organizadores", how: "Como funciona", crowd: "Para a galera", openApp: "Abrir app", login: "Entrar", cta: "Quero levar minha festa" },
    hero: {
      badge: "Feito para a vida noturna do Brasil",
      title1: "O sistema operacional", title2: "da vida noturna.",
      sub: "A FestChain ajuda clubs, festivais, coletivos e promoters a vender mais ingressos, controlar a portaria, recompensar quem aparece e transformar o público de uma noite em uma audiência que é realmente sua.",
      ctaPrimary: "Quero levar minha festa", ctaSecondary: "Ver como funciona",
      note: "Comissão de promoter automática · Pix na hora · Cashback que traz a galera de volta",
    },
    strip: ["Taxas menores", "Pix confirmado na hora", "Proteção contra fraude", "Repasse confiável"],
    wedge: {
      kicker: "Por que trocam de plataforma",
      title: "Feito pra como a noite vende de verdade.",
      sub: "Não é ferramenta genérica de eventos. É construída em cima das três coisas que fazem uma festa lotar no Brasil — promoter, WhatsApp e Instagram.",
      cards: [
        { icon: Users, t: "Promoter que vende", d: "Cada promoter e RP ganha um link próprio. Cada venda é atribuída automaticamente e a comissão é calculada sozinha. Eles veem quanto venderam e quanto vão receber, em tempo real. É onde as outras plataformas são mais fracas." },
        { icon: Zap, t: "Pix na hora", d: "Checkout com Pix instantâneo, cartão e parcelamento pra ingresso de festival. Confirmação automática na hora do pagamento e o ingresso chega no WhatsApp de quem comprou. Sem fila, sem fricção, mais conversão." },
        { icon: Gift, t: "Cashback que volta", d: "Cada ingresso gera crédito pra próxima festa. A galera volta — e você sabe exatamente quem são. Duplique o evento com um toque e chame de volta todo mundo que foi e todo mundo que tem crédito guardado." },
      ],
    },
    own: {
      kicker: "Retenção",
      title1: "Uma audiência que é sua.", title2: "De verdade.",
      p1: "Nas plataformas de sempre, o cliente é da plataforma — você aluga acesso ao seu próprio público. Na FestChain, o público, os dados e o relacionamento são seus.",
      p2: "Depois da festa, o cashback, o histórico e o contato ficam com você. Um toque duplica o evento e avisa todo mundo que foi — mais quem ainda tem crédito pra gastar.",
      quote: "É o loop de retenção que uma plataforma genérica de ingressos não consegue fechar.",
      rows: [
        { i: "M", n: "Mari S.", s: "Foi na última · R$18 de crédito", b: "Voltou" },
        { i: "P", n: "Pedro L.", s: "Foi 3x · promoter da casa", b: "Voltou" },
        { i: "J", n: "Jé + 4 amigos", s: "Grupo · comprou junto", b: "Voltou" },
        { i: "R", n: "Rafa D.", s: "R$30 de crédito parado", b: "Chamar" },
      ],
    },
    how: {
      kicker: "Para organizadores",
      title: "Da criação à próxima lotação.",
      steps: [
        { icon: CalendarPlus, t: "Criar", d: "Monte o evento em minutos — lotes, line-up, horários e preços numa página só. Salve como modelo e duplique festas semanais em segundos." },
        { icon: Ticket, t: "Vender", d: "Ative seus promoters com links e comissão automática. Um toque compartilha no WhatsApp e no Instagram. É assim que a noite vende." },
        { icon: Wine, t: "Bar & consumação", d: "Venda bebidas, combos e open bar pelo app. O público gasta o cashback no bar, a casa fatura mais e sabe o gasto médio por pessoa." },
        { icon: DoorOpen, t: "Portaria", d: "Check-in por QR à prova de duplicidade, vários operadores, contador ao vivo de quem já entrou. Lista e cortesia com nome na porta." },
        { icon: Repeat, t: "Trazer de volta", d: "Receita, vendas por lote e por promoter em tempo real. Cashback e follows puxam a galera pra próxima. O ciclo recomeça." },
      ],
    },
    crowd: {
      kicker: "Para a galera",
      title: "A noite, do começo ao fim, no celular.",
      cta: "Encontrar eventos",
      items: [
        { icon: Search, t: "Descubra", d: "O que rola hoje, no fim de semana e pra onde os amigos vão." },
        { icon: Zap, t: "Compre em segundos", d: "Pix na hora ou cartão parcelado. Ingresso no WhatsApp na hora." },
        { icon: Ticket, t: "Entre rápido", d: "QR na carteira, funciona offline, sem fila na porta." },
        { icon: Gift, t: "Ganhe cashback", d: "Crédito que volta e paga parte do próximo rolê." },
      ],
    },
    trust: {
      title: "Seguro por design.",
      body: "Cada ingresso carrega um QR único com validação segura no servidor — nada de ingresso falso, duplicado ou dor de cabeça na porta. Por trás, ticketing seguro, proteção contra fraude e repasses confiáveis, sem ninguém precisar pensar na tecnologia por baixo.",
    },
    contact: {
      kicker: "Comece agora",
      title: "Quer levar sua próxima festa pra FestChain?",
      sub: "Fale com a gente no WhatsApp ou deixe seus dados. Sem burocracia — só uma conversa sobre a sua noite.",
      whatsapp: "Falar no WhatsApp",
      roleLabel: "Eu sou…",
      roles: ["Organizador", "Promoter", "DJ", "Marca", "Investidor"],
      nameL: "Nome", emailL: "E-mail", msgL: "Sobre sua festa",
      namePh: "Seu nome", emailPh: "voce@email.com", msgPh: "Nome da festa, cidade, data, como você vende hoje…",
      send: "Enviar", sending: "Enviando…",
      sentTitle: "Recebemos!", sentSub: "Vamos te chamar pra ajudar a colocar sua próxima festa no ar. Se quiser adiantar, fala com a gente no WhatsApp.",
      errTitle: "Erro", errSub: "Não conseguimos enviar. Tente de novo.",
    },
    footer: { tagline: "O sistema operacional da vida noturna. Feito no Brasil, começando por São Paulo.", rights: "Ticketing seguro · Proteção contra fraude · Repasse confiável" },
    ecosystem: {
      kicker: "O ecossistema",
      title: "Uma noite. Todo mundo ganha.",
      sub: "A FestChain não é só ticketing. É a infra da noite inteira — onde cada lado sai ganhando.",
      cards: [
        { icon: Users, t: "Organizadores", d: "Vendem mais, rodam a noite inteira (ingresso, bar, porta), recebem certo e ficam donos do próprio público e dos dados." },
        { icon: Ticket, t: "Público", d: "Compram em segundos no Pix, entram sem fila, ganham cashback que volta pra próxima e têm a noite inteira no celular." },
        { icon: Music, t: "DJs & artistas", d: "Constroem uma base de fãs que é deles, com reputação por presença real — quem lotou a pista, não quem inflou o Instagram." },
        { icon: TrendingUp, t: "Marcas & patrocinadores", d: "Financiam o cashback e transformam patrocínio em campanha medível, alcançando o público real do evento e pagando por resultado." },
      ],
    },
    waMsg: "Oi! Quero levar minha festa pra FestChain.",
  },
  en: {
    nav: { organizers: "For organizers", how: "How it works", crowd: "For the crowd", openApp: "Open app", login: "Log in", cta: "Bring your party" },
    hero: {
      badge: "Built for Brazil's nightlife",
      title1: "The operating system", title2: "for nightlife.",
      sub: "FestChain helps clubs, festivals, collectives and promoters sell more tickets, run the door, reward the people who show up, and turn a one-night crowd into an audience they actually own.",
      ctaPrimary: "Bring your party", ctaSecondary: "See how it works",
      note: "Automatic promoter commissions · Instant Pix checkout · Cashback that brings the crowd back",
    },
    strip: ["Lower fees", "Pix confirmed instantly", "Fraud protection", "Reliable payouts"],
    wedge: {
      kicker: "Why they switch",
      title: "Built for how nightlife actually sells.",
      sub: "Not generic events tooling. Built on the three things that fill a party in Brazil — promoters, WhatsApp and Instagram.",
      cards: [
        { icon: Users, t: "Promoters that sell", d: "Every promoter and RP gets their own link. Every sale is attributed automatically and commission is calculated for them. They see what they sold and what they'll earn, live. It's exactly where the other platforms are weakest." },
        { icon: Zap, t: "Instant Pix", d: "Checkout with instant Pix, card and installments for festival-tier prices. Auto-confirmed the moment payment lands, and the ticket arrives on the buyer's WhatsApp. No queue, no friction, more conversion." },
        { icon: Gift, t: "Cashback that returns", d: "Every ticket earns credit toward the next party. The crowd comes back — and you know exactly who they are. Duplicate the event in one tap and invite back everyone who came and everyone holding credit." },
      ],
    },
    own: {
      kicker: "Retention",
      title1: "An audience that is", title2: "actually yours.",
      p1: "On the usual platforms, the customer belongs to the platform — you're renting access to your own crowd. On FestChain, the audience, the data and the relationship are yours.",
      p2: "After the party, the cashback, the history and the contact stay with you. One tap duplicates the event and notifies everyone who came — plus everyone still holding credit to spend.",
      quote: "It's the retention loop a generic ticketing platform structurally can't close.",
      rows: [
        { i: "M", n: "Mari S.", s: "Last event · R$18 credit", b: "Returned" },
        { i: "P", n: "Pedro L.", s: "3 events · house promoter", b: "Returned" },
        { i: "J", n: "Jé + 4 friends", s: "Group · bought together", b: "Returned" },
        { i: "R", n: "Rafa D.", s: "R$30 credit unused", b: "Invite" },
      ],
    },
    how: {
      kicker: "For organizers",
      title: "From creation to the next sellout.",
      steps: [
        { icon: CalendarPlus, t: "Create", d: "Build the event in minutes — phases, line-up, set times and prices on one page. Save as a template and duplicate weekly parties in seconds." },
        { icon: Ticket, t: "Sell", d: "Activate your promoters with links and automatic commission. One tap shares to WhatsApp and Instagram. That's how the night sells." },
        { icon: DoorOpen, t: "Run the door", d: "Duplicate-proof QR check-in, multiple scanners, a live counter of who's inside. Guest list and comps with name-at-the-door." },
        { icon: Repeat, t: "Bring them back", d: "See revenue, sales by phase and by promoter in real time. Cashback and follows pull the crowd to the next one. The cycle restarts." },
      ],
    },
    crowd: {
      kicker: "For the crowd",
      title: "The whole night, start to finish, on your phone.",
      cta: "Find events",
      items: [
        { icon: Search, t: "Discover", d: "What's on tonight, this weekend, and where your friends are going." },
        { icon: Zap, t: "Buy in seconds", d: "Instant Pix or card in installments. Ticket on WhatsApp right away." },
        { icon: Ticket, t: "Get in fast", d: "QR in your wallet, works offline, no queue at the door." },
        { icon: Gift, t: "Earn cashback", d: "Credit that comes back and covers part of the next night out." },
      ],
    },
    trust: {
      title: "Secure by design.",
      body: "Every ticket carries a unique QR with secure server-side validation — no fakes, no doubles, no hassle at the door. Behind the scenes, secure ticketing, fraud protection and reliable payouts, without anyone needing to think about the technology underneath.",
    },
    contact: {
      kicker: "Get started",
      title: "Want to bring your next party to FestChain?",
      sub: "Message us on WhatsApp or leave your details. No red tape — just a conversation about your night.",
      whatsapp: "Message on WhatsApp",
      roleLabel: "I am a…",
      roles: ["Organizer", "Promoter", "DJ", "Brand", "Investor"],
      nameL: "Name", emailL: "Email", msgL: "About your party",
      namePh: "Your name", emailPh: "you@email.com", msgPh: "Party name, city, date, how you sell today…",
      send: "Send", sending: "Sending…",
      sentTitle: "Got it!", sentSub: "We'll reach out to help you get your next party live. Want to move faster? Message us on WhatsApp.",
      errTitle: "Error", errSub: "Could not submit. Please try again.",
    },
    footer: { tagline: "The operating system for nightlife. Built in Brazil, starting with São Paulo.", rights: "Secure ticketing · Fraud protection · Reliable payouts" },
    waMsg: "Hi! I want to run my event on FestChain.",
  },
};

export const getWaHref = (lang = "pt-BR") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(COPY[lang].waMsg)}`;