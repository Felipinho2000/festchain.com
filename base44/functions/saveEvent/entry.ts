import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// saveEvent — the ONLY authorized write path for organizer-owned events.
//
// Why this exists (money-path / authorization round, 2026-08-07):
// Event creation used to happen straight from the browser via
// `base44.entities.Event.create()`, gated by nothing but a hidden button. The
// Event RLS `create` rule was `{ created_by_id: "{{user.id}}" }`, so ANY
// signed-in account could create AND publish a public, sellable event — and
// because FestChain is currently the merchant of record on a single Stripe
// account, a stranger's fake event would have collected real money into
// FestChain's own balance. `approved_organizer` existed on the User entity but
// was never enforced anywhere on the server. That is the "approved_organizer is
// cosmetic" P0 from Memory.md, and this function closes it.
//
// Contract:
//   { action: 'create' | 'update' | 'delete', event_id?, payload? }
//
// Guarantees:
//   - only `approved_organizer` users (or admins) may create/update/delete;
//   - `created_by_id` is stamped by the user-scoped SDK on create (never a
//     service_... identity — asServiceRole.create silently ignores the field);
//   - only the event's own creator (or an admin) may mutate it;
//   - the client can never write `tickets_sold` or any other derived field;
//   - capacity can never drop below tickets already sold;
//   - `refund_policy` is frozen once a single ticket has been sold, because it
//     is a consumer-facing promise shown at checkout;
//   - an event with sold tickets cannot be deleted.

// Fields an organizer is allowed to set. Anything else in the payload is
// dropped rather than rejected, so a future frontend field can't accidentally
// become a privilege-escalation vector.
const EDITABLE_FIELDS = [
  'title', 'description', 'genre', 'date', 'end_date',
  'location_name', 'location_address', 'image_url',
  'ticket_price', 'festcoin_price', 'festcoin_reward',
  'total_capacity', 'visibility', 'has_poap',
  'dj_lineup', 'ticket_phases', 'lineup', 'schedule',
  'organizer_name', 'currency_code',
  'ftc_enabled', 'ftc_conversion_rate', 'ftc_discount_percent',
  'ftc_cashback_enabled', 'ftc_cashback_percent',
  'ftc_cashback_on_ftc_purchase', 'ftc_pilot_mode',
  'refund_policy',
];

const VALID_STATUS = ['draft', 'published', 'live', 'ended', 'cancelled'];
const VALID_VISIBILITY = ['public', 'private'];

function num(v, fallback = 0) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampPercent(v) {
  return Math.max(0, Math.min(100, num(v, 0)));
}

// Normalise ticket phases and reject nonsense before it reaches the sales path.
// A phase with a negative price or quantity would corrupt both the buyer's
// price and the phase-inventory accounting in createCheckoutSession.
function sanitizePhases(raw) {
  if (!Array.isArray(raw)) return undefined;
  return raw.slice(0, 12).map((p, i) => ({
    name: String(p && p.name ? p.name : `Phase ${i + 1}`).slice(0, 60),
    price: Math.max(0, num(p && p.price, 0)),
    quantity: Math.max(0, Math.floor(num(p && p.quantity, 0))),
    sales_start: p && p.sales_start ? p.sales_start : undefined,
    sales_end: p && p.sales_end ? p.sales_end : undefined,
    active: !!(p && p.active),
    festcoin_reward: Math.max(0, Math.floor(num(p && p.festcoin_reward, 0))),
  }));
}

