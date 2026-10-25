// Repeat rules for scheduled announcements.
export const REPEATS = ["none", "daily", "weekly"] as const;
export type Repeat = (typeof REPEATS)[number];

/** Next run for a repeating announcement, or null when it runs once. */
export function nextRun(from: Date, repeat: Repeat, now = new Date()) {
  if (repeat === "none") return null;
  const step = (repeat === "daily" ? 1 : 7) * 86_400_000;
  let t = from.getTime() + step;
  while (t <= now.getTime()) t += step; // skip runs missed while the bot was offline
  return new Date(t);
}
