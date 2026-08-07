# FestChain

Multi-device event operating + community platform: ticketing → access → event commerce →
FestCoin → loyalty → organizer operations → analytics.

**Status: private pilot / pre-launch.** Nothing here should be marketed as proven at scale.

## Read these first

| File | What it is |
|---|---|
| `aboutFestChain.md` | Product identity, mission, principles. The north star. |
| `MVP_SCOPE.md` | Exactly what the private pilot includes, excludes, and must prove. |
| `CLAUDE.md` | Operating rules for any AI/dev session working on this repo. |
| `Memory.md` | Implementation findings, fixes, decisions, open risks. |

When documents disagree: `aboutFestChain.md` → `MVP_SCOPE.md` → `Memory.md` → everything else.

## Architecture at a glance

- **Frontend** — React 18 + Vite + Tailwind + shadcn/ui (`src/`)
- **Backend** — Base44-hosted Deno functions (`base44/functions/*/entry.ts`)
- **Data & authorization** — Base44 entities with RLS (`base44/entities/*.jsonc`)
- **Shared server logic** — `base44/shared/` (fee logic, FTC ledger, reward config)
- **Payments** — Stripe Checkout (card + Pix) on a single FestChain account, manual Pix payouts.
  **Not Stripe Connect.** See `aboutFestChain.md` § Payments.
- **Access control at the door** — QR validation + offline HMAC-signed door manifest

### Non-negotiable server rules

1. Ticket ownership, FTC balances, capacity, prices and permissions are **server-authoritative**.
   The browser is never the source of truth.
2. User-owned records are created with the **user-scoped** SDK (`base44.entities.X.create`) so
   `created_by_id` is the real user. `asServiceRole.create` stamps a `service_...` identity.
3. Money rows are created `pending` user-scoped, then confirmed with `asServiceRole`.
4. Events are written **only** through the `saveEvent` function. Entity-level `Event`
   update/delete is admin-only by RLS.
5. FTC balances come from `base44/shared/ftcLedger.ts`. Never re-sum the ledger inline.

## Local development

```bash
npm install
cp .env.example .env.local   # or create it
npm run dev
```

`.env.local`:

```
VITE_BASE44_APP_ID=<app id>
VITE_BASE44_APP_BASE_URL=<backend url>
```

Server-side secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DOOR_MANIFEST_SECRET`) live in
Base44 environment settings and must never appear in the repo or in client code.

```bash
npm run build    # production build
npm run lint     # eslint
```

Any change pushed to the repo is reflected in the Base44 Builder; publish from Base44.

## Before running a real event

Work through the release checklist in `MVP_SCOPE.md` § 28. The items still open are listed there
and in `Memory.md` § 21 — in particular real-device scanner testing, a two-scanner duplicate-scan
test, and a load test before any claim about 1,000+ attendees.
