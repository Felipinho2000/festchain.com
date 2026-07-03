import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, RefreshCw, Ticket as TicketIcon, Check, X, AlertTriangle } from "lucide-react";
import moment from "moment";

export default function GuestList({ eventId, eventTitle }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    base44.entities.Ticket.filter({ event_id: eventId }, "-created_date", 500)
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [eventId]);

  const checkedIn = tickets.filter(t => t.checked_in).length;

  const exportCSV = () => {
    const headers = ["Ticket ID", "QR Code", "Status", "Checked In", "Checked In At"];
    const rows = tickets.map(t => [
      t.id,
      t.qr_code || "",
      t.status || "",
      t.checked_in ? "Yes" : "No",
      t.checked_in_at ? moment(t.checked_in_at).format("YYYY-MM-DD HH:mm:ss") : ""
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guestlist-${eventTitle || eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl h-12 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
        <div className="text-sm">
          <span className="text-white font-semibold">{tickets.length}</span>
          <span className="text-[#888]"> tickets · </span>
          <span className="text-emerald-400 font-semibold">{checkedIn}</span>
          <span className="text-[#888]"> checked in</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-[#888] hover:text-white p-2 rounded-lg hover:bg-secondary transition-colors">
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={exportCSV} disabled={tickets.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-2 rounded-lg disabled:opacity-40 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>If camera or internet fails, use this guest list and manual code validation.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <TicketIcon className="w-8 h-8 text-[#444] mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[#666] text-sm">No tickets issued for this event yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-[#666] font-semibold">
            <div className="col-span-5">Ticket ID / QR</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-4">Checked In</div>
          </div>
          <div className="divide-y divide-[#1f1f1f] max-h-[60vh] overflow-y-auto">
            {tickets.map(t => (
              <div key={t.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs">
                <div className="col-span-5">
                  <p className="text-white font-medium truncate">{t.id.slice(0, 8)}…</p>
                  <p className="text-[#555] font-mono text-[10px] truncate">{t.qr_code || "—"}</p>
                </div>
                <div className="col-span-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${t.status === "active" ? "bg-emerald-900/40 text-emerald-400" : t.status === "used" ? "bg-[#222] text-[#888]" : "bg-red-900/30 text-red-400"}`}>
                    {t.status}
                  </span>
                </div>
                <div className="col-span-4">
                  {t.checked_in ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Check className="w-3 h-3" /> {t.checked_in_at ? moment(t.checked_in_at).format("MMM D, h:mm A") : "Yes"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#555]">
                      <X className="w-3 h-3" /> Not yet
                    </span>
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