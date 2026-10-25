import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ticketSchema } from "./tickets.schema";

const gid = z.string().regex(/^\d{15,21}$/);
const snow = z.string().regex(/^\d{15,21}$/);
const name = z.string().trim().min(1).max(90);
const mode = z.enum(["another", "replace", "edit"]).optional();

export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 5;
export const pollPayloadSchema = z.object({
  channelId: snow,
  question: z.string().trim().min(1, "اكتب سؤال التصويت").max(300),
  options: z.array(z.object({ text: z.string().trim().min(1).max(55), emoji: z.string().trim().max(64).default("") }))
    .min(POLL_MIN_OPTIONS, "لازم خيارين على الأقل").max(POLL_MAX_OPTIONS, "الحد الأقصى 5 خيارات"),
  duration: z.string().trim().regex(/^(\d+\s*[smhdw]\s*)+$/i, "المدة غلط — مثال: 1h, 1d").max(30),
  multiple: z.boolean().default(false),
  mention: z.enum(["none", "everyone", "here"]).or(snow).default("none"),
  mode: z.undefined().optional(),
});

export const jobSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stats"), payload: z.object({ category: name, members: name, voice: name, boosts: name, enabled: z.array(z.enum(["members", "voice", "boosts"])).min(1).default(["members", "voice", "boosts"]), mode }) }),
  z.object({ type: z.literal("logs"), payload: z.object({ category: name, mode, channels: z.array(z.object({ key: z.string().max(20), name })).min(1).max(10) }) }),
  z.object({ type: z.literal("tempvoice"), payload: z.object({
    category: name, edit: name, create: name, template: name, mode,
    allowed: z.array(snow).max(25), blocked: z.array(snow).max(25),
  }) }),
  z.object({ type: z.literal("giveaway"), payload: z.object({
    channelId: snow, mode: z.enum(["button", "reaction"]).default("button"),
    prize: z.string().trim().min(1).max(200), winners: z.number().int().min(1).max(50),
    duration: z.string().trim().regex(/^(\d+\s*[smhdw]\s*)+$/i, "المدة غلط — مثال: 10m, 2h, 1d").max(30),
    description: z.string().max(1000).default(""),
    image: z.string().url().max(500).or(z.literal("")).default(""), thumb: z.string().url().max(500).or(z.literal("")).default(""),
  }) }),
  z.object({ type: z.literal("poll"), payload: pollPayloadSchema }),
  z.object({ type: z.literal("selfroles"), payload: z.object({
    channelId: snow, kind: z.enum(["buttons", "select", "reactions"]),
    title: z.string().trim().max(256).default(""), description: z.string().max(4000).default(""), content: z.string().max(2000).default(""),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#f5b324"), image: z.string().url().max(500).or(z.literal("")).default(""),
    placeholder: z.string().max(150).default(""), mode: z.undefined().optional(),
    roles: z.array(z.object({ roleId: snow, label: z.string().max(80).default(""), emoji: z.string().max(64).default(""), description: z.string().max(100).default(""), style: z.enum(["primary", "secondary", "success", "danger"]).default("secondary") })).min(1).max(25),
  }) }),
  z.object({ type: z.literal("ticket"), payload: z.object({ channelId: snow, mode, ticket: ticketSchema.optional() }) }),
]);

export const createJob = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, job: jobSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, guildChannels } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [channels, snapshot, active] = await Promise.all([
      guildChannels(data.guildId),
      supabaseAdmin.from("guild_telemetry").select("snapshot").eq("guild_id", data.guildId).maybeSingle(),
      supabaseAdmin.from("bot_jobs").select("id").eq("guild_id", data.guildId).eq("type", data.job.type).in("status", ["pending", "running"]).limit(1),
    ]);
    if (snapshot.error || active.error) throw new Error("تعذر فحص الطلبات الحالية");
    const job = data.job;
    const { logActivity } = await import("./activity.server");
    const audit = () => logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: `create:${job.type}`, details: { mode: job.payload.mode ?? "create" } });
    if (job.type === "giveaway" || job.type === "poll" || job.type === "selfroles") {
      const ch = channels.find((c) => c.id === job.payload.channelId);
      if (!ch || (ch.type !== 0 && ch.type !== 5)) throw new Error("اختر روم كتابي صحيح");
      const { error } = await supabaseAdmin.from("bot_jobs").insert({ guild_id: data.guildId, type: job.type, payload: { ...job.payload, host: s.uid }, created_by: s.uid });
      if (error) { console.error(error); throw new Error("Save failed"); }
      await audit();
      return { ok: true, requiresConfirmation: false };
    }
    if (active.data?.length) throw new Error("يوجد طلب قيد التنفيذ لهذا النوع، انتظر حتى ينتهي");
    if (data.job.type === "ticket") {
      const ch = channels.find((c) => c.id === (data.job.payload as { channelId: string }).channelId);
      if (!ch || (ch.type !== 0 && ch.type !== 5)) throw new Error("اختر روم كتابي صحيح");
      const row = await supabaseAdmin.from("guild_settings").select("ticket").eq("guild_id", data.guildId).maybeSingle();
      if (row.error) throw new Error("تعذر قراءة إعدادات التذاكر");
      const { error } = await supabaseAdmin.from("bot_jobs").insert({
        guild_id: data.guildId, type: "ticket", payload: { ...data.job.payload, ticket: data.job.payload.ticket ?? row.data?.ticket ?? {} }, created_by: s.uid,
      });
      if (error) { console.error(error); throw new Error("Save failed"); }
      await audit();
      return { ok: true, requiresConfirmation: false };
    }
    const parsed = z.object({ creations: z.record(z.array(z.string())).optional() }).safeParse(snapshot.data?.snapshot);
    const ids = parsed.success ? parsed.data.creations?.[data.job.type] ?? [] : [];
    const exists = channels.some(c => ids.includes(c.id) || (c.type === 4 && c.name === (data.job.payload as { category: string }).category));
    if (exists && !data.job.payload.mode) return { ok: false, requiresConfirmation: true };
    const { error } = await supabaseAdmin.from("bot_jobs").insert({
      guild_id: data.guildId, type: data.job.type, payload: data.job.payload, created_by: s.uid,
    });
    if (error) { console.error(error); throw new Error("Save failed"); }
    await audit();
    return { ok: true, requiresConfirmation: false };
  });

export const listJobs = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, guildChannels } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("bot_jobs")
      .select("id, type, status, result, created_at").eq("guild_id", data.guildId)
      .order("created_at", { ascending: false }).limit(10);
    if (error) throw new Error("تعذر تحميل الطلبات");
    return rows ?? [];
  });
