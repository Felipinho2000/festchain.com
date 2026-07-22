import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, Calendar, Wallet, Users, LogOut, User, FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Logo from "@/components/shared/Logo";

const navItems = [
  { icon: Calendar, label: "Eventos", path: "/events" },
  { icon: Wallet, label: "Carteira", path: "/wallet" },
  { icon: User, label: "Meu Perfil", path: "/profile" },
  { icon: Users, label: "Social", path: "/social" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", staffOnly: true },
];

export default function AppLayout() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const isOrganizer = !!currentUser;

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "FC";

  const visibleItems = navItems.filter(i => !i.staffOnly || isOrganizer);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-[#0a0a0a] border-r border-border z-40 p-4">
        <Link to="/events" className="px-2 mb-8">
          <Logo size={28} />
        </Link>

        <nav className="flex-1 flex flex-col gap-0.5">
          {visibleItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? "bg-primary text-white" : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser?.full_name || "FestChain"}</p>
              <p className="text-xs text-[#666] truncate">{currentUser?.email}</p>
            </div>
          </div>
          <Link to="/legal" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-all w-full mb-1">
            <FileText className="w-4 h-4" strokeWidth={1.5} />
            <span>Confiança &amp; Segurança</span>
          </Link>
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#888] hover:bg-red-900/30 hover:text-red-400 transition-all w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a] border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/events" className="flex-shrink-0">
          <Logo size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/legal" className="p-2 text-[#888] hover:text-white" title="Confiança & Segurança">
            <FileText className="w-4 h-4" />
          </Link>
          <button onClick={() => base44.auth.logout("/")} className="p-2 text-[#888]">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[220px] pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-border z-50 flex items-center justify-around px-2">
        {visibleItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-[#666]"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}