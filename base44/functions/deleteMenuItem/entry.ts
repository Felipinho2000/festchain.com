import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Secured menu item deletion — only the event owner or admin can delete items.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { id } = body;
    if (!id) return Response.json({ error: 'Missing item id' }, { status: 400 });

    const item = await base44.asServiceRole.entities.VenueMenuItem.get(id).catch(() => null);
    if (!item) return Response.json({ error: 'Menu item not found' }, { status: 404 });

    const event = await base44.asServiceRole.entities.Event.get(item.event_id).catch(() => null);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isOwner = String(event.created_by_id) === String(user.id);
    if (!isAdmin && !isOwner) {
      return Response.json({ error: 'You are not authorized to manage this event' }, { status: 403 });
    }

    await base44.asServiceRole.entities.VenueMenuItem.delete(id);
    return Response.json({ status: 'success' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});