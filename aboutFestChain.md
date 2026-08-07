# About FestChain

> **Canonical product identity document.** When any other document disagrees with this
> one about *what FestChain is*, this file wins.
>
> Last aligned: 2026-08-07

## What it is
FestChain is a multi-device event platform that combines digital ticketing, event payments/credits, rewards, operations, analytics, and community features for nightlife and live events.

FestChain is **not phone-only**. The experience is designed around the device that best fits each role:

- **Attendees:** mobile-first for discovery, tickets, QR access, FestCoin, purchases, rewards, and social features.
- **Organizers:** desktop-first and fully responsive for event creation, configuration, sales monitoring, attendee management, vendor/menu operations, financial visibility, and analytics.
- **Event staff and vendors:** mobile/tablet-friendly for check-in, redemption, scanning, and on-site operations.

FestChain avoids requiring proprietary RFID infrastructure or dedicated closed hardware. Organizers should be able to run the platform using normal phones, tablets, and computers while retaining the option to add operational hardware later when an event needs it.

The private pilot may begin with smaller events, but **FestChain's product and architecture must not be designed around a 50–300-person ceiling**. The goal is to reliably support events with **1,000+ attendees**, with a path to larger venues and festivals as operational maturity grows.

## Mission
Build a fairer, more connected, and more efficient event ecosystem where partygoers, DJs, organizers, venues, vendors, and brands can participate in the same digital economy and community.

FestChain should help:

- organizers keep more value from the events they create;
- attendees receive better access, rewards, convenience, and continuity between events;
- DJs and creators build a direct relationship with their audiences;
- venues and vendors operate faster with better information;
- the event community become more connected before, during, and after the party.

## Product principles

### 1. Mainstream UX before crypto UX
FestChain may use blockchain where it creates real value—ticket integrity, ownership, interoperability, transparent rewards, or future decentralized coordination—but users should not need to understand wallets, gas, NFTs, or token mechanics to use the core product.

The product language should lead with **tickets, rewards, credits, perks, access, payments, and community**, not blockchain jargon.

### 2. Mobile where mobility matters; desktop where depth matters
Mobile is essential for the attendee journey and on-site operations. Desktop is essential for organizers who need to create, configure, operate, compare, and analyze events comfortably.

No important organizer workflow should assume that a phone is the primary working environment.

### 3. Hardware-light, not capability-light
FestChain should reduce dependence on proprietary wristbands, RFID systems, and closed event hardware without sacrificing operational reliability. QR-based access and redemption should work on ordinary devices, while the architecture remains open to optional scanners, printers, POS integrations, or other hardware when an organizer needs them.

### 4. Fair event economics
FestChain should reduce unnecessary platform friction and create more ways for value to stay with the people who create the event experience. Fees, rewards, payouts, and FestCoin activity should be understandable and transparent.

FestChain should never position itself around avoiding legally required taxes or obligations. The goal is better economics through lower platform friction, stronger loyalty, operational efficiency, new revenue streams, and direct community relationships.

### 5. Community, not just transactions
A ticket purchase is the beginning of the relationship, not the end. FestChain should connect discovery, attendance, DJs, Moments, rewards, future events, profiles, and shared experiences into a recurring community loop.

### 6. Trust, security, and accessibility by default
Tickets, balances, permissions, redemptions, payouts, and event data should be protected by clear authorization rules and auditable backend logic. The interface should be responsive, accessible, understandable, and usable in both Portuguese and English as the product expands.

### 7. Build for real event pressure
The system should be designed for check-in bursts, bar peaks, unstable venue connectivity, multiple staff members acting simultaneously, and events with 1,000+ attendees. Reliability during the event is more important than feature count.

## Market position
FestChain sits between conventional ticketing platforms and closed cashless-event systems.

- **Traditional ticketing platforms** are strong at selling access but often stop at the ticket transaction.
- **Hardware-heavy cashless systems** can work well at major festivals but may require proprietary cards, wristbands, terminals, setup, and operational overhead.
- **FestChain's wedge** is an integrated, hardware-light event operating layer: ticketing + access + FestCoin/credits + rewards + commerce + organizer intelligence + community.

The initial go-to-market can focus on independent organizers, clubs, electronic-music events, university parties, bars, and growing festivals, but the product should not be framed as permanently limited to small events.

## Core ecosystem

