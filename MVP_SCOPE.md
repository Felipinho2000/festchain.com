# MVP_SCOPE.md — FestChain Private Pilot

> **Purpose:** Define exactly what FestChain must include for the current private pilot, what is optional, and what must wait.
>
> **Status:** Canonical MVP scope
>
> **Last aligned:** 2026-08-07
>
> Read together with:
> - `aboutFestChain.md` — product identity and north star
> - `CLAUDE.md` — AI/development operating rules
> - `Memory.md` — historical findings, fixes, and risks
>
> Section 33 at the end of this file records the implementation status of every core system as of
> the 2026-08-07 alignment review. Update it whenever a checklist item changes state.

---

# 1. MVP Objective

The FestChain MVP exists to prove one thing:

> **FestChain can reliably operate the core lifecycle of a real event for organizers, attendees, and staff.**

The MVP is not intended to prove the full long-term social, Web3, DAO, analytics, or marketplace vision.

The private pilot should validate this operating loop:

**Organizer creates and manages event
→ attendee discovers event
→ attendee gets the correct ticket
→ ticket appears in the attendee wallet
→ attendee presents QR
→ staff validates entry
→ duplicate entry is prevented
→ attendee receives and/or uses FestCoin
→ attendee can redeem event items/perks
→ organizer can see what happened**

If this loop is unreliable, the MVP is not ready regardless of how many additional features exist.

---

# 2. MVP Product Definition

For the private pilot, FestChain is:

> **A multi-device event operating platform with digital ticketing, QR access, FestCoin rewards/credits, basic event commerce, and organizer operations.**

The MVP should already reflect the larger FestChain philosophy, but it should not attempt to implement the entire future ecosystem.

---

# 3. Supported User Types

## 3.1 Partygoer / Attendee

Primary device: **mobile**

Must be able to: access the landing experience; register/login; discover available events; open an event; understand event details; reserve or purchase an available ticket; receive the correct ticket tier; access owned tickets; open ticket details; see the QR code; understand ticket status; see private-event information when authorized; receive FestCoin/rewards where applicable; see FestCoin balance/history; browse available event items/perks; purchase or redeem supported items using the current MVP FestCoin flow; receive clear success/failure feedback.

## 3.2 Organizer

Primary device: **desktop**, responsive on smaller screens.

Must be able to: register/login; create an event; edit an existing event; publish/manage event visibility; manage capacity; create/manage ticket phases; see ticket/sales information; see attendees/tickets relevant to their event; access QR scanning/check-in tools where authorized; manage event items such as drinks, merch, VIP items, or perks when supported by the current build; review redemptions/transactions relevant to their event; operate the event without requiring a phone-only workflow.

The MVP organizer experience does not need to contain every future dashboard module. It must, however, feel usable as an actual event operations tool.

## 3.3 Staff / Scanner

Primary device: **mobile or tablet**

Must be able to: access the scanner only when authorized; use the device camera; scan a valid ticket QR; receive immediate validation feedback; reject invalid tickets; reject already-used tickets; avoid duplicate successful redemption/check-in; understand scanner/network/camera errors.

## 3.4 Admin

Admin capabilities may remain minimal during the private pilot. At minimum, if the pilot process depends on applications/organizer approval, an admin must be able to: access legitimate pilot applications; identify applicant status; review relevant information; approve/reject or otherwise move the application through the pilot process.

Admin controls do not need to become a complete enterprise back office in this phase.

---

# 4. Core MVP Capabilities

## 4.1 Landing & Onboarding

**Required.** Unauthenticated users land on the FestChain landing experience. The landing page clearly explains what FestChain is, value for partygoers, value for organizers, private pilot status, and what currently works. No misleading claims about unbuilt features. No unnecessary crypto jargon in the primary experience. Login/signup remains easily accessible. Portuguese and English structure supported or translation-ready.

**Acceptance criteria.** A new user can understand the product without logging in first. The product does not present itself as a completed DAO, universal token network, or full social network. Legacy "Public Beta" copy does not appear in active pilot-facing areas.

## 4.2 Authentication & Identity

**Required.** Users can authenticate reliably. User-owned records are associated with the correct real user. Production write paths do not silently substitute service-role identities for the actual user where ownership matters. Role/permission checks do not rely only on frontend visibility.

**Acceptance criteria.** A real test user can register/login; acquire a ticket; see that ticket in their own wallet; not see another user's private ownership records; perform only actions allowed for their role.

## 4.3 Event Creation

**Required.** Organizers can create an event containing the fields necessary for the pilot: event name; description; image/media; venue/location; date/time; capacity; public/private visibility; ticket configuration; lineup/DJs; schedule; event item/menu information. Not every field must be mandatory.

