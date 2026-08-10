import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, Calendar, Wallet, Users, LogOut, LogIn, User, FileText, Home as HomeIcon,
  RefreshCw, HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Logo from "@/components/shared/Logo";

// The shell is now rendered for signed-out visitors too (public event pages),
// so every destination declares who it's for:
//   guestOnly — only shown when signed out (Landing stands in for /app)
//   authOnly  — hidden when signed out, since it would bounce to /login
const navItems = [
  { icon: HomeIcon, label: "Início", path: "/", guestOnly: true },
  { icon: HomeIcon, label: "Início", path: "/app", authOnly: true },
  { icon: Calendar, label: "Eventos", path: "/events" },
  { icon: Wallet, label: "Carteira", path: "/wallet", authOnly: true },
  { icon: User, label: "Perfil", path: "/profile", authOnly: true },
  { icon: Users, label: "Social", path: "/social", authOnly: true },
  { icon: LayoutDashboard, label: "Painel", path: "/dashboard", staffOnly: true },
];

export default function AppLayout() {
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuth();
  const canOrganize = currentUser?.role === 'admin' || currentUser?.approved_organizer === true;

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "FC";

  const visibleItems = navItems.filter(i =>
    i.path !== "/social" &&
    (!i.staffOnly || canOrganize) &&
    (!i.authOnly || isAuthenticated) &&
    (!i.guestOnly || !isAuthenticated)
  );
  const mobileNavItems = visibleItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[244px] bg-sidebar border-r border-sidebar-border z-40 px-4 py-6">
        <Link to={isAuthenticated ? "/app" : "/"} className="px-2 mb-9 flex items-center">
          <Logo size={44} />
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {visibleItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== "/app" && item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/12 text-white"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
                )}
                <item.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? "text-primary" : ""}`} strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border pt-4 mt-2 space-y-1">
          {canOrganize && (
            <>
              <Link to="/organizer/reembolsos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                <RefreshCw className="w-[18px] h-[18px]" strokeWidth={1.75} />
                <span>Reembolsos</span>
              </Link>
              <Link to="/organizer/ajuda" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                <HelpCircle className="w-[18px] h-[18px]" strokeWidth={1.75} />
                <span>Ajuda</span>
              </Link>
            </>
          )}
          <Link to="/legal" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <FileText className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <span>Confiança &amp; Segurança</span>
          </Link>
          <Link to="/politica-de-precos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <FileText className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <span>Política de Preços</span>
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3 px-2 pt-2">
              <Avatar className="w-9 h-9 ring-1 ring-border">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{currentUser?.full_name || "FestChain"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{currentUser?.email}</p>
              </div>
              <button
                onClick={() => base44.auth.logout("/")}
                className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-all"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mx-2 mt-2 h-10 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-all"
            >
              <LogIn className="w-4 h-4" strokeWidth={1.75} /> Entrar
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden glass fixed top-0 left-0 right-0 h-14 border-b border-border z-50 flex items-center justify-between px-4">
        <Link to={isAuthenticated ? "/app" : "/"} className="flex-shrink-0">
          <Logo size={34} />
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/legal" className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" aria-label="Confiança & Segurança">
            <FileText className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </Link>
          {isAuthenticated ? (
            <button onClick={() => base44.auth.logout("/")} className="p-2.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors" aria-label="Sair">
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[244px] pt-14 lg:pt-0 pb-24 lg:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden glass fixed bottom-0 left-0 right-0 border-t border-border z-50">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNavItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== "/app" && item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-[22px] h-[22px] transition-transform ${isActive ? "scale-110" : ""}`} strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}