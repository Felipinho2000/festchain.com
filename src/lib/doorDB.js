// IndexedDB + Web Crypto helpers for offline door scanning.
// Stores per-event manifests and queued scans locally so the scanner
// works with no internet connection.

const DB_NAME = "festchain-door";
const DB_VERSION = 2;
let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("manifests"))
        db.createObjectStore("manifests", { keyPath: "event_id" });
      if (!db.objectStoreNames.contains("scans"))
        db.createObjectStore("scans", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("scanned"))
        db.createObjectStore("scanned", { keyPath: "key" });
      if (!db.objectStoreNames.contains("meta"))
        db.createObjectStore("meta", { keyPath: "key" });
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

async function getDeviceId() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readwrite");
    const store = tx.objectStore("meta");
    const req = store.get("device_id");
    req.onsuccess = () => {
      if (req.result?.value) { resolve(req.result.value); return; }
      const id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
      store.put({ key: "device_id", value: id });
      tx.oncomplete = () => resolve(id);
    };
    req.onerror = () => reject(req.error);
  });
}

async function storeManifest(eventId, manifest) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("manifests", "readwrite");
    tx.objectStore("manifests").put({ event_id: eventId, ...manifest, stored_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getManifest(eventId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("manifests", "readonly");
    const req = tx.objectStore("manifests").get(eventId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function queueScan(eventId, scan) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scans", "readwrite");
    const req = tx.objectStore("scans").add({ event_id: eventId, queued_at: Date.now(), ...scan });
    req.onsuccess = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingScans(eventId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scans", "readonly");
    const req = tx.objectStore("scans").getAll();
    req.onsuccess = () => resolve((req.result || []).filter(s => s.event_id === eventId));
    req.onerror = () => reject(req.error);
  });
}

async function clearPendingScans(eventId, ids) {
  if (!ids?.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scans", "readwrite");
    const store = tx.objectStore("scans");
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function markScanned(eventId, ticketId, scannedAt) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scanned", "readwrite");
    tx.objectStore("scanned").put({
      key: `${eventId}:${ticketId}`,
      event_id: eventId,
      ticket_id: ticketId,
      scanned_at: scannedAt,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getLocalScan(eventId, ticketId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scanned", "readonly");
    const req = tx.objectStore("scanned").get(`${eventId}:${ticketId}`);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function getScannedTicketIds(eventId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("scanned", "readonly");
    const req = tx.objectStore("scanned").getAll();
    req.onsuccess = () =>
      resolve(new Set((req.result || []).filter(s => s.event_id === eventId).map(s => s.ticket_id)));
    req.onerror = () => reject(req.error);
  });
}

function isManifestExpired(manifest) {
  if (!manifest?.expires_at) return true;
  return new Date(manifest.expires_at).getTime() < Date.now();
}

// Client-side HMAC-SHA256 — must match the server's computation using
// the per-manifest signing_key included in the manifest payload.
async function computeHMAC(message, hexKey) {
  const keyBytes = hexToBytes(hexKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(sig));
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return null;
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

export const doorDB = {
  getDeviceId, storeManifest, getManifest, queueScan,
  getPendingScans, clearPendingScans, getScannedTicketIds,
  markScanned, getLocalScan,
  isManifestExpired, computeHMAC, formatTimeAgo,
};