import { createFileRoute } from "@tanstack/react-router";
import { isBotRequest } from "@/lib/bot-auth.server";
import { interactionBoardsSchema } from "@/lib/telemetry.schema";

// The bot pushes the global interaction leaderboard (chat/voice × all/month/week/day).
export const Route = createFileRoute("/api/public/bot/interaction")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = interactionBoardsSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("bot_leaderboards").upsert({ id: "interaction", snapshot: parsed.data, updated_at: new Date().toISOString() });
        if (error) return new Response("DB error", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
