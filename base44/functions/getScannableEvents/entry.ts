import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { canScanEvent } from '../../shared/eventAuth.ts';

// Returns the events the caller may scan for: events they own, events an
// organizer has explicitly added them to via manageEventScanner, or every
// event if they're an admin. This is the server-authoritative source for
// Scan.jsx's event picker — the page no longer decides who can scan from a
// client-side role field (that was the bug: a non-owner, non-"approved
// organizer" scanner could never reach a working scanner at all).
//
// Pilot-scale note: fetches a bounded recent window and filters in memory
// rather than requiring array-membership support from the query layer. Fine
// at tens-to-low-hundreds of events; revisit if event volume outgrows that.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Sign in required' }, { status: 401 });

    const isAdmin = user.role === 'admin';
    const recent = await base44.asServiceRole.entities.Event.filter({}, '-date', isAdmin ? 200 : 300).catch(() => []);
    const events = isAdmin ? recent : recent.filter((e) => canScanEvent(e, user));

    return Response.json({
      status: 'success',
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        location_name: e.location_name,
        date: e.date,
        created_by_id: e.created_by_id,
      })),
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});
