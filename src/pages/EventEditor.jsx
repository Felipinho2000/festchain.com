import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeft, Plus, Trash2, ImagePlus, Loader2, Music, Calendar,
  Ticket as TicketIcon, Save, Clock, Coins, Sparkles
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
  ticket_price: "40", festcoin_reward: "50", total_capacity: "200",
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
};

function Section({ title, icon: Icon, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-soft">
      <div>
        <h2 className="font-heading font-semibold text-foreground text-base flex items-center gap-2"><Icon className="w-4 h-4 text-primary" strokeWidth={1.75} />{title}</h2>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 ml-6">{subtitle}</p>}
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

export default function EventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isEdit = !!id;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        });
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
    };
    try {
      if (isEdit) {
        await base44.entities.Event.update(id, payload);
        toast({ title: "Evento atualizado" });
      } else {
        await base44.entities.Event.create(payload);
        toast({ title: "Evento criado!", description: "Seu evento está no ar." });
      }
      navigate("/dashboard");
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

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-6 pb-24">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> {t("eventEditor.backToDashboard")}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-foreground">{isEdit ? t("eventEditor.editEvent") : t("eventEditor.createEvent")}</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 px-5 shadow-glow">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("eventEditor.saving")}</> : <><Save className="w-4 h-4 mr-2" strokeWidth={1.75} />{isEdit ? t("eventEditor.updateEvent") : t("eventEditor.publishEvent")}</>}
        </Button>
      </div>

      {/* BASICS */}
      <Section title={t("eventEditor.eventBasics")} icon={Calendar}>
        <Field label={t("eventEditor.eventName")}><Input value={form.title} onChange={e => set("title", e.target.value)} className="rounded-xl" placeholder="Summer Solstice" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estilo">
            <Select value={form.genre} onValueChange={v => set("genre", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{genreLabel(g)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
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
        </div>
        <Field label="Descrição"><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="rounded-xl resize-none" rows={3} placeholder="Descreva a vibe..." /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início *"><Input type="datetime-local" value={form.date} onChange={e => set("date", e.target.value)} className="rounded-xl" /></Field>
          <Field label="Fim"><Input type="datetime-local" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="rounded-xl" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Casa *"><Input value={form.location_name} onChange={e => set("location_name", e.target.value)} className="rounded-xl" placeholder="Club Nova" /></Field>
          <Field label="Endereço"><Input value={form.location_address} onChange={e => set("location_address", e.target.value)} className="rounded-xl" placeholder="São Paulo, SP" /></Field>
        </div>
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
        <Field label="Banner / imagem do evento">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground hover:border-primary transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" strokeWidth={1.75} />} Enviar imagem
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            {form.image_url && <img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
          </div>
        </Field>
        <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
          <div className="flex-1 mr-3">
            <Label className="text-xs">{form.visibility === "public" ? t("eventEditor.publicEvent") : t("eventEditor.privateEvent")}</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5">{form.visibility === "public" ? "Aparece na busca e pode ser compartilhado publicamente." : "Oculto da listagem pública — só quem tem o link ou o ingresso consegue acessar."}</p>
          </div>
          <Switch checked={form.visibility === "public"} onCheckedChange={v => set("visibility", v ? "public" : "private")} />
        </div>
      </Section>

      {/* TICKET PHASES */}
      <Section title={t("eventEditor.ticketPhases")} icon={TicketIcon} subtitle="Os lotes avançam sozinho. A gente sugere os preços — é só ajustar se quiser.">
        <button onClick={suggestPhasePrices} className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors w-fit mb-1">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} /> Sugerir preços dos lotes
        </button>
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
      </Section>

      {/* LINEUP */}
      <Section title={t("eventEditor.lineupDjs")} icon={Music}>
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
      </Section>

      {/* SCHEDULE */}
      <Section title={t("eventEditor.schedule")} icon={Clock} subtitle="Abertura, set do DJ, atração principal, encerramento — mostre a timeline da noite.">
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
      </Section>

      {/* FESTCOIN CONFIG */}
      <Section title={t("festcoin.orgSectionTitle")} icon={Coins} subtitle="Configure como as recompensas funcionam neste evento.">
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
      </Section>

      {/* Sticky save */}
      <div className="sticky bottom-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-raised">
          {saving ? t("eventEditor.saving") : isEdit ? t("eventEditor.updateEvent") : t("eventEditor.publishEvent")}
        </Button>
      </div>
    </div>
  );
}