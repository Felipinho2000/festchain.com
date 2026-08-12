import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { canScanEvent } from '../../shared/eventAuth.ts';

// Applies queued offline scans in scanned_at order. If a ticket was already
// marked used online with an EARLIER timestamp, the offline scan is recorded
// as "conflito_duplicado" for organizer review — the person is already inside,
// the door's job is throughput, the report's job is truth.
// Idempotent per (ticket_id, device_id, scanned_at).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { event_id, scans } = body;
    if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 });
    if (!Array.isArray(scans)) return Response.json({ error: 'scans[] required' }, { status: 400 });

    // Authorization check — owner, admin, or an explicitly-added per-event
    // scanner. Fetched service-role so a scanner reading a private event
    // isn't blocked by RLS before this check runs.
    const event = await base44.asServiceRole.entities.Event.get(event_id).catch(() => null);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (!canScanEvent(event, user))
      return Response.json({ error: 'Not authorized for this event' }, { status: 403 });

    const organizerId = event.created_by_id;
    const eventTitle = event.title;
    const syncedAt = new Date().toISOString();

    // Sort by scanned_at ascending (earliest first).
    const sorted = [...scans].sort((a, b) =>
      new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime()
    );

    let applied = 0, conflicts = 0, alreadyKnown = 0;

    for (const scan of sorted) {
      const { ticket_id, scanned_at, device_id, staff_user_id } = scan;
      if (!ticket_id || !scanned_at || !device_id || !staff_user_id) continue;

      const idempotencyKey = `${ticket_id}:${device_id}:${scanned_at}`;

      // Idempotency: skip if this exact scan was already synced.
      const existing = await base44.asServiceRole.entities.DoorScan.filter(
        { idempotency_key: idempotencyKey }, '-created_date', 1
      );
      if (existing.length > 0) { alreadyKnown++; continue; }

      const ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id).catch(() => null);

      // SECURITY: the caller is authorized against `event_id` at the top of this
      // handler, but the tickets they submit were never checked against it. An
      // organizer could post another organizer's ticket ids under their OWN
      // event and burn them to 'used' — those guests are then refused at the
      // real door. A ticket that does not belong to this event is recorded as a
      // conflict for review and never written.
      if (ticket && String(ticket.event_id) !== String(event_id)) {
        await base44.asServiceRole.entities.DoorScan.create({
          event_id, event_title: eventTitle, organizer_id: organizerId,
          ticket_id, device_id, staff_user_id, staff_user_name: user.full_name,
          scanned_at, synced_at: syncedAt, sync_status: 'conflito_duplicado',
          idempotency_key: idempotencyKey,
        });
        conflicts++;
        continue;
      }

      if (!ticket) {
        // Ticket not found — record as conflict for review.
        await base44.asServiceRole.entities.DoorScan.create({
          event_id, event_title: eventTitle, organizer_id: organizerId,
          ticket_id, device_id, staff_user_id, staff_user_name: user.full_name,
          scanned_at, synced_at: syncedAt, sync_status: 'conflito_duplicado',
          idempotency_key: idempotencyKey,
        });
        conflicts++;
        continue;
      }

      const scanTime = new Date(scanned_at).getTime();
      const existingScanTime = ticket.scanned_at ? new Date(ticket.scanned_at).getTime() : null;

      if (!ticket.checked_in || existingScanTime === null) {
        // Not yet checked in — apply the scan.
        await base44.asServiceRole.entities.Ticket.update(ticket_id, {
          checked_in: true,
          checked_in_at: scanned_at,
          scanned_at: scanned_at,
          scanned_by: staff_user_id,
          status: 'used',
        });
        await base44.asServiceRole.entities.DoorScan.create({
          event_id, event_title: eventTitle, organizer_id: organizerId,
          ticket_id, ticket_holder_name: ticket.buyer_name,
          device_id, staff_user_id, staff_user_name: user.full_name,
          scanned_at, synced_at: syncedAt, sync_status: 'applied',
          idempotency_key: idempotencyKey,
        });
        applied++;
      } else if (existingScanTime < scanTime) {
        // Already used with an EARLIER timestamp — conflict (duplicate entry).
        await base44.asServiceRole.entities.DoorScan.create({
          event_id, event_title: eventTitle, organizer_id: organizerId,
          ticket_id, ticket_holder_name: ticket.buyer_name,
          device_id, staff_user_id, staff_user_name: user.full_name,
          scanned_at, synced_at: syncedAt, sync_status: 'conflito_duplicado',
          conflicting_scan_at: ticket.scanned_at,
          conflicting_scanned_by: ticket.scanned_by,
          idempotency_key: idempotencyKey,
        });
        conflicts++;
      } else {
        // Already used with same or later timestamp — already known.
        await base44.asServiceRole.entities.DoorScan.create({
          event_id, event_title: eventTitle, organizer_id: organizerId,
          ticket_id, ticket_holder_name: ticket.buyer_name,
          device_id, staff_user_id, staff_user_name: user.full_name,
          scanned_at, synced_at: syncedAt, sync_status: 'already_known',
          idempotency_key: idempotencyKey,
        });
        alreadyKnown++;
      }
    }

    return Response.json({ applied, conflicts, already_known: alreadyKnown, total: sorted.length });
  } catch (error) {
    console.error('syncOfflineScans error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}