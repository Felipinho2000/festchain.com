import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { doorDB } from "@/lib/doorDB";

// Manages the offline door-scanning lifecycle for a single event:
// manifest fetch/cache, connectivity detection, offline validation,
// scan queue, and automatic sync on reconnect.
export function useDoorScanner(eventId, currentUser) {
  const [manifest, setManifest] = useState(null);
  const [manifestStatus, setManifestStatus] = useState("idle"); // idle|loading|loaded|error|expired|no_manifest
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(false);
  const [lastSyncTs, setLastSyncTs] = useState(null);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  const refreshPendingCount = useCallback(async () => {
    if (!eventIdRef.current) return;
    const scans = await doorDB.getPendingScans(eventIdRef.current);
    setPendingCount(scans.length);
  }, []);

  const loadManifest = useCallback(async (evId, { silent = false } = {}) => {
    if (!evId) { setManifest(null); setManifestStatus("idle"); return; }

    // Try cached manifest first for instant display.
    const cached = await doorDB.getManifest(evId);
    if (cached) {
      setManifest(cached);
      setManifestStatus(doorDB.isManifestExpired(cached) ? "expired" : "loaded");
    }

    if (typeof navigator !== "undefined" && navigator.onLine) {
      if (!cached && !silent) setManifestStatus("loading");
      try {
        const res = await base44.functions.invoke("getDoorManifest", { event_id: evId });
        const m = res.data?.manifest || res.data;
        if (m && m.tickets) {
          await doorDB.storeManifest(evId, m);
          setManifest(m);
          setManifestStatus("loaded");
          setLastSyncTs(Date.now());
          await doorDB.getManifest(evId).then(c => { if (c?.stored_at) setLastSyncTs(c.stored_at); });
        }
      } catch (e) {
        if (!cached) setManifestStatus("error");
      }
    } else if (!cached) {
      setManifestStatus("no_manifest");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load manifest when event changes.
  useEffect(() => {
    if (!eventId) { setManifest(null); setManifestStatus("idle"); return; }
    loadManifest(eventId);
    refreshPendingCount();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connectivity monitoring — auto-sync on reconnect.
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      if (eventIdRef.current) {
        loadManifest(eventIdRef.current, { silent: true });
        syncPending(eventIdRef.current);
      }
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncPending = useCallback(async (evId) => {
    const id = evId || eventIdRef.current;
    if (!id) return;
    const scans = await doorDB.getPendingScans(id);
    if (scans.length === 0) return;

    setSyncing(true);
    setSyncError(false);
    try {
      const res = await base44.functions.invoke("syncOfflineScans", {
        event_id: id,
        scans: scans.map(s => ({
          ticket_id: s.ticket_id,
          scanned_at: s.scanned_at,
          device_id: s.device_id,
          staff_user_id: s.staff_user_id,
        })),
      });
      await doorDB.clearPendingScans(id, scans.map(s => s.id));
      setSyncResult(res.data);
      refreshPendingCount();
      loadManifest(id, { silent: true });
    } catch (e) {
      setSyncError(true);
    } finally {
      setSyncing(false);
    }
  }, [refreshPendingCount, loadManifest]);

  // Validate a scanned QR code against the local manifest (offline path).
  // Returns { status, message, ticket?, scanned_at? } shaped like validateTicket.
  const validateOffline = useCallback(async (qrCode) => {
    if (!manifest) return { status: "error", message: "Sem lista offline" };
    if (doorDB.isManifestExpired(manifest))
      return { status: "expired", message: "Lista offline expirada" };

    const codeHash = await doorDB.computeHMAC(qrCode, manifest.signing_key);
    const ticket = manifest.tickets.find(t => t.code_hash === codeHash);

    if (!ticket)
      return { status: "invalid", message: "Ingresso não encontrado", offline: true };

    // Guard 1: server already marked this ticket as used (manifest flag).
    if (ticket.already_used) {
      return {
        status: "used",
        message: "Já utilizado",
        scanned_at: ticket.used_at,
        offline: true,
        ticket: { ...ticket, event_title: manifest.event_title },
      };
    }

    // Guard 2: this device has scanned this ticket before (persistent store).
    const priorLocal = await doorDB.getLocalScan(eventId, ticket.ticket_id);
    if (priorLocal) {
      return {
        status: "used",
        message: "Já escaneado neste dispositivo",
        scanned_at: priorLocal.scanned_at,
        offline: true,
        ticket: { ...ticket, event_title: manifest.event_title },
      };
    }

    // Guard 3: ticket is still in the unsynced pending queue (pre-sync dup).
    const localScans = await doorDB.getPendingScans(eventId);
    const already = localScans.find(s => s.ticket_id === ticket.ticket_id);
    if (already) {
      return {
        status: "used",
        message: "Já escaneado neste dispositivo",
        scanned_at: already.scanned_at,
        offline: true,
        ticket: { ...ticket, event_title: manifest.event_title },
      };
    }

    // Valid first scan — queue it for sync AND persist it locally.
    const deviceId = await doorDB.getDeviceId();
    const scan = {
      ticket_id: ticket.ticket_id,
      scanned_at: new Date().toISOString(),
      device_id: deviceId,
      staff_user_id: currentUser?.id,
      staff_user_name: currentUser?.full_name,
    };
    await doorDB.queueScan(eventId, scan);
    await doorDB.markScanned(eventId, ticket.ticket_id, scan.scanned_at);
    refreshPendingCount();

    return {
      status: "valid",
      message: "Entrada liberada",
      scanned_at: scan.scanned_at,
      offline: true,
      ticket: {
        ...ticket,
        event_title: manifest.event_title,
        is_complimentary: ticket.is_complimentary,
        comp_category: ticket.comp_category,
      },
    };
  }, [manifest, eventId, currentUser, refreshPendingCount]);

  return {
    manifest,
    manifestStatus,
    isOnline,
    pendingCount,
    syncing,
    syncResult,
    syncError,
    lastSyncAgo: doorDB.formatTimeAgo(lastSyncTs),
    ticketCount: manifest?.tickets?.length || 0,
    validateOffline,
    syncPending: () => syncPending(),
    refreshManifest: () => loadManifest(eventId),
  };
}