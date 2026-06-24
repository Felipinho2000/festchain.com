import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    const isStaff = user.active_mode === 'organizer' || user.role === 'admin';
    if (!isStaff) return Response.json({ status: 'error', message: 'Forbidden — switch to Organizer mode' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const qr_code = body && body.qr_code;
    if (!qr_code || typeof qr_code !== 'string') {
      return Response.json({ status: 'invalid', message: 'No QR code provided' });
    }

    // Service role bypasses RLS so door staff can read/validate any attendee's ticket.
    const tickets = await base44.asServiceRole.entities.Ticket.filter({ qr_code });
    if (!tickets || tickets.length === 0) {
      return Response.json({ status: 'invalid', message: 'Ticket not found' });
    }

    const ticket = tickets[0];
    if (ticket.status === 'used' || ticket.checked_in) {
      return Response.json({ status: 'used', message: 'This ticket already used for entry', ticket: { event_title: ticket.event_title, event_date: ticket.event_date } });
    }

    await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      status: 'used',
      checked_in: true,
      checked_in_at: new Date().toISOString()
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