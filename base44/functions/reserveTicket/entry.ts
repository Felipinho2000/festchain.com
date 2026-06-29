import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Secure, server-side ticket issuing for the private MVP pilot.
// The frontend never creates tickets or increments tickets_sold directly.
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

    // 1. Load event (service role reads regardless of RLS)
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });

    // 2. Only published/live events are bookable
    if (!['published', 'live'].includes(event.status)) {
      return Response.json({ status: 'error', message: 'This event is not open for booking' });
    }

    // 3. Capacity
    if ((event.tickets_sold || 0) >= (event.total_capacity || 0)) {
      return Response.json({ status: 'error', message: 'Sold out' });
    }

    // 4. Prevent duplicates: one active ticket per user per event (pilot rule)
    const existing = await base44.asServiceRole.entities.Ticket.filter({
      event_id, created_by_id: String(user.id), status: 'active'
    });
    if (existing && existing.length > 0) {
      return Response.json({ status: 'error', message: 'You already have a ticket for this event' });
    }

    // 5. Generate QR securely server-side
    const qrCode = `FC-${crypto.randomUUID()}`;
    const reward = event.festcoin_reward || 0;

    // 6. Create the ticket as the user (so created_by_id = user → user can read it in Wallet)
    const ticket = await base44.entities.Ticket.create({
      event_id: event.id,
      event_title: event.title,
      event_date: event.date,
      event_image: event.image_url,
      event_location: event.location_name,
      ticket_type: 'general',
      price_paid: event.ticket_price || 0,
      payment_method,
      qr_code: qrCode,
      status: 'active',
      checked_in: false,
      festcoin_earned: reward
    });

    // 7. Increment tickets_sold (service role bypasses Event update RLS)
    try {
      const currentSold = event.tickets_sold || 0;
      await base44.asServiceRole.entities.Event.update(event.id, { tickets_sold: currentSold + 1 });
    } catch (_) {}

    // 8. FestCoin reward — created via service role but with created_by_id set to ticket owner
    if (reward > 0) {
      try {
        await base44.asServiceRole.entities.FestCoinTransaction.create({
          type: 'earned',
          amount: reward,
          description: `Pilot reward: ${event.title}`,
          event_id: event.id,
          event_title: event.title,
          status: 'confirmed',
          created_by_id: String(user.id)
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
        festcoin_earned: reward
      }
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});