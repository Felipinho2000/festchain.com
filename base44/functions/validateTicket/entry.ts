import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Hardened ticket check-in for the private MVP pilot.
// Only admin or the specific event creator/owner can validate tickets.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'unauthorized', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const qr_code = body && body.qr_code;
    const event_id = body && body.event_id;
    if (!qr_code) return Response.json({ status: 'invalid', message: 'No QR code provided' });
    if (!event_id) return Response.json({ status: 'invalid', message: 'Select an event before scanning' });

    const isAdmin = user.role === 'admin';

    // Load event and verify scanner owns it (or is admin)
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'invalid', message: 'Event not found' });

    const isEventOwner = String(event.created_by_id) === String(user.id);

    // SECURITY: only admin or the event creator can scan — not any approved organizer globally
    if (!isAdmin && !isEventOwner) {
      return Response.json({ status: 'unauthorized', message: 'You are not authorized to scan for this event' }, { status: 403 });
    }

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ qr_code });
    if (!tickets || tickets.length === 0) {
      return Response.json({ status: 'invalid', message: 'Ticket not found' });
    }
    const ticket = tickets[0];

    if (ticket.event_id !== event_id) {
      return Response.json({ status: 'invalid', message: 'This ticket does not belong to this event' });
    }

    // Resolve attendee (the ticket owner)
    let attendee = null;
    if (ticket.created_by_id) {
      try {
        const u = await base44.asServiceRole.entities.User.get(String(ticket.created_by_id));
        attendee = { full_name: u.full_name || '', email: u.email || '' };
      } catch (_) {}
    }

    // Already used?
    if (ticket.status === 'used' || ticket.checked_in) {
      let scannedByUser = null;
      if (ticket.scanned_by) {
        try {
          const su = await base44.asServiceRole.entities.User.get(String(ticket.scanned_by));
          scannedByUser = { full_name: su.full_name || '', email: su.email || '' };
        } catch (_) {}
      }
      return Response.json({
        status: 'used',
        message: 'This ticket was already used for entry',
        ticket: { event_title: ticket.event_title, event_date: ticket.event_date, event_location: ticket.event_location },
        attendee,
        previous_scan: {
          at: ticket.scanned_at || ticket.checked_in_at || null,
          by: ticket.scanned_by || null,
          by_label: scannedByUser ? (scannedByUser.full_name || scannedByUser.email) : (ticket.scanned_by || null)
        }
      });
    }

    // Mark used exactly once
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      status: 'used',
      checked_in: true,
      checked_in_at: now,
      scanned_at: now,
      scanned_by: String(user.id)
    });

    return Response.json({
      status: 'valid',
      message: 'Entry approved',
      ticket: { event_title: ticket.event_title, event_date: ticket.event_date, event_location: ticket.event_location },
      attendee,
      scanned_at: now
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});