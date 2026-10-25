import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const gid = z.string().regex(/^\d{15,21}$/);
const uid = z.string().regex(/^\d{15,21}$/);
export const MEMBER_FILTERS = ["all", "muted", "warned", "new", "posters", "banned"] as const;
export type MemberFilter = (typeof MEMBER_FILTERS)[number];
const DAY = 86_400_000;
/** Members who joined within this many days count as "new". */
export const NEW_MEMBER_DAYS = 7;
export const PAGE_SIZE = 50;

async function guard(guildId: string) {
  const { requireSession, assertGuildAccess } = await import("./discord.server");
  const s = await requireSession();
  await assertGuildAccess(s, guildId, "moderator");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { s, db: supabaseAdmin };
}

export const getMembersOverview = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ guildId: gid, filter: z.enum(MEMBER_FILTERS).default("all"), q: z.string().max(80).default(""), page: z.number().int().min(0).default(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId);
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
    const [pun, totalIn, mutedNow, newCount, posters, banned] = await Promise.all([
      db.from("member_punishments").select("user_id, kind, created_at").eq("guild_id", data.guildId).limit(20000),
      db.from("member_stats").select("user_id", { count: "exact", head: true }).eq("guild_id", data.guildId).eq("in_guild", true),
      db.from("member_stats").select("user_id", { count: "exact", head: true }).eq("guild_id", data.guildId).eq("in_guild", true).gt("muted_until", now.toISOString()),
      db.from("member_stats").select("user_id", { count: "exact", head: true }).eq("guild_id", data.guildId).eq("in_guild", true).gt("joined_at", new Date(now.getTime() - NEW_MEMBER_DAYS * DAY).toISOString()),
      db.from("member_stats").select("user_id", { count: "exact", head: true }).eq("guild_id", data.guildId).eq("in_guild", true).eq("is_booster", true),
      db.from("member_stats").select("user_id", { count: "exact", head: true }).eq("guild_id", data.guildId).eq("banned", true),
    ]);
    const rows = pun.data ?? [];
    const counts = { warn: 0, mute: 0, kick: 0, ban: 0 } as Record<string, number>;
    const recent = { warn: 0, mute: 0, kick: 0, ban: 0 } as Record<string, number>;
    const perUser = new Map<string, { warn: number; mute: number; kick: number; ban: number }>();
    for (const r of rows) {
      counts[r.kind] = (counts[r.kind] ?? 0) + 1;
      if (r.created_at >= since30) recent[r.kind] = (recent[r.kind] ?? 0) + 1;
      const u = perUser.get(r.user_id) ?? { warn: 0, mute: 0, kick: 0, ban: 0 };
      u[r.kind as "warn"]++;
      perUser.set(r.user_id, u);
    }
    const warnedIds = [...perUser.entries()].filter(([, v]) => v.warn > 0).map(([k]) => k);
    const topIds = [...perUser.entries()]
      .map(([id, v]) => ({ id, ...v, total: v.warn + v.mute + v.kick + v.ban }))
      .sort((a, b) => b.total - a.total || b.ban - a.ban)
      .slice(0, 10);

    let q = db.from("member_stats").select("user_id, username, display_name, avatar, created_at_discord, joined_at, is_booster, muted_until, posts, level, invites_total, invites_left, invites_fake", { count: "exact" })
      .eq("guild_id", data.guildId);
    q = data.filter === "banned" ? q.eq("banned", true) : q.eq("in_guild", true);
    if (data.filter === "muted") q = q.gt("muted_until", now.toISOString());
    if (data.filter === "new") q = q.gt("joined_at", new Date(now.getTime() - NEW_MEMBER_DAYS * DAY).toISOString());
    if (data.filter === "posters") q = q.eq("is_booster", true);
    if (data.filter === "warned") q = q.in("user_id", warnedIds.length ? warnedIds.slice(0, 500) : ["0"]);
    const term = data.q.trim().replace(/[%,()]/g, "");
    if (term) q = /^\d{15,21}$/.test(term) ? q.eq("user_id", term) : q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
    q = q.order("joined_at", { ascending: false, nullsFirst: false });
    const list = await q.range(data.page * PAGE_SIZE, data.page * PAGE_SIZE + PAGE_SIZE - 1);

    const topProfiles = topIds.length
      ? (await db.from("member_stats").select("user_id, username, display_name, avatar").eq("guild_id", data.guildId).in("user_id", topIds.map((t) => t.id))).data ?? []
      : [];
    const pmap = new Map(topProfiles.map((p) => [p.user_id, p]));

    // Activity rankings: chat messages, voice time (from member_stats) and credits (from the bot's telemetry snapshot).
    const prof = "user_id, username, display_name, avatar";
    const [chatTop, voiceTop, tel] = await Promise.all([
      db.from("member_stats").select(`${prof}, messages`).eq("guild_id", data.guildId).eq("in_guild", true).gt("messages", 0).order("messages", { ascending: false }).limit(10),
      db.from("member_stats").select(`${prof}, voice_seconds`).eq("guild_id", data.guildId).eq("in_guild", true).gt("voice_seconds", 0).order("voice_seconds", { ascending: false }).limit(10),
      db.from("guild_telemetry").select("snapshot").eq("guild_id", data.guildId).maybeSingle(),
    ]);
    const who = (m: { user_id: string; username: string | null; display_name: string | null; avatar: string | null }) =>
      ({ id: m.user_id, name: m.display_name ?? m.username ?? m.user_id, username: m.username, avatar: m.avatar });
    const snap = (tel.data?.snapshot ?? {}) as { creditTop?: { id: string; name: string; avatar?: string | null; credits: number }[] };

    return {
      totals: { members: totalIn.count ?? 0, mutedNow: mutedNow.count ?? 0, newMembers: newCount.count ?? 0, posters: posters.count ?? 0, warned: warnedIds.length, banned: banned.count ?? 0 },
      counts, recent,
      top: topIds.map((t) => ({ ...t, name: pmap.get(t.id)?.display_name ?? pmap.get(t.id)?.username ?? t.id, username: pmap.get(t.id)?.username ?? null, avatar: pmap.get(t.id)?.avatar ?? null })),
      members: (list.data ?? []).map((m) => ({ ...m, warns: perUser.get(m.user_id)?.warn ?? 0 })),
      total: list.count ?? 0,
      topChat: (chatTop.data ?? []).map((m) => ({ ...who(m), value: m.messages })),
      topVoice: (voiceTop.data ?? []).map((m) => ({ ...who(m), value: Number(m.voice_seconds) })),
      topCredits: (snap.creditTop ?? []).slice(0, 10).map((c) => ({ id: c.id, name: c.name, username: null as string | null, avatar: c.avatar ?? null, value: c.credits })),
    };
  });

