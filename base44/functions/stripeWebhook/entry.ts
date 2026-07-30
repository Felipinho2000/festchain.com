import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@^14.0.0';
import { getOrCreateOrganizerAccount, getEffectiveFeePercentage, calculatePlatformFeeCents, brlToCents } from '../../shared/feeLogic.ts';

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
        try { firstTicket = await base44.asServiceRole.entities.Ticket.get(ticketIds[0]); } catch (e) { console.error('stripeWebhook: idempotency check failed for ticket', ticketIds[0], e.message); }
        if (!firstTicket || firstTicket.status !== 'pending') {
          break;
        }

        // Determine payment method from payment intent + extract Stripe processing fee
        let paymentMethod = 'credit_card';
        let stripeFeeCents = 0;
        try {
          if (session.payment_intent) {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
              expand: ['latest_charge.balance_transaction']
            });
            if (pi.payment_method) {
              const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
              if (pm.type === 'pix') paymentMethod = 'pix';
            }
            const charge = pi.latest_charge;
            if (charge && typeof charge === 'object') {
              const bt = charge.balance_transaction;
              if (bt && typeof bt === 'object' && typeof bt.fee === 'number') {
                stripeFeeCents = bt.fee;
              }
            }
            if (stripeFeeCents === 0) {
              console.error('stripeWebhook: could not read Stripe fee for session', session.id);
            }
          }
        } catch (e) {
          console.error('stripeWebhook: fee extraction failed:', e.message);
        }

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

        // --- Platform fee calculation (server-side, additive) ---
        // Computes fee_percentage_applied, platform_fee_cents, stripe_fee_cents,
        // net_to_organizer_cents for each ticket. Complimentary tickets have zero fee.
        // FestChain absorbs the Stripe processing fee out of its own cut — the
        // organizer's net is gross minus the FestChain fee ONLY.
        try {
          let organizerUserId = null;
          try {
            const firstT = await base44.asServiceRole.entities.Ticket.get(ticketIds[0]);
            organizerUserId = firstT ? firstT.organizer_id : null;
          } catch (e) { console.error('stripeWebhook: failed to read organizer_id from ticket', ticketIds[0], e.message); }
          const organizer = await getOrCreateOrganizerAccount(base44, organizerUserId);
          const feePercentage = organizer ? getEffectiveFeePercentage(organizer, new Date()) : 8.0;
          const ticketCount = ticketIds.length;
          const baseFeePerTicket = ticketCount > 0 ? Math.floor(stripeFeeCents / ticketCount) : 0;
          const feeRemainder = stripeFeeCents - baseFeePerTicket * ticketCount;
          for (let i = 0; i < ticketIds.length; i++) {
            const tid = ticketIds[i];
            try {
              const t = await base44.asServiceRole.entities.Ticket.get(tid);
              if (!t) continue;
              const priceCents = brlToCents(t.price_paid || 0);
              const isComplimentary = !!t.is_complimentary;
              const platformFee = isComplimentary ? 0 : calculatePlatformFeeCents(priceCents, feePercentage);
              const net = priceCents - platformFee;
              const ticketStripeFee = i === 0 ? baseFeePerTicket + feeRemainder : baseFeePerTicket;
              await base44.asServiceRole.entities.Ticket.update(tid, {
                fee_percentage_applied: feePercentage,
                platform_fee_cents: platformFee,
                stripe_fee_cents: ticketStripeFee,
                net_to_organizer_cents: net,
              });
            } catch (e) {
              console.error('stripeWebhook: failed to set fee on ticket:', tid, e.message);
            }
          }
        } catch (e) {
          console.error('stripeWebhook: fee calculation failed:', e.message);
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

        // Increment tickets_sold atomically — $inc avoids the read-modify-write
        // race that loses sales during concurrent purchases (lote drops).
        if (eventId) {
          try {
            await base44.asServiceRole.entities.Event.updateMany(
              { id: eventId },
              { $inc: { tickets_sold: quantity } }
            );
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
          try { await base44.asServiceRole.entities.FestCoinTransaction.update(rtxId, { status: 'cancelled' }); } catch (e) { console.error('stripeWebhook: failed to cancel reward tx on session expiry', rtxId, e.message); }
        }
        for (const ctxId of cashbackTxIds) {
          try { await base44.asServiceRole.entities.FestCoinTransaction.update(ctxId, { status: 'cancelled' }); } catch (e) { console.error('stripeWebhook: failed to cancel cashback tx on session expiry', ctxId, e.message); }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const meta = charge.metadata || {};
        const ticketIds = (meta.ticket_ids || '').split(',').filter(Boolean);
        const rewardTxIds = (meta.reward_tx_ids || '').split(',').filter(Boolean);
        const cashbackTxIds = (meta.cashback_tx_ids || '').split(',').filter(Boolean);
        const eventId = meta.event_id;

        if (!ticketIds.length) {
          console.error('stripeWebhook: charge.refunded with no ticket_ids metadata — cannot auto-process (predates payment_intent_data metadata fix, or not a ticket charge):', charge.id);
          break;
        }

        // SHORTCUT (logged in WAR_ROOM.md): Stripe's charge.refunded exposes a
        // charge-level amount_refunded, not which specific ticket in a
        // multi-ticket order was refunded. Only a FULL refund of the whole
        // charge is auto-processed here; a partial refund is left for manual
        // handling rather than guessing which ticket to revoke.
        const isFullRefund = charge.refunded === true ||
          (typeof charge.amount_refunded === 'number' && typeof charge.amount === 'number' && charge.amount_refunded >= charge.amount);
        if (!isFullRefund) {
          console.error('stripeWebhook: PARTIAL refund — not auto-processed, handle manually. charge:', charge.id, 'tickets:', meta.ticket_ids);
          break;
        }

        let refundedCount = 0;
        for (const tid of ticketIds) {
          try {
            const ticket = await base44.asServiceRole.entities.Ticket.get(tid);
            if (!ticket) continue;
            if (ticket.status === 'active') {
              await base44.asServiceRole.entities.Ticket.update(tid, { status: 'refunded' });
              refundedCount++;
            } else if (ticket.status === 'used') {
              console.error('stripeWebhook: refund issued for an already CHECKED-IN ticket — not auto-revoked, handle manually:', tid);
            }
            // 'refunded' already / 'pending' / 'expired' -> nothing to do (idempotent redelivery or edge case)
          } catch (e) {
            console.error('stripeWebhook: failed to refund ticket:', tid, e.message);
          }
        }

        // Reverse reward + cashback by flipping the ORIGINAL transaction off
        // 'confirmed' (same pattern already used above for
        // checkout.session.expired) so it drops out of the buyer's balance.
        // Deliberately not creating a new compensating row here: this webhook
        // has no authenticated user context, so a row created via
        // asServiceRole would get stamped with the service identity instead of
        // the real buyer, and would silently vanish from their wallet balance
        // instead of reversing it.
        const reverseIfConfirmed = async (txId) => {
          try {
            const tx = await base44.asServiceRole.entities.FestCoinTransaction.get(txId);
            if (tx && tx.status === 'confirmed') {
              await base44.asServiceRole.entities.FestCoinTransaction.update(txId, { status: 'cancelled' });
            }
          } catch (e) {
            console.error('stripeWebhook: failed to reverse FTC transaction:', txId, e.message);
          }
        };
        for (const rtxId of rewardTxIds) await reverseIfConfirmed(rtxId);
        for (const ctxId of cashbackTxIds) await reverseIfConfirmed(ctxId);

        // Free up capacity for the refunded tickets (mirror of the increment
        // in checkout.session.completed).
        if (eventId && refundedCount > 0) {
          try {
            // $inc with $gte guard — atomic decrement that never goes negative
            // even on duplicate webhook delivery.
            await base44.asServiceRole.entities.Event.updateMany(
              { id: eventId, tickets_sold: { $gte: refundedCount } },
              { $inc: { tickets_sold: -refundedCount } }
            );
          } catch (e) {
            console.error('stripeWebhook: failed to decrement tickets_sold on refund:', e.message);
          }
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