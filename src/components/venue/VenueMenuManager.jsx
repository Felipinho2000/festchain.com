import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Wine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["drinks", "vip_table", "bottle_service", "merchandise", "food", "other"];
const EMOJIS = { drinks: "🍺", vip_table: "👑", bottle_service: "🍾", merchandise: "👕", food: "🍔", other: "⚡" };

const blank = { name: "", description: "", category: "drinks", price_ftc: "", price_brl: "", emoji: "", is_available: true };

export default function VenueMenuManager({ eventId, eventTitle }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.VenueMenuItem.filter({ event_id: eventId }).then(setItems).catch(() => {});
  };
  useEffect(() => { if (eventId) load(); }, [eventId]);

  const handleSave = async () => {
    if (!form.name || !form.price_ftc) return;
    setSaving(true);
    await base44.entities.VenueMenuItem.create({
      ...form,
      event_id: eventId,
      event_title: eventTitle,
      price_ftc: parseFloat(form.price_ftc),
      price_brl: parseFloat(form.price_brl) || 0,
      emoji: form.emoji || EMOJIS[form.category] || "⚡"
    });
    setForm(blank);
    load();
    setSaving(false);
    toast({ title: "Item added to venue menu" });
  };

  const handleDelete = async (id) => {
    await base44.entities.VenueMenuItem.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-white text-sm">Venue Menu</h3>

      {/* Add form */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-primary"
            placeholder="Item name" />
          <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={form.price_ftc} onChange={e => setForm(p => ({...p, price_ftc: e.target.value}))}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-primary"
            placeholder="Price FTC" />
          <input type="number" value={form.price_brl} onChange={e => setForm(p => ({...p, price_brl: e.target.value}))}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-primary"
            placeholder="Price R$ (opt)" />
          <input value={form.emoji} onChange={e => setForm(p => ({...p, emoji: e.target.value}))}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-primary"
            placeholder="Emoji 🍺" />
        </div>
        <Button onClick={handleSave} disabled={saving || !form.name || !form.price_ftc} size="sm"
          className="bg-primary text-white font-semibold rounded-lg h-8 px-4 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Item
        </Button>
      </div>

      {/* List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5">
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{item.name}</p>
                <p className="text-[#666] text-xs capitalize">{item.category.replace(/_/g, " ")}</p>
              </div>
              <span className="text-primary text-sm font-bold">{item.price_ftc} FTC</span>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-[#555] hover:text-red-400 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}