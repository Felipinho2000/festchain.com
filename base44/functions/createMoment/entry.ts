import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Server-side moment creation with a fixed, non-forgeable FestCoin reward.
// The reward amount and transaction type are hardcoded here so the client
// cannot create arbitrary "earned" transactions to inflate its balance.
const MOMENT_REWARD = 10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const image_url = body && body.image_url;
    const caption = (body && body.caption) || '';
    const is_anonymous = body && body.is_anonymous !== false;
    const author_alias = (body && body.author_alias) || (user.full_name || 'User');

    if (!image_url) return Response.json({ status: 'error', message: 'Image is required' }, { status: 400 });

    // 1. Create the moment (service role; created_by_id set explicitly)
    const moment = await base44.asServiceRole.entities.Moment.create({
      image_url,
      caption,
      is_anonymous,
      author_alias,
      created_by_id: String(user.id),
    });

    // 2. Award fixed FestCoin reward — amount and type are server-controlled
    try {
      await base44.asServiceRole.entities.FestCoinTransaction.create({
        type: 'earned',
        amount: MOMENT_REWARD,
        description: 'Shared a moment',
        source: 'moment_reward',
        status: 'confirmed',
        created_by_id: String(user.id),
      });
    } catch (_) {}

    // 3. First-moment badge (idempotent check)
    try {
      const existing = await base44.asServiceRole.entities.UserBadge.filter({
        created_by_id: String(user.id), badge_key: 'first_moment'
      });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.UserBadge.create({
          badge_key: 'first_moment',
          badge_name: 'Moment Maker',
          badge_emoji: '📸',
          badge_description: 'Shared your first moment',
          created_by_id: String(user.id),
        });
      }
    } catch (_) {}

    return Response.json({ status: 'success', moment, reward: MOMENT_REWARD });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});