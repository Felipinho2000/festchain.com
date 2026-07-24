import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// reserveTicket — HARD-DISABLED (money-path security round).
//
// This function issued tickets with status:'active' directly, with no Stripe
// call anywhere in it — payment_method was client-supplied and defaulted to
// 'test'. Any signed-in user could invoke it directly (independent of what
// the UI links to) and receive a free, fully-valid, scannable ticket for any
// published event. It has been fully superseded by createCheckoutSession +
// stripeWebhook, which pre-create tickets as 'pending' and only activate them
// after a verified Stripe payment. Kept only so callers get a clear, typed
// error instead of a raw 404/500.
//
// To re-enable (e.g. for a deliberate free/RSVP-ticket flow): set
// RESERVATION_ENABLED = true AND add a server-side check that the event's
// real price for the requested tier is exactly 0 — never trust the client on
// this. Until then this is dead code below the switch.
const RESERVATION_ENABLED = false;

Deno.serve(async (req) => {
  try {
    if (!RESERVATION_ENABLED) {
      return Response.json({
        status: 'error',
        code: 'ticket_reservation_disabled',
        message: 'Direct ticket reservation is disabled. Purchase through checkout (createCheckoutSession).',
      }, { status: 403 });
    }

    // ── DEAD CODE BELOW — left in place for reference only ──
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    const payment_method = (body && body.payment_method) || 'test';
    const ticket_type = (body && body.ticket_type) || 'general';
    const VALID_TYPES = ['general', 'vip', 'backstage'];
    if (!VALID_TYPES.includes(ticket_type)) {
      return Response.json({ status: 'error', message: `Invalid ticket_type: ${ticket_type}. Must be one of: general, vip, backstage` });
    }
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
    let price = phase ? phase.price : (event.ticket_price || 0);

    // For non-general tiers, require a distinct price — reject if none configured
    if (ticket_type !== 'general') {
      const tierPriceField = `${ticket_type}_price`;
      const phaseTierPrice = phase ? phase[tierPriceField] : null;
      const eventTierPrice = event[tierPriceField];
      if (phaseTierPrice == null && eventTierPrice == null) {
        return Response.json({
          status: 'error',
          message: `${ticket_type.charAt(0).toUpperCase() + ticket_type.slice(1)} tickets are not available for this event — no distinct price configured.`
        });
      }
      price = phaseTierPrice != null ? phaseTierPrice : eventTierPrice;
    }

    const organizerId = event.created_by_id ? String(event.created_by_id) : null;

    // 7. Create ticket as the user (created_by_id = user for wallet access)
    const ticket = await base44.entities.Ticket.create({
      event_id: event.id,
      event_title: event.title,
      event_date: event.date,
      event_image: event.image_url,
      event_location: event.location_name,
      organizer_id: organizerId,
      ticket_type: ticket_type,
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

    // 10. Cashback — if event has cashback enabled, credit the buyer's wallet.
    //     Reuses processCashback's calculation + duplicate-prevention as-is.
    if (event.ftc_cashback_enabled && (event.ftc_cashback_percent || 0) > 0) {
      try {
        await base44.functions.invoke('processCashback', {
          event_id: event.id,
          purchase_reference: ticket.id,
          native_amount: price,
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