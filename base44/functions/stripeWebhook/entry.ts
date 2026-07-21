import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@^14.0.0';

// Stripe webhook handler for ticket purchases.
// On checkout.session.completed: activates all pre-created pending tickets
// and confirms reward/cashback transactions (supports multi-ticket purchases).
// On checkout.session.expired: marks all pending tickets as expired.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    const sig = req.headers.get('stripe-signature');
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!sig || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Deno crypto is async — must use constructEventAsync
    const event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const meta = session.metadata || {};
        const ticketIds = (meta.ticket_ids || '').split(',').filter(Boolean);
        const rewardTxIds = (meta.reward_tx_ids || '').split(',').filter(Boolean);
        const cashbackTxIds = (meta.cashback_tx_ids || '').split(',').filter(Boolean);
        const eventId = meta.event_id;
        const quantity = parseInt(meta.quantity) || ticketIds.length || 1;

        if (!ticketIds.length) {
          console.error('stripeWebhook: no ticket_ids in session metadata', session.id);
          break;
        }

        // Idempotency: check first ticket — if already active, skip
        let firstTicket = null;
        try { firstTicket = await base44.asServiceRole.entities.Ticket.get(ticketIds[0]); } catch (_) {}
        if (!firstTicket || firstTicket.status !== 'pending') {
          break;
        }

        // Determine payment method from payment intent
        let paymentMethod = 'credit_card';
        try {
          if (session.payment_intent) {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
            if (pi.payment_method) {
              const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
              if (pm.type === 'pix') paymentMethod = 'pix';
            }
          }
        } catch (_) {}

        // Activate all tickets
        for (const tid of ticketIds) {
          try {
            await base44.asServiceRole.entities.Ticket.update(tid, {
              status: 'active',
              payment_method: paymentMethod,
              stripe_session_id: session.id,
            });
          } catch (e) {
            console.error('stripeWebhook: failed to activate ticket:', tid, e.message);
          }
        }

        // Confirm all reward transactions
        for (const rtxId of rewardTxIds) {
          try {
            await base44.asServiceRole.entities.FestCoinTransaction.update(rtxId, {
              status: 'confirmed',
            });
          } catch (e) {
            console.error('stripeWebhook: failed to confirm reward:', rtxId, e.message);
          }
        }

        // Confirm all cashback transactions
        for (const ctxId of cashbackTxIds) {
          try {
            await base44.asServiceRole.entities.FestCoinTransaction.update(ctxId, {
              status: 'confirmed',
            });
          } catch (e) {
            console.error('stripeWebhook: failed to confirm cashback:', ctxId, e.message);
          }
        }

        // Increment tickets_sold by quantity
        if (eventId) {
          try {
            const ev = await base44.asServiceRole.entities.Event.get(eventId);
            if (ev) {
              await base44.asServiceRole.entities.Event.update(eventId, {
                tickets_sold: (ev.tickets_sold || 0) + quantity,
              });
            }
          } catch (e) {
            console.error('stripeWebhook: failed to increment tickets_sold:', e.message);
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const meta = session.metadata || {};
        const ticketIds = (meta.ticket_ids || '').split(',').filter(Boolean);
        const rewardTxIds = (meta.reward_tx_ids || '').split(',').filter(Boolean);
        const cashbackTxIds = (meta.cashback_tx_ids || '').split(',').filter(Boolean);

        for (const tid of ticketIds) {
          try {
            const ticket = await base44.asServiceRole.entities.Ticket.get(tid);
            if (ticket && ticket.status === 'pending') {
              await base44.asServiceRole.entities.Ticket.update(tid, { status: 'expired' });
            }
          } catch (e) {
            console.error('stripeWebhook: failed to expire ticket:', tid, e.message);
          }
        }
        for (const rtxId of rewardTxIds) {
          try { await base44.asServiceRole.entities.FestCoinTransaction.update(rtxId, { status: 'cancelled' }); } catch (_) {}
        }
        for (const ctxId of cashbackTxIds) {
          try { await base44.asServiceRole.entities.FestCoinTransaction.update(ctxId, { status: 'cancelled' }); } catch (_) {}
        }
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});