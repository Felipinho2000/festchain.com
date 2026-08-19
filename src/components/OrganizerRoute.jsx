import { Outlet, Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Route guard for the organizer workspace.
//
// Every /organizer/* route used to sit behind ProtectedRoute alone, which only
// asks "are you signed in?". Each page then re-checked identity rather than
// permission, so any signed-in partygoer who typed /organizer/reembolsos got the
// refund-approval screen, /organizer/recompensas got reward CRUD, and
// /organizer/convidados got the guest list. ModeSwitcher literally tells users
// "switching your view never grants organizer permissions" — the URL bar did.
//
// This is defence in depth, not the boundary. The real boundary is server-side:
// saveEvent enforces approved_organizer, validateTicket enforces per-event
// ownership, and entity RLS scopes every read to the caller. This guard exists so
// the UI stops handing unprivileged users an operator console to poke at.
export default function OrganizerRoute() {
  const { currentUser, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  const canOrganize = currentUser.role === 'admin' || currentUser.approved_organizer === true;
  if (!canOrganize) {
    // Not a rejection screen: a first-time organizer can already configure an
    // event (saveEvent accepts drafts from any signed-in user) — this just
    // means the full operator console (finanças, resgates, convidados) opens
    // once FestChain reviews the account. Point them at the one thing they
    // actually can do right now instead of a locked door.
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Quer criar seu próprio evento?</h2>
        <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
          A FestChain te ajuda a começar do zero. Crie seu evento, configure seus ingressos e publique quando estiver pronto.
        </p>
        <p className="text-muted-foreground/60 text-xs mb-6 leading-relaxed">
          Estamos validando novos organizadores antes da primeira publicação. Você pode configurar seu evento agora e nós liberamos a publicação após a revisão.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/dashboard/events/new"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm h-11 px-6 rounded-xl transition-colors"
          >
            Começar como organizador
          </Link>
          <Link to="/app" className="text-muted-foreground text-sm hover:text-foreground hover:underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
