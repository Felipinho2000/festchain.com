import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Aggregates FestCoin activity for an organizer's events.
// Excludes demo_data and pilot_topup from "real" revenue.
// Uses service role to read all transactions for the organizer's events.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    // Load organizer's events
    const events = await base44.asServiceRole.entities.Event.filter({ created_by_id: String(user.id) });
    if (!events || events.length === 0) {
      return Response.json({ status: 'success', report: { events: [], totals: {} } });
    }

    const eventIds = events.map(e => e.id);

    // Get all FTC transactions for these events
    const allTx = [];
    for (const eid of eventIds) {
      const txs = await base44.asServiceRole.entities.FestCoinTransaction.filter({ event_id: eid });
      allTx.push(...txs);
    }

    // Exclude demo data
    const realTx = allTx.filter(t =>
      t.source !== 'demo_data' &&
      !(t.description || '').startsWith('[DEMO]')
    );

    const report = {
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        currency_code: e.currency_code || 'BRL',
        ftc_enabled: e.ftc_enabled,
        ftc_conversion_rate: e.ftc_conversion_rate || 1,
      })),
      totals: {
        topups: realTx
          .filter(t => t.source === 'pilot_topup' || t.type === 'pilot_topup')
          .reduce((s, t) => s + (t.amount || 0), 0),
        spent: realTx
          .filter(t => t.type === 'spent')
          .reduce((s, t) => s + (t.amount || 0), 0),
        cashback: realTx
          .filter(t => t.source === 'cashback')
          .reduce((s, t) => s + (t.amount || 0), 0),
        ticket_rewards: realTx
          .filter(t => t.source !== 'cashback' && t.source !== 'moment_reward' && t.source !== 'pilot_topup' && t.type === 'earned')
          .reduce((s, t) => s + (t.amount || 0), 0),
        refunds: realTx
          .filter(t => t.source === 'refund')
          .reduce((s, t) => s + (t.amount || 0), 0),
        purchase_count: realTx.filter(t => t.type === 'spent').length,
        native_topup_value: realTx
          .filter(t => t.source === 'pilot_topup')
          .reduce((s, t) => s + (t.native_amount || 0), 0),
      },
    };

    return Response.json({ status: 'success', report });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});