export const getMemberProfile = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid, userId: uid }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId);
    const { guildChannels } = await import("./discord.server");
    const [stat, pun, notes, tickets, channels] = await Promise.all([
      db.from("member_stats").select("*").eq("guild_id", data.guildId).eq("user_id", data.userId).maybeSingle(),
      db.from("member_punishments").select("id, kind, reason, moderator_id, moderator_name, duration_seconds, created_at").eq("guild_id", data.guildId).eq("user_id", data.userId).order("created_at", { ascending: false }).limit(500),
      db.from("member_notes").select("id, author_name, body, created_at").eq("guild_id", data.guildId).eq("user_id", data.userId).order("created_at", { ascending: false }),
      db.from("ticket_transcripts").select("id, channel_id, channel_name, ticket_type, closed_by, opened_at, closed_at").eq("guild_id", data.guildId).eq("user_id", data.userId).order("closed_at", { ascending: false }),
      guildChannels(data.guildId).catch(() => []),
    ]);
    // Open tickets live in Discord: the bot stores "ticket:<ownerId>:..." in the channel topic.
    const openTickets = channels
      .filter((c) => (c.topic ?? "").startsWith(`ticket:${data.userId}:`))
      .map((c) => ({ id: c.id, name: c.name }));
    // One transcript per channel (a ticket closed twice keeps its latest copy).
    const seen = new Set<string>();
    const closedTickets = (tickets.data ?? []).filter((t) => {
      const k = t.channel_id ?? t.id;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    const st = stat.data;
    let levelRank: number | null = null;
    if (st) {
      const { count } = await db.from("member_stats").select("user_id", { count: "exact", head: true }).eq("guild_id", data.guildId).gt("xp", st.xp);
      levelRank = (count ?? 0) + 1;
    }
    // Members this user invited (synced from the bot's invite tracking).
    const inv = await db.from("member_invites").select("invited_id, joined_at, left_at, left_guild, fake")
      .eq("guild_id", data.guildId).eq("inviter_id", data.userId).order("joined_at", { ascending: false, nullsFirst: false }).limit(200);
    const invRows = inv.data ?? [];
    const invIds = invRows.map((r) => r.invited_id);
    const invProfiles = invIds.length
      ? (await db.from("member_stats").select("user_id, username, display_name, avatar").eq("guild_id", data.guildId).in("user_id", invIds)).data ?? []
      : [];
    const invMap = new Map(invProfiles.map((p) => [p.user_id, p]));
    const invitedMembers = invRows.map((r) => ({
      id: r.invited_id,
      name: invMap.get(r.invited_id)?.display_name ?? invMap.get(r.invited_id)?.username ?? null,
      username: invMap.get(r.invited_id)?.username ?? null,
      avatar: invMap.get(r.invited_id)?.avatar ?? null,
      joined_at: r.joined_at, left_at: r.left_at, left: r.left_guild, fake: r.fake,
    }));
    return { member: st, levelRank, punishments: pun.data ?? [], notes: notes.data ?? [], tickets: closedTickets, openTickets, invitedMembers };
  });

