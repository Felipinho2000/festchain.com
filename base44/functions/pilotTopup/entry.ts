// pilotTopup — adds FTC test credits for pilot users.
// ADMIN-ONLY during the MVP pilot. Partygoers earn credits from ticket rewards,
// admin/manual grants, and organizer/brand campaign allocation — not self-topup.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({
        status: 'error',
        message: 'Pilot top-up is admin-only during the pilot. Credits come from ticket rewards and admin grants.'
      }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Math.min(500, Math.max(1, parseInt(body.amount) || 100));

    // Daily limit check
    const today = new Date().toISOString().slice(0, 10);
    const existingTopups = await base44.entities.PilotTopup.filter({ created_by_id: user.id }).catch(() => []);
    const todayTotal = existingTopups
      .filter(t => t.created_date && t.created_date.slice(0, 10) === today && t.status === 'confirmed')
      .reduce((s, t) => s + (t.amount || 0), 0);

    const DAILY_LIMIT = 1000;
    if (todayTotal >= DAILY_LIMIT) {
      return Response.json({
        status: 'error',
        message: `Daily limit reached. You can add up to ${DAILY_LIMIT} FTC per day during the pilot.`
      }, { status: 400 });
    }

    const allowed = Math.min(amount, DAILY_LIMIT - todayTotal);

    // Compute current balance
    const allTx = await base44.entities.FestCoinTransaction.filter({ created_by_id: user.id }).catch(() => []);
    const validTx = allTx.filter(t => !['cancelled', 'failed'].includes(t.status));
    const currentBalance = validTx.reduce((s, t) => {
      if (['earned', 'transferred_in', 'pilot_topup'].includes(t.type)) return s + (t.amount || 0);
      if (['spent', 'transferred_out'].includes(t.type)) return s - (t.amount || 0);
      return s;
    }, 0);

    const balanceAfter = currentBalance + allowed;

    // Create FestCoinTransaction — user-scoped so created_by_id stamps correctly
    // (asServiceRole ignores the field and stamps service_...).
    await base44.entities.FestCoinTransaction.create({
      type: 'earned',
      amount: allowed,
      description: `Pilot FTC top-up · ${allowed} test credits added`,
      balance_after: balanceAfter,
      status: 'confirmed',
      source: 'pilot_beta'
    });

    await base44.asServiceRole.entities.PilotTopup.create({
      created_by_id: user.id,
      amount: allowed,
      status: 'confirmed',
      source: 'pilot_beta',
      balance_after: balanceAfter
    });

    return Response.json({
      status: 'success',
      added: allowed,
      balance_after: balanceAfter,
      daily_remaining: DAILY_LIMIT - todayTotal - allowed
    });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});