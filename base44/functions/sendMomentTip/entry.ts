import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Server-side FTC tip transfer: validates the sender's balance, debits the
// sender, records the tip, and increments the moment counter — all in one
// trusted operation so the client cannot forge or omit the debit.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const moment_id = body && body.moment_id;
    const amount = Number(body && body.amount);

    if (!moment_id) return Response.json({ status: 'error', message: 'Moment id is required' }, { status: 400 });
    if (!Number.isInteger(amount) || amount < 1) {
      return Response.json({ status: 'error', message: 'Invalid tip amount' }, { status: 400 });
    }

    // 1. Load the moment
    let moment = null;
    try { moment = await base44.asServiceRole.entities.Moment.get(moment_id); } catch (_) {}
    if (!moment) return Response.json({ status: 'error', message: 'Moment not found' }, { status: 404 });

    // 2. Prevent self-tipping
    if (String(moment.created_by_id) === String(user.id)) {
      return Response.json({ status: 'error', message: 'You cannot tip your own moment' }, { status: 400 });
    }

    // 3. Calculate sender's current balance (authoritative, server-side)
    const txs = await base44.asServiceRole.entities.FestCoinTransaction.filter({
      created_by_id: String(user.id)
    });
    const valid = (txs || []).filter(t => !['cancelled', 'failed'].includes(t.status));
    const balance = valid.reduce((s, t) => {
      if (['earned', 'transferred_in', 'pilot_topup'].includes(t.type)) return s + (t.amount || 0);
      if (['spent', 'transferred_out'].includes(t.type)) return s - (t.amount || 0);
      return s;
    }, 0);

    if (balance < amount) {
      return Response.json({
        status: 'error',
        message: `Insufficient balance. You have ${balance} FTC.`
      }, { status: 400 });
    }

    // 4. Debit sender (server-controlled amount and type)
    await base44.asServiceRole.entities.FestCoinTransaction.create({
      type: 'transferred_out',
      amount,
      description: `Tipped ${moment.author_alias || 'a raver'}`,
      source: 'moment_tip',
      status: 'confirmed',
      event_id: moment.event_id || undefined,
      event_title: moment.event_title || undefined,
      created_by_id: String(user.id),
    });

    // 5. Record the tip
    await base44.asServiceRole.entities.FTCTip.create({
      from_user_id: String(user.id),
      to_user_id: String(moment.created_by_id),
      moment_id: moment.id,
      amount,
      created_by_id: String(user.id),
    });

    // 6. Increment the moment tip counter (cross-user — service role)
    try {
      await base44.asServiceRole.entities.Moment.update(moment.id, {
        festcoin_tips: (moment.festcoin_tips || 0) + amount,
      });
    } catch (_) {}

    return Response.json({
      status: 'success',
      amount,
      balance_after: balance - amount,
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});