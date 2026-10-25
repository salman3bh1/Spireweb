import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The server log only lists changes to this server's settings (not every site action).
export const SETTINGS_ACTIONS = ["save_settings", "save_ticket", "save_aliases", "access:grant"];

export const getSiteActivity = createServerFn({ method: "GET" })
  .inputValidator(d => z.object({ guildId: z.string().regex(/^\d{15,21}$/), page: z.number().int().min(0).default(0) }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const session = await requireSession();
    await assertGuildAccess(session, data.guildId, "moderator");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const activity = await supabaseAdmin.from("site_activity").select("id, action, username, details, created_at", { count: "exact" })
      .eq("guild_id", data.guildId).in("action", SETTINGS_ACTIONS)
      .order("created_at", { ascending: false }).range(data.page * 50, data.page * 50 + 49);
    if (activity.error) throw new Error("Could not load activity");
    // Saves that changed nothing are noise.
    const rows = (activity.data ?? []).filter((r) => r.action !== "save_settings" || ((r.details as { sections?: unknown[] } | null)?.sections?.length ?? 0) > 0);
    return { activity: rows, total: activity.count ?? 0, hasMore: (activity.data?.length ?? 0) === 50 };
  });