### Ticketing and access
Organizers can create and manage public or private events, configure capacity and access rules, and sell phased/tiered tickets.

The standard FestChain ticket-release structure should support:

1. **Early Bird**
2. **Phase 1**
3. **Phase 2**
4. **Last Ones**

A phase closes when its **date window ends or its configured quantity sells out**, whichever happens first, and the next active phase takes over automatically.

Ticket experiences should support clear event details, permissions for private events, QR access, ticket status, validation, and protection against duplicate redemption.

Blockchain-backed/NFT ticketing can remain part of the long-term integrity and ownership model, but the user experience should remain simple and familiar.

### FestCoin (FTC)
FestCoin is the economic and loyalty layer of FestChain.

For attendees, FTC can support:

- rewards and cashback;
- drinks, merch, upgrades, VIP items, and perks;
- reusable value across participating FestChain events;
- loyalty progression and future community utility.

For organizers, FTC can support:

- faster in-event purchasing;
- pre-purchase of drinks, merch, VIP items, and perks;
- reduced bar queues and less dependence on physical drink cards;
- loyalty campaigns and incentives;
- event-level commerce data;
- future brand activations and sponsorship mechanics.

The MVP treats FestCoin as an **internal digital credit/reward system with no cash value**. More decentralized or tokenized capabilities are introduced only when they are legally, technically, and commercially justified.

### Organizer workspace
The organizer experience should be a serious operational workspace, especially on desktop.

Organizers should be able to:

- create and edit events over time;
- manage descriptions, media, venue information, visibility, capacity, and schedules;
- add and update DJs/lineups;
- manage ticket phases and pricing;
- manage menus, drinks, merch, VIP items, perks, and vendors;
- monitor ticket sales and attendance;
- manage check-in and scanning permissions;
- review FestCoin activity, purchases, redemptions, and transaction history;
- communicate or share event information with attendees;
- analyze event performance.

Longer term, the organizer dashboard should evolve into a premium intelligence layer with revenue and demand analytics across tickets, merch, drinks/perks, FestCoin activity, attendance, and event performance.

### On-site operations
FestChain should support fast operational flows for entrances, bars, vendors, and staff.

Important flows include:

- QR ticket validation and double-scan protection;
- mobile camera scanning with reliable permission/error feedback;
- offline door manifests for venues with unreliable connectivity;
- item/FestCoin redemption;
- vendor or staff-specific permissions;
- pre-order and pickup flows;
- transaction and redemption history;
- graceful handling of poor connectivity or operational failures.

### Social and community layer
**Moments** is an early building block toward the broader FestChain social network.

The long-term social layer can connect:

- attendees and friends;
- DJs and fans;
- organizers and returning audiences;
- venues and local scenes;
- brands and event communities.

Future capabilities may include discovery feeds, profiles, event history, badges, social sharing, following, DJ discovery, community voting, gated access, and privacy/anonymous modes.

The goal is a **party-culture social network with economic utility**, not a generic social feed bolted onto a ticketing product.

## Event scale and reliability target
FestChain should be engineered around real event concurrency rather than average website traffic.

The minimum product target is to support **1,000+ attendees per event** without redesigning the core architecture.

That requires planning for:

- simultaneous ticket checks near opening time;
- multiple entrance scanners;
- concurrent bar/vendor redemptions;
- payment and ledger idempotency;
- atomic capacity and redemption updates;
- rate limiting and abuse prevention;
- fast organizer dashboards without blocking operational flows;
- monitoring, logs, alerting, and recovery procedures;
- degraded-network and failure scenarios.

A future scale plan should define measurable throughput and reliability targets before FestChain claims readiness for larger festivals. **FestChain has not yet run a load test. No 1,000+ readiness claim may be made publicly until one exists.**

## Payments and organizer payouts

### What is actually implemented today (2026-08-07)
FestChain currently operates a **single-account collection model**, not Stripe Connect:

- Stripe Checkout (card + Pix) is created server-side in `createCheckoutSession`.
- Funds settle into **FestChain's own Stripe account**. FestChain is the merchant of record.
- `stripeWebhook` verifies the signature, activates the pre-created pending tickets, and records
  `fee_percentage_applied`, `platform_fee_cents`, `stripe_fee_cents`, and `net_to_organizer_cents`
  per ticket.
- Organizer payouts are **manual Pix transfers**, tracked through `OrganizerAccount.payout_pix_key`,
  the `EventPayout` entity, `getOrganizerPayoutStatement`, and `markPayoutPaid`.
