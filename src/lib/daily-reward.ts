// Daily reward rules: one claim per 24h, random 1000–5000, most rewards above 2000.
export const DAILY_MIN = 1000;
export const DAILY_MAX = 5000;
export const DAILY_HIGH_FROM = 2001;
export const DAILY_HIGH_CHANCE = 0.8;
export const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** rand1 picks the band (high/low), rand2 picks the amount inside it. */
export function rollDailyReward(rand1: number = Math.random(), rand2: number = Math.random()): number {
  const [lo, hi] = rand1 < DAILY_HIGH_CHANCE ? [DAILY_HIGH_FROM, DAILY_MAX] : [DAILY_MIN, DAILY_HIGH_FROM - 1];
  return lo + Math.floor(Math.min(rand2, 0.999999) * (hi - lo + 1));
}

export function nextClaimAt(lastClaimIso: string | null | undefined): number | null {
  if (!lastClaimIso) return null;
  const next = new Date(lastClaimIso).getTime() + DAILY_COOLDOWN_MS;
  return next > Date.now() ? next : null;
}
