import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Transfers a single-use ticket to another registered FestChain user.
//
// Same row, new owner: created_by_id is reassigned server-side. Service-role
// UPDATE honors an explicit created_by_id even though service-role CREATE does
// not (see the reassignment step in issueComplimentaryTickets for the same
// pattern) — so this never needs to fabricate a second ticket row, which would
// double-count capacity/analytics for one physical entry.
//
// A fresh qr_code is issued in the same write, which is what makes the old
// QR — whatever is printed, screenshotted, or cached in the previous owner's
// browser — stop matching any ticket the moment the transfer completes.
// validateTicket looks tickets up by qr_code, so an old code simply resolves
// to "not found" from then on.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ status: 'error', message: 'Entre na sua conta para transferir um ingresso' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const ticket_id = body && body.ticket_id;
    const recipient_email = String((body && body.recipient_email) || '').trim().toLowerCase();

    if (!ticket_id) return Response.json({ status: 'error', message: 'Ingresso não informado' }, { status: 400 });
    if (!recipient_email) return Response.json({ status: 'error', message: 'Informe o e-mail de quem vai receber o ingresso' }, { status: 400 });

    const ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id).catch(() => null);
    if (!ticket) return Response.json({ status: 'error', message: 'Ingresso não encontrado' }, { status: 404 });

    // Only the current owner can start a transfer — not the organizer, not an
    // admin acting casually. This mirrors Ticket RLS read (owner/organizer/
    // admin) but transfer specifically is an owner-only action.
    if (String(ticket.created_by_id) !== String(user.id)) {
      return Response.json({ status: 'error', message: 'Este ingresso não é seu' }, { status: 403 });
    }
    if (ticket.status !== 'active') {
      return Response.json({ status: 'error', message: `Este ingresso está "${ticket.status}" e não pode ser transferido.` }, { status: 400 });
    }
    if (ticket.checked_in) {
      return Response.json({ status: 'error', message: 'Este ingresso já foi usado na entrada e não pode ser transferido.' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.User.filter({ email: recipient_email });
    if (!matches || matches.length !== 1) {
      return Response.json({
        status: 'error',
        code: 'recipient_not_found',
        message: 'Essa pessoa ainda não tem conta na FestChain. Peça para ela criar uma conta primeiro e tente de novo.',
      }, { status: 404 });
    }
    const recipient = matches[0];
    if (String(recipient.id) === String(user.id)) {
      return Response.json({ status: 'error', message: 'Você já é o dono deste ingresso.' }, { status: 400 });
    }

    const genCode = () =>
      `FC-${String(ticket.event_id || '').slice(-6)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const newQr = genCode();
    const claimToken = crypto.randomUUID();

    // ── Claim the ticket exactly once ───────────────────────────────────────
    // Same compare-and-set shape as validateTicket's check-in claim: a plain
    // update() here would happily overwrite an in-flight check-in (or a
    // second, concurrent transfer request) with stale assumptions. The
    // guarded updateMany only applies our write while status is still
    // 'active'; the read-back below confirms OUR claim token actually landed
    // before we report success, so a scan or a duplicate transfer that wins
    // the race is reported honestly instead of silently overwritten.
    try {
      await base44.asServiceRole.entities.Ticket.updateMany(
        { id: ticket.id, status: 'active' },
        {
          $set: {
            created_by_id: recipient.id,
            qr_code: newQr,
            // The half-price/ID-check fields belonged to the previous
            // holder's document, not the new one's — carrying them forward
            // would show staff the wrong person's name/CPF at the door.
            buyer_name: recipient.full_name || '',
            buyer_email: recipient.email || '',
            buyer_phone: '',
            buyer_cpf: '',
            transferred_from_user_id: String(user.id),
            transferred_at: new Date().toISOString(),
            scan_claim_token: claimToken,
          },
        }
      );
    } catch (_) {
      // Guarded updateMany has behaved inconsistently on this platform (see
      // validateTicket) — fall through to a plain update; the read-back below
      // is what actually verifies correctness either way.
      try {
        await base44.asServiceRole.entities.Ticket.update(ticket.id, {
          created_by_id: recipient.id,
          qr_code: newQr,
          buyer_name: recipient.full_name || '',
          buyer_email: recipient.email || '',
          buyer_phone: '',
          buyer_cpf: '',
          transferred_from_user_id: String(user.id),
          transferred_at: new Date().toISOString(),
          scan_claim_token: claimToken,
        });
      } catch (e) {
        return Response.json({ status: 'error', message: 'Não foi possível transferir o ingresso. Tente de novo.' }, { status: 500 });
      }
    }

    const confirmed = await base44.asServiceRole.entities.Ticket.get(ticket.id).catch(() => null);
    if (!confirmed) {
      return Response.json({ status: 'error', message: 'Não foi possível confirmar a transferência. Tente de novo.' }, { status: 500 });
    }
    if (confirmed.scan_claim_token !== claimToken) {
      // Someone else's write landed on this row after our read — either the
      // ticket got scanned at the door, or another transfer request for the
      // same ticket won the race. Never report success on a write that
      // didn't actually stick.
      return Response.json({
        status: 'error',
        message: 'Este ingresso mudou de estado enquanto a transferência era processada (pode ter sido usado na entrada, ou outra transferência já foi feita). Atualize a página e confira o status atual.',
      }, { status: 409 });
    }
    if (String(confirmed.created_by_id) !== String(recipient.id) || confirmed.qr_code !== newQr) {
      return Response.json({ status: 'error', message: 'A transferência não foi concluída corretamente. Tente de novo.' }, { status: 500 });
    }

    return Response.json({ status: 'success', message: 'Ingresso transferido com sucesso' });
  } catch (error) {
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});
