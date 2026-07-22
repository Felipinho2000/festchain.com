import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Ticket, Minus, Plus, ArrowRight, ArrowLeft, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const TIERS = [
  { key: "inteira", label: "Inteira", desc: "Preço cheio" },
  { key: "meia_estudante", label: "Meia-estudante", desc: "50% off · estudante" },
  { key: "meia_idoso", label: "Meia-idoso", desc: "50% off · +60 anos" },
];

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
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState("inteira");
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: "", cpf: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const basePrice = displayPrice || 0;
  const unitPrice = tier === "inteira" ? basePrice : Math.round(basePrice * 50) / 100;
  const total = unitPrice * quantity;
  const reward = event?.festcoin_reward || 0;

  const reset = () => {
    setStep(1);
    setTier("inteira");
    setQuantity(1);
    setForm({ name: "", cpf: "", email: "", phone: "" });
  };

  const handleSubmit = async () => {
    if (window.self !== window.top) {
      toast({ title: "Abra em nova aba", description: "O checkout só funciona no app publicado, não na prévia.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        event_id: event.id,
        ticket_type: "general",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            {step === 1 ? "Escolha seu ingresso" : "Seus dados"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {phase && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-primary font-semibold">{phase.name}</span>
                {phase.price != null && <span className="text-white font-medium">R$ {phase.price.toFixed(2)}</span>}
              </div>
            )}

            {/* Tier selection */}
            <div className="space-y-2">
              {TIERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTier(t.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    tier === t.key ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="text-xs text-[#666]">{t.desc}</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    R$ {(t.key === "inteira" ? basePrice : Math.round(basePrice * 50) / 100).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
              <span className="text-sm text-white font-medium">Quantidade</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white hover:bg-primary/20">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-white font-bold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(5, q + 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white hover:bg-primary/20">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total + reward */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <span className="text-sm text-[#888]">Total</span>
                {reward > 0 && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3" /> +{reward} FTC de recompensa
                  </p>
                )}
              </div>
              <span className="text-xl font-bold text-white">R$ {total.toFixed(2)}</span>
            </div>

            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl" onClick={() => setStep(2)}>
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-secondary/50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#888]">{TIERS.find((t) => t.key === tier).label} × {quantity}</span>
                <span className="text-white font-semibold">R$ {total.toFixed(2)}</span>
              </div>
              <p className="text-[#555] pt-1 border-t border-border flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-primary" /> Pix (instantâneo) ou cartão · ingresso enviado no WhatsApp
              </p>
            </div>

            {/* Buyer info form */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#888] mb-1.5 block">Nome completo</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome" className="bg-card border-border text-white placeholder:text-[#555] rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#888] mb-1.5 block">CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: formatCPF(e.target.value) }))}
                    placeholder="000.000.000-00" className="bg-card border-border text-white placeholder:text-[#555] rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-[#888] mb-1.5 block">WhatsApp</Label>
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                    placeholder="(11) 99999-9999" className="bg-card border-border text-white placeholder:text-[#555] rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#888] mb-1.5 block">E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="voce@email.com" className="bg-card border-border text-white placeholder:text-[#555] rounded-xl" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 rounded-xl px-4" onClick={() => setStep(1)} disabled={submitting}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl" onClick={handleSubmit} disabled={submitting || !canSubmit}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirecionando...
                  </span>
                ) : (
                  <>Pagar R$ {total.toFixed(2)}</>
                )}
              </Button>
            </div>

            <p className="text-[10px] text-[#555] text-center">
              Ao comprar um ingresso você aceita os{" "}
              <Link to="/legal" className="text-primary hover:underline">termos do piloto</Link>.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}