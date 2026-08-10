import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getFtcBalance, getFtcBalanceIncludingPendingDebits } from '../../shared/ftcLedger.ts';

// Redeem a RewardItem using confirmed FestCoin balance.
//
// SECURITY — hardened exactly like processCashback:
//  - ftc_cost is read from the stored RewardItem record, never from the request body
//  - The user must hold a valid (active or used) ticket for an event by this organizer
//  - Confirmed FTC balance (status==='confirmed' transactions only) must cover the cost
//  - Stock cannot go negative: uses an optimistic-lock decrement
//  - Per-user limit enforced by counting non-cancelled redemptions for this item
//  - Idempotency: same idempotency_key returns the prior result, never double-charges
//  - Rate limit: max 10 redemption attempts per user per hour
//  - Create-pending-then-confirm pattern: FestCoinTransaction and RewardRedemption
//    start as 'pending' (client RLS blocks client-side 'confirmed' creates) and are
//    confirmed only by server code via asServiceRole.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { reward_item_id, event_id, idempotency_key, ftc_cost, amount } = body;

    // ftc_cost / amount from the request are IGNORED — always read from the stored record
    void ftc_cost; void amount;

    if (!reward_item_id || !idempotency_key) {
      return Response.json({ error: 'reward_item_id and idempotency_key are required' }, { status: 400 });
    }

    // ── Idempotency check — return prior result on repeat ──
    const existing = await base44.asServiceRole.entities.RewardRedemption.filter({ idempotency_key });
    if (existing && existing.length > 0) {
      const prior = existing[0];
      return Response.json({ success: true, redemption: prior, idempotent: true });
    }

    // ── Rate limit: max 10 redemption attempts per user per hour ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentAll = await base44.asServiceRole.entities.RewardRedemption.filter(
      { user_id: String(user.id) },
      "-created_date",
      20
    );
    const recentCount = recentAll.filter(function (r) {
      return r.created_date && r.created_date >= oneHourAgo;
    }).length;
    if (recentCount >= 10) {
      return Response.json({ error: 'rate_limit', message: 'Too many redemption attempts. Try again later.' }, { status: 429 });
    }

    // ── Resolve RewardItem server-side — never trust client values ──
    let rewardItem = null;
    try { rewardItem = await base44.asServiceRole.entities.RewardItem.get(reward_item_id); } catch (_) {}
    if (!rewardItem) return Response.json({ error: 'Reward not found' }, { status: 404 });
    if (!rewardItem.active) return Response.json({ error: 'inactive', message: 'This reward is not active' }, { status: 400 });

    // Authoritative owner is the record author — organizer_id is client-writable
    // and must never be used for authorisation.
    const organizerId = String(rewardItem.created_by_id);

    // ── Verify event scope ──
    // If the reward is event-scoped, the provided event_id must match.
    // If the reward is organizer-wide (event_id null), event_id is optional.
    if (rewardItem.event_id && event_id && rewardItem.event_id !== event_id) {
      return Response.json({ error: 'This reward is not available for this event' }, { status: 400 });
    }

    // ── Verify the user holds a valid ticket for an event by this organizer ──
    // Load all events owned by this organizer
    const organizerEvents = await base44.asServiceRole.entities.Event.filter({ created_by_id: organizerId });
    const organizerEventIds = new Set(organizerEvents.map(function (e) { return e.id; }));

    // Qualifying events: if reward is event-scoped, only that event; else all organizer events
    const qualifyingEventIds = rewardItem.event_id
      ? new Set([rewardItem.event_id])
      : organizerEventIds;

    // If the caller passed an event_id, it must be one of the qualifying events
    if (event_id && !qualifyingEventIds.has(event_id)) {
      return Response.json({ error: 'no_valid_ticket', message: 'You need a valid ticket for this organizer\'s event to redeem rewards.' }, { status: 403 });
    }

    // Fetch user's active and used tickets
    const activeTickets = await base44.asServiceRole.entities.Ticket.filter(
      { created_by_id: String(user.id), status: 'active' }, "-created_date", 100
    ).catch(function () { return []; });
    const usedTickets = await base44.asServiceRole.entities.Ticket.filter(
      { created_by_id: String(user.id), status: 'used' }, "-created_date", 100
    ).catch(function () { return []; });
    const allUserTickets = activeTickets.concat(usedTickets);

    const hasValidTicket = allUserTickets.some(function (t) { return qualifyingEventIds.has(t.event_id); });
    if (!hasValidTicket) {
      return Response.json({ error: 'no_valid_ticket', message: 'You need a valid ticket for this organizer\'s event to redeem rewards.' }, { status: 403 });
    }

    // ── Resolve ftc_cost from stored record ONLY ──
    const ftcCost = rewardItem.ftc_cost || 0;
    if (ftcCost <= 0) return Response.json({ error: 'Invalid reward cost' }, { status: 400 });

    // ── Verify confirmed FTC balance >= ftcCost ──
    // This used to re-sum the ledger inline from the newest 500 rows. That is
    // the exact bug shared/ftcLedger.ts exists to prevent: past 500
    // transactions the oldest rows drop out of the sum, and since early rows
    // skew toward debits the computed balance comes out HIGHER than reality —
    // letting a heavy user redeem against coins they already spent. The shared
    // helper reads to a known ceiling and reports when it could not see the
    // whole ledger, so we can refuse instead of guessing.
    const { balance, complete: ledgerComplete } = await getFtcBalance(base44, user.id);
    if (!ledgerComplete) {
      console.error('redeemReward: FTC ledger read incomplete for user', String(user.id));
      return Response.json({
        error: 'ledger_unavailable',
        message: 'Não foi possível verificar seu saldo agora. Tente novamente em instantes.',
      }, { status: 503 });
    }
    if (balance < ftcCost) {
      return Response.json({
        error: 'insufficient_balance',
        message: 'Você tem ' + balance + ' FTC mas precisa de ' + ftcCost + ' FTC.',
        balance: balance,
        required: ftcCost,
      }, { status: 400 });
    }

    // ── Verify stock > 0 ──
    const hasStock = rewardItem.stock_total != null;
    if (hasStock) {
      const stockBefore = rewardItem.stock_remaining != null ? rewardItem.stock_remaining : rewardItem.stock_total;
      if (stockBefore <= 0) {
        return Response.json({ error: 'out_of_stock', message: 'This reward is out of stock.' }, { status: 400 });
      }
    }

    // ── Verify per_user_limit ──
    const userRedemptions = await base44.asServiceRole.entities.RewardRedemption.filter(
      { user_id: String(user.id), reward_item_id }
    );
    const activeUserRedemptions = userRedemptions.filter(function (r) { return r.status !== 'cancelled'; });
    const perLimit = rewardItem.per_user_limit || 1;
    if (activeUserRedemptions.length >= perLimit) {
      return Response.json({ error: 'limit_reached', message: 'You can only redeem this ' + perLimit + ' time(s).' }, { status: 400 });
    }

    // ── Determine event context for this redemption ──
    let redemptionEventId = event_id || rewardItem.event_id || '';
    if (!redemptionEventId) {
      const matchingTicket = allUserTickets.find(function (t) { return qualifyingEventIds.has(t.event_id); });
      if (matchingTicket) redemptionEventId = matchingTicket.event_id;
    }
    const redemptionEvent = organizerEvents.find(function (e) { return e.id === redemptionEventId; });

    // ── Generate redemption code ──
    const redemptionCode = 'FC-RWD-' + reward_item_id.slice(-4) + '-' +
      Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    // ── Create FestCoinTransaction as pending (user-scoped → created_by_id stamps) ──
    const tx = await base44.entities.FestCoinTransaction.create({
      type: 'spent',
      amount: ftcCost,
      description: 'Recompensa: ' + rewardItem.name,
      event_id: redemptionEventId,
      event_title: redemptionEvent ? redemptionEvent.title : '',
      source: 'reward_redemption',
      status: 'pending',
      reference_id: reward_item_id,
    });

    // ── Create RewardRedemption as pending (user-scoped → created_by_id stamps) ──
    const redemption = await base44.entities.RewardRedemption.create({
      user_id: String(user.id),
      user_name: user.full_name || '',
      reward_item_id,
      reward_item_name: rewardItem.name,
      event_id: redemptionEventId,
      event_title: redemptionEvent ? redemptionEvent.title : '',
      organizer_id: organizerId,
      ftc_spent: ftcCost,
      brl_value_cents: rewardItem.brl_value_cents || 0,
      status: 'pending',
      redemption_code: redemptionCode,
      redeemed_at: new Date().toISOString(),
      idempotency_key,
    });

    // ── Decrement stock with optimistic lock (prevents negative stock under concurrency) ──
    let stockRollback = false;
    if (hasStock) {
      const stockBefore = rewardItem.stock_remaining != null ? rewardItem.stock_remaining : rewardItem.stock_total;
      // Only decrement if stock is still the value we read (optimistic lock).
      // The $gt: 0 guard in the filter also prevents going below zero.
      const stockResult = await base44.asServiceRole.entities.RewardItem.updateMany(
        { id: reward_item_id, stock_remaining: { $gt: 0 } },
        { $inc: { stock_remaining: -1 } }
      );

      // Determine whether our update applied by checking the result shape.
      let matched = -1; // unknown
      if (stockResult) {
        if (typeof stockResult.matched_count === 'number') matched = stockResult.matched_count;
        else if (typeof stockResult.modified_count === 'number') matched = stockResult.modified_count;
        else if (typeof stockResult.matched === 'number') matched = stockResult.matched;
        else if (typeof stockResult.modified === 'number') matched = stockResult.modified;
        else if (typeof stockResult.count === 'number') matched = stockResult.count;
      }

      if (matched === 0) {
        // Our update did not match — stock was already 0 (or changed). Rollback.
        stockRollback = true;
      } else if (matched === -1) {
        // Could not determine from result — re-read and compare.
        const reRead = await base44.asServiceRole.entities.RewardItem.get(reward_item_id);
        const stockAfter = reRead.stock_remaining != null ? reRead.stock_remaining : reRead.stock_total;
        if (stockAfter >= stockBefore) {
          // Stock did not decrease — we lost the race.
          stockRollback = true;
        }
      }
    }

    if (stockRollback) {
      // Cancel the pending transaction and redemption — nothing was confirmed.
      await base44.asServiceRole.entities.FestCoinTransaction.update(tx.id, { status: 'cancelled' });
      await base44.asServiceRole.entities.RewardRedemption.update(redemption.id, { status: 'cancelled' });
      return Response.json({ error: 'out_of_stock', message: 'This reward just sold out.' }, { status: 409 });
    }

    // ── Final guard before confirming: count OTHER pending debits ──
    // The balance above was read before this request created its own pending
    // debit. Two redemptions fired together — a double-click produces two
    // DIFFERENT idempotency keys, because the client builds them from
    // Date.now(), so the idempotency check above does not fire — would
    // otherwise both read the same stale balance and both confirm, taking the
    // wallet negative and handing out two rewards. Whoever sees the combined
    // total go below zero rolls back.
    const { balance: provisional } = await getFtcBalanceIncludingPendingDebits(base44, user.id);
    if (provisional < 0) {
      await base44.asServiceRole.entities.FestCoinTransaction.update(tx.id, { status: 'cancelled' }).catch(() => {});
      await base44.asServiceRole.entities.RewardRedemption.update(redemption.id, { status: 'cancelled' }).catch(() => {});
      if (hasStock) {
        await base44.asServiceRole.entities.RewardItem.updateMany(
          { id: reward_item_id }, { $inc: { stock_remaining: 1 } }
        ).catch(() => {});
      }
      return Response.json({
        error: 'concurrent_redemption',
        message: 'Outro resgate está usando esses FestCoins. Confira seu saldo e tente de novo.',
      }, { status: 409 });
    }

    // ── Confirm the transaction and redemption (server-side only) ──
    await base44.asServiceRole.entities.FestCoinTransaction.update(tx.id, { status: 'confirmed' });
    await base44.asServiceRole.entities.RewardRedemption.update(redemption.id, { status: 'confirmed' });

    return Response.json({
      success: true,
      redemption: {
        id: redemption.id,
        redemption_code: redemptionCode,
        reward_item_name: rewardItem.name,
        ftc_spent: ftcCost,
        brl_value_cents: rewardItem.brl_value_cents || 0,
        status: 'confirmed',
      },
      balance_after: balance - ftcCost,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});