import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, Plus, Calendar, TrendingUp,
  Ticket, Music, Pencil, Trash2, Lock, Settings, UserCheck
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InventoryManager from "@/components/dashboard/InventoryManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import RedemptionManager from "@/components/dashboard/RedemptionManager";
import FestCoinReport from "@/components/dashboard/FestCoinReport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";

const statusColors = {
  draft: "bg-[#222] text-[#888]",
  published: "bg-emerald-900/40 text-emerald-400",
  live: "bg-red-900/30 text-red-400",
  ended: "bg-[#222] text-[#666]",
  cancelled: "bg-red-900/30 text-red-400"
};

const tabClass = "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium text-[#888] data-[state=active]:text-white";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const [evts, tix] = await Promise.all([
      base44.entities.Event.filter({ created_by_id: currentUser.id }, "-created_date", 50).catch(() => []),
      base44.entities.Ticket.filter({ organizer_id: currentUser.id }, "-created_date", 500).catch(() => [])
    ]);
    setEvents(evts);
    setTickets(tix);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [currentUser]);

  const canOrganize = currentUser?.role === "admin" || currentUser?.approved_organizer === true;
  if (!canOrganize) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-white mb-2">Organizers only</h2>
        <p className="text-[#888] text-sm mb-2">This area is for approved organizers and admins.</p>
        <p className="text-[#555] text-xs mb-6">Organizer approval is granted manually by the admin team during the private pilot.</p>
        <Link to="/" className="text-primary font-semibold text-sm hover:underline">Back to Home</Link>
      </div>
    );
  }

  // Exclude demo tickets (tagged ticket_phase:'[DEMO]' or [DEMO] event title)
  // from KPIs and charts so synthetic data never inflates real analytics.
  const isDemoTicket = (t) => t.ticket_phase === '[DEMO]' || (t.event_title || '').startsWith('[DEMO]');
  const realTickets = tickets.filter(t => !isDemoTicket(t));

  const totalTicketsSold = events.reduce((s, e) => s + (e.tickets_sold || 0), 0);
  const totalRevenue = realTickets.reduce((s, t) => s + (t.price_paid || 0), 0);
  const checkedIn = realTickets.filter(t => t.checked_in).length;

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const day = moment().subtract(i, "days").format("YYYY-MM-DD");
    const dayLabel = moment().subtract(i, "days").format("MMM D");
    const count = realTickets.filter(t => moment(t.created_date).format("YYYY-MM-DD") === day).length;
    chartData.push({ name: dayLabel, tickets: count });
  }

  const handleDelete = async (id) => {
    await base44.entities.Event.delete(id);
    toast({ title: "Event deleted" });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-warmgray text-sm mb-1">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {currentUser?.full_name || "Organizer"}</p>
          <h1 className="font-heading font-bold text-3xl text-foreground flex items-center gap-2">
            Command Center <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Pilot</span>
          </h1>
          {currentUser?.role === "admin" && (
            <Link to="/pilot-setup" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-2 hover:underline">
              <Settings className="w-3.5 h-3.5" /> Pilot Setup checklist
            </Link>
          )}
        </div>
        <Link to="/dashboard/events/new">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 font-semibold text-sm">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} /> Create Event
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Est. Ticket Value", value: `R$ ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400 bg-emerald-900/20" },
          { label: "Tickets Issued", value: totalTicketsSold, icon: Ticket, color: "text-primary bg-primary/10" },
          { label: "Active Events", value: events.filter(e => e.status === "published" || e.status === "live").length, icon: Calendar, color: "text-primary bg-primary/10" },
          { label: "Checked In", value: checkedIn, icon: UserCheck, color: "text-emerald-400 bg-emerald-900/20" }
        ].map((kpi, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <p className="font-heading font-bold text-2xl text-white">{kpi.value}</p>
            <p className="text-xs text-[#888]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Sales Velocity Chart — shown once there is real activity */}
      {totalTicketsSold > 0 || realTickets.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-white mb-4">Sales Velocity (7 days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: 12 }} />
                <Line type="monotone" dataKey="tickets" stroke="hsl(24 95% 50%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(24 95% 50%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-heading font-semibold text-white text-sm">No sales yet</p>
            <p className="text-[#888] text-xs">Once guests reserve tickets, your sales velocity and check-in stats will appear here.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-transparent p-0 gap-4 border-b border-border rounded-none h-auto">
          <TabsTrigger value="events" className={tabClass}>Events</TabsTrigger>
          <TabsTrigger value="inventory" className={tabClass}>Inventory</TabsTrigger>
          <TabsTrigger value="redemptions" className={tabClass}>Redemptions</TabsTrigger>
          <TabsTrigger value="festcoin" className={tabClass}>FestCoin</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-4">Your Events</h3>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}</div>
            ) : events.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Calendar className="w-10 h-10 text-warmgray/40 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-white text-sm font-medium mb-1">No events yet</p>
                <p className="text-[#666] text-sm mb-4">Create your first event and start testing QR tickets, check-in, and FestCoin rewards.</p>
                <Link to="/dashboard/events/new"><Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl"><Plus className="w-4 h-4 mr-2" />Create Event</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(event => {
                  const soldPct = event.total_capacity ? Math.round(((event.tickets_sold || 0) / event.total_capacity) * 100) : 0;
                  return (
                    <div key={event.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex-shrink-0 overflow-hidden">
                        {event.image_url ? <img src={event.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-warmgray/30" strokeWidth={1.5} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Link to={`/events/${event.id}`} className="font-heading font-semibold text-sm text-white truncate hover:text-primary transition-colors">{event.title}</Link>
                          <Badge className={`text-[10px] px-2 py-0 border-0 ${statusColors[event.status]}`}>{event.status}</Badge>
                          <Badge className={`text-[10px] px-2 py-0 border-0 ${event.visibility === "private" ? "bg-amber-900/30 text-amber-400" : "bg-primary/10 text-primary"}`}>{event.visibility === "private" ? "Private" : "Public"}</Badge>
                        </div>
                        <p className="text-xs text-warmgray">{moment(event.date).format("MMM D, YYYY")} · {event.location_name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-warmgray">{event.tickets_sold || 0}/{event.total_capacity} sold</span>
                          <div className="flex-1 max-w-24 h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${soldPct}%` }} /></div>
                          <span className="text-xs font-medium text-primary">{soldPct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link to={`/dashboard/events/${event.id}/edit`} className="p-2 text-warmgray hover:text-primary rounded-lg hover:bg-secondary transition-colors" title="Edit event"><Pencil className="w-4 h-4" strokeWidth={1.5} /></Link>
                        <button onClick={() => handleDelete(event.id)} className="p-2 text-warmgray hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete event"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory"><InventoryManager events={events} /></TabsContent>
        <TabsContent value="redemptions"><RedemptionManager events={events} /></TabsContent>
        <TabsContent value="festcoin"><FestCoinReport events={events} /></TabsContent>
      </Tabs>
    </div>
  );
}