// Achievements are derived from stats the bot already pushes, so nothing extra has to be stored.
export type AchStats = { messages: number; voiceMinutes: number; wins: number; credits: number; level: number; items: number; dailyClaims: number };
export type Achievement = { id: string; emoji: string; name: string; desc: string; stat: keyof AchStats; goal: number };

const tier = (stat: keyof AchStats, emoji: string, base: string, unit: string, goals: number[]): Achievement[] =>
  goals.map((goal, i) => ({ id: `${stat}-${goal}`, emoji, name: `${base} ${["I", "II", "III", "IV"][i]}`, desc: `${goal.toLocaleString("en")} ${unit}`, stat, goal }));

export const ACHIEVEMENTS: Achievement[] = [
  ...tier("messages", "💬", "ثرثار", "رسالة", [100, 1000, 10000, 50000]),
  ...tier("voiceMinutes", "🎙️", "صوت السيرفر", "دقيقة فويس", [60, 600, 6000, 30000]),
  ...tier("wins", "🎮", "بطل الألعاب", "فوز", [1, 25, 100, 500]),
  ...tier("credits", "💰", "ثري", "كريدت", [10000, 100000, 1000000, 10000000]),
  ...tier("level", "📈", "متطور", "لفل", [5, 15, 30, 50]),
  ...tier("items", "🛍️", "متسوّق", "عنصر من المتجر", [1, 5, 10, 20]),
  ...tier("dailyClaims", "🎁", "وفي", "مكافأة يومية", [1, 7, 30, 100]),
];

export function progress(stats: AchStats) {
  return ACHIEVEMENTS.map((a) => {
    const value = Math.max(0, stats[a.stat] ?? 0);
    return { ...a, value, done: value >= a.goal, pct: Math.min(100, Math.round((value / a.goal) * 100)) };
  });
}
