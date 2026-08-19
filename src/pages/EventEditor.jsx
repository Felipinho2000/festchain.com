import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeft, Plus, Trash2, ImagePlus, Loader2, Music, Calendar,
  Ticket as TicketIcon, Save, Clock, Coins, Sparkles, ShieldCheck,
  ChevronDown, CheckCircle2, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const GENRES = ["techno","house","trance","drum_and_bass","hip_hop","reggaeton","funk","pop","rock","sertanejo","other"];
const genreLabel = (g) => g.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const GENRE_PRICING = {
  techno:         { min: 40,  max: 120, typical: 60 },
  house:          { min: 40,  max: 100, typical: 50 },
  trance:         { min: 50,  max: 150, typical: 80 },
  drum_and_bass:  { min: 30,  max: 80,  typical: 45 },
  hip_hop:        { min: 25,  max: 60,  typical: 40 },
  reggaeton:      { min: 30,  max: 70,  typical: 40 },
  funk:           { min: 20,  max: 50,  typical: 30 },
  pop:            { min: 40,  max: 120, typical: 60 },
  rock:           { min: 40,  max: 100, typical: 60 },
  sertanejo:      { min: 40,  max: 150, typical: 80 },
  other:          { min: 30,  max: 80,  typical: 40 },
};

const SUGGESTED_PHASES = [
  { name: "Early Bird",  pct: 0.55, reward: 60 },
  { name: "Lote 2",      pct: 0.75, reward: 50 },
  { name: "Lote 3",      pct: 0.90, reward: 40 },
  { name: "Últimos",     pct: 1.15, reward: 20 },
];

const toLocal = (iso) => iso ? moment(iso).format("YYYY-MM-DDTHH:mm") : "";
const fromLocal = (val) => val ? moment(val).toISOString() : null;

const defaultPhases = () => {
  const now = moment();
  return [
    { name: "Early Bird", price: 30, quantity: 50, sales_start: now.clone().toISOString(), sales_end: now.clone().add(14, "days").toISOString(), active: true, festcoin_reward: 50 },
    { name: "Phase 1", price: 40, quantity: 100, sales_start: now.clone().add(14, "days").toISOString(), sales_end: now.clone().add(28, "days").toISOString(), active: true, festcoin_reward: 40 },
    { name: "Phase 2", price: 50, quantity: 100, sales_start: now.clone().add(28, "days").toISOString(), sales_end: now.clone().add(42, "days").toISOString(), active: true, festcoin_reward: 30 },
    { name: "Last Ones", price: 60, quantity: 50, sales_start: now.clone().add(42, "days").toISOString(), sales_end: now.clone().add(56, "days").toISOString(), active: true, festcoin_reward: 20 },
  ];
};

const emptyForm = {
  title: "", description: "", genre: "techno", date: "", end_date: "",
  location_name: "", location_address: "", image_url: "",
  ticket_price: "40", vip_price: "", backstage_price: "", festcoin_reward: "50", total_capacity: "200",
  status: "published", visibility: "public",
  ticket_phases: defaultPhases(),
  lineup: [],
  schedule: [],
  currency_code: "BRL",
  ftc_enabled: false,
  ftc_conversion_rate: "1",
  ftc_discount_percent: "0",
  ftc_cashback_enabled: false,
  ftc_cashback_percent: "0",
  ftc_cashback_on_ftc_purchase: false,
  ftc_pilot_mode: true,
  refund_policy: "caso_a_caso",
};

