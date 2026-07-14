import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Test harness for backend functions that move money or gate entry.
// Admin-only. Creates test fixtures, invokes target functions, asserts on
// responses, and cleans up all test data afterwards.
//
// Currently tests sendMomentTip (3 cases). Structured so more test groups
// can be added as additional sections.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const results = [];
    const cleanup = [];
    const TRACK = (entity, id) => { if (id) cleanup.push({ entity, id }); };

    const record = (name, passed, detail) => {
      results.push({ test: name, passed, detail });
    };

    // Find a non-admin user to be the moment author (recipient)
    const users = await base44.asServiceRole.entities.User.list(50);
    const otherUser = users.find(u => u.role !== 'admin' && u.id !== user.id);
    if (!otherUser) {
      return Response.json({ error: 'No non-admin user found for test fixtures' }, { status: 500 });
    }

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
    try {
      const ownMoment = await base44.asServiceRole.entities.Moment.create({
        image_url: 'https://test.invalid/moments/test-self-tip.png',
        caption: '[TEST] self-tip prevention — safe to delete',
        is_anonymous: true,
        author_alias: 'TestSelfTip',
        created_by_id: String(user.id),
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
      const otherMoment = await base44.asServiceRole.entities.Moment.create({
        image_url: 'https://test.invalid/moments/test-insufficient.png',
        caption: '[TEST] insufficient balance — safe to delete',
        is_anonymous: true,
        author_alias: 'TestInsufficient',
        created_by_id: String(otherUser.id),
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

    // --- TEST 3: Recipient receives transferred_in credit (REGRESSION) ---
    // This is the key test: confirms the fix at lines 71-85 of sendMomentTip
    // actually creates a transferred_in transaction for the moment author.
    // Without the fix, the tip is debited from the sender but never credited
    // to the recipient — effectively burning the FTC.
    try {
      const tipMoment = await base44.asServiceRole.entities.Moment.create({
        image_url: 'https://test.invalid/moments/test-recipient-credit.png',
        caption: '[TEST] recipient credit regression — safe to delete',
        is_anonymous: true,
        author_alias: 'TestRecipient',
        created_by_id: String(otherUser.id),
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

      // Record recipient's transferred_in count BEFORE the tip
      const recipientTxsBefore = await base44.asServiceRole.entities.FestCoinTransaction.filter({
        created_by_id: String(otherUser.id),
        type: 'transferred_in',
        source: 'moment_tip',
      });
      const countBefore = recipientTxsBefore.length;

      // Tip 5 FTC to otherUser's moment
      const tipAmount = 5;
      const d = await invoke('sendMomentTip', { moment_id: tipMoment.id, amount: tipAmount });

      if (d.status !== 'success') {
        record('sendMomentTip: recipient receives transferred_in credit', false,
          `Tip call itself failed (expected success): ${d.status} — ${d.message}`);
      } else {
        // Query recipient's transferred_in AFTER the tip
        const recipientTxsAfter = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          created_by_id: String(otherUser.id),
          type: 'transferred_in',
          source: 'moment_tip',
        });
        const countAfter = recipientTxsAfter.length;

        // Find the new transaction (should be exactly 1 more than before)
        const newCredits = recipientTxsAfter.filter(t => !recipientTxsBefore.some(b => b.id === t.id));
        const matchingCredit = newCredits.find(t =>
          t.amount === tipAmount &&
          t.description === 'Tip received on your moment' &&
          t.status === 'confirmed'
        );

        // Clean up recipient's transferred_in test transaction
        for (const t of newCredits) TRACK('FestCoinTransaction', t.id);

        // Clean up sender's transferred_out test transaction
        const senderDebits = await base44.asServiceRole.entities.FestCoinTransaction.filter({
          created_by_id: String(user.id),
          type: 'transferred_out',
          source: 'moment_tip',
        });
        const testDebit = senderDebits.find(t => t.amount === tipAmount && t.description === 'Tipped TestRecipient');
        if (testDebit) TRACK('FestCoinTransaction', testDebit.id);

        // Clean up FTCTip records for this moment
        const tipRecords = await base44.asServiceRole.entities.FTCTip.filter({ moment_id: tipMoment.id });
        for (const t of tipRecords) TRACK('FTCTip', t.id);

        record(
          'sendMomentTip: recipient receives transferred_in credit',
          !!matchingCredit && countAfter === countBefore + 1,
          matchingCredit
            ? `✓ Recipient received transferred_in of ${tipAmount} FTC (count: ${countBefore} → ${countAfter})`
            : `✗ No transferred_in transaction found for recipient. Tip succeeded but recipient was NOT credited. (transferred_in count: ${countBefore} → ${countAfter})`
        );
      }
    } catch (e) {
      record('sendMomentTip: recipient receives transferred_in credit', false, `Exception: ${e.message}`);
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

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return Response.json({
      summary: `${passed} passed, ${failed} failed`,
      passed,
      failed,
      total: results.length,
      results,
      cleanup: { attempted: cleanup.length, results: cleanupResults },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});