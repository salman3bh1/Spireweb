import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";
import { telemetrySchema, globalLeaderboardSchema } from "@/lib/telemetry.schema";

const bodySchema = z.object({
  guilds: z.array(z.object({ guild_id: z.string().regex(/^\d{15,21}$/), snapshot: telemetrySchema })).max(50),
  global: globalLeaderboardSchema.optional(),
});

// The bot pushes live counters and leaderboards for the dashboard.
export const Route = createFileRoute("/api/public/bot/telemetry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const at = new Date().toISOString();
        if (parsed.data.guilds.length) {
          const { error } = await supabaseAdmin.from("guild_telemetry").upsert(
            parsed.data.guilds.map((g) => ({ guild_id: g.guild_id, snapshot: g.snapshot, updated_at: at })),
          );
          if (error) return new Response("DB error", { status: 500 });
        }
        if (parsed.data.global) {
          const { error } = await supabaseAdmin.from("bot_leaderboards").upsert({ id: "global", snapshot: parsed.data.global, updated_at: at });
          if (error) return new Response("DB error", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
