import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  recalculatePayoutForEvent,
  getOrCreateOrganizerAccount,
  getEffectiveFeePercentage,
  addBusinessDays,
  getEventPayoutStatus,
} from '../../shared/feeLogic.ts';

// Organizer-facing payout statement for a single event.
// Returns the full breakdown plus human-readable status and expected payout date.
// Does NOT return unrecovered_processing_cost_cents (admin-only field).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event_id } = body;
    if (!event_id) return Response.json({ error: 'event_id is required' }, { status: 400 });

    const event = await base44.asServiceRole.entities.Event.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    // Rule 5: verify organizer ownership (admin bypasses)
    if (user.role !== 'admin' && event.created_by_id !== user.id) {
      return Response.json({ error: 'Not the event organizer' }, { status: 403 });
    }

    // Recalculate to ensure figures are fresh
    const payout = await recalculatePayoutForEvent(base44, event);

    const organizer = await getOrCreateOrganizerAccount(base44, event.created_by_id);
    const effectiveFee = getEffectiveFeePercentage(organizer, new Date());
    const eventEnd = event.end_date ? new Date(event.end_date) : (event.date ? new Date(event.date) : null);
    const payoutDueAt = eventEnd ? addBusinessDays(eventEnd, 2) : null;
    const status = getEventPayoutStatus(event, payout);

    return Response.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        end_date: event.end_date,
        status: event.status,
      },
      organizer: {
        fee_percentage: effectiveFee,
        fee_tier: organizer ? organizer.fee_tier : 'standard',
        pilot_started_at: organizer ? organizer.pilot_started_at : null,
        pilot_expires_at: organizer ? organizer.pilot_expires_at : null,
        fee_paid_by: organizer ? organizer.fee_paid_by : 'organizer',
      },
      payout: {
        gross_sales_cents: payout.gross_sales_cents,
        platform_fee_cents: payout.platform_fee_cents,
        refunded_amount_cents: payout.refunded_amount_cents,
        net_payable_cents: payout.net_payable_cents,
        tickets_sold: payout.tickets_sold,
        tickets_refunded: payout.tickets_refunded,
        tickets_complimentary: payout.tickets_complimentary,
        status: status,
        payout_due_at: payoutDueAt ? payoutDueAt.toISOString() : null,
        paid_at: payout.paid_at,
        payment_reference: payout.payment_reference,
        // unrecovered_processing_cost_cents deliberately excluded — admin only
      },
    });
  } catch (error) {
    console.error('getOrganizerPayoutStatement error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}