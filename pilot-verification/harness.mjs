// FestChain pilot verification harness.
//
// Loads the REAL backend function source from base44/functions/**/entry.ts and
// executes it against an in-memory Base44 mock. Nothing here paraphrases the
// implementation — if a gate passes, it passed against the code that ships.
//
// What this harness CAN prove:
//   - control flow, authorization, arithmetic, idempotency keys, RLS shape;
//   - behaviour under adversarial *application-level* interleaving, because
//     every store call yields to a cooperative scheduler.
//
// What this harness CANNOT prove:
//   - that Base44's real datastore is linearizable;
//   - that a guarded updateMany filter is honoured server-side.
// Those are modelled as switches (see StoreOptions.guardedUpdateHonored) so
// each gate can be evaluated under BOTH assumptions.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);
const esbuild = nodeRequire('/app/node_modules/esbuild');

export const APP_ROOT = '/app';

// ───────────────────────── cooperative scheduler ─────────────────────────
// Every store operation awaits sched.step(). With several handlers running
// under Promise.all, this forces them to interleave at every single I/O point
// instead of running to completion one after the other.
export class Scheduler {
  constructor() { this.enabled = false; this.log = []; }
  async step(label) {
    if (this.enabled) this.log.push(label);
    // A macrotask yield interleaves concurrent handlers deterministically
    // round-robin under Node's event loop.
    await new Promise((r) => setTimeout(r, 0));
  }
}

// ───────────────────────── mongo-ish matching ─────────────────────────
function matchValue(actual, cond) {
  if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
    for (const [op, v] of Object.entries(cond)) {
      switch (op) {
        case '$in': if (!v.includes(actual)) return false; break;
        case '$nin': if (v.includes(actual)) return false; break;
        case '$gt': if (!(actual > v)) return false; break;
        case '$gte': if (!(actual >= v)) return false; break;
        case '$lt': if (!(actual < v)) return false; break;
        case '$lte': if (!(actual <= v)) return false; break;
        case '$ne': if (actual === v) return false; break;
        default: return false;
      }
    }
    return true;
  }
  return String(actual) === String(cond);
}

function matchRow(row, query) {
  for (const [k, cond] of Object.entries(query || {})) {
    if (!matchValue(row[k], cond)) return false;
  }
  return true;
}

// ───────────────────────── RLS rules (mirrored from base44/entities) ─────
// Deliberately hand-mirrored rather than parsed, so a gate failing here means
// "the rule as written does not do what we think", which is the point.
const RLS = {
  Event: {
    create: (row, user) => String(row.created_by_id) === String(user?.id) && row.status === 'draft',
    read: (row, user) =>
      (['published', 'live'].includes(row.status) && row.visibility === 'public') ||
      String(row.created_by_id) === String(user?.id) ||
      user?.role === 'admin',
    update: (_row, user) => user?.role === 'admin',
    delete: (_row, user) => user?.role === 'admin',
  },
  Ticket: {
    create: (row, user) => String(row.created_by_id) === String(user?.id) && row.status === 'pending',
    read: (row, user) =>
      String(row.created_by_id) === String(user?.id) ||
      String(row.organizer_id) === String(user?.id) ||
      user?.role === 'admin',
    update: (_row, user) => user?.role === 'admin',
    delete: (_row, user) => user?.role === 'admin',
  },
  FestCoinTransaction: {
    create: (row, user) => String(row.created_by_id) === String(user?.id) && row.status === 'pending',
    read: (row, user) => String(row.created_by_id) === String(user?.id) || user?.role === 'admin',
    update: (_row, user) => user?.role === 'admin',
    delete: (_row, user) => user?.role === 'admin',
  },
  EventRedemption: {
    create: (row, user) => String(row.created_by_id) === String(user?.id),
    read: (row, user) =>
      String(row.created_by_id) === String(user?.id) ||
      String(row.organizer_id) === String(user?.id) || user?.role === 'admin',
    update: (row, user) =>
      String(row.created_by_id) === String(user?.id) ||
      String(row.organizer_id) === String(user?.id) || user?.role === 'admin',
    delete: (_row, user) => user?.role === 'admin',
  },
  VenueMenuItem: {
    create: (_r, u) => u?.role === 'admin', read: () => true,
    update: (_r, u) => u?.role === 'admin', delete: (_r, u) => u?.role === 'admin',
  },
  PilotApplication: {
    create: () => true,
    read: (_r, u) => u?.role === 'admin',
    update: (_r, u) => u?.role === 'admin',
    delete: (_r, u) => u?.role === 'admin',
  },
  User: { create: () => true, read: () => true, update: (_r, u) => u?.role === 'admin', delete: () => false },
};

export class RlsDenied extends Error {
  constructor(entity, op) { super(`RLS denied: ${op} on ${entity}`); this.rls = true; }
}