- Refunds run through `processRefund` and the `charge.refunded` webhook. Partial refunds are
  deliberately left for manual handling.
- Statement descriptor: `FESTCHAIN INGRESSOS`.

### Why this matters
Being merchant of record means FestChain holds other people's money between the sale and the
payout. That carries chargeback liability, tax/reporting obligations, and counterparty risk that
Stripe Connect (`transfer_data` / `application_fee_amount` / `on_behalf_of`) would push back onto
the organizer's own connected account. This is an acceptable, deliberate simplification for a small
private pilot. **It is not an acceptable steady state.** Migrating to Stripe Connect Express with
per-organizer KYC is the single most important payments item on the post-pilot roadmap.

### Target payment architecture (roadmap, not built)
- organizer onboarding/KYC via Stripe Connect Express;
- backend-enforced `approved_organizer` gate before any organizer can sell (**implemented**);
- server-side payment creation and verification (**implemented**);
- `application_fee_amount` / `transfer_data` routing to the organizer's connected account;
- reconciliation, refunds, chargebacks, and payout visibility;
- Brazilian payment methods such as cards and Pix (**implemented, single-account**).

Payments, payouts, and FestCoin balances must be treated as server-authoritative financial state. Client-side UI must never be the source of truth.

## Business model direction
Potential revenue streams include:

- ticketing/service fees positioned competitively against traditional platforms;
- fees on eligible FestCoin/event-commerce transactions;
- premium organizer analytics and operational tools;
- brand activations and sponsorships;
- future marketplace or resale fees where legally and operationally appropriate.

The business model should reinforce the ecosystem: better organizer economics, better attendee value, and more reasons for participants to return.

## Long-term vision
FestChain aims to become a connected party ecosystem spanning:

**ticketing → access → event commerce → FestCoin → loyalty → DJs → Moments/social → discovery → analytics → community governance**.

The decentralization roadmap should be progressive. Centralized infrastructure can be used where it improves reliability and mainstream usability today, while ownership, interoperability, transparent rules, and community participation become more decentralized as the product, regulation, and user base mature.

The long-term goal is not decentralization for its own sake. It is to give the event ecosystem better ownership, fairer economics, stronger community relationships, and less dependence on closed intermediaries.

## MVP and roadmap discipline
FestChain is currently a private pilot/pre-launch product. The pilot should prove the core loop before the platform expands.

### Must prove first
- event creation and editing;
- ticket reservation/purchase flow;
- secure QR ticket access and check-in;
- organizer/staff permissions;
- FestCoin reward and redemption flows;
- usable attendee wallet/ticket experience;
- reliable on-site operation;
- basic organizer visibility into what happened at the event.

### Implemented and code-verified
- public landing + public event storefront (no login required to browse or open a shared link);
- Stripe Checkout ticket purchase (card + Pix), single-account;
- pending-ticket pre-creation + webhook activation (no ghost tickets by construction);
- QR check-in with server-side authorization and atomic single-use claim;
- offline door manifest (HMAC-hashed codes, 24h expiry) + offline scan sync with conflict reporting;
- organizer menu management, guest item browsing, FTC redemption, wallet/transaction history;
- complimentary ticket issuance/revocation;
- refunds via Stripe + organizer refund queue;
- fee snapshot per ticket + manual Pix payout statement.

### Roadmap areas that must not be marketed as complete
- Stripe Connect / automated organizer payouts;
- pre-order and pickup QR flows;
- dedicated bar/vendor scan experience;
- advanced organizer analytics and predictive insights;
- complete social network;
- decentralized governance/DAO;
- open ticket marketplace/resale;
- advanced staking/voting mechanics;
- NFT/on-chain ticketing (no chain integration exists in the codebase today).

## Current status
**Private pilot / pre-launch.**

The immediate objective is to validate a reliable real-event loop while keeping the product architecture and positioning broad enough to grow into 1,000+ attendee events and, later, larger festival operations.

FestChain should remain disciplined about separating:

- what works today;
- what is being piloted;
- what is planned next;
- what belongs to the long-term decentralized ecosystem vision.

Decision history and implementation fixes are documented in `Memory.md`; the current pilot boundary is documented in `MVP_SCOPE.md`; AI/development operating rules live in `CLAUDE.md`.
