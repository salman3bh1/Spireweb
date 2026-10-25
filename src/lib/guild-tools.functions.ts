// Per-server dashboard roles (owner grants manager/moderator) and scheduled announcements.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { REPEATS } from "./schedule";

const gid = z.string().regex(/^\d{15,21}$/);
const snow = z.string().regex(/^\d{15,21}$/);

async function guard(guildId: string, need: "manager" | "owner") {
  const { requireSession, assertGuildAccess } = await import("./discord.server");
  const s = await requireSession();
  await assertGuildAccess(s, guildId, need);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { s, db: supabaseAdmin };
}

// ===== Dashboard roles =====
export const listAccess = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId, "owner");
    const { data: rows, error } = await db.from("dashboard_access").select("user_id, role, username, created_at").eq("guild_id", data.guildId).order("created_at");
    if (error) throw new Error("تعذر تحميل الصلاحيات");
    return rows ?? [];
  });

export const setAccess = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, userId: snow, role: z.enum(["moderator", "manager"]).nullable() }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await guard(data.guildId, "owner");
    if (data.userId === s.uid) throw new Error("ما تقدر تغيّر صلاحيتك");
    if (!data.role) {
      await db.from("dashboard_access").delete().eq("guild_id", data.guildId).eq("user_id", data.userId);
      return { ok: true };
    }
    const m = await db.from("member_stats").select("username, display_name").eq("guild_id", data.guildId).eq("user_id", data.userId).maybeSingle();
    const { error } = await db.from("dashboard_access").upsert({
      guild_id: data.guildId, user_id: data.userId, role: data.role, granted_by: s.uid,
      username: m.data?.display_name ?? m.data?.username ?? null,
    });
    if (error) throw new Error("تعذر الحفظ");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "access:grant", details: { user: data.userId, role: data.role } });
    return { ok: true };
  });

// ===== Scheduled announcements (bot jobs that wait until run_after) =====
export const announceSchema = z.object({
  channelId: snow,
  title: z.string().trim().max(256).default(""),
  message: z.string().trim().min(1, "اكتب نص الإعلان").max(4000),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#e7b448"),
  image: z.string().url().max(500).or(z.literal("")).default(""),
  mention: z.enum(["none", "everyone", "here"]).default("none"),
  repeat: z.enum(REPEATS).default("none"),
});

export const listScheduled = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId, "manager");
    const { data: rows, error } = await db.from("bot_jobs").select("id, payload, status, result, run_after, created_at")
      .eq("guild_id", data.guildId).eq("type", "announce").order("run_after", { ascending: false }).limit(30);
    if (error) throw new Error("تعذر تحميل الإعلانات");
    return rows ?? [];
  });

export const scheduleAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, at: z.string().datetime(), payload: announceSchema }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await guard(data.guildId, "manager");
    const at = new Date(data.at);
    if (at.getTime() < Date.now() - 60_000) throw new Error("اختر وقت بالمستقبل");
    const { guildChannels } = await import("./discord.server");
    const ch = (await guildChannels(data.guildId)).find((c) => c.id === data.payload.channelId);
    if (!ch || (ch.type !== 0 && ch.type !== 5)) throw new Error("اختر روم كتابي صحيح");
    const { error } = await db.from("bot_jobs").insert({ guild_id: data.guildId, type: "announce", payload: data.payload, created_by: s.uid, run_after: at.toISOString() });
    if (error) throw new Error("تعذر جدولة الإعلان");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "create:announce", details: { at: at.toISOString(), repeat: data.payload.repeat } });
    return { ok: true };
  });

export const cancelScheduled = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId, "manager");
    const { error } = await db.from("bot_jobs").delete().eq("id", data.id).eq("guild_id", data.guildId).eq("type", "announce").eq("status", "pending");
    if (error) throw new Error("تعذر الإلغاء");
    return { ok: true };
  });


export const searchGuildMembers = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid, q: z.string().trim().min(2).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId, "owner");
    const q = data.q.replace(/[%,()]/g, "");
    const base = db.from("member_stats").select("user_id, username, display_name, avatar").eq("guild_id", data.guildId).eq("in_guild", true).limit(8);
    const { data: rows } = /^\d{15,21}$/.test(q) ? await base.eq("user_id", q) : await base.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    return rows ?? [];
  });
