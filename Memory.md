# FestChain — Decision, Fix & Current-State Log

> **Purpose:** Give any future Claude/ChatGPT/developer session fast context without turning old pilot assumptions into permanent product decisions.
>
> **Last alignment review:** 2026-08-07 (full repository audit + implementation round)
>
> **Source-of-truth rule:** `aboutFestChain.md` defines the current product identity and principles. This file records implementation findings, fixes, risks, and historical decisions. Before treating an old technical item as open, verify the current code.

---

## 1. Canonical product direction

FestChain is a **multi-device event operating + community platform** combining:

**ticketing → access → event commerce → FestCoin → loyalty → organizer operations → DJs → Moments/social → discovery → analytics → progressive decentralization**

FestChain should not be reduced to a ticketing website or a cashless wallet.

**Device strategy.** The old "phone-only" positioning is **superseded**. Attendees are mobile-first; organizers are desktop-first + responsive; staff/vendors are mobile/tablet-first. FestChain remains hardware-light — ordinary phones, tablets and computers, no mandatory RFID.

**Scale strategy.** The old "50–300 attendee ceiling" is **superseded**. Small events remain useful for validation, but the architecture must support **1,000+ attendees per event without redesign**. Do not market "1,000+ ready" until a load test establishes measurable limits. **No load test exists as of 2026-08-07.**

**Mainstream UX.** Lead with tickets, rewards, credits, perks, access, purchases, community. Do not force mainstream users to understand wallets, gas, NFTs, staking or token mechanics.

**Fair event economics.** Lower platform friction, stronger loyalty, faster operations, new revenue streams, transparent rewards and fees. Never position FestChain around avoiding legally required taxes or obligations.

**Reliability over feature count.** Entrance, bar, payment, ticket and redemption reliability outrank social and speculative Web3 features.

---

## 2. Core product rules

**Ticket phases** — Early Bird → Phase 1 → Phase 2 → Last Ones. A phase closes when its date window ends **or** its `quantity` sells out, whichever comes first. Both are enforced server-side.

**Editable events** — organizers can update descriptions/media, venue, visibility, capacity, phases, lineup, schedule, menu, merch, VIP items, perks and operational details, subject to integrity rules (capacity ≥ sold, refund policy frozen after first sale).

**Organizer workspace** — a first-class desktop surface, not a stretched attendee interface.

**FestCoin** — the economic + loyalty layer. Internal digital credits with **no cash value** during the pilot. Decentralised/tokenised utility only when legally, technically, economically and operationally justified.

**Social** — `Moments` is an early building block. Social must not outrank ticket/access/payment reliability during the pilot.

---

## 3. Current phase

**Status:** Private pilot / pre-launch.

### Do not present roadmap ideas as completed
- Stripe Connect / automated organizer payouts;
- pre-order + pickup QR;
- dedicated bar/vendor scan experience;
- advanced/predictive analytics;
- complete social network;
- DAO governance, staking, open resale marketplace;
- universal cross-event FestCoin interoperability;
- **NFT / on-chain ticketing — there is no blockchain integration in the codebase at all.**

---

## 4. Payments — actual implementation

### What is built
- **Stripe Checkout on a single FestChain account**, `payment_method_types: ['pix','card']` with an
  automatic card-only fallback when Pix is not enabled on the account.
- FestChain is the **merchant of record**. There is **no Stripe Connect**: no `transfer_data`, no
  `application_fee_amount`, no `on_behalf_of`, no connected accounts, no organizer KYC.
- Tickets are pre-created as `pending` (user-scoped, correct `created_by_id`) before the Stripe
  session, and activated only by `checkout.session.completed`.
- Webhook signature verification via `constructEventAsync`; idempotency via a first-ticket status
  check.
- Per-ticket fee snapshot: `fee_percentage_applied`, `platform_fee_cents`, `stripe_fee_cents`,
  `net_to_organizer_cents` (FestChain absorbs the Stripe processing fee out of its own cut).
