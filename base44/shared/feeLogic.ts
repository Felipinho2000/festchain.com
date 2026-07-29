// Shared fee calculation and payout logic for FestChain.
// Money is stored as integer cents (BRL). Never floats.
// Imported by backend functions (Deno environment).

// ---------------------------------------------------------------------------
// Brazilian national holidays (fixed + mobile via Easter computus)
// ---------------------------------------------------------------------------

function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function fmtHoliday(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getBrazilianHolidays(year: number): Set<string> {
  const holidays = new Set<string>();
  const fixed = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];
  for (const h of fixed) holidays.add(`${year}-${h}`);
  const easter = computeEaster(year);
  const goodFriday = new Date(easter); goodFriday.setUTCDate(easter.getUTCDate() - 2);
  const carnavalTue = new Date(easter); carnavalTue.setUTCDate(easter.getUTCDate() - 47);
  const carnavalMon = new Date(easter); carnavalMon.setUTCDate(easter.getUTCDate() - 48);
  holidays.add(fmtHoliday(goodFriday));
  holidays.add(fmtHoliday(carnavalTue));
  holidays.add(fmtHoliday(carnavalMon));
  return holidays;
}

export function isBusinessDay(date: Date): boolean {
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  const holidays = getBrazilianHolidays(date.getUTCFullYear());
  return !holidays.has(fmtHoliday(date));
}

// Add N business days (UTC), skipping weekends and Brazilian national holidays.
export function addBusinessDays(startDate: Date, days: number): Date {
  let result = new Date(startDate.getTime());
  let added = 0;
  while (added < days) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isBusinessDay(result)) added++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Fee percentage — computed from stored dates, never silently mutated
// ---------------------------------------------------------------------------

export function getEffectiveFeePercentage(organizer: any, atDate: Date = new Date()): number {
  if (organizer.fee_tier === 'pilot' && organizer.pilot_expires_at) {
    const expiresAt = new Date(organizer.pilot_expires_at);
    if (atDate <= expiresAt) return 5.0;
  }
  return organizer.fee_percentage || 8.0;
}

// ---------------------------------------------------------------------------
// Organizer account — get or create with defaults via asServiceRole
// ---------------------------------------------------------------------------

export async function getOrCreateOrganizerAccount(base44: any, userId: string): Promise<any> {
  if (!userId) return null;
  const existing = await base44.asServiceRole.entities.OrganizerAccount.filter({ user_id: userId }, null, 1);
  if (existing && existing.length > 0) return existing[0];
  return await base44.asServiceRole.entities.OrganizerAccount.create({
    user_id: userId,
    legal_name: '',
    tax_id: '',
    fee_percentage: 8.0,
    fee_tier: 'standard',
    pilot_started_at: null,
    pilot_expires_at: null,
    fee_paid_by: 'organizer',
    payout_pix_key: null,
    payout_pix_key_type: null,
  });
}

// ---------------------------------------------------------------------------
// Money helpers — integer cents
// ---------------------------------------------------------------------------

export function brlToCents(brl: number): number {
  return Math.round((brl || 0) * 100);
}

export function calculatePlatformFeeCents(pricePaidCents: number, feePercentage: number): number {
  return Math.round(pricePaidCents * feePercentage / 100);
}

// ---------------------------------------------------------------------------
// Event payout status — computed from dates, preserves admin-set terminal states
// ---------------------------------------------------------------------------

export function getEventPayoutStatus(event: any, payout: any): string {
  if (payout && (payout.status === 'paid' || payout.status === 'failed')) {
    return payout.status;
  }
  const now = new Date();
  const eventEnd = event.end_date ? new Date(event.end_date) : (event.date ? new Date(event.date) : null);
  if (!eventEnd || eventEnd > now) return 'accruing';
  const payoutDue = addBusinessDays(eventEnd, 2);
  return now < payoutDue ? 'settlement_window' : 'payable';
}

// ---------------------------------------------------------------------------
// Recalculate payout figures from Ticket rows — idempotent, never trusts aggregates
// ---------------------------------------------------------------------------

export async function recalculatePayoutForEvent(base44: any, event: any): Promise<any> {
  const tickets = await base44.asServiceRole.entities.Ticket.filter({ event_id: event.id });

  let grossSalesCents = 0;
  let platformFeeCents = 0;
  let refundedAmountCents = 0;
  let unrecoveredProcessingCostCents = 0;
  let ticketsSold = 0;
  let ticketsRefunded = 0;
  let ticketsComplimentary = 0;

  for (const ticket of tickets) {
    ticketsSold++;
    if (ticket.is_complimentary) {
      ticketsComplimentary++;
      continue;
    }
    const priceCents = brlToCents(ticket.price_paid || 0);
    grossSalesCents += priceCents;
    if (ticket.status === 'refunded') {
      refundedAmountCents += priceCents;
      ticketsRefunded++;
      unrecoveredProcessingCostCents += ticket.stripe_fee_cents || 0;
    } else {
      platformFeeCents += ticket.platform_fee_cents || 0;
    }
  }

  const netPayableCents = grossSalesCents - refundedAmountCents - platformFeeCents;
  const eventEnd = event.end_date ? new Date(event.end_date) : (event.date ? new Date(event.date) : null);
  const payoutDueAt = eventEnd ? addBusinessDays(eventEnd, 2) : null;

  const existing = await base44.asServiceRole.entities.EventPayout.filter({ event_id: event.id }, null, 1);
  const payout = existing.length > 0 ? existing[0] : null;

  const finalStatus = getEventPayoutStatus(event, payout);

  const payoutData: any = {
    event_id: event.id,
    organizer_id: event.created_by_id,
    gross_sales_cents: grossSalesCents,
    platform_fee_cents: platformFeeCents,
    refunded_amount_cents: refundedAmountCents,
    unrecovered_processing_cost_cents: unrecoveredProcessingCostCents,
    net_payable_cents: netPayableCents,
    tickets_sold: ticketsSold,
    tickets_refunded: ticketsRefunded,
    tickets_complimentary: ticketsComplimentary,
    status: finalStatus,
    event_ended_at: eventEnd ? eventEnd.toISOString() : null,
    payout_due_at: payoutDueAt ? payoutDueAt.toISOString() : null,
  };

  if (payout) {
    await base44.asServiceRole.entities.EventPayout.update(payout.id, payoutData);
    return { ...payoutData, id: payout.id, paid_at: payout.paid_at, payment_reference: payout.payment_reference };
  } else {
    const created = await base44.asServiceRole.entities.EventPayout.create(payoutData);
    return { ...payoutData, id: created.id, paid_at: null, payment_reference: null };
  }
}