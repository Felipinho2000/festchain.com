import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { recalculatePayoutForEvent } from '../../shared/feeLogic.ts';

// Recomputes all EventPayout figures from Ticket rows.
// Idempotent — callable any time, never trusts stored aggregates.
// Admin or the event organizer may call this.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event_id, idempotency_key } = body;
    if (!event_id) return Response.json({ error: 'event_id is required' }, { status: 400 });

    const event = await base44.asServiceRole.entities.Event.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    // Rule 5: verify organizer ownership (admin bypasses)
    if (user.role !== 'admin' && event.created_by_id !== user.id) {
      return Response.json({ error: 'Not the event organizer' }, { status: 403 });
    }

    const payout = await recalculatePayoutForEvent(base44, event);

    return Response.json({ success: true, payout });
  } catch (error) {
    console.error('recalculateEventPayout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}