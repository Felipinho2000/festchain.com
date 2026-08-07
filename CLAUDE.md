# CLAUDE.md — FestChain

Persistent hot-cache context for any Claude session (Claude Code, Base44 chat, or claude.ai) working on FestChain.

**Read this first. Do not treat old pilot assumptions as permanent product constraints.**

For deeper detail:
- Product identity / north star: `aboutFestChain.md`
- Decision history / known risks / fixes: `Memory.md`
- Current pilot scope: `MVP_SCOPE.md`

---

## Project Snapshot

FestChain is a **multi-device event operating + community platform** being built first in Brazil.

Core ecosystem:

**ticketing → access → event commerce → FestCoin → loyalty → organizer operations → DJs → Moments/social → discovery → analytics → progressive decentralization**

Current stage: **private pre-launch pilot**.

The pilot can start with smaller real events, but the product must **not** be architected around a 50–300-person ceiling. Core ticket, identity, permission, ledger, scan, and redemption flows should be designed toward **1,000+ attendees per event without architectural redesign**.

Do not claim FestChain is proven "1,000+ ready" until load/concurrency/failure testing demonstrates it. No such test exists yet.

---

## Device Strategy

FestChain is **not phone-only**.

- **Attendees:** mobile-first — discovery, tickets, QR access, FestCoin, purchases, rewards, social.
- **Organizers:** desktop-first + responsive — create/edit events, ticket phases, attendees, finance, operations, vendors, and analytics.
- **Staff/vendors:** mobile/tablet-first — scanning, validation, redemption, on-site workflows.

FestChain is **hardware-light**, not capability-light. Prefer ordinary phones, tablets, and computers without requiring proprietary RFID infrastructure. Optional hardware integrations can be added where useful.

Never solve an organizer workflow by forcing a desktop-level task into a phone UI.

---

## Product Principles

1. **Mainstream UX first**
   Lead with tickets, rewards, credits, perks, access, purchases, and community. Blockchain/Web3 can power infrastructure without forcing users to understand wallets, gas, NFTs, staking, or token mechanics.

2. **Reliability over feature count**
   Ticket ownership, payments, QR entry, redemption, permissions, and event operations outrank speculative social/Web3 additions.

3. **Fair event economics**
   Improve organizer and attendee economics through lower platform friction, loyalty, operational efficiency, transparent rewards/fees, and new revenue streams. Never position the product around avoiding legally required taxes or obligations.

4. **Community, not just transactions**
   The long-term moat is the connection between event identity, loyalty, commerce, DJs, organizers, attendees, and social/community activity.

5. **Accessible and bilingual by design**
   Responsive, understandable, accessible UX. Portuguese and English are product requirements, not an afterthought. Copy lives in `src/lib/i18n/translations.js`.

6. **Server-authoritative financial/ownership state**
   Tickets, ownership, balances, payments, payouts, cashback, and redemptions must never depend on client-side state as the source of truth.

---

## Current Implementation Stack

- Frontend: React 18 + Vite + Tailwind + shadcn/ui, React Router
- Backend: Base44-hosted Deno functions (`base44/functions/*/entry.ts`)
- Data / authorization: Base44 entities + RLS (`base44/entities/*.jsonc`)
- Payments: **Stripe Checkout on a single FestChain account** (card + Pix) with manual Pix payouts to organizers. **Not Stripe Connect** — see `aboutFestChain.md` § Payments.
- Event access: QR ticket validation + offline HMAC door manifest

**Important:** Base44 is the current implementation environment, not FestChain's permanent identity or architectural boundary. Prefer portable domain logic, clear interfaces, explicit data models, and minimal unnecessary platform coupling.

Do not introduce a migration/rewrite merely for architectural purity. Reliability and pilot readiness still come first.

### Base44 platform facts you must know before writing backend code

These are load-bearing and have already caused production bugs:

