import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, AlertTriangle, RotateCcw, Camera, ShieldAlert,
  Ticket as TicketIcon, Lock, Ban
} from "lucide-react";
import moment from "moment";

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

  useEffect(() => {
    if (!canScan) { setLoadingEvents(false); return; }
    const query = currentUser?.role === "admin" ? {} : { created_by_id: currentUser?.id };
    base44.entities.Event.filter(query, "-date", 50)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [canScan, currentUser]);

  // Cleanup camera on unmount / when changing event
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
      try {
        const res = await base44.functions.invoke("validateTicket", { qr_code: decoded, event_id: eventId });
        setResult(res.data || { status: "error", message: "No response" });
      } catch (e) {
        setResult({ status: "error", message: "Could not validate ticket" });
      }
    };

    html5.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      onScan,
      () => {}
    ).catch(() => { if (mounted) setCamError("Camera unavailable — check browser permissions and ensure you're on HTTPS."); });
  };

  const resume = async () => {
    setResult(null);
    lockedRef.current = false;
    try { if (html5Ref.current) await html5Ref.current.resume(); } catch (_) {}
  };

  const changeEvent = () => {
    stopCamera();
    setResult(null);
    setEventId("");
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
    valid:        { icon: CheckCircle2, title: "Valid Ticket",       accent: "text-emerald-400 border-emerald-500/50", badge: "bg-emerald-500" },
    used:         { icon: AlertTriangle, title: "Already Checked In", accent: "text-amber-400 border-amber-500/50",    badge: "bg-amber-500" },
    invalid:      { icon: XCircle, title: "Invalid Ticket",          accent: "text-red-400 border-red-500/50",       badge: "bg-red-500" },
    unauthorized: { icon: Ban, title: "Not Authorized",             accent: "text-red-400 border-red-500/50",       badge: "bg-red-500" },
    error:        { icon: XCircle, title: "Error",                   accent: "text-red-400 border-red-500/50",       badge: "bg-red-500" },
  }[result?.status] || {};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white mb-1">Ticket Scanner</h1>
        <p className="text-[#888] text-sm">Select an event, then point the camera at a ticket QR.</p>
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
              <p className="text-white text-sm font-medium">{events.find(e => e.id === eventId)?.title}</p>
            </div>
            <button onClick={changeEvent} className="text-primary text-xs font-medium hover:underline">Change event</button>
          </div>

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
                <div className={`flex items-start gap-3 rounded-xl p-4 bg-[#1a1a1a] border ${config.accent.split(" ").find(c => c.startsWith("border-"))}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.badge}`}>
                    <config.icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${config.accent.split(" ").find(c => c.startsWith("text-"))}`}>{config.title}</p>
                    <p className="text-[#888] text-xs">{result.message}</p>
                    {result.ticket && (
                      <p className="text-white text-xs font-medium mt-1 truncate">
                        <TicketIcon className="w-3 h-3 inline mr-1" />{result.ticket.event_title}
                        {result.ticket.event_date && <span className="text-[#666]"> · {moment(result.ticket.event_date).format("MMM D, h:mm A")}</span>}
                      </p>
                    )}
                  </div>
                  <button onClick={resume} className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg flex-shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" /> Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {!result && !camError && (
            <p className="text-center text-[#555] text-xs">Align the ticket QR inside the frame. Each ticket is validated exactly once.</p>
          )}
        </div>
      )}
    </div>
  );
}