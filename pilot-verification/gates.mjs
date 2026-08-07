// FestChain pilot release gates — executable adversarial suite.
// Run: node pilot-verification/gates.mjs
import { Store, Scheduler, makeClient, loadFunction, check, section, summary, RlsDenied } from './harness.mjs';

const ENV = { STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake', BASE44_APP_ID: 'app_test' };

const USERS = {
  admin:     { id: 'u_admin', role: 'admin', full_name: 'Admin', email: 'admin@test' },
  organizer: { id: 'u_org', role: 'user', approved_organizer: true, full_name: 'Org', email: 'org@test' },
  organizer2:{ id: 'u_org2', role: 'user', approved_organizer: true, full_name: 'Org Two', email: 'org2@test' },
  attendee:  { id: 'u_att', role: 'user', full_name: 'Attendee', email: 'att@test' },
  buyer:     { id: 'u_buy', role: 'user', full_name: 'Buyer', email: 'buy@test' },
  other:     { id: 'u_oth', role: 'user', full_name: 'Other', email: 'oth@test' },
};

function makeStripe({ failCreate = false } = {}) {
  let n = 0;
  const sessions = [];
  function Stripe() {
    return {
      checkout: {
        sessions: {
          create: async (params) => {
            if (failCreate) throw new Error('card_declined_at_session_creation');
            const s = { id: `cs_test_${++n}`, url: `https://stripe.test/${n}`, ...params };
            sessions.push(s);
            return s;
          },
        },
      },
      paymentIntents: {
        retrieve: async () => ({
          payment_method: 'pm_1',
          latest_charge: { balance_transaction: { fee: 57 } },
        }),
      },
      paymentMethods: { retrieve: async () => ({ type: 'card' }) },
      webhooks: { constructEventAsync: async (raw) => (typeof raw === 'string' ? JSON.parse(raw) : raw) },
    };
  }
  Stripe.sessions = sessions;
  return Stripe;
}

function baseWorld(opts = {}) {
  const sched = new Scheduler();
  const store = new Store({ scheduler: sched, guardedUpdateHonored: opts.guardedUpdateHonored });
  store.seed('User', Object.values(USERS).map((u) => ({ ...u })));
  return { sched, store };
}

function seedEvent(store, over = {}) {
  const ev = {
    id: 'ev_1',
    title: 'Pilot Night',
    status: 'published',
    visibility: 'public',
    created_by_id: USERS.organizer.id,
    total_capacity: 5,
    tickets_sold: 0,
    ticket_price: 10,
    currency_code: 'BRL',
    festcoin_reward: 50,
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    location_name: 'Club',
    ticket_phases: [
      { name: 'Early Bird', price: 10, quantity: 2, active: true, festcoin_reward: 50 },
      { name: 'Phase 1', price: 20, quantity: 3, active: true, festcoin_reward: 40 },
    ],
    ...over,
  };
  store.t('Event').push(ev);
  return ev;
}

const BUYER_INFO = {
  buyer_name: 'Test Buyer', buyer_cpf: '12345678901',
  buyer_email: 'buy@test', buyer_phone: '11999999999',
};

async function buy(store, user, body = {}, stripe = makeStripe()) {
  const fn = loadFunction('createCheckoutSession', { stripe, env: ENV });
  const client = makeClient(store, user, { tag: user.id });
  return fn({ event_id: 'ev_1', quantity: 1, ...BUYER_INFO, ...body }, {
    client, headers: { origin: 'https://festchain.com' },
  });
}

async function fireWebhook(store, type, metadata, extra = {}) {
  const fn = loadFunction('stripeWebhook', { stripe: makeStripe(), env: ENV });
  const client = makeClient(store, null, { tag: 'webhook' });
  const object = type === 'charge.refunded'
    ? { id: 'ch_1', metadata, refunded: true, amount: 1000, amount_refunded: 1000, ...extra }
    : { id: 'cs_test_1', metadata, payment_intent: 'pi_1', ...extra };
  return fn({ type, data: { object } }, { client, headers: { 'stripe-signature': 'sig' } });
}

// ═══════════════════════════ GATE 2 ═══════════════════════════
async function gate2() {
  section('GATE 2 — Ticket lifecycle');

  // --- happy path ---
  {
    const { store } = baseWorld();
    seedEvent(store);
    const r = await buy(store, USERS.buyer);
    check('Gate 2', 'checkout creates a session', r.json?.status === 'success', r.json?.message || '');
    const t = store.all('Ticket')[0];
    check('Gate 2', 'ticket created as pending', t?.status === 'pending');
    check('Gate 2', 'ticket owned by the real buyer (not service role)', t?.created_by_id === USERS.buyer.id, `owner=${t?.created_by_id}`);
    check('Gate 2', 'ticket carries organizer_id', t?.organizer_id === USERS.organizer.id);
    check('Gate 2', 'server chose the phase, not the client', t?.ticket_phase === 'Early Bird');
    check('Gate 2', 'price came from the phase, not the request', t?.price_paid === 10);
    check('Gate 2', 'capacity NOT incremented before payment', store.all('Event')[0].tickets_sold === 0);

    const rewardTx = store.all('FestCoinTransaction').find((x) => x.type === 'earned');
    check('Gate 2', 'reward pre-created as pending', rewardTx?.status === 'pending');
    check('Gate 2', 'reward owned by real buyer', rewardTx?.created_by_id === USERS.buyer.id);

    const meta = { ticket_ids: t.id, reward_tx_ids: rewardTx.id, cashback_tx_ids: '', event_id: 'ev_1', quantity: '1' };
    await fireWebhook(store, 'checkout.session.completed', meta);
    const t2 = store.all('Ticket')[0];
    check('Gate 2', 'webhook activates the ticket', t2.status === 'active');
    check('Gate 2', 'ownership unchanged by activation', t2.created_by_id === USERS.buyer.id);
    check('Gate 2', 'QR present and unique-format', /^FC-/.test(t2.qr_code || ''));
    check('Gate 2', 'tickets_sold incremented once', store.all('Event')[0].tickets_sold === 1);
    check('Gate 2', 'reward confirmed', store.all('FestCoinTransaction')[0].status === 'confirmed');
    check('Gate 2', 'fee snapshot written', typeof t2.platform_fee_cents === 'number' && t2.net_to_organizer_cents > 0,
      `fee=${t2.platform_fee_cents} net=${t2.net_to_organizer_cents}`);

    // --- duplicate + retried webhook ---
    await fireWebhook(store, 'checkout.session.completed', meta);
    await fireWebhook(store, 'checkout.session.completed', meta);
    check('Gate 2', 'duplicate webhook does not duplicate the sale', store.all('Event')[0].tickets_sold === 1,
      `tickets_sold=${store.all('Event')[0].tickets_sold}`);
    check('Gate 2', 'duplicate webhook creates no extra ticket', store.all('Ticket').length === 1);
    check('Gate 2', 'duplicate webhook does not re-credit FTC',
      store.all('FestCoinTransaction').filter((x) => x.status === 'confirmed').length === 1);

    // --- wallet visibility for the right user, denied for the wrong one ---
    const gtd = loadFunction('getTicketDetails', { env: ENV });
    const okOwner = await gtd({ ticket_id: t2.id }, { client: makeClient(store, USERS.buyer) });
    const denyOther = await gtd({ ticket_id: t2.id }, { client: makeClient(store, USERS.other) });
    const okOrg = await gtd({ ticket_id: t2.id }, { client: makeClient(store, USERS.organizer) });
    check('Gate 2', 'owner can open ticket detail + QR', okOwner.json?.status === 'success' && !!okOwner.json.ticket.qr_code);
    check('Gate 2', 'a different attendee CANNOT open the ticket', denyOther.status === 403);
    check('Gate 2', 'event organizer can open the ticket', okOrg.json?.status === 'success');

    // --- scan, then wrong-event scan ---
    const vt = loadFunction('validateTicket', { env: ENV });
    const scan1 = await vt({ qr_code: t2.qr_code, event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer) });
    check('Gate 2', 'valid QR scans once', scan1.json?.status === 'valid');
    check('Gate 2', 'ticket lands in used state', store.all('Ticket')[0].status === 'used' && store.all('Ticket')[0].checked_in === true);
    const scan2 = await vt({ qr_code: t2.qr_code, event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer) });
    check('Gate 2', 'second sequential scan is rejected', scan2.json?.status === 'used');
    const scanBad = await vt({ qr_code: 'FC-nope', event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer) });
    check('Gate 2', 'unknown QR rejected', scanBad.json?.status === 'invalid');
  }

  // --- pending ticket must never scan as valid ---
  {
    const { store } = baseWorld();
    seedEvent(store);
    await buy(store, USERS.buyer);
    const t = store.all('Ticket')[0];
    const vt = loadFunction('validateTicket', { env: ENV });
    const r = await vt({ qr_code: t.qr_code, event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer) });
    check('Gate 2', 'UNPAID pending ticket cannot enter', r.json?.status === 'invalid', r.json?.message);
  }

  // --- abandoned checkout / failed payment ---
  {
    const { store } = baseWorld();
    seedEvent(store);
    await buy(store, USERS.buyer);
    const t = store.all('Ticket')[0];
    const rtx = store.all('FestCoinTransaction')[0];
    await fireWebhook(store, 'checkout.session.expired',
      { ticket_ids: t.id, reward_tx_ids: rtx.id, cashback_tx_ids: '', event_id: 'ev_1' });
    check('Gate 2', 'abandoned checkout expires the ticket', store.all('Ticket')[0].status === 'expired');
    check('Gate 2', 'abandoned checkout cancels the pending reward', store.all('FestCoinTransaction')[0].status === 'cancelled');
    check('Gate 2', 'abandoned checkout leaves capacity untouched', store.all('Event')[0].tickets_sold === 0);
  }

  // --- Stripe session creation fails: no orphaned pending row ---
  {
    const { store } = baseWorld();
    seedEvent(store);
    const r = await buy(store, USERS.buyer, {}, makeStripe({ failCreate: true }));
    check('Gate 2', 'session-creation failure returns an error', r.status === 500 || r.json?.status === 'error');
    const t = store.all('Ticket')[0];
    check('Gate 2', 'failed purchase leaves NO pending orphan', t && t.status === 'expired', `status=${t?.status}`);
    check('Gate 2', 'failed purchase cancels its reward row', store.all('FestCoinTransaction')[0].status === 'cancelled');
  }

  // --- refund ---
  {
    const { store } = baseWorld();
    seedEvent(store);
    await buy(store, USERS.buyer);
    const t = store.all('Ticket')[0];
    const rtx = store.all('FestCoinTransaction')[0];
    const meta = { ticket_ids: t.id, reward_tx_ids: rtx.id, cashback_tx_ids: '', event_id: 'ev_1', quantity: '1' };
    await fireWebhook(store, 'checkout.session.completed', meta);
    await fireWebhook(store, 'charge.refunded', meta);
    check('Gate 2', 'full refund marks ticket refunded', store.all('Ticket')[0].status === 'refunded');
    check('Gate 2', 'full refund reverses the FTC reward', store.all('FestCoinTransaction')[0].status === 'cancelled');
    check('Gate 2', 'full refund returns capacity', store.all('Event')[0].tickets_sold === 0);
    const vt = loadFunction('validateTicket', { env: ENV });
    const r = await vt({ qr_code: t.qr_code, event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer) });
    check('Gate 2', 'refunded ticket cannot enter', r.json?.status === 'invalid');
  }

  // --- stale holds must not strand capacity (regression for the orphan
  //     pending rows found in live data on 2026-08-07) ---
  {
    const { store } = baseWorld();
    seedEvent(store, { total_capacity: 2, ticket_phases: [] });
    const old = new Date(Date.now() - 4 * 86400000).toISOString();
    store.t('Ticket').push({ id: 'tk_orphan1', event_id: 'ev_1', status: 'pending', created_by_id: 'u_ghost', created_date: old, qr_code: 'FC-O1' });
    store.t('Ticket').push({ id: 'tk_orphan2', event_id: 'ev_1', status: 'pending', created_by_id: 'u_ghost', created_date: old, qr_code: 'FC-O2' });
    store.t('FestCoinTransaction').push({ id: 'tx_orphan', created_by_id: 'u_ghost', reference_id: 'tk_orphan1', type: 'earned', amount: 50, status: 'pending' });
    const r = await buy(store, USERS.buyer);
    check('Gate 2', 'a 4-day-old abandoned hold does NOT block a new sale', r.json?.status === 'success', r.json?.message);
    check('Gate 2', 'stale holds are swept to expired', store.all('Ticket').filter((t) => t.id.startsWith('tk_orphan')).every((t) => t.status === 'expired'));
    check('Gate 2', 'sweeping cancels the orphaned reward row', store.all('FestCoinTransaction').find((t) => t.id === 'tx_orphan').status === 'cancelled');
    check('Gate 2', 'checkout session carries a bounded expires_at', typeof r.json?.session_id === 'string');
  }

  // --- a FRESH hold must still block, or oversell returns ---
  {
    const { store } = baseWorld();
    seedEvent(store, { total_capacity: 1, ticket_phases: [] });
    store.t('Ticket').push({ id: 'tk_fresh', event_id: 'ev_1', status: 'pending', created_by_id: 'u_ghost', created_date: new Date().toISOString(), qr_code: 'FC-F' });
    const r = await buy(store, USERS.buyer);
    check('Gate 2', 'a live in-flight checkout still holds its seat', r.json?.status === 'error' && /sold out/i.test(r.json.message || ''), r.json?.message);
  }

  // --- sold-out event ---
  {
    const { store } = baseWorld();
    seedEvent(store, { total_capacity: 1, ticket_phases: [] });
    const a = await buy(store, USERS.buyer);
    check('Gate 2', 'first buyer on a 1-seat event succeeds', a.json?.status === 'success');
    const t = store.all('Ticket')[0];
    await fireWebhook(store, 'checkout.session.completed',
      { ticket_ids: t.id, reward_tx_ids: '', cashback_tx_ids: '', event_id: 'ev_1', quantity: '1' });
    const b = await buy(store, USERS.other);
    check('Gate 2', 'sold-out event refuses further checkout', b.json?.status === 'error' && /sold out/i.test(b.json.message), b.json?.message);
  }
}

