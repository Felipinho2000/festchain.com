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
    let msg = "Erro na câmera. Use a digitação manual abaixo.";
    if (!isHTTPS) {
      msg = "O acesso à câmera exige HTTPS. Abra o FestChain pelo link seguro publicado.";
    } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      msg = "Permissão de câmera negada. Autorize o acesso à câmera nas configurações do navegador.";
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      msg = "Nenhuma câmera encontrada neste dispositivo.";
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      msg = "A câmera já está em uso por outro app. Feche outros apps de câmera e tente novamente.";
    } else if (name === "OverconstrainedError") {
      msg = "Seu navegador não é compatível com a leitura por câmera. Tente outro navegador.";
    } else {
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
      setCamError("O acesso à câmera exige HTTPS. Abra o FestChain pelo link seguro publicado.");
      setCameraState("error");
      return;
    }
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
    const probeConstraint = { video: { facingMode: { ideal: "environment" } } };
    const html5StartConstraint = { facingMode: "environment" };

    let probe = null;
    try {
      probe = await navigator.mediaDevices.getUserMedia(probeConstraint);
    } catch (err) {
      handleCameraError(err);
      return;
    }
    probe.getTracks().forEach((t) => t.stop());
    await new Promise((r) => setTimeout(r, 150));

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
      setResult(res.data || { status: "error", message: "Sem resposta" });
    } catch (e) {
      setResult({ status: "error", message: "Não foi possível validar o ingresso" });
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
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Apenas organizadores</h2>
        <p className="text-muted-foreground text-sm mb-2">O scanner é para organizadores aprovados e equipe de portaria.</p>
        <p className="text-muted-foreground/60 text-xs mb-6">O acesso é liberado manualmente pela equipe durante o piloto privado.</p>
        <Link to="/" className="text-primary font-semibold text-sm hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const config = {
    valid:        { icon: CheckCircle2, title: "Ingresso válido",       text: "text-success", border: "border-success/50", badge: "bg-success" },
    used:         { icon: AlertTriangle, title: "Check-in já realizado", text: "text-warning",    border: "border-warning/50",    badge: "bg-warning" },
    invalid:      { icon: XCircle, title: "Ingresso inválido",          text: "text-destructive", border: "border-destructive/50", badge: "bg-destructive" },
    unauthorized: { icon: Ban, title: "Sem autorização",             text: "text-destructive", border: "border-destructive/50", badge: "bg-destructive" },
    error:        { icon: XCircle, title: "Erro",                   text: "text-destructive", border: "border-destructive/50", badge: "bg-destructive" },
  }[result?.status] || {};

  const selectedEvent = events.find(e => e.id === eventId);

  const statusLabel = {
    idle: "Câmera parada",
    requesting: "Solicitando permissão de câmera…",
    active: "Câmera ativa — escaneando",
    error: "Erro na câmera",
  }[cameraState];

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8 space-y-4">
      <div>
        <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Check-in</h1>
        <p className="text-muted-foreground text-sm">Seleciona um rolê pra começar a escanear.</p>
      </div>

      {!eventId ? (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-soft">
          <p className="text-sm text-foreground font-medium">Seleciona o rolê que você vai escanear</p>
          {loadingEvents ? (
            <p className="text-muted-foreground text-sm">Carregando seus eventos…</p>
          ) : events.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              <p className="mb-2">Nenhum rolê atribuído a você.</p>
              <Link to="/dashboard" className="text-primary hover:underline text-sm">Criar evento</Link> ou peça a um admin para te adicionar como equipe.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setEventId(ev.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${eventId === ev.id ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"}`}
                >
                  <p className="text-foreground text-sm font-medium">{ev.title}</p>
                  <p className="text-muted-foreground text-xs">{ev.location_name}{ev.date ? ` · ${moment(ev.date).format("MMM D, h:mm A")}` : ""}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3 shadow-soft">
            <div>
              <p className="text-[10px] text-muted-foreground tracking-wider">Escaneando</p>
              <p className="text-foreground text-sm font-medium">{selectedEvent?.title}</p>
            </div>
            <button onClick={changeEvent} className="text-primary text-xs font-medium hover:underline">Trocar evento</button>
          </div>

          {/* Scanner / Guest List toggle */}
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
            <button onClick={() => setView("scanner")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${view === "scanner" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
              <Camera className="w-4 h-4 inline mr-1.5" strokeWidth={1.75} /> Scanner
            </button>
            <button onClick={() => { stopCamera(); setView("guestlist"); }}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${view === "guestlist" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
              <TicketIcon className="w-4 h-4 inline mr-1.5" strokeWidth={1.75} /> Lista
            </button>
          </div>

          {view === "scanner" && (
            <>
              {!isHTTPS && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                  <p>O acesso à câmera exige HTTPS. Abra o FestChain pelo link seguro publicado. Você ainda pode digitar o código do ingresso manualmente abaixo.</p>
                </div>
              )}

              {/* Camera area */}
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-square sm:aspect-video shadow-card">
                <div id="reader" className="w-full h-full" />

                {cameraState === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4">
                    <Camera className="w-12 h-12 text-muted-foreground/40" strokeWidth={1.5} />
                    <p className="text-muted-foreground text-sm max-w-xs">Toque no botão abaixo para iniciar a câmera e escanear ingressos.</p>
                    <button onClick={startCamera}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors shadow-glow">
                      <Camera className="w-4 h-4" strokeWidth={1.75} /> Iniciar câmera
                    </button>
                  </div>
                )}

                {cameraState === "requesting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={1.5} />
                    <p className="text-muted-foreground text-sm">Solicitando permissão de câmera…</p>
                  </div>
                )}

                {cameraState === "active" && !result && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                )}

                {cameraState === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4">
                    <AlertTriangle className="w-10 h-10 text-destructive" strokeWidth={1.5} />
                    <p className="text-destructive text-sm max-w-xs">{camError}</p>
                    <button onClick={startCamera}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl px-4 py-2 text-xs transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Tentar novamente
                    </button>
                  </div>
                )}

                {cameraState === "active" && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-success text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                    {statusLabel}
                  </div>
                )}

                {/* Result overlay */}
                {result && config.icon && (
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className={`rounded-xl p-4 bg-card border ${config.border} shadow-raised`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.badge}`}>
                          <config.icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${config.text}`}>{config.title}</p>
                          <p className="text-muted-foreground text-xs">{result.message}</p>
                        </div>
                        <button onClick={resume} className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg flex-shrink-0 transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Próximo
                        </button>
                      </div>

                      {result.ticket && (
                        <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
                          <p className="text-foreground font-medium truncate"><TicketIcon className="w-3 h-3 inline mr-1.5" strokeWidth={1.75} />{result.ticket.event_title}</p>
                          {result.ticket.is_complimentary && result.ticket.comp_category && (
                            <div className="inline-flex items-center gap-1.5 bg-warning/20 text-warning px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide">
                              CORTESIA · {result.ticket.comp_category}
                            </div>
                          )}
                          {result.attendee && (result.attendee.full_name || result.attendee.email) && (
                            <>
                              {result.attendee.full_name && <p className="text-muted-foreground"><User className="w-3 h-3 inline mr-1.5" strokeWidth={1.75} />{result.attendee.full_name}</p>}
                              <p className="text-muted-foreground truncate"><Mail className="w-3 h-3 inline mr-1.5" strokeWidth={1.75} />{result.attendee.email}</p>
                            </>
                          )}
                          {result.status === "valid" && result.scanned_at && (
                            <p className="text-success"><Clock className="w-3 h-3 inline mr-1.5" strokeWidth={1.75} />Check-in {moment(result.scanned_at).format("D MMM, HH:mm:ss")}</p>
                          )}
                          {result.status === "used" && result.previous_scan && (
                            <>
                              <p className="text-warning"><Clock className="w-3 h-3 inline mr-1.5" strokeWidth={1.75} />Check-in anterior {result.previous_scan.at ? moment(result.previous_scan.at).format("D MMM, HH:mm") : "—"}</p>
                              {result.previous_scan.by_label && <p className="text-muted-foreground">Por {result.previous_scan.by_label}</p>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5 shadow-soft">
                <span className={`text-xs font-medium ${cameraState === "active" ? "text-success" : cameraState === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {validating ? "Validando ingresso…" : statusLabel}
                </span>
                {cameraState === "active" && (
                  <button onClick={stopCamera} className="text-xs text-muted-foreground hover:text-destructive font-medium transition-colors">Parar câmera</button>
                )}
              </div>

              {/* Manual entry fallback */}
              <form onSubmit={submitManual} className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-soft">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Keyboard className="w-3.5 h-3.5" strokeWidth={1.75} /> Câmera não funciona? Digite o código do ingresso manualmente</label>
                <div className="flex gap-2">
                  <input
                    value={manual}
                    onChange={e => setManual(e.target.value)}
                    placeholder="FC-..."
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
                  />
                  <button type="submit" disabled={validating || !manual.trim()} className="px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                    {validating ? "…" : "Validar"}
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