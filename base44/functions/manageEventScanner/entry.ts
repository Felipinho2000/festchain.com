import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Add or remove a per-event door-scanner. Organizer-ownership verified.
// Mirrors the email-lookup pattern in issueComplimentaryTickets: the target
// must already have a FestChain account under the exact email given — there
// is no invite-by-email-only flow yet, same limitation as comp tickets.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { event_id, email, action } = body;
    if (!event_id || !email || !['add', 'remove'].includes(action)) {
      return Response.json({ status: 'error', message: 'event_id, email, and action (add/remove) are required' }, { status: 400 });
    }

    const isAdmin = user.role === 'admin';
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'error', message: 'Event not found' }, { status: 404 });
    if (!isAdmin && String(event.created_by_id) !== String(user.id)) {
      return Response.json({ status: 'error', message: 'Not authorized for this event' }, { status: 403 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) return Response.json({ status: 'error', message: 'A valid email is required' }, { status: 400 });

    const matches = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
    if (matches.length !== 1) {
      return Response.json({
        status: 'error',
        code: matches.length === 0 ? 'no_account' : 'ambiguous_account',
        message: matches.length === 0
          ? 'No FestChain account found for that email. They need to sign up first.'
          : 'More than one account matched that email.',
      }, { status: 400 });
    }
    const targetUserId = String(matches[0].id);

    // The owner can already scan — adding them as a "scanner" would be a
    // no-op that just clutters the list.
    if (targetUserId === String(event.created_by_id)) {
      return Response.json({ status: 'error', message: 'This is already the event owner' }, { status: 400 });
    }

    const current = Array.isArray(event.scanner_user_ids) ? event.scanner_user_ids.map(String) : [];
    const next = action === 'add'
      ? (current.includes(targetUserId) ? current : [...current, targetUserId])
      : current.filter((id) => id !== targetUserId);

    await base44.asServiceRole.entities.Event.update(event_id, { scanner_user_ids: next });

    return Response.json({
      status: 'success',
      scanner_user_ids: next,
      user: { id: targetUserId, name: matches[0].full_name || '', email: matches[0].email || '' },
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});
