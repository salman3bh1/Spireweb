import { z } from "zod";

const identity = { id: z.string().regex(/^\d{15,21}$/), name: z.string().max(100), avatar: z.string().url().regex(/^https:\/\/cdn\.discordapp\.com\//).nullable().optional() };
export const activityRowSchema = z.object({ ...identity, xp: z.number().int().min(0), level: z.number().int().min(0) });
export const creditRowSchema = z.object({ ...identity, credits: z.number().int().min(0) });
export const streakRowSchema = z.object({ ...identity, streak: z.number().int().min(0), best: z.number().int().min(0) });
export const globalLeaderboardSchema = z.object({ creditTop: z.array(creditRowSchema).max(100), streakTop: z.array(streakRowSchema).max(100) });

const snow = z.string().regex(/^\d{15,21}$/);
const counts = z.record(snow, z.number().int().min(0));
const hours = z.array(z.number().int().min(0)).length(24);
export const serverStatsSchema = z.object({
  days: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), h: hours, bh: hours, vh: hours,
    j: z.number().int().min(0), l: z.number().int().min(0), mem: z.number().int().min(0),
    m: counts, bm: counts, c: counts, v: counts, vc: counts, st: counts, cam: counts, mu: counts,
  })).max(31),
  users: z.record(snow, z.object({ name: z.string().max(100), avatar: z.string().regex(/^https:\/\/cdn\.discordapp\.com\//).nullable(), bot: z.boolean() })),
  chans: z.record(snow, z.object({ name: z.string().max(100), category: z.string().max(100).nullable(), categoryId: snow.nullable(), type: z.enum(["text", "voice", "forum", "announcement"]) })),
});
export type ServerStats = z.infer<typeof serverStatsSchema>;

export const telemetrySchema = z.object({
  serverStats: serverStatsSchema.optional().catch(undefined),
  creations: z.record(z.array(z.string().regex(/^\d{15,21}$/))).optional(),
  hourlyMessages: z.array(z.object({ hour: z.string().datetime(), count: z.number().int().min(0) })).max(768).optional(),
  members: z.number().int().min(0),
  voice: z.number().int().min(0),
  boosts: z.number().int().min(0),
  openTickets: z.number().int().min(0),
  dailyMessages: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), count: z.number().int().min(0) })).max(31),
  streakTop: z.array(streakRowSchema).max(100),
  activityTop: z.array(activityRowSchema).max(100).default([]),
  creditTop: z.array(creditRowSchema).max(100).default([]),
  roleJob: z.object({ id: z.string().max(40), status: z.enum(["running", "done", "error"]), done: z.number().int().min(0), total: z.number().int().min(0), error: z.string().max(300).optional() }).nullable().optional(),
});
// Global interaction board pushed by the bot: per period, per mode (both/text/voice).
const interactionRow = z.object({ id: z.string().regex(/^\d{15,21}$/), name: z.string().max(100), avatar: z.string().url().max(400).nullable().optional(), text: z.number().int().min(0), voice: z.number().int().min(0) });
const interactionModes = z.object({ both: z.array(interactionRow).max(100), text: z.array(interactionRow).max(100), voice: z.array(interactionRow).max(100) });
export const interactionBoardsSchema = z.object({ all: interactionModes, month: interactionModes, week: interactionModes, day: interactionModes });
export type InteractionBoards = z.infer<typeof interactionBoardsSchema>;

// Live overview numbers pushed by the bot every few seconds (exact last 24 hours).
const liveUser = z.object({ id: snow, name: z.string().max(100), avatar: z.string().max(400).nullable(), value: z.number().min(0) });
export const liveSchema = z.object({
  members: z.number().int().min(0),
  online: z.number().int().min(0).nullable().optional(),
  voice: z.number().int().min(0),
  boosts: z.number().int().min(0),
  openTickets: z.number().int().min(0).default(0),
  messages24: z.number().int().min(0),
  voiceMinutes24: z.number().int().min(0).default(0),
  active24: z.number().int().min(0),
  topChatters: z.array(liveUser).max(10).default([]),
  topVoice: z.array(liveUser).max(10).default([]),
  topChannels: z.array(z.object({ id: snow, name: z.string().max(100), type: z.enum(["text", "voice"]), messages: z.number().int().min(0), voice: z.number().int().min(0) })).max(10).default([]),
  // Active invite links with who joined through each (bot keeps the last 20 per code).
  invites: z.array(z.object({
    code: z.string().max(40), inviterId: snow.nullable(), inviterName: z.string().max(100), inviterAvatar: z.string().max(400).nullable().default(null),
    channelId: snow.nullable(), channelName: z.string().max(100), uses: z.number().int().min(0), maxUses: z.number().int().min(0), expiresAt: z.string().datetime().nullable(),
    joined: z.array(z.object({ id: snow, name: z.string().max(100), at: z.string().datetime(), left: z.boolean().default(false) })).max(20).default([]),
  })).max(50).default([]),
  events: z.array(z.object({ type: z.enum(["join", "leave"]), id: snow, name: z.string().max(100), username: z.string().max(100).optional(), avatar: z.string().max(400).nullable(), at: z.string().datetime() })).max(30).default([]),
});
export type GuildLive = z.infer<typeof liveSchema>;
