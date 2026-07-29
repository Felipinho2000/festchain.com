// FestChain reward configuration helpers.
// Shared between backend functions and frontend display logic.

export const DEFAULT_FTC_TO_BRL_RATE = 10;   // 10 FTC = R$1,00
export const DEFAULT_EARN_RATE_PERCENT = 5;   // 5% of ticket BRL value earned as FTC

// Returns the global FestChain config, falling back to defaults if no record exists.
// Pass the base44 client (user-scoped or asServiceRole — both can read since RLS read is open).
export async function getFestChainConfig(base44) {
  try {
    const configs = await base44.asServiceRole.entities.FestChainConfig.filter(
      { label: "global" },
      "-created_date",
      1
    );
    if (configs && configs.length > 0) {
      return {
        ftc_to_brl_rate: configs[0].ftc_to_brl_rate || DEFAULT_FTC_TO_BRL_RATE,
        ftc_earn_rate_percent: configs[0].ftc_earn_rate_percent ?? DEFAULT_EARN_RATE_PERCENT,
      };
    }
  } catch (_) {
    // fall through to defaults
  }
  return {
    ftc_to_brl_rate: DEFAULT_FTC_TO_BRL_RATE,
    ftc_earn_rate_percent: DEFAULT_EARN_RATE_PERCENT,
  };
}

// 50 FTC with rate 10 → "R$ 5,00"
export function ftcToBrlString(ftc, rate) {
  const brl = (ftc || 0) / (rate || DEFAULT_FTC_TO_BRL_RATE);
  return `R$ ${brl.toFixed(2).replace(".", ",")}`;
}

// 50 FTC with rate 10 → 500 (cents)
export function ftcToBrlCents(ftc, rate) {
  return Math.round(((ftc || 0) / (rate || DEFAULT_FTC_TO_BRL_RATE)) * 100);
}

// 500 (cents) → "R$ 5,00"
export function centsToBrlString(cents) {
  return `R$ ${((cents || 0) / 100).toFixed(2).replace(".", ",")}`;
}

// Compute confirmed FTC balance from a list of FestCoinTransaction records.
// Only status === "confirmed" counts — never pending or unknown states.
export function computeConfirmedBalance(transactions) {
  return (transactions || [])
    .filter(function (t) { return t.status === "confirmed"; })
    .reduce(function (s, t) {
      if (["earned", "transferred_in", "pilot_topup"].includes(t.type)) return s + (t.amount || 0);
      if (["spent", "transferred_out"].includes(t.type)) return s - (t.amount || 0);
      return s;
    }, 0);
}