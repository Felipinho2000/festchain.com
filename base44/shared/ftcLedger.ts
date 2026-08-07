// Single source of truth for a user's FestCoin balance.
//
// Why this exists (2026-08-07 alignment review):
// Every money path computed the balance inline with
// `entities.FestCoinTransaction.filter({ created_by_id })` and no explicit
// limit, and the wallet UI computed its own from the most recent 100 rows.
// Both are wrong once a user has more transactions than the backing page size:
// the oldest rows silently drop out of the sum, and because early rows are
// disproportionately `earned`/`pilot_topup` credits, the drift is not even in a
// safe direction. A guest who buys a lot of drinks would see — and be allowed
// to spend — a balance that does not exist.
//
// This helper pages explicitly until the ledger is exhausted, so the number is
// the whole ledger or an honest error. Never reimplement the reduce inline.

export const FTC_CREDIT_TYPES = ['earned', 'transferred_in', 'pilot_topup'];
export const FTC_DEBIT_TYPES = ['spent', 'transferred_out'];

const PAGE_SIZE = 500;
// Hard stop so a corrupted ledger can never spin a function forever. 100k
// transactions for one user is far beyond anything the pilot can produce; if
// it is ever hit, that is a bug worth failing loudly on.
const MAX_PAGES = 200;

export function applyLedgerEntry(sum, tx) {
  if (!tx || tx.status !== 'confirmed') return sum;
  if (FTC_CREDIT_TYPES.includes(tx.type)) return sum + (tx.amount || 0);
  if (FTC_DEBIT_TYPES.includes(tx.type)) return sum - (tx.amount || 0);
  return sum;
}

/**
 * Read every FestCoinTransaction owned by `userId` and return the confirmed
 * balance. Uses the service role so the count is complete regardless of the
 * caller's RLS scope — callers must have already authorised the request.
 *
 * @returns {Promise<{ balance: number, transactionCount: number, complete: boolean }>}
 *          `complete: false` means the page cap was hit and the balance must
 *          NOT be used to authorise a debit.
 */
export async function getFtcBalance(base44, userId) {
  let balance = 0;
  let transactionCount = 0;
  let complete = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await base44.asServiceRole.entities.FestCoinTransaction.filter(
      { created_by_id: String(userId) },
      'created_date',
      PAGE_SIZE,
      page * PAGE_SIZE
    );

    const batch = rows || [];
    for (const tx of batch) balance = applyLedgerEntry(balance, tx);
    transactionCount += batch.length;

    if (batch.length < PAGE_SIZE) { complete = true; break; }
  }

  return { balance, transactionCount, complete };
}

/**
 * Balance including transactions that are still `pending`, treating pending
 * debits as if they had already settled.
 *
 * Used as a conservative guard immediately before confirming a spend: two
 * concurrent redemptions each see the other's pending debit and at least one
 * backs off, instead of both reading the same stale confirmed balance and both
 * committing. It is deliberately pessimistic — a pending debit that later gets
 * cancelled only ever made the user look poorer for a moment.
 */
export async function getFtcBalanceIncludingPendingDebits(base44, userId) {
  let balance = 0;
  let complete = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = await base44.asServiceRole.entities.FestCoinTransaction.filter(
      { created_by_id: String(userId) },
      'created_date',
      PAGE_SIZE,
      page * PAGE_SIZE
    );

    const batch = rows || [];
    for (const tx of batch) {
      if (!tx) continue;
      const isDebit = FTC_DEBIT_TYPES.includes(tx.type);
      if (tx.status === 'confirmed') {
        balance = applyLedgerEntry(balance, tx);
      } else if (tx.status === 'pending' && isDebit) {
        balance -= tx.amount || 0;
      }
    }

    if (batch.length < PAGE_SIZE) { complete = true; break; }
  }

  return { balance, complete };
}
