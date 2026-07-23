import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// sendMomentTip — HARD-DISABLED (Stage A kill switch).
//
// Tipping is provably unreachable from any caller — UI or direct API call —
// until a future round re-enables it deliberately. The reason: the recipient-
// credit step below cannot be trusted because asServiceRole.entities.Moment
// stamps a phantom service_... owner regardless of what created_by_id is passed
// (proven by runFunctionTests DIAGNOSTIC). Re-enabling should start from the
// existing diagnostic tests in runFunctionTests, not from this dead code.
//
// To re-enable: set TIPPING_ENABLED = true and verify the recipient-credit
// logic actually works against a live Base44 environment first.
const TIPPING_ENABLED = false;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Kill switch — checked BEFORE any auth or balance logic, so it applies
    // to every caller (UI, direct API, other functions) equally.
    if (!TIPPING_ENABLED) {
      return Response.json({
        status: 'error',
        code: 'tipping_disabled',
        message: 'Moment tipping is temporarily disabled during the pilot.',
      }, { status: 403 });
    }

    // ── DEAD CODE BELOW — left in place for a future round to verify and re-enable ──
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { moment_id, amount } = body;

    if (!moment_id || !Number.isInteger(amount) || amount < 1) {
      return Response.json({ status: 'error', message: 'Invalid moment_id or amount' }, { status: 400 });
    }

    const moment = await base44.asServiceRole.entities.Moment.get(moment_id).catch(() => null);
    if (!moment) return Response.json({ status: 'error', message: 'Moment not found' }, { status: 404 });

    // Prevent self-tipping
    if (String(moment.created_by_id) === String(user.id)) {
      return Response.json({ status: 'error', message: 'Cannot tip your own moment' }, { status: 400 });
    }

    // Compute sender balance
    const allTx = await base44.entities.FestCoinTransaction.filter({ created_by_id: user.id }).catch(() => []);
    const validTx = allTx.filter(t => !['cancelled', 'failed'].includes(t.status));
    const currentBalance = validTx.reduce((s, t) => {
      if (['earned', 'transferred_in', 'pilot_topup'].includes(t.type)) return s + (t.amount || 0);
      if (['spent', 'transferred_out'].includes(t.type)) return s - (t.amount || 0);
      return s;
    }, 0);

    if (currentBalance < amount) {
      return Response.json({
        status: 'error',
        message: `Insufficient FTC. You have ${currentBalance} but need ${amount}.`,
        current_balance: currentBalance,
      }, { status: 400 });
    }

    const balanceAfter = currentBalance - amount;

    // Debit sender
    await base44.entities.FestCoinTransaction.create({
      created_by_id: user.id,
      type: 'transferred_out',
      amount,
      description: `Tip for moment ${moment_id}`,
      status: 'confirmed',
    });

    // Record tip
    await base44.asServiceRole.entities.FTCTip.create({
      from_user_id: String(user.id),
      to_user_id: String(moment.created_by_id),
      moment_id,
      amount,
    });

    // Increment moment tips
    await base44.asServiceRole.entities.Moment.update(moment_id, {
      festcoin_tips: (moment.festcoin_tips || 0) + amount,
    });

    // KNOWN BUG: recipient credit is NOT created here because asServiceRole
    // stamps a phantom service_... owner on FestCoinTransaction when an explicit
    // created_by_id is passed (same bug proven for Moment). This is why tipping
    // is disabled — the credit cannot be trusted to land in the right wallet.

    return Response.json({
      status: 'success',
      amount,
      balance_after: balanceAfter,
    });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});