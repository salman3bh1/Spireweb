import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { globalLeaderboardSchema } from "./telemetry.schema";

export const getGlobalLeaderboards = createServerFn({ method: "GET" })
  .inputValidator(input => z.object({ guildId: z.string().regex(/^\d{15,21}$/) }).parse(input))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess } = await import("./discord.server");
    const session = await requireSession();
    await assertGuildAccess(session, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("bot_leaderboards").select("snapshot, updated_at").eq("id", "global").maybeSingle();
    if (result.error) throw new Error("تعذر تحميل الترتيب العام");
    const parsed = globalLeaderboardSchema.safeParse(result.data?.snapshot);
    return { creditTop: parsed.success ? parsed.data.creditTop : [], streakTop: parsed.success ? parsed.data.streakTop : [], updatedAt: result.data?.updated_at ?? null };
  });