// ═══════════════════════════ GATE 3 ═══════════════════════════
async function raceScan(guardHonored, concurrency) {
  const { store } = baseWorld({ guardedUpdateHonored: guardHonored });
  seedEvent(store);
  store.t('Ticket').push({
    id: 'tk_race', event_id: 'ev_1', qr_code: 'FC-RACE', status: 'active', checked_in: false,
    created_by_id: USERS.buyer.id, organizer_id: USERS.organizer.id, event_title: 'Pilot Night',
  });
  const vt = loadFunction('validateTicket', { env: ENV });
  const scanners = [USERS.organizer, USERS.admin, USERS.organizer, USERS.admin, USERS.organizer].slice(0, concurrency);
  const results = await Promise.all(scanners.map((u, i) =>
    vt({ qr_code: 'FC-RACE', event_id: 'ev_1' }, { client: makeClient(store, u, { tag: `scanner${i}` }) })
  ));
  const statuses = results.map((r) => r.json?.status);
  const ticket = store.all('Ticket').find((t) => t.id === 'tk_race');
  return { statuses, ticket };
}

async function gate3() {
  section('GATE 3 — Concurrent check-in (adversarial interleaving)');
  for (const guard of [true, false]) {
    for (const n of [2, 3, 5]) {
      let worstValid = 0, coherent = true;
      for (let trial = 0; trial < 25; trial++) {
        const { statuses, ticket } = await raceScan(guard, n);
        const valid = statuses.filter((s) => s === 'valid').length;
        worstValid = Math.max(worstValid, valid);
        if (ticket.status !== 'used' || !ticket.checked_in || !ticket.scanned_by || !ticket.scanned_at) coherent = false;
      }
      check('Gate 3', `guard=${guard ? 'honored' : 'IGNORED'} · ${n} concurrent scanners · exactly one admission (25 trials)`,
        worstValid === 1, `max simultaneous "valid" observed = ${worstValid}`);
      check('Gate 3', `guard=${guard ? 'honored' : 'IGNORED'} · ${n} scanners · final audit state coherent`, coherent);
    }
  }

  // The pathological case the claim-token cannot see: a scanner that reads
  // status BEFORE the winner writes, then stalls across the winner's entire
  // claim cycle, and only then writes. Modelled explicitly.
  {
    const { store } = baseWorld({ guardedUpdateHonored: false });
    seedEvent(store);
    store.t('Ticket').push({
      id: 'tk_stall', event_id: 'ev_1', qr_code: 'FC-STALL', status: 'active', checked_in: false,
      created_by_id: USERS.buyer.id, organizer_id: USERS.organizer.id, event_title: 'Pilot Night',
    });
    const vt = loadFunction('validateTicket', { env: ENV });
    // Scanner B starts, is suspended by the scheduler while A completes fully.
    const slow = vt({ qr_code: 'FC-STALL', event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer, { tag: 'B' }) });
    await new Promise((r) => setTimeout(r, 0)); // let B read status
    const fast = await vt({ qr_code: 'FC-STALL', event_id: 'ev_1' }, { client: makeClient(store, USERS.admin, { tag: 'A' }) });
    const slowRes = await slow;
    const both = [fast.json?.status, slowRes.json?.status].filter((s) => s === 'valid').length;
    check('Gate 3', 'stalled-scanner worst case with guard IGNORED admits only one', both === 1,
      `statuses=${[fast.json?.status, slowRes.json?.status].join(',')}`);
  }
}

