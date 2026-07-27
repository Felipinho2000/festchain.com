import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Secured menu item update — only the event owner or admin can update items.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { id, ...updates } = body;
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

    // Allowlist of fields that can be updated — excludes event_id and
    // other association/ownership keys that could reassign the item.
    const ALLOWED = [
      'name', 'description', 'category', 'price_ftc', 'price_brl',
      'image_url', 'is_available', 'stock', 'emoji', 'accepts_ftc',
      'cashback_eligible',
    ];
    const safeUpdates = {};
    for (const key of ALLOWED) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.VenueMenuItem.update(id, safeUpdates);
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});