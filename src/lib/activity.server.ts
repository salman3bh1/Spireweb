// Server-only: owner identity + site activity log used by the owner control panel.
export const OWNER_ID = "1317834763700277339";

export async function logActivity(entry: { userId: string; username?: string | null; guildId?: string | null; action: string; details?: Record<string, unknown> }) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("site_activity").insert({
      user_id: entry.userId, username: entry.username ?? null, guild_id: entry.guildId ?? null,
      action: entry.action, details: (entry.details ?? {}) as never,
    });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
