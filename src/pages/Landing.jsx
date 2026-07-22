import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Users, Zap, Gift, ShieldCheck, Check, ChevronRight, Menu, X, ArrowRight,
  Mail, MapPin, Send, MessageCircle, Ticket, TrendingUp, CalendarPlus,
  DoorOpen, Repeat, Search, Wallet as WalletIcon, Wine, Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/shared/Logo";

/* ─────────────────────────────────────────────────────────────
   CONFIG — swap these two before going live:
     WHATSAPP_NUMBER: international format, 55 + DDD + number
     CONTACT_EMAIL:   where the pilot form + footer point
   ───────────────────────────────────────────────────────────── */
const WHATSAPP_NUMBER = "5511999999999";
const CONTACT_EMAIL = "contato@festchain.com";

/* Bilingual copy, self-contained so it rides on the existing LanguageSwitcher
   (lang comes from useLanguage) without touching the shared translations file. */
const COPY = {
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

export default function Landing() {
  const { currentUser } = useAuth();
  const authed = !!currentUser;
  const { toast } = useToast();
  const c = COPY["pt-BR"];

  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", role: c.contact.roles[0] });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const findEventsTo = authed ? "/events" : "/register";
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(c.waMsg)}`;

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.entities.PilotApplication.create({
        name: form.name, email: form.email, role: form.role || "",
        message: form.message, status: "new", source: "landing_form",
      });
      base44.integrations.Core.SendEmail({
        to: CONTACT_EMAIL,
        subject: `Pilot application — ${form.name}${form.role ? ` (${form.role})` : ""}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nRole: ${form.role || "not specified"}\nMessage: ${form.message}`,
      }).catch(() => {});
      setSent(true);
      toast({ title: c.contact.sentTitle, description: c.contact.sentSub });
    } catch (err) {
      toast({ title: c.contact.errTitle, description: c.contact.errSub, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const NavLinks = ({ onClick }) => (
    <>
      <a href="#promoters" onClick={onClick} className="hover:text-white transition-colors">{c.nav.organizers}</a>
      <a href="#how" onClick={onClick} className="hover:text-white transition-colors">{c.nav.how}</a>
      <a href="#crowd" onClick={onClick} className="hover:text-white transition-colors">{c.nav.crowd}</a>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-body">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link to="/"><Logo size={28} /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#888]"><NavLinks /></div>
          <div className="flex items-center gap-2">
            {authed ? (
              <Link to="/app" className="hidden sm:block">
                <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">
                  {c.nav.openApp} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
                <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-xl text-sm font-semibold">
                  {c.nav.cta}
                </Button>
              </a>
            )}
            <button className="md:hidden p-2 text-[#888] hover:text-white" onClick={() => setMenuOpen((m) => !m)} aria-label="Menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#1f1f1f] px-5 py-4 flex flex-col gap-3 text-sm text-[#888]">
            <NavLinks onClick={() => setMenuOpen(false)} />
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="text-primary font-semibold">
              {c.nav.cta}
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-36 pb-20 px-5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {c.hero.badge}
          </div>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6">
            {c.hero.title1}<br /><span className="text-primary">{c.hero.title2}</span>
          </h1>
          <p className="text-[#aaa] text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">{c.hero.sub}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold text-base">
                <MessageCircle className="w-5 h-5 mr-2" strokeWidth={2} /> {c.hero.ctaPrimary}
              </Button>
            </a>
            <a href="#promoters">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-7 rounded-xl font-semibold text-sm border-[#333] text-white hover:bg-[#1a1a1a]">
                {c.hero.ctaSecondary}
              </Button>
            </a>
          </div>
          <p className="text-sm text-[#666]">{c.hero.note}</p>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="border-t border-b border-[#1f1f1f] bg-[#111]">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap justify-center gap-x-10 gap-y-2.5">
          {c.strip.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-[#aaa] text-sm font-medium">
              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── WEDGE ── */}
      <section id="promoters" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.wedge.kicker}</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4 leading-tight">{c.wedge.title}</h2>
            <p className="text-[#aaa] text-base leading-relaxed">{c.wedge.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.wedge.cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-7 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-xl mb-2.5">{card.t}</h3>
                  <p className="text-[#888] text-sm leading-relaxed">{card.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM: EVERYONE WINS ── */}
      <section className="py-20 px-5 bg-[#111] border-t border-b border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.ecosystem.kicker}</p>
            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl text-white uppercase leading-[1.05] mb-4">{c.ecosystem.title}</h2>
            <p className="text-[#aaa] text-base leading-relaxed max-w-2xl mx-auto">{c.ecosystem.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.ecosystem.cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-lg mb-2">{card.t}</h3>
                  <p className="text-[#888] text-sm leading-relaxed">{card.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.how.kicker}</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">{c.how.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {c.how.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 hover:border-primary/30 transition-all relative">
                  <div className="absolute top-5 right-5 text-xs font-bold text-primary font-heading">0{i + 1}</div>
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-base mb-1.5">{step.t}</h3>
                  <p className="text-[#888] text-sm leading-relaxed">{step.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOR THE CROWD ── */}
      <section id="crowd" className="py-20 px-5 bg-[#111] border-t border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.crowd.kicker}</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">{c.crowd.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {c.crowd.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i}>
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-heading font-bold text-white text-base mb-1.5">{item.t}</h4>
                  <p className="text-[#888] text-sm leading-relaxed">{item.d}</p>
                </div>
              );
            })}
          </div>
          <Link to={findEventsTo}>
            <Button className="bg-primary hover:bg-primary/90 text-white h-11 px-6 rounded-xl font-semibold text-sm">
              <Search className="w-4 h-4 mr-2" /> {c.crowd.cta}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-16 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white mb-3">{c.trust.title}</h2>
          <p className="text-[#aaa] text-sm sm:text-base leading-relaxed">{c.trust.body}</p>
        </div>
      </section>

      {/* ── CONTACT / CTA ── */}
      <section id="contact" className="py-16 px-5 bg-[#111] border-t border-[#1f1f1f]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.contact.kicker}</p>
            <h2 className="font-heading font-bold text-3xl text-white mb-3">{c.contact.title}</h2>
            <p className="text-[#888] text-sm mb-6">{c.contact.sub}</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-xl font-bold text-base">
                <MessageCircle className="w-5 h-5 mr-2" /> {c.contact.whatsapp}
              </Button>
            </a>
          </div>

          {sent ? (
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">{c.contact.sentTitle}</h3>
              <p className="text-[#888] text-sm">{c.contact.sentSub}</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{c.contact.nameL}</label>
                  <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder={c.contact.namePh} />
                </div>
                <div>
                  <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{c.contact.emailL}</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors" placeholder={c.contact.emailPh} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{c.contact.roleLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {c.contact.roles.map((r) => (
                    <button key={r} type="button" onClick={() => setForm((p) => ({ ...p, role: r }))}
                      className={"px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors " + (form.role === r ? "bg-primary/20 border-primary text-primary" : "bg-[#111] border-[#2a2a2a] text-[#666] hover:border-primary/50 hover:text-white")}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] uppercase tracking-wide block mb-1.5">{c.contact.msgL}</label>
                <textarea required value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={3}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-primary transition-colors resize-none" placeholder={c.contact.msgPh} />
              </div>
              <Button type="submit" disabled={sending || !form.name || !form.email} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base">
                {sending ? c.contact.sending : c.contact.send} <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-sm text-[#888]">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {CONTACT_EMAIL}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> São Paulo, BR</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-5 border-t border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Link to="/"><Logo size={24} /></Link>
            <p className="text-[#555] text-xs text-center sm:text-left max-w-xs">{c.footer.tagline}</p>
          </div>
          <div className="flex items-center gap-4 text-[#777] text-sm">
            <Link to="/legal" className="hover:text-white transition-colors">Confiança &amp; Segurança</Link>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            <a href="#contact" className="hover:text-white transition-colors">{c.contact.kicker}</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-5 border-t border-[#1f1f1f] flex flex-col sm:flex-row justify-between gap-2 text-[#555] text-xs">
          <span>© {new Date().getFullYear()} FestChain</span>
          <span>{c.footer.rights}</span>
        </div>
      </footer>
    </div>
  );
}