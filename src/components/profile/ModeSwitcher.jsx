import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, LayoutDashboard, PartyPopper, Cog, ShieldCheck } from "lucide-react";
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
  const [accessOpen, setAccessOpen] = useState(false);
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
      toast({ title: newMode === "organizer" ? "🎛 Organizer view" : "🎉 Partygoer view", description: opts.profile ? "Organizer profile saved." : undefined });
      if (newMode === "organizer" && opts.goDashboard) navigate("/dashboard");
    } catch (e) {
      toast({ title: "Could not switch view", description: e.message, variant: "destructive" });
    } finally {
      setSwitching(false);
    }
  };

  const selectPartygoer = () => { if (mode !== "partygoer") switchTo("partygoer"); };

  const selectOrganizer = () => {
    if (!canOrganize) { setAccessOpen(true); return; }
    if (!hasProfile) { setOnbOpen(true); return; }
    switchTo("organizer", { goDashboard: true });
  };

  const completeOnboarding = async () => {
    if (!form.organizer_name.trim() || !form.brand_name.trim()) {
      toast({ title: "Add your name and brand name", variant: "destructive" });
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
        <Cog className="w-4 h-4 text-[#888]" strokeWidth={1.5} />
        <h2 className="font-heading font-semibold text-white text-sm">Switch View</h2>
      </div>
      <p className="text-[#666] text-xs mb-4">One account, two views. Switching your view never grants organizer permissions — those require admin approval.</p>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={selectPartygoer} disabled={switching}
          className={`text-left rounded-xl border p-4 transition-all ${mode === "partygoer" ? "border-primary bg-primary/10" : "border-border bg-[#111] hover:border-[#444]"}`}>
          <PartyPopper className={`w-5 h-5 mb-2 ${mode === "partygoer" ? "text-primary" : "text-[#666]"}`} strokeWidth={1.5} />
          <p className="font-semibold text-white text-sm">🎉 Partygoer</p>
          <p className="text-[10px] text-[#666] mt-0.5">Attend, wallet, tickets</p>
        </button>

        <button onClick={selectOrganizer} disabled={switching}
          className={`text-left rounded-xl border p-4 transition-all ${mode === "organizer" && canOrganize ? "border-primary bg-primary/10" : "border-border bg-[#111] hover:border-[#444]"}`}>
          <LayoutDashboard className={`w-5 h-5 mb-2 ${mode === "organizer" && canOrganize ? "text-primary" : "text-[#666]"}`} strokeWidth={1.5} />
          <p className="font-semibold text-white text-sm">🎛 Organizer</p>
          <p className="text-[10px] text-[#666] mt-0.5">{canOrganize ? "Create, sell, verify" : "Requires approval"}</p>
        </button>
      </div>

      {mode === "organizer" && canOrganize && hasProfile && (
        <p className="text-[10px] text-[#555] mt-3">
          Brand: <span className="text-[#888]">{currentUser.organizer_profile.brand_name}</span>
          {currentUser.organizer_profile.city ? ` · ${currentUser.organizer_profile.city}` : ""}
        </p>
      )}
      {mode === "organizer" && !canOrganize && (
        <p className="text-[10px] text-amber-400 mt-3">Organizer access pending admin approval. Tools remain hidden until approved.</p>
      )}

      {/* Onboarding (only reachable if canOrganize) */}
      <Dialog open={onbOpen} onOpenChange={setOnbOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Set up your organizer profile</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-sm -mt-2 mb-3">Saved once. You can edit later. FestChain is in private pilot.</p>
          <div className="space-y-3">
            <div>
              <Label className="text-[#888] mb-1.5">Organizer Name</Label>
              <Input value={form.organizer_name} onChange={e => setForm({ ...form, organizer_name: e.target.value })} placeholder="Your name" className="bg-[#111] border-border" />
            </div>
            <div>
              <Label className="text-[#888] mb-1.5">Brand Name</Label>
              <Input value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} placeholder="e.g. Sunrise Collective" className="bg-[#111] border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#888] mb-1.5">Instagram</Label>
                <Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@handle" className="bg-[#111] border-border" />
              </div>
              <div>
                <Label className="text-[#888] mb-1.5">City</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="São Paulo" className="bg-[#111] border-border" />
              </div>
            </div>
            <Button onClick={completeOnboarding} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white h-11">
              {saving ? "Saving..." : "Open Organizer Dashboard"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access required */}
      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Organizer access required</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-sm -mt-2 mb-3">Organizer tools (dashboard &amp; scanner) are gated for the private MVP pilot. Access is granted manually by the FestChain admin team — switching your view here doesn't unlock it.</p>
          <p className="text-[#666] text-xs mb-4">To request access, contact the project owner who invited you to the pilot.</p>
          <Button onClick={() => setAccessOpen(false)} className="w-full bg-primary hover:bg-primary/90 text-white h-11">Got it</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}