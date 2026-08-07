import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getFtcBalance } from '../../shared/ftcLedger.ts';

// Authoritative FestCoin balance for the signed-in user.
//
// The wallet used to add up whatever transactions happened to be on the first
// page it fetched (100 rows). Any guest with more history than that saw a
// number that did not match what the server would actually let them spend —
// the worst kind of wrong, because it looks precise. This endpoint returns the
// same figure the redemption path enforces against.
//
// Callers only ever get their OWN balance: the user id comes from the session,
// never from the request body.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    const { balance, transactionCount, complete } = await getFtcBalance(base44, user.id);

    if (!complete) {
      console.error('getFtcBalance: ledger read ceiling hit for user', String(user.id));
    }

    return Response.json({
      status: 'success',
      balance,
      transaction_count: transactionCount,
      complete,
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});
