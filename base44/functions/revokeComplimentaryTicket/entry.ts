import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Revoke a complimentary ticket — organizer-only, comps only, not yet checked in.
// Returns capacity to the pool (decrements event tickets_sold).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { ticket_id } = body;
    if (!ticket_id) return Response.json({ error: 'Missing ticket_id' }, { status: 400 });

    const ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });

    // Only comps can be revoked
    if (!ticket.is_complimentary) {
      return Response.json({ error: 'Not a complimentary ticket' }, { status: 400 });
    }

    // Cannot revoke if already checked in
    if (ticket.checked_in || ticket.status === 'used') {
      return Response.json({ error: 'Ticket already checked in' }, { status: 400 });
    }

    // Verify event ownership
    const event = await base44.asServiceRole.entities.Event.get(ticket.event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    if (!isAdmin && String(event.created_by_id) !== String(user.id)) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Revoke: mark expired, return capacity to pool
    await base44.asServiceRole.entities.Ticket.update(ticket_id, { status: 'expired' });

    const newSold = Math.max(0, (event.tickets_sold || 0) - 1);
    await base44.asServiceRole.entities.Event.update(ticket.event_id, { tickets_sold: newSold });

    return Response.json({ success: true, tickets_sold: newSold });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});