- Organizer payouts are **manual Pix**: `OrganizerAccount.payout_pix_key`, `EventPayout`,
  `getOrganizerPayoutStatement`, `markPayoutPaid`.
- Refunds: `processRefund` + `charge.refunded`. Full refunds auto-process (ticket → `refunded`,
  FTC reward/cashback flipped to `cancelled`, capacity returned). **Partial refunds are logged and
  left for manual handling** — Stripe exposes a charge-level amount, not which ticket in a
  multi-ticket order was refunded.
- Redirect origin is validated against a host allowlist (open-redirect protection).
- Checkout metadata is mirrored into `payment_intent_data.metadata` so refunds stay attributable.
- Statement descriptor: `FESTCHAIN INGRESSOS`.

### Why the single-account model is a real risk, not just a shortcut
Being merchant of record means FestChain holds organizers' money between sale and payout. That
means chargeback liability sits with FestChain, gross ticket revenue looks like FestChain revenue
for tax purposes, and there is counterparty risk in both directions. It is defensible for a handful
of hand-picked pilot organizers. It is not defensible at scale. **Stripe Connect Express with
per-organizer KYC is the top post-pilot payments item.**

### Still open
- Confirm the historically exposed Stripe **test** secret key was rotated. Not verifiable from the
  repo — secrets are read from `Deno.env` / `secrets.get` and no key is hardcoded anywhere
  (verified by grep for `sk_test|sk_live|pk_live|whsec_`).
- Confirm whether the account is in test or live mode, and make the in-app disclaimer match.

---

## 5. Ghost ticket — RESOLVED BY CONSTRUCTION

`payment success → ticket persisted with correct owner → wallet query returns ticket → QR opens → scanner validates → duplicate scan rejected`

Tickets exist as `pending` rows owned by the real buyer *before* Stripe is called, and are flipped
to `active` by the verified webhook. There is no window where money is taken and no ticket row
exists. `expireOrphanedPurchase` cleans up an attempt that never reached Stripe.

Keep this in regression coverage whenever ticketing, wallet or payment code changes.

---

## 6. `created_by_id` misattribution — RESOLVED

`asServiceRole.entities.X.create()` ignores an explicit `created_by_id` and stamps `service_...`.
All user-owned writes use the user-scoped client. The money-path convention is **create `pending`
user-scoped → confirm via `asServiceRole`**, which also means entity RLS `create` rules are the
real ownership boundary.

---

## 7. `reserveTicket` — HARD-DISABLED

It issued `status: 'active'` tickets with a client-supplied `payment_method` and no Stripe call, so
any signed-in user could mint a free valid ticket for any published event. It now returns
`403 ticket_reservation_disabled`. Superseded by `createCheckoutSession` + `stripeWebhook`. Do not
re-enable without a server-side check that the real price for the requested tier is exactly zero.

---

## 8. Organizer authorization — FIXED 2026-08-07 (was P0)

**Finding.** `approved_organizer` was still cosmetic on the most important path. `Event` RLS
`create`/`update`/`delete` were `created_by_id = {{user.id}}`, and `Dashboard.jsx` gated the
organizer workspace on `!!currentUser`. Any signed-in account could therefore create **and
publish** a public, sellable event — collecting real money into FestChain's own Stripe balance,
with FestChain as merchant of record. Chargeback, fraud and reputational exposure.

**Fix.**
- New `base44/functions/saveEvent/entry.ts` is the only authorized event write path. It enforces
  `approved_organizer || admin`, event ownership, a field whitelist, phase sanitisation,
  capacity ≥ tickets already sold, a refund-policy freeze after the first sale, and refuses to
  delete an event with sales.
- `Event` RLS: `create` now requires `data.status = "draft"` (a draft is invisible to others and
  unsellable); `update`/`delete` are admin-only. Server writes go through `asServiceRole`, which
  does not disturb ownership.
