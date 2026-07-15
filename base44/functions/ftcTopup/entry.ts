import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Server-side FestCoin top-up with event conversion rate.
// In pilot mode, adds test credits without claiming a real payment.
// User-scoped create so created_by_id stamps the real user (not service role).
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

    const ftc_amount = Math.floor(native_amount / rate);
    if (ftc_amount <= 0) return Response.json({ status: 'error', message: 'Amount too low for this conversion rate' });

    // Generate unique reference ID for duplicate prevention
    const reference_id = `topup-${event_id}-${user.id}-${Date.now()}`;

    // Create the transaction — user-scoped so created_by_id stamps correctly
    const tx = await base44.entities.FestCoinTransaction.create({
      type: 'pilot_topup',
      amount: ftc_amount,
      description: `Added ${ftc_amount} FTC credits (${event.currency_code || 'BRL'} ${native_amount})`,
      event_id: event.id,
      event_title: event.title,
      source: 'pilot_topup',
      status: 'confirmed',
      reference_id,
      native_amount,
      conversion_rate: rate,
      is_pilot: true,
    });

    // Cashback on FTC purchase — if event has cashback enabled and applies
    // to FTC purchases, credit the buyer's wallet via processCashback.
    if (event.ftc_cashback_enabled && event.ftc_cashback_on_ftc_purchase && (event.ftc_cashback_percent || 0) > 0) {
      try {
        await base44.functions.invoke('processCashback', {
          event_id: event.id,
          purchase_reference: reference_id,
          native_amount: native_amount,
        });
      } catch (_) {}
    }

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