import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, LayoutDashboard, PartyPopper, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function ModeSwitcher() {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mode = currentUser?.active_mode || "partygoer";
  const canOrganize = currentUser?.role === "admin" || currentUser?.approved_organizer === true;
  const hasProfile = !!currentUser?.organizer_profile && !!currentUser.organizer_profile.brand_name;
  const [onbOpen, setOnbOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [form, setForm] = useState({ organizer_name: "", brand_name: "", instagram: "", city: "" });

  const switchTo = async (newMode, opts = {}) => {
    setSwitching(true);
    try {
      const payload = { active_mode: newMode };
      if (opts.profile) payload.organizer_profile = opts.profile;
      await base44.auth.updateMe(payload);
      await refreshUser?.();
      toast({ title: newMode === "organizer" ? "🎛 Modo organizador" : "🎉 Modo participante", description: opts.profile ? "Perfil de organizador salvo." : undefined });
      if (newMode === "organizer" && opts.goDashboard) {
        navigate(canOrganize ? "/dashboard" : "/dashboard/events/new");
      }
    } catch (e) {
      toast({ title: "Não foi possível trocar o modo", description: e.message, variant: "destructive" });
    } finally {
      setSwitching(false);
    }
  };

  const selectParticipante = () => { if (mode !== "partygoer") switchTo("partygoer"); };

  const selectOrganizer = () => {
    // Switching the mode never grants organizer permissions by itself — that
    // boundary is enforced server-side by saveEvent. A non-approved user who
    // picks Organizador is taken straight to event creation, where they can
    // configure everything and save it as a draft pending review, instead of
    // hitting a dead end here.
    if (canOrganize && !hasProfile) { setOnbOpen(true); return; }
    switchTo("organizer", { goDashboard: true });
  };

  const completeOnboarding = async () => {
    if (!form.organizer_name.trim() || !form.brand_name.trim()) {
      toast({ title: "Adicione seu nome e o nome da marca", variant: "destructive" });
      return;
    }
    setSaving(true);
    setOnbOpen(false);
    await switchTo("organizer", { profile: { ...form }, goDashboard: true });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Cog className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="font-heading font-semibold text-foreground text-sm">Modo de uso</h2>
      </div>
      <p className="text-muted-foreground text-xs mb-4">Uma conta, dois modos. Trocar o modo aqui nunca concede permissões de organizador — isso depende de aprovação.</p>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={selectParticipante} disabled={switching}
          className={`text-left rounded-xl border p-4 transition-all ${mode === "partygoer" ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-muted-foreground/40"}`}>
          <PartyPopper className={`w-5 h-5 mb-2 ${mode === "partygoer" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
          <p className="font-semibold text-foreground text-sm">🎉 Participante</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ingressos, carteira, eventos</p>
        </button>

        <button onClick={selectOrganizer} disabled={switching}
          className={`text-left rounded-xl border p-4 transition-all ${mode === "organizer" && canOrganize ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-muted-foreground/40"}`}>
          <LayoutDashboard className={`w-5 h-5 mb-2 ${mode === "organizer" && canOrganize ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
          <p className="font-semibold text-foreground text-sm">🎛 Organizador</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{canOrganize ? "Criar, vender, validar" : "Criar evento agora"}</p>
        </button>
      </div>

      {mode === "organizer" && canOrganize && hasProfile && (
        <p className="text-[10px] text-muted-foreground/70 mt-3">
          Marca: <span className="text-muted-foreground">{currentUser.organizer_profile.brand_name}</span>
          {currentUser.organizer_profile.city ? ` · ${currentUser.organizer_profile.city}` : ""}
        </p>
      )}
      {!canOrganize && (
        <p className="text-[10px] text-warning mt-3">Publicação sujeita a revisão da equipe FestChain — você já pode configurar seu evento e salvar como rascunho.</p>
      )}

      {/* Onboarding (only reachable if canOrganize) */}
      <Dialog open={onbOpen} onOpenChange={setOnbOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Configure seu perfil de organizador</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm -mt-2 mb-3">Salvo uma vez. Você pode editar depois. A FestChain está em piloto privado.</p>
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground mb-1.5">Seu nome</Label>
              <Input value={form.organizer_name} onChange={e => setForm({ ...form, organizer_name: e.target.value })} placeholder="Seu nome" className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground mb-1.5">Nome da marca/produtora</Label>
              <Input value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} placeholder="ex: Sunrise Collective" className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground mb-1.5">Instagram</Label>
                <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@perfil" className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground mb-1.5">Cidade</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="São Paulo" className="bg-secondary border-border" />
              </div>
            </div>
            <Button onClick={completeOnboarding} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {saving ? "Salvando..." : "Abrir painel do organizador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