- `Dashboard.jsx` gate now matches the scanner and `ModeSwitcher`:
  `role === "admin" || approved_organizer === true`.
- `EventEditor.jsx` and `Dashboard.jsx` call `saveEvent` instead of the entity directly.

**Verify before pilot.** Sign in as a non-admin approved organizer and confirm create/edit/publish
still work end to end; then sign in as an ordinary attendee and confirm `/dashboard` is blocked and
a direct `saveEvent` call returns `not_approved_organizer`.

---

## 9. Private-event authorization — VERIFIED OK

`Event` RLS `read` only exposes `published|live` + `public` events, the creator, and admins.
`getEventDetails` serves private events via the service role after checking creator / admin /
valid ticket holder, and strips `created_by` (organizer PII) from anonymous responses.
`getTicketDetails` gates on owner / event organizer / admin.

Shared public event links intentionally open without login; purchase still requires auth,
enforced in `createCheckoutSession`.

---

## 10. Duplicate check-in — FIXED 2026-08-07 (was P0)

**Finding.** `validateTicket` did read-status → write-used. Two door devices scanning the same QR
within the same moment both read `active` and both wrote `used`; both screens went green and two
people entered on one ticket.

**Fix.** Compare-and-set with a claim token: the function writes a fresh `crypto.randomUUID()` into
the new `Ticket.scan_claim_token` field (guarded by `status: 'active'`), then re-reads the row.
Only the scanner whose token survives reports `valid`; everyone else gets `used` with the winning
scan's timestamp and operator. The read-back is deliberate — guarded `updateMany` filters have
behaved inconsistently on this SDK (see the note in `stripeWebhook` about the refund decrement), so
correctness must not depend on the guard alone. The function also refuses to report success if the
`used`/`checked_in` state did not persist.

**Still to do.** A physical two-device simultaneous-scan test. Code-level reasoning is not proof.

---

## 11. Oversell under concurrency — FIXED 2026-08-07 (was P1)

**Finding.** `createCheckoutSession` checked capacity against `event.tickets_sold`, which is only
incremented by the webhook *after* payment. During a lote drop, N simultaneous buyers all cleared
the gate and all paid — overselling the room.

**Fix.** Available spots now subtract in-flight `pending` tickets (held seats), which are released
automatically by `checkout.session.expired` / `expireOrphanedPurchase`. This is a hold, not a leak.

---

## 12. Ticket phase inventory — FIXED 2026-08-07 (was P1, real revenue loss)

**Finding.** `Event.ticket_phases[].quantity` was collected in the editor — which literally tells
organizers *"os lotes avançam sozinho"* — but **never enforced anywhere**. Phases advanced by date
only. An Early Bird lote of 50 at R$30 kept selling at R$30 for the rest of its date window no
matter how many sold. Every ticket past the sold-out lote was money the organizer should have
earned at the next price.

**Fix.** `createCheckoutSession` now walks the date-open phases in order and picks the first whose
`quantity` is not exhausted (counting `active|used|pending` tickets in that phase, with a bounded
read capped at the phase quantity). `quantity <= 0` means "no per-phase cap". A phase-inventory read
failure fails closed on that phase rather than risking an oversell.

`getEventDetails` now resolves the same active phase and remaining spots **server-side** and
returns them, and `EventDetail.jsx` uses those values — so the price on the storefront is the price
that will be charged. Previously the browser computed the phase from the date window alone and the
buyer discovered the real price at checkout.

---

## 13. FestCoin ledger — FIXED 2026-08-07 (was P1)

**Finding.** Balance was recomputed inline in at least four places with
`FestCoinTransaction.filter({ created_by_id })` and no explicit limit, and `Wallet.jsx` summed only
the most recent **100** rows. Any user with more history than the underlying page size saw — and
could act on — a balance that was not the ledger. `EventDetail.jsx` additionally downloaded the
user's whole transaction table on a public page just to display a number.

