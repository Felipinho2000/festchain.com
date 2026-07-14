# FestChain — Pilot Readiness Audit

**Date:** 2026-07-14  
**Auditor:** External (compiled by Base44 builder agent)  
**App:** FestChain (private MVP pilot)  
**Region:** BR (America/Sao_Paulo)

---

## 1. Acceptance Checklist

### 1a. Existing checklist (RECONSTRUCTED from `src/pages/PilotSetup.jsx`)

No standalone "Pilot Acceptance Checklist" document (PRD, spec, or wiki page) exists in the codebase. However, the app contains a **runtime readiness checker** at `/pilot-setup` (`src/pages/PilotSetup.jsx`) that encodes 20 acceptance checks. Below is the verbatim list of checks as they appear in the code, in execution order:

| # | Check Key | Label (as shown in UI) | Pass Condition | Detail Text (verbatim from code) |
|---|-----------|----------------------|----------------|----------------------------------|
| 1 | `adminUser` | Admin user exists | At least one User with `role === "admin"` | "At least one admin user exists" / "No admin user found" |
| 2 | `approvedOrganizer` | Approved organizer exists | At least one User with `approved_organizer === true` | "At least one approved organizer" / "Set approved_organizer=true on a User in Base44" |
| 3 | `publishedEvent` | Published / live event exists | At least one Event with `status` in `["published", "live"]` | "N published/live event(s)" / "Create & publish an event in the Dashboard" |
| 4 | `capacity` | Event capacity is set | At least one live event with `total_capacity > 0` | "Capacity set on at least one event" / "Set total_capacity on a live event" |
| 5 | `reserveTicket` | Ticket issuing function deployed | `reserveTicket` function reachable and returns expected error for invalid input | "reserveTicket function deployed" |
| 6 | `validateTicket` | Scanner validation function deployed | `validateTicket` function reachable and returns `invalid` or `error` for bad input | "validateTicket function deployed" |
| 7 | `scannerScoped` | Scanner scoped to event owner | `validateTicket` deployed (authorization logic is manual code-review only) | "validateTicket deployed — authorization logic restricts scanning to event owner/admin only (manual code review required)" |
| 8 | `rewardOwnership` | FestCoin reward created for ticket buyer | At least 1 `earned` FestCoinTransaction exists | "N earned FTC transaction(s) found — reward is being saved for ticket buyers" |
| 9 | `dashboardData` | Organizer dashboard data scoped correctly | Tickets have `organizer_id` populated | "Tickets have organizer_id set — dashboard queries are scoped correctly" |
| 10 | `noFrontendServiceRole` | No frontend service-role usage | Static check (always passes — code was refactored to remove frontend `asServiceRole`) | "EventMenuPanel uses user-scoped SDK only — no frontend asServiceRole (static check)" |
| 11 | `pilotLeads` | Contact form saves leads to database | `PilotApplication` entity is accessible | "PilotApplication entity ready — contact form saves leads to database" |
| 12 | `legalPage` | Legal / pilot disclaimer page exists | Static check (always passes) | "Legal / pilot disclaimer page exists at /legal" |
| 13 | `paymentsDisabled` | Payments manual for pilot | Static check (always passes) | "Payments are manual for pilot — no Stripe/Pix integration active" |
| 14 | `festcoinPilot` | FestCoin marked as pilot utility credit | Static check (always passes) | "FestCoin labeled as pilot utility credit — no cash value" |
| 15 | `privateEventRLS` | Private event RLS / visibility | Static check (always passes — manual code review required) | "Private events excluded from public reads via RLS — manual code review required" |
| 16 | `menuItemSecurity` | Menu item CRUD ownership security | `createMenuItem` function deployed and returns error for unauthorized access | "createMenuItem deployed — ownership verified server-side" |
| 17 | `redemptionManagement` | Redemption management for organizers | `EventRedemption` entity accessible | "EventRedemption entity ready — organizer redemption panel available in Dashboard" |
| 18 | `backupGuestList` | Backup guest list available | Static check (always passes) | "Guest list with CSV export available in Scanner page" |
| 19 | `topupAdminOnly` | Self top-up disabled or admin-only | Static check (always passes) | "PilotTopup create is admin-only — partygoers cannot self-top-up" |
| 20 | `publicSiteClean` | Public site metadata fixed | Static check (always passes) | "Landing page copy is pilot-focused — no crypto/NFT/DAO/staking in main flow" |

