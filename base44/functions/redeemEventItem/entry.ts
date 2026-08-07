// redeemEventItem — deducts FTC and creates a redemption record for a pilot event menu item.
// No real payment is processed. This is a pilot redemption simulation.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getFtcBalance, getFtcBalanceIncludingPendingDebits } from '../../shared/ftcLedger.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { event_id, menu_item_id } = body;

    if (!event_id || !menu_item_id) {
      return Response.json({ status: 'error', message: 'Missing event_id or menu_item_id' }, { status: 400 });
    }

    // Verify event exists and capture organizer_id
    const event = await base44.asServiceRole.entities.Event.get(event_id).catch(() => null);
    if (!event) return Response.json({ status: 'error', message: 'Event not found' }, { status: 404 });
    const organizerId = event.created_by_id ? String(event.created_by_id) : null;

    // Verify menu item belongs to event and is active
    const item = await base44.asServiceRole.entities.VenueMenuItem.get(menu_item_id).catch(() => null);
    if (!item) return Response.json({ status: 'error', message: 'Menu item not found' }, { status: 404 });
    if (item.event_id !== event_id) return Response.json({ status: 'error', message: 'Item does not belong to this event' }, { status: 400 });
    if (!item.is_available) return Response.json({ status: 'error', message: 'Item is not available' }, { status: 400 });

    // Verify user has an active ticket for this event
    const userTickets = await base44.entities.Ticket.filter({ created_by_id: user.id, event_id, status: 'active' }).catch(() => []);
    if (userTickets.length === 0) {
      return Response.json({ status: 'error', message: 'You need an active ticket for this event to redeem items' }, { status: 403 });
    }

    // Prevent duplicate redemption of the same item by the same user
    const existingRedemptions = await base44.entities.EventRedemption.filter({
      created_by_id: user.id, menu_item_id, status: 'redeemed'
    }).catch(() => []);
    if (existingRedemptions.length > 0) {
      return Response.json({ status: 'error', message: 'You have already redeemed this item' }, { status: 409 });
    }

    // Enforce stock — block redemption when stock reaches zero
    if (item.stock != null && item.stock <= 0) {
      return Response.json({ status: 'error', message: 'This item is out of stock' }, { status: 409 });
    }

    // Compute FTC balance — only 'confirmed' transactions count. A direct
    // client create can only ever land as 'pending' (enforced by entity RLS),
    // so counting pending here would let a forged transaction spend as if it
    // were real money. Uses the shared ledger helper so the read is bounded
    // and reports honestly when it is incomplete.
    const { balance: currentBalance, complete: ledgerComplete } = await getFtcBalance(base44, user.id);
    if (!ledgerComplete) {
      console.error('redeemEventItem: FTC ledger read incomplete for user', String(user.id));
      return Response.json({
        status: 'error',
        message: 'We could not verify your FestCoin balance right now. Please try again in a moment.',
      }, { status: 503 });
    }

    const cost = item.price_ftc || 0;
    if (currentBalance < cost) {
      return Response.json({
        status: 'error',
        message: `Insufficient FTC. You have ${currentBalance} FTC but need ${cost} FTC.`,
        current_balance: currentBalance,
        cost
      }, { status: 400 });
    }

    const balanceAfter = currentBalance - cost;
    const redemptionCode = `RDM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    // Deduct FTC — create pending (user-scoped, correct created_by_id), then
    // confirm via asServiceRole. Only reachable through this server function.
    const spendTx = await base44.entities.FestCoinTransaction.create({
      created_by_id: user.id,
      type: 'spent',
      amount: cost,
      description: `Pilot redemption: ${item.name} · ${event.title}`,
      event_id,
      event_title: event.title,
      balance_after: balanceAfter,
      status: 'pending'
    });
    // Re-check before confirming, this time counting OTHER pending debits.
    // Two redemptions fired at once would otherwise both read the same stale
    // confirmed balance and both commit, taking the wallet negative. Whoever
    // sees the combined total go below zero backs off and rolls back.
    const { balance: provisional } = await getFtcBalanceIncludingPendingDebits(base44, user.id);
    if (provisional < 0) {
      await base44.asServiceRole.entities.FestCoinTransaction.update(spendTx.id, { status: 'cancelled' }).catch(() => {});
      return Response.json({
        status: 'error',
        message: 'Another redemption is already using these FestCoins. Check your balance and try again.',
        current_balance: currentBalance,
        cost
      }, { status: 409 });
    }

    await base44.asServiceRole.entities.FestCoinTransaction.update(spendTx.id, { status: 'confirmed' });

    // Create redemption record with organizer_id so organizer can see it in their dashboard
    const redemption = await base44.entities.EventRedemption.create({
      created_by_id: user.id,
      event_id,
      event_title: event.title,
      organizer_id: organizerId,
      menu_item_id,
      item_name: item.name,
      item_emoji: item.emoji || '🎟️',
      ftc_cost: cost,
      redemption_code: redemptionCode,
      status: 'redeemed',
      is_pilot: true
    });

    // Decrement stock if tracked
    if (item.stock != null && item.stock > 0) {
      await base44.asServiceRole.entities.VenueMenuItem.update(menu_item_id, { stock: item.stock - 1 }).catch(() => {});
    }

    return Response.json({
      status: 'success',
      redemption_code: redemptionCode,
      redemption_id: redemption.id,
      item_name: item.name,
      ftc_deducted: cost,
      balance_after: balanceAfter
    });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});