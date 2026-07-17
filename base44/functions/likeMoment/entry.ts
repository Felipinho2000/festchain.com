import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Server-side moment like increment.
// The Moment entity's RLS only allows the author (or admin) to update a moment.
// This means a direct browser-side base44.entities.Moment.update() silently fails
// for anyone but the post's author. This function uses asServiceRole to increment
// likes so that ANY authenticated user can like any moment.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const moment_id = body && body.moment_id;

    if (!moment_id) return Response.json({ status: 'error', message: 'Moment id is required' }, { status: 400 });

    const moment = await base44.asServiceRole.entities.Moment.get(moment_id).catch(() => null);
    if (!moment) return Response.json({ status: 'error', message: 'Moment not found' }, { status: 404 });

    const newLikes = (moment.likes || 0) + 1;
    await base44.asServiceRole.entities.Moment.update(moment_id, { likes: newLikes });

    return Response.json({ status: 'success', likes: newLikes });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});