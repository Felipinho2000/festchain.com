import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@^14.0.0';

// Creates a Stripe Checkout session for ticket purchase (Pix + Credit Card).
// Pre-creates a pending ticket + reward + cashback via user-scoped SDK so
// created_by_id is stamped correctly. The webhook activates them after payment.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    const ticket_type = (body && body.ticket_type) || 'general';
    if (!event_id) return Response.json({ status: 'error', message: 'Missing event' }, { status: 400 });

    const VALID_TYPES = ['general', 'vip', 'backstage'];
    if (!VALID_TYPES.includes(ticket_type)) {
      return Response.json({ status: 'error', message: `Invalid ticket_type: ${ticket_type}` });
    }

    // 1. Load event
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });

    // 2. Only published/live events are bookable
    if (!['published', 'live'].includes(event.status)) {
      return Response.json({ status: 'error', message: 'This event is not open for booking' });
    }

    // 3. Capacity check
    if ((event.tickets_sold || 0) >= (event.total_capacity || 0)) {
      return Response.json({ status: 'error', message: 'Sold out' });
    }

    // 4. Active ticket phase
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

    // 5. Prevent duplicate active tickets
    const existing = await base44.asServiceRole.entities.Ticket.filter({
      event_id, created_by_id: String(user.id), status: 'active'
    });
    if (existing && existing.length > 0) {
      return Response.json({ status: 'error', message: 'You already have a ticket for this event' });
    }

    // 6. Determine price + reward
    const reward = phase ? (phase.festcoin_reward ?? event.festcoin_reward ?? 0) : (event.festcoin_reward || 0);
    let price = phase ? phase.price : (event.ticket_price || 0);
    if (ticket_type !== 'general') {
      const tierPriceField = `${ticket_type}_price`;
      const phaseTierPrice = phase ? phase[tierPriceField] : null;
      const eventTierPrice = event[tierPriceField];
      if (phaseTierPrice == null && eventTierPrice == null) {
        return Response.json({ status: 'error', message: `${ticket_type.charAt(0).toUpperCase() + ticket_type.slice(1)} tickets are not available for this event` });
      }
      price = phaseTierPrice != null ? phaseTierPrice : eventTierPrice;
    }

    const organizerId = event.created_by_id ? String(event.created_by_id) : null;
    const qrCode = `FC-${crypto.randomUUID()}`;

    // 7. Pre-create ticket as 'pending' (user-scoped → correct created_by_id)
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
      payment_method: 'pix',
      qr_code: qrCode,
      status: 'pending',
      checked_in: false,
      festcoin_earned: reward
    });

    // 8. Pre-create reward transaction as 'pending' (user-scoped → correct created_by_id)
    let rewardTxId = '';
    if (reward > 0) {
      try {
        const rewardTx = await base44.entities.FestCoinTransaction.create({
          type: 'earned',
          amount: reward,
          description: `Reward: ${event.title}`,
          event_id: event.id,
          event_title: event.title,
          status: 'pending',
        });
        rewardTxId = rewardTx.id;
      } catch (_) {}
    }

    // 9. Pre-create cashback transaction as 'pending' if cashback enabled
    let cashbackTxId = '';
    if (event.ftc_cashback_enabled && (event.ftc_cashback_percent || 0) > 0 && price > 0) {
      const rate = event.ftc_conversion_rate || 1;
      if (rate > 0) {
        const cashbackNative = price * ((event.ftc_cashback_percent || 0) / 100);
        const cashbackFtc = Math.floor(cashbackNative / rate);
        if (cashbackFtc > 0) {
          try {
            const cashbackTx = await base44.entities.FestCoinTransaction.create({
              type: 'earned',
              amount: cashbackFtc,
              description: `Cashback (${event.ftc_cashback_percent}% of ${event.currency_code || 'BRL'} ${price})`,
              event_id: event.id,
              event_title: event.title,
              source: 'cashback',
              status: 'pending',
              reference_id: ticket.id,
              native_amount: cashbackNative,
              conversion_rate: rate,
              is_pilot: event.ftc_pilot_mode !== false,
            });
            cashbackTxId = cashbackTx.id;
          } catch (_) {}
        }
      }
    }

    // 10. Create Stripe Checkout session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix', 'card'],
      line_items: [{
        price_data: {
          currency: (event.currency_code || 'BRL').toLowerCase(),
          product_data: {
            name: `${event.title} — ${ticket_type.charAt(0).toUpperCase() + ticket_type.slice(1)} Ticket`,
            description: phase ? `${phase.name} phase` : undefined,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/wallet?payment=success`,
      cancel_url: `${origin}/events/${event.id}?payment=cancelled`,
      client_reference_id: String(user.id),
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        event_id: event.id,
        ticket_id: ticket.id,
        reward_tx_id: rewardTxId,
        cashback_tx_id: cashbackTxId,
        ticket_type: ticket_type,
        ticket_phase: phase ? phase.name : '',
        user_id: String(user.id),
        organizer_id: organizerId || '',
      },
    });

    // 11. Store stripe session ID on the ticket for traceability
    try {
      await base44.asServiceRole.entities.Ticket.update(ticket.id, {
        stripe_session_id: session.id,
      });
    } catch (_) {}

    return Response.json({
      status: 'success',
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});