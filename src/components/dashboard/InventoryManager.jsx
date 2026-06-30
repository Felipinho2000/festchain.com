import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Pencil, Trash2, Package, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["drinks", "bottle_service", "food", "merchandise", "vip_table", "other"];
const CATEGORY_LABELS = {
  drinks: "Drinks 🍺", bottle_service: "Bottle Service 🍾",
  food: "Food 🍔", merchandise: "Merch 👕", vip_table: "VIP Table 👑", other: "Other ⚡"
};

const defaultForm = {
  name: "", description: "", category: "drinks", price_brl: "", emoji: "", stock: "", is_available: true
};

export default function InventoryManager({ events }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState(events?.[0]?.id || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadItems = async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    const menuItems = await base44.entities.VenueMenuItem.filter({ event_id: eventId }).catch(() => []);
    setItems(menuItems);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedEventId) loadItems(selectedEventId);
  }, [selectedEventId]);

  useEffect(() => {
    if (events?.length > 0 && !selectedEventId) setSelectedEventId(events[0].id);
  }, [events]);

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  const handleSave = async () => {
    setSaving(true);
    const price_ftc = Math.round(parseFloat(form.price_brl || 0) / 0.5 / 0.9); // 10% FTC discount
    const data = {
      event_id: selectedEventId,
      event_title: selectedEvent?.title || "",
      name: form.name,
      description: form.description,
      category: form.category,
      price_ftc,
      price_brl: parseFloat(form.price_brl) || 0,
      emoji: form.emoji,
      stock: form.stock ? parseInt(form.stock) : undefined,
      is_available: form.is_available,
    };
    if (editingId) {
      await base44.entities.VenueMenuItem.update(editingId, data);
      toast({ title: "Product updated" });
    } else {
      await base44.entities.VenueMenuItem.create(data);
      toast({ title: "Product added to menu" });
    }
    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    loadItems(selectedEventId);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "drinks",
      price_brl: item.price_brl?.toString() || "",
      emoji: item.emoji || "",
      stock: item.stock?.toString() || "",
      is_available: item.is_available !== false,
    });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.VenueMenuItem.delete(id);
    toast({ title: "Product removed" });
    loadItems(selectedEventId);
  };

  const toggleAvailability = async (item) => {
    await base44.entities.VenueMenuItem.update(item.id, { is_available: !item.is_available });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Package className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-[#666] text-sm">Create an event first to manage its inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Event selector + add button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-64 rounded-xl bg-card border-border">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 font-semibold text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* Products list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Package className="w-8 h-8 text-[#444] mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[#666] text-sm">No products yet. Add drinks, food, or merch for attendees to pre-order.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl flex-shrink-0">{item.emoji || "🍺"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white text-sm">{item.name}</p>
                  <Badge className={`text-[10px] border-0 ${item.is_available ? "bg-emerald-900/40 text-emerald-400" : "bg-[#222] text-[#888]"}`}>
                    {item.is_available ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <p className="text-xs text-[#666]">{CATEGORY_LABELS[item.category] || item.category} · R${item.price_brl?.toFixed(2)}{item.stock ? ` · ${item.stock} in stock` : ""}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleAvailability(item)} className="p-2 text-[#888] hover:text-primary rounded-lg hover:bg-[#1f1f1f] transition-colors">
                  {item.is_available ? <ToggleRight className="w-4 h-4" strokeWidth={1.5} /> : <ToggleLeft className="w-4 h-4" strokeWidth={1.5} />}
                </button>
                <button onClick={() => handleEdit(item)} className="p-2 text-[#888] hover:text-primary rounded-lg hover:bg-[#1f1f1f] transition-colors">
                  <Pencil className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-[#888] hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Label className="text-xs">Product Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl mt-1" placeholder="Heineken 600ml" />
              </div>
              <div>
                <Label className="text-xs">Emoji</Label>
                <Input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} className="rounded-xl mt-1 text-center text-xl" placeholder="🍺" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl mt-1 resize-none" rows={2} placeholder="Ice cold. Served at the main bar." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Price (R$)</Label>
                <Input type="number" value={form.price_brl} onChange={e => setForm(p => ({ ...p, price_brl: e.target.value }))} className="rounded-xl mt-1" placeholder="18.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Stock (optional)</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className="rounded-xl mt-1" placeholder="Unlimited" />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.is_available ? "active" : "hidden"} onValueChange={v => setForm(p => ({ ...p, is_available: v === "active" }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.price_brl}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl">
              {saving ? "Saving..." : editingId ? "Update Product" : "Add to Menu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}