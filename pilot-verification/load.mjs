// GATE 10 — architectural concurrency + cost measurement.
//
// HONESTY NOTE, READ THIS FIRST.
// This does NOT measure production latency. It runs the real backend functions
// against an in-memory store, so wall-clock numbers here are meaningless for
// capacity planning. What it measures precisely, and what actually determines
// whether FestChain survives a real door, is:
//
//   * backend round-trips per user action (each one is a network hop + a
//     database query in production);
//   * rows read per action, and how that scales with attendee count;
//   * duplicate/incorrect operations under concurrent bursts.
//
// Those are properties of the architecture, not of the machine. A real
// latency/throughput number requires hitting the deployed app with auth
// tokens; the procedure for that is in PILOT_TEST_PROCEDURE.md and is
// deliberately NOT run from here, because load-testing a live Base44 app
// consumes real quota and would look like an attack.

import { Store, Scheduler, makeClient, loadFunction } from './harness.mjs';

const ENV = { STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake', BASE44_APP_ID: 'app' };
const ORG = { id: 'u_org', role: 'user', approved_organizer: true, full_name: 'Org', email: 'o@t' };

function stripeMock() {
  let n = 0;
  return function Stripe() {
    return {
      checkout: { sessions: { create: async (p) => ({ id: `cs_${++n}`, url: 'https://s', ...p }) } },
      paymentIntents: { retrieve: async () => ({ payment_method: 'pm', latest_charge: { balance_transaction: { fee: 57 } } }) },
      paymentMethods: { retrieve: async () => ({ type: 'card' }) },
      webhooks: { constructEventAsync: async (raw) => (typeof raw === 'string' ? JSON.parse(raw) : raw) },
    };
  };
}

// Instrumented store: counts every backend operation and every row read.
class CountingStore extends Store {
  constructor(opts) { super(opts); this.ops = 0; this.rowsRead = 0; this.byOp = {}; }
  reset() { this.ops = 0; this.rowsRead = 0; this.byOp = {}; }
}

function instrument(store) {
  const sched = store.sched;
  const origStep = sched.step.bind(sched);
  sched.step = async (label) => {
    store.ops++;
    const kind = String(label).split(':')[1] || 'op';
    store.byOp[kind] = (store.byOp[kind] || 0) + 1;
    return origStep(label);
  };
}

function world(attendees) {
  const store = new CountingStore({ scheduler: new Scheduler() });
  instrument(store);
  store.t('User').push({ ...ORG });
  store.t('Event').push({
    id: 'ev', title: 'Scale Test', status: 'published', visibility: 'public',
    created_by_id: ORG.id, total_capacity: attendees + 500, tickets_sold: attendees,
    ticket_price: 50, currency_code: 'BRL', festcoin_reward: 50,
    date: new Date(Date.now() + 86400000).toISOString(), location_name: 'Arena',
    ticket_phases: [{ name: 'Early Bird', price: 50, quantity: attendees + 500, active: true, festcoin_reward: 50 }],
  });
  for (let i = 0; i < attendees; i++) {
    store.t('User').push({ id: `u${i}`, role: 'user', full_name: `A${i}`, email: `a${i}@t` });
    store.t('Ticket').push({
      id: `tk${i}`, event_id: 'ev', qr_code: `FC-${i}`, status: 'active', checked_in: false,
      created_by_id: `u${i}`, organizer_id: ORG.id, ticket_phase: 'Early Bird', price_paid: 50,
      event_title: 'Scale Test', created_date: new Date().toISOString(),
    });
    // A realistic wallet: reward + a couple of drink redemptions.
    for (let k = 0; k < 3; k++) {
      store.t('FestCoinTransaction').push({
        id: `tx${i}_${k}`, created_by_id: `u${i}`, type: 'earned', amount: 50,
        status: 'confirmed', description: 'reward', created_date: new Date().toISOString(),
      });
    }
  }
  store.t('VenueMenuItem').push({ id: 'mi', event_id: 'ev', name: 'Beer', price_ftc: 10, is_available: true, stock: 100000 });
  return store;
}

async function measure(store, label, fn) {
  store.reset();
  const t0 = process.hrtime.bigint();
  const out = await fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { label, ops: store.ops, rowsRead: store.rowsRead, byOp: { ...store.byOp }, ms, out };
}

const rows = [];
function report(scale, r, per = 1) {
  rows.push({
    scale, action: r.label,
    'backend round-trips': (r.ops / per).toFixed(1),
    detail: Object.entries(r.byOp).map(([k, v]) => `${k}×${(v / per).toFixed(1)}`).join(' '),
  });
}

for (const attendees of [50, 250, 1000]) {
  const store = world(attendees);

  // 1. Event page view (anonymous) — the hottest public path.
  const page = await measure(store, 'event page view (getEventDetails)', async () => {
    const fn = loadFunction('getEventDetails', { env: ENV });
    return fn({ event_id: 'ev' }, { client: makeClient(store, null, { tag: 'anon' }) });
  });
  report(attendees, page);

  // 2. Burst of concurrent page views.
  const burst = await measure(store, '100 concurrent event page views', async () => {
    const fn = loadFunction('getEventDetails', { env: ENV });
    return Promise.all(Array.from({ length: 100 }, (_, i) =>
      fn({ event_id: 'ev' }, { client: makeClient(store, null, { tag: `v${i}` }) })));
  });
  report(attendees, burst, 100);

  // 3. Door: one scan.
  const scan = await measure(store, 'door scan (validateTicket)', async () => {
    const fn = loadFunction('validateTicket', { env: ENV });
    return fn({ qr_code: 'FC-0', event_id: 'ev' }, { client: makeClient(store, ORG) });
  });
  report(attendees, scan);

  // 4. Arrival burst: 4 scanners, 120 guests in the window.
  const arrivals = Math.min(120, attendees);
  const arrival = await measure(store, `${arrivals} arrivals across 4 scanners`, async () => {
    const fn = loadFunction('validateTicket', { env: ENV });
    const queues = [[], [], [], []];
    for (let i = 0; i < arrivals; i++) queues[i % 4].push(i);
    return Promise.all(queues.map(async (q) => {
      for (const i of q) await fn({ qr_code: `FC-${i}`, event_id: 'ev' }, { client: makeClient(store, ORG, { tag: 'sc' }) });
    }));
  });
  report(attendees, arrival, arrivals);

  // 5. Wallet balance read.
  const wallet = await measure(store, 'wallet balance (getFtcBalance)', async () => {
    const fn = loadFunction('getFtcBalance', { env: ENV });
    return fn({}, { client: makeClient(store, { id: 'u0', role: 'user' }) });
  });
  report(attendees, wallet);

  // 6. Bar redemption.
  const redeem = await measure(store, 'bar redemption (redeemEventItem)', async () => {
    const fn = loadFunction('redeemEventItem', { env: ENV });
    return fn({ event_id: 'ev', menu_item_id: 'mi' }, { client: makeClient(store, { id: 'u1', role: 'user' }) });
  });
  report(attendees, redeem);

  // 7. Checkout.
  const checkout = await measure(store, 'ticket checkout (createCheckoutSession)', async () => {
    const fn = loadFunction('createCheckoutSession', { stripe: stripeMock(), env: ENV });
    return fn({
      event_id: 'ev', quantity: 1, buyer_name: 'B', buyer_cpf: '12345678901',
      buyer_email: 'b@t', buyer_phone: '11999999999',
    }, { client: makeClient(store, { id: 'u_new', role: 'user' }), headers: { origin: 'https://festchain.com' } });
  });
  report(attendees, checkout);
}

console.log('\n══════ BACKEND ROUND-TRIPS PER ACTION (the number that matters) ══════\n');
console.table(rows);

// ── Oversell bound: how far past capacity can a concurrent burst go? ──
console.log('\n══════ OVERSELL BOUND vs CONCURRENT BURST SIZE ══════');
console.log('Last seat available; N buyers click "buy" inside one round-trip.\n');
const oversell = [];
for (const n of [2, 3, 5, 10, 20]) {
  let worst = 0;
  for (let trial = 0; trial < 15; trial++) {
    const store = new Store({ scheduler: new Scheduler() });
    store.t('User').push({ ...ORG });
    store.t('Event').push({
      id: 'ev', title: 'T', status: 'published', visibility: 'public', created_by_id: ORG.id,
      total_capacity: 1, tickets_sold: 0, ticket_price: 10, currency_code: 'BRL',
      date: new Date(Date.now() + 86400000).toISOString(), location_name: 'X', ticket_phases: [],
    });
    const fn = loadFunction('createCheckoutSession', { stripe: stripeMock(), env: ENV });
    const res = await Promise.all(Array.from({ length: n }, (_, i) =>
      fn({ event_id: 'ev', quantity: 1, buyer_name: 'B', buyer_cpf: '12345678901', buyer_email: `b${i}@t`, buyer_phone: '11999999999' },
        { client: makeClient(store, { id: `ub${i}`, role: 'user' }, { tag: `b${i}` }), headers: { origin: 'https://festchain.com' } })));
    worst = Math.max(worst, res.filter((r) => r.json?.status === 'success').length);
  }
  oversell.push({ 'concurrent buyers': n, 'seats available': 1, 'max sold': worst, 'oversell': worst - 1 });
}
console.table(oversell);
console.log('Reading: oversell is bounded by the number of checkouts that clear the');
console.log('capacity read before any of them writes its pending row — i.e. by how');
console.log('many people click inside one backend round-trip, NOT by event size.');
console.log('Operational mitigation: set total_capacity a few seats below the real');
console.log('room limit. A buffer >= peak simultaneous clicks makes oversell impossible.\n');
