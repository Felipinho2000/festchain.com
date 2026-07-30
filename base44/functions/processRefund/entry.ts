import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@^14.0.0';
import { secrets } from 'base44:runtime';
import { recalculatePayoutForEvent } from '../../shared/feeLogic.ts';

// Issues a full refund for a ticket purchased via Stripe checkout.
// Admin-only for now. The charge.refunded webhook handler (in stripeWebhook)
// handles updating ticket status to 'refunded' and reversing FestCoin rewards.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { ticket_id, idempotency_key } = body;
    if (!ticket_id) return Response.json({ error: 'ticket_id is required' }, { status: 400 });

    // Service role to bypass RLS — admin can access all tickets
    const ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });

    // Authorization: admin OR the event organizer who owns this ticket
    if (user.role !== 'admin') {
      const event = await base44.asServiceRole.entities.Event.get(ticket.event_id);
      if (!event || event.created_by_id !== user.id) {
        return Response.json({ error: 'Not authorized to refund this ticket' }, { status: 403 });
      }
    }

    if (!ticket.stripe_session_id) {
      return Response.json({ error: 'Ticket has no Stripe session — cannot refund' }, { status: 400 });
    }
    if (ticket.status !== 'active') {
      return Response.json({ error: `Ticket is ${ticket.status}, not active — cannot refund` }, { status: 400 });
    }

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });

    // Retrieve the checkout session to get the payment intent
    const session = await stripe.checkout.sessions.retrieve(ticket.stripe_session_id);
    if (!session.payment_intent) {
      return Response.json({ error: 'No payment intent on session' }, { status: 400 });
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id;

    // Create a full refund — Stripe fires charge.refunded webhook automatically.
    // Pass idempotency_key to Stripe so a repeat call returns the same refund.
    const refundOpts = {
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    };
    const refund = idempotency_key
      ? await stripe.refunds.create(refundOpts, { idempotencyKey: idempotency_key })
      : await stripe.refunds.create(refundOpts);

    // Set fee_reversed = true and platform_fee_cents = 0 for this ticket.
    // Leave stripe_fee_cents as recorded — that processing cost is NOT recovered.
    try {
      await base44.asServiceRole.entities.Ticket.update(ticket_id, {
        fee_reversed: true,
        platform_fee_cents: 0,
      });
    } catch (e) {
      console.error('processRefund: failed to set fee_reversed:', e.message);
    }

    // Recompute the event's payout figures
    try {
      const event = await base44.asServiceRole.entities.Event.get(ticket.event_id);
      if (event) {
        await recalculatePayoutForEvent(base44, event);
      }
    } catch (e) {
      console.error('processRefund: failed to recalculate payout:', e.message);
    }

    return Response.json({
      success: true,
      refund_id: refund.id,
      amount: refund.amount,
      status: refund.status,
      ticket_id: ticket_id,
      stripe_session_id: ticket.stripe_session_id,
      payment_intent_id: paymentIntentId,
    });
  } catch (error) {
    console.error('processRefund error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
}