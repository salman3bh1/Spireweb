import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Dashboard music player: the bot pushes its queue state; the site queues "music" bot jobs to control it.
export type MusicTrack = { title: string; author: string; url: string; thumbnail: string; duration: number; source: string; requestedBy?: string };
export type MusicState = {
  playing: boolean; paused: boolean; volume: number; position: number; repeat: "off" | "song" | "queue";
  channel: string | null; current: MusicTrack | null; queue: MusicTrack[]; at: number;
};

const gid = z.string().regex(/^\d{15,21}$/);

export const getMusic = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId, "moderator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("music_state").select("state, updated_at").eq("guild_id", data.guildId).maybeSingle();
    const state = (row?.state ?? null) as MusicState | null;
    // A state older than 30s means the bot left or stopped reporting.
    const fresh = row && Date.now() - new Date(row.updated_at).getTime() < 30_000;
    return { state: fresh ? state : null };
  });

export const musicActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("play"), query: z.string().trim().min(1).max(500), channelId: gid.optional() }),
  z.object({ action: z.enum(["pause", "resume", "skip", "previous", "stop", "shuffle"]) }),
  z.object({ action: z.literal("seek"), seconds: z.number().int().min(0).max(86400) }),
  z.object({ action: z.literal("forward"), seconds: z.number().int().min(-600).max(600) }),
  z.object({ action: z.literal("volume"), value: z.number().int().min(1).max(100) }),
  z.object({ action: z.literal("loop"), mode: z.enum(["off", "song", "queue"]) }),
  z.object({ action: z.literal("remove"), index: z.number().int().min(0).max(500) }),
  z.object({ action: z.literal("jump"), index: z.number().int().min(0).max(500) }),
]);

export const musicControl = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, cmd: musicActionSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId, "moderator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bot_jobs").insert({
      guild_id: data.guildId, type: "music", payload: { ...data.cmd, userId: s.uid, userName: s.name ?? "" }, created_by: s.uid,
    });
    if (error) throw new Error("تعذر إرسال الأمر للبوت");
    return { ok: true };
  });
