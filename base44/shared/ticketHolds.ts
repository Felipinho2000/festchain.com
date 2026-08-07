// Seat-hold accounting for in-flight checkouts.
//
// Why this exists (2026-08-07 pilot verification round):
// Capacity now subtracts `pending` tickets so a lote drop cannot oversell the
// room while payments are in flight. That is only safe if a hold is guaranteed
// to be released. It was not. Live data showed pending tickets from 2026-08-03
// still holding seats on a 50-capacity event four days later, with Stripe
// Checkout Sessions that are no longer retrievable — so
// `checkout.session.expired` will never fire for them and nothing else in the
// system would ever release those seats.
//
// Two changes make holds self-healing instead of webhook-dependent:
//   1. Checkout Sessions are created with an explicit 30-minute `expires_at`,
//      so a hold has a known, short lifetime (Stripe's minimum is 30 min).
//   2. Anything older than the window is treated as dead — excluded from the
//      count on read paths, and actively swept on the write path.
//
// The window must stay >= the Stripe session lifetime. If a hold expired while
// its session was still payable, a late payment would activate a ticket that
// no longer had a reserved seat, which is the oversell we are preventing.

export const CHECKOUT_SESSION_TTL_SECONDS = 30 * 60;
// Session lifetime plus grace for clock skew and webhook lag.
export const HOLD_WINDOW_MS = (CHECKOUT_SESSION_TTL_SECONDS + 5 * 60) * 1000;
// Ceiling on how many held rows we will read for one event.
export const HOLD_READ_LIMIT = 1000;

function isStale(ticket, nowMs) {
  if (!ticket || !ticket.created_date) return false;
  const created = Date.parse(ticket.created_date);
  if (Number.isNaN(created)) return false;
  return nowMs - created > HOLD_WINDOW_MS;
}

async function readPending(base44, eventId) {
  try {
    const rows = await base44.asServiceRole.entities.Ticket.filter(
      { event_id: String(eventId), status: 'pending' }, '-created_date', HOLD_READ_LIMIT
    );
    return rows || [];
  } catch (e) {
    console.error('ticketHolds: pending read failed:', e.message);
    return null;
  }
}

/**
 * Read-only count of seats currently held by live checkouts.
 * Returns { held, complete }. `complete:false` means the read failed and the
 * caller should decide how conservative to be.
 */
export async function countActiveHolds(base44, eventId, nowMs = Date.now()) {
  const pending = await readPending(base44, eventId);
  if (pending === null) return { held: 0, complete: false };
  return { held: pending.filter((t) => !isStale(t, nowMs)).length, complete: true };
}

/**
 * Release seats whose checkout window has passed, then return the live count.
 * Mirrors what the `checkout.session.expired` webhook does, so a missed or
 * undeliverable webhook can no longer strand capacity permanently.
 * Only ever touches rows Stripe already considers dead.
 */
export async function sweepAndCountHolds(base44, eventId, nowMs = Date.now()) {
  const pending = await readPending(base44, eventId);
  if (pending === null) return { held: 0, swept: 0, complete: false };

  let swept = 0;
  for (const ticket of pending) {
    if (!isStale(ticket, nowMs)) continue;
    try {
      await base44.asServiceRole.entities.Ticket.update(ticket.id, { status: 'expired' });
      swept++;
    } catch (e) {
      console.error('ticketHolds: could not expire stale hold', ticket.id, e.message);
      continue;
    }
    // Cancel the reward/cashback rows that were pre-created alongside it, the
    // same way the expiry webhook would.
    try {
      const linked = await base44.asServiceRole.entities.FestCoinTransaction.filter(
        { reference_id: String(ticket.id), status: 'pending' }, '-created_date', 10
      );
      for (const tx of linked || []) {
        await base44.asServiceRole.entities.FestCoinTransaction.update(tx.id, { status: 'cancelled' });
      }
    } catch (e) {
      console.error('ticketHolds: could not cancel linked FTC rows for', ticket.id, e.message);
    }
  }

  if (swept > 0) console.log(`ticketHolds: released ${swept} stale hold(s) on event ${eventId}`);
  return { held: pending.filter((t) => !isStale(t, nowMs)).length, swept, complete: true };
}
