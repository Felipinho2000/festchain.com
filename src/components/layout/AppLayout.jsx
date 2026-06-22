import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Ticket,
  Zap,
  Users,
  LayoutDashboard,
  Calendar,
  Music,
  Camera,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Ticket, label: "My Tickets", path: "/tickets" },
  { icon: Wallet, label: "FestCoin", path: "/festcoin" },
  { icon: Camera, label: "Moments", path: "/moments" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
];

const mobileNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Ticket, label: "Tickets", path: "/tickets" },
  { icon: Wallet, label: "FestCoin", path: "/festcoin" },
  { icon: Camera, label: "Moments", path: "/moments" },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "FC";

  return (
    <div className="min-h-screen bg-bone flex">
      {/* Desktop Floating Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-4 top-4 bottom-4 w-[220px] bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(45,42,38,0.08)] border border-border z-40 p-4">
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground tracking-tight">FestChain</span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-warmgray hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentUser?.full_name || "Partygoer"}</p>
              <p className="text-xs text-warmgray truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-warmgray hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading font-bold text-base">FestChain</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-warmgray">
              <LayoutDashboard className="w-4 h-4" />
            </Button>
          </Link>
          <button
            onClick={() => base44.auth.logout("/")}
            className="p-2 text-warmgray"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[252px] pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2">
        {mobileNavItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-warmgray"
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