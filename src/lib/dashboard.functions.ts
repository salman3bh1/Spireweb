import { COMMAND_CATALOG } from "./command-catalog";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { modulesSchema } from "./modules.schema";
import { telemetrySchema } from "./telemetry.schema";

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  const { readSession } = await import("./discord.server");
  const { OWNER_ID } = await import("./activity.server");
  const s = await readSession();
  return s ? { id: s.uid, name: s.name, avatar: s.avatar, isOwner: s.uid === OWNER_ID } : null;
});

export const listGuilds = createServerFn({ method: "GET" }).handler(async () => {
    const { requireSession, userAdminGuilds, userGuilds, botGuildIds } = await import("./discord.server");
  const s = await requireSession();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [admin, all, bot, grants] = await Promise.all([
    userAdminGuilds(s), userGuilds(s), botGuildIds(),
    supabaseAdmin.from("dashboard_access").select("guild_id").eq("user_id", s.uid),
  ]);
  // Servers where the owner granted this member a dashboard role (manager/moderator) also show up.
  const granted = new Set((grants.data ?? []).map((g) => g.guild_id));
  const mine = [...admin, ...all.filter((g) => granted.has(g.id) && !admin.some((a) => a.id === g.id))];
  const icon = (g: { id: string; icon: string | null }) =>
    g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null;
  return {
    withBot: mine.filter((g) => bot.has(g.id)).map((g) => ({ id: g.id, name: g.name, icon: icon(g) })),
    withoutBot: mine.filter((g) => !bot.has(g.id)).map((g) => ({ id: g.id, name: g.name, icon: icon(g) })),
    clientId: process.env["DISCORD_CLIENT_ID"] ?? "1557375124527779842",
  };
});

import { ticketSchema } from "./tickets.schema";
export { defaultTicketDesign, defaultTicketSettings } from "./tickets.schema";
export type { TicketDesign, TicketSettings } from "./tickets.schema";

const aliasSchema = z.object({
  alias: z.string().trim().min(1).max(32).regex(/^\S+$/, "no spaces"),
  command: z.string().trim().min(1).max(32),
});

export type Alias = z.infer<typeof aliasSchema>;

export const getGuildData = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: z.string().regex(/^\d{15,21}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, guildRoles, guildChannels, guildInfo } = await import("./discord.server");
    const s = await requireSession();
    const g = await assertGuildAccess(s, data.guildId, "moderator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [roles, channels, commands, row, info, telemetry] = await Promise.all([
      guildRoles(data.guildId).catch((e) => { console.error("roles", e); return [] as Awaited<ReturnType<typeof guildRoles>>; }),
      guildChannels(data.guildId).catch((e) => { console.error("channels", e); return [] as Awaited<ReturnType<typeof guildChannels>>; }),
      Promise.resolve(COMMAND_CATALOG),
      supabaseAdmin.from("guild_settings").select("ticket, aliases, modules").eq("guild_id", data.guildId).maybeSingle(),
      guildInfo(data.guildId).catch(() => ({}) as Awaited<ReturnType<typeof guildInfo>>),
      supabaseAdmin.from("guild_telemetry").select("snapshot, updated_at").eq("guild_id", data.guildId).maybeSingle(),
    ]);
    if (row.error) console.error("guild_settings", row.error);
    if (telemetry.error) console.error("guild_telemetry", telemetry.error);
    const snapshot = telemetrySchema.safeParse(telemetry.data?.snapshot);
    const live = snapshot.success ? snapshot.data : null;
    const { botTopRolePosition } = await import("./discord.server");
    const botTop = await botTopRolePosition(data.guildId, roles).catch(() => Infinity);

    return {
      siteRole: g.siteRole,
      guild: { id: g.id, name: g.name, icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null },
      roles: roles
        .filter((r) => r.name !== "@everyone" && !r.managed)
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, color: r.color, assignable: r.position < botTop })),
      textChannels: channels.filter((c) => c.type === 0 || c.type === 5).sort((a, b) => a.position - b.position).map((c) => ({ id: c.id, name: c.name })),
      categories: channels.filter((c) => c.type === 4).sort((a, b) => a.position - b.position).map((c) => ({ id: c.id, name: c.name })),
      commands,
      ticket: ticketSchema.parse(row.data?.ticket ?? {}),
      aliases: z.array(aliasSchema).catch([]).parse(row.data?.aliases ?? []),
      modules: modulesSchema.catch(modulesSchema.parse({})).parse(row.data?.modules ?? {}),
      stats: {
        members: live?.members ?? info.approximate_member_count ?? null,
        online: info.approximate_presence_count ?? null,
        boosts: info.premium_subscription_count ?? 0,
        roles: roles.length,
        channels: channels.length,
        messagesToday: null,
        voice: live?.voice ?? null,
        openTickets: live?.openTickets ?? null,
      },
      dailyMessages: live?.dailyMessages ?? [],
      hourlyMessages: live?.hourlyMessages ?? null,
      serverStats: live?.serverStats ?? null,
      streakTop: live?.streakTop ?? [],
      activityTop: live?.activityTop ?? [],
      creditTop: live?.creditTop ?? [],
      roleJob: live?.roleJob ?? null,
      telemetryAt: telemetry.data?.updated_at ?? null,
      voiceChannels: channels.filter((c) => c.type === 2 || c.type === 13).map((c) => ({ id: c.id, name: c.name })),
    };
  });

export const saveTicketSettings = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: z.string().regex(/^\d{15,21}$/), ticket: ticketSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("guild_settings").upsert(
      { guild_id: data.guildId, ticket: data.ticket, updated_at: new Date().toISOString(), updated_by: s.uid },
      { onConflict: "guild_id" },
    );
    if (error) throw new Error("Save failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "save_ticket" });
    return { ok: true };
  });

export const saveAliases = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ guildId: z.string().regex(/^\d{15,21}$/), aliases: z.array(aliasSchema).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const seen = new Set<string>();
    const aliases = data.aliases.filter((a) => {
      const k = a.alias.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("guild_settings").upsert(
      { guild_id: data.guildId, aliases, updated_at: new Date().toISOString(), updated_by: s.uid },
      { onConflict: "guild_id" },
    );
    if (error) throw new Error("Save failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "save_aliases", details: { count: aliases.length } });
    return { ok: true };
  });
