import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Ticket,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";

const TIERS = [
  { key: "inteira", label: "Inteira", desc: "Preço cheio" },
  { key: "meia_estudante", label: "Meia-estudante", desc: "50% off · estudante" },
  { key: "meia_idoso", label: "Meia-idoso", desc: "50% off · +60 anos" },
];

const TICKET_TYPE_LABELS = { general: "Geral", vip: "VIP", backstage: "Backstage" };

function formatCPF(value) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatPhone(value) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CheckoutDialog({ event, phase, displayPrice, open, onOpenChange }) {
  const { toast } = useToast();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState("inteira");
  const [ticketType, setTicketType] = useState("general");
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: "", cpf: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  // A tier is only offered if it has a real price on the active phase or the
  // event itself — an organizer who never set vip_price/backstage_price
  // doesn't sell that tier, so it never appears as a choice. Matches
  // createCheckoutSession's own null check on the same fields.
  const tierPrice = (type) => {
    if (type === "general") return displayPrice || 0;
    const fromPhase = phase && phase[`${type}_price`];
    const fromEvent = event && event[`${type}_price`];
    return fromPhase != null ? fromPhase : fromEvent;
  };
  const availableTypes = ["general", "vip", "backstage"].filter((type) => tierPrice(type) != null);

  const basePrice = tierPrice(ticketType) || 0;
  const unitPrice = tier === "inteira" ? basePrice : Math.round(basePrice * 50) / 100;
  const total = unitPrice * quantity;
  const reward = event?.festcoin_reward || 0;

  const reset = () => {
    setStep(1);
    setTier("inteira");
    setTicketType("general");
    setQuantity(1);
    setForm({ name: "", cpf: "", email: "", phone: "" });
  };

  const handleSubmit = async () => {
    if (window.self !== window.top) {
      toast({ title: "Abra em nova aba", description: "O checkout só funciona no app publicado, não na prévia.", variant: "destructive" });
      return;
    }
    // Defense in depth: the UI already routes signed-out buyers to login
    // before this point, but createCheckoutSession rejects anonymous calls
    // server-side and a raw 401 toast would be a dead end.
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        event_id: event.id,
        ticket_type: ticketType,
        ticket_tier: tier,
        quantity,
        buyer_name: form.name,
        buyer_cpf: form.cpf.replace(/\D/g, ""),
        buyer_document_type: "cpf",
        buyer_phone: form.phone.replace(/\D/g, ""),
        buyer_email: form.email,
      });
      const data = res.data || res;
      if (data.status === "success" && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast({ title: "Erro no checkout", description: data.message || "Tente novamente", variant: "destructive" });
        setSubmitting(false);
      }
    } catch (e) {
      toast({ title: "Erro no checkout", description: e.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  const handleClose = (open) => {
    if (!open && !submitting) reset();
    onOpenChange(open);
  };

  const cpfValid = form.cpf.replace(/\D/g, "").length === 11;
  const phoneValid = form.phone.replace(/\D/g, "").length >= 10;
  const canSubmit = form.name.trim() && cpfValid && form.email.trim() && phoneValid;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-foreground">
            <Ticket className="w-5 h-5 text-primary" strokeWidth={1.75} />
            {step === 1 ? "Escolha seu ingresso" : "Seus dados"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {phase && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-primary font-semibold">{phase.name}</span>
                {phase.price != null && <span className="text-foreground font-medium">R$ {phase.price.toFixed(2)}</span>}
              </div>
            )}

            {availableTypes.length > 1 && (
              <div className="flex gap-2">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTicketType(type)}
                    className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-all ${
                      ticketType === type ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-secondary hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xs font-semibold text-foreground">{TICKET_TYPE_LABELS[type]}</span>
                    <span className="text-[10px] text-muted-foreground">R$ {(tierPrice(type) || 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {TIERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTier(t.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    tier === t.key ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-secondary hover:border-primary/30"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    R$ {(t.key === "inteira" ? basePrice : Math.round(basePrice * 50) / 100).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between bg-secondary border border-border rounded-xl p-3">
              <span className="text-sm text-foreground font-medium">Quantidade</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-foreground hover:bg-primary/20 transition-colors">
                  <Minus className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <span className="text-foreground font-bold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(5, q + 1))} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-foreground hover:bg-primary/20 transition-colors">
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <span className="text-sm text-muted-foreground">Total</span>
                {reward > 0 && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3" strokeWidth={2} /> +{reward} FTC de recompensa
                  </p>
                )}
              </div>
              <span className="font-heading font-bold text-xl text-foreground">R$ {total.toFixed(2)}</span>
            </div>

            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-glow" onClick={() => setStep(2)}>
              Continuar <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.75} />
            </Button>
          </div>
        ) : !isAuthenticated ? (
          /* Signed-out buyers stop here instead of filling in four fields they
             would lose on the redirect. The ticket has to belong to an account
             so it can live in a wallet and be validated at the door. */
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{TIERS.find((t) => t.key === tier).label} × {quantity}</span>
                <span className="text-foreground font-semibold">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center py-2 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-foreground">Entra pra garantir teu ingresso</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Leva 30 segundos. O ingresso fica salvo na tua carteira, com QR próprio pra validar na porta.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="h-11 rounded-xl px-4" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              </Button>
              <Button
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-glow"
                onClick={() => navigateToLogin()}
              >
                Entrar e continuar <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{TIERS.find((t) => t.key === tier).label} × {quantity}</span>
                <span className="text-foreground font-semibold">R$ {total.toFixed(2)}</span>
              </div>
              <p className="text-muted-foreground pt-1 border-t border-border flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-primary" strokeWidth={1.75} /> Pix ou cartão · ingresso no WhatsApp
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Nome completo</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome" className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: formatCPF(e.target.value) }))}
                    placeholder="000.000.000-00" className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">WhatsApp</Label>
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                    placeholder="(11) 99999-9999" className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="voce@email.com" className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl" />
              </div>
            </div>

            {event?.refund_policy && event.refund_policy !== "caso_a_caso" && (
              <div className="bg-secondary rounded-lg p-2.5 flex items-start gap-1.5">
                <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-[10px] text-muted-foreground">
                  {event.refund_policy === "ate_7_dias" && "Reembolso disponível até 7 dias antes do evento, mediante solicitação."}
                  {event.refund_policy === "ate_48h" && "Reembolso disponível até 48h antes do evento, mediante solicitação."}
                  {event.refund_policy === "sem_reembolso" && "Este evento não oferece reembolso. Confirme a data antes de comprar."}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="h-11 rounded-xl px-4" onClick={() => setStep(1)} disabled={submitting}>
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              </Button>
              <Button className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-glow" onClick={handleSubmit} disabled={submitting || !canSubmit}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirecionando...
                  </span>
                ) : (
                  <>Pagar R$ {total.toFixed(2)}</>
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Ao comprar um ingresso você aceita os{" "}
              <Link to="/legal" className="text-primary hover:underline">termos do piloto</Link>.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}