import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

// Returns a signed, offline-capable manifest of every valid ticket for an event.
// Ticket codes are HMAC-hashed with a per-manifest key — raw codes never leave
// the server. The manifest expires in 24h so a lost device is not a permanent key.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { event_id } = body;
    if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 });

    // Ownership check — only the event owner (or admin) can pull the full manifest.
    const event = await base44.entities.Event.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (event.created_by_id !== user.id && user.role !== 'admin')
      return Response.json({ error: 'Not authorized for this event' }, { status: 403 });

    // Fetch all valid (active or used) tickets for this event.
    const tickets = await base44.asServiceRole.entities.Ticket.filter(
      { event_id, status: { $in: ['active', 'used'] } }, '-created_date', 2000
    );

    // Per-manifest signing key — shipped to the device so it can hash scanned
    // codes locally and match them against code_hash entries.
    const signingKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(signingKeyBytes);
    const signingKey = Array.from(signingKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Build ticket entries — no raw codes, no full personal data.
    const manifestTickets = [];
    for (const t of tickets) {
      if (!t.qr_code) continue;
      const codeHash = await hmacSHA256(t.qr_code, signingKey);
      const holderFirstName = (t.buyer_name || '').split(' ')[0] || '';
      const docLast4 = (t.buyer_cpf || '').slice(-4) || '';
      manifestTickets.push({
        ticket_id: t.id,
        code_hash: codeHash,
        tier_name: `${t.ticket_type || 'general'}/${t.ticket_tier || 'inteira'}`,
        holder_first_name: holderFirstName,
        holder_doc_last4: docLast4,
        is_complimentary: !!t.is_complimentary,
        comp_category: t.comp_category || null,
      });
    }

    const manifestId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Server signature over manifest metadata — proves the manifest was
    // genuinely issued by FestChain, not forged on a stolen device.
    const sigPayload = `${manifestId}:${event_id}:${now.toISOString()}:${expiresAt.toISOString()}:${manifestTickets.length}`;
    const signature = await hmacSHA256(sigPayload, secrets.get('DOOR_MANIFEST_SECRET'));

    const manifest = {
      manifest_id: manifestId,
      event_id,
      event_title: event.title,
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      signing_key: signingKey,
      ticket_count: manifestTickets.length,
      tickets: manifestTickets,
      signature,
    };

    return Response.json({ manifest });
  } catch (error) {
    console.error('getDoorManifest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function hmacSHA256(message, hexKey) {
  const keyBytes = hexToBytes(hexKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}