// ═══════════════════════════ GATE 5 ═══════════════════════════
async function gate5() {
  section('GATE 5 — FestCoin financial integrity');

  const seedTx = (store, userId, n, amount = 1) => {
    for (let i = 0; i < n; i++) {
      store.t('FestCoinTransaction').push({
        id: `tx_seed_${userId}_${i}`, created_by_id: userId, type: 'earned', amount,
        status: 'confirmed', description: 'seed', created_date: new Date(Date.now() - (n - i) * 1000).toISOString(),
      });
    }
  };

  // >100 transactions: the wallet used to sum only the newest 100.
  {
    const { store } = baseWorld();
    seedTx(store, USERS.buyer.id, 150, 1);
    const fn = loadFunction('getFtcBalance', { env: ENV });
    const r = await fn({}, { client: makeClient(store, USERS.buyer) });
    check('Gate 5', 'balance with 150 transactions is the whole ledger, not one page',
      r.json?.balance === 150 && r.json?.complete === true, `balance=${r.json?.balance} complete=${r.json?.complete}`);
    const other = await fn({}, { client: makeClient(store, USERS.other) });
    check('Gate 5', 'balance endpoint is per-session user only', other.json?.balance === 0);
  }

  // Ledger beyond the read ceiling must refuse to authorise a debit.
  {
    const { store } = baseWorld();
    seedTx(store, USERS.buyer.id, 5001, 1);
    seedEvent(store);
    store.t('Ticket').push({ id: 'tk_x', event_id: 'ev_1', created_by_id: USERS.buyer.id, status: 'active', organizer_id: USERS.organizer.id });
    store.t('VenueMenuItem').push({ id: 'mi_1', event_id: 'ev_1', name: 'Beer', price_ftc: 10, is_available: true });
    const fn = loadFunction('redeemEventItem', { env: ENV });
    const r = await fn({ event_id: 'ev_1', menu_item_id: 'mi_1' }, { client: makeClient(store, USERS.buyer) });
    check('Gate 5', 'incomplete ledger read REFUSES the debit (503) instead of guessing', r.status === 503, `status=${r.status}`);
    check('Gate 5', 'no spend row was confirmed on the incomplete read',
      store.all('FestCoinTransaction').filter((t) => t.type === 'spent' && t.status === 'confirmed').length === 0);
  }

  // Insufficient balance.
  {
    const { store } = baseWorld();
    seedEvent(store);
    seedTx(store, USERS.buyer.id, 5, 1); // 5 FTC
    store.t('Ticket').push({ id: 'tk_y', event_id: 'ev_1', created_by_id: USERS.buyer.id, status: 'active', organizer_id: USERS.organizer.id });
    store.t('VenueMenuItem').push({ id: 'mi_2', event_id: 'ev_1', name: 'Bottle', price_ftc: 100, is_available: true });
    const fn = loadFunction('redeemEventItem', { env: ENV });
    const r = await fn({ event_id: 'ev_1', menu_item_id: 'mi_2' }, { client: makeClient(store, USERS.buyer) });
    check('Gate 5', 'insufficient balance is rejected', r.status === 400 && /Insufficient/i.test(r.json?.message || ''));
    check('Gate 5', 'rejected redemption leaves no confirmed debit',
      store.all('FestCoinTransaction').filter((t) => t.type === 'spent' && t.status === 'confirmed').length === 0);
  }

  // No active ticket -> cannot redeem.
  {
    const { store } = baseWorld();
    seedEvent(store);
    seedTx(store, USERS.other.id, 500, 1);
    store.t('VenueMenuItem').push({ id: 'mi_3', event_id: 'ev_1', name: 'Beer', price_ftc: 10, is_available: true });
    const fn = loadFunction('redeemEventItem', { env: ENV });
    const r = await fn({ event_id: 'ev_1', menu_item_id: 'mi_3' }, { client: makeClient(store, USERS.other) });
    check('Gate 5', 'no ticket for the event = no redemption', r.status === 403);
  }

  // Repeated identical redemption of the same item.
  {
    const { store } = baseWorld();
    seedEvent(store);
    seedTx(store, USERS.buyer.id, 500, 1);
    store.t('Ticket').push({ id: 'tk_z', event_id: 'ev_1', created_by_id: USERS.buyer.id, status: 'active', organizer_id: USERS.organizer.id });
    store.t('VenueMenuItem').push({ id: 'mi_4', event_id: 'ev_1', name: 'Beer', price_ftc: 10, is_available: true, stock: 50 });
    const fn = loadFunction('redeemEventItem', { env: ENV });
    const a = await fn({ event_id: 'ev_1', menu_item_id: 'mi_4' }, { client: makeClient(store, USERS.buyer) });
    const b = await fn({ event_id: 'ev_1', menu_item_id: 'mi_4' }, { client: makeClient(store, USERS.buyer) });
    check('Gate 5', 'first redemption succeeds', a.json?.status === 'success');
    check('Gate 5', 'repeated identical redemption is refused (409)', b.status === 409);
    check('Gate 5', 'exactly one debit recorded',
      store.all('FestCoinTransaction').filter((t) => t.type === 'spent' && t.status === 'confirmed').length === 1);
  }

  // Simultaneous redemption of two DIFFERENT items with only enough for one.
  {
    let overdraws = 0, doubleSuccess = 0;
    for (let trial = 0; trial < 25; trial++) {
      const { store } = baseWorld();
      seedEvent(store);
      seedTx(store, USERS.buyer.id, 10, 1); // 10 FTC
      store.t('Ticket').push({ id: 'tk_c', event_id: 'ev_1', created_by_id: USERS.buyer.id, status: 'active', organizer_id: USERS.organizer.id });
      store.t('VenueMenuItem').push({ id: 'mi_a', event_id: 'ev_1', name: 'A', price_ftc: 10, is_available: true });
      store.t('VenueMenuItem').push({ id: 'mi_b', event_id: 'ev_1', name: 'B', price_ftc: 10, is_available: true });
      const fn = loadFunction('redeemEventItem', { env: ENV });
      const [ra, rb] = await Promise.all([
        fn({ event_id: 'ev_1', menu_item_id: 'mi_a' }, { client: makeClient(store, USERS.buyer, { tag: 'A' }) }),
        fn({ event_id: 'ev_1', menu_item_id: 'mi_b' }, { client: makeClient(store, USERS.buyer, { tag: 'B' }) }),
      ]);
      const ok = [ra, rb].filter((r) => r.json?.status === 'success').length;
      if (ok > 1) doubleSuccess++;
      const bal = store.all('FestCoinTransaction')
        .filter((t) => t.status === 'confirmed')
        .reduce((s, t) => s + (['earned', 'transferred_in', 'pilot_topup'].includes(t.type) ? t.amount : -t.amount), 0);
      if (bal < 0) overdraws++;
    }
    check('Gate 5', 'simultaneous redemption never takes the wallet negative (25 trials)', overdraws === 0, `overdraws=${overdraws}`);
    check('Gate 5', 'simultaneous redemption never double-succeeds beyond balance (25 trials)', doubleSuccess === 0, `double=${doubleSuccess}`);
  }

  // Duplicate cashback for one purchase.
  {
    const { store } = baseWorld();
    seedEvent(store, { ftc_cashback_enabled: true, ftc_cashback_percent: 10, ftc_conversion_rate: 1 });
    store.t('Ticket').push({ id: 'tk_cb', event_id: 'ev_1', created_by_id: USERS.buyer.id, status: 'active', price_paid: 100, organizer_id: USERS.organizer.id });
    const fn = loadFunction('processCashback', { env: ENV });
    const a = await fn({ event_id: 'ev_1', purchase_reference: 'tk_cb' }, { client: makeClient(store, USERS.buyer) });
    const b = await fn({ event_id: 'ev_1', purchase_reference: 'tk_cb' }, { client: makeClient(store, USERS.buyer) });
    check('Gate 5', 'cashback credited once', a.json?.cashback_ftc === 10, `got ${a.json?.cashback_ftc}`);
    check('Gate 5', 'duplicate cashback refused', b.json?.status === 'error' && /already issued/i.test(b.json.message));
    check('Gate 5', 'exactly one cashback row',
      store.all('FestCoinTransaction').filter((t) => t.source === 'cashback').length === 1);

    // Cashback on someone else's purchase.
    const c = await fn({ event_id: 'ev_1', purchase_reference: 'tk_cb' }, { client: makeClient(store, USERS.other) });
    check('Gate 5', "cannot claim cashback on another user's ticket", c.status === 403);
  }

  // Cashback anchored to an UNPAID ticket must be refused.
  {
    const { store } = baseWorld();
    seedEvent(store, { ftc_cashback_enabled: true, ftc_cashback_percent: 10, ftc_conversion_rate: 1 });
    store.t('Ticket').push({ id: 'tk_pend', event_id: 'ev_1', created_by_id: USERS.buyer.id, status: 'pending', price_paid: 100 });
    const fn = loadFunction('processCashback', { env: ENV });
    const r = await fn({ event_id: 'ev_1', purchase_reference: 'tk_pend' }, { client: makeClient(store, USERS.buyer) });
    check('Gate 5', 'cashback refused on an unpaid ticket', r.status === 409);
  }

  // Self-service top-up caps.
  {
    const { store } = baseWorld();
    seedEvent(store, { ftc_enabled: true, ftc_conversion_rate: 1 });
    const fn = loadFunction('ftcTopup', { env: ENV });
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const r = await fn({ event_id: 'ev_1', native_amount: 100000 }, { client: makeClient(store, USERS.buyer) });
      if (r.json?.status === 'success') total += r.json.ftc_amount;
    }
    check('Gate 5', 'repeated top-up cannot exceed the daily cap', total <= 1000, `total minted = ${total}`);
    check('Gate 5', 'per-call top-up clamp holds', total > 0 && total <= 1000);
  }

  // pilotTopup is admin-only.
  {
    const { store } = baseWorld();
    const fn = loadFunction('pilotTopup', { env: ENV });
    const a = await fn({ amount: 500 }, { client: makeClient(store, USERS.attendee) });
    check('Gate 5', 'pilotTopup refuses non-admin', a.status === 403);
  }

  // A forged client-side transaction can never become spendable.
  {
    const { store } = baseWorld();
    const client = makeClient(store, USERS.attendee);
    let denied = false, landedPending = false;
    try {
      const row = await client.entities.FestCoinTransaction.create({ type: 'earned', amount: 999999, description: 'hack', status: 'confirmed' });
      landedPending = row.status !== 'confirmed';
    } catch (e) { denied = e instanceof RlsDenied; }
    check('Gate 5', 'client cannot self-mint a confirmed FTC transaction', denied || landedPending);
    let updDenied = false;
    store.t('FestCoinTransaction').push({ id: 'tx_p', created_by_id: USERS.attendee.id, type: 'earned', amount: 999, status: 'pending' });
    try { await client.entities.FestCoinTransaction.update('tx_p', { status: 'confirmed' }); }
    catch (e) { updDenied = e instanceof RlsDenied; }
    check('Gate 5', 'client cannot promote its own pending row to confirmed', updDenied);
  }
}

