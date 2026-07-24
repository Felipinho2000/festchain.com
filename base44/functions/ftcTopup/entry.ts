import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Server-side FestCoin top-up with event conversion rate.
// In pilot mode, adds test credits without claiming a real payment.
// User-scoped create so created_by_id stamps the real user (not service role).
//
// SECURITY (money-path hardening round): unlike pilotTopup (admin-only, daily
// capped), this endpoint was reachable by ANY signed-in user with no cap at
// all — client-supplied native_amount, immediately confirmed. It is wired
// into the live wallet UI (TopupPanel.jsx) as a real, intentional pilot
// feature (FTC is explicitly "pilot utility credit, no cash value"), so it
// isn't disabled outright the way reserveTicket was — but it now shares the
// same per-call clamp and daily cap as pilotTopup, and creates pending +
// confirms via asServiceRole like every other FTC-minting path.
const PER_CALL_FTC_CAP = 500;
const DAILY_FTC_CAP = 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const event_id = body && body.event_id;
    const native_amount = parseFloat(body && body.native_amount);
    if (!event_id || !native_amount || native_amount <= 0) {
      return Response.json({ status: 'error', message: 'Valid event_id and native_amount required' });
    }

    // Load event to get conversion rate and FTC config
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });
    if (!event.ftc_enabled) return Response.json({ status: 'error', message: 'This event does not accept FestCoin' });

    const rate = event.ftc_conversion_rate || 1;
    if (rate <= 0) return Response.json({ status: 'error', message: 'Invalid conversion rate' });

    let ftc_amount = Math.floor(native_amount / rate);
    if (ftc_amount <= 0) return Response.json({ status: 'error', message: 'Amount too low for this conversion rate' });
    ftc_amount = Math.min(ftc_amount, PER_CALL_FTC_CAP);

    // Daily cap — shared across every 'pilot_topup'-sourced credit for this
    // user (this function and pilotTopup both write source:'pilot_topup').
    const today = new Date().toISOString().slice(0, 10);
    const todaysTopups = await base44.entities.FestCoinTransaction.filter({
      created_by_id: user.id, source: 'pilot_topup', status: 'confirmed'
    }).catch(() => []);
    const todayTotal = todaysTopups
      .filter(t => t.created_date && t.created_date.slice(0, 10) === today)
      .reduce((s, t) => s + (t.amount || 0), 0);
    if (todayTotal >= DAILY_FTC_CAP) {
      return Response.json({ status: 'error', message: `Daily top-up limit reached. You can add up to ${DAILY_FTC_CAP} FTC per day during the pilot.` });
    }
    ftc_amount = Math.min(ftc_amount, DAILY_FTC_CAP - todayTotal);
    if (ftc_amount <= 0) {
      return Response.json({ status: 'error', message: `Daily top-up limit reached. You can add up to ${DAILY_FTC_CAP} FTC per day during the pilot.` });
    }

    // Generate unique reference ID for duplicate prevention
    const reference_id = `topup-${event_id}-${user.id}-${Date.now()}`;

    // Create the transaction — user-scoped so created_by_id stamps correctly.
    // Create pending (required by entity RLS), then confirm via asServiceRole.
    const tx = await base44.entities.FestCoinTransaction.create({
      type: 'pilot_topup',
      amount: ftc_amount,
      description: `Added ${ftc_amount} FTC credits (${event.currency_code || 'BRL'} ${native_amount})`,
      event_id: event.id,
      event_title: event.title,
      source: 'pilot_topup',
      status: 'pending',
      reference_id,
      native_amount,
      conversion_rate: rate,
      is_pilot: true,
    });
    await base44.asServiceRole.entities.FestCoinTransaction.update(tx.id, { status: 'confirmed' });

    // NOTE: cashback-on-FTC-purchase (ftc_cashback_on_ftc_purchase) previously
    // called processCashback with this synthetic reference_id + a client-
    // trusted native_amount. processCashback now requires purchase_reference
    // to resolve to a real, caller-owned Ticket, so that call would always be
    // rejected — correctly, since this reference was never a verified
    // purchase. Cashback-on-topup is not re-implemented here; it needs its
    // own verified design (e.g. anchored to this FestCoinTransaction id with
    // its own dedicated, capped rule) as a separate, reviewed change.

    return Response.json({
      status: 'success',
      message: `${ftc_amount} FTC credits added`,
      transaction: { id: tx.id },
      ftc_amount,
      native_amount,
      conversion_rate: rate,
      is_pilot: true,
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});