**Acceptance criteria.** A valid organizer can create an event and then open it in the organizer workspace and attendee-facing view. A user who is **not** an approved organizer cannot create or publish a sellable event, including by calling the backend directly.

## 4.4 Event Editing

**Required.** Event configuration is not immutable. Organizers should be able to safely edit description; images; venue; visibility; capacity where safe; ticket phases; lineup; schedule; drinks/menu; merch; VIP items; perks; operational information. Changes that could affect already-purchased tickets or financial records must preserve data integrity.

**Acceptance criteria.** Organizer changes are persisted. Updated information appears in the correct attendee/organizer views. Existing ticket ownership is not corrupted by event editing. Capacity cannot be lowered below tickets already sold. Refund policy cannot be changed after the first sale.

## 4.5 Ticket Phases

The default FestChain phased-release model is: **Early Bird → Phase 1 → Phase 2 → Last Ones**.

**Required.** Each supported phase represents at least name; price; quantity/inventory; availability/status. A phase closes when its date window ends **or** its quantity sells out, whichever is first.

**Acceptance criteria.** The selected ticket tier/phase is preserved during purchase. Ticket issuance is not hardcoded to `general`. Inventory/capacity cannot be exceeded due to a simple concurrency error. When a phase sells out, the next active phase takes over automatically and the price the buyer pays matches the phase they are shown.

## 4.6 Ticket Purchase

**Required.** The end-to-end ticket flow must be trustworthy.

**Mandatory integrity chain:** request → authorization → event/tier validation → capacity validation → payment result → ticket creation → correct ownership → wallet visibility.

**Acceptance criteria.** A successful purchase must always result in a usable ticket for the correct attendee. A failed transaction must not create a valid paid ticket accidentally.

## 4.7 Ghost-Ticket Prevention

This is a release-blocking MVP requirement.

**Required regression path:** payment success → ticket persisted → correct real-user owner → wallet query returns ticket → ticket detail opens → QR renders → scanner validates → duplicate scan is rejected.

**Release rule.** If a paying attendee can arrive at the door without a wallet-visible usable ticket, the MVP is **not ready**.

## 4.8 Ticket Wallet

**Required.** Attendees can see active/owned tickets; event name; ticket phase/type; relevant event date; ticket status; QR access; ticket detail. Private-event ticket holders must be able to access the private information they are entitled to.

**Acceptance criteria.** The wallet reflects server-authoritative ownership. No fake ticket is shown as real. Used/redeemed tickets have a clear state. Unknown states fail visibly rather than silently disappearing.

## 4.9 QR Ticket Access

**Required.** Each usable ticket must expose a scannable QR or equivalent secure validation token. The validation mechanism must not rely solely on client-controlled data.

**Acceptance criteria.** Valid QR is accepted once. Invalid QR is rejected. Already-used QR is rejected. Unauthorized organizer/staff cannot validate tickets. Validation produces an audit-relevant timestamp/user.

## 4.10 Scanner

**Required.** The scanner must work on real mobile devices over HTTPS and handle camera permission granted; permission denied; unavailable camera; correct camera selection; valid QR; invalid QR; already-scanned ticket; slow or failed network; duplicate scan attempts.

**Acceptance criteria.** Successful validation is atomic enough that two scanner devices cannot both legitimately check in the same single-use ticket.

## 4.11 Public / Private Events

**Required.** Public events can be viewed according to intended public access. Private events must be protected server-side. Authorized users may include organizer; authorized staff/admin; valid ticket holder; explicitly invited attendee.

**Acceptance criteria.** A logged-in but unauthorized user cannot obtain protected private-event details merely by calling the underlying data/API path directly. Frontend hiding alone is not sufficient.

## 4.12 Organizer Authorization

**Required.** Sensitive organizer actions must use backend/RLS authorization. `approved_organizer` must not be cosmetic.

**Acceptance criteria.** An unauthorized user cannot create/manage protected organizer resources simply by calling a backend function directly.

## 4.13 FestCoin Wallet

For the MVP, FestCoin operates as **internal digital credits/rewards with no cash value**.

**Required.** Attendees can receive FTC; see FTC balance; see transaction history; understand transaction type; use FTC for supported pilot commerce/redemption flows.

**Acceptance criteria.** Balance is server-authoritative. Credits/debits are auditable. Duplicate requests do not double-credit or double-debit balances. New transaction types do not silently disappear from the wallet. The balance the attendee sees matches the balance the server will spend from, regardless of how many transactions they have.

## 4.14 Cashback / Rewards

