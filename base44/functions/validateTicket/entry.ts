import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Hardened ticket check-in for the private MVP pilot.
// Requires admin / approved_organizer / the event's creator.
// Validates the ticket belongs to the selected event and can only be used once.
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

    // Permission: admin OR approved_organizer OR creator of this event.
    const isAdmin = user.role === 'admin';
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    const isCreator = !!(event && event.created_by_id && String(event.created_by_id) === String(user.id));
    const isApproved = user.approved_organizer === true;
    if (!isAdmin && !isApproved && !isCreator) {
      return Response.json({ status: 'unauthorized', message: 'You are not authorized to scan for this event' }, { status: 403 });
    }

    // Find ticket (service role bypasses Ticket read RLS for door staff)
    const tickets = await base44.asServiceRole.entities.Ticket.filter({ qr_code });
    if (!tickets || tickets.length === 0) {
      return Response.json({ status: 'invalid', message: 'Ticket not found' });
    }
    const ticket = tickets[0];

    // Ticket must belong to the event being scanned
    if (ticket.event_id !== event_id) {
      return Response.json({ status: 'invalid', message: 'This ticket does not belong to this event' });
    }

    // Already used?
    if (ticket.status === 'used' || ticket.checked_in) {
      return Response.json({ status: 'used', message: 'This ticket was already used for entry', ticket: { event_title: ticket.event_title, event_date: ticket.event_date } });
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
      ticket: { event_title: ticket.event_title, event_date: ticket.event_date, event_location: ticket.event_location }
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});