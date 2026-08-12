// Shared authorization for who may operate the door/scanner for an event:
// the event's own creator, a platform admin, or an account the organizer has
// explicitly added as a scanner for this specific event (see
// manageEventScanner). Centralized here because validateTicket,
// getDoorManifest, and syncOfflineScans each independently re-implemented a
// narrower owner-or-admin-only check — which meant a second staff member's
// own login could never scan, the "only one phone works" pilot blocker.
export function canScanEvent(event: any, user: any): boolean {
  if (!event || !user) return false;
  if (user.role === 'admin') return true;
  if (String(event.created_by_id) === String(user.id)) return true;
  const scannerIds = Array.isArray(event.scanner_user_ids) ? event.scanner_user_ids : [];
  return scannerIds.some((id: any) => String(id) === String(user.id));
}