// ───────────────────────── the store ─────────────────────────
export class Store {
  constructor(opts = {}) {
    this.tables = {};
    this.seq = 0;
    this.sched = opts.scheduler || new Scheduler();
    // Toggle to model a backend that does NOT honour a guarded updateMany
    // filter. Gate 3 must be evaluated with this set BOTH ways.
    this.guardedUpdateHonored = opts.guardedUpdateHonored !== false;
    this.writeLog = [];
  }
  t(name) { return (this.tables[name] ||= []); }
  seed(name, rows) { for (const r of rows) this.t(name).push({ ...r }); return this; }
  nextId(prefix = 'id') { return `${prefix}_${++this.seq}`; }
  all(name) { return this.t(name).map((r) => ({ ...r })); }
}

function applyOps(row, ops) {
  if (ops.$set) Object.assign(row, ops.$set);
  if (ops.$inc) for (const [k, v] of Object.entries(ops.$inc)) row[k] = (row[k] || 0) + v;
  if (!ops.$set && !ops.$inc) Object.assign(row, ops); // bare patch (update())
}

function entityApi(store, entityName, ctx) {
  const rls = RLS[entityName] || { create: () => true, read: () => true, update: () => true, delete: () => true };
  const rows = () => store.t(entityName);
  const service = ctx.serviceRole;
  const user = ctx.user;

  return {
    async create(data) {
      await store.sched.step(`${ctx.tag}:create:${entityName}`);
      const row = { ...data };
      row.id = store.nextId(entityName.toLowerCase());
      row.created_date = data.created_date || new Date().toISOString();
      if (service) {
        // Faithful to Base44: asServiceRole.create IGNORES a supplied
        // created_by_id and stamps a service identity.
        row.created_by_id = `service_${crypto.randomUUID()}`;
      } else {
        row.created_by_id = String(user?.id);
        if (!rls.create(row, user)) throw new RlsDenied(entityName, 'create');
      }
      rows().push(row);
      store.writeLog.push({ op: 'create', entityName, id: row.id, by: ctx.tag });
      return { ...row };
    },
    async get(id) {
      await store.sched.step(`${ctx.tag}:get:${entityName}`);
      const r = rows().find((x) => String(x.id) === String(id));
      if (!r) throw new Error(`${entityName} ${id} not found`);
      if (!service && !rls.read(r, user)) throw new RlsDenied(entityName, 'read');
      return { ...r };
    },
    async filter(query = {}, sort, limit, _skip) {
      await store.sched.step(`${ctx.tag}:filter:${entityName}`);
      let out = rows().filter((r) => matchRow(r, query));
      if (!service) out = out.filter((r) => rls.read(r, user));
      if (sort) {
        const desc = sort.startsWith('-');
        const key = desc ? sort.slice(1) : sort;
        out.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (desc ? -1 : 1));
      }
      if (limit) out = out.slice(0, limit);
      return out.map((r) => ({ ...r }));
    },
    async list(limit) { return this.filter({}, undefined, limit); },
    async update(id, patch) {
      await store.sched.step(`${ctx.tag}:update:${entityName}`);
      const r = rows().find((x) => String(x.id) === String(id));
      if (!r) throw new Error(`${entityName} ${id} not found`);
      if (!service && !rls.update(r, user)) throw new RlsDenied(entityName, 'update');
      applyOps(r, patch);
      store.writeLog.push({ op: 'update', entityName, id, by: ctx.tag, patch });
      return { ...r };
    },
    async updateMany(query, ops) {
      await store.sched.step(`${ctx.tag}:updateMany:${entityName}`);
      // The interesting bit. When guardedUpdateHonored is false we model a
      // backend that matches on id only and silently ignores the extra
      // predicate — the pessimistic reading of the WAR_ROOM note about
      // guarded $inc not applying reliably.
      const effective = store.guardedUpdateHonored ? query : (query.id ? { id: query.id } : query);
      const matched = rows().filter((r) => matchRow(r, effective));
      if (!service) throw new RlsDenied(entityName, 'updateMany(user-scoped)');
      for (const r of matched) applyOps(r, ops);
      store.writeLog.push({ op: 'updateMany', entityName, by: ctx.tag, matched: matched.length });
      return { matched_count: matched.length, modified_count: matched.length };
    },
    async delete(id) {
      await store.sched.step(`${ctx.tag}:delete:${entityName}`);
      const i = rows().findIndex((x) => String(x.id) === String(id));
      if (i < 0) throw new Error('not found');
      if (!service && !rls.delete(rows()[i], user)) throw new RlsDenied(entityName, 'delete');
      rows().splice(i, 1);
      return { ok: true };
    },
  };
}

function entitiesProxy(store, ctx) {
  return new Proxy({}, { get: (_t, name) => entityApi(store, String(name), ctx) });
}

