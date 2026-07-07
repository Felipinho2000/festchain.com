import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeft, Plus, Trash2, ImagePlus, Loader2, Music, Calendar,
  Ticket as TicketIcon, Save, Clock
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
};

function Section({ title, icon: Icon, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div>
        <h2 className="font-heading font-semibold text-white text-base flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</h2>
        {subtitle && <p className="text-[10px] text-[#666] mt-0.5 ml-6">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs text-[#888]">{label}</Label>
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
        });
      })
      .catch(() => { toast({ title: "Event not found", variant: "destructive" }); navigate("/dashboard"); })
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
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updatePhase = (i, k, v) => setForm(p => {
    const phases = [...p.ticket_phases]; phases[i] = { ...phases[i], [k]: v }; return { ...p, ticket_phases: phases };
  });
  const addPhase = () => setForm(p => ({ ...p, ticket_phases: [...p.ticket_phases, { name: "", price: 0, quantity: 0, sales_start: moment().toISOString(), sales_end: moment().add(7, "days").toISOString(), active: true, festcoin_reward: 0 }] }));
  const removePhase = (i) => setForm(p => ({ ...p, ticket_phases: p.ticket_phases.filter((_, idx) => idx !== i) }));

  const updateLineup = (i, k, v) => setForm(p => { const l = [...p.lineup]; l[i] = { ...l[i], [k]: v }; return { ...p, lineup: l }; });
  const addLineup = () => setForm(p => ({ ...p, lineup: [...p.lineup, { name: "", bio: "", social_link: "", set_time: "" }] }));
  const removeLineup = (i) => setForm(p => ({ ...p, lineup: p.lineup.filter((_, idx) => idx !== i) }));

  const updateSchedule = (i, k, v) => setForm(p => { const s = [...p.schedule]; s[i] = { ...s[i], [k]: v }; return { ...p, schedule: s }; });
  const addSchedule = () => setForm(p => ({ ...p, schedule: [...p.schedule, { time: "", title: "", description: "" }] }));
  const removeSchedule = (i) => setForm(p => ({ ...p, schedule: p.schedule.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title || !form.date || !form.location_name || !form.total_capacity) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
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
    };
    try {
      if (isEdit) {
        await base44.entities.Event.update(id, payload);
        toast({ title: "Event updated" });
      } else {
        await base44.entities.Event.create(payload);
        toast({ title: "Event created!", description: "Your event is live." });
      }
      navigate("/dashboard");
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#888] hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("eventEditor.backToDashboard")}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-3xl text-white">{isEdit ? t("eventEditor.editEvent") : t("eventEditor.createEvent")}</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-10 px-5">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("eventEditor.saving")}</> : <><Save className="w-4 h-4 mr-2" />{isEdit ? t("eventEditor.updateEvent") : t("eventEditor.publishEvent")}</>}
        </Button>
      </div>

      {/* BASICS */}
      <Section title={t("eventEditor.eventBasics")} icon={Calendar}>
        <Field label={t("eventEditor.eventName")}><Input value={form.title} onChange={e => set("title", e.target.value)} className="rounded-xl" placeholder="Summer Solstice" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Genre">
            <Select value={form.genre} onValueChange={v => set("genre", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{genreLabel(g)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Short Description"><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="rounded-xl resize-none" rows={3} placeholder="Describe the vibe..." /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date & Time *"><Input type="datetime-local" value={form.date} onChange={e => set("date", e.target.value)} className="rounded-xl" /></Field>
          <Field label="End Date & Time"><Input type="datetime-local" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="rounded-xl" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue Name *"><Input value={form.location_name} onChange={e => set("location_name", e.target.value)} className="rounded-xl" placeholder="Club Nova" /></Field>
          <Field label="Address"><Input value={form.location_address} onChange={e => set("location_address", e.target.value)} className="rounded-xl" placeholder="São Paulo, SP" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacity *"><Input type="number" value={form.total_capacity} onChange={e => set("total_capacity", e.target.value)} className="rounded-xl" placeholder="500" /></Field>
          <Field label="Base Price (R$)"><Input type="number" value={form.ticket_price} onChange={e => set("ticket_price", e.target.value)} className="rounded-xl" placeholder="40" /></Field>
        </div>
        <Field label="Event Banner / Image">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-white hover:border-primary transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            {form.image_url && <img src={form.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
          </div>
        </Field>
        <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
          <div className="flex-1 mr-3">
            <Label className="text-xs">{form.visibility === "public" ? t("eventEditor.publicEvent") : t("eventEditor.privateEvent")}</Label>
            <p className="text-[10px] text-[#666] mt-0.5">{form.visibility === "public" ? "Appears in discovery and can be shared publicly." : "Hidden from public listing — only people with the link or a ticket can access."}</p>
          </div>
          <Switch checked={form.visibility === "public"} onCheckedChange={v => set("visibility", v ? "public" : "private")} />
        </div>
      </Section>

      {/* TICKET PHASES */}
      <Section title={t("eventEditor.ticketPhases")} icon={TicketIcon} subtitle="Default phases are preloaded. Only the active phase within its sales window is buyable; phases auto-advance.">
        <div className="space-y-3">
          {form.ticket_phases.map((ph, i) => (
            <div key={i} className="bg-[#0d0d0d] border border-[#222] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Input value={ph.name} onChange={e => updatePhase(i, "name", e.target.value)} className="rounded-lg h-8 text-sm font-medium" placeholder="Phase name" />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-[#666]">Active</span>
                  <Switch checked={!!ph.active} onCheckedChange={v => updatePhase(i, "active", v)} />
                  <button onClick={() => removePhase(i)} className="p-1 text-[#666] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] text-[#666]">Price (R$)</label><Input type="number" value={ph.price} onChange={e => updatePhase(i, "price", e.target.value)} className="rounded-lg h-8 text-sm" /></div>
                <div><label className="text-[10px] text-[#666]">Qty</label><Input type="number" value={ph.quantity} onChange={e => updatePhase(i, "quantity", e.target.value)} className="rounded-lg h-8 text-sm" /></div>
                <div><label className="text-[10px] text-[#666]">FTC Reward</label><Input type="number" value={ph.festcoin_reward} onChange={e => updatePhase(i, "festcoin_reward", e.target.value)} className="rounded-lg h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-[#666]">Sales Start</label><Input type="datetime-local" value={toLocal(ph.sales_start)} onChange={e => updatePhase(i, "sales_start", fromLocal(e.target.value))} className="rounded-lg h-8 text-sm" /></div>
                <div><label className="text-[10px] text-[#666]">Sales End</label><Input type="datetime-local" value={toLocal(ph.sales_end)} onChange={e => updatePhase(i, "sales_end", fromLocal(e.target.value))} className="rounded-lg h-8 text-sm" /></div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addPhase} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline mt-2"><Plus className="w-4 h-4" /> {t("eventEditor.addPhase")}</button>
      </Section>

      {/* LINEUP */}
      <Section title={t("eventEditor.lineupDjs")} icon={Music}>
        <div className="space-y-3">
          {form.lineup.map((dj, i) => (
            <div key={i} className="bg-[#0d0d0d] border border-[#222] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input value={dj.name} onChange={e => updateLineup(i, "name", e.target.value)} className="rounded-lg h-8 text-sm font-medium flex-1" placeholder="DJ / Artist name" />
                <button onClick={() => removeLineup(i)} className="p-1 text-[#666] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={dj.set_time} onChange={e => updateLineup(i, "set_time", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Set time (e.g. 23:00)" />
                <Input value={dj.social_link} onChange={e => updateLineup(i, "social_link", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Instagram / social link" />
              </div>
              <Textarea value={dj.bio} onChange={e => updateLineup(i, "bio", e.target.value)} className="rounded-lg text-sm resize-none" rows={2} placeholder="Short bio (optional)" />
            </div>
          ))}
          {form.lineup.length === 0 && <p className="text-xs text-[#666]">No DJs added yet.</p>}
        </div>
        <button onClick={addLineup} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline mt-2"><Plus className="w-4 h-4" /> {t("eventEditor.addDj")}</button>
      </Section>

      {/* SCHEDULE */}
      <Section title={t("eventEditor.schedule")} icon={Clock} subtitle="Doors open, DJ set, main act, closing — show the night's timeline.">
        <div className="space-y-2">
          {form.schedule.map((s, i) => (
            <div key={i} className="flex items-start gap-2 bg-[#0d0d0d] border border-[#222] rounded-xl p-3">
              <Input value={s.time} onChange={e => updateSchedule(i, "time", e.target.value)} className="rounded-lg h-8 text-sm w-24 flex-shrink-0" placeholder="22:00" />
              <div className="flex-1 space-y-1">
                <Input value={s.title} onChange={e => updateSchedule(i, "title", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Doors Open" />
                <Input value={s.description} onChange={e => updateSchedule(i, "description", e.target.value)} className="rounded-lg h-8 text-xs" placeholder="Optional detail" />
              </div>
              <button onClick={() => removeSchedule(i)} className="p-1 text-[#666] hover:text-red-400 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {form.schedule.length === 0 && <p className="text-xs text-[#666]">No schedule items yet.</p>}
        </div>
        <button onClick={addSchedule} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline mt-2"><Plus className="w-4 h-4" /> {t("eventEditor.addScheduleItem")}</button>
      </Section>

      {/* Sticky save */}
      <div className="sticky bottom-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg">
          {saving ? t("eventEditor.saving") : isEdit ? t("eventEditor.updateEvent") : t("eventEditor.publishEvent")}
        </Button>
      </div>
    </div>
  );
}