**Required.** Where enabled: ticket cashback is calculated consistently; rewards are credited once; transaction history reflects the operation.

**Acceptance criteria.** Retries/webhooks/reloads cannot generate duplicate cashback for one eligible operation.

## 4.15 Event Commerce

Supported pilot commerce may include drinks; merch; VIP upgrades; perks.

**Required.** Organizer can manage supported items. Attendee can view relevant items. Attendee can complete the currently supported purchase/redemption flow.

**Acceptance criteria.** Item is correctly associated with the event/organizer. FTC debit/redemption is recorded once. Invalid/insufficient balance is handled clearly. Completed redemption cannot be duplicated unintentionally.

## 4.16 Bar Queue Value Proposition

The MVP should preserve the product direction that FestChain can reduce event queues by allowing attendees to buy or prepare purchases digitally. The private pilot does **not** require a full high-volume bar infrastructure. Dedicated vendor stations, advanced pickup queues, kitchen routing, or large-scale order management may wait.

## 4.17 Wallet / Transaction History

**Required.** Transaction history clearly distinguishes ticket cashback; top-up; pilot top-up; purchase; redemption; reward.

**Acceptance criteria.** Transaction direction is understandable. Amount is correct. Unknown types fail gracefully — and never render as the wrong direction. No important financial operation disappears solely because the UI lacks a label.

## 4.18 Basic Organizer Visibility

**Required pilot-level information:** tickets sold/reserved; capacity usage; attendees/check-ins; relevant transaction/redemption activity; basic sales/revenue information. Advanced analytics are not required for the pilot.

---

# 5. Payment Scope

## 5.1 Current payment architecture

FestChain currently uses **Stripe Checkout on a single FestChain account** (card + Pix), with
FestChain as merchant of record and **manual Pix payouts** to organizers. Stripe Connect is not
implemented. Before any production-money pilot, verify: approved-organizer enforcement; server-side
PaymentIntent creation; platform fee snapshot per ticket; webhook signature verification; webhook
idempotency; refunds; chargebacks; failure recovery; payout/reconciliation visibility; and that the
previously exposed Stripe test key was rotated.

Before scaling past a handful of trusted organizers, migrate to Stripe Connect Express so funds and
KYC sit with the organizer rather than with FestChain.

## 5.2 Payment Safety Rule

The MVP may remain in **test mode** rather than accept real money if the production financial path is not fully safe. A test-mode pilot is preferable to an unsafe real-money launch. **The UI must be honest about which mode is active** — pilot disclaimer copy must not claim "no real payments" while live Stripe checkout is enabled.

## 5.3 Financial Source of Truth

The browser/client is never the source of truth for payment success; ticket issuance; FTC balance; cashback; refunds; organizer payout; redemption status.

---

# 6. Organizer Desktop MVP

The organizer side must be intentionally usable on desktop. At minimum the MVP provides a coherent path for event overview; event creation/editing; ticket phase management; attendees/tickets; check-in access; supported event commerce configuration; basic transaction/activity visibility.

May remain future modules: advanced finance dashboard; predictive analytics; CRM segmentation; complex staff scheduling; multi-venue enterprise management; sophisticated vendor settlement.

---

# 7. Partygoer Mobile MVP

Priority order: discover/understand event; get ticket; find ticket; enter event; use rewards/FTC; access event purchases/perks. Navigation should make these tasks easy to find. Social/community features may exist but must not obscure this core hierarchy.

---

# 8. Accessibility & Feedback

**Clarity** — every core control communicates its purpose.
**Hierarchy** — primary actions are visually obvious.
**Accessibility** — avoid tiny text; low contrast; color-only status; ambiguous icons; inaccessible forms.
**Feedback** — provide useful feedback for loading; success; failure; payment state; ticket state; scanner state; redemption; network failures; permission problems.

---

# 9. Internationalization

The MVP supports or is structurally ready for Portuguese and English. Avoid scattering hardcoded user-facing strings across the app; centralize in `src/lib/i18n/translations.js`. Full professional translation coverage is desirable but should not block core reliability fixes.

---

# 10. Data & Security Scope

Required before serious pilot: correct user ownership; backend/RLS organizer authorization; private-event authorization; server-authoritative ticket state; atomic scan/redemption; financial idempotency; no exposed production secrets; no client-side privileged keys; reasonable validation of user input; no obvious direct-object authorization bypass.

---

# 11. Demo / Dummy Data

Production-facing pilot experiences should not look artificially populated. Dummy/test records must be removed, or clearly isolated/labeled as `[DEMO]` and excluded from analytics. Demo data should follow production ownership/permission structure closely enough to expose real bugs.

