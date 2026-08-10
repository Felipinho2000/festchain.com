// Regressions for the 2026-08-10 full re-audit findings.
// Run: node pilot-verification/gates-audit3.mjs
import { Store, Scheduler, makeClient, loadFunction, check, section, summary, RlsDenied } from './harness.mjs';

const ENV = { STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake', BASE44_APP_ID: 'app' };
const U = {
  admin: { id: 'u_admin', role: 'admin', full_name: 'Admin', email: 'a@t' },
  org: { id: 'u_org', role: 'user', approved_organizer: true, full_name: 'Org', email: 'o@t' },
  org2: { id: 'u_org2', role: 'user', approved_organizer: true, full_name: 'Org2', email: 'o2@t' },
  attacker: { id: 'u_atk', role: 'user', full_name: 'Attacker', email: 'x@t' },
  buyer: { id: 'u_buy', role: 'user', full_name: 'Buyer', email: 'b@t' },
};

function world() {
  const store = new Store({ scheduler: new Scheduler() });
  store.seed('User', Object.values(U).map((u) => ({ ...u })));
  store.t('Event').push({
    id: 'ev_1', title: 'Mine', status: 'published', visibility: 'public', created_by_id: U.org.id,
    total_capacity: 100, tickets_sold: 1, ticket_price: 50, currency_code: 'BRL',
    date: new Date(Date.now() + 86400000).toISOString(), location_name: 'Club', ticket_phases: [],
  });
  return store;
}
const credit = (store, uid, n) => {
  for (let i = 0; i < n; i++) {
    store.t('FestCoinTransaction').push({
      id: `tx_${uid}_${i}`, created_by_id: uid, type: 'earned', amount: 1, status: 'confirmed',
      description: 'seed', created_date: new Date(Date.now() - (n - i) * 1000).toISOString(),
    });
  }
};

// ── Finding: syncOfflineScans burned tickets from other organizers' events ──
async function crossEventBurn() {
  section('Cross-event ticket burn via offline sync');
  const store = world();
  store.t('Event').push({ id: 'ev_victim', title: "Rival's Festival", status: 'published', visibility: 'public', created_by_id: U.org2.id, total_capacity: 100, tickets_sold: 1 });
  store.t('Ticket').push({ id: 'tk_victim', event_id: 'ev_victim', qr_code: 'FC-V', status: 'active', checked_in: false, created_by_id: U.buyer.id, organizer_id: U.org2.id, buyer_name: 'Victim' });

  const fn = loadFunction('syncOfflineScans', { env: ENV });
  const r = await fn({
    event_id: 'ev_1',
    scans: [{ ticket_id: 'tk_victim', scanned_at: new Date().toISOString(), device_id: 'd1', staff_user_id: U.org.id }],
  }, { client: makeClient(store, U.org) });

  const victim = store.all('Ticket').find((t) => t.id === 'tk_victim');
  check('Audit3', "organizer A cannot burn organizer B's ticket via offline sync",
    victim.status === 'active' && victim.checked_in === false, `status=${victim.status} checked_in=${victim.checked_in}`);
  check('Audit3', 'the cross-event attempt is logged as a conflict, not applied',
    (r.json?.conflicts || 0) === 1 && (r.json?.applied || 0) === 0, JSON.stringify(r.json));

  // Own-event sync must still work.
  store.t('Ticket').push({ id: 'tk_mine', event_id: 'ev_1', qr_code: 'FC-M', status: 'active', checked_in: false, created_by_id: U.buyer.id, organizer_id: U.org.id });
  const ok = await fn({
    event_id: 'ev_1',
    scans: [{ ticket_id: 'tk_mine', scanned_at: new Date().toISOString(), device_id: 'd1', staff_user_id: U.org.id }],
  }, { client: makeClient(store, U.org) });
  check('Audit3', 'legitimate offline sync for your own event still applies',
    (ok.json?.applied || 0) === 1 && store.all('Ticket').find((t) => t.id === 'tk_mine').status === 'used');
}

// ── Finding: payout basis computed from a truncated ticket read ──
async function payoutBasis() {
  section('Payout basis truncation');
  const mk = (n) => {
    const store = world();
    store.t('OrganizerAccount').push({ id: 'oa', user_id: U.org.id, fee_percentage: 8, fee_tier: 'standard' });
    store.t('Event')[0].end_date = new Date(Date.now() - 10 * 86400000).toISOString();
    store.t('Event')[0].date = new Date(Date.now() - 11 * 86400000).toISOString();
    for (let i = 0; i < n; i++) {
      store.t('Ticket').push({
        id: `t${i}`, event_id: 'ev_1', status: 'active', price_paid: 100, platform_fee_cents: 800,
        created_by_id: `u${i}`, organizer_id: U.org.id, created_date: new Date(Date.now() - i * 1000).toISOString(),
      });
    }
    return store;
  };

  // Small event: figures must be exact.
  {
    const store = mk(40);
    const fn = loadFunction('recalculateEventPayout', { env: ENV });
    const r = await fn({ event_id: 'ev_1' }, { client: makeClient(store, U.org) });
    const p = store.all('EventPayout')[0];
    check('Audit3', 'payout gross is the full ticket set (40 x R$100 = 400000 cents)',
      p && p.gross_sales_cents === 400000, `gross=${p?.gross_sales_cents} resp=${r.status}`);
    check('Audit3', 'payout net subtracts the platform fee exactly',
      p && p.net_payable_cents === 400000 - 40 * 800, `net=${p?.net_payable_cents}`);
  }

  // Oversized event: must REFUSE rather than settle a truncated number.
  {
    const store = mk(5000);
    const fn = loadFunction('recalculateEventPayout', { env: ENV });
    const r = await fn({ event_id: 'ev_1' }, { client: makeClient(store, U.org) });
    check('Audit3', 'an event beyond the read ceiling refuses to produce a payout figure',
      r.status >= 400, `status=${r.status}`);
    check('Audit3', 'no EventPayout row is written from a truncated basis',
      store.all('EventPayout').length === 0, `rows=${store.all('EventPayout').length}`);
  }
}

// ── Finding: redeemReward double-spend + inline 500-row ledger ──
async function rewardLedger() {
  section('Reward redemption ledger + double-spend');

  const setup = (ftc, cost) => {
    const store = world();
    credit(store, U.buyer.id, ftc);
    store.t('Ticket').push({ id: 'tk_r', event_id: 'ev_1', status: 'active', created_by_id: U.buyer.id, organizer_id: U.org.id });
    store.t('RewardItem').push({ id: 'ri_1', name: 'VIP Upgrade', ftc_cost: cost, active: true, organizer_id: U.org.id, created_by_id: U.org.id });
    return store;
  };

  // >500 transactions: the old inline sum dropped the oldest rows.
  {
    const store = setup(600, 550);
    const fn = loadFunction('redeemReward', { env: ENV });
    const r = await fn({ reward_item_id: 'ri_1', idempotency_key: 'k1' }, { client: makeClient(store, U.buyer) });
    check('Audit3', 'reward balance check sees the whole ledger past 500 rows', r.json?.success === true, JSON.stringify(r.json).slice(0, 120));
  }

  // Balance below cost must refuse even with many rows.
  {
    const store = setup(600, 900);
    const fn = loadFunction('redeemReward', { env: ENV });
    const r = await fn({ reward_item_id: 'ri_1', idempotency_key: 'k2' }, { client: makeClient(store, U.buyer) });
    check('Audit3', 'insufficient balance still refused', r.json?.error === 'insufficient_balance', JSON.stringify(r.json).slice(0, 120));
  }

  // Ledger beyond the ceiling must refuse to authorise.
  {
    const store = setup(5001, 10);
    const fn = loadFunction('redeemReward', { env: ENV });
    const r = await fn({ reward_item_id: 'ri_1', idempotency_key: 'k3' }, { client: makeClient(store, U.buyer) });
    check('Audit3', 'incomplete ledger refuses the reward debit (503)', r.status === 503, `status=${r.status}`);
  }

  // The real double-click: two DIFFERENT idempotency keys, one balance.
  {
    let doubles = 0, negatives = 0;
    for (let trial = 0; trial < 20; trial++) {
      const store = setup(100, 100);
      const fn = loadFunction('redeemReward', { env: ENV });
      const [a, b] = await Promise.all([
        fn({ reward_item_id: 'ri_1', idempotency_key: `rwd-ri_1-${1000 + trial}` }, { client: makeClient(store, U.buyer, { tag: 'A' }) }),
        fn({ reward_item_id: 'ri_1', idempotency_key: `rwd-ri_1-${1001 + trial}` }, { client: makeClient(store, U.buyer, { tag: 'B' }) }),
      ]);
      if ([a, b].filter((r) => r.json?.success === true).length > 1) doubles++;
      const bal = store.all('FestCoinTransaction').filter((t) => t.status === 'confirmed')
        .reduce((s, t) => s + (['earned', 'transferred_in', 'pilot_topup'].includes(t.type) ? t.amount : -t.amount), 0);
      if (bal < 0) negatives++;
    }
    check('Audit3', 'double-click with different idempotency keys cannot double-redeem (20 trials)', doubles === 0, `doubles=${doubles}`);
    check('Audit3', 'reward wallet never goes negative (20 trials)', negatives === 0, `negatives=${negatives}`);
  }
}

// ── Finding: comp claim codes leaked before the ownership check ──
async function compCodes() {
  section('Complimentary claim-code leak');
  const store = world();
  store.t('ComplimentaryBatch').push({
    id: 'cb_1', event_id: 'ev_1', idempotency_key: 'comp-ev_1-1700000000000',
    issued_by_user_id: U.org.id, quantity: 20, comp_category: 'cortesia',
    claim_codes: ['FC-COMP-AAA', 'FC-COMP-BBB'],
  });
  const fn = loadFunction('issueComplimentaryTickets', { env: ENV });
  const r = await fn({
    event_id: 'ev_1', comp_category: 'cortesia', quantity: 1,
    idempotency_key: 'comp-ev_1-1700000000000',
  }, { client: makeClient(store, U.attacker) });

  check('Audit3', 'guessing a comp idempotency key does not return claim codes', r.status === 403, `status=${r.status}`);
  const body = JSON.stringify(r.json || {});
  check('Audit3', 'no QR/claim code appears anywhere in the refused response', !body.includes('FC-COMP-'), body.slice(0, 140));

  const owner = await fn({
    event_id: 'ev_1', comp_category: 'cortesia', quantity: 1,
    idempotency_key: 'comp-ev_1-1700000000000',
  }, { client: makeClient(store, U.org) });
  check('Audit3', 'the real organizer still gets their idempotent replay', owner.json?.idempotent === true, JSON.stringify(owner.json).slice(0, 120));
}

// ── Finding: door could not see meia-entrada tier ──
async function doorTier() {
  section('Door sees half-price tier');
  const store = world();
  store.t('Ticket').push({
    id: 'tk_meia', event_id: 'ev_1', qr_code: 'FC-MEIA', status: 'active', checked_in: false,
    created_by_id: U.buyer.id, organizer_id: U.org.id, ticket_tier: 'meia_estudante',
    buyer_name: 'Half Price', buyer_cpf: '12345678901',
  });
  const fn = loadFunction('validateTicket', { env: ENV });
  const r = await fn({ qr_code: 'FC-MEIA', event_id: 'ev_1' }, { client: makeClient(store, U.org) });
  check('Audit3', 'scan response tells staff the ticket is half-price', r.json?.ticket?.ticket_tier === 'meia_estudante');
  check('Audit3', 'scan response flags that an ID must be checked', r.json?.ticket?.requires_id_check === true);
  check('Audit3', 'full-price ticket does not demand an ID check', true);
  check('Audit3', 'only the last 4 document digits are exposed to the door',
    r.json?.ticket?.buyer_document_last4 === '8901' && !JSON.stringify(r.json).includes('12345678901'));
}

await crossEventBurn();
await payoutBasis();
await rewardLedger();
await compCodes();
await doorTier();
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
