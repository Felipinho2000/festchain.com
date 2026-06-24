import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only helper that creates clearly-marked [DEMO] test data for the private pilot.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ status: 'error', message: 'Admin only' }, { status: 403 });

    const event = await base44.asServiceRole.entities.Event.create({
      title: '[DEMO] Sunrise Pilot Night',
      description: 'DEMO / test event for the private pilot — not a real event. Safe to delete.',
      genre: 'techno',
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      location_name: 'Demo Venue — São Paulo',
      location_address: 'São Paulo, SP',
      ticket_price: 40,
      festcoin_reward: 50,
      total_capacity: 100,
      tickets_sold: 0,
      status: 'published',
      organizer_name: 'FestChain Demo',
      dj_lineup: ['Demo DJ A', 'Demo DJ B']
    });

    for (let i = 1; i <= 3; i++) {
      const qr = `FC-DEMO-${event.id}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      await base44.asServiceRole.entities.Ticket.create({
        event_id: event.id,
        event_title: event.title,
        event_date: event.date,
        event_location: event.location_name,
        ticket_type: 'general',
        price_paid: 40,
        payment_method: 'test',
        qr_code: qr,
        status: 'active',
        festcoin_earned: 50,
        created_by_id: String(user.id)
      });
      await base44.asServiceRole.entities.FestCoinTransaction.create({
        type: 'earned',
        amount: 50,
        description: '[DEMO] Pilot reward: ' + event.title,
        status: 'confirmed'
      });
    }

    await base44.asServiceRole.entities.Event.updateMany({ id: event.id }, { $set: { tickets_sold: 3 } });

    return Response.json({ status: 'success', message: 'Demo data created', event_id: event.id });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});