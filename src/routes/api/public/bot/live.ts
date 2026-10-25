import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";
import { liveSchema } from "@/lib/telemetry.schema";

const bodySchema = z.object({ guilds: z.array(z.object({ guild_id: z.string().regex(/^\d{15,21}$/), live: liveSchema })).max(50) });

// The bot pushes live overview numbers here every few seconds (only servers that changed).
export const Route = createFileRoute("/api/public/bot/live")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        if (!parsed.data.guilds.length) return Response.json({ ok: true });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const at = new Date().toISOString();
        const { error } = await supabaseAdmin.from("guild_live").upsert(parsed.data.guilds.map((g) => ({ guild_id: g.guild_id, live: g.live, updated_at: at })));
        if (error) return new Response("DB error", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
