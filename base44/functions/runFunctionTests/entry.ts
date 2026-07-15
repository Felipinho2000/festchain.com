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
    // TEST GROUP: sendMomentTip
    // ===================================================================

    // --- TEST 1: Self-tip prevention ---
    // Uses user-scoped SDK so created_by_id = admin (matches the calling user)
    try {
      const ownMoment = await base44.entities.Moment.create({
        image_url: 'https://test.invalid/moments/test-self-tip.png',
        caption: '[TEST] self-tip prevention — safe to delete',
        is_anonymous: true,
        author_alias: 'TestSelfTip',
      });
      TRACK('Moment', ownMoment.id);

      const d = await invoke('sendMomentTip', { moment_id: ownMoment.id, amount: 1 });
      record(
        'sendMomentTip: self-tip prevention',
        d.status === 'error' && /cannot tip your own/i.test(d.message || ''),
        `Expected error "cannot tip your own", got: ${d.status} — ${d.message}`
      );
    } catch (e) {
      record('sendMomentTip: self-tip prevention', false, `Exception: ${e.message}`);
    }

    // --- TEST 2: Insufficient balance rejection ---
    try {
      // Create moment via asServiceRole (created_by_id will be service_...)
      // so the self-tip check won't trigger; the balance check should catch it
      const otherMoment = await base44.asServiceRole.entities.Moment.create({
        image_url: 'https://test.invalid/moments/test-insufficient.png',
        caption: '[TEST] insufficient balance — safe to delete',
        is_anonymous: true,
        author_alias: 'TestInsufficient',
      });
      TRACK('Moment', otherMoment.id);

      const d = await invoke('sendMomentTip', { moment_id: otherMoment.id, amount: 999999 });
      record(
        'sendMomentTip: insufficient balance rejection',
        d.status === 'error' && /insufficient balance/i.test(d.message || ''),
        `Expected error "Insufficient balance", got: ${d.status} — ${d.message}`
      );
    } catch (e) {
      record('sendMomentTip: insufficient balance rejection', false, `Exception: ${e.message}`);
    }

    // --- TEST 3: Recipient credit — KNOWN BROKEN, tip UI disabled ---
    // sendMomentTip creates a transferred_in transaction for the moment's
    // author, but asServiceRole stamps created_by_id = service_... (phantom
    // owner), so the credit never lands in the author's wallet. Tipping UI
    // is disabled in MomentCard.jsx. This test documents the broken behavior
    // and must NOT be counted as a passing feature test — status is always
    // 'known_issue' regardless of whether the record is found.
    try {
      const tipMoment = await base44.asServiceRole.entities.Moment.create({
        image_url: 'https://test.invalid/moments/test-recipient-credit.png',
        caption: '[TEST] recipient credit regression — safe to delete',
        is_anonymous: true,
        author_alias: 'TestRecipient',
      });
      TRACK('Moment', tipMoment.id);

      // Give the admin 10 FTC for this test so the tip can succeed
      const topupTx = await base44.asServiceRole.entities.FestCoinTransaction.create({
        type: 'earned',
        amount: 10,
        description: '[TEST] FTC for recipient credit test — safe to delete',
        source: 'test_fixture',
        status: 'confirmed',
        created_by_id: String(user.id),
      });
      TRACK('FestCoinTransaction', topupTx.id);

      // Record ALL transferred_in transactions with source=moment_tip BEFORE
      const beforeTxs = await base44.asServiceRole.entities.FestCoinTransaction.filter({
        type: 'transferred_in',
        source: 'moment_tip',
      });
      const beforeIds = new Set(beforeTxs.map(t => t.id));

      // Tip 5 FTC
      const tipAmount = 5;
      const d = await invoke('sendMomentTip', { moment_id: tipMoment.id, amount: tipAmount });

      if (d.status !== 'success') {
        record('Recipient credit — KNOWN BROKEN, tip UI disabled', 'known_issue',
          `Tip call failed: ${d.status} — ${d.message}. Recipient credit is known broken; tipping is disabled.`);
      } else {
        // Query ALL transferred_in with source=moment_tip AFTER
        const afterTxs = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          type: 'transferred_in',
          source: 'moment_tip',
        });

        // Find transactions that are new (not in before set)
        const newCredits = afterTxs.filter(t => !beforeIds.has(t.id));
        const matchingCredit = newCredits.find(t =>
          t.amount === tipAmount &&
          t.description === 'Tip received on your moment' &&
          t.status === 'confirmed'
        );

        // Clean up the new transferred_in transaction(s)
        for (const t of newCredits) TRACK('FestCoinTransaction', t.id);

        // Clean up sender's transferred_out
        const senderDebits = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          created_by_id: String(user.id),
          type: 'transferred_out',
          source: 'moment_tip',
        });
        const testDebit = senderDebits.find(t => t.amount === tipAmount);
        if (testDebit) TRACK('FestCoinTransaction', testDebit.id);

        // Clean up FTCTip records for this moment
        const tipRecords = await base44.asServiceRole.entities.FTCTip.filter({ moment_id: tipMoment.id });
        for (const t of tipRecords) TRACK('FTCTip', t.id);

        record(
          'Recipient credit — KNOWN BROKEN, tip UI disabled',
          'known_issue',
          (matchingCredit
            ? `transferred_in record IS created (${tipAmount} FTC) but created_by_id=${matchingCredit.created_by_id} (phantom/service role, NOT the real author). `
            : `Tip succeeded but NO transferred_in created. (before=${beforeTxs.length}, after=${afterTxs.length}, new=${newCredits.length}). `) +
          'Tipping UI is disabled. Recipient credit is not production-ready.'
        );
      }
    } catch (e) {
      record('Recipient credit — KNOWN BROKEN, tip UI disabled', 'known_issue', `Exception: ${e.message}. Tipping is disabled; recipient credit is not production-ready.`);
    }

    // --- TEST 4: createMoment stores correct created_by_id ---
    // After fixing createMoment to use user-scoped SDK, the moment's
    // created_by_id should be the real user ID, not a service role ID.
    // This is what makes the recipient credit actually land in the right wallet.
    try {
      const d = await invoke('createMoment', {
        image_url: 'https://test.invalid/moments/test-createdby.png',
        caption: '[TEST] created_by_id check — safe to delete',
        is_anonymous: true,
        author_alias: 'TestCreatedBy',
      });

      if (d.status !== 'success' || !d.moment) {
        record('createMoment: stores real user ID as created_by_id', false,
          `createMoment failed: ${d.status} — ${d.message}`);
      } else {
        TRACK('Moment', d.moment.id);

        // Also clean up the 10 FTC reward transaction
        const rewardTxs = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          created_by_id: String(user.id),
          type: 'earned',
          source: 'moment_reward',
        });
        const testReward = rewardTxs.find(t => t.description === 'Shared a moment');
        if (testReward) TRACK('FestCoinTransaction', testReward.id);

        // Clean up badge if created
        const badges = await base44.asServiceRole.entities.UserBadge.filter({
          created_by_id: String(user.id),
          badge_key: 'first_moment',
        });
        if (badges.length > 0) {
          // Don't delete the badge if it already existed before our test
          // Only track if this was the first time (badge was just created)
        }

        const cby = d.moment.created_by_id;
        const isRealUser = cby && !String(cby).startsWith('service_') && String(cby) === String(user.id);
        record(
          'createMoment: stores real user ID as created_by_id',
          isRealUser,
          isRealUser
            ? `✓ created_by_id=${cby} (matches user ${user.id})`
            : `✗ created_by_id=${cby} (expected ${user.id}) — recipient credits would go to wrong owner`
        );
      }
    } catch (e) {
      record('createMoment: stores real user ID as created_by_id', false, `Exception: ${e.message}`);
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
    // AUDIT: Count existing Moment records with created_by_id starting
    // with "service_" — read-only, no fixes applied.
    // ===================================================================
    try {
      const allMoments = await base44.asServiceRole.entities.Moment.list('-created_date', 500);
      const serviceOwned = allMoments.filter(m => m.created_by_id && String(m.created_by_id).startsWith('service_'));
      const userOwned = allMoments.filter(m => m.created_by_id && !String(m.created_by_id).startsWith('service_'));
      record(
        'AUDIT: Moment records with service_ created_by_id (blast radius)',
        true, // informational — always "passes", the count is the data
        `Total moments queried: ${allMoments.length}. ` +
        `service_ owned: ${serviceOwned.length}. ` +
        `user owned: ${userOwned.length}.`
      );
    } catch (e) {
      record('AUDIT: Moment records with service_ created_by_id (blast radius)', false, `Exception: ${e.message}`);
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