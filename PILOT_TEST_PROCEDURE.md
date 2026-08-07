# FestChain — Manual Pilot Test Procedure

> Everything in this file must be done by a human on a real phone. None of it can be
> proven from code. Do it **before** you announce a date, not on the day.
>
> Print this or open it on a laptop. Tick every box. If a box fails, write down exactly
> what you saw — the wording of the error matters as much as the failure.
>
> **Time needed:** about 60 minutes with two people and two phones.

---

## What you need

- 1 iPhone with Safari (do not use Chrome on iPhone for the first pass)
- 1 Android phone with Chrome
- 1 laptop (organizer side)
- 2 test accounts that are **not** admin: one buyer, one second buyer
- 1 organizer account that is approved
- The event must be reachable over **https://** — the camera will not turn on over http

---

## Part A — iPhone / Safari scanner

Sign in on the iPhone with the **organizer** account and open the Scan page.

| # | Do this | Expected result | ✓ |
|---|---|---|---|
| A1 | Open the scanner for the first time | Safari asks for camera permission | ☐ |
| A2 | Tap **Allow** | Live camera preview appears within ~3 seconds | ☐ |
| A3 | Check which camera is on | It is the **rear** camera, not the selfie camera | ☐ |
| A4 | Scan a valid, paid ticket QR | Green "Entry approved" with the guest's name | ☐ |
| A5 | Scan that **same** QR again | Rejected as already used, showing when and by whom | ☐ |
| A6 | Scan any other QR code (a random product barcode, a WhatsApp QR) | Clear "ticket not found" rejection, no crash | ☐ |
| A7 | Scan a ticket belonging to a **different event** | Rejected: does not belong to this event | ☐ |
| A8 | Point at a valid QR and hold steady for 10 seconds | It fires **once**, not repeatedly | ☐ |
| A9 | Scan 5 different valid tickets as fast as you can | All 5 accepted, none skipped, none double-counted | ☐ |
| A10 | Turn on Airplane Mode, then scan a valid ticket | Clear offline message OR offline manifest validation — **never** a silent green | ☐ |
| A11 | Turn Airplane Mode off, wait 10s | Scanner recovers without needing a page reload | ☐ |
| A12 | Type a ticket code by hand into the manual field | Same result as scanning it | ☐ |

### Permission denied, then restored (do this in order)

| # | Do this | Expected result | ✓ |
|---|---|---|---|
| A13 | Settings → Safari → Camera → set to **Deny**. Reload the scanner. | Plain-language message telling you permission was denied and how to fix it. No blank screen. | ☐ |
| A14 | Settings → Safari → Camera → back to **Ask**. Reload, tap Allow. | Camera works again | ☐ |
| A15 | Open the scanner, then open the iPhone Camera app, then come back | Either recovers, or says the camera is busy — not a frozen black box | ☐ |
| A16 | Lock the phone for 30s while the scanner is open, unlock | Preview resumes or a clear "tap to restart" appears | ☐ |

---

## Part B — Android / Chrome

Repeat **every row of Part A** on the Android phone in Chrome. Same expectations.

For A13/A14 on Android: Chrome → ⋮ → Settings → Site settings → Camera → find the
FestChain site → Block, then Allow.

| Row | iPhone/Safari | Android/Chrome |
|---|---|---|
| A1–A12 | ☐ all pass | ☐ all pass |
| A13–A16 | ☐ all pass | ☐ all pass |

---

## Part C — The two-scanner test (THIS IS THE IMPORTANT ONE)

This is the only test that can prove the door is safe. Do not skip it.

**Setup:** iPhone and Android both signed in as an authorized scanner, both on the
same event, both showing a live camera. One valid unused ticket QR displayed on a
third screen (a laptop) big enough for both phones to see at once.

| # | Do this | Expected result | ✓ |
|---|---|---|---|
| C1 | Both people count "3, 2, 1" and scan the same QR **at the same instant** | **Exactly one** phone shows green. The other says already used. | ☐ |
| C2 | Repeat C1 with a fresh ticket, 10 times | 10 out of 10 times, exactly one green | ☐ |
| C3 | After each round, check the ticket in the organizer view | Shows used once, with one timestamp and one scanner name | ☐ |
| C4 | Repeat C1 with **three** devices if you have a third | Still exactly one green | ☐ |

**If you ever see two greens on the same ticket: STOP. Do not run the pilot.**
Write down which two devices, the exact time, and the ticket code.

---

## Part D — Buyer journey on a real phone

Use a **non-admin** account. Do this on mobile data, not office wifi.

| # | Do this | Expected result | ✓ |
|---|---|---|---|
| D1 | Open the event link while logged out | Event page opens, no forced login | ☐ |
| D2 | Check the displayed price | Matches the phase you expect | ☐ |
| D3 | Tap buy → sign in → complete checkout with a Stripe test card | Redirected to the wallet | ☐ |
| D4 | Look at the wallet immediately | Ticket is there. If it briefly says pending, refresh once — it must become valid. | ☐ |
| D5 | Open the ticket, show the QR | QR renders, is scannable by the other phone | ☐ |
| D6 | Check the price you were charged in Stripe | Identical to D2 | ☐ |
| D7 | Sign in as the **second** buyer and try to open the first buyer's ticket URL | Denied | ☐ |
| D8 | Start a checkout and **abandon** it (close the tab) | After ~35 minutes the seat is released — event shows the spot back | ☐ |
| D9 | Buy until the first lote sells out | Price rises to the next lote automatically, on the page and at checkout | ☐ |

---

## Part E — Organizer on the laptop

| # | Do this | Expected result | ✓ |
|---|---|---|---|
| E1 | Sign in as an approved organizer, open the dashboard | Loads, shows your events only | ☐ |
| E2 | Sign in as a **plain attendee** and go to `/dashboard` | Blocked with "organizers only" | ☐ |
| E3 | As that attendee, go to `/dashboard/events/new` and try to save | Refused | ☐ |
| E4 | As organizer, edit a live event (change the description) | Saves, change appears on the public page | ☐ |
| E5 | Try to lower capacity below tickets already sold | Refused with a clear reason | ☐ |
| E6 | Try to change the refund policy after a sale | Silently kept at the original policy, with a note | ☐ |
| E7 | Check the attendee/check-in list mid-test | Matches what you actually scanned | ☐ |
| E8 | As admin, open `/pilot-setup` | The three real pilot leads are listed and you can change a status | ☐ |

---

## Part F — Before you take real money

| # | Check | ✓ |
|---|---|---|
| F1 | Stripe dashboard → Developers → API keys → confirm the old exposed **test** secret key is deleted/rolled | ☐ |
| F2 | Confirm which mode the app is in (test vs live) and that the on-screen wording matches | ☐ |
| F3 | Stripe → Webhooks → the FestChain endpoint shows recent **successful** deliveries, zero failing | ☐ |
| F4 | Do one full refund on a test ticket and confirm the ticket flips to refunded and the seat returns | ☐ |
| F5 | Decide and write down who is on call during the event if payments break | ☐ |

---

## Optional — real load test

Only if you want a real throughput number. This hits the live app, so do it on a
throwaway event, off-peak, and tell nobody it is happening.

1. Create a test event with capacity 200.
2. Issue 200 complimentary tickets to seeded accounts.
3. Have 4 phones scan 50 tickets each, as fast as possible, and time the whole run.
4. Record: total time, any error screens, any ticket that needed a second scan.

A good result is under 3 seconds per guest per lane with zero errors. Anything above
6 seconds per guest will produce a visible queue at the door.
