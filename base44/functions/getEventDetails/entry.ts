import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { countActiveHolds } from '../../shared/ticketHolds.ts';

// Secure event details loader for the private pilot.
// Uses service-role reads so ticket holders can view private event pages,
// while unauthorized users receive only a generic private gate response.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // A shared event link must open for ANYONE — no account required to see
    // what a party costs, where it is, and who's playing. Anonymous requests
    // are therefore expected here, and a missing/failed session is not an
    // error: `user` stays null and access is decided below.
    // Buying still requires an account (enforced server-side in
    // createCheckoutSession); private events still gate on invite/ticket.
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    if (!event_id) return Response.json({ status: 'error', message: 'Missing event id' }, { status: 400 });

    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'not_found', message: 'Event not found' }, { status: 404 });

    const isPublicOpen = event.visibility === 'public' && ['published', 'live'].includes(event.status);
    const isCreator = !!user && String(event.created_by_id || '') === String(user.id || '');
    const isAdmin = !!user && user.role === 'admin';

    // Only worth querying when the event is NOT already open to everyone —
    // saves a DB round-trip on the hottest public page in the product.
    let hasValidTicket = false;
    if (user && !isPublicOpen) {
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
    }

    if (!isPublicOpen && !isCreator && !isAdmin && !hasValidTicket) {
      // Keep this as an app-level denied response so the frontend can render
      // a proper private gate instead of losing the response body to SDK errors.
      return Response.json({
        status: 'denied',
        http_status: 403,
        message: 'This is a private event. You need an invitation or a valid ticket to view the details.'
      });
    }

    // This payload is now reachable anonymously, so strip the organizer's
    // account email from it. `organizer_name` is the intended public credit;
    // `created_by` is PII and must never be handed to a random visitor.
    if (!isCreator && !isAdmin) {
      delete event.created_by;
    }

    // Resolve the phase and remaining spots SERVER-SIDE, with exactly the same
    // rule createCheckoutSession uses (date window AND per-phase quantity).
    // The storefront used to compute the active phase in the browser from the
    // date window alone, so a sold-out Early Bird lote kept advertising the
    // cheap price and the buyer only found out at checkout. Price shown must
    // equal price charged.
    let activePhase = null;
    // Read-only: this is the hottest public page in the product, so it counts
    // live holds but never writes. Sweeping is the checkout path's job.
    const { held: heldCount } = await countActiveHolds(base44, event.id);

    if (Array.isArray(event.ticket_phases) && event.ticket_phases.length) {
      const now = new Date();
      const openByDate = event.ticket_phases.filter((p) => {
        if (!p || !p.active) return false;
        const start = p.sales_start ? new Date(p.sales_start) : null;
        const end = p.sales_end ? new Date(p.sales_end) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
      });

      for (const candidate of openByDate) {
        const phaseQty = Math.floor(Number(candidate.quantity) || 0);
        if (phaseQty <= 0) { activePhase = candidate; break; }
        try {
          const taken = await base44.asServiceRole.entities.Ticket.filter(
            {
              event_id: String(event.id),
              ticket_phase: candidate.name,
              status: { $in: ['active', 'used', 'pending'] },
            },
            '-created_date',
            phaseQty
          );
          if ((taken || []).length < phaseQty) { activePhase = candidate; break; }
        } catch (_) {
          continue;
        }
      }
    }

    const spotsLeft = Math.max(
      0,
      (event.total_capacity || 0) - (event.tickets_sold || 0) - heldCount
    );

    return Response.json({
      status: 'success',
      event,
      active_phase: activePhase,
      spots_left: spotsLeft,
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});