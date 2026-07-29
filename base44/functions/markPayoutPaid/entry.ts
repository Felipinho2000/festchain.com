import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { recalculatePayoutForEvent } from '../../shared/feeLogic.ts';

// Admin-only: marks an event's payout as paid with a payment reference.
// Idempotent — if already paid, returns the prior result.
// No automatic transfers in this version; this only records the admin action.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { event_id, payment_reference, idempotency_key } = body;
    if (!event_id) return Response.json({ error: 'event_id is required' }, { status: 400 });
    if (!payment_reference) return Response.json({ error: 'payment_reference is required' }, { status: 400 });

    const event = await base44.asServiceRole.entities.Event.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    // Recalculate to ensure figures are fresh before marking paid
    const payout = await recalculatePayoutForEvent(base44, event);

    // Idempotency: if already paid, return prior result
    if (payout.status === 'paid') {
      return Response.json({
        success: true,
        already_paid: true,
        payout_id: payout.id,
        paid_at: payout.paid_at,
        payment_reference: payout.payment_reference,
      });
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.EventPayout.update(payout.id, {
      status: 'paid',
      paid_at: now,
      payment_reference: payment_reference,
    });

    return Response.json({
      success: true,
      payout_id: payout.id,
      paid_at: now,
      payment_reference: payment_reference,
    });
  } catch (error) {
    console.error('markPayoutPaid error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}