import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// TIPPING IS HARD-DISABLED.
// The recipient credit path is broken: asServiceRole.entities.FestCoinTransaction.create
// silently stamps a phantom service_ owner instead of the real recipient (proven by
// runFunctionTests DIAGNOSTIC). Rather than ship a tip that debits the sender but never
// credits the recipient, this endpoint rejects all requests.
// Re-enable only when the recipient-credit path is verified working.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    return Response.json({
      status: 'error',
      message: 'Tipping is temporarily disabled'
    }, { status: 503 });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});