// ═══════════════════════════ GATE 6 ═══════════════════════════
async function gate6() {
  section('GATE 6 — Ticket phase & capacity concurrency');

  // Sequential phase rollover: Early Bird qty 2 -> third buyer pays Phase 1.
  {
    const { store } = baseWorld();
    seedEvent(store);
    const prices = [];
    const phases = [];
    for (const u of [USERS.buyer, USERS.other, USERS.attendee]) {
      const r = await buy(store, u);
      if (r.json?.status !== 'success') { prices.push(`ERR:${r.json?.message}`); continue; }
      const t = store.all('Ticket').slice(-1)[0];
      prices.push(t.price_paid); phases.push(t.ticket_phase);
      await fireWebhook(store, 'checkout.session.completed',
        { ticket_ids: t.id, reward_tx_ids: '', cashback_tx_ids: '', event_id: 'ev_1', quantity: '1' });
    }
    check('Gate 6', 'Early Bird sells exactly its quantity (2)', phases.filter((p) => p === 'Early Bird').length === 2, `phases=${phases.join(',')}`);
    check('Gate 6', 'ticket #3 rolls to Phase 1', phases[2] === 'Phase 1');
    check('Gate 6', 'ticket #3 is charged the Phase 1 price', prices[2] === 20, `prices=${prices.join(',')}`);
  }

  // Storefront price === checkout price (server resolves both).
  {
    const { store } = baseWorld();
    seedEvent(store);
    for (const u of [USERS.buyer, USERS.other]) {
      const r = await buy(store, u);
      const t = store.all('Ticket').slice(-1)[0];
      await fireWebhook(store, 'checkout.session.completed',
        { ticket_ids: t.id, reward_tx_ids: '', cashback_tx_ids: '', event_id: 'ev_1', quantity: '1' });
      if (r.json?.status !== 'success') break;
    }
    const ged = loadFunction('getEventDetails', { env: ENV });
    const shown = await ged({ event_id: 'ev_1' }, { client: makeClient(store, USERS.attendee) });
    const shownPrice = shown.json?.active_phase?.price;
    const r3 = await buy(store, USERS.attendee);
    const charged = store.all('Ticket').slice(-1)[0].price_paid;
    check('Gate 6', 'price shown on the event page equals price charged after a lote sells out',
      shownPrice === charged && shownPrice === 20, `shown=${shownPrice} charged=${charged}`);
    check('Gate 6', 'checkout ignores any client-supplied price', r3.json?.status === 'success' && charged === 20);
  }

  // Client cannot force a cheaper phase or a bogus tier.
  {
    const { store } = baseWorld();
    seedEvent(store);
    const r = await buy(store, USERS.buyer, { ticket_type: 'vip', price: 0, ticket_phase: 'Early Bird' });
    check('Gate 6', 'unpriced VIP tier is refused, not sold at 0', r.json?.status === 'error', r.json?.message);
    const r2 = await buy(store, USERS.buyer, { ticket_tier: 'not_a_tier' });
    check('Gate 6', 'invalid ticket tier refused', r2.json?.status === 'error');
  }

  // CONCURRENCY at the phase boundary and at capacity.
  for (const scenario of [
    { label: 'phase boundary (Early Bird qty 2, 1 already sold)', sold: 1, cap: 10, expectPhaseMax: 1 },
    { label: 'event capacity (cap 3, 2 already sold)', sold: 2, cap: 3, expectPhaseMax: 1 },
  ]) {
    let maxExtra = 0;
    for (let trial = 0; trial < 20; trial++) {
      const { store } = baseWorld();
      seedEvent(store, { total_capacity: scenario.cap, tickets_sold: scenario.sold });
      // Pre-place already-sold Early Bird tickets so phase counting sees them.
      for (let i = 0; i < scenario.sold; i++) {
        store.t('Ticket').push({ id: `tk_pre_${i}`, event_id: 'ev_1', ticket_phase: 'Early Bird', status: 'active', created_by_id: `u_pre_${i}` });
      }
      const results = await Promise.all([USERS.buyer, USERS.other, USERS.attendee].map((u) => buy(store, u)));
      const ok = results.filter((r) => r.json?.status === 'success').length;
      maxExtra = Math.max(maxExtra, ok);
    }
    check('Gate 6', `concurrent burst at ${scenario.label}: successes bounded`,
      maxExtra <= 3, `max concurrent successes = ${maxExtra} (expected safe value ${scenario.expectPhaseMax})`);
    check('Gate 6', `concurrent burst at ${scenario.label}: no MORE than the true remaining allowance`,
      maxExtra === scenario.expectPhaseMax,
      `observed ${maxExtra}, safe limit ${scenario.expectPhaseMax} — >limit means check-then-create is not atomic`);
  }
}