**Fix.**
- New `base44/shared/ftcLedger.ts` with `getFtcBalance()` and
  `getFtcBalanceIncludingPendingDebits()`. One bounded read (`LEDGER_READ_CEILING = 5000`) that
  reports `complete: false` when the ceiling is hit — deliberately not offset paging, because a
  silently-ignored offset would double-count rows.
- New `getFtcBalance` function returns the caller's authoritative balance (user id from the
  session, never the body). `Wallet.jsx` and `EventDetail.jsx` now display that.
- `redeemEventItem` uses the helper, refuses to authorise a debit against an incomplete ledger
  (503), and re-checks *including other pending debits* before confirming — so two concurrent
  redemptions cannot both commit against the same stale balance.

**Known limit.** This is defensive, not a true transactional lock. A running-balance column with an
atomic `$inc` is the correct long-term design. Documented, not built — it is a schema change with
a backfill and it is not needed for pilot volumes.

---

## 14. Wallet transaction display — FIXED 2026-08-07 (was P2)

`txTypeConfig` had no `pilot_topup` entry and fell back to the **`earned`** config for unknown
types — a future debit type would have rendered green with a down-arrow and read as money received.
Added an explicit `pilot_topup` entry, a visibly neutral unknown-type fallback, and included
`pilot_topup` in the `isPositive` sign logic (pilot credits previously showed a minus sign).

---

## 15. Pilot applications — FIXED 2026-08-07 (was P1)

`PilotApplication` RLS is `create: {}` / `read: admin` — leads were saved and never readable in the
product. Added `src/components/pilot/PilotApplicationsPanel.jsx`, mounted in `/pilot-setup`
(admin-only): list with status counts and filters, applicant details and message, `mailto:` contact,
and one-click status transitions across `new → contacted → approved → rejected`.

---

## 16. Scanner — VERIFIED OK

The historical `getUserMedia()` vs `Html5Qrcode.start()` constraint-shape bug is fixed and still
correct: `Scan.jsx` uses `{ video: { facingMode: { ideal: 'environment' } } }` to probe permission,
stops the probe tracks, waits 150ms, then starts the scanner with the plain `{ facingMode:
'environment' }` shape. HTTPS is checked up front, and `NotAllowedError`, `NotFoundError`,
`NotReadableError` and `OverconstrainedError` all map to specific Portuguese guidance. A scan lock
prevents double-firing, manual code entry is available as a fallback, and there is an offline path
(HMAC door manifest with 24h expiry) plus conflict-reporting sync.

**Still to do.** Real-device testing on iOS Safari and Android Chrome.

---

## 17. Demo data — VERIFIED OK

`seedDemoData` is admin-only, prefixes everything `[DEMO]`, creates the event as
`visibility: private` so it never reaches public listings, tags tickets `ticket_phase: '[DEMO]'`,
sets `organizer_id`, and uses `source: 'demo_data'` on FTC rows. `Dashboard.jsx` excludes demo
tickets from KPIs and charts. The historical missing-`organizer_id` bug is fixed.

---

## 18. Landing / copy — MOSTLY OK, ONE ITEM OPEN

Unauthenticated users land on the marketing page at `/`; `/events` and `/events/:id` are public so a
shared link opens without an account. No "Public Beta" copy remains in `src`.

**Open.** `translations.js → beta.disclaimer` still reads *"No real payments, token purchases, or
financial value are enabled."* It appears to be unreferenced, but if live Stripe is ever enabled
while that string is rendered anywhere, it is a false statement to consumers. Audit it — and all
landing claims — before launch.

---

## 19. Repository hygiene — FIXED 2026-08-07

