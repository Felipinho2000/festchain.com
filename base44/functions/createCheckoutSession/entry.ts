import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@^14.0.0';

// Creates a Stripe Checkout session for ticket purchase (Pix + Credit Card).
// Collects buyer info (name, CPF, phone, email) + ticket tier (inteira/meia)
// + quantity. Pre-creates N pending tickets + rewards + cashback via
// user-scoped SDK so created_by_id is stamped correctly.
// The webhook activates them after payment confirmation.

// Rolls back a purchase attempt that never got a usable Stripe Checkout
// session (session creation failed outright). Mirrors stripeWebhook's
// checkout.session.expired handler — expire the ticket, cancel the pending
// reward/cashback rows — so an attempt that never even reached Stripe ends
// up in the same state as one that reached Stripe and timed out unpaid,
// instead of being left as an orphaned 'pending' row with no session and
// no way to ever complete. Fixes the orphaned-ticket gap logged in
// WAR_ROOM.md on 2026-08-03.
async function expireOrphanedPurchase(base44, ticketIds, rewardTxIds, cashbackTxIds) {
  for (const tid of ticketIds) {
    try { await base44.asServiceRole.entities.Ticket.update(tid, { status: 'expired' }); } catch (_) {}
  }
  for (const rtxId of rewardTxIds) {
    try { await base44.asServiceRole.entities.FestCoinTransaction.update(rtxId, { status: 'cancelled' }); } catch (_) {}
  }
  for (const ctxId of cashbackTxIds) {
    try { await base44.asServiceRole.entities.FestCoinTransaction.update(ctxId, { status: 'cancelled' }); } catch (_) {}
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    const ticket_type = (body && body.ticket_type) || 'general';
    const ticket_tier = (body && body.ticket_tier) || 'inteira';
    const quantity = Math.min(Math.max(parseInt(body && body.quantity) || 1, 1), 5);
    const buyer_name = (body && body.buyer_name) || '';
    const buyer_cpf = (body && body.buyer_cpf) || '';
    const buyer_document_type = (body && body.buyer_document_type) || 'cpf';
    const buyer_phone = (body && body.buyer_phone) || '';
    const buyer_email = (body && body.buyer_email) || '';

    if (!event_id) return Response.json({ status: 'error', message: 'Missing event' }, { status: 400 });

    const VALID_TYPES = ['general', 'vip', 'backstage'];
    if (!VALID_TYPES.includes(ticket_type)) {
      return Response.json({ status: 'error', message: `Invalid ticket_type: ${ticket_type}` });
    }

    const VALID_TIERS = ['inteira', 'meia_estudante', 'meia_idoso'];
    if (!VALID_TIERS.includes(ticket_tier)) {
      return Response.json({ status: 'error', message: `Invalid ticket_tier: ${ticket_tier}` });
    }

    // Validate buyer info (required for nominal tickets + meia-entrada)
    if (!buyer_name || !buyer_cpf || buyer_cpf.replace(/\D/g, '').length < 11 || !buyer_email || !buyer_phone) {
      return Response.json({ status: 'error', message: 'Name, CPF (11 digits), email and phone are required' });
    }

    // 1. Load event
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });

    // 2. Only published/live events are bookable
    if (!['published', 'live'].includes(event.status)) {
      return Response.json({ status: 'error', message: 'This event is not open for booking' });
    }

    // 3. Capacity check — counts tickets already sold AND checkouts in flight.
    //
    //    `tickets_sold` is only incremented by stripeWebhook AFTER payment
    //    confirms. Checking capacity against it alone meant that during a lote
    //    drop N buyers could all clear the capacity gate in the same instant
    //    and all pay, overselling the room. Pending tickets are held seats;
    //    they are released automatically by the checkout.session.expired
    //    webhook (and by expireOrphanedPurchase), so a hold is temporary.
    let heldCount = 0;
    try {
      const held = await base44.asServiceRole.entities.Ticket.filter(
        { event_id: String(event.id), status: 'pending' }, '-created_date', 1000
      );
      heldCount = (held || []).length;
    } catch (e) {
      console.error('createCheckoutSession: could not count held tickets:', e.message);
    }

    const spotsLeft = (event.total_capacity || 0) - (event.tickets_sold || 0) - heldCount;
    if (spotsLeft < quantity) {
      return Response.json({
        status: 'error',
        message: spotsLeft <= 0
          ? 'Sold out — no tickets left for this event.'
          : `Only ${spotsLeft} ticket(s) remaining`,
      });
    }

    // 4. Active ticket phase — a phase closes when its date window ends OR its
    //    configured quantity sells out, whichever happens first.
    //
    //    Previously only the date window was checked, so an Early Bird lote of
    //    50 kept selling at the Early Bird price for the rest of its date
    //    range no matter how many were sold. The organizer-facing editor
    //    literally promises "os lotes avancam sozinho" and collects a quantity
    //    per phase — the backend now honours that promise, which is also real
    //    money: every ticket sold past a sold-out cheap lote is revenue the
    //    organizer should have earned at the next price.
    let phase = null;
    if (event.ticket_phases && event.ticket_phases.length) {
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
        // quantity 0/undefined means "no per-phase cap" — event capacity still applies.
        if (phaseQty <= 0) { phase = candidate; break; }

        let takenInPhase = 0;
        try {
          // Bounded read: we only need to know whether the cap is reached, so
          // never fetch more rows than the cap itself.
          const taken = await base44.asServiceRole.entities.Ticket.filter(
            {
              event_id: String(event.id),
              ticket_phase: candidate.name,
              status: { $in: ['active', 'used', 'pending'] },
            },
            '-created_date',
            phaseQty
          );
          takenInPhase = (taken || []).length;
        } catch (e) {
          console.error('createCheckoutSession: phase inventory read failed:', e.message);
          // Fail closed on this phase rather than risk overselling a lote.
          continue;
        }

        if (takenInPhase + quantity <= phaseQty) { phase = candidate; break; }
      }

      if (!phase) {
        return Response.json({
          status: 'error',
          message: 'This ticket phase just sold out. Refresh the page to see the next phase and its price.',
        });
      }
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
    // Meia-entrada = 50% off
    if (ticket_tier !== 'inteira') {
      price = Math.round(price * 50) / 100;
    }

    const organizerId = event.created_by_id ? String(event.created_by_id) : null;
    const tierLabel = ticket_tier === 'inteira' ? 'Inteira' : (ticket_tier === 'meia_estudante' ? 'Meia-Estudante' : 'Meia-Idoso');

    // 7. Create N pending tickets (each with unique QR + buyer info)
    const ticketIds = [];
    const rewardTxIds = [];
    const cashbackTxIds = [];

    for (let i = 0; i < quantity; i++) {
      const qrCode = `FC-${crypto.randomUUID()}`;
      const ticket = await base44.entities.Ticket.create({
        event_id: event.id,
        event_title: event.title,
        event_date: event.date,
        event_image: event.image_url,
        event_location: event.location_name,
        organizer_id: organizerId,
        ticket_type: ticket_type,
        ticket_tier: ticket_tier,
        ticket_phase: phase ? phase.name : null,
        price_paid: price,
        payment_method: 'pix',
        qr_code: qrCode,
        status: 'pending',
        checked_in: false,
        festcoin_earned: reward,
        buyer_name: buyer_name,
        buyer_cpf: buyer_cpf,
        buyer_document_type: buyer_document_type,
        buyer_phone: buyer_phone,
        buyer_email: buyer_email,
      });
      ticketIds.push(ticket.id);

      // Pre-create reward transaction as 'pending'
      if (reward > 0) {
        try {
          const rewardTx = await base44.entities.FestCoinTransaction.create({
            type: 'earned',
            amount: reward,
            description: `Reward: ${event.title}`,
            event_id: event.id,
            event_title: event.title,
            status: 'pending',
            reference_id: ticket.id,
          });
          rewardTxIds.push(rewardTx.id);
        } catch (_) {}
      }

      // Pre-create cashback transaction as 'pending' if cashback enabled
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
              cashbackTxIds.push(cashbackTx.id);
            } catch (_) {}
          }
        }
      }
    }

    // 8. Create Stripe Checkout session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    // Derive the public origin from the browser's Origin/Referer headers — these
    // reflect the actual domain the user is browsing on. Do NOT use req.url,
    // which is Base44's internal dispatcher address and would send Stripe's
    // redirect straight at the internal worker (causing "invalid dispatcher
    // secret" after every payment). Fall back to the known domain.
    // Validate the browser Origin/Referer against a strict allowlist of trusted
    // domains. An attacker can spoof these headers to redirect users to a
    // phishing site after Stripe payment (open redirect / CWE-601), so we never
    // trust an arbitrary origin — only known public domains fall back safely.
    const ALLOWED_HOSTS = [
      'festchain.com', 'www.festchain.com',
      'fest-chain-flow.base44.app',
    ];
    const headerOrigin = req.headers.get('origin') || req.headers.get('referer');
    let origin = 'https://fest-chain-flow.base44.app';
    if (headerOrigin) {
      try {
        const parsed = new URL(headerOrigin);
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && ALLOWED_HOSTS.includes(parsed.hostname)) {
          origin = parsed.origin;
        }
      } catch (_) {}
    }

    const sessionParams = {
      payment_method_types: ['pix', 'card'],
      line_items: [{
        price_data: {
          currency: (event.currency_code || 'BRL').toLowerCase(),
          product_data: {
            name: `${event.title} — ${tierLabel}`,
            description: phase ? `${phase.name} phase` : undefined,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: quantity,
      }],
      mode: 'payment',
      success_url: `${origin}/wallet?payment=success`,
      cancel_url: `${origin}/events/${event.id}?payment=cancelled`,
      customer_email: buyer_email,
      client_reference_id: String(user.id),
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        event_id: event.id,
        ticket_ids: ticketIds.join(','),
        reward_tx_ids: rewardTxIds.join(','),
        cashback_tx_ids: cashbackTxIds.join(','),
        ticket_type: ticket_type,
        ticket_tier: ticket_tier,
        ticket_phase: phase ? phase.name : '',
        user_id: String(user.id),
        organizer_id: organizerId || '',
        quantity: String(quantity),
      },
      // Checkout Session metadata does NOT automatically propagate to the
      // underlying PaymentIntent/Charge. Mirror it into payment_intent_data
      // so a later charge.refunded webhook event can see which tickets this
      // charge belongs to — without this, refunds are unattributable.
      payment_intent_data: {
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          event_id: event.id,
          ticket_ids: ticketIds.join(','),
          reward_tx_ids: rewardTxIds.join(','),
          cashback_tx_ids: cashbackTxIds.join(','),
          ticket_type: ticket_type,
          ticket_tier: ticket_tier,
          ticket_phase: phase ? phase.name : '',
          user_id: String(user.id),
          organizer_id: organizerId || '',
          quantity: String(quantity),
        },
      },
    };

    // Live accounts that haven't activated Pix reject `payment_method_types: ['pix',...]`,
    // which would block ALL checkout — including card. Fall back to card-only so real
    // cards keep working; Pix returns automatically once enabled in the Stripe dashboard.
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (e) {
      if (e && e.message && /pix is invalid|payment method type.*pix/i.test(e.message)) {
        console.log('createCheckoutSession: Pix not enabled on this account — retrying card-only.');
        sessionParams.payment_method_types = ['card'];
        try {
          session = await stripe.checkout.sessions.create(sessionParams);
        } catch (e2) {
          await expireOrphanedPurchase(base44, ticketIds, rewardTxIds, cashbackTxIds);
          throw e2;
        }
      } else {
        await expireOrphanedPurchase(base44, ticketIds, rewardTxIds, cashbackTxIds);
        throw e;
      }
    }

    // 9. Store stripe session ID on all tickets for traceability
    for (const tid of ticketIds) {
      try {
        await base44.asServiceRole.entities.Ticket.update(tid, {
          stripe_session_id: session.id,
        });
      } catch (_) {}
    }

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