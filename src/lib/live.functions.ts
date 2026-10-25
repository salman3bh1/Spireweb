import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { liveSchema } from "./telemetry.schema";

// Overview live numbers (bot pushes every ~3s) + latest punishments for this server.
export const getGuildLive = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: z.string().regex(/^\d{15,21}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId, "moderator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [row, pun] = await Promise.all([
      supabaseAdmin.from("guild_live").select("live, updated_at").eq("guild_id", data.guildId).maybeSingle(),
      supabaseAdmin.from("member_punishments").select("id, user_id, kind, reason, moderator_name, created_at").eq("guild_id", data.guildId).order("created_at", { ascending: false }).limit(10),
    ]);
    const ids = [...new Set((pun.data ?? []).map((p) => p.user_id))];
    const names = ids.length ? await supabaseAdmin.from("member_stats").select("user_id, username, display_name, avatar").eq("guild_id", data.guildId).in("user_id", ids) : { data: [] };
    const who = new Map((names.data ?? []).map((n) => [n.user_id, n]));
    const parsed = liveSchema.safeParse(row.data?.live);
    return {
      live: parsed.success ? parsed.data : null,
      updatedAt: row.data?.updated_at ?? null,
      punishments: (pun.data ?? []).map((p) => ({ ...p, name: who.get(p.user_id)?.display_name ?? who.get(p.user_id)?.username ?? p.user_id, avatar: who.get(p.user_id)?.avatar ?? null })),
    };
  });
