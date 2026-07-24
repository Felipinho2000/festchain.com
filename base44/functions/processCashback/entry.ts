import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Processes FTC cashback after a confirmed native-currency ticket purchase.
//
// SECURITY (money-path hardening round): this function used to trust the
// client-sent `native_amount` outright and never checked that
// `purchase_reference` pointed to anything real or anything the caller
// owned — any signed-in user could call it directly with a fresh random
// reference and an arbitrary amount for unlimited FTC. It now requires
// `purchase_reference` to be a real Ticket, owned by the caller, for this
// event, and computes cashback from the ticket's actual `price_paid` —
// never from the request body.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { event_id, purchase_reference } = body;
    if (!event_id || !purchase_reference) {
      return Response.json({ status: 'error', message: 'event_id and purchase_reference required' });
    }

    // Load event
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' });

    // Check cashback is enabled
    if (!event.ftc_cashback_enabled) {
      return Response.json({ status: 'error', message: 'Cashback is not enabled for this event' });
    }

    // purchase_reference must be a real Ticket, owned by the caller, for this
    // event, and must already be paid — this is what anchors the cashback to
    // a verified payment instead of a client-asserted claim.
    let ticket = null;
    try { ticket = await base44.asServiceRole.entities.Ticket.get(purchase_reference); } catch (_) {}
    if (!ticket) {
      return Response.json({ status: 'error', message: 'Purchase reference not found' }, { status: 404 });
    }
    if (String(ticket.created_by_id) !== String(user.id)) {
      return Response.json({ status: 'error', message: 'This purchase does not belong to you' }, { status: 403 });
    }
    if (ticket.event_id !== event_id) {
      return Response.json({ status: 'error', message: 'Purchase reference does not match this event' }, { status: 400 });
    }
    if (!['active', 'used'].includes(ticket.status)) {
      return Response.json({ status: 'error', message: 'This purchase has not been confirmed yet' }, { status: 409 });
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

    // Server-verified amount: the ticket's actual price_paid — never a
    // client-sent number.
    const verifiedAmount = ticket.price_paid || 0;
    const cashbackNative = verifiedAmount * (cashbackPercent / 100);
    const cashbackFtc = Math.floor(cashbackNative / rate);
    if (cashbackFtc <= 0) {
      return Response.json({ status: 'success', message: 'Cashback too small to credit', cashback_ftc: 0 });
    }

    // Create as pending (user-scoped, so created_by_id stamps correctly —
    // asServiceRole ignores an explicit created_by_id on create), then
    // confirm via asServiceRole. Only server code reaches the confirm step;
    // a direct client create is permanently stuck at status:'pending' by
    // entity RLS and never counts toward a spendable balance.
    const tx = await base44.entities.FestCoinTransaction.create({
      type: 'earned',
      amount: cashbackFtc,
      description: `Cashback received (${cashbackPercent}% of ${event.currency_code || 'BRL'} ${verifiedAmount})`,
      event_id: event.id,
      event_title: event.title,
      source: 'cashback',
      status: 'pending',
      reference_id: purchase_reference,
      native_amount: cashbackNative,
      conversion_rate: rate,
      is_pilot: event.ftc_pilot_mode !== false,
    });
    await base44.asServiceRole.entities.FestCoinTransaction.update(tx.id, { status: 'confirmed' });

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