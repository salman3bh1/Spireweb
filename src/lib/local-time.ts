/** Time zone the bot uses when it counts messages per day. */
export const BOT_DAY_ZONE = "Asia/Bahrain";

export type HourCount = { hour: string; count: number };

export function localDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key)?.value ?? "").join("-");
}

export function localMessageDays(hours: HourCount[], timeZone: string) {
  const days = new Map<string, number>();
  for (const item of hours) {
    const key = localDateKey(new Date(item.hour), timeZone);
    days.set(key, (days.get(key) ?? 0) + item.count);
  }
  return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}