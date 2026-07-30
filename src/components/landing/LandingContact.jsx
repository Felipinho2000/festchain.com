import React, { useState } from "react";
import { MessageCircle, Check, Send, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { COPY, CONTACT_EMAIL, getWaHref } from "./landingData";
import Reveal from "./Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LandingContact() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY["pt-BR"];
  const waHref = getWaHref(lang);
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.entities.PilotApplication.create({
        name: form.name, email: form.email,
        message: form.message, status: "new", source: "landing_form",
      });
      base44.integrations.Core.SendEmail({
        to: CONTACT_EMAIL,
        subject: `Pilot application — ${form.name}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nMessage: ${form.message}`,
      }).catch(() => {});
      setSent(true);
      toast({ title: c.contact.sentTitle, description: c.contact.sentSub });
    } catch (err) {
      toast({ title: c.contact.errTitle, description: c.contact.errSub, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200";

  return (
    <section id="contact" className="py-24 px-5 bg-white/[0.015] border-t border-white/[0.06]">
      <div className="max-w-2xl mx-auto">
        <Reveal className="text-center mb-10">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">{c.contact.kicker}</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-3 tracking-[-0.02em]">{c.contact.title}</h2>
          <p className="text-white/40 text-sm mb-6">{c.contact.sub}</p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-block">
            <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-2xl font-bold text-base shadow-[0_8px_32px_-8px_rgba(255,101,0,0.5)] hover:shadow-[0_8px_40px_-8px_rgba(255,101,0,0.7)] hover:scale-[1.02] transition-all duration-300">
              <MessageCircle className="w-5 h-5 mr-2" /> {c.contact.whatsapp}
            </Button>
          </a>
        </Reveal>

        <Reveal delay={0.15}>
          {sent ? (
            <div className="bg-primary/[0.08] border border-primary/20 rounded-3xl p-10 text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">{c.contact.sentTitle}</h3>
              <p className="text-white/40 text-sm">{c.contact.sentSub}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wide block mb-2">{c.contact.nameL}</label>
                  <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass} placeholder={c.contact.namePh} />
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wide block mb-2">{c.contact.emailL}</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className={inputClass} placeholder={c.contact.emailPh} />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wide block mb-2">{c.contact.msgL}</label>
                <textarea required value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={3}
                  className={inputClass + " resize-none"} placeholder={c.contact.msgPh} />
              </div>
              <Button type="submit" disabled={sending || !form.name || !form.email} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-base shadow-[0_8px_32px_-8px_rgba(255,101,0,0.5)] hover:shadow-[0_8px_40px_-8px_rgba(255,101,0,0.7)] hover:scale-[1.01] transition-all duration-300">
                {sending ? c.contact.sending : c.contact.send} <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
        </Reveal>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center text-sm text-white/40">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
          <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {CONTACT_EMAIL}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> São Paulo, BR</span>
        </div>
      </div>
    </section>
  );
}