- `base44.asServiceRole.entities.X.create()` **ignores** an explicit `created_by_id` and stamps a
  `service_...` identity. Any user-owned record must be created with the **user-scoped** client
  (`base44.entities.X.create()`), which means entity RLS `create` rules are the real authorization
  boundary for ownership.
- `asServiceRole.entities.X.update()` does **not** change ownership. Server-side mutation of an
  existing user-owned record should use `asServiceRole` update.
- The money-path convention is therefore: **create `pending` user-scoped → confirm via
  `asServiceRole`.** A direct client-side create can only ever land as `pending` and never counts
  toward a spendable balance.
- `updateMany(filter, { $inc })` is the atomic counter primitive. Guarded forms
  (`updateMany({ id, field: { $gt: 0 } }, ...)`) have behaved inconsistently — always verify the
  effect with a read-back rather than trusting the returned count shape. See
  `redeemReward/entry.ts` and `validateTicket/entry.ts` for the accepted pattern.
- Functions run on Deno. Stripe signature verification must use `constructEventAsync`.

---

## Canonical Product Constraints

### Ticket phases
Default phased-release structure:

1. Early Bird
2. Phase 1
3. Phase 2
4. Last Ones

A phase closes when its **date window ends or its `quantity` sells out**, whichever is first.
Both conditions are enforced server-side in `createCheckoutSession`. Do not collapse all tickets
into a hardcoded `general` tier.

### Editable events
Organizers must be able to evolve an event after creation, including relevant:
descriptions/media; venue/visibility/capacity; ticket phases/pricing; DJs/lineup; schedule;
drinks/menu; merch; VIP/perks; vendors/staff; operational details.

All organizer event writes go through the `saveEvent` backend function. Entity-level `Event`
update/delete is admin-only by RLS — do not reintroduce direct client `Event.update()` calls.

### Organizer workspace
Treat organizer UX as a serious desktop workspace.

Likely domains include:
`Overview / Sales / Tickets / Attendees / Check-in / Lineup / Menu & Merch / Vendors & Staff / FestCoin / Finance / Analytics / Settings`

Do not build all future modules into the pilot simply because they belong in the long-term workspace.

### FestCoin
Near-term FTC is an economic + loyalty layer for rewards/cashback and event commerce such as drinks, merch, upgrades, VIP items, and perks.

The MVP uses internal digital credits with **no cash value**. Do not present universal token interoperability, staking, governance, or speculative appreciation as already implemented.

### Moments / social
Moments is an early social building block toward a party-culture social network.

Social growth must not outrank the core event loop during the pilot.

---

## Working Rules — Always Apply

1. **Audit first**
   Investigate current code/data read-only before changing behavior. Do not assume `Memory.md` historical issues are still open.

2. **Honor explicit implementation intent**
   If the user explicitly asked Claude to implement/fix the scoped task, the request itself is approval to make those scoped changes after the audit. Do not create unnecessary approval loops. For ambiguous/high-impact changes outside the requested scope, report before editing.

3. **Minimal-scope edits**
   Prefer targeted changes over unnecessary full-file rewrites.

4. **Batch read-only checks**
   Combine related inspections/tests where practical.

5. **Real-user impact first**
   Prioritize problems affecting paying attendees, organizers, entry, money, ownership, security, or on-site operations over cosmetic work.

6. **Separate status clearly**
   Every review/roadmap/prompt should distinguish: implemented + verified; implemented but unverified; pilot/MVP; planned; long-term vision.

7. **Do not invent completion**
   UI presence is not proof that backend enforcement, payment integrity, security, or scale works.

8. **Cost-conscious**
   Avoid unnecessary Base44/AI credit consumption. Batch investigation and make high-leverage changes.

9. **Regression-conscious**
   When modifying ticketing, payments, ownership, permissions, wallet, scan, or FTC logic, identify the adjacent regression paths before declaring completion.

