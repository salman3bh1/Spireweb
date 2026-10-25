import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";

const track = z.object({
  title: z.string().max(300), author: z.string().max(200), url: z.string().max(600), thumbnail: z.string().max(600),
  duration: z.number().min(0), source: z.string().max(40), requestedBy: z.string().max(100).optional(),
});
const body = z.object({
  guilds: z.array(z.object({
    guild_id: z.string().regex(/^\d{15,21}$/),
    state: z.object({
      playing: z.boolean(), paused: z.boolean(), volume: z.number(), position: z.number(), repeat: z.enum(["off", "song", "queue"]),
      channel: z.string().max(100).nullable(), current: track.nullable(), queue: z.array(track).max(50), at: z.number(),
    }),
  })).max(200),
});

// The bot pushes the live music queue of each guild for the dashboard player.
export const Route = createFileRoute("/api/public/bot/music")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        if (!parsed.data.guilds.length) return Response.json({ ok: true });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const at = new Date().toISOString();
        const { error } = await supabaseAdmin.from("music_state").upsert(parsed.data.guilds.map((g) => ({ guild_id: g.guild_id, state: g.state, updated_at: at })));
        if (error) return new Response("DB error", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