---

# 12. Pilot Application Scope

Someone operating FestChain must be able to see submitted applications; review them; identify status; contact the applicant; approve/reject or move them forward. A write-only lead form is not a complete business workflow.

---

# 13. Basic Analytics — In Scope

Tickets sold; tickets by phase; capacity utilization; check-ins; attendance rate; basic revenue; FTC issued; FTC spent; event item/redemption totals.

# 14. Advanced Analytics — Out of Scope

AI revenue prediction; attendance prediction; dynamic pricing optimization; advanced customer segmentation; cohort dashboards; cross-event predictive intelligence.

# 15. Social — Limited MVP Scope

`Moments` or other lightweight community functionality can remain if stable. Social is not a release blocker. The MVP does not require a full social graph; feed ranking; messaging; follower economy; creator monetization; large-scale moderation.

# 16. Web3 / Decentralization — Out of MVP Scope

DAO governance; staking; open token trading; speculative token economics; permissionless resale marketplace; universal NFT ticket transfer; complex self-custody onboarding; cross-chain support; decentralized identity; decentralized storage migration.

# 17. NFT Ticketing Scope

No blockchain/NFT integration exists in the codebase today. The MVP success criterion is a secure, authentic, usable digital ticket — not whether the attendee knows it is an NFT. Do not market NFT ticketing as live.

# 18. Resale Marketplace — Out of Scope
# 19. DAO Governance — Out of Scope
# 20. Staking — Out of Scope
# 21. Brand Sponsorship Platform — Out of Scope
# 22. Native Mobile Apps — Out of Scope
# 23. RFID / Proprietary Hardware — Out of Scope
# 24. Massive Infrastructure Rewrite — Out of Scope

Do not migrate away from Base44 as part of MVP alignment. Identify coupling; isolate domain logic where easy; document migration risks; avoid adding unnecessary lock-in.

---

# 25. Scale Target

The MVP should be designed toward **1,000+ attendees per event**. Audit for full-table client reads; missing pagination; race-prone counters; duplicate scan behavior; unbounded polling; N+1 requests; large client-side filtering; non-idempotent transactions.

# 26. Scale Claim Rule

The private pilot does not automatically prove 1,000+ readiness. Before making a production claim, test burst check-in; simultaneous scanner devices; concurrent ticket requests; concurrent redemptions; capacity contention; duplicate operations; ledger concurrency; poor connectivity; failure recovery; API/database behavior.

---

# 27. MVP Priority Classification

**P0 — Release Blocker:** successful payment but missing ticket; wrong ticket owner; duplicate valid check-in; unauthorized private-event access; unauthorized organizer action; double financial credit/debit; exposed secret; corrupted balance; unusable scanner.

**P1 — Pilot Critical:** organizer cannot edit event; attendee cannot find ticket; broken ticket phase selection; redemption flow unreliable; pilot applications unusable; major desktop organizer usability problem; serious performance bottleneck.

**P2 — Important UX:** weak empty states; confusing labels; layout problems; incomplete translation; inconsistent transaction labels.

**P3 — Roadmap:** DAO; staking; advanced social; predictive analytics; marketplace; large brand ecosystem.

---

# 28. MVP Release Checklist

## Identity & permissions
- [x] Real users own their own records correctly.
- [x] Organizer-sensitive actions are backend/RLS protected.
- [x] Private-event access is backend protected.
- [x] Admin-only actions are protected.

## Ticketing
- [x] Organizer can create an event.
- [x] Organizer can edit the event.
- [x] Ticket phases work (date **and** quantity).
- [x] Requested phase is preserved.
- [x] Capacity rules work, including in-flight checkouts.
- [x] Successful purchase creates exactly one usable ticket per unit bought.
- [x] Ticket appears in the correct user's wallet.
- [x] Ticket detail opens.
- [x] QR renders.

## Check-in
- [ ] Mobile camera works — **needs real-device test**.
- [ ] Valid QR succeeds — **needs real-device test**.
- [ ] Invalid QR fails — **needs real-device test**.
- [ ] Used QR fails — **needs real-device test**.
- [x] Simultaneous duplicate scans cannot both succeed (claim-token compare-and-set).
- [x] Scanner gives clear feedback.

## FestCoin
- [x] Balance is server-authoritative.
- [x] Reward/cashback credits correctly.
- [x] Duplicate operations do not duplicate rewards.
- [x] Transaction history is understandable.
- [x] Supported purchase/redemption works.
- [x] Duplicate redemption of the same item is prevented.
- [ ] Concurrent redemption of *different* items cannot overdraw — **hardened, needs load test**.

