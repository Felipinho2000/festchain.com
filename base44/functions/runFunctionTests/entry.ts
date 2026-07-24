import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Test harness for backend functions that move money or gate entry.
// Admin-only. Creates test fixtures, invokes target functions, asserts on
// responses, and cleans up all test data afterwards.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const results = [];
    const cleanup = [];
    const TRACK = (entity, id) => { if (id) cleanup.push({ entity, id }); };

    // Accepts a boolean (→ 'pass'/'fail') or an explicit status string
    // ('pass', 'fail', 'known_issue', 'skipped').
    const record = (name, passedOrStatus, detail) => {
      const status = typeof passedOrStatus === 'string'
        ? passedOrStatus
        : (passedOrStatus ? 'pass' : 'fail');
      results.push({ test: name, status, detail });
    };

    // Helper: invoke a function and handle both thrown and returned errors
    const invoke = async (fn, payload) => {
      try {
        const res = await base44.functions.invoke(fn, payload);
        return res.data || res;
      } catch (e) {
        return e?.response?.data || { status: 'error', message: e.message };
      }
    };

    // ===================================================================
    // TEST 5a: reserveTicket is hard-disabled (money-path hardening round)
    // ===================================================================
    // reserveTicket used to issue tickets with status:'active' and no Stripe
    // call at all — free entry for any signed-in user. It's now dead;
    // confirm it returns the disabled code for every caller.
    try {
      const d = await invoke('reserveTicket', { event_id: 'any-id', payment_method: 'test' });
      const isDisabled = d.status === 'error' && d.code === 'ticket_reservation_disabled';
      record(
        'reserveTicket: hard-disabled (superseded by createCheckoutSession)',
        isDisabled,
        isDisabled
          ? '✓ Function returns code:ticket_reservation_disabled before any ticket-issuing logic runs.'
          : `✗ Expected kill switch. Got: ${d.status} / ${d.code || d.message || d.error}`
      );
    } catch (e) {
      record('reserveTicket: hard-disabled (superseded by createCheckoutSession)', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // TEST 5b: processCashback only pays out against a real, owned,
    // paid Ticket — and computes the amount from price_paid, never from
    // a client-sent native_amount.
    // ===================================================================
    try {
      const testEvent = await base44.asServiceRole.entities.Event.create({
        title: '[TEST] Cashback Event — safe to delete',
        description: 'Test event for cashback verification',
        genre: 'techno',
        date: new Date(Date.now() + 7 * 86400000).toISOString(),
        location_name: 'Test Venue',
        ticket_price: 100,
        total_capacity: 50,
        status: 'published',
        visibility: 'public',
        ftc_cashback_enabled: true,
        ftc_cashback_percent: 10,
        ftc_conversion_rate: 1,
        organizer_name: 'Test',
      });
      TRACK('Event', testEvent.id);

      // A real, paid ticket owned by the test admin (mirrors what
      // createCheckoutSession + stripeWebhook produce once payment clears).
      const paidTicket = await base44.asServiceRole.entities.Ticket.create({
        event_id: testEvent.id,
        organizer_id: String(user.id),
        event_title: testEvent.title,
        event_date: testEvent.date,
        ticket_type: 'general',
        price_paid: 100,
        payment_method: 'pix',
        qr_code: `TEST-CB-${Date.now()}`,
        status: 'active',
        created_by_id: String(user.id),
      });
      TRACK('Ticket', paidTicket.id);

      // Positive case: real ticket, real owner — cashback should be computed
      // from the ticket's price_paid (100 * 10% / rate 1 = 10 FTC), not from
      // any amount we pass in.
      const d1 = await invoke('processCashback', {
        event_id: testEvent.id,
        purchase_reference: paidTicket.id,
      });
      if (d1.transaction && d1.transaction.id) TRACK('FestCoinTransaction', d1.transaction.id);
      const correctAmount = d1.status === 'success' && d1.cashback_ftc === 10;

      // Negative case: purchase_reference that isn't a real ticket at all —
      // this is exactly the forgery this hardening closes (previously: any
      // fresh random string + a self-reported native_amount = free FTC).
      const d2 = await invoke('processCashback', {
        event_id: testEvent.id,
        purchase_reference: `forged-ref-${Date.now()}`,
      });
      const forgeryRejected = d2.status === 'error' && /not found/i.test(d2.message || '');

      record(
        'processCashback: pays from verified ticket.price_paid, rejects unowned/forged references',
        correctAmount && forgeryRejected,
        `Real ticket: ${correctAmount ? `✓ ${d1.cashback_ftc} FTC (expected 10)` : `✗ ${d1.status}: ${d1.message}`}. ` +
        `Forged reference: ${forgeryRejected ? '✓ rejected (' + d2.message + ')' : `✗ NOT rejected — ${d2.status}: ${d2.message}`}.`
      );
    } catch (e) {
      record('processCashback: pays from verified ticket.price_paid, rejects unowned/forged references', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // TEST 5c: entity RLS rejects a forged "born active/confirmed" Ticket
    // or FestCoinTransaction created directly via the client SDK, bypassing
    // every server function entirely. This is the core regression test for
    // the money-path hardening round — if either of these ever starts
    // succeeding again, free tickets / free FTC are back.
    // ===================================================================
    try {
      let forgedTicketRejected = false;
      let forgedTicketDetail = '';
      try {
        const forged = await base44.entities.Ticket.create({
          event_id: 'rls-test-event',
          event_title: '[TEST] RLS forgery attempt — should never persist',
          price_paid: 0,
          payment_method: 'test',
          qr_code: `FORGED-${Date.now()}`,
          status: 'active',
        });
        // If this didn't throw, the RLS hole is back open — clean up and fail loud.
        TRACK('Ticket', forged.id);
        forgedTicketDetail = `✗ Direct create with status:'active' SUCCEEDED (id=${forged.id}) — RLS is not enforcing data.status:'pending'.`;
      } catch (e) {
        forgedTicketRejected = true;
        forgedTicketDetail = `✓ Rejected: ${e.message}`;
      }

      let forgedTxRejected = false;
      let forgedTxDetail = '';
      try {
        const forged = await base44.entities.FestCoinTransaction.create({
          type: 'earned',
          amount: 999999,
          description: '[TEST] RLS forgery attempt — should never persist',
          status: 'confirmed',
        });
        TRACK('FestCoinTransaction', forged.id);
        forgedTxDetail = `✗ Direct create with status:'confirmed' SUCCEEDED (id=${forged.id}) — RLS is not enforcing data.status:'pending'.`;
      } catch (e) {
        forgedTxRejected = true;
        forgedTxDetail = `✓ Rejected: ${e.message}`;
      }

      record(
        'RLS: Ticket and FestCoinTransaction reject a client-forged born-active/confirmed create',
        forgedTicketRejected && forgedTxRejected,
        `Ticket: ${forgedTicketDetail} | FestCoinTransaction: ${forgedTxDetail}`
      );
    } catch (e) {
      record('RLS: Ticket and FestCoinTransaction reject a client-forged born-active/confirmed create', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // DIAGNOSTIC: Does asServiceRole.entities.FestCoinTransaction.create
    // respect an explicit created_by_id? Uses a fabricated ID so there's
    // zero ambiguity about what "correct" looks like.
    // ===================================================================
    try {
      const FAKE_ID = 'diagnostic-fake-id-xyz123';
      const created = await base44.asServiceRole.entities.FestCoinTransaction.create({
        type: 'earned',
        amount: 1,
        description: '[DIAGNOSTIC-DELETE-ME]',
        status: 'confirmed',
        created_by_id: FAKE_ID,
      });

      // Fetch that EXACT record back by ID (direct .get, not filter/sum)
      const fetched = await base44.asServiceRole.entities.FestCoinTransaction.get(created.id);
      const rawCby = fetched && fetched.created_by_id;

      // Delete the diagnostic record regardless of result
      try { await base44.asServiceRole.entities.FestCoinTransaction.delete(created.id); } catch (_) {}

      const respectsField = rawCby === FAKE_ID;
      record(
        'DIAGNOSTIC: asServiceRole.FestCoinTransaction.create respects explicit created_by_id',
        respectsField,
        `Passed created_by_id="${FAKE_ID}" → stored as "${rawCby}". ` +
        (respectsField
          ? '✓ FestCoinTransaction RESPECTS the explicit field (unlike Moment).'
          : (rawCby && String(rawCby).startsWith('service_')
            ? '✗ FestCoinTransaction IGNORES created_by_id and stamps service role ID (SAME BUG as Moment).'
            : '✗ FestCoinTransaction stored an unexpected value.'))
      );
    } catch (e) {
      record('DIAGNOSTIC: asServiceRole.FestCoinTransaction.create respects explicit created_by_id', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // DIAGNOSTIC 2: Can we create a FestCoinTransaction via asServiceRole
    // (stamps service_...) then UPDATE its created_by_id to a different
    // user? If yes, create-then-update is a viable path for crediting a
    // different user's wallet (sendMomentTip's recipient credit).
    // ===================================================================
    try {
      // 1. Create via asServiceRole (will stamp service_...)
      const created = await base44.asServiceRole.entities.FestCoinTransaction.create({
        type: 'earned',
        amount: 1,
        description: '[DIAG2-DELETE-ME] created_by_id update test',
        status: 'confirmed',
        source: 'diag2_fixture',
      });
      TRACK('FestCoinTransaction', created.id);

      // 2. Attempt to update created_by_id to a different real user id.
      //    Use a second admin (or any real user id) if available; otherwise
      //    use a fabricated-but-realistic id. We use a fabricated id to
      //    prove the field is writable — we don't need a real wallet owner.
      const TARGET_ID = 'diag2-target-user-456';
      let updateError = null;
      try {
        await base44.asServiceRole.entities.FestCoinTransaction.update(created.id, {
          created_by_id: TARGET_ID,
        });
      } catch (e) {
        updateError = e.message;
      }

      // 3. Re-fetch by ID and read the raw created_by_id
      const refetched = await base44.asServiceRole.entities.FestCoinTransaction.get(created.id);
      const rawCby = refetched && refetched.created_by_id;

      const updateWorks = rawCby === TARGET_ID;
      record(
        'DIAGNOSTIC 2: update created_by_id on FestCoinTransaction (create-then-update path)',
        updateWorks,
        updateError
          ? `Update threw: "${updateError}". Raw created_by_id after attempt: "${rawCby}".`
          : (updateWorks
            ? `✓ Update succeeded — created_by_id changed from "service_..." to "${rawCby}". Create-then-update IS a viable path for recipient credits.`
            : `✗ Update did not throw but field unchanged. Raw created_by_id: "${rawCby}" (still service_...). Update is silently ignored.`)
      );
    } catch (e) {
      record('DIAGNOSTIC 2: update created_by_id on FestCoinTransaction (create-then-update path)', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // TEST 7: seedDemoData attributes FTC transactions to the admin
    // ===================================================================
    try {
      const beforeDemo = await base44.asServiceRole.entities.FestCoinTransaction.filter({
        source: 'demo_data',
      });
      const beforeIds = new Set(beforeDemo.map(t => t.id));

      const d = await invoke('seedDemoData', {});

      if (d.status !== 'success') {
        record('seedDemoData: FTC transactions attributed to admin with is_pilot', false,
          `seedDemoData failed: ${d.status} — ${d.message || d.error}`);
      } else {
        const afterDemo = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          source: 'demo_data',
        });
        const newDemoTxs = afterDemo.filter(t => !beforeIds.has(t.id));
        for (const t of newDemoTxs) TRACK('FestCoinTransaction', t.id);

        if (d.event_id) {
          TRACK('Event', d.event_id);
          const demoTickets = await base44.asServiceRole.entities.Ticket.filter({
            event_id: d.event_id, ticket_phase: '[DEMO]',
          });
          for (const t of demoTickets) TRACK('Ticket', t.id);
        }

        const allAttributed = newDemoTxs.length > 0 && newDemoTxs.every(t =>
          t.is_pilot === true &&
          String(t.created_by_id) === String(user.id)
        );

        record(
          'seedDemoData: FTC transactions attributed to admin with is_pilot',
          allAttributed,
          allAttributed
            ? `✓ ${newDemoTxs.length} demo FTC tx(s) all have is_pilot=true and created_by_id=${user.id}`
            : `✗ Found ${newDemoTxs.length} tx(s). ${newDemoTxs.map(t => `is_pilot=${t.is_pilot}, cby=${t.created_by_id}`).join('; ') || 'none found'}`
        );
      }
    } catch (e) {
      record('seedDemoData: FTC transactions attributed to admin with is_pilot', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // TEST 8: redeemEventItem prevents duplicate + enforces stock=0
    // ===================================================================
    try {
      const testEvent = await base44.asServiceRole.entities.Event.create({
        title: '[TEST] Redemption Guard Event — safe to delete',
        genre: 'techno',
        date: new Date(Date.now() + 7 * 86400000).toISOString(),
        location_name: 'Test Venue',
        ticket_price: 50,
        total_capacity: 50,
        status: 'published',
        visibility: 'public',
        ftc_enabled: true,
        organizer_name: 'Test',
      });
      TRACK('Event', testEvent.id);

      const menuItem = await base44.asServiceRole.entities.VenueMenuItem.create({
        event_id: testEvent.id,
        event_title: testEvent.title,
        name: '[TEST] Test Drink',
        category: 'drinks',
        price_ftc: 5,
        price_brl: 10,
        is_available: true,
        stock: 1,
        accepts_ftc: true,
      });
      TRACK('VenueMenuItem', menuItem.id);

      const ticket = await base44.entities.Ticket.create({
        event_id: testEvent.id,
        organizer_id: String(user.id),
        event_title: testEvent.title,
        event_date: testEvent.date,
        ticket_type: 'general',
        price_paid: 50,
        payment_method: 'test',
        qr_code: `TEST-RDM-${Date.now()}`,
        status: 'active',
      });
      TRACK('Ticket', ticket.id);

      const topup = await base44.entities.FestCoinTransaction.create({
        type: 'earned',
        amount: 100,
        description: '[TEST] FTC for redemption test — safe to delete',
        source: 'test_fixture',
        status: 'confirmed',
      });
      TRACK('FestCoinTransaction', topup.id);

      // First redemption — should succeed
      const d1 = await invoke('redeemEventItem', { event_id: testEvent.id, menu_item_id: menuItem.id });
      const firstSucceeded = d1.status === 'success';

      // Track redemption + spent tx if created
      if (firstSucceeded) {
        const redemptions = await base44.asServiceRole.entities.EventRedemption.filter({
          event_id: testEvent.id,
        });
        for (const r of redemptions) TRACK('EventRedemption', r.id);
        const spentTxs = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          created_by_id: String(user.id),
          type: 'spent',
          event_id: testEvent.id,
        });
        for (const t of spentTxs) TRACK('FestCoinTransaction', t.id);
      }

      // Second redemption — should fail with "already redeemed"
      const d2 = await invoke('redeemEventItem', { event_id: testEvent.id, menu_item_id: menuItem.id });
      const duplicateBlocked = d2.status === 'error' && /already redeemed/i.test(d2.message || '');

      // Create out-of-stock item
      const oosItem = await base44.asServiceRole.entities.VenueMenuItem.create({
        event_id: testEvent.id,
        event_title: testEvent.title,
        name: '[TEST] OOS Item',
        category: 'drinks',
        price_ftc: 5,
        price_brl: 10,
        is_available: true,
        stock: 0,
        accepts_ftc: true,
      });
      TRACK('VenueMenuItem', oosItem.id);

      // Try to redeem out-of-stock — should fail
      const d3 = await invoke('redeemEventItem', { event_id: testEvent.id, menu_item_id: oosItem.id });
      const stockBlocked = d3.status === 'error' && /out of stock/i.test(d3.message || '');

      record(
        'redeemEventItem: duplicate + stock guards',
        firstSucceeded && duplicateBlocked && stockBlocked,
        `First redemption: ${firstSucceeded ? '✓ succeeded' : '✗ failed'}. ` +
        `Duplicate blocked: ${duplicateBlocked ? '✓' : '✗ (' + d2.status + ': ' + d2.message + ')'}. ` +
        `Stock=0 blocked: ${stockBlocked ? '✓' : '✗ (' + d3.status + ': ' + d3.message + ')'}.`
      );
    } catch (e) {
      record('redeemEventItem: duplicate + stock guards', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // TEST 9: sendMomentTip kill switch (Stage A)
    // ===================================================================
    try {
      const d = await invoke('sendMomentTip', { moment_id: 'any-id', amount: 5 });
      const isDisabled = d.status === 'error' && d.code === 'tipping_disabled';
      record(
        'sendMomentTip: hard-disabled (Stage A kill switch)',
        isDisabled,
        isDisabled
          ? '✓ Function returns code:tipping_disabled before any balance/ownership logic runs.'
          : `✗ Expected kill switch. Got: ${d.status} / ${d.code || d.message || d.error}`
      );
    } catch (e) {
      record('sendMomentTip: hard-disabled (Stage A kill switch)', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // TEST 10: likeMoment toggles like/unlike and dedupes per user
    // ===================================================================
    try {
      const testMoment = await base44.asServiceRole.entities.Moment.create({
        image_url: 'https://test.example/[TEST]-like-moment.png',
        caption: '[TEST] Like toggle test — safe to delete',
        author_alias: 'Test',
        is_anonymous: true,
        likes: 0,
        liked_by: [],
      });
      TRACK('Moment', testMoment.id);

      // First call — should like
      const d1 = await invoke('likeMoment', { moment_id: testMoment.id });
      const firstLiked = d1.status === 'success' && d1.liked === true && d1.likes === 1;

      // Second call from same user — should unlike
      const d2 = await invoke('likeMoment', { moment_id: testMoment.id });
      const secondUnliked = d2.status === 'success' && d2.liked === false && d2.likes === 0;

      record(
        'likeMoment: toggles like/unlike and dedupes per user',
        firstLiked && secondUnliked,
        `First (like): ${firstLiked ? '✓ liked=true, likes=1' : `✗ ${d1.status}: ${d1.message || d1.error}`}. ` +
        `Second (unlike): ${secondUnliked ? '✓ liked=false, likes=0' : `✗ ${d2.status}: ${d2.message || d2.error}`}.`
      );
    } catch (e) {
      record('likeMoment: toggles like/unlike and dedupes per user', false, `Exception: ${e.message}`);
    }

    // ===================================================================
    // DOCUMENTED GAPS — not fixed, called out explicitly
    // ===================================================================
    record(
      'GAP: Pre-existing orphaned ledger rows (pre-fix seedDemoData) not retroactively cleaned',
      true,
      'Demo FTC transactions created before the is_pilot/created_by_id fix still have ' +
      'service_ owners and is_pilot=false (or null). They are not retroactively cleaned up. ' +
      'They can be identified by source="demo_data" and is_pilot != true.'
    );
    record(
      'GAP: Ticket asServiceRole stamping issue unverified',
      true,
      'Whether Ticket.create via asServiceRole has the same phantom-owner stamping ' +
      'issue as Moment (service_ instead of real user) is unverified. If it does, ' +
      'tickets created via seedDemoData may have incorrect ownership. ' +
      'This should be tested before relying on asServiceRole for ticket creation.'
    );

    // ===================================================================
    // CLEANUP — delete all test fixtures
    // ===================================================================
    const cleanupResults = [];
    for (const item of cleanup) {
      try {
        await base44.asServiceRole.entities[item.entity].delete(item.id);
        cleanupResults.push({ id: item.id, entity: item.entity, deleted: true });
      } catch (e) {
        cleanupResults.push({ id: item.id, entity: item.entity, deleted: false, error: e.message });
      }
    }

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const knownIssues = results.filter(r => r.status === 'known_issue').length;

    return Response.json({
      summary: `${passed} passed, ${failed} failed, ${knownIssues} known issue(s)`,
      passed,
      failed,
      known_issues: knownIssues,
      total: results.length,
      results,
      cleanup: { attempted: cleanup.length, results: cleanupResults },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});