function Section({ step, title, icon: Icon, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-soft">
      <div>
        <h2 className="font-heading font-semibold text-foreground text-base flex items-center gap-2">
          {step != null && (
            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">{step}</span>
          )}
          <Icon className="w-4 h-4 text-primary" strokeWidth={1.75} />{title}
        </h2>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 ml-7">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// "Antes de publicar" — a plain readiness summary computed from what's
// already on screen. Only checks things this form can actually verify;
// products/cardápio live on a different page (they need the event to exist
// first), so that line stays an informational note rather than a checkbox
// pretending to know something it can't.
function ReadinessSummary({ form }) {
  const items = [
    { label: "Informações principais", ok: !!(form.title && form.date && form.location_name) },
    { label: "Ingressos configurados", ok: parseFloat(form.ticket_price) > 0 || form.ticket_phases.some(p => parseFloat(p.price) >= 0 && parseInt(p.quantity) > 0) },
    { label: "Capacidade definida", ok: parseInt(form.total_capacity) > 0 },
    { label: "Lineup adicionado — opcional", ok: form.lineup.length > 0, optional: true },
  ];
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          {it.ok ? (
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.75} />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" strokeWidth={1.75} />
          )}
          <span className={it.ok ? "text-foreground" : "text-muted-foreground"}>{it.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-sm">
        <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" strokeWidth={1.75} />
        <span className="text-muted-foreground">Adicionar produtos (cardápio) — opcional, disponível depois de salvar</span>
      </div>
    </div>
  );
}

export default function EventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isEdit = !!id;
  const canOrganize = currentUser?.role === "admin" || currentUser?.approved_organizer === true;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasSoldTickets, setHasSoldTickets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isEdit) return;
    const cap = parseInt(form.total_capacity);
    if (!cap || cap < 1) return;
    setForm(p => {
      const per = Math.floor(cap / p.ticket_phases.length);
      const remainder = cap - per * p.ticket_phases.length;
      return {
        ...p,
        ticket_phases: p.ticket_phases.map((ph, i) => ({
          ...ph,
          quantity: per + (i < remainder ? 1 : 0),
        })),
      };
    });
  }, [form.total_capacity, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    base44.entities.Event.get(id)
      .then(ev => {
        setForm({
          title: ev.title || "", description: ev.description || "", genre: ev.genre || "techno",
          date: toLocal(ev.date), end_date: toLocal(ev.end_date),
          location_name: ev.location_name || "", location_address: ev.location_address || "",
          image_url: ev.image_url || "",
          ticket_price: ev.ticket_price?.toString() || "40",
          vip_price: ev.vip_price != null ? ev.vip_price.toString() : "",
          backstage_price: ev.backstage_price != null ? ev.backstage_price.toString() : "",
          festcoin_reward: ev.festcoin_reward?.toString() || "50",
          total_capacity: ev.total_capacity?.toString() || "200",
          status: ev.status || "published", visibility: ev.visibility || "public",
          ticket_phases: ev.ticket_phases?.length ? ev.ticket_phases : defaultPhases(),
          lineup: ev.lineup?.length ? ev.lineup : (ev.dj_lineup || []).map(n => ({ name: n, bio: "", social_link: "", set_time: "" })),
          schedule: ev.schedule || [],
          currency_code: ev.currency_code || "BRL",
          ftc_enabled: ev.ftc_enabled || false,
          ftc_conversion_rate: ev.ftc_conversion_rate?.toString() || "1",
          ftc_discount_percent: ev.ftc_discount_percent?.toString() || "0",
          ftc_cashback_enabled: ev.ftc_cashback_enabled || false,
          ftc_cashback_percent: ev.ftc_cashback_percent?.toString() || "0",
          ftc_cashback_on_ftc_purchase: ev.ftc_cashback_on_ftc_purchase || false,
          ftc_pilot_mode: ev.ftc_pilot_mode !== false,
          refund_policy: ev.refund_policy || "caso_a_caso",
        });
        setHasSoldTickets((ev.tickets_sold || 0) > 0);
      })
      .catch(() => { toast({ title: "Evento não encontrado", variant: "destructive" }); navigate("/dashboard"); })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set("image_url", res.file_url);
    } catch (err) {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updatePhase = (i, k, v) => setForm(p => {
    const phases = [...p.ticket_phases]; phases[i] = { ...phases[i], [k]: v }; return { ...p, ticket_phases: phases };
  });
  const addPhase = () => setForm(p => ({ ...p, ticket_phases: [...p.ticket_phases, { name: "", price: 0, quantity: 0, sales_start: moment().toISOString(), sales_end: moment().add(7, "days").toISOString(), active: true, festcoin_reward: 0 }] }));
  const removePhase = (i) => setForm(p => ({ ...p, ticket_phases: p.ticket_phases.filter((_, idx) => idx !== i) }));

  const suggestPhasePrices = () => {
    const base = parseFloat(form.ticket_price) || GENRE_PRICING[form.genre]?.typical || 40;
    setForm(p => ({
      ...p,
      ticket_phases: p.ticket_phases.map((ph, i) => {
        const sug = SUGGESTED_PHASES[i % SUGGESTED_PHASES.length];
        const cap = parseInt(p.total_capacity) || 200;
        const qty = Math.round(cap / p.ticket_phases.length);
        return {
          ...ph,
          name: ph.name || sug.name,
          price: Math.round(base * sug.pct),
          quantity: ph.quantity || qty,
          festcoin_reward: sug.reward,
        };
      }),
    }));
    toast({ title: "Preços sugeridos!", description: `Base: R$ ${base} · lotes calculados automaticamente.` });
  };

  const updateLineup = (i, k, v) => setForm(p => { const l = [...p.lineup]; l[i] = { ...l[i], [k]: v }; return { ...p, lineup: l }; });
  const addLineup = () => setForm(p => ({ ...p, lineup: [...p.lineup, { name: "", bio: "", social_link: "", set_time: "" }] }));
  const removeLineup = (i) => setForm(p => ({ ...p, lineup: p.lineup.filter((_, idx) => idx !== i) }));

  const updateSchedule = (i, k, v) => setForm(p => { const s = [...p.schedule]; s[i] = { ...s[i], [k]: v }; return { ...p, schedule: s }; });
  const addSchedule = () => setForm(p => ({ ...p, schedule: [...p.schedule, { time: "", title: "", description: "" }] }));
  const removeSchedule = (i) => setForm(p => ({ ...p, schedule: p.schedule.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title || !form.date || !form.location_name || !form.total_capacity) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      genre: form.genre,
      date: fromLocal(form.date),
      end_date: fromLocal(form.end_date) || undefined,
      location_name: form.location_name,
      location_address: form.location_address,
      image_url: form.image_url,
      ticket_price: parseFloat(form.ticket_price) || 0,
      // null (not 0) means "this event doesn't sell this tier" — an organizer
      // clearing the field is how a VIP/Backstage tier gets removed, not how
      // it becomes free. createCheckoutSession already refuses ticket_type
      // requests where both the phase and event price are null/undefined.
      vip_price: form.vip_price.trim() === "" ? null : (parseFloat(form.vip_price) || 0),
      backstage_price: form.backstage_price.trim() === "" ? null : (parseFloat(form.backstage_price) || 0),
      festcoin_reward: parseInt(form.festcoin_reward) || 50,
      total_capacity: parseInt(form.total_capacity) || 100,
      status: form.status,
      visibility: form.visibility,
      organizer_name: currentUser?.full_name || "Organizer",
      ticket_phases: form.ticket_phases.map(p => ({
        name: p.name || "Phase",
        price: parseFloat(p.price) || 0,
        quantity: parseInt(p.quantity) || 0,
        sales_start: p.sales_start,
        sales_end: p.sales_end,
        active: !!p.active,
        festcoin_reward: parseInt(p.festcoin_reward) || 0
      })),
      lineup: form.lineup.filter(d => d.name).map(d => ({ name: d.name, bio: d.bio, social_link: d.social_link, set_time: d.set_time })),
      schedule: form.schedule.filter(s => s.title).map(s => ({ time: s.time, title: s.title, description: s.description })),
      dj_lineup: form.lineup.filter(d => d.name).map(d => d.name),
      currency_code: form.currency_code || "BRL",
      ftc_enabled: form.ftc_enabled,
      ftc_conversion_rate: parseFloat(form.ftc_conversion_rate) || 1,
      ftc_discount_percent: Math.max(0, Math.min(100, parseFloat(form.ftc_discount_percent) || 0)),
      ftc_cashback_enabled: form.ftc_cashback_enabled,
      ftc_cashback_percent: Math.max(0, Math.min(100, parseFloat(form.ftc_cashback_percent) || 0)),
      ftc_cashback_on_ftc_purchase: form.ftc_cashback_on_ftc_purchase,
      ftc_pilot_mode: form.ftc_pilot_mode,
      refund_policy: form.refund_policy,
    };
    // Events are written exclusively through the saveEvent backend function.
    // Direct Event.create/update from the browser is blocked by RLS now: the
    // server is what checks `approved_organizer`, ownership, capacity-vs-sold
    // and the post-sale refund-policy freeze. Never call the entity directly.
    const { status, ...editable } = payload;
    try {
      const res = await base44.functions.invoke("saveEvent", {
        action: isEdit ? "update" : "create",
        event_id: isEdit ? id : undefined,
        status,
        payload: editable,
      });
      const data = res?.data || {};
      if (data.status !== "success") {
        throw new Error(data.message || "Não foi possível salvar o evento.");
      }
      if (data.pending_approval) {
        toast({
          title: isEdit ? "Alterações salvas" : "Evento salvo como rascunho!",
          description: "Estamos validando novos organizadores antes da primeira publicação. Assim que a revisão liberar, você publica direto por aqui.",
        });
        navigate("/app");
      } else if (isEdit) {
        toast({
          title: "Evento atualizado",
          description: data.refund_policy_locked
            ? "A política de reembolso ficou travada porque já há ingressos vendidos."
            : undefined,
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Evento criado!",
          description: data.event_status === "draft" ? "Salvo como rascunho." : "Seu evento está no ar.",
        });
        navigate("/dashboard");
      }
    } catch (e) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  const subItemClass = "bg-secondary border border-border rounded-xl p-3 space-y-2";
  const saveLabel = !canOrganize ? "Salvar rascunho" : isEdit ? t("eventEditor.updateEvent") : "Publicar evento";

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-6 pb-24">
      <Link to={canOrganize ? "/dashboard" : "/app"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> {canOrganize ? t("eventEditor.backToDashboard") : "Voltar ao início"}
      </Link>

      {!canOrganize && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-foreground text-sm font-semibold">Revisão necessária antes de publicar</p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              Estamos validando novos organizadores antes da primeira publicação. Você pode configurar seu evento agora, salvar como rascunho e nós liberamos a publicação após a revisão.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">{isEdit ? t("eventEditor.editEvent") : t("eventEditor.createEvent")}</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 px-5 shadow-glow">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("eventEditor.saving")}</> : <><Save className="w-4 h-4 mr-2" strokeWidth={1.75} />{saveLabel}</>}
        </Button>
      </div>

      {/* 1 · INFORMAÇÕES DO EVENTO */}
      <Section step={1} title="Informações do evento" icon={Calendar}>
        <Field label="Nome do evento"><Input value={form.title} onChange={e => set("title", e.target.value)} className="rounded-xl" placeholder="Ex: Sunrise Sessions" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data e horário de início *"><Input type="datetime-local" value={form.date} onChange={e => set("date", e.target.value)} className="rounded-xl" /></Field>
          <Field label="Fim (opcional)"><Input type="datetime-local" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="rounded-xl" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Local (casa/venue) *"><Input value={form.location_name} onChange={e => set("location_name", e.target.value)} className="rounded-xl" placeholder="Club Nova" /></Field>
          <Field label="Endereço / cidade"><Input value={form.location_address} onChange={e => set("location_address", e.target.value)} className="rounded-xl" placeholder="São Paulo, SP" /></Field>
        </div>
      </Section>

      {/* 2 · INGRESSOS */}
      <Section step={2} title="Ingressos" icon={TicketIcon}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacidade *"><Input type="number" value={form.total_capacity} onChange={e => set("total_capacity", e.target.value)} className="rounded-xl" placeholder="500" /></Field>
          <Field label="Preço base (R$)">
            <Input type="number" value={form.ticket_price} onChange={e => set("ticket_price", e.target.value)} className="rounded-xl" placeholder={String(GENRE_PRICING[form.genre]?.typical || 40)} />
            <p className="text-[10px] text-muted-foreground mt-1">
              {form.genre && GENRE_PRICING[form.genre] ? (
                <>Pra <span className="text-primary font-medium">{genreLabel(form.genre)}</span> em SP: <span className="text-foreground font-medium">R$ {GENRE_PRICING[form.genre].min}–{GENRE_PRICING[form.genre].max}</span> · típico <span className="text-primary font-medium">R$ {GENRE_PRICING[form.genre].typical}</span></>
              ) : null}
            </p>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço VIP (R$)">
            <Input type="number" value={form.vip_price} onChange={e => set("vip_price", e.target.value)} className="rounded-xl" placeholder="Deixe em branco pra não vender VIP" />
          </Field>
          <Field label="Preço Backstage (R$)">
            <Input type="number" value={form.backstage_price} onChange={e => set("backstage_price", e.target.value)} className="rounded-xl" placeholder="Deixe em branco pra não vender Backstage" />
          </Field>
        </div>
        <p className="text-[10px] text-muted-foreground -mt-1">VIP e Backstage são opcionais — em branco, o evento simplesmente não oferece esse ingresso.</p>

        {/* Lotes */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">Lotes</p>
            <button onClick={suggestPhasePrices} className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} /> Sugerir preços
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">Os lotes avançam sozinho, por data ou quando esgotam.</p>
          <div className="space-y-3">
            {form.ticket_phases.map((ph, i) => (
              <div key={i} className={subItemClass}>
                <div className="flex items-center justify-between gap-2">
                  <Input value={ph.name} onChange={e => updatePhase(i, "name", e.target.value)} className="rounded-lg h-8 text-sm font-medium" placeholder="Nome da fase" />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">Ativa</span>
                    <Switch checked={!!ph.active} onCheckedChange={v => updatePhase(i, "active", v)} />
                    <button onClick={() => removePhase(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[10px] text-muted-foreground">Preço (R$)</label><Input type="number" value={ph.price} onChange={e => updatePhase(i, "price", e.target.value)} className="rounded-lg h-8 text-sm" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Qtd</label><Input type="number" value={ph.quantity} onChange={e => updatePhase(i, "quantity", e.target.value)} className="rounded-lg h-8 text-sm" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Recompensa FTC</label><Input type="number" value={ph.festcoin_reward} onChange={e => updatePhase(i, "festcoin_reward", e.target.value)} className="rounded-lg h-8 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-muted-foreground">Início das vendas</label><Input type="datetime-local" value={toLocal(ph.sales_start)} onChange={e => updatePhase(i, "sales_start", fromLocal(e.target.value))} className="rounded-lg h-8 text-sm" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Fim das vendas</label><Input type="datetime-local" value={toLocal(ph.sales_end)} onChange={e => updatePhase(i, "sales_end", fromLocal(e.target.value))} className="rounded-lg h-8 text-sm" /></div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addPhase} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline mt-2"><Plus className="w-4 h-4" strokeWidth={1.75} /> {t("eventEditor.addPhase")}</button>
        </div>
      </Section>

      {/* 3 · SEU EVENTO */}
      <Section step={3} title="Seu evento" icon={Music}>
        <Field label="Banner / imagem do evento">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground hover:border-primary transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" strokeWidth={1.75} />} Enviar imagem
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            {form.image_url && <img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
          </div>
        </Field>
        <Field label="Descrição"><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="rounded-xl resize-none" rows={3} placeholder="Descreva a vibe..." /></Field>

        <div className="pt-2 border-t border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Lineup / DJs (opcional)</p>
          <div className="space-y-3">
            {form.lineup.map((dj, i) => (
              <div key={i} className={subItemClass}>
                <div className="flex items-center gap-2">
                  <Input value={dj.name} onChange={e => updateLineup(i, "name", e.target.value)} className="rounded-lg h-8 text-sm font-medium flex-1" placeholder="Nome do DJ / artista" />
                  <button onClick={() => removeLineup(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={dj.set_time} onChange={e => updateLineup(i, "set_time", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Horário (ex: 23:00)" />
                  <Input value={dj.social_link} onChange={e => updateLineup(i, "social_link", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Instagram / rede social" />
                </div>
                <Textarea value={dj.bio} onChange={e => updateLineup(i, "bio", e.target.value)} className="rounded-lg text-sm resize-none" rows={2} placeholder="Bio (opcional)" />
              </div>
            ))}
            {form.lineup.length === 0 && <p className="text-xs text-muted-foreground">Nenhum DJ adicionado.</p>}
          </div>
          <button onClick={addLineup} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline mt-2"><Plus className="w-4 h-4" strokeWidth={1.75} /> {t("eventEditor.addDj")}</button>
        </div>
      </Section>

      {/* ADVANCED — collapsed by default so a first-time organizer isn't
          shown genre/status/visibility/refund policy/schedule/FestCoin
          tuning before they need it. Same fields, same handlers — only the
          disclosure is new. */}
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div>
            <p className="font-heading font-semibold text-foreground text-sm">Opções avançadas</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Estilo, visibilidade, reembolso, programação e FestCoin — não precisa mexer agora.</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${showAdvanced ? "rotate-180" : ""}`} strokeWidth={1.75} />
        </button>

        {showAdvanced && (
          <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estilo">
                <Select value={form.genre} onValueChange={v => set("genre", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{genreLabel(g)}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              {canOrganize ? (
                <Field label="Status">
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="live">Ao vivo</SelectItem>
                      <SelectItem value="ended">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field label="Status">
                  <div className="h-10 flex items-center px-3 rounded-xl bg-secondary border border-border text-xs text-muted-foreground">
                    Rascunho — aguardando revisão
                  </div>
                </Field>
              )}
            </div>

            <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
              <div className="flex-1 mr-3">
                <Label className="text-xs">{form.visibility === "public" ? t("eventEditor.publicEvent") : t("eventEditor.privateEvent")}</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">{form.visibility === "public" ? "Aparece na busca e pode ser compartilhado publicamente." : "Oculto da listagem pública — só quem tem o link ou o ingresso consegue acessar."}</p>
              </div>
              <Switch checked={form.visibility === "public"} onCheckedChange={v => set("visibility", v ? "public" : "private")} />
            </div>

            {/* Refund policy */}
            <div className="bg-secondary rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-3">
                  <Label className="text-xs">Política de reembolso</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {hasSoldTickets
                      ? "Não pode ser alterada após ingressos vendidos."
                      : "Mostrada ao comprador antes do pagamento."}
                  </p>
                </div>
              </div>
              <Select
                value={form.refund_policy}
                onValueChange={v => !hasSoldTickets && set("refund_policy", v)}
                disabled={hasSoldTickets}
              >
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_7_dias">Reembolso até 7 dias antes</SelectItem>
                  <SelectItem value="ate_48h">Reembolso até 48h antes</SelectItem>
                  <SelectItem value="sem_reembolso">Sem reembolso</SelectItem>
                  <SelectItem value="caso_a_caso">Análise caso a caso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Schedule */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} /> Programação</p>
              <p className="text-[10px] text-muted-foreground mb-2">Abertura, set do DJ, atração principal, encerramento.</p>
              <div className="space-y-2">
                {form.schedule.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 bg-secondary border border-border rounded-xl p-3">
                    <Input value={s.time} onChange={e => updateSchedule(i, "time", e.target.value)} className="rounded-lg h-8 text-sm w-24 flex-shrink-0" placeholder="22:00" />
                    <div className="flex-1 space-y-1">
                      <Input value={s.title} onChange={e => updateSchedule(i, "title", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Abertura" />
                      <Input value={s.description} onChange={e => updateSchedule(i, "description", e.target.value)} className="rounded-lg h-8 text-xs" placeholder="Detalhe (opcional)" />
                    </div>
                    <button onClick={() => removeSchedule(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {form.schedule.length === 0 && <p className="text-xs text-muted-foreground">Nenhum item na programação.</p>}
              </div>
              <button onClick={addSchedule} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline mt-2"><Plus className="w-4 h-4" strokeWidth={1.75} /> {t("eventEditor.addScheduleItem")}</button>
            </div>

            {/* FestCoin config */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} /> {t("festcoin.orgSectionTitle")}</p>
              <p className="text-[10px] text-muted-foreground mb-2">Configure como as recompensas funcionam neste evento.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
                  <div className="flex-1 mr-3">
                    <Label className="text-xs">{t("festcoin.orgFtcEnabled")}</Label>
                  </div>
                  <Switch checked={!!form.ftc_enabled} onCheckedChange={v => set("ftc_enabled", v)} />
                </div>

                {form.ftc_enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("festcoin.orgCurrencyCode")}>
                        <Input value={form.currency_code} onChange={e => set("currency_code", e.target.value)} className="rounded-xl" placeholder="BRL" />
                      </Field>
                      <Field label={t("festcoin.orgConversionRate")}>
                        <Input type="number" value={form.ftc_conversion_rate} onChange={e => set("ftc_conversion_rate", e.target.value)} className="rounded-xl" placeholder="1" />
                      </Field>
                    </div>

                    <Field label={t("festcoin.orgDiscountPercent")}>
                      <Input type="number" value={form.ftc_discount_percent} onChange={e => set("ftc_discount_percent", e.target.value)} className="rounded-xl" placeholder="0" />
                      <p className="text-[10px] text-muted-foreground mt-1">{t("festcoin.orgDiscountHint")}</p>
                    </Field>

                    <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
                      <div className="flex-1 mr-3">
                        <Label className="text-xs">{t("festcoin.orgCashbackEnabled")}</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("festcoin.orgCashbackHint")}</p>
                      </div>
                      <Switch checked={!!form.ftc_cashback_enabled} onCheckedChange={v => set("ftc_cashback_enabled", v)} />
                    </div>

                    {form.ftc_cashback_enabled && (
                      <>
                        <Field label={t("festcoin.orgCashbackPercent")}>
                          <Input type="number" value={form.ftc_cashback_percent} onChange={e => set("ftc_cashback_percent", e.target.value)} className="rounded-xl" placeholder="0" />
                        </Field>
                        <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
                          <div className="flex-1 mr-3">
                            <Label className="text-xs">{t("festcoin.orgCashbackOnFtc")}</Label>
                          </div>
                          <Switch checked={!!form.ftc_cashback_on_ftc_purchase} onCheckedChange={v => set("ftc_cashback_on_ftc_purchase", v)} />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
                      <div className="flex-1 mr-3">
                        <Label className="text-xs">{t("festcoin.orgPilotMode")}</Label>
                      </div>
                      <Switch checked={!!form.ftc_pilot_mode} onCheckedChange={v => set("ftc_pilot_mode", v)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 · ANTES DE PUBLICAR */}
      <Section step={4} title="Antes de publicar" icon={CheckCircle2} subtitle="Seu evento está quase pronto">
        <ReadinessSummary form={form} />
      </Section>

      {/* Sticky save */}
      <div className="sticky bottom-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-raised">
          {saving ? t("eventEditor.saving") : saveLabel}
        </Button>
      </div>
    </div>
  );
}
