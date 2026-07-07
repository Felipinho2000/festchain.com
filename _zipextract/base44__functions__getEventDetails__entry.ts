import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Secure event details loader for the private pilot.
// Uses service-role reads so ticket holders can view private event pages,
// while unauthorized users receive only a generic private gate response.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    if (!event_id) return Response.json({ status: 'error', message: 'Missing event id' }, { status: 400 });

    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'not_found', message: 'Event not found' }, { status: 404 });

    const isPublicOpen = event.visibility === 'public' && ['published', 'live'].includes(event.status);
    const isCreator = String(event.created_by_id || '') === String(user.id || '');
    const isAdmin = user.role === 'admin';

    let hasValidTicket = false;
    try {
      const tickets = await base44.asServiceRole.entities.Ticket.filter({
        event_id: String(event.id),
        created_by_id: String(user.id)
      }, '-created_date', 20);

      hasValidTicket = (tickets || []).some((ticket) => {
        const status = ticket.status || 'active';
        return ['active', 'used'].includes(status) && String(ticket.event_id) === String(event.id);
      });
    } catch (_) {}

    if (!isPublicOpen && !isCreator && !isAdmin && !hasValidTicket) {
      // Keep this as an app-level denied response so the frontend can render
      // a proper private gate instead of losing the response body to SDK errors.
      return Response.json({
        status: 'denied',
        http_status: 403,
        message: 'This is a private event. You need an invitation or a valid ticket to view the details.'
      });
    }

    return Response.json({ status: 'success', event });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});
