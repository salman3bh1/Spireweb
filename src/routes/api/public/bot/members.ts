import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";

const snow = z.string().regex(/^\d{15,21}$/);
const iso = z.string().datetime().nullable().optional();
const memberRow = z.object({
  id: snow, username: z.string().max(100), display_name: z.string().max(100).nullable().optional(),
  avatar: z.string().url().max(300).nullable().optional(), created_at: iso, joined_at: iso,
  booster: z.boolean().optional(), level: z.number().int().min(0).default(0), xp: z.number().int().min(0).default(0),
  messages: z.number().int().min(0).default(0), voice_seconds: z.number().int().min(0).default(0),
  posts: z.number().int().min(0).default(0), invites_total: z.number().int().min(0).default(0),
  invites_left: z.number().int().min(0).default(0), invites_fake: z.number().int().min(0).default(0), muted_until: iso,
});
const punishment = z.object({
  user_id: snow, kind: z.enum(["warn", "mute", "kick", "ban"]), reason: z.string().max(1000).nullable().optional(),
  moderator_id: snow.nullable().optional(), moderator_name: z.string().max(100).nullable().optional(),
  duration_seconds: z.number().int().min(0).nullable().optional(), external_id: z.string().max(80), created_at: z.string().datetime(),
});
const norm = (x: z.infer<typeof punishment>, guild_id: string) => ({
  guild_id, user_id: x.user_id, kind: x.kind, reason: x.reason ?? null, moderator_id: x.moderator_id ?? null,
  moderator_name: x.moderator_name ?? null, duration_seconds: x.duration_seconds ?? null, external_id: x.external_id, created_at: x.created_at,
});
const body = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ban_state"), guild_id: snow, user_id: snow, banned: z.boolean(), username: z.string().max(100).optional(), avatar: z.string().max(300).nullable().optional(), reason: z.string().max(1000).nullable().optional() }),
  z.object({ type: z.literal("mute_state"), guild_id: snow, user_id: snow, muted_until: iso }),
  z.object({ type: z.literal("members"), guild_id: snow, sync_started: z.string().datetime(), final: z.boolean(), members: z.array(memberRow).max(1000) }),
  z.object({ type: z.literal("punishments"), guild_id: snow, items: z.array(punishment).max(500) }),
  z.object({ type: z.literal("warns"), guild_id: snow, items: z.array(punishment).max(5000) }),
  z.object({ type: z.literal("transcript"), guild_id: snow, user_id: snow, channel_id: snow.nullable().optional(), channel_name: z.string().max(100).nullable().optional(), ticket_type: z.string().max(100).nullable().optional(), closed_by: snow.nullable().optional(), opened_at: iso, html: z.string().max(8_000_000) }),
  z.object({
    type: z.literal("invited_members"), guild_id: snow,
    items: z.array(z.object({
      invited_id: snow, inviter_id: snow, joined_at: iso, left_at: iso,
      left_guild: z.boolean().default(false), fake: z.boolean().default(false),
    })).max(1000),
  }),
]);

// The bot pushes member stats, punishments and ticket transcripts here.
export const Route = createFileRoute("/api/public/bot/members")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const p = parsed.data;
        const at = new Date().toISOString();
        if (p.type === "ban_state") {
          const { error } = await db.from("member_stats").upsert({ guild_id: p.guild_id, user_id: p.user_id, banned: p.banned, ...(p.banned ? { in_guild: false } : {}), ...(p.username ? { username: p.username } : {}), ...(p.avatar !== undefined ? { avatar: p.avatar } : {}), banned_at: p.banned ? at : null, ban_reason: p.banned ? p.reason ?? null : null, updated_at: at });
          if (error) return new Response("DB error", { status: 500 });
        } else if (p.type === "mute_state") {
          const { error } = await db.from("member_stats").update({ muted_until: p.muted_until ?? null, updated_at: at }).eq("guild_id", p.guild_id).eq("user_id", p.user_id);
          if (error) return new Response("DB error", { status: 500 });
        } else if (p.type === "members") {
          if (p.members.length) {
            const { error } = await db.from("member_stats").upsert(p.members.map((m) => ({
              guild_id: p.guild_id, user_id: m.id, username: m.username, display_name: m.display_name ?? null, avatar: m.avatar ?? null,
              created_at_discord: m.created_at ?? null, joined_at: m.joined_at ?? null, in_guild: true, is_booster: !!m.booster,
              level: m.level, xp: m.xp, messages: m.messages, voice_seconds: m.voice_seconds, posts: m.posts,
              invites_total: m.invites_total, invites_left: m.invites_left, invites_fake: m.invites_fake, muted_until: m.muted_until ?? null, updated_at: at,
            })));
            if (error) return new Response("DB error", { status: 500 });
          }
          if (p.final) await db.from("member_stats").update({ in_guild: false }).eq("guild_id", p.guild_id).lt("updated_at", p.sync_started);
        } else if (p.type === "punishments") {
          if (p.items.length) {
            const { error } = await db.from("member_punishments").upsert(p.items.map((x) => norm(x, p.guild_id)), { onConflict: "guild_id,external_id", ignoreDuplicates: true });
            if (error) { console.error(error); return new Response("DB error", { status: 500 }); }
          }
        } else if (p.type === "warns") {
          // Bot storage is authoritative for warnings (supports unwarn / clearwarns).
          await db.from("member_punishments").delete().eq("guild_id", p.guild_id).eq("kind", "warn");
          if (p.items.length) {
            const { error } = await db.from("member_punishments").insert(p.items.map((x) => norm(x, p.guild_id)));
            if (error) { console.error(error); return new Response("DB error", { status: 500 }); }
          }
        } else if (p.type === "invited_members") {
          if (p.items.length) {
            const { error } = await db.from("member_invites").upsert(p.items.map((x) => ({
              guild_id: p.guild_id, invited_id: x.invited_id, inviter_id: x.inviter_id,
              joined_at: x.joined_at ?? null, left_at: x.left_at ?? null,
              left_guild: x.left_guild, fake: x.fake, updated_at: at,
            })));
            if (error) { console.error(error); return new Response("DB error", { status: 500 }); }
          }
        } else {
          const { error } = await db.from("ticket_transcripts").insert({
            guild_id: p.guild_id, user_id: p.user_id, channel_id: p.channel_id ?? null, channel_name: p.channel_name ?? null,
            ticket_type: p.ticket_type ?? null, closed_by: p.closed_by ?? null, opened_at: p.opened_at ?? null, html: p.html,
          });
          if (error) return new Response("DB error", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