### 1b. Additional implicit requirements (RECONSTRUCTED from code comments and function logic)

These are "must work before pilot" constraints found in backend function comments but NOT represented in the PilotSetup checklist:

- **R1:** Ticket QR codes must be generated server-side only (`reserveTicket` line 56: `crypto.randomUUID()`) — never client-generated.
- **R2:** Only the event creator or admin can scan tickets (`validateTicket` line 28: `!isAdmin && !isEventOwner → 403`). Approved organizers who did not create the event CANNOT scan for it.
- **R3:** One active ticket per user per event — duplicates prevented (`reserveTicket` line 48-53).
- **R4:** Ticket phases: only the active phase within its sales window is buyable (`reserveTicket` lines 34-45).
- **R5:** FestCoin reward amount is server-controlled — client cannot forge `earned` transactions (`createMoment` line 6: `const MOMENT_REWARD = 10` hardcoded; `reserveTicket` line 57 reads from event/phase config).
- **R6:** FTC balance is computed server-side from transaction history — never stored as a mutable field (`pilotTopup`, `redeemEventItem`, `sendMomentTip` all recalculate from `FestCoinTransaction.filter`).
- **R7:** Pilot top-up is admin-only with a daily limit of 1000 FTC/day, max 500 per call (`pilotTopup` lines 19, 28).
- **R8:** Redemption requires an active ticket for the event (`redeemEventItem` lines 30-33).
- **R9:** Self-tipping is prevented (`sendMomentTip` line 28).
- **R10:** Private events are invisible to non-ticket-holders (`getEventDetails` lines 21-46).

---

## 2. Entity Permissions & Validation Rules

All entities are in `base44/entities/*.jsonc`. RLS rules are defined in the `"rls"` key of each schema. Below is every entity with its create/read/update/delete rules per role.

### Event
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) |
| **read** | Public+published, OR public+live, OR created by user, OR admin |
| **update** | Created by user, OR admin |
| **delete** | Created by user, OR admin |

### Ticket
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) — but `reserveTicket` function is the real gateway |
| **read** | Ticket owner (`created_by_id`), OR event organizer (`organizer_id`), OR admin |
| **update** | **Admin only** |
| **delete** | **Admin only** |

### User
| Operation | Rule |
|-----------|------|
| **create** | Cannot be created via API — users join via invite only (`base44.users.inviteUser`) |
| **read** | Built-in: users see themselves; admins see all |
| **update** | Built-in: users update self; admins update all |
| **delete** | Built-in: admins only |

Custom fields on User: `role` (enum: admin, user, attendee, organizer, staff, guest; default: attendee), `active_mode` (partygoer/organizer — UI preference only, no permissions), `approved_organizer` (boolean, admin-granted, gates dashboard/scanner access), `organizer_profile` (object: organizer_name, brand_name, instagram, city).

### FestCoinTransaction
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) — but functions use `asServiceRole` for trusted creates |
| **read** | Owner (`created_by_id`), OR admin |
| **update** | **Admin only** |
| **delete** | **Admin only** |

### PilotApplication
| Operation | Rule |
|-----------|------|
| **create** | **Open to anyone** (no auth required — `{}`) — public contact form on landing page |
| **read** | **Admin only** |
| **update** | **Admin only** |
| **delete** | **Admin only** |

### PilotTopup
| Operation | Rule |
|-----------|------|
| **create** | **Admin only** (`user_condition: role = admin`) |
| **read** | Owner (`created_by_id`), OR admin |
| **update** | **Admin only** |
| **delete** | **Admin only** |

### StakePosition
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) |
| **read** | Owner (`created_by_id`), OR admin |
| **update** | Owner (`created_by_id`), OR admin |
| **delete** | **Admin only** |