Deleted `_zipextract/` (ten stale duplicate copies of `Scan.jsx`, `EventEditor.jsx`, `Wallet.jsx`,
`translations.js`, several backend functions and more — a live hazard, since editing the wrong copy
looks like a change that silently does nothing) and the superseded `PILOT_AUDIT.md`. Replaced the
default Base44 boilerplate `README.md` with a real project README. Installed `aboutFestChain.md`,
`CLAUDE.md`, `MVP_SCOPE.md` and this file at the repo root.

`StakePosition` remains as an unused entity from the old token-economics direction — out of MVP
scope; harmless, but do not treat it as a shipped feature.

---

## 20. Scale and concurrency — PARTIALLY ADDRESSED, LOAD TEST STILL REQUIRED

Addressed: atomic `$inc` on `tickets_sold`; capacity accounting for in-flight checkouts; atomic
single-use check-in; optimistic stock lock on rewards; bounded phase-inventory reads; bounded
ledger reads; offline door manifest so the entrance survives venue connectivity loss.

Known remaining bottlenecks, in priority order:
1. **No running-balance column.** Every FTC spend reads the user's ledger. Fine at pilot volume,
   wrong shape at festival volume.
2. **`Dashboard.jsx` reads up to 500 tickets and aggregates in the browser.** Past ~1,000 attendees
   the organizer dashboard needs server-side aggregation.
3. **Pending-ticket counting reads up to 1,000 rows per checkout.** Correct, but O(n) on a hot path.
4. **`getDoorManifest` pulls up to 2,000 tickets** — hard ceiling on event size today.
5. **No rate limiting** on any function.
6. **`ftcTopup` daily-cap check** re-reads the user's top-up history per call.

Before any 1,000+ claim, test: burst check-in, simultaneous scanners, concurrent purchases,
concurrent redemptions, capacity contention, duplicate webhooks, degraded network, recovery.

---

## 21. Base44 dependency — classification

**Acceptable for the pilot:** hosting, auth, entity storage, function runtime, the file-upload
integration.

**Easy portability wins already in place:** business logic lives in `base44/shared/` (`feeLogic.ts`,
`ftcLedger.ts`, `rewardConfig.ts`) and in explicit functions rather than in components; the frontend
talks to named functions rather than to the database for anything that matters.

**Future migration concerns:** RLS rules encode real authorization and would need to be
re-expressed; `asServiceRole` semantics (create ignores `created_by_id`, update does not) are
Base44-specific and are load-bearing across the money paths; there is no local test harness, so
backend behaviour can only be verified in the hosted sandbox.

Do not start a migration now.

---

## 22. P0 verification checklist before a serious pilot

Do not infer these from UI appearance. Verify end to end:

- [ ] Exposed Stripe test secret confirmed rotated.
- [ ] Confirm test vs live Stripe mode, and make in-app copy match.
- [x] Paying user always receives a wallet-visible ticket.
- [x] Correct ticket phase/tier persists.
- [x] QR opens from the actual purchased ticket.
- [ ] Scanner works on real iOS + Android devices.
- [ ] Two devices scanning the same QR simultaneously: exactly one green.
- [x] Private event data is server-gated.
- [x] `approved_organizer` is backend-enforced.
- [ ] Non-admin approved organizer can still create/edit/publish (regression test for the RLS change).
- [x] Organizer can see and action pilot applications.
- [x] Production ownership fields use the real user identity.
- [x] Cashback/FTC ledger entries are correct and idempotent.
- [x] Demo data does not bypass or distort ownership/permissions.
- [x] Payment/webhook logic is idempotent.
- [ ] A documented load test exists before making any 1,000+ production claim.

---

## 23. Pilot verification round — 2026-08-07 (second pass)

An executable adversarial suite now lives in `pilot-verification/`. It loads the REAL
`base44/functions/**/entry.ts` sources (esbuild TS transform, mocked Base44 SDK + Stripe) and
runs them against an in-memory store with a cooperative scheduler that interleaves concurrent
handlers at every I/O point. `node pilot-verification/gates.mjs` — **121/123 checks pass**.
Run it before any change to ticketing, payments, wallet, scan or permissions.