// ═══════════════════════════ GATE 7 ═══════════════════════════
async function gate7() {
  section('GATE 7 — Organizer authorization (backend, not buttons)');
  const payload = { title: 'Sneaky', date: new Date().toISOString(), location_name: 'X', total_capacity: 10 };

  const { store } = baseWorld();
  seedEvent(store);
  store.t('Event').push({ id: 'ev_other', title: 'Other Org Event', status: 'published', visibility: 'public', created_by_id: USERS.organizer2.id, total_capacity: 10, tickets_sold: 0 });
  const se = loadFunction('saveEvent', { env: ENV });

  const a = await se({ action: 'create', payload, status: 'published' }, { client: makeClient(store, USERS.attendee) });
  check('Gate 7', 'plain attendee CANNOT create an event via the backend', a.status === 403 && a.json?.code === 'not_approved_organizer');

  const b = await se({ action: 'update', event_id: 'ev_1', payload: { title: 'Hijacked' } }, { client: makeClient(store, USERS.attendee) });
  check('Gate 7', "plain attendee CANNOT edit an organizer's event", b.status === 403);

  const c = await se({ action: 'update', event_id: 'ev_other', payload: { title: 'Stolen' } }, { client: makeClient(store, USERS.organizer) });
  check('Gate 7', "approved organizer CANNOT edit another organizer's event", c.status === 403, c.json?.message);

  const d = await se({ action: 'delete', event_id: 'ev_other' }, { client: makeClient(store, USERS.organizer) });
  check('Gate 7', "approved organizer CANNOT delete another organizer's event", d.status === 403);

  const e = await se({ action: 'create', payload, status: 'published' }, { client: makeClient(store, USERS.organizer) });
  check('Gate 7', 'approved organizer CAN create and publish', e.json?.status === 'success' && e.json.event_status === 'published');
  const created = store.all('Event').find((x) => x.title === 'Sneaky');
  check('Gate 7', 'created event is owned by the real organizer, not a service identity',
    created?.created_by_id === USERS.organizer.id, `owner=${created?.created_by_id}`);

  const f = await se({ action: 'create', payload, status: 'published' }, { client: makeClient(store, USERS.admin) });
  check('Gate 7', 'admin CAN create', f.json?.status === 'success');

  // RLS itself, bypassing the function entirely.
  {
    const client = makeClient(store, USERS.attendee);
    let denied = false;
    try { await client.entities.Event.create({ ...payload, status: 'published', visibility: 'public' }); }
    catch (err) { denied = err instanceof RlsDenied; }
    check('Gate 7', 'direct entity create of a PUBLISHED event is denied by RLS', denied);

    let draftOk = false;
    try { const r = await client.entities.Event.create({ ...payload, status: 'draft' }); draftOk = r.status === 'draft'; } catch (_) {}
    check('Gate 7', 'a draft is the most an unapproved account can create (and drafts are unsellable)', draftOk);

    let updDenied = false;
    try { await client.entities.Event.update('ev_1', { status: 'published' }); }
    catch (err) { updDenied = err instanceof RlsDenied; }
    check('Gate 7', 'direct entity update is denied by RLS even for a signed-in user', updDenied);

    // And the draft genuinely cannot be sold.
    const draft = store.all('Event').find((x) => x.status === 'draft');
    if (draft) {
      const fn = loadFunction('createCheckoutSession', { stripe: makeStripe(), env: ENV });
      const r = await fn({ event_id: draft.id, quantity: 1, ...BUYER_INFO }, { client: makeClient(store, USERS.buyer), headers: { origin: 'https://festchain.com' } });
      check('Gate 7', 'a draft event cannot be sold', r.json?.status === 'error' && /not open for booking/i.test(r.json.message));
    }
  }

  // Integrity guards on edit.
  {
    store.t('Event').push({ id: 'ev_sold', title: 'Sold', status: 'published', visibility: 'public', created_by_id: USERS.organizer.id, total_capacity: 100, tickets_sold: 40, refund_policy: 'ate_7_dias' });
    const g = await se({ action: 'update', event_id: 'ev_sold', payload: { total_capacity: 10 } }, { client: makeClient(store, USERS.organizer) });
    check('Gate 7', 'capacity cannot be cut below tickets already sold', g.status === 409 && g.json?.code === 'capacity_below_sold');
    const h = await se({ action: 'update', event_id: 'ev_sold', payload: { refund_policy: 'sem_reembolso' } }, { client: makeClient(store, USERS.organizer) });
    check('Gate 7', 'refund policy is frozen after the first sale',
      h.json?.status === 'success' && store.all('Event').find((x) => x.id === 'ev_sold').refund_policy === 'ate_7_dias');
    const i = await se({ action: 'delete', event_id: 'ev_sold' }, { client: makeClient(store, USERS.organizer) });
    check('Gate 7', 'an event with sales cannot be deleted by its organizer', i.status === 409);
    const j = await se({ action: 'update', event_id: 'ev_sold', payload: { tickets_sold: 9999, created_by_id: USERS.attendee.id } }, { client: makeClient(store, USERS.organizer) });
    const evSold = store.all('Event').find((x) => x.id === 'ev_sold');
    check('Gate 7', 'client cannot write derived/ownership fields through saveEvent',
      j.json?.status === 'success' && evSold.tickets_sold === 40 && evSold.created_by_id === USERS.organizer.id);
  }

  // Scanner authorization.
  {
    const vt = loadFunction('validateTicket', { env: ENV });
    store.t('Ticket').push({ id: 'tk_s', event_id: 'ev_1', qr_code: 'FC-S', status: 'active', created_by_id: USERS.buyer.id, organizer_id: USERS.organizer.id });
    const notMine = await vt({ qr_code: 'FC-S', event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer2) });
    check('Gate 7', 'an approved organizer cannot scan someone ELSE\'s event', notMine.status === 403);
    const attendeeScan = await vt({ qr_code: 'FC-S', event_id: 'ev_1' }, { client: makeClient(store, USERS.attendee) });
    check('Gate 7', 'a plain attendee cannot scan', attendeeScan.status === 403);
  }
}

