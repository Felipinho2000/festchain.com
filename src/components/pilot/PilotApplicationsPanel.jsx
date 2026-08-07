import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, Inbox, RefreshCw } from "lucide-react";

// Admin review workflow for organizer/pilot applications.
//
// `PilotApplication` was write-only: the landing form saved leads into the
// database and nobody could ever read them back, so real pilot enquiries sat
// there unseen. A lead form with no inbox is not a workflow — this is the
// smallest thing that makes it one: see the applicant, contact them, and move
// their status.

const STATUSES = [
  { key: "new", label: "Novo", cls: "bg-primary/15 text-primary border-primary/30" },
  { key: "contacted", label: "Contactado", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { key: "approved", label: "Aprovado", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { key: "rejected", label: "Recusado", cls: "bg-muted text-muted-foreground border-border" },
];

const statusMeta = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];

export default function PilotApplicationsPanel() {
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await base44.entities.PilotApplication.filter({}, "-created_date", 200);
      setApps(rows || []);
    } catch (e) {
      setError("Não foi possível carregar as candidaturas. Confirme que sua conta é admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (app, status) => {
    setSavingId(app.id);
    try {
      await base44.entities.PilotApplication.update(app.id, { status });
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
      toast({ title: `Status atualizado para "${statusMeta(status).label}"` });
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: e.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const visible = filter === "all" ? apps : apps.filter((a) => (a.status || "new") === filter);
  const counts = STATUSES.reduce((acc, s) => {
    acc[s.key] = apps.filter((a) => (a.status || "new") === s.key).length;
    return acc;
  }, {});

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-foreground font-medium flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" strokeWidth={1.75} />
            Candidaturas do piloto
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Leads enviados pelo formulário da landing. Revise, entre em contato e mova o status.
          </p>
        </div>
        <button
          onClick={load}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Recarregar candidaturas"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
            filter === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas ({apps.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              filter === s.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label} ({counts[s.key] || 0})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando candidaturas…
        </div>
      )}

      {!loading && error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          {apps.length === 0
            ? "Nenhuma candidatura ainda. Quando alguém enviar o formulário da landing, ela aparece aqui."
            : "Nenhuma candidatura com esse status."}
        </p>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((app) => {
            const meta = statusMeta(app.status || "new");
            return (
              <div key={app.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{app.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.email || "—"}</p>
                    {app.role && <p className="text-xs text-muted-foreground mt-0.5">Perfil: {app.role}</p>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>

                {app.message && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap border-l-2 border-border pl-2">{app.message}</p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {app.email && (
                    <a
                      href={`mailto:${app.email}?subject=${encodeURIComponent("FestChain — piloto privado")}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mr-1"
                    >
                      <Mail className="w-3.5 h-3.5" strokeWidth={1.75} /> Contatar
                    </a>
                  )}
                  {STATUSES.filter((s) => s.key !== (app.status || "new")).map((s) => (
                    <button
                      key={s.key}
                      disabled={savingId === app.id}
                      onClick={() => setStatus(app, s.key)}
                      className="text-xs font-medium px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
                    >
                      {savingId === app.id ? "…" : `→ ${s.label}`}
                    </button>
                  ))}
                </div>

                {app.created_date && (
                  <p className="text-[10px] text-muted-foreground/70">
                    Recebida em {new Date(app.created_date).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
