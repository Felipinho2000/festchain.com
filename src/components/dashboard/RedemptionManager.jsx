import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, RefreshCw, Gift, Check, Ban } from "lucide-react";
import moment from "moment";

export default function RedemptionManager({ events }) {
  const [selectedEventId, setSelectedEventId] = useState(events?.[0]?.id || "");
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!selectedEventId) return;
    setLoading(true);
    base44.entities.EventRedemption.filter({ event_id: selectedEventId }, "-created_date", 500)
      .then(setRedemptions)
      .catch(() => setRedemptions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedEventId]);
  useEffect(() => { if (events?.length > 0 && !selectedEventId) setSelectedEventId(events[0].id); }, [events]);

  const markClaimed = async (id) => {
    await base44.entities.EventRedemption.update(id, { status: "claimed", claimed_at: new Date().toISOString() });
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: "claimed" } : r));
  };

  const cancelRedemption = async (id) => {
    await base44.entities.EventRedemption.update(id, { status: "cancelled" });
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: "cancelled" } : r));
  };

  const exportCSV = () => {
    const headers = ["Item", "Redemption Code", "Status", "FTC Cost", "Created Date", "User ID"];
    const rows = redemptions.map(r => [
      r.item_name || "",
      r.redemption_code || "",
      r.status || "",
      r.ftc_cost || 0,
      r.created_date ? moment(r.created_date).format("YYYY-MM-DD HH:mm:ss") : "",
      r.created_by_id || ""
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const eventTitle = events.find(e => e.id === selectedEventId)?.title || selectedEventId;
    a.href = url;
    a.download = `redemptions-${eventTitle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Gift className="w-10 h-10 text-[#444] mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-[#666] text-sm">Create an event first to manage redemptions.</p>
      </div>
    );
  }

  const statusColors = {
    redeemed: "bg-emerald-900/40 text-emerald-400",
    claimed: "bg-blue-900/40 text-blue-400",
    pending: "bg-amber-900/30 text-amber-400",
    cancelled: "bg-red-900/30 text-red-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-64 h-10 rounded-xl bg-card border border-border text-white text-sm px-3 focus:outline-none focus:border-primary"
        >
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <button onClick={load} className="text-[#888] hover:text-white p-2 rounded-lg hover:bg-secondary transition-colors">
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button onClick={exportCSV} disabled={redemptions.length === 0}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-2 rounded-lg disabled:opacity-40 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}</div>
      ) : redemptions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Gift className="w-8 h-8 text-[#444] mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[#666] text-sm">No redemptions yet for this event. Redemptions appear here when partygoers redeem items with FTC.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-[#666] font-semibold">
            <div className="col-span-3">Item</div>
            <div className="col-span-3">Code</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">FTC</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-[#1f1f1f] max-h-[60vh] overflow-y-auto">
            {redemptions.map(r => (
              <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs">
                <div className="col-span-3">
                  <p className="text-white font-medium truncate">{r.item_emoji} {r.item_name}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-[#aaa] font-mono truncate">{r.redemption_code || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusColors[r.status] || "bg-[#222] text-[#888]"}`}>
                    {r.status}
                  </span>
                </div>
                <div className="col-span-1 text-right text-primary font-semibold">{r.ftc_cost || 0}</div>
                <div className="col-span-2 text-[#888]">{r.created_date ? moment(r.created_date).format("MMM D, h:mm A") : "—"}</div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  {r.status === "redeemed" && (
                    <button onClick={() => markClaimed(r.id)} title="Mark as claimed"
                      className="p-1.5 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!["cancelled", "claimed"].includes(r.status) && (
                    <button onClick={() => cancelRedemption(r.id)} title="Cancel redemption"
                      className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}