### Empirically established this round
- **Stripe is in TEST MODE.** Only `acct_1TwklAHYnMyXnN0c` (livemode:false) is reachable and every
  session in the database is `cs_test_`. No real money has moved.
- **Guarded conditional writes ARE honoured.** Probed via the management API: a filtered update
  whose predicate does not match returns `updated: 0` and writes nothing; a matching one returns
  `updated: 1`. The `updateMany({id, status:'active'})` guard in `validateTicket` is therefore a
  real conditional write, not a no-op. (Caveat: probed through the management API, not the Deno
  SDK path.)
- **The Stripe webhook endpoint is correctly configured** — `checkout.session.completed`,
  `checkout.session.expired`, `charge.refunded`, enabled, pointed at the right URL, recreated
  2026-08-06.

### Defects found and fixed this round
1. **Stale seat holds stranded capacity permanently (P0 for the capacity change).** Live data had
   `pending` tickets from 2026-08-03 still holding seats on a 50-capacity event, with Stripe
   sessions no longer retrievable — so `checkout.session.expired` could never fire for them.
   Fixed with `base44/shared/ticketHolds.ts`: Checkout Sessions now carry an explicit 30-minute
   `expires_at`, `getEventDetails` ignores holds past the window, and `createCheckoutSession`
   actively sweeps them (releasing the ticket and cancelling its pending reward rows). Capacity no
   longer depends on webhook liveness.
2. **The sweeper opened a ghost-ticket path, which was then closed.** `stripeWebhook` only
   activated tickets in state exactly `pending`, so a payment landing after its hold was released
   would have been silently ignored — money taken, no ticket. It now activates an `expired` ticket
   on a confirmed payment and logs loudly that capacity may be exceeded. Stripe saying "paid"
   outranks our hold bookkeeping. Regression-tested end to end including the door scan.

### Known-open, accepted for a controlled pilot
**`createCheckoutSession` check-then-create is not atomic.** Measured: with the last seat
available, N buyers clicking inside one backend round-trip all succeed — oversell of N-1. The bound
is set by simultaneous clicks, not event size. A correct fix needs an atomic reservation counter
(`$inc` on an `Event.tickets_held` field, with matching decrements in the completed/expired/refunded
webhook paths). That is a money-path change with a new field and three new decrement sites, and the
stale-hold bug above is direct evidence that hold counters in this system leak. Deliberately NOT
shipped days before a first pilot. Operational mitigation: set `total_capacity` below the real room
limit by at least the expected peak simultaneous clicks.

### Measured architecture (round-trips per action, flat across 50 / 250 / 1000 attendees)
event page 3 · door scan 5 · wallet balance 1 · bar redemption 3 · checkout 7.
No N+1 and no per-attendee growth on any hot path. The scaling risk is rows-per-read, not
round-trips: `getFtcBalance` reads up to 5,000 ledger rows, hold counting up to 1,000, and
`getDoorManifest` up to 2,000 tickets — that last one is a hard ceiling on event size.

Manual, human-only verification lives in `PILOT_TEST_PROCEDURE.md`. Part C (two devices scanning
one QR simultaneously) is the single test that cannot be replaced by code.

---

## 24. Full re-audit — 2026-08-10

Whole-codebase sweep covering the surface the first two rounds never read: 16 backend functions,
all 22 entity RLS rules, and 29 frontend pages/components. New regression suite:
`node pilot-verification/gates-audit3.mjs` — 19/19. Prior suite still 121/123.

### Fixed (all verified by the new suite)
1. **P0 `syncOfflineScans` cross-event ticket burn.** The caller was authorized against `event_id`,
   but submitted ticket ids were never checked against it — organizer A could POST organizer B's
   ticket ids under their own event and burn them to `used`, so B's guests were refused at B's door.
   Mismatched tickets are now logged as conflicts and never written.
