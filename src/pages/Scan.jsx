import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, AlertTriangle, RotateCcw, Camera, Lock, Ban,
  Ticket as TicketIcon, User, Mail, Clock, Keyboard, Loader2
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
  const [cameraState, setCameraState] = useState("idle");
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [manual, setManual] = useState("");
  const [validating, setValidating] = useState(false);
  const [view, setView] = useState("scanner");

  const isHTTPS = window.location.protocol === "https:" || window.location.hostname === "localhost";

  useEffect(() => {
    if (!canScan) { setLoadingEvents(false); return; }
    const query = currentUser?.role === "admin" ? {} : { created_by_id: currentUser?.id };
    base44.entities.Event.filter(query, "-date", 50)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [canScan, currentUser]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const stopCamera = () => {
    const inst = html5Ref.current;
    if (inst) { inst.stop().catch(() => {}).finally(() => { html5Ref.current = null; }); }
    setCameraState("idle");
  };

  const handleCameraError = (err) => {
    const name = err?.name || "";
    let msg = "Camera error. Try the manual entry below.";
    if (!isHTTPS) {
      msg = "Camera access requires HTTPS. Please open FestChain from the secure live URL.";
    } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      msg = "Camera permission was denied. Please allow camera access in your browser settings.";
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      msg = "No camera found on this device.";
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      msg = "Camera is already in use by another app. Close other camera apps and try again.";
    } else if (name === "OverconstrainedError") {
      msg = "Your browser does not support camera scanning. Please try another browser.";
    } else {
      // Not a DOMException (e.g. html5-qrcode threw a plain string because of a
      // malformed constraints object) — log it so the real cause is visible
      // instead of silently falling back to the generic message.
      console.error("Camera start failed:", err);
    }
    setCamError(msg);
    setCameraState("error");
    if (html5Ref.current) {
      html5Ref.current.stop().catch(() => {});
      html5Ref.current = null;
    }
  };

  const startCamera = async () => {
    if (!eventId) return;
    if (!isHTTPS) {
      setCamError("Camera access requires HTTPS. Please open FestChain from the secure live URL.");
      setCameraState("error");
      return;
    }
    // Clear any instance left over from a previous attempt or error
    if (html5Ref.current) {
      try { await html5Ref.current.clear(); } catch (_) {}
      html5Ref.current = null;
    }
    setCameraState("requesting");
    setCamError(null);

    const onScan = async (decoded) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      try { if (html5Ref.current) await html5Ref.current.pause(); } catch (_) {}
      await runValidation(decoded);
    };

    const config = { fps: 10, qrbox: { width: 230, height: 230 } };

    // IMPORTANT: navigator.mediaDevices.getUserMedia() and Html5Qrcode.start()
    // expect DIFFERENT shapes for their constraints argument. Reusing one
    // object for both (as before) makes html5-qrcode throw on every browser:
    //   - getUserMedia() wants   { video: { facingMode: {...} } }
    //   - Html5Qrcode.start() wants  { facingMode: "environment" }  or
    //     { facingMode: { exact: "environment" } } — NEVER wrapped in
    //     "video", and NEVER with an "ideal" key (html5-qrcode's internal
    //     createVideoConstraints() only recognizes "exact"; anything else,
    //     including an unexpected top-level "video" key, makes it `throw` a
    //     plain string rather than a DOMException). That's why `err?.name`
    //     was always empty and you only ever saw the generic fallback
    //     message, on every device.
    const probeConstraint = { video: { facingMode: { ideal: "environment" } } };
    const html5StartConstraint = { facingMode: "environment" }; // soft preference, won't hard-fail on desktops with no back camera

    // Step 1: Ask the browser for camera permission via the standard Web API
    // first. This triggers the OS/browser permission prompt reliably on both
    // mobile and desktop, and surfaces denials before html5-qrcode touches the
    // camera.
    let probe = null;
    try {
      probe = await navigator.mediaDevices.getUserMedia(probeConstraint);
    } catch (err) {
      handleCameraError(err);
      return;
    }
    // Release the probe stream so html5-qrcode can acquire the camera cleanly.
    probe.getTracks().forEach((t) => t.stop());
    // Brief settle (esp. iOS Safari) so the track fully releases before re-acquire.
    await new Promise((r) => setTimeout(r, 150));

    // Step 2: Start html5-qrcode. Permission is already granted, so this won't
    // re-prompt.
    const html5 = new Html5Qrcode("reader");
    html5Ref.current = html5;
    try {
      await html5.start(html5StartConstraint, config, onScan, () => {});
      setCameraState("active");
    } catch (err) {
      handleCameraError(err);
    }
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
        <p className="text-[#555] text-xs mb-6">Organizer access is granted manually by the admin team during the private pilot.</p>
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

  const statusLabel = {
    idle: "Camera not started",
    requesting: "Requesting camera permission…",
    active: "Camera active — scanning",
    error: "Camera error",
  }[cameraState];

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
              {/* HTTPS warning */}
              {!isHTTPS && (
                <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Camera access requires HTTPS. Please open FestChain from the secure live URL. You can still enter ticket codes manually below.</p>
                </div>
              )}

              {/* Camera area */}
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-square sm:aspect-video">
                <div id="reader" className="w-full h-full" />

                {cameraState === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4">
                    <Camera className="w-12 h-12 text-[#555]" strokeWidth={1.5} />
                    <p className="text-[#888] text-sm max-w-xs">Tap the button below to start the camera and scan tickets.</p>
                    <button onClick={startCamera}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors">
                      <Camera className="w-4 h-4" /> Start Camera
                    </button>
                  </div>
                )}

                {cameraState === "requesting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={1.5} />
                    <p className="text-[#888] text-sm">Requesting camera permission…</p>
                  </div>
                )}

                {cameraState === "active" && !result && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                )}

                {cameraState === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4">
                    <AlertTriangle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
                    <p className="text-red-400 text-sm max-w-xs">{camError}</p>
                    <button onClick={startCamera}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-4 py-2 text-xs transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Retry Camera
                    </button>
                  </div>
                )}

                {cameraState === "active" && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    {statusLabel}
                  </div>
                )}

                {/* Result overlay */}
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

              {/* Status bar */}
              <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5">
                <span className={`text-xs font-medium ${cameraState === "active" ? "text-emerald-400" : cameraState === "error" ? "text-red-400" : "text-[#888]"}`}>
                  {validating ? "Validating ticket…" : statusLabel}
                </span>
                {cameraState === "active" && (
                  <button onClick={stopCamera} className="text-xs text-[#888] hover:text-red-400 font-medium">Stop Camera</button>
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
                    {validating ? "…" : "Validate Ticket"}
                  </button>
                </div>
              </form>
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