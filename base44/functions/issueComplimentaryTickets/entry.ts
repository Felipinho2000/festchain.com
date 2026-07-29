import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Issue complimentary tickets for an event.
// Organizer-ownership verified. Comps consume real capacity.
// price_paid = 0, platform_fee = 0, status = active, zero FestCoin.
// Idempotency enforced via ComplimentaryBatch.idempotency_key.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}

    const {
      event_id,
      ticket_type_id,
      quantity,
      comp_category,
      note,
      recipients,
      idempotency_key,
      confirm_over_cap,
    } = body;

    if (!event_id || !comp_category || !idempotency_key) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validCategories = ['cortesia', 'lista', 'staff', 'artista', 'imprensa', 'parceria'];
    if (!validCategories.includes(comp_category)) {
      return Response.json({ error: 'Invalid category' }, { status: 400 });
    }

    const hasRecipients = recipients && Array.isArray(recipients) && recipients.length > 0;
    const requestedQty = hasRecipients ? recipients.length : parseInt(quantity, 10);
    if (!requestedQty || requestedQty < 1) {
      return Response.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    // Idempotency check — return prior result on repeat
    const existingBatches = await base44.asServiceRole.entities.ComplimentaryBatch.filter({ idempotency_key });
    if (existingBatches.length > 0) {
      const batch = existingBatches[0];
      const tickets = await base44.asServiceRole.entities.Ticket.filter(
        { event_id, issued_by_user_id: String(user.id), is_complimentary: true, comp_category },
        '-created_date',
        requestedQty
      );
      return Response.json({ success: true, batch, tickets, idempotent: true });
    }

    // Verify event ownership
    const isAdmin = user.role === 'admin';
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    if (!isAdmin && String(event.created_by_id) !== String(user.id)) {
      return Response.json({ error: 'Not authorized for this event' }, { status: 403 });
    }

    // Capacity check — comps consume real capacity, never oversell
    const totalCapacity = event.total_capacity || 0;
    const alreadySold = event.tickets_sold || 0;
    if (alreadySold + requestedQty > totalCapacity) {
      return Response.json({
        error: 'not_enough_capacity',
        message: 'Not enough capacity',
        remaining: totalCapacity - alreadySold,
      }, { status: 400 });
    }

    // 20% cap — UI handles the confirmation step
    const existingCompsBatches = await base44.asServiceRole.entities.ComplimentaryBatch.filter({ event_id });
    const existingComps = existingCompsBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const capLimit = Math.ceil(totalCapacity * 0.20);
    if (existingComps + requestedQty > capLimit && !confirm_over_cap) {
      return Response.json({
        error: 'cap_exceeded',
        message: 'Comps exceed 20% of capacity',
        existing_comps: existingComps,
        requested: requestedQty,
        cap: capLimit,
        total_capacity: totalCapacity,
      }, { status: 400 });
    }

    // Generate unique QR codes
    const genCode = () =>
      `FC-COMP-${event_id.slice(-6)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const ticketsToCreate = [];
    const claimCodes = [];

    if (hasRecipients) {
      for (const recipient of recipients) {
        ticketsToCreate.push({
          event_id,
          event_title: event.title,
          event_date: event.date,
          event_image: event.image_url,
          event_location: event.location_name,
          organizer_id: String(event.created_by_id),
          ticket_type: ticket_type_id || 'general',
          price_paid: 0,
          is_complimentary: true,
          comp_category,
          comp_note: note || recipient.name || '',
          issued_by_user_id: String(user.id),
          payment_method: 'test',
          qr_code: genCode(),
          status: 'active',
          fee_percentage_applied: 0,
          platform_fee_cents: 0,
          net_to_organizer_cents: 0,
          festcoin_earned: 0,
          buyer_name: recipient.name || '',
          buyer_email: recipient.email || '',
          buyer_phone: recipient.phone || '',
        });
      }
    } else {
      for (let i = 0; i < requestedQty; i++) {
        const code = genCode();
        claimCodes.push(code);
        ticketsToCreate.push({
          event_id,
          event_title: event.title,
          event_date: event.date,
          event_image: event.image_url,
          event_location: event.location_name,
          organizer_id: String(event.created_by_id),
          ticket_type: ticket_type_id || 'general',
          price_paid: 0,
          is_complimentary: true,
          comp_category,
          comp_note: note || '',
          issued_by_user_id: String(user.id),
          payment_method: 'test',
          qr_code: code,
          status: 'active',
          fee_percentage_applied: 0,
          platform_fee_cents: 0,
          net_to_organizer_cents: 0,
          festcoin_earned: 0,
        });
      }
    }

    const createdTickets = await base44.asServiceRole.entities.Ticket.bulkCreate(ticketsToCreate);

    // Increment event tickets_sold — comps consume real capacity
    await base44.asServiceRole.entities.Event.update(event_id, {
      tickets_sold: alreadySold + requestedQty,
    });

    // Create batch record (audit log)
    const batch = await base44.asServiceRole.entities.ComplimentaryBatch.create({
      event_id,
      event_title: event.title,
      issued_by_user_id: String(user.id),
      ticket_type_id: ticket_type_id || 'general',
      quantity: requestedQty,
      comp_category,
      note: note || '',
      claim_codes: claimCodes,
      idempotency_key,
    });

    return Response.json({ success: true, batch, tickets: createdTickets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});