export const addMemberNote = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, userId: uid, body: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await guard(data.guildId);
    const { error } = await db.from("member_notes").insert({ guild_id: data.guildId, user_id: data.userId, author_id: s.uid, author_name: s.name, body: data.body });
    if (error) throw new Error("Save failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "add_note", details: { userId: data.userId } });
    return { ok: true };
  });

export const deleteMemberNote = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await guard(data.guildId);
    const { error } = await db.from("member_notes").delete().eq("guild_id", data.guildId).eq("id", data.id);
    if (error) throw new Error("Delete failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "delete_note" });
    return { ok: true };
  });

export const getTicketTranscript = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId);
    const { data: row } = await db.from("ticket_transcripts").select("html, channel_name").eq("guild_id", data.guildId).eq("id", data.id).maybeSingle();
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

export const MOD_ACTIONS = ["warn", "mute", "kick", "ban", "unmute", "unban"] as const;
export type ModAction = (typeof MOD_ACTIONS)[number];

// Dashboard moderation: queued as a bot job so the bot applies it, DMs the member,
// stores it (warns live in bot storage) and pushes it back to member_punishments.
export const moderateMember = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      guildId: gid, userId: uid, action: z.enum(MOD_ACTIONS),
      reason: z.string().trim().max(500).default(""),
      minutes: z.number().int().min(1).max(40320).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { s, db } = await guard(data.guildId);
    if (data.action === "mute" && !data.minutes) throw new Error("حدد مدة الإسكات");
    const { data: row, error } = await db.from("bot_jobs").insert({
      guild_id: data.guildId, type: "moderate", created_by: s.uid,
      payload: { action: data.action, user_id: data.userId, reason: data.reason || "بدون سبب", minutes: data.minutes ?? null, moderator_id: s.uid, moderator_name: s.name },
    }).select("id").single();
    if (error || !row) throw new Error("ما قدرنا نرسل الطلب للبوت");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: `moderate:${data.action}`, details: { userId: data.userId, reason: data.reason } });
    return { id: row.id };
  });

export const getModerationJob = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId);
    const { data: row } = await db.from("bot_jobs").select("status, result").eq("guild_id", data.guildId).eq("id", data.id).maybeSingle();
    return row ?? { status: "missing", result: null };
  });

// People a member brought into the server (from the bot's invite tracking).
export const getInvitedBy = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid, userId: uid }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await guard(data.guildId);
    const inv = await db.from("member_invites").select("invited_id, joined_at, left_guild, fake")
      .eq("guild_id", data.guildId).eq("inviter_id", data.userId).order("joined_at", { ascending: false, nullsFirst: false }).limit(200);
    const rows = inv.data ?? [];
    const ids = rows.map((r) => r.invited_id);
    const profiles = ids.length ? (await db.from("member_stats").select("user_id, username, display_name, avatar").eq("guild_id", data.guildId).in("user_id", ids)).data ?? [] : [];
    const map = new Map(profiles.map((p) => [p.user_id, p]));
    return rows.map((r) => ({
      id: r.invited_id,
      name: map.get(r.invited_id)?.display_name ?? map.get(r.invited_id)?.username ?? null,
      username: map.get(r.invited_id)?.username ?? null,
      avatar: map.get(r.invited_id)?.avatar ?? null,
      joined_at: r.joined_at, left: r.left_guild, fake: r.fake,
    }));
  });
