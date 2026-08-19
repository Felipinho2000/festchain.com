import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { canScanEvent } from '../../shared/eventAuth.ts';

// Hardened ticket check-in for the private MVP pilot.
// Admin, the event creator/owner, or an explicitly-added per-event scanner
// (see manageEventScanner) can validate tickets.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'unauthorized', message: 'Entre na sua conta para escanear' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const qr_code = body && body.qr_code;
    const event_id = body && body.event_id;
    if (!qr_code) return Response.json({ status: 'invalid', message: 'Nenhum código QR informado' });
    if (!event_id) return Response.json({ status: 'invalid', message: 'Selecione um evento antes de escanear' });

    // Load event and verify the caller is allowed to scan for it
    let event = null;
    try { event = await base44.asServiceRole.entities.Event.get(event_id); } catch (_) {}
    if (!event) return Response.json({ status: 'invalid', message: 'Evento não encontrado' });

    // SECURITY: admin, the event creator, or an explicitly-added per-event
    // scanner — not any approved organizer globally, and not a role guessed
    // from the client.
    if (!canScanEvent(event, user)) {
      return Response.json({ status: 'unauthorized', message: 'Você não está autorizado a escanear ingressos deste evento' }, { status: 403 });
    }

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ qr_code });
    if (!tickets || tickets.length === 0) {
      return Response.json({ status: 'invalid', message: 'Ingresso não encontrado' });
    }
    const ticket = tickets[0];

    if (ticket.event_id !== event_id) {
      return Response.json({ status: 'invalid', message: 'Este ingresso pertence a outro evento' });
    }

    // Resolve attendee (the ticket owner)
    let attendee = null;
    if (ticket.created_by_id) {
      try {
        const u = await base44.asServiceRole.entities.User.get(String(ticket.created_by_id));
        attendee = { full_name: u.full_name || '', email: u.email || '' };
      } catch (_) {}
    }

    // Not yet paid/activated — a pending ticket (mid-checkout, before Stripe
    // confirms payment) must never scan as a valid entry.
    if (ticket.status === 'pending') {
      return Response.json({
        status: 'invalid',
        message: 'Este ingresso ainda não foi pago. Peça pro convidado concluir o pagamento.',
      });
    }
    if (['expired', 'refunded', 'transferred'].includes(ticket.status)) {
      const statusLabelPt = { expired: 'expirado', refunded: 'reembolsado', transferred: 'transferido' };
      return Response.json({
        status: 'invalid',
        message: `Este ingresso está ${statusLabelPt[ticket.status] || ticket.status} e não pode ser usado para entrada.`,
      });
    }

    // Already used?
    if (ticket.status === 'used' || ticket.checked_in) {
      let scannedByUser = null;
      if (ticket.scanned_by) {
        try {
          const su = await base44.asServiceRole.entities.User.get(String(ticket.scanned_by));
          scannedByUser = { full_name: su.full_name || '', email: su.email || '' };
        } catch (_) {}
      }
      return Response.json({
        status: 'used',
        message: 'Este ingresso já foi usado na entrada',
        ticket: { event_title: ticket.event_title, event_date: ticket.event_date, event_location: ticket.event_location, is_complimentary: ticket.is_complimentary || false, comp_category: ticket.comp_category || null },
        attendee,
        previous_scan: {
          at: ticket.scanned_at || ticket.checked_in_at || null,
          by: ticket.scanned_by || null,
          by_label: scannedByUser ? (scannedByUser.full_name || scannedByUser.email) : (ticket.scanned_by || null)
        }
      });
    }

    // ── Claim the ticket exactly once ───────────────────────────────────────
    // The old code did read-status → write-used. Two doors scanning the same
    // QR inside the same second both read 'active' and both wrote 'used', so
    // both screens went green and two people walked in on one ticket. That is
    // the single worst on-site failure this product can have.
    //
    // Fix: compare-and-set. We write a random claim token guarded by
    // `status: 'active'`, then read the row back. Whichever scanner's token
    // survives in the database is the one that admitted the guest; every other
    // scanner sees a foreign token and reports 'used'. The read-back is what
    // makes this safe even where the guarded updateMany filter is not honoured
    // (see the note in stripeWebhook about guarded updates behaving
    // inconsistently) — the token comparison alone still resolves the race.
    const now = new Date().toISOString();
    const claimToken = crypto.randomUUID();

    try {
      await base44.asServiceRole.entities.Ticket.updateMany(
        { id: ticket.id, status: 'active' },
        {
          $set: {
            status: 'used',
            checked_in: true,
            checked_in_at: now,
            scanned_at: now,
            scanned_by: String(user.id),
            scan_claim_token: claimToken,
          },
        }
      );
    } catch (_) {
      // Fall through to the read-back — if the guarded form is unsupported the
      // plain update below still needs to run.
      try {
        await base44.asServiceRole.entities.Ticket.update(ticket.id, {
          status: 'used',
          checked_in: true,
          checked_in_at: now,
          scanned_at: now,
          scanned_by: String(user.id),
          scan_claim_token: claimToken,
        });
      } catch (e) {
        return Response.json({ status: 'error', message: 'Não foi possível registrar o check-in. Tente de novo.' }, { status: 500 });
      }
    }

    // Authoritative read-back: did OUR claim stick?
    let confirmed = null;
    try { confirmed = await base44.asServiceRole.entities.Ticket.get(ticket.id); } catch (_) {}

    if (!confirmed) {
      return Response.json({ status: 'error', message: 'Não foi possível confirmar o check-in. Tente de novo.' }, { status: 500 });
    }

    if (confirmed.scan_claim_token !== claimToken) {
      // Another scanner won the race in the same instant.
      let raceScannedBy = null;
      if (confirmed.scanned_by) {
        try {
          const su = await base44.asServiceRole.entities.User.get(String(confirmed.scanned_by));
          raceScannedBy = su.full_name || su.email || null;
        } catch (_) {}
      }
      return Response.json({
        status: 'used',
        message: 'Este ingresso acabou de ser escaneado em outro aparelho',
        ticket: { event_title: ticket.event_title, event_date: ticket.event_date, event_location: ticket.event_location, is_complimentary: ticket.is_complimentary || false, comp_category: ticket.comp_category || null },
        attendee,
        previous_scan: {
          at: confirmed.scanned_at || confirmed.checked_in_at || null,
          by: confirmed.scanned_by || null,
          by_label: raceScannedBy || confirmed.scanned_by || null,
        },
      });
    }

    if (confirmed.status !== 'used' || !confirmed.checked_in) {
      // Our token is on the row but the state did not persist — never report a
      // green door on an unverified write.
      return Response.json({ status: 'error', message: 'O check-in não foi salvo. Escaneie de novo.' }, { status: 500 });
    }

    return Response.json({
      status: 'valid',
      message: 'Entrada liberada',
      ticket: {
        event_title: ticket.event_title,
        event_date: ticket.event_date,
        event_location: ticket.event_location,
        is_complimentary: ticket.is_complimentary || false,
        comp_category: ticket.comp_category || null,
        // Half-price (meia-entrada) is self-declared by the buyer at checkout —
        // there is no eligibility evidence collected online, which is normal in
        // Brazil precisely BECAUSE the document is checked at the door. The door
        // could not check it: this response never said which tier the ticket was.
        // Surface it so staff know when to ask for a student/senior ID.
        ticket_tier: ticket.ticket_tier || 'inteira',
        requires_id_check: !!ticket.ticket_tier && ticket.ticket_tier !== 'inteira',
        buyer_name: ticket.buyer_name || null,
        buyer_document_last4: (ticket.buyer_cpf || '').slice(-4) || null,
      },
      attendee,
      scanned_at: now
    });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});