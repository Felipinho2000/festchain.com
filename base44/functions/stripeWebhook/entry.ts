import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@^14.0.0';

// Stripe webhook handler for ticket purchases.
// On checkout.session.completed: activates the pre-created pending ticket
// and confirms reward/cashback transactions.
// On checkout.session.expired: marks the pending ticket as expired.
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
        const ticketId = meta.ticket_id;
        const rewardTxId = meta.reward_tx_id;
        const cashbackTxId = meta.cashback_tx_id;
        const eventId = meta.event_id;

        if (!ticketId) {
          console.error('stripeWebhook: no ticket_id in session metadata', session.id);
          break;
        }

        // Idempotency: only process if ticket is still pending
        let ticket = null;
        try { ticket = await base44.asServiceRole.entities.Ticket.get(ticketId); } catch (_) {}
        if (!ticket || ticket.status !== 'pending') {
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

        // Activate the ticket
        try {
          await base44.asServiceRole.entities.Ticket.update(ticketId, {
            status: 'active',
            payment_method: paymentMethod,
            stripe_session_id: session.id,
          });
        } catch (e) {
          console.error('stripeWebhook: failed to activate ticket:', e.message);
        }

        // Confirm reward transaction
        if (rewardTxId) {
          try {
            await base44.asServiceRole.entities.FestCoinTransaction.update(rewardTxId, {
              status: 'confirmed',
            });
          } catch (e) {
            console.error('stripeWebhook: failed to confirm reward:', e.message);
          }
        }

        // Confirm cashback transaction
        if (cashbackTxId) {
          try {
            await base44.asServiceRole.entities.FestCoinTransaction.update(cashbackTxId, {
              status: 'confirmed',
            });
          } catch (e) {
            console.error('stripeWebhook: failed to confirm cashback:', e.message);
          }
        }

        // Increment tickets_sold
        if (eventId) {
          try {
            const ev = await base44.asServiceRole.entities.Event.get(eventId);
            if (ev) {
              await base44.asServiceRole.entities.Event.update(eventId, {
                tickets_sold: (ev.tickets_sold || 0) + 1,
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
        const ticketId = meta.ticket_id;
        const rewardTxId = meta.reward_tx_id;
        const cashbackTxId = meta.cashback_tx_id;

        if (ticketId) {
          try {
            const ticket = await base44.asServiceRole.entities.Ticket.get(ticketId);
            if (ticket && ticket.status === 'pending') {
              await base44.asServiceRole.entities.Ticket.update(ticketId, { status: 'expired' });
            }
          } catch (e) {
            console.error('stripeWebhook: failed to expire ticket:', e.message);
          }
        }
        if (rewardTxId) {
          try { await base44.asServiceRole.entities.FestCoinTransaction.update(rewardTxId, { status: 'cancelled' }); } catch (_) {}
        }
        if (cashbackTxId) {
          try { await base44.asServiceRole.entities.FestCoinTransaction.update(cashbackTxId, { status: 'cancelled' }); } catch (_) {}
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