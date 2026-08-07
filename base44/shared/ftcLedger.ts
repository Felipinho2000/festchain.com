// Single source of truth for a user's FestCoin balance.
//
// Why this exists (2026-08-07 alignment review):
// Every money path computed the balance inline with
// `entities.FestCoinTransaction.filter({ created_by_id })` and no explicit
// limit, and the wallet UI computed its own from the most recent 100 rows.
// Both are wrong once a user has more transactions than the backing page size:
// rows silently drop out of the sum, and the drift is not in a safe direction.
// A guest who buys a lot of drinks could see — and be allowed to spend — a
// balance that does not exist.
//
// Deliberate design choice: this does ONE bounded read rather than paging with
// an offset. Offset paging is not verified on this SDK version, and a silently
// ignored offset would double-count rows — a worse failure than the one being
// fixed. Instead we read a ceiling well above anything the pilot can produce
// and report honestly when the ceiling is hit, so callers can refuse to
// authorise a debit against an incomplete ledger.

export const FTC_CREDIT_TYPES = ['earned', 'transferred_in', 'pilot_topup'];
export const FTC_DEBIT_TYPES = ['spent', 'transferred_out'];

// If a single user ever exceeds this, the ledger design needs a running
// balance column — not a bigger number here.
export const LEDGER_READ_CEILING = 5000;

export function applyLedgerEntry(sum, tx) {
  if (!tx || tx.status !== 'confirmed') return sum;
  if (FTC_CREDIT_TYPES.includes(tx.type)) return sum + (tx.amount || 0);
  if (FTC_DEBIT_TYPES.includes(tx.type)) return sum - (tx.amount || 0);
  return sum;
}

async function readLedger(base44, userId) {
  const rows = await base44.asServiceRole.entities.FestCoinTransaction.filter(
    { created_by_id: String(userId) },
    'created_date',
    LEDGER_READ_CEILING
  );
  const batch = rows || [];
  return { batch, complete: batch.length < LEDGER_READ_CEILING };
}

/**
 * Confirmed FestCoin balance for a user.
 *
 * @returns {Promise<{ balance:number, transactionCount:number, complete:boolean }>}
 *   `complete:false` means the read ceiling was hit — do NOT authorise a debit
 *   against this number.
 */
export async function getFtcBalance(base44, userId) {
  const { batch, complete } = await readLedger(base44, userId);
  let balance = 0;
  for (const tx of batch) balance = applyLedgerEntry(balance, tx);
  return { balance, transactionCount: batch.length, complete };
}

/**
 * Balance that also subtracts debits still sitting in `pending`.
 *
 * Used as a conservative guard immediately before confirming a spend: two
 * concurrent redemptions each observe the other's pending debit, so at least
 * one backs off instead of both committing against the same stale confirmed
 * balance. Deliberately pessimistic — a pending debit that is later cancelled
 * only ever made the user look poorer for a moment.
 */
export async function getFtcBalanceIncludingPendingDebits(base44, userId) {
  const { batch, complete } = await readLedger(base44, userId);
  let balance = 0;
  for (const tx of batch) {
    if (!tx) continue;
    if (tx.status === 'confirmed') {
      balance = applyLedgerEntry(balance, tx);
    } else if (tx.status === 'pending' && FTC_DEBIT_TYPES.includes(tx.type)) {
      balance -= tx.amount || 0;
    }
  }
  return { balance, complete };
}
