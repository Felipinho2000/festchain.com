import { Outlet, Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
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
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Apenas organizadores</h2>
        <p className="text-muted-foreground text-sm mb-2">
          Esta área é do painel de organizadores aprovados.
        </p>
        <p className="text-muted-foreground/60 text-xs mb-6">
          A aprovação é concedida manualmente pela equipe durante o piloto privado.
        </p>
        <Link to="/app" className="text-primary font-semibold text-sm hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