## Payments
- [ ] Stripe secret exposure issue confirmed resolved (rotate + verify).
- [ ] Organizer onboarding/KYC — **not built (single-account model)**.
- [ ] Correct connected account receives transfer — **N/A, manual Pix payout**.
- [x] Platform fee is snapshotted per ticket.
- [x] Webhooks are signature-verified.
- [x] Webhooks are idempotent.
- [x] Failure states do not create false tickets.
- [x] Refund behaviour understood (full auto, partial manual).

## Organizer
- [x] Desktop event management is usable.
- [x] Tickets/attendees are visible.
- [x] Check-in information is visible.
- [x] Supported items/perks can be managed.
- [x] Basic activity/sales information is understandable.

## Partygoer
- [x] Landing page explains the product.
- [x] Event discovery works without login.
- [x] Ticket flow works on mobile.
- [x] Wallet works.
- [x] Event details work.
- [x] Private-event entitlement works.
- [x] FestCoin/reward information is understandable.

## Operations
- [x] Demo data is labeled `[DEMO]` and excluded from analytics.
- [x] Pilot applications can be reviewed.
- [x] Critical errors are logged.
- [ ] No roadmap-only feature is falsely marketed as working — **audit landing copy before launch**.

---

# 29. Pilot Success Metrics

**Ticketing:** How many ticket attempts succeeded? Did any successful buyer fail to receive a usable ticket? Were any duplicate tickets created? Were any tickets issued to the wrong owner?

**Entrance:** What percentage of scans succeeded on first attempt? How long did check-in take? Were duplicate scans blocked? Did camera/network issues materially affect entry?

**FestCoin:** How many guests received FTC? How many used FTC? Which items/perks were redeemed? Were any ledger inconsistencies observed?

**Organizer:** Could the organizer operate the event without developer intervention? Which dashboard information was missing? Which tasks were difficult from desktop?

**Partygoer:** Could attendees find their ticket quickly? Did they understand FestCoin? Did they understand redemption? Did they need staff help?

These metrics matter more than vanity engagement metrics during the first pilot.

---

# 30. Explicit MVP Non-Goals

Full decentralization; DAO governance; staking; speculative FestCoin economics; universal cross-event token liquidity; secondary-market resale; full social network; influencer economy; brand marketplace; predictive analytics; native mobile apps; enterprise multi-venue operations; proprietary hardware; complete Base44 migration.

---

# 31. Definition of Done

The FestChain MVP is ready for a real private pilot when:

1. A real organizer can configure and operate an event.
2. A real attendee can obtain and retrieve the correct ticket.
3. That ticket can reliably grant entry exactly once.
4. Private and organizer data are properly protected.
5. FestCoin/rewards remain financially consistent.
6. Supported event items/perks can be redeemed reliably.
7. The organizer can understand basic event activity.
8. Mobile attendee and scanner experiences work under real-device conditions.
9. Desktop organizer workflows are genuinely usable.
10. No known P0 issue remains unresolved.

---

# 32. Final Scope Principle

> **Does this feature help us prove that FestChain can reliably operate a real event or generate critical learning from the pilot?**

If yes, it may belong in the MVP. If no, it should probably wait.

---

# 33. Implementation Status — 2026-08-07

| System | Status |
|---|---|
| Landing + public storefront | ✅ READY |
| Auth & real-user ownership | ✅ READY |
| Event creation / editing | ✅ READY (server-authorized via `saveEvent`) |
| Ticket phases (date + quantity) | ✅ READY |
| Purchase → ticket → wallet → QR | ✅ READY |
| Capacity / oversell protection | ✅ READY (pending-hold accounting) |
| QR check-in + duplicate prevention | ✅ READY in code · ⚠️ needs real-device + two-scanner test |
| Offline door manifest & sync | ✅ READY in code · ⚠️ untested at scale |
| Private-event authorization | ✅ READY |
| Organizer authorization | ✅ READY |
| FestCoin ledger & balance | ✅ READY (server-authoritative) |
| Event commerce / redemption | ⚠️ NEEDS WORK — concurrent multi-item overdraw hardened but unproven |
| Refunds | ⚠️ NEEDS WORK — full refunds automated, partial manual |
| Stripe payouts to organizers | ⚠️ NEEDS WORK — manual Pix, no Connect/KYC |
| Pilot application review | ✅ READY (admin panel) |
| Basic analytics | ✅ READY |
| Load / concurrency proof | ❌ BLOCKER for any 1,000+ claim |
| Stripe key rotation confirmation | ❌ BLOCKER for real-money pilot until confirmed |
