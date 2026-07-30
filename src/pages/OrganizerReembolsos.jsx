import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  ArrowLeft, RefreshCw, Check, X, Clock, Loader2, Ticket as TicketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const CONTENT = {
  "pt-BR": {
    title: "Solicitações de Reembolso",
    subtitle: "Aprove ou recuse pedidos dos seus participantes.",
    back: "Voltar ao painel",
    pending: "Pendentes",
    resolved: "Resolvidos",
    noPending: "Nenhuma solicitação pendente",
    noPendingDesc: "Quando um participante pedir reembolso, aparece aqui.",
    noResolved: "Nenhuma solicitação resolvida ainda",
    approve: "Aprovar reembolso",
    approving: "Processando…",
    decline: "Recusar",
    declineReason: "Motivo da recusa",
    declinePlaceholder: "Explique por que o reembolso foi recusado…",
    confirmDecline: "Confirmar recusa",
    cancel: "Cancelar",
    reason: "Motivo do participante",
    noReason: "Sem motivo informado",
    requestedAt: "Solicitado em",
    resolvedAt: "Resolvido em",
    approved: "Aprovado",
    declined: "Recusado",
    ticketPrice: "Valor do ingresso",
    approveSuccess: "Reembolso aprovado — Stripe processando.",
    approveError: "Erro ao aprovar reembolso",
    declineSuccess: "Solicitação recusada",
    declineError: "Erro ao recusar",
    filterAll: "Todos os eventos",
  },
  en: {
    title: "Refund Requests",
    subtitle: "Approve or decline requests from your attendees.",
    back: "Back to dashboard",
    pending: "Pending",
    resolved: "Resolved",
    noPending: "No pending requests",
    noPendingDesc: "When an attendee requests a refund, it appears here.",
    noResolved: "No resolved requests yet",
    approve: "Approve refund",
    approving: "Processing…",
    decline: "Decline",
    declineReason: "Reason for declining",
    declinePlaceholder: "Explain why the refund was declined…",
    confirmDecline: "Confirm decline",
    cancel: "Cancel",
    reason: "Attendee's reason",
    noReason: "No reason given",
    requestedAt: "Requested on",
    resolvedAt: "Resolved on",
    approved: "Approved",
    declined: "Declined",
    ticketPrice: "Ticket price",
    approveSuccess: "Refund approved — Stripe processing.",
    approveError: "Error approving refund",
    declineSuccess: "Request declined",
    declineError: "Error declining",
    filterAll: "All events",
  },
};

export default function OrganizerReembolsos() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const c = CONTENT[language] || CONTENT["pt-BR"];
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [approvingId, setApprovingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [declineNote, setDeclineNote] = useState("");

  const loadRequests = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const all = await base44.entities.RefundRequest.filter(
        { organizer_id: currentUser.id },
        "-requested_at",
        200
      );
      setRequests(all);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const pending = requests.filter(r => r.status === "pendente");
  const resolved = requests.filter(r => r.status === "aprovado" || r.status === "recusado");

  const handleApprove = async (req) => {
    setApprovingId(req.id);
    try {
      const idempotencyKey = `refund:${req.id}:${req.ticket_id}`;
      const res = await base44.functions.invoke("processRefund", {
        ticket_id: req.ticket_id,
        idempotency_key: idempotencyKey,
      });
      const data = res.data || res;
      if (data.success || data.refund_id) {
        await base44.entities.RefundRequest.update(req.id, {
          status: "aprovado",
          resolved_at: new Date().toISOString(),
          resolved_by_user_id: currentUser.id,
        });
        toast({ title: c.approveSuccess });
        loadRequests();
      } else {
        toast({ title: c.approveError, description: data.error || "Unknown error", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: c.approveError, description: e.message, variant: "destructive" });
    }
    setApprovingId(null);
  };

  const handleConfirmDecline = async () => {
    if (!decliningId) return;
    try {
      await base44.entities.RefundRequest.update(decliningId, {
        status: "recusado",
        organizer_note: declineNote,
        resolved_at: new Date().toISOString(),
        resolved_by_user_id: currentUser.id,
      });
      toast({ title: c.declineSuccess });
      setDecliningId(null);
      setDeclineNote("");
      loadRequests();
    } catch (e) {
      toast({ title: c.declineError, description: e.message, variant: "destructive" });
    }
  };

  const renderItem = (req) => {
    const isApproving = approvingId === req.id;
    return (
      <div key={req.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TicketIcon className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.75} />
              <p className="font-heading font-semibold text-foreground text-sm truncate">{req.event_title || "Evento"}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {req.user_name || "Participante"} · {c.requestedAt} {moment(req.requested_at || req.created_date).format("D MMM, HH:mm")}
            </p>
          </div>
          <Badge className={`text-[10px] border-0 ${
            req.status === "pendente" ? "bg-warning/15 text-warning" :
            req.status === "aprovado" ? "bg-success/15 text-success" :
            "bg-destructive/15 text-destructive"
          }`}>
            {req.status === "pendente" ? c.pending : req.status === "aprovado" ? c.approved : c.declined}
          </Badge>
        </div>

        {req.reason && (
          <div className="bg-secondary rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">{c.reason}</p>
            <p className="text-xs text-foreground">{req.reason}</p>
          </div>
        )}

        {req.organizer_note && req.status === "recusado" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground">{req.organizer_note}</p>
          </div>
        )}

        {req.status === "pendente" && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleApprove(req)}
              disabled={isApproving}
              className="flex-1 h-9 bg-success hover:bg-success/90 text-white text-sm font-semibold rounded-lg"
            >
              {isApproving ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />{c.approving}</> : <><Check className="w-4 h-4 mr-1" strokeWidth={2} />{c.approve}</>}
            </Button>
            <Button
              onClick={() => { setDecliningId(req.id); setDeclineNote(""); }}
              variant="outline"
              className="h-9 px-3 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-semibold"
            >
              <X className="w-4 h-4 mr-1" strokeWidth={2} />{c.decline}
            </Button>
          </div>
        )}

        {(req.status === "aprovado" || req.status === "recusado") && req.resolved_at && (
          <p className="text-[10px] text-muted-foreground">{c.resolvedAt} {moment(req.resolved_at).format("D MMM, HH:mm")}</p>
        )}
      </div>
    );
  };

  const activeList = tab === "pending" ? pending : resolved;

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 space-y-6 py-8 pb-24">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> {c.back}
      </Link>

      <div>
        <h1 className="font-heading font-extrabold text-2xl text-foreground flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-primary" strokeWidth={1.75} /> {c.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{c.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setTab("pending")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === "pending" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          {c.pending} {pending.length > 0 && <span className="ml-1 text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">{pending.length}</span>}
        </button>
        <button
          onClick={() => setTab("resolved")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === "resolved" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          {c.resolved}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" strokeWidth={1.5} />
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-foreground text-sm font-medium">{tab === "pending" ? c.noPending : c.noResolved}</p>
          <p className="text-muted-foreground text-xs mt-1">{tab === "pending" ? c.noPendingDesc : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeList.map(renderItem)}
        </div>
      )}

      {/* Decline modal */}
      {decliningId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDecliningId(null)}>
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-semibold text-foreground">{c.declineReason}</h3>
            <Textarea
              value={declineNote}
              onChange={e => setDeclineNote(e.target.value)}
              placeholder={c.declinePlaceholder}
              className="bg-secondary border-border text-foreground resize-none rounded-xl"
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDecliningId(null)}>{c.cancel}</Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-xl"
                onClick={handleConfirmDecline}
              >
                {c.confirmDecline}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}