2. **P0 `feeLogic.recalculatePayoutForEvent` truncated payout basis.** The ticket read was limitless
   and therefore silently page-truncated; `markPayoutPaid` settles on that number. An 800-ticket
   event would have been underpaid ~87% and stamped `paid`. Now reads to an explicit ceiling and
   throws rather than settle a partial basis.
3. **P0 `redeemReward` double-spend + inline ledger.** Re-summed the newest 500 rows instead of
   using `shared/ftcLedger.ts`, and confirmed without re-checking. The client builds the
   idempotency key from `Date.now()`, so a double-click produces two different keys and the
   idempotency guard never fires. Now uses the shared helper, refuses on an incomplete ledger, and
   re-checks pending debits before confirming (with stock rollback).
4. **P0 `issueComplimentaryTickets` claim-code leak.** The idempotency replay returned the batch
   including `claim_codes` (literal admissible QR values) *before* the ownership check, against a
   guessable `comp-${event_id}-${Date.now()}` key. Ownership now runs first.
5. **P1 every `/organizer/*` route was gated on authentication only.** The Aug 7 round fixed
   `/dashboard` and missed the seven sibling routes; each page re-checked identity, not permission.
   New `src/components/OrganizerRoute.jsx` wraps them all. Also removed the dead duplicate
   `/festcoin` route that kept a page-limited balance view reachable.
6. **P1 door could not see meia-entrada.** Half-price is self-declared at checkout with no online
   eligibility evidence — which is fine in Brazil only because the document is checked at the door,
   and `validateTicket` never told the door which tier it was. Now returns `ticket_tier`,
   `requires_id_check`, buyer name and document last-4.
7. **P1 `Home.jsx` featured events.** Missing `visibility: 'public'`, so a private event could
   render as the hero and organizer emails rode in the payload.

### Corrected finding — read this before acting on an RLS report
Four entities (`RewardRedemption`, `EventRedemption`, `VenueOrder`, `RefundRequest`) key
authorization on `organizer_id`, which the client writes, and do not pin `status`/amount on create.
A subagent classified these as P0 self-service free rewards. **The exploit chain terminates**: the
read rule is keyed on the same client-written field, so a forged row naming the attacker as
organizer is invisible to the real organizer's validation screen (`ValidarRecompensa`,
`RedemptionManager`), and no staff surface will ever honour it. Real defects, genuine hygiene debt,
but not live money holes. Fixing them properly means routing those writes through functions and
making entity update admin-only — worth doing after the pilot, not days before it.

### Known-open, unchanged
- `createCheckoutSession` check-then-create oversell (bounded by simultaneous clicks; mitigate with
  a capacity buffer).
- `Moment` has `read: {}` while shipping an `is_anonymous` flag — all 7 live rows return the real
  `created_by` email. The anonymity promise is not kept. Needs a server-side reader, or drop the
  claim from the UI.
- Payout SLA "repasse em até 2 dias úteis" is published in seven places with no payout rail behind
  it. Business decision, not a code fix.
- `Legal.jsx` states no real payments are processed. True today (Stripe is in test mode); becomes
  false the moment live mode is enabled. Gate the mode switch on updating that copy.
- Comp tickets are created via `asServiceRole` and therefore owned by a service identity;
  recipients cannot see them in their own wallet.

---

## 25. Working rule for future AI sessions

1. Read `aboutFestChain.md` first, then `MVP_SCOPE.md`, then this file.
2. Verify current code before treating a historical item as still open.
3. Never reintroduce the superseded phone-only / 50–300 product definition, and never describe
   FestChain as already using Stripe Connect or already on-chain.
4. Separate **implemented**, **pilot**, **planned** and **long-term vision** in every review,
   prompt, roadmap or marketing claim.
5. Prioritise real-event reliability, security, ownership and financial correctness before
   expanding speculative features.
