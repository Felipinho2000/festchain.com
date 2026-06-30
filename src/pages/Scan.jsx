import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, AlertTriangle, RotateCcw, Camera, Lock, Ban,
  Ticket as TicketIcon, User, Mail, Clock, Keyboard
} from "lucide-react";
import moment from "moment";
import GuestList from "@/components/scan/GuestList";

export default function Scan() {
  const { currentUser } = useAuth();
  const canScan = currentUser?.role === "admin" || currentUser?.approved_organizer === true;
  const html5Ref = useRef(null);
  const lockedRef = useRef(false);
  const [result, setResult] = useState(null);
  const [camError, setCamError] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [manual, setManual] = useState("");
  const [validating, setValidating] = useState(false);
  const [view, setView] = useState("scanner");

  useEffect(() => {
    if (!canScan) { setLoadingEvents(false); return; }
    const query = currentUser?.role === "admin" ? {} : { created_by_id: currentUser?.id };
    base44.entities.Event.filter(query, "-date", 50)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [canScan, currentUser]);

  useEffect(() => {
    return () => {
      const inst = html5Ref.current;
      if (inst) { inst.stop().catch(() => {}).finally(() => { html5Ref.current = null; }); }
    };
  }, []);

  const stopCamera = () => {
    const inst = html5Ref.current;
    if (inst) { inst.stop().catch(() => {}).finally(() => { html5Ref.current = null; }); }
  };

  const startCamera = () => {
    if (!eventId || html5Ref.current) return;
    let mounted = true;
    const html5 = new Html5Qrcode("reader");
    html5Ref.current = html5;
    const onScan = async (decoded) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      try { await html5.pause(); } catch (_) {}
      await runValidation(decoded);
    };
    html5.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      onScan, () => {}
    ).catch(() => { if (mounted) setCamError("Camera unavailable — check browser permissions and ensure you're on HTTPS. You can still enter the code manually below."); });
  };

  const runValidation = async (qr) => {
    setValidating(true);
    try {
      const res = await base44.functions.invoke("validateTicket", { qr_code: qr, event_id: eventId });
      setResult(res.data || { status: "error", message: "No response" });
    } catch (e) {
      setResult({ status: "error", message: "Could not validate ticket" });
    } finally {
      setValidating(false);
    }
  };

  const resume = async () => {
    setResult(null);
    lockedRef.current = false;
    setManual("");
    try { if (html5Ref.current) await html5Ref.current.resume(); } catch (_) {}
  };

  const changeEvent = () => { stopCamera(); setResult(null); setEventId(""); setManual(""); setView("scanner"); };

  const submitManual = (e) => {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    lockedRef.current = true;
    try { if (html5Ref.current) html5Ref.current.pause(); } catch (_) {}
    runValidation(code);
  };

  if (!canScan) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-white mb-2">Organizers only</h2>
        <p className="text-[#888] text-sm mb-2">The scanner is for approved organizers and door staff.</p>
        <p className="text-[#555] text-xs mb-6">Organizer access is granted manually by the admin team during the private pilot — switching your profile view does not unlock it.</p>
        <Link to="/" className="text-primary font-semibold text-sm hover:underline">Back to Home</Link>
      </div>
    );
  }

  const config = {
    valid:        { icon: CheckCircle2, title: "Valid Ticket",       text: "text-emerald-400", border: "border-emerald-500/50", badge: "bg-emerald-500" },
    used:         { icon: AlertTriangle, title: "Already Checked In", text: "text-amber-400",    border: "border-amber-500/50",    badge: "bg-amber-500" },
    invalid:      { icon: XCircle, title: "Invalid Ticket",          text: "text-red-400",       border: "border-red-500/50",       badge: "bg-red-500" },
    unauthorized: { icon: Ban, title: "Not Authorized",             text: "text-red-400",       border: "border-red-500/50",       badge: "bg-red-500" },
    error:        { icon: XCircle, title: "Error",                   text: "text-red-400",       border: "border-red-500/50",       badge: "bg-red-500" },
  }[result?.status] || {};

  const selectedEvent = events.find(e => e.id === eventId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white mb-1">Ticket Scanner</h1>
        <p className="text-[#888] text-sm">Select an event to begin scanning.</p>
      </div>

      {!eventId ? (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-sm text-white font-medium">Select the event you're scanning for</p>
          {loadingEvents ? (
            <p className="text-[#888] text-sm">Loading your events…</p>
          ) : events.length === 0 ? (
            <div className="text-[#888] text-sm">
              <p className="mb-2">No events assigned to you.</p>
              <Link to="/dashboard" className="text-primary hover:underline text-sm">Create an event</Link> or ask an admin to assign you as staff.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setEventId(ev.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${eventId === ev.id ? "border-primary bg-primary/10" : "border-border bg-[#111] hover:border-[#444]"}`}
                >
                  <p className="text-white text-sm font-medium">{ev.title}</p>
                  <p className="text-[#666] text-xs">{ev.location_name}{ev.date ? ` · ${moment(ev.date).format("MMM D, h:mm A")}` : ""}</p>
                </button>
              ))}
            </div>
          )}
          {events.length > 0 && (
            <button onClick={startCamera} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl">
              Start scanning
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
            <div>
              <p className="text-[10px] text-[#666] uppercase tracking-wider">Scanning for</p>
              <p className="text-white text-sm font-medium">{selectedEvent?.title}</p>
            </div>
            <button onClick={changeEvent} className="text-primary text-xs font-medium hover:underline">Change event</button>
          </div>

          {/* Scanner / Guest List toggle */}
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            <button onClick={() => setView("scanner")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${view === "scanner" ? "bg-primary text-white" : "text-[#888] hover:text-white"}`}>
              <Camera className="w-4 h-4 inline mr-1.5" /> Scanner
            </button>
            <button onClick={() => { stopCamera(); setView("guestlist"); }}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${view === "guestlist" ? "bg-primary text-white" : "text-[#888] hover:text-white"}`}>
              <TicketIcon className="w-4 h-4 inline mr-1.5" /> Guest List
            </button>
          </div>

          {view === "scanner" && (
            <>
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-square sm:aspect-video">
                {camError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <Camera className="w-10 h-10 text-[#555] mb-3" strokeWidth={1.5} />
                    <p className="text-[#888] text-sm max-w-xs">{camError}</p>
                  </div>
                ) : (
                  <>
                    <div id="reader" className="w-full h-full" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="w-56 h-56 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>
                  </>
                )}

                {result && config.icon && (
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className={`rounded-xl p-4 bg-[#1a1a1a] border ${config.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.badge}`}>
                          <config.icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${config.text}`}>{config.title}</p>
                          <p className="text-[#888] text-xs">{result.message}</p>
                        </div>
                        <button onClick={resume} className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg flex-shrink-0">
                          <RotateCcw className="w-3.5 h-3.5" /> Next
                        </button>
                      </div>

                      {/* Attendee + details */}
                      {result.ticket && (
                        <div className="mt-3 pt-3 border-t border-[#222] space-y-1.5 text-xs">
                          <p className="text-white font-medium truncate"><TicketIcon className="w-3 h-3 inline mr-1.5" />{result.ticket.event_title}</p>
                          {result.attendee && (result.attendee.full_name || result.attendee.email) && (
                            <>
                              {result.attendee.full_name && <p className="text-[#aaa]"><User className="w-3 h-3 inline mr-1.5" />{result.attendee.full_name}</p>}
                              <p className="text-[#aaa] truncate"><Mail className="w-3 h-3 inline mr-1.5" />{result.attendee.email}</p>
                            </>
                          )}
                          {result.status === "valid" && result.scanned_at && (
                            <p className="text-emerald-400"><Clock className="w-3 h-3 inline mr-1.5" />Checked in {moment(result.scanned_at).format("MMM D, h:mm:ss A")}</p>
                          )}
                          {result.status === "used" && result.previous_scan && (
                            <>
                              <p className="text-amber-400"><Clock className="w-3 h-3 inline mr-1.5" />Previously checked in {result.previous_scan.at ? moment(result.previous_scan.at).format("MMM D, h:mm A") : "—"}</p>
                              {result.previous_scan.by_label && <p className="text-[#888]">By {result.previous_scan.by_label}</p>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Manual entry fallback */}
              <form onSubmit={submitManual} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <label className="text-xs text-[#888] flex items-center gap-1.5"><Keyboard className="w-3.5 h-3.5" /> Camera not working? Enter the ticket code manually</label>
                <div className="flex gap-2">
                  <input
                    value={manual}
                    onChange={e => setManual(e.target.value)}
                    placeholder="FC-..."
                    className="flex-1 bg-[#111] border border-border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-[#444] focus:outline-none focus:border-primary"
                  />
                  <button type="submit" disabled={validating || !manual.trim()} className="px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-50">
                    {validating ? "…" : "Validate"}
                  </button>
                </div>
              </form>

              {!result && !camError && (
                <p className="text-center text-[#555] text-xs">Align the ticket QR inside the frame. Each ticket is validated exactly once.</p>
              )}
            </>
          )}

          {view === "guestlist" && (
            <GuestList eventId={eventId} eventTitle={selectedEvent?.title} />
          )}
        </div>
      )}
    </div>
  );
}