import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, AlertTriangle, RotateCcw, Camera, ShieldAlert, Ticket as TicketIcon
} from "lucide-react";
import moment from "moment";

export default function Scan() {
  const { currentUser } = useAuth();
  const isOrganizer = ["organizer", "admin"].includes(currentUser?.role);
  const html5Ref = useRef(null);
  const lockedRef = useRef(false);
  const [result, setResult] = useState(null);
  const [camError, setCamError] = useState(null);

  useEffect(() => {
    if (!isOrganizer) return;
    let mounted = true;
    const html5 = new Html5Qrcode("reader");
    html5Ref.current = html5;

    const onScan = async (decoded) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      try { await html5.pause(); } catch (_) {}
      try {
        const res = await base44.functions.invoke("validateTicket", { qr_code: decoded });
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
    ).catch(() => {
      if (mounted) setCamError("Camera unavailable — check browser permissions and ensure you're on HTTPS.");
    });

    return () => {
      mounted = false;
      const inst = html5Ref.current;
      if (inst) {
        inst.stop().catch(() => {}).finally(() => { html5Ref.current = null; });
      }
    };
  }, [isOrganizer]);

  const resume = async () => {
    setResult(null);
    lockedRef.current = false;
    try { if (html5Ref.current) await html5Ref.current.resume(); } catch (_) {}
  };

  if (!isOrganizer) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-white mb-2">Staff only</h2>
        <p className="text-[#888] text-sm mb-6">This scanner is for event organizers and door staff.</p>
        <Link to="/" className="text-primary font-semibold text-sm hover:underline">Back to Home</Link>
      </div>
    );
  }

  const config = {
    valid:   { icon: CheckCircle2, title: "Valid Ticket",    accent: "text-emerald-400 border-emerald-500/50 badge:bg-emerald-500" },
    used:    { icon: AlertTriangle, title: "Already Checked In", accent: "text-amber-400 border-amber-500/50 badge:bg-amber-500" },
    invalid: { icon: XCircle, title: "Invalid Ticket",       accent: "text-red-400 border-red-500/50 badge:bg-red-500" },
    error:   { icon: XCircle, title: "Error",                accent: "text-red-400 border-red-500/50 badge:bg-red-500" },
  }[result?.status] || {};

  const badgeBg = result?.status === "valid" ? "bg-emerald-500"
    : result?.status === "used" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white mb-1">Ticket Scanner</h1>
        <p className="text-[#888] text-sm">Point the camera at a ticket QR code.</p>
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${badgeBg}`}>
                <config.icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${config.accent.split(" ").find(c => c.startsWith("text-"))}`}>
                  {config.title}
                </p>
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
        <p className="text-center text-[#555] text-xs">Align the ticket QR inside the frame. Scan only verifies and marks tickets — nothing is stored.</p>
      )}
    </div>
  );
}