function sanitizePayload(payload) {
  const out = {};
  if (!payload || typeof payload !== 'object') return out;

  for (const key of EDITABLE_FIELDS) {
    if (payload[key] === undefined) continue;
    out[key] = payload[key];
  }

  if (out.title !== undefined) out.title = String(out.title).slice(0, 200);
  if (out.description !== undefined) out.description = String(out.description).slice(0, 8000);
  if (out.organizer_name !== undefined) out.organizer_name = String(out.organizer_name).slice(0, 120);
  if (out.total_capacity !== undefined) out.total_capacity = Math.max(1, Math.floor(num(out.total_capacity, 1)));
  if (out.ticket_price !== undefined) out.ticket_price = Math.max(0, num(out.ticket_price, 0));
  if (out.festcoin_reward !== undefined) out.festcoin_reward = Math.max(0, Math.floor(num(out.festcoin_reward, 0)));
  if (out.ftc_conversion_rate !== undefined) out.ftc_conversion_rate = Math.max(0.0001, num(out.ftc_conversion_rate, 1));
  if (out.ftc_discount_percent !== undefined) out.ftc_discount_percent = clampPercent(out.ftc_discount_percent);
  if (out.ftc_cashback_percent !== undefined) out.ftc_cashback_percent = clampPercent(out.ftc_cashback_percent);
  if (out.visibility !== undefined && !VALID_VISIBILITY.includes(out.visibility)) out.visibility = 'public';
  if (out.ticket_phases !== undefined) {
    const phases = sanitizePhases(out.ticket_phases);
    if (phases === undefined) delete out.ticket_phases; else out.ticket_phases = phases;
  }

  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin';
    const isApprovedOrganizer = user.approved_organizer === true;
    if (!isAdmin && !isApprovedOrganizer) {
      return Response.json({
        status: 'error',
        code: 'not_approved_organizer',
        message: 'Your account is not approved to publish events. Organizer access is granted manually during the private pilot.',
      }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const action = (body && body.action) || 'create';
    const eventId = body && body.event_id;
    const requestedStatus = body && body.status;

    if (!['create', 'update', 'delete'].includes(action)) {
      return Response.json({ status: 'error', message: `Unknown action: ${action}` }, { status: 400 });
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!eventId) return Response.json({ status: 'error', message: 'Missing event_id' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.Event.get(eventId).catch(() => null);
      if (!existing) return Response.json({ status: 'error', message: 'Event not found' }, { status: 404 });
      if (!isAdmin && String(existing.created_by_id) !== String(user.id)) {
        return Response.json({ status: 'error', message: 'This is not your event' }, { status: 403 });
      }
      if ((existing.tickets_sold || 0) > 0 && !isAdmin) {
        return Response.json({
          status: 'error',
          code: 'has_sales',
          message: 'This event already has tickets sold and cannot be deleted. Cancel it instead so buyers keep a record.',
        }, { status: 409 });
      }
      await base44.asServiceRole.entities.Event.delete(eventId);
      return Response.json({ status: 'success', deleted: true });
    }

    const clean = sanitizePayload(body && body.payload);

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      if (!clean.title || !clean.date || !clean.location_name || !clean.total_capacity) {
        return Response.json({
          status: 'error',
          message: 'title, date, location_name and total_capacity are required',
        }, { status: 400 });
      }

      // Always create as draft. Event RLS only permits a user-scoped create in
      // the draft state, which keeps a never-published event invisible to
      // everyone else and unsellable by createCheckoutSession. The requested
      // status is applied immediately afterwards, server-side, now that we
      // know the caller is an approved organizer.
      const created = await base44.entities.Event.create({
        ...clean,
        status: 'draft',
        tickets_sold: 0,
      });

      const target = VALID_STATUS.includes(requestedStatus) ? requestedStatus : 'draft';
      if (target !== 'draft') {
        await base44.asServiceRole.entities.Event.update(created.id, { status: target });
      }

      return Response.json({ status: 'success', event_id: created.id, event_status: target });
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────
    if (!eventId) return Response.json({ status: 'error', message: 'Missing event_id' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.Event.get(eventId).catch(() => null);
    if (!existing) return Response.json({ status: 'error', message: 'Event not found' }, { status: 404 });
    if (!isAdmin && String(existing.created_by_id) !== String(user.id)) {
      return Response.json({ status: 'error', message: 'This is not your event' }, { status: 403 });
    }

    const sold = existing.tickets_sold || 0;

    // Capacity may be raised freely, but never dropped below tickets already
    // sold — that would make the event permanently "oversold" and break the
    // spots-left maths on the storefront.
    if (clean.total_capacity !== undefined && clean.total_capacity < sold) {
      return Response.json({
        status: 'error',
        code: 'capacity_below_sold',
        message: `Capacity cannot be lower than the ${sold} ticket(s) already sold.`,
      }, { status: 409 });
    }

    // The refund policy is displayed to the buyer at checkout. Changing it
    // after a sale would retroactively alter a consumer promise.
    if (sold > 0 && clean.refund_policy !== undefined && clean.refund_policy !== existing.refund_policy) {
      delete clean.refund_policy;
    }

    const patch = { ...clean };
    if (VALID_STATUS.includes(requestedStatus)) patch.status = requestedStatus;

    await base44.asServiceRole.entities.Event.update(eventId, patch);

    return Response.json({
      status: 'success',
      event_id: eventId,
      event_status: patch.status || existing.status,
      refund_policy_locked: sold > 0,
    });
  } catch (error) {
    console.error('saveEvent error:', error.message);
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});
