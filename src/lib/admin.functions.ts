import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const snowflake = z.string().regex(/^\d{15,21}$/);

// Owner-only: the session's Discord ID must equal the bot owner's ID.
async function ownerGuard() {
  const { requireSession } = await import("./discord.server");
  const { OWNER_ID } = await import("./activity.server");
  const s = await requireSession();
  if (s.uid !== OWNER_ID) throw new Error("FORBIDDEN");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { s, db: supabaseAdmin };
}

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await ownerGuard();
  const { botGuildsFull } = await import("./discord.server");
  const [users, activity, telemetry, board, guilds, jobs] = await Promise.all([
    db.from("site_users").select("*").order("last_login", { ascending: false }).limit(1000),
    db.from("site_activity").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("guild_telemetry").select("guild_id, snapshot, updated_at"),
    db.from("bot_leaderboards").select("snapshot, updated_at").eq("id", "global").maybeSingle(),
    botGuildsFull().catch(() => []),
    db.from("bot_jobs").select("id, guild_id, type, payload, status, result, created_at").eq("type", "admin").order("created_at", { ascending: false }).limit(50),
  ]);
  const tel = new Map((telemetry.data ?? []).map((t) => [t.guild_id, t]));
  const snap = (board.data?.snapshot ?? {}) as { creditTop?: { id: string; name: string; credits: number }[]; streakTop?: { id: string; name: string; streak: number; best: number }[] };
  return {
    users: users.data ?? [],
    activity: activity.data ?? [],
    guilds: guilds.map((g) => {
      const s = (tel.get(g.id)?.snapshot ?? {}) as { members?: number };
      return {
        id: g.id, name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64` : null,
        members: s.members ?? null, lastSync: tel.get(g.id)?.updated_at ?? null,
      };
    }),
    creditTop: snap.creditTop ?? [],
    streakTop: snap.streakTop ?? [],
    jobs: jobs.data ?? [],
  };
});

export const ADMIN_OPS = ["addCredits", "removeCredits", "setCredits", "setLevel", "setXp", "setStreak", "leaveGuild"] as const;
export type AdminOp = (typeof ADMIN_OPS)[number];

// Bot-side state (credits, levels, streaks) lives in the bot, so changes are queued as "admin" jobs.
export const runAdminOp = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      op: z.enum(ADMIN_OPS),
      userId: snowflake.optional(),
      guildId: snowflake.optional(),
      amount: z.number().int().min(0).max(1_000_000_000).default(0),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { s, db } = await ownerGuard();
    if (data.op !== "leaveGuild" && !data.userId) throw new Error("اكتب آيدي العضو");
    if ((data.op === "setLevel" || data.op === "setXp") && !data.guildId) throw new Error("اختر السيرفر");
    if (data.op === "leaveGuild" && !data.guildId) throw new Error("اختر السيرفر");
    const { data: row, error } = await db.from("bot_jobs").insert({
      guild_id: data.guildId ?? "global", type: "admin", created_by: s.uid,
      payload: { op: data.op, user_id: data.userId ?? null, guild_id: data.guildId ?? null, amount: data.amount },
    }).select("id").single();
    if (error || !row) throw new Error("ما قدرنا نرسل الطلب للبوت");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId ?? null, action: `admin:${data.op}`, details: { target: data.userId ?? null, amount: data.amount } });
    return { id: row.id };
  });

export const getAdminJob = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await ownerGuard();
    const { data: row } = await db.from("bot_jobs").select("status, result").eq("id", data.id).maybeSingle();
    return row ?? { status: "missing", result: null };
  });
