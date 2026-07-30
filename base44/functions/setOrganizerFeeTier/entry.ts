import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { STANDARD_FEE_PERCENTAGE, PILOT_FEE_PERCENTAGE } from '../../shared/feeLogic.ts';

// Admin-only: set an organizer's fee tier.
//
//  - tier 'pilot':  fee_tier 'pilot', pilot_started_at = first_event_date or now,
//                    pilot_expires_at = exactly 12 months later, fee_percentage LEFT AT 8.0.
//                    The 5% comes from the tier + the dates, never from the stored number —
//                    that is what makes it expire and what makes it auditable.
//  - tier 'standard': fee_tier 'standard', fee_percentage 8.0, both pilot dates nulled.
//
// Rejected unless the caller is an admin.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'admin_only', message: 'Only admins can set fee tiers.' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { organizer_user_id, tier, first_event_date } = body;

    if (!organizer_user_id || typeof organizer_user_id !== 'string') {
      return Response.json({ error: 'organizer_user_id is required' }, { status: 400 });
    }
    if (tier !== 'pilot' && tier !== 'standard') {
      return Response.json({ error: 'tier must be "pilot" or "standard"' }, { status: 400 });
    }

    // Resolve the organizer's account (create with defaults if missing).
    const existing = await base44.asServiceRole.entities.OrganizerAccount.filter(
      { user_id: organizer_user_id }, null, 1
    );
    const account = existing && existing.length > 0 ? existing[0] : null;

    let updateData: any;

    if (tier === 'pilot') {
      const startedAt = first_event_date
        ? new Date(first_event_date).toISOString()
        : new Date().toISOString();
      const start = new Date(startedAt);
      const expires = new Date(start);
      expires.setUTCMonth(expires.getUTCMonth() + 12);
      updateData = {
        fee_tier: 'pilot',
        pilot_started_at: startedAt,
        pilot_expires_at: expires.toISOString(),
        // fee_percentage is deliberately left untouched — the effective 5% is
        // derived from tier + dates inside getEffectiveFeePercentage, not stored.
      };
    } else {
      updateData = {
        fee_tier: 'standard',
        fee_percentage: STANDARD_FEE_PERCENTAGE,
        pilot_started_at: null,
        pilot_expires_at: null,
      };
    }

    let record: any;
    if (account) {
      record = await base44.asServiceRole.entities.OrganizerAccount.update(account.id, updateData);
    } else {
      record = await base44.asServiceRole.entities.OrganizerAccount.create({
        user_id: organizer_user_id,
        legal_name: '',
        tax_id: '',
        fee_percentage: STANDARD_FEE_PERCENTAGE,
        fee_paid_by: 'organizer',
        payout_pix_key: null,
        payout_pix_key_type: null,
        ...updateData,
      });
    }

    return Response.json({ success: true, account: record });
  } catch (error) {
    console.error('setOrganizerFeeTier error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});