10. **Concise completion reports**
    State what changed, what was verified, what remains, and stop.

---

## P0 / High-Risk Threads

**Verify current state before assuming any of these remain open.** As of the 2026-08-07 alignment
review, items 1, 3, 4 and 5 are addressed in code; item 2 and item 6 remain open.

### 1. Ghost-ticket integrity — ADDRESSED
`payment → persisted ticket → correct real-user owner → wallet visibility → QR → scanner validation → duplicate rejection`

Tickets are pre-created as `pending` with the user-scoped client (correct `created_by_id`) and
activated only by the verified Stripe webhook. A successful payment without a usable ticket at
entry is a release-blocking failure — keep it in regression coverage.

### 2. Payments production path — OPEN
Single-account collection with manual Pix payout. Stripe Connect, per-organizer KYC, automated
payout and reconciliation are **not built**. Confirm the historically exposed Stripe test secret
was rotated before any real-money event.

### 3. Real-user ownership — ADDRESSED
All user-owned write paths use the user-scoped client. Do not reintroduce `asServiceRole` creates
for user-owned records.

### 4. Private-event authorization — ADDRESSED
`Event` RLS read only exposes published+public events; private events are served by
`getEventDetails`, which gates on creator / admin / valid ticket holder.

### 5. Organizer authorization — ADDRESSED
`approved_organizer` is now enforced server-side in `saveEvent`; `Event` update/delete RLS is
admin-only; scanner authorization is per-event owner/admin in `validateTicket`.

### 6. Real-event scale validation — OPEN
Before claiming 1,000+ readiness, test burst check-in, multiple scanners, concurrent redemptions,
API/database contention, duplicate operations, poor connectivity, latency, monitoring/recovery.

---

## Known Historical Gotchas

- `created_by_id`: service-role writes produce `service_...` IDs instead of the real user's identity.
- `reserveTicket`: **hard-disabled**. It issued free `active` tickets with no payment. Superseded by `createCheckoutSession` + `stripeWebhook`. Do not re-enable without a server-side zero-price check.
- `Scan.jsx`: `getUserMedia()` and `Html5Qrcode.start()` require different constraint shapes.
- `pilot_topup` must stay present in wallet transaction display configuration.
- Seed/demo records must carry `organizer_id` and the `[DEMO]` marker.
- Stripe Checkout redirect origin must come from a validated `Origin`/`Referer` allowlist, never `req.url`.
- Checkout Session metadata does not propagate to the PaymentIntent — mirror it into `payment_intent_data.metadata` or refunds become unattributable.

See `Memory.md` for the full history, fixes, and verification notes.

---

## Do Not Drift Into These Old Assumptions

Do not describe or redesign FestChain as permanently:

- phone-only;
- a 50–300 attendee product;
- only for events too small for RFID;
- just another ticketing platform;
- only a cashless wallet;
- already a fully decentralized DAO;
- already using Stripe Connect;
- already NFT/on-chain (no chain integration exists in the codebase);
- dependent on users understanding crypto;
- permanently locked to Base44.

Small-event pilots are a validation strategy, not the final product boundary.

---

## Current Pilot Goal

Prove the real-event operating loop reliably:

**organizer creates/edits event → ticket is purchased → correct attendee owns it → attendee sees ticket/QR → staff validates entry exactly once → attendee can receive/use FTC → purchases/redemptions remain correct → organizer can see what happened**

Features outside this loop must justify why they are needed for pilot learning or reliability.

---

## Source-of-Truth Rule

When documents disagree:

1. `aboutFestChain.md` — current product identity, mission, principles.
2. `MVP_SCOPE.md` and other dedicated current specifications — detailed requirement for that domain.
3. `Memory.md` — decision/fix history and risks; verify old status against current code.
4. Older prompts, analyses, screenshots, or pilot notes — historical context only.

Never allow an older "phone-only / 50–300 attendees" note to override the current product direction.