export function makeClient(store, user, opts = {}) {
  const tag = opts.tag || (user ? user.id : 'anon');
  const invoke = opts.invoke || (async () => { throw new Error('functions.invoke not wired'); });
  return {
    auth: { me: async () => { if (!user) throw new Error('not signed in'); return { ...user }; } },
    entities: entitiesProxy(store, { serviceRole: false, user, tag }),
    asServiceRole: { entities: entitiesProxy(store, { serviceRole: true, user, tag }) },
    functions: { invoke },
    integrations: { Core: { UploadFile: async () => ({ file_url: 'https://example/img.png' }) } },
  };
}

// ───────────────────────── function loader ─────────────────────────
// esbuild does the TypeScript -> CommonJS transform, so the code executed here
// is the shipped source with types erased and nothing else changed. Module
// resolution is intercepted to swap in the Base44/Stripe mocks.
function compile(file) {
  const src = fs.readFileSync(file, 'utf8');
  return esbuild.transformSync(src, { loader: 'ts', format: 'cjs', target: 'node20' }).code;
}

function runModule(file, sandbox, resolve) {
  const code = compile(file);
  const module_ = { exports: {} };
  const ctx = vm.createContext({
    ...sandbox,
    module: module_,
    exports: module_.exports,
    require: resolve,
    __filename: file,
    __dirname: path.dirname(file),
  });
  vm.runInContext(code, ctx, { filename: file });
  return module_.exports;
}

const sharedCache = new Map();
function loadShared(spec, sandbox) {
  const name = path.basename(spec).replace(/\.ts$/, '');
  if (sharedCache.has(name)) return sharedCache.get(name);
  const p = path.join(APP_ROOT, 'base44/shared', `${name}.ts`);
  const exp = runModule(p, sandbox, (s) => loadShared(s, sandbox));
  sharedCache.set(name, exp);
  return exp;
}

/**
 * Load a backend function and return an invoker:
 *   invoke(bodyObject, headers?) -> { status, json }
 */
export function loadFunction(fnName, { stripe, env = {}, secrets = {} } = {}) {
  const file = path.join(APP_ROOT, 'base44/functions', fnName, 'entry.ts');

  let handler = null;
  let clientFactory = null;

  const baseSandbox = {
    console,
    crypto,
    Response,
    Request,
    URL,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    setTimeout,
    Date,
    Math,
    JSON,
    Number,
    String,
    Array,
    Object,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    Error,
    Promise,
  };

  const sandbox = {
    ...baseSandbox,
    Deno: {
      serve: (h) => { handler = h; },
      env: { get: (k) => env[k] },
    },
  };

  const resolve = (spec) => {
    if (/^npm:@base44\/sdk/.test(spec)) return { createClientFromRequest: () => clientFactory() };
    if (/^npm:stripe/.test(spec)) return stripe;
    if (spec === 'base44:runtime') return { secrets: { get: (k) => secrets[k] } };
    if (spec.includes('/shared/')) return loadShared(spec, baseSandbox);
    throw new Error(`unmocked import: ${spec}`);
  };

  const exports_ = runModule(file, sandbox, resolve);
  // Functions register either via Deno.serve(...) or `export default`.
  if (!handler && typeof exports_.default === 'function') handler = exports_.default;
  if (!handler) throw new Error(`no handler captured for ${fnName}`);

  return async function invoke(body, { client, headers = {} } = {}) {
    clientFactory = () => client;
    const req = {
      json: async () => (body === undefined ? (() => { throw new Error('no body'); })() : body),
      text: async () => JSON.stringify(body),
      headers: { get: (k) => headers[k.toLowerCase()] ?? null },
      url: 'https://internal.dispatcher/invoke',
    };
    const res = await handler(req);
    let json = null;
    try { json = await res.json(); } catch (_) {}
    return { status: res.status || 200, json };
  };
}

// ───────────────────────── tiny assertion kit ─────────────────────────
export const results = [];
export function check(gate, name, condition, detail = '') {
  results.push({ gate, name, pass: !!condition, detail });
  const mark = condition ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${name}${detail ? ' — ' + detail : ''}`);
  return !!condition;
}
export function section(title) { console.log(`\n=== ${title} ===`); }
export function summary() {
  const byGate = {};
  for (const r of results) {
    byGate[r.gate] ||= { pass: 0, fail: 0, failures: [] };
    if (r.pass) byGate[r.gate].pass++; else { byGate[r.gate].fail++; byGate[r.gate].failures.push(r.name); }
  }
  console.log('\n================ SUMMARY ================');
  for (const [g, s] of Object.entries(byGate)) {
    console.log(`${s.fail === 0 ? 'PASS' : 'FAIL'}  ${g}  (${s.pass} passed, ${s.fail} failed)`);
    for (const f of s.failures) console.log(`        ✗ ${f}`);
  }
  const totalFail = results.filter((r) => !r.pass).length;
  console.log(`\nTOTAL: ${results.length - totalFail}/${results.length} checks passed`);
  return totalFail;
}
