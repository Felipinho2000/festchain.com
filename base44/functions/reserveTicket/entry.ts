import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Secure, server-side ticket issuing for the private MVP pilot.
// Respects ticket phases: only the active phase within its sales window is buyable.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    const payment_method = (body && body.payment_method) || 'test';
    if (!event_id) return Response.json({ status: 'error', message: 'Missing event' }, { status: 400 });

    // 1. Load event (service role reads regardless of RLS — works for private events)
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });

    // 2. Only published/live events are bookable
    if (!['published', 'live'].includes(event.status)) {
      return Response.json({ status: 'error', message: 'This event is not open for booking' });
    }

    // 3. Capacity check (event-level)
    if ((event.tickets_sold || 0) >= (event.total_capacity || 0)) {
      return Response.json({ status: 'error', message: 'Sold out' });
    }

    // 4. Determine active ticket phase (if phases configured)
    let phase = null;
    if (event.ticket_phases && event.ticket_phases.length) {
      const now = new Date();
      phase = event.ticket_phases.find(p => {
        if (!p.active) return false;
        const start = p.sales_start ? new Date(p.sales_start) : null;
        const end = p.sales_end ? new Date(p.sales_end) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
      }) || null;
      if (!phase) return Response.json({ status: 'error', message: 'Tickets are not on sale yet — check the next phase opening.' });
    }

    // 5. Prevent duplicates: one active ticket per user per event
    const existing = await base44.asServiceRole.entities.Ticket.filter({
      event_id, created_by_id: String(user.id), status: 'active'
    });
    if (existing && existing.length > 0) {
      return Response.json({ status: 'error', message: 'You already have a ticket for this event' });
    }

    // 6. Generate QR securely server-side; use phase price/reward if available
    const qrCode = `FC-${crypto.randomUUID()}`;
    const reward = phase ? (phase.festcoin_reward ?? event.festcoin_reward ?? 0) : (event.festcoin_reward || 0);
    const price = phase ? phase.price : (event.ticket_price || 0);
    const organizerId = event.created_by_id ? String(event.created_by_id) : null;

    // 7. Create ticket as the user (created_by_id = user for wallet access)
    const ticket = await base44.entities.Ticket.create({
      event_id: event.id,
      event_title: event.title,
      event_date: event.date,
      event_image: event.image_url,
      event_location: event.location_name,
      organizer_id: organizerId,
      ticket_type: 'general',
      ticket_phase: phase ? phase.name : null,
      price_paid: price,
      payment_method,
      qr_code: qrCode,
      status: 'active',
      checked_in: false,
      festcoin_earned: reward
    });

    // 8. Increment tickets_sold
    try {
      const currentSold = event.tickets_sold || 0;
      await base44.asServiceRole.entities.Event.update(event.id, { tickets_sold: currentSold + 1 });
    } catch (_) {}

    // 9. FestCoin reward — user-scoped so created_by_id stamps correctly
    if (reward > 0) {
      try {
        await base44.entities.FestCoinTransaction.create({
          type: 'earned',
          amount: reward,
          description: `Pilot reward: ${event.title}`,
          event_id: event.id,
          event_title: event.title,
          status: 'confirmed',
        });
      } catch (_) {}
    }

    return Response.json({
      status: 'success',
      message: 'Ticket issued',
      ticket: {
        id: ticket.id,
        qr_code: qrCode,
        event_title: event.title,
        event_date: event.date,
        event_location: event.location_name,
        festcoin_earned: reward,
        ticket_phase: phase ? phase.name : null
      }
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});