### VenueOrder
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) |
| **read** | Owner (`created_by_id`), OR event organizer (`organizer_id`), OR admin |
| **update** | Owner (`created_by_id`), OR event organizer (`organizer_id`), OR admin |
| **delete** | **Admin only** |

### VenueMenuItem
| Operation | Rule |
|-----------|------|
| **create** | **Admin only** (`user_condition: role = admin`) — but `createMenuItem` function adds ownership check (event owner OR admin) |
| **read** | **Public** (anyone, no auth — `{}`) |
| **update** | **Admin only** — but `updateMenuItem` function adds ownership check |
| **delete** | **Admin only** — but `deleteMenuItem` function adds ownership check |

**Note:** There is a discrepancy: the entity RLS restricts create/update/delete to admin-only, but the backend functions (`createMenuItem`, `updateMenuItem`, `deleteMenuItem`) allow the event owner to perform these operations by using `asServiceRole`. This means the function-layer security is MORE permissive than the entity RLS — a non-admin event owner can manage menu items only through the function endpoints, not through direct entity API calls.

### EventRedemption
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) |
| **read** | Owner (`created_by_id`), OR event organizer (`organizer_id`), OR admin |
| **update** | Owner (`created_by_id`), OR event organizer (`organizer_id`), OR admin |
| **delete** | **Admin only** |

### Moment
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) — but `createMoment` function uses `asServiceRole` |
| **read** | **Public** (anyone, no auth — `{}`) |
| **update** | Owner (`created_by_id`), OR admin |
| **delete** | Owner (`created_by_id`), OR admin |

### FTCTip
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) |
| **read** | Sender (`from_user_id`), OR recipient (`to_user_id`), OR admin |
| **update** | **Admin only** |
| **delete** | **Admin only** |

### UserBadge
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) — but `createMoment` function creates badges via `asServiceRole` |
| **read** | Owner (`created_by_id`), OR admin |
| **update** | **Admin only** |
| **delete** | **Admin only** |

### FriendRequest
| Operation | Rule |
|-----------|------|
| **create** | Any authenticated user (`created_by_id = {{user.id}}`) |
| **read** | Sender (`from_user_id`), OR recipient (`to_user_id`), OR admin |
| **update** | **Recipient only** (`to_user_id = {{user.id}}`), OR admin — used for accept/decline |
| **delete** | Sender (`from_user_id`), OR recipient (`to_user_id`), OR admin |

---

## 3. Function-Level Contracts

All 12 functions are in `base44/functions/{name}/entry.ts`. All use `createClientFromRequest` from `npm:@base44/sdk@0.8.31`.

### reserveTicket
- **Auth:** Authenticated user required (`base44.auth.me()` → 401 if not)
- **Input:** `{ event_id: string, payment_method?: "pix"|"credit_card"|"festcoin"|"test" }` (defaults to `"test"`)
- **Business rules:**
  1. Event must exist and have `status` in `["published", "live"]`
  2. `tickets_sold < total_capacity` (capacity check)
  3. If `ticket_phases` configured: must find an active phase within its `sales_start`/`sales_end` window. If none active → error "Tickets are not on sale yet"
  4. One active ticket per user per event (dedup check via `Ticket.filter({ event_id, created_by_id, status: "active" })`)
  5. QR code generated server-side: `FC-${crypto.randomUUID()}`
  6. Price = active phase price, or `event.ticket_price` if no phases
  7. FestCoin reward = phase `festcoin_reward` → event `festcoin_reward` → 0
  8. Ticket created as user-scoped (`base44.entities.Ticket.create`, not service-role)
  9. `tickets_sold` incremented on Event via `asServiceRole`
  10. FestCoin reward transaction created via `asServiceRole` (type: `earned`, status: `confirmed`)
- **Output (success):** `{ status: "success", message: "Ticket issued", ticket: { id, qr_code, event_title, event_date, event_location, festcoin_earned, ticket_phase } }`
- **Output (error):** `{ status: "error", message: string }` with appropriate HTTP status
- **No real payment processing** — `payment_method` is stored but no payment gateway is called

