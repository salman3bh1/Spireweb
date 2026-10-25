// Categories and usage examples for the public commands page.
const GROUPS: { title: string; names: string[] }[] = [
  { title: "الألعاب", names: ["xo", "flags", "roulette", "points", "fast", "fakk", "reverse", "plural", "singular", "math", "riddle", "whois", "password"] },
  { title: "ماينكرافت", names: ["mcstatus", "mcplayer", "mcskin"] },
  { title: "الكريدت والمستويات", names: ["credit", "rank", "top", "profile", "streak", "streak-leaderboard", "invites"] },
  { title: "الإشراف", names: ["ban", "unban", "kick", "clear", "lock", "unlock", "nick", "slowmode", "timeout", "untimeout", "mute", "unmute", "warn", "warnings", "unwarn", "clearwarns", "role", "hide", "unhide"] },
  { title: "الصوت", names: ["vkick", "vmute", "move", "moveme", "moveto", "moveall"] },
  { title: "الموسيقى", names: ["play", "pause", "resume", "skip", "stop", "queue", "loop", "nowplaying", "remove", "volume"] },
];
export const EXAMPLES: Record<string, string> = {
  afk: "/afk reason:نايم", avatar: "/avatar user:@Ali", banner: "/banner user:@Ali", credit: "/credit user:@Ali amount:500",
  xo: "/xo opponent:@Ali  (أو /xo بدون منشن للبطولة)", flags: "/flags", roulette: "/roulette", ban: "/ban user:@Ali reason:سبام",
  kick: "/kick user:@Ali", clear: "/clear amount:50", timeout: "/timeout user:@Ali duration:10m", warn: "/warn user:@Ali reason:سب",
  role: "/role user:@Ali role:@VIP", nick: "/nick user:@Ali name:علي", slowmode: "/slowmode seconds:10", play: "/play query:Fairuz",
  volume: "/volume level:70", mcstatus: "/mcstatus server:play.hypixel.net", mcplayer: "/mcplayer name:Notch", mcskin: "/mcskin name:Notch",
  suggest: "/suggest message:نبي روم ألعاب", poll: "/poll question:نسوي بطولة؟", prayer: "/prayer city:Riyadh", aemoji: "/aemoji emoji:😀",
  moveto: "/moveto channel:#General user:@Ali", moveall: "/moveall from:#Room1 to:#Room2", vkick: "/vkick user:@Ali", vmute: "/vmute user:@Ali",
  gamerank: "/gamerank game:FACEIT name:s1mple", summon: "/summon user:@Ali message:تعال الاجتماع channel:#الإدارة", stickers: "/stickers file:(صورة PNG أو GIF)", whois: "/whois", password: "/password",
};
export function groupCommands<T extends { name: string }>(list: T[]) {
  const used = new Set<string>();
  const out = GROUPS.map((g) => ({ title: g.title, items: list.filter((c) => g.names.includes(c.name) && !used.has(c.name) && used.add(c.name)) }));
  out.push({ title: "عامة", items: list.filter((c) => !used.has(c.name)) });
  return out.filter((g) => g.items.length);
}
export const exampleOf = (name: string) => EXAMPLES[name] ?? `/${name}`;
