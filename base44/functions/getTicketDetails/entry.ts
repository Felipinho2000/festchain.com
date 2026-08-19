import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns full ticket + linked event + available perks for the ticket owner.
// Bypasses Event RLS (service role) so private event details are visible
// ONLY to the ticket owner, the event organizer, or an admin.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Entre na sua conta para continuar' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const ticket_id = body && body.ticket_id;
    if (!ticket_id) return Response.json({ status: 'error', message: 'Ingresso não informado' }, { status: 400 });

    // 1. Load ticket (service role bypasses Ticket read RLS)
    let ticket = null;
    try { ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id); } catch (_) {}
    if (!ticket) return Response.json({ status: 'error', message: 'Ingresso não encontrado' }, { status: 404 });

    // 2. Access control: owner, organizer of the event, or admin
    const isOwner = String(ticket.created_by_id) === String(user.id);
    const isOrganizer = ticket.organizer_id && String(ticket.organizer_id) === String(user.id);
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isOrganizer && !isAdmin) {
      return Response.json({ status: 'error', message: 'Você não tem autorização para ver este ingresso' }, { status: 403 });
    }

    // 3. Load linked event (service role — works for private events)
    let event = null;
    if (ticket.event_id) {
      try { event = await base44.asServiceRole.entities.Event.get(ticket.event_id); } catch (_) {}
    }

    // 4. Load available perks (menu items) for this event
    let perks = [];
    if (ticket.event_id) {
      try {
        perks = await base44.asServiceRole.entities.VenueMenuItem.filter(
          { event_id: ticket.event_id, is_available: true }, '-price_ftc', 50
        );
      } catch (_) {}
    }

    return Response.json({
      status: 'success',
      ticket: {
        id: ticket.id,
        qr_code: ticket.qr_code,
        event_id: ticket.event_id,
        event_title: ticket.event_title,
        event_date: ticket.event_date,
        event_image: ticket.event_image,
        event_location: ticket.event_location,
        organizer_id: ticket.organizer_id,
        ticket_type: ticket.ticket_type,
        ticket_phase: ticket.ticket_phase,
        price_paid: ticket.price_paid,
        payment_method: ticket.payment_method,
        status: ticket.status,
        checked_in: ticket.checked_in,
        checked_in_at: ticket.checked_in_at,
        festcoin_earned: ticket.festcoin_earned || 0,
        created_date: ticket.created_date
      },
      event: event ? {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        end_date: event.end_date,
        location_name: event.location_name,
        location_address: event.location_address,
        image_url: event.image_url,
        ticket_price: event.ticket_price,
        festcoin_reward: event.festcoin_reward || 0,
        total_capacity: event.total_capacity,
        tickets_sold: event.tickets_sold || 0,
        status: event.status,
        visibility: event.visibility,
        organizer_name: event.organizer_name,
        dj_lineup: event.dj_lineup || [],
        lineup: event.lineup || [],
        schedule: event.schedule || [],
        genre: event.genre
      } : null,
      perks: (perks || []).map(p => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        price_ftc: p.price_ftc,
        category: p.category,
        description: p.description
      }))
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});