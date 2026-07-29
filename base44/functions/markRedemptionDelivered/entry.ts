import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mark a reward redemption as delivered — used by staff at the bar.
// Organizer/staff only: the caller must own the reward item's event (organizer_id match)
// or be an admin. Idempotent — re-delivering an already-delivered redemption returns
// the same result without error.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { redemption_code } = body;

    if (!redemption_code) {
      return Response.json({ error: 'redemption_code is required' }, { status: 400 });
    }

    // ── Find the redemption by code ──
    const matches = await base44.asServiceRole.entities.RewardRedemption.filter({ redemption_code });
    if (!matches || matches.length === 0) {
      return Response.json({ error: 'not_found', message: 'Código de resgate não encontrado.' }, { status: 404 });
    }
    const redemption = matches[0];

    // ── Idempotent — already delivered ──
    if (redemption.status === 'delivered') {
      return Response.json({ success: true, redemption, idempotent: true });
    }

    // ── Only confirmed redemptions can be delivered ──
    if (redemption.status !== 'confirmed') {
      return Response.json({
        error: 'invalid_state',
        message: 'Este resgate está ' + redemption.status + ' e não pode ser confirmado.',
      }, { status: 400 });
    }

    // ── Verify caller is the organizer (owns the reward) or admin ──
    const isAdmin = user.role === 'admin';
    if (!isAdmin && String(redemption.organizer_id) !== String(user.id)) {
      return Response.json({ error: 'not_authorized', message: 'Apenas o organizador pode confirmar a entrega.' }, { status: 403 });
    }

    // ── Mark as delivered ──
    await base44.asServiceRole.entities.RewardRedemption.update(redemption.id, {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      delivered_by_user_id: String(user.id),
      delivered_by_name: user.full_name || '',
    });

    return Response.json({
      success: true,
      redemption: {
        id: redemption.id,
        redemption_code: redemption.redemption_code,
        reward_item_name: redemption.reward_item_name,
        user_name: redemption.user_name,
        ftc_spent: redemption.ftc_spent,
        brl_value_cents: redemption.brl_value_cents || 0,
        status: 'delivered',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});