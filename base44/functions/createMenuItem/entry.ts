import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Secured menu item creation — only the event owner or admin can create items.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { event_id, name, description, category, price_ftc, price_brl, image_url, emoji, stock, is_available } = body;
    if (!event_id || !name) return Response.json({ error: 'Missing event_id or name' }, { status: 400 });

    const event = await base44.asServiceRole.entities.Event.get(event_id).catch(() => null);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isOwner = String(event.created_by_id) === String(user.id);
    if (!isAdmin && !isOwner) {
      return Response.json({ error: 'You are not authorized to manage this event' }, { status: 403 });
    }

    const item = await base44.asServiceRole.entities.VenueMenuItem.create({
      event_id,
      event_title: event.title,
      name,
      description: description || '',
      category: category || 'drinks',
      price_ftc: price_ftc || 0,
      price_brl: price_brl || 0,
      image_url: image_url || '',
      emoji: emoji || '',
      stock: stock != null ? stock : undefined,
      is_available: is_available !== false
    });

    return Response.json(item);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});