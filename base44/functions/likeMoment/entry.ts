import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// likeMoment — idempotent like/unlike toggle for a Moment.
// Uses asServiceRole because the Moment entity's update RLS only allows the
// author or admin — non-authors couldn't like via user-scoped updates.
// Scoped narrowly: only touches `likes` (count) and `liked_by` (per-user dedup).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { moment_id } = body;

    if (!moment_id) {
      return Response.json({ status: 'error', message: 'Missing moment_id' }, { status: 400 });
    }

    const moment = await base44.asServiceRole.entities.Moment.get(moment_id).catch(() => null);
    if (!moment) return Response.json({ status: 'error', message: 'Moment not found' }, { status: 404 });

    const userId = String(user.id);
    const likedBy = Array.isArray(moment.liked_by) ? moment.liked_by : [];
    const hasLiked = likedBy.includes(userId);

    if (hasLiked) {
      // Unlike
      const newLikedBy = likedBy.filter(id => id !== userId);
      const newLikes = Math.max(0, (moment.likes || 0) - 1);
      await base44.asServiceRole.entities.Moment.update(moment_id, {
        liked_by: newLikedBy,
        likes: newLikes,
      });
      return Response.json({
        status: 'success',
        liked: false,
        likes: newLikes,
      });
    } else {
      // Like
      const newLikedBy = [...likedBy, userId];
      const newLikes = (moment.likes || 0) + 1;
      await base44.asServiceRole.entities.Moment.update(moment_id, {
        liked_by: newLikedBy,
        likes: newLikes,
      });
      return Response.json({
        status: 'success',
        liked: true,
        likes: newLikes,
      });
    }
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});