### validateTicket
- **Auth:** Authenticated user required
- **Input:** `{ qr_code: string, event_id: string }`
- **Business rules:**
  1. Scanner must be admin OR the event creator (`event.created_by_id === user.id`). **Approved organizers who didn't create the event are rejected with 403.**
  2. Ticket found by `qr_code` (service-role query)
  3. Ticket must belong to the selected event (`ticket.event_id === event_id`)
  4. Attendee info resolved from `User.get(ticket.created_by_id)`
  5. If already used (`status === "used"` or `checked_in === true`): returns `used` status with previous scan info (who scanned, when)
  6. If valid: marks ticket as `status: "used"`, `checked_in: true`, `checked_in_at`, `scanned_at`, `scanned_by` (scanner's user ID) — all via `asServiceRole`
- **Output (valid):** `{ status: "valid", message: "Entry approved", ticket: { event_title, event_date, event_location }, attendee: { full_name, email }, scanned_at }`
- **Output (used):** `{ status: "used", message: "...", ticket: {...}, attendee, previous_scan: { at, by, by_label } }`
- **Output (invalid/unauthorized/error):** `{ status: "invalid"|"unauthorized"|"error", message: string }`

### pilotTopup
- **Auth:** Admin only (`user.role !== "admin"` → 403)
- **Input:** `{ amount?: number }` (defaults to 100, clamped to 1–500)
- **Business rules:**
  1. Daily limit: 1000 FTC per admin per day
  2. Amount clamped to `min(500, max(1, requested))` and further clamped by daily remaining
  3. Balance computed from all FestCoinTransactions for the user (excluding `cancelled`/`failed` statuses)
  4. Creates `FestCoinTransaction` (type: `earned`, source: `pilot_beta`, status: `confirmed`) via `asServiceRole`
  5. Creates `PilotTopup` record via `asServiceRole` (bypasses admin-only create RLS)
- **Output (success):** `{ status: "success", added: number, balance_after: number, daily_remaining: number }`
- **FestCoin conversion rate:** None — FestCoin is a pilot utility credit with no BRL/USD conversion. 1 FTC = 1 FTC.

### redeemEventItem
- **Auth:** Authenticated user required
- **Input:** `{ event_id: string, menu_item_id: string }`
- **Business rules:**
  1. Event must exist (service-role)
  2. Menu item must exist, belong to the event, and `is_available === true`
  3. User must have an active ticket for the event (`Ticket.filter({ created_by_id, event_id, status: "active" })`)
  4. Balance computed from all FestCoinTransactions (excluding cancelled/failed)
  5. If `currentBalance < item.price_ftc` → error with current balance and cost
  6. Deducts FTC: creates `FestCoinTransaction` (type: `spent`, status: `confirmed`) — user-scoped create
  7. Creates `EventRedemption` with `organizer_id` so organizer sees it in dashboard
  8. Redemption code: `RDM-{timestamp_base36}-{random}` — generated server-side
  9. Stock decremented if `item.stock > 0` (service-role update)
- **Output (success):** `{ status: "success", redemption_code, redemption_id, item_name, ftc_deducted, balance_after }`
- **No double-redemption prevention:** The function does NOT check if the user already redeemed the same item. A user can redeem the same menu item multiple times as long as they have sufficient FTC balance.

### sendMomentTip
- **Auth:** Authenticated user required
- **Input:** `{ moment_id: string, amount: number }`
- **Business rules:**
  1. Amount must be a positive integer (`Number.isInteger(amount) && amount >= 1`)
  2. Moment must exist (service-role)
  3. Self-tipping prevented (`moment.created_by_id === user.id` → 400)
  4. Sender balance computed server-side from all FestCoinTransactions
  5. If `balance < amount` → error
  6. Debits sender: `FestCoinTransaction` (type: `transferred_out`, status: `confirmed`) via `asServiceRole`
  7. Records tip: `FTCTip` via `asServiceRole`
  8. Increments `moment.festcoin_tips` via `asServiceRole`
  9. **Recipient does NOT receive a corresponding `transferred_in` transaction** — the debit is recorded but the credit to the recipient's balance is not created. This means tipped FTC is debited from the sender but never credited to the moment author's balance.
- **Output (success):** `{ status: "success", amount, balance_after }`

### createMoment
- **Auth:** Authenticated user required
- **Input:** `{ image_url: string, caption?: string, is_anonymous?: boolean, author_alias?: string }`
- **Business rules:**
  1. `image_url` required
  2. `author_alias` defaults to `user.full_name` or `"User"`
  3. `is_anonymous` defaults to `true`
  4. Moment created via `asServiceRole` with `created_by_id` set explicitly
  5. Fixed reward: 10 FTC (`MOMENT_REWARD = 10` hardcoded) — `FestCoinTransaction` type `earned`, source `moment_reward`, status `confirmed` via `asServiceRole`
  6. First-moment badge: checks if `UserBadge` with `badge_key: "first_moment"` exists for user; if not, creates one (badge_name: "Moment Maker", emoji: 📸)
- **Output (success):** `{ status: "success", moment, reward: 10 }`

### createMenuItem
- **Auth:** Authenticated user required; must be event owner OR admin
- **Input:** `{ event_id, name, description?, category?, price_ftc?, price_brl?, image_url?, emoji?, stock?, is_available? }`
- **Business rules:**
  1. `event_id` and `name` required
  2. Event must exist (service-role)
  3. Caller must be admin OR `event.created_by_id === user.id`
  4. Item created via `asServiceRole` with `event_title` from event
- **Output:** The created `VenueMenuItem` object

### updateMenuItem
- **Auth:** Authenticated user required; must be event owner OR admin
- **Input:** `{ id: string, ...updates }`
- **Business rules:**
  1. Item must exist (service-role)
  2. Event must exist (resolved from `item.event_id`)
  3. Caller must be admin OR event owner
  4. Updates applied via `asServiceRole` — **no field whitelist**: any field in `updates` is written directly to the entity
- **Output:** The updated `VenueMenuItem` object

### deleteMenuItem
- **Auth:** Authenticated user required; must be event owner OR admin
- **Input:** `{ id: string }`
- **Business rules:**
  1. Item must exist (service-role)
  2. Event must exist (resolved from `item.event_id`)
  3. Caller must be admin OR event owner
  4. Item deleted via `asServiceRole`
- **Output:** `{ status: "success" }`

### getTicketDetails
- **Auth:** Authenticated user required
- **Input:** `{ ticket_id: string }`
- **Business rules:**
  1. Ticket loaded via `asServiceRole` (bypasses Ticket RLS)
  2. Access control: ticket owner (`created_by_id`), OR event organizer (`organizer_id`), OR admin
  3. Linked event loaded via `asServiceRole` (works for private events)
  4. Available perks (menu items) loaded via `asServiceRole` for the ticket's event
- **Output:** `{ status: "success", ticket: { ...full ticket fields }, event: { ...full event fields }, perks: [ { id, name, emoji, price_ftc, category, description } ] }`

### getEventDetails
- **Auth:** Authenticated user required
- **Input:** `{ event_id: string }`
- **Business rules:**
  1. Event loaded via `asServiceRole` (bypasses Event RLS — works for private events)
  2. Access granted if ANY: event is public+published/live, OR user is creator, OR user is admin, OR user has a valid ticket (active or used) for the event
  3. If access denied: returns `{ status: "denied", http_status: 403, message: "This is a private event..." }` (HTTP 200 — app-level denial so frontend renders a private gate)
- **Output:** `{ status: "success", event }` or `{ status: "denied", ... }`

### seedDemoData
- **Auth:** Admin only (`user.role !== "admin"` → 403)
- **Input:** `{}` (no parameters)
- **Business rules:**
  1. Creates 1 event titled `[DEMO] Sunrise Pilot Night` (genre: techno, capacity: 100, price: 40, reward: 50, status: published, date: +7 days)
  2. Creates 3 tickets (all under the admin user, QR: `FC-DEMO-{event_id}-{timestamp}-{i}-{random}`)
  3. Creates 3 FestCoinTransactions (type: earned, amount: 50, description: `[DEMO] Pilot reward: ...`)
  4. Sets `tickets_sold = 3` on the event
  5. **Known bug:** The FestCoinTransaction creates (line 43-48) do NOT set `created_by_id` or `status`, so those transactions may not be attributable to any user's wallet and have `undefined` status.
- **Output:** `{ status: "success", message: "Demo data created", event_id }`

---

## 4. Environment / Secrets Checklist

### Frontend environment variables (required for local dev, per README.md)
| Name | Status | Purpose |
|------|--------|---------|
| `VITE_BASE44_APP_ID` | **Required** — value exists in the deployed app (configured by platform) | App identifier for SDK |
| `VITE_BASE44_APP_BASE_URL` | **Required** — value exists in the deployed app | Backend API base URL |

### Backend secrets
| Name | Status | Purpose |
|------|--------|---------|
| *(none)* | — | All 12 backend functions use only `createClientFromRequest(req)` — no `Deno.env.get()` calls to any external service. `BASE44_APP_ID` is pre-populated by platform. |

### Third-party integrations
| Integration | Status | Notes |
|-------------|--------|-------|
| **Stripe** | **Not configured** | `@stripe/react-stripe-js` and `@stripe/stripe-js` are installed as npm dependencies, but NO Stripe backend function exists, NO Stripe API keys are set, and the PilotSetup page confirms: "Payments are manual for pilot — no Stripe/Pix integration active" |
| **OAuth connectors** | **None authorized** | No app connectors authorized, no workspace connectors registered |
| **Webhook secrets** | **None needed** | No webhook endpoints, no connector automations, no scheduled automations configured |
| **Email (SendEmail)** | Available via built-in `Core.SendEmail` integration | Used in landing page contact form — no additional secrets needed |

### Summary
- **Configured:** `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` (platform-managed)
- **Missing but not needed for pilot:** Stripe keys (payments intentionally manual)
- **Missing and not applicable:** No external API keys, no webhook secrets, no OAuth tokens

---

## 5. Seed / Demo Data

### 5a. seedDemoData function output
The `seedDemoData` function creates (admin-triggered via PilotSetup page):
- 1 event: `[DEMO] Sunrise Pilot Night` (techno, São Paulo, capacity 100, ticket_price 40, festcoin_reward 50, date = +7 days)
- 3 tickets (QR format: `FC-DEMO-{event_id}-{timestamp}-{i}-{random}`, all `status: active`, `festcoin_earned: 50`, all attributed to the admin user)
- 3 FestCoinTransactions (type: earned, amount: 50, description: `[DEMO] Pilot reward: ...`) — **NOTE: these do NOT set `created_by_id` or `status`, see Known Issues**

### 5b. Current live database state (queried 2026-07-14)

**Users (10 total):**

| Email | Full Name | Role | Approved Organizer | Active Mode | Created |
|-------|-----------|------|-------------------|-------------|---------|
| feelipe.oliveeira.fo@gmail.com | Felipe Oliveira | admin | — | organizer | 2026-06-22 |
| stephanisaramiler@gmail.com | stephanisaramiler | admin | — | — | 2026-06-23 |
| feelipe.oliveeira@hotmail.com | feelipe.oliveeira | user | — | organizer | 2026-06-24 |
| anab.salles@gmail.com | Ana de Salles Roselino | user | — | — | 2026-06-25 |
| bassetto0203@gmail.com | Gabriel Bassetto | user | — | — | 2026-06-25 |
| piacentinoannachiara@gmail.com | piacentinoannachiara | user | — | — | 2026-06-26 |
| hsanbendhrif0@gmail.com | hsanbendhrif0 | user | — | — | 2026-06-26 |
| karamokoyoussouf650@gmail.com | Karamoko Youssouf | user | — | — | 2026-07-03 |
| joaoppbom@gmail.com | Joao Vitor Paladin Pedro Bom | user | — | — | 2026-07-04 |
| stephanimiler2000@gmail.com | stephanimiler2000 | user | **true** | partygoer | 2026-07-08 |

**Test accounts per role:**
- **Admin:** `feelipe.oliveeira.fo@gmail.com` or `stephanisaramiler@gmail.com` — credentials not accessible via API (passwords are hashed and not exposed). Login via the app's `/login` page or Base44 dashboard.
- **Approved organizer:** `stephanimiler2000@gmail.com` (role: user, `approved_organizer: true`) — can access dashboard and scanner.
- **Attendee (regular user):** Any of the other 7 users with `role: user` and `approved_organizer` not set (e.g., `anab.salles@gmail.com`, `bassetto0203@gmail.com`).
- **Venue staff / door scanner:** Same as approved organizer — the scanner checks `role === "admin" || approved_organizer === true`. There is no separate "staff" role in practice; the User entity has a `staff` role enum value but no user has it assigned.

**Events (5 total):**

| Title | Status | Date | Tickets Sold | Capacity | Price | FTC Reward |
|-------|--------|------|---------------|----------|-------|------------|
| Testing | published | 2027-02-20 | 1 | 250 | 50 | 50 |
| [DEMO] Sunrise Pilot Night | published | 2026-07-01 (past) | 3 | 100 | 40 | 50 |
| Funk do Bem | published | 2025-10-05 (past) | 1,890 | 3,000 | 45 | 35 |
| Trance Dimensions | published | 2025-11-15 (past) | 680 | 1,500 | 120 | 80 |
| Rooftop Sessions | published | 2025-08-22 (past) | 157 | 200 | 95 | 55 |

**Tickets:** 16 total (13 active, 3 used)

**FestCoin Transactions:** 28 total
- By type: earned (20), spent (5), transferred_out (2), staked (1)
- By status: confirmed (7), **undefined (21)** — see Known Issues

**Other entities:**
- PilotApplications: 2
- PilotTopups: 2
- VenueMenuItems: at least 2 (e.g., "Heineken (LONG NECK)" at 44 FTC, "HEINEKEN" at 4 FTC)
- EventRedemptions: (see truncated output — not fully counted)
- VenueOrders: 0
- Moments: (see truncated output)
- FTCTips: (see truncated output)
- UserBadges: (see truncated output)
- StakePositions: 0
- FriendRequests: 0

---

## 6. Known Issues Log

### Critical
1. **sendMomentTip does not credit the recipient** — FTC is debited from the sender (`transferred_out`) but no corresponding `transferred_in` transaction is created for the moment author. Tipped coins are effectively burned, not transferred. (Function code lines 50-69.)

2. **seedDemoData creates orphan FestCoinTransactions** — The 3 FTC transactions created by `seedDemoData` (lines 43-48) do not set `created_by_id` or `status`. This results in transactions with `undefined` status that are not attributable to any user's wallet. 21 of 28 transactions in the database currently have undefined status.

3. **redeemEventItem has no double-redemption prevention** — A user can redeem the same menu item multiple times. There is no check for existing pending/redeemed redemptions of the same item by the same user.

### High
4. **Scanner camera constraint bug** — **FIXED (2026-07-13/14).** Root cause: `Html5Qrcode.start()` was receiving a `MediaStreamConstraints`-shaped object (`{ video: { facingMode: { ideal: "environment" } } }`) when it expects `{ facingMode: "environment" }` (string shorthand). This caused html5-qrcode to throw a plain string (not a DOMException), so `err.name` was always empty and only the generic fallback error message showed on every device. Fix: probe with standard `getUserMedia` first, then pass `{ facingMode: "environment" }` to `Html5Qrcode.start()`.

5. **Inappropriate test data** — One ticket in the database has event_title "Eat Anna's ass" (ticket ID `6a4c3c1fb50f4e5bd6c9baf7`). This should be deleted before any investor demo.

6. **Past-dated events** — 3 of 5 events have dates in the past (Aug–Nov 2025) relative to the current date (July 2026). These should be either updated with future dates or archived before the pilot launch, as they will appear as "past events" in the UI.

### Medium
7. **VenueMenuItem RLS vs function-layer discrepancy** — Entity RLS restricts create/update/delete to admin-only, but the backend functions (`createMenuItem`, `updateMenuItem`, `deleteMenuItem`) allow non-admin event owners to manage items by using `asServiceRole`. This is intentional (the functions add ownership checks), but direct entity API calls from the frontend would fail for non-admins while function calls succeed — a potential source of confusion.

8. **updateMenuItem has no field whitelist** — The function passes `...updates` directly to the entity update without filtering allowed fields. A malicious client could send unexpected fields.

9. **StakePosition and FriendRequest entities are dormant** — Both have 0 records and are not referenced in any active user flow or backend function. StakePosition still has a `staked` transaction type referenced in FestCoinTransaction logic, but no function creates staking positions.

10. **VenueOrder entity is unused** — 0 records. The `redeemEventItem` function creates `EventRedemption` records, not `VenueOrder` records. VenueOrder may be intended for a future batch-ordering feature.

### Low
11. **No automated tests** — No test framework, no test files, no test scripts. See section 7.

12. **No automations configured** — No scheduled tasks, no entity triggers, no connector webhooks. All operations are user-initiated.

13. **Stripe dependencies installed but unused** — `@stripe/react-stripe-js` and `@stripe/stripe-js` are in package.json but not imported or used anywhere in the codebase. Dead dependencies.

14. **SDK version mismatch** — Backend functions import `npm:@base44/sdk@0.8.31` while package.json specifies `^0.8.38`. Minor but could cause drift.

15. **FestCoin balance calculation is O(n)** — Every FTC operation (topup, redeem, tip) fetches ALL transactions for the user and sums them. This works for pilot scale but will not scale to production volumes.

---

## 7. Test Coverage

### Status: **No automated tests exist.**

**Evidence:**
- `package.json` scripts: `dev`, `build`, `lint`, `lint:fix`, `typecheck`, `preview` — **no `test` script**
- No test framework installed (no jest, vitest, mocha, playwright, or testing-library in dependencies)
- No test files found (no `*.test.*`, `*.spec.*`, or `__tests__/` directories)
- No CI/CD test pipeline configured

**What exists instead:**
- `src/pages/PilotSetup.jsx` — a runtime readiness checker that performs 20 live checks against the database and backend functions. This is a manual, admin-triggered smoke test, not an automated test suite.
- `npm run lint` (ESLint) and `npm run typecheck` (TypeScript) — static analysis only, no behavioral tests.

**Recommendation (NEWLY CREATED):**
For a pilot launch, at minimum these automated tests should be created:
1. **`reserveTicket`** — test capacity enforcement, duplicate prevention, phase window logic
2. **`validateTicket`** — test valid/used/invalid/unauthorized states, cross-event ticket rejection
3. **`redeemEventItem`** — test balance check, insufficient funds, no-ticket rejection
4. **`sendMomentTip`** — test self-tip prevention, insufficient balance, **and verify the recipient-credit bug**
5. **`pilotTopup`** — test daily limit enforcement, admin-only auth

---

## Audit Summary

| Category | Status |
|----------|--------|
| Acceptance checklist | Exists as runtime checker in PilotSetup.jsx (20 checks). No formal document. |
| Entity RLS | Defined on all 14 entities. One discrepancy (VenueMenuItem function-layer vs entity-layer). |
| Backend functions | 12 functions, all with auth + business logic. 2 critical bugs found (tip recipient credit, seedDemoData orphan transactions). |
| Environment/secrets | Minimal — only platform-managed VITE vars. No external secrets needed. Stripe not configured (intentional). |
| Seed/demo data | 1 DEMO event + 3 tickets via seedDemoData. 10 users, 5 events, 16 tickets in DB. Test accounts exist but passwords not accessible. |
| Known issues | 15 issues logged (2 critical, 3 high, 4 medium, 6 low). Camera bug fixed this session. |
| Test coverage | **None.** Zero automated tests. PilotSetup.jsx is a manual smoke test only. |

---

*This audit was compiled by reading all source files, entity schemas, backend function code, and querying the live database. It reflects the state of the app as of 2026-07-14.*