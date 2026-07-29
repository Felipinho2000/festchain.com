// Frontend-facing FestChain reward helpers.
// Mirrors the pure-function subset of base44/shared/rewardConfig.ts.

export const DEFAULT_FTC_TO_BRL_RATE = 10;
export const DEFAULT_EARN_RATE_PERCENT = 5;

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