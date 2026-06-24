import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, Plus, Calendar, Users, TrendingUp,
  Ticket, Music, Pencil, Trash2, Lock, Settings
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InventoryManager from "@/components/dashboard/InventoryManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";

const statusColors = {
  draft: "bg-[#222] text-[#888]",
  published: "bg-emerald-900/40 text-emerald-400",
  live: "bg-red-900/30 text-red-400",
  ended: "bg-[#222] text-[#666]",
  cancelled: "bg-red-900/30 text-red-400"
};

const defaultForm = {
  title: "", description: "", genre: "techno", date: "",
  end_date: "", location_name: "", location_address: "",
  ticket_price: "", festcoin_reward: "50", total_capacity: "",
  status: "published", dj_lineup: ""
};

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [evts, tix] = await Promise.all([
      base44.entities.Event.filter({ created_by_id: currentUser?.id }, "-created_date", 50).catch(() => []),
      base44.entities.Ticket.list("-created_date", 200).catch(() => [])
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
        <p className="text-[#555] text-xs mb-6">Organizer approval is granted manually by the admin team during the private pilot — switching your profile view does not unlock it.</p>
        <Link to="/" className="text-primary font-semibold text-sm hover:underline">Back to Home</Link>
      </div>
    );
  }

  const totalRevenue = tickets.reduce((s, t) => s + (t.price_paid || 0), 0);
  const totalAttendees = tickets.length;
  const checkedIn = tickets.filter(t => t.checked_in).length;
  const myEventIds = events.map(e => e.id);
  const myTickets = tickets.filter(t => myEventIds.includes(t.event_id));

  // Sales velocity chart (last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const day = moment().subtract(i, "days").format("YYYY-MM-DD");
    const dayLabel = moment().subtract(i, "days").format("MMM D");
    const count = myTickets.filter(t => moment(t.created_date).format("YYYY-MM-DD") === day).length;
    chartData.push({ name: dayLabel, tickets: count });
  }

  const handleSave = async () => {
    setSaving(true);
    const data = {
      title: form.title,
      description: form.description,
      genre: form.genre,
      date: form.date,
      end_date: form.end_date || undefined,
      location_name: form.location_name,
      location_address: form.location_address,
      ticket_price: parseFloat(form.ticket_price) || 0,
      festcoin_reward: parseInt(form.festcoin_reward) || 50,
      total_capacity: parseInt(form.total_capacity) || 100,
      status: form.status,
      organizer_name: currentUser?.full_name || "Organizer",
      dj_lineup: form.dj_lineup ? form.dj_lineup.split(",").map(s => s.trim()).filter(Boolean) : []
    };

    if (editingId) {
      await base44.entities.Event.update(editingId, data);
      toast({ title: "Event updated" });
    } else {
      await base44.entities.Event.create(data);
      toast({ title: "Event created!", description: "Your event is now live." });
    }
    setSaving(false);
    setCreateOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    loadData();
  };

  const handleEdit = (event) => {
    setForm({
      title: event.title || "",
      description: event.description || "",
      genre: event.genre || "techno",
      date: event.date ? moment(event.date).format("YYYY-MM-DDTHH:mm") : "",
      end_date: event.end_date ? moment(event.end_date).format("YYYY-MM-DDTHH:mm") : "",
      location_name: event.location_name || "",
      location_address: event.location_address || "",
      ticket_price: event.ticket_price?.toString() || "",
      festcoin_reward: event.festcoin_reward?.toString() || "50",
      total_capacity: event.total_capacity?.toString() || "",
      status: event.status || "published",
      dj_lineup: event.dj_lineup?.join(", ") || ""
    });
    setEditingId(event.id);
    setCreateOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.Event.delete(id);
    toast({ title: "Event deleted" });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-warmgray text-sm mb-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {currentUser?.full_name || "Organizer"}
          </p>
          <h1 className="font-heading font-bold text-3xl text-foreground flex items-center gap-2">
            Command Center <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Pilot</span>
          </h1>
          {currentUser?.role === "admin" && (
            <Link to="/pilot-setup" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-2 hover:underline">
              <Settings className="w-3.5 h-3.5" /> Pilot Setup checklist
            </Link>
          )}
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-foreground hover:bg-foreground/90 text-white rounded-xl h-10 px-4 font-semibold text-sm">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingId ? "Edit Event" : "Create New Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Event Name</Label>
                <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="rounded-xl mt-1" placeholder="Summer Solstice" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="rounded-xl mt-1 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Genre</Label>
                  <Select value={form.genre} onValueChange={v => setForm(p => ({...p, genre: v}))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["techno","house","trance","drum_and_bass","hip_hop","reggaeton","funk","pop","rock","sertanejo","other"].map(g => (
                        <SelectItem key={g} value={g}>{g.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date & Time</Label>
                  <Input type="datetime-local" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs">End Date & Time</Label>
                  <Input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className="rounded-xl mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Venue Name</Label>
                  <Input value={form.location_name} onChange={e => setForm(p => ({...p, location_name: e.target.value}))} className="rounded-xl mt-1" placeholder="Club Nova" />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input value={form.location_address} onChange={e => setForm(p => ({...p, location_address: e.target.value}))} className="rounded-xl mt-1" placeholder="São Paulo, SP" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Price (R$)</Label>
                  <Input type="number" value={form.ticket_price} onChange={e => setForm(p => ({...p, ticket_price: e.target.value}))} className="rounded-xl mt-1" placeholder="50" />
                </div>
                <div>
                  <Label className="text-xs">FC Reward</Label>
                  <Input type="number" value={form.festcoin_reward} onChange={e => setForm(p => ({...p, festcoin_reward: e.target.value}))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Capacity</Label>
                  <Input type="number" value={form.total_capacity} onChange={e => setForm(p => ({...p, total_capacity: e.target.value}))} className="rounded-xl mt-1" placeholder="500" />
                </div>
              </div>
              <div>
                <Label className="text-xs">DJ Lineup (comma separated)</Label>
                <Input value={form.dj_lineup} onChange={e => setForm(p => ({...p, dj_lineup: e.target.value}))} className="rounded-xl mt-1" placeholder="DJ Shadow, Amon Tobin" />
              </div>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.date || !form.location_name || !form.ticket_price} className="w-full h-11 bg-foreground hover:bg-foreground/90 text-white font-semibold rounded-xl">
                {saving ? "Saving..." : editingId ? "Update Event" : "Publish Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: `R$ ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          { label: "Tickets Sold", value: myTickets.length, icon: Ticket, color: "text-primary bg-primary/10" },
          { label: "Active Events", value: events.filter(e => e.status === "published" || e.status === "live").length, icon: Calendar, color: "text-blue-600 bg-blue-50" },
          { label: "Total Capacity", value: events.reduce((s, e) => s + (e.total_capacity || 0), 0), icon: Users, color: "text-amber bg-amber/10" }
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

      {/* Sales Velocity Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading font-semibold text-white mb-4">Sales Velocity (7 days)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: 12 }} />
              <Line type="monotone" dataKey="tickets" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, fill: "#7C3AED" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs: Events + Inventory */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-transparent p-0 gap-4 border-b border-border rounded-none h-auto">
          <TabsTrigger value="events" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium text-[#888] data-[state=active]:text-white">
            Events
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium text-[#888] data-[state=active]:text-white">
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
        <div>
        <h3 className="font-heading font-semibold text-lg text-white mb-4">Your Events</h3>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Calendar className="w-10 h-10 text-warmgray/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-warmgray text-sm">No events yet. Create your first event to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => {
              const soldPct = event.total_capacity ? Math.round(((event.tickets_sold || 0) / event.total_capacity) * 100) : 0;
              return (
                <div key={event.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-secondary flex-shrink-0 overflow-hidden">
                    {event.image_url ? (
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-warmgray/30" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-heading font-semibold text-sm text-white truncate">{event.title}</h4>
                      <Badge className={`text-[10px] px-2 py-0 border-0 ${statusColors[event.status]}`}>{event.status}</Badge>
                    </div>
                    <p className="text-xs text-warmgray">{moment(event.date).format("MMM D, YYYY")} · {event.location_name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-warmgray">{event.tickets_sold || 0}/{event.total_capacity} sold</span>
                      <div className="flex-1 max-w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${soldPct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-primary">{soldPct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(event)} className="p-2 text-warmgray hover:text-primary rounded-lg hover:bg-secondary transition-colors">
                      <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-warmgray hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManager events={events} />
        </TabsContent>
      </Tabs>
    </div>
  );
}