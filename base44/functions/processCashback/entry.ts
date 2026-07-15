import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Processes FTC cashback after a confirmed native-currency purchase.
// Uses reference_id to prevent duplicate cashback for the same purchase.
// Cashback is only issued when the event has cashback enabled and the
// purchase has not already received cashback.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { event_id, purchase_reference, native_amount } = body;
    if (!event_id || !purchase_reference || !native_amount) {
      return Response.json({ status: 'error', message: 'event_id, purchase_reference, and native_amount required' });
    }

    // Load event
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });

    // Check cashback is enabled
    if (!event.ftc_cashback_enabled) {
      return Response.json({ status: 'error', message: 'Cashback is not enabled for this event' });
    }

    // Prevent duplicate cashback — check by reference_id + source
    const existing = await base44.asServiceRole.entities.FestCoinTransaction.filter({
      reference_id: purchase_reference,
      source: 'cashback',
    });
    if (existing && existing.length > 0) {
      return Response.json({ status: 'error', message: 'Cashback already issued for this purchase' });
    }

    // Calculate cashback
    const cashbackPercent = event.ftc_cashback_percent || 0;
    if (cashbackPercent <= 0) {
      return Response.json({ status: 'success', message: 'Cashback percentage is zero', cashback_ftc: 0 });
    }
    const rate = event.ftc_conversion_rate || 1;
    if (rate <= 0) return Response.json({ status: 'error', message: 'Invalid conversion rate' });

    const cashbackNative = native_amount * (cashbackPercent / 100);
    const cashbackFtc = Math.floor(cashbackNative / rate);
    if (cashbackFtc <= 0) {
      return Response.json({ status: 'success', message: 'Cashback too small to credit', cashback_ftc: 0 });
    }

    // Create cashback transaction — user-scoped so created_by_id stamps correctly
    const tx = await base44.entities.FestCoinTransaction.create({
      type: 'earned',
      amount: cashbackFtc,
      description: `Cashback received (${cashbackPercent}% of ${event.currency_code || 'BRL'} ${native_amount})`,
      event_id: event.id,
      event_title: event.title,
      source: 'cashback',
      status: 'confirmed',
      reference_id: purchase_reference,
      native_amount: cashbackNative,
      conversion_rate: rate,
      is_pilot: event.ftc_pilot_mode !== false,
    });

    return Response.json({
      status: 'success',
      message: `${cashbackFtc} FTC cashback credited`,
      cashback_ftc: cashbackFtc,
      transaction: { id: tx.id },
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});