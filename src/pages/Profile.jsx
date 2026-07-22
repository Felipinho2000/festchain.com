import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Award, Ticket, Camera, Users, Bell, Check, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import moment from "moment";

// All possible badges definition
const BADGE_DEFS = [
  { key: "first_ticket", emoji: "🎟️", name: "Primeiro ingresso", desc: "Comprou seu primeiro ingresso" },
  { key: "five_events", emoji: "🔥", name: "Pegando fogo", desc: "Participou de 5 eventos" },
  { key: "ten_events", emoji: "💎", name: "Veterano", desc: "Participou de 10 eventos" },
  { key: "twenty_events", emoji: "👑", name: "Lenda", desc: "Participou de 20 eventos" },
  { key: "first_moment", emoji: "📸", name: "Fotógrafo", desc: "Compartilhou seu primeiro momento" },
  { key: "night_owl", emoji: "🦉", name: "Coruja", desc: "Foi num evento que durou até de madrugada" },
  { key: "genre_techno", emoji: "🤖", name: "Techno", desc: "Foi num evento de techno" },
  { key: "genre_house", emoji: "🏠", name: "House", desc: "Foi num evento de house" },
  { key: "festcoin_holder", emoji: "🪙", name: "Acumulador", desc: "Acumulou mais de 1000 FTC" },
];

export default function Profile() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [badges, setBadges] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [moments, setMoments] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    Promise.all([
      base44.entities.UserBadge.filter({ created_by_id: currentUser.id }),
      base44.entities.Ticket.filter({ created_by_id: currentUser.id }),
      base44.entities.Moment.filter({ created_by_id: currentUser.id }),
      base44.entities.FriendRequest.filter({ to_user_id: currentUser.id, status: "pending" }),
      base44.entities.FriendRequest.filter({ status: "accepted" }),
    ]).then(([b, t, m, fr, conn]) => {
      setBadges(b);
      setTickets(t);
      setMoments(m);
      setFriendRequests(fr);
      // connections where I'm either side
      setConnections(conn.filter(c => c.from_user_id === currentUser.id || c.to_user_id === currentUser.id));
    }).finally(() => setLoading(false));
  }, [currentUser]);

  const earnedKeys = new Set(badges.map(b => b.badge_key));

  const handleAccept = async (req) => {
    await base44.entities.FriendRequest.update(req.id, { status: "accepted" });
    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleDecline = async (req) => {
    await base44.entities.FriendRequest.update(req.id, { status: "declined" });
    setFriendRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "FC";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#1f1f1f] to-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center flex-shrink-0">
            <span className="font-heading font-bold text-2xl text-primary">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-xl text-white">{currentUser?.full_name || "Participante"}</h1>
            <p className="text-[#666] text-sm">{currentUser?.email}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-[#888]">
                <Ticket className="w-3 h-3" /> <span className="text-white font-semibold">{tickets.length}</span> eventos
              </span>
              <span className="flex items-center gap-1 text-xs text-[#888]">
                <Users className="w-3 h-3" /> <span className="text-white font-semibold">{connections.length}</span> conexões
              </span>
              <span className="flex items-center gap-1 text-xs text-[#888]">
                <Camera className="w-3 h-3" /> <span className="text-white font-semibold">{moments.length}</span> momentos
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1 bg-primary/20 border border-primary/30 rounded-xl px-3 py-1.5">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold text-sm">{earnedKeys.size}</span>
              <span className="text-[#888] text-xs">conquistas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">{t("profile.legalCardTitle")}</p>
          <p className="text-[#666] text-xs">{t("profile.legalCardDesc")}</p>
        </div>
        <Link to="/legal" className="text-primary text-sm font-medium hover:underline">{t("profile.view")}</Link>
      </div>

      <Tabs defaultValue="social" className="space-y-4">
        <TabsList className="bg-card border border-border p-1 rounded-xl h-auto gap-1 w-full">
          <TabsTrigger value="social" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-sm py-2">
            Social
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-sm py-2">
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-sm py-2">
            Eventos
          </TabsTrigger>
        </TabsList>

        {/* Social */}
        <TabsContent value="social" className="space-y-4">
          {friendRequests.length > 0 && (
            <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-semibold text-white text-sm">{friendRequests.length} solicitação{friendRequests.length > 1 ? "ões" : ""} de conexão</span>
              </div>
              {friendRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold text-xs">?</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{req.from_alias || "Participante anônimo"}</p>
                      {req.message && <p className="text-[#666] text-xs">"{req.message}"</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(req)} className="w-8 h-8 rounded-lg bg-emerald-900/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-800/50 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDecline(req)} className="w-8 h-8 rounded-lg bg-red-900/30 text-red-400 flex items-center justify-center hover:bg-red-800/40 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {connections.length === 0 && friendRequests.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <Users className="w-8 h-8 text-[#444] mx-auto mb-2" />
              <p className="text-[#666] text-sm">Sem conexões ainda.</p>
              <p className="text-[#555] text-xs mt-1">Conecte-se com quem vai nas mesmas festas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(c => {
                const isMe = c.from_user_id === currentUser.id;
                const alias = isMe ? (c.to_alias || "Participante anônimo") : (c.from_alias || "Participante anônimo");
                return (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{alias}</p>
                      <p className="text-[#555] text-xs">Conectado {moment(c.updated_date).fromNow()}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge className="bg-emerald-900/40 text-emerald-400 border-0 text-[10px]">Conectado</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGE_DEFS.map(def => {
              const earned = earnedKeys.has(def.key);
              const earnedRecord = badges.find(b => b.badge_key === def.key);
              return (
                <div key={def.key} className={`relative rounded-xl border p-4 transition-all ${
                  earned
                    ? "bg-card border-primary/40 shadow-[0_0_16px_-4px_rgba(255,85,0,0.2)]"
                    : "bg-[#111] border-[#222] opacity-50"
                }`}>
                  <div className="text-3xl mb-2">{def.emoji}</div>
                  <p className={`font-semibold text-sm mb-0.5 ${earned ? "text-white" : "text-[#555]"}`}>{def.name}</p>
                  <p className="text-[10px] text-[#666] leading-relaxed">{def.desc}</p>
                  {earned && earnedRecord?.event_title && (
                    <p className="text-[10px] text-primary mt-1.5">em {earnedRecord.event_title}</p>
                  )}
                  {earned && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Event History */}
        <TabsContent value="history" className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)
          ) : tickets.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <Ticket className="w-8 h-8 text-[#444] mx-auto mb-2" />
              <p className="text-[#666] text-sm">Sem eventos ainda.</p>
              <Link to="/events" className="inline-flex items-center gap-1 mt-3 text-primary text-sm font-medium">
                Encontrar eventos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            tickets.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.event_title}</p>
                  <p className="text-[#666] text-xs">{t.event_date ? moment(t.event_date).format("D MMM, YYYY") : "—"} · {t.event_location || ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#555] uppercase">{t.ticket_type === "vip" ? "VIP" : t.ticket_type === "backstage" ? "Backstage" : "Pista"}</p>
                </div>
              </div>
            ))
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}