// ═══════════════════════════ GATE 8 ═══════════════════════════
async function gate8() {
  section('GATE 8 — Private-event access via direct backend calls');
  const { store } = baseWorld();
  seedEvent(store, { visibility: 'private' });
  store.t('Ticket').push({ id: 'tk_priv', event_id: 'ev_1', status: 'active', created_by_id: USERS.buyer.id, organizer_id: USERS.organizer.id, qr_code: 'FC-P' });
  const ged = loadFunction('getEventDetails', { env: ENV });

  const anon = await ged({ event_id: 'ev_1' }, { client: makeClient(store, null, { tag: 'anon' }) });
  check('Gate 8', 'anonymous caller is denied private event data', anon.json?.status === 'denied');
  check('Gate 8', 'denial leaks no event payload', !anon.json?.event);

  const stranger = await ged({ event_id: 'ev_1' }, { client: makeClient(store, USERS.other) });
  check('Gate 8', 'signed-in stranger is denied', stranger.json?.status === 'denied');

  const holder = await ged({ event_id: 'ev_1' }, { client: makeClient(store, USERS.buyer) });
  check('Gate 8', 'valid ticket holder CAN see the private event', holder.json?.status === 'success');

  const org = await ged({ event_id: 'ev_1' }, { client: makeClient(store, USERS.organizer) });
  check('Gate 8', 'organizer CAN see their private event', org.json?.status === 'success');

  const admin = await ged({ event_id: 'ev_1' }, { client: makeClient(store, USERS.admin) });
  check('Gate 8', 'admin CAN see the private event', admin.json?.status === 'success');

  // Direct entity read must not be a side door.
  {
    const client = makeClient(store, USERS.other);
    let denied = false;
    try { await client.entities.Event.get('ev_1'); } catch (e) { denied = e instanceof RlsDenied; }
    check('Gate 8', 'direct entity read of a private event is denied by RLS', denied);
    const listed = await client.entities.Event.filter({});
    check('Gate 8', 'private event does not appear in a stranger\'s listing', !listed.some((e) => e.id === 'ev_1'));
  }

  // Organizer PII must not leak to an authorised-but-not-owner viewer.
  {
    store.t('Event').push({ id: 'ev_pub', status: 'published', visibility: 'public', created_by_id: USERS.organizer.id, created_by: 'org@test', title: 'Public', total_capacity: 10, tickets_sold: 0 });
    const r = await ged({ event_id: 'ev_pub' }, { client: makeClient(store, null, { tag: 'anon' }) });
    check('Gate 8', 'organizer email is stripped from anonymous event payloads', r.json?.status === 'success' && !r.json.event.created_by);
  }

  // Ticket detail cross-user.
  {
    const gtd = loadFunction('getTicketDetails', { env: ENV });
    const r = await gtd({ ticket_id: 'tk_priv' }, { client: makeClient(store, USERS.other) });
    check('Gate 8', 'ticket detail denied to a non-owner', r.status === 403);
    const anonR = await gtd({ ticket_id: 'tk_priv' }, { client: makeClient(store, null) });
    check('Gate 8', 'ticket detail requires sign-in', anonR.status === 401 || anonR.status === 500);
  }
}

// ═══════════════════════════ run ═══════════════════════════
const t0 = Date.now();
await gate2();
await gate3();
await gate5();
await gate6();
await gate7();
await gate8();
console.log(`\nElapsed ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const failures = summary();
process.exit(failures > 0 ? 1 : 0);
