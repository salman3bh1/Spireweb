import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";

const periods = z.object({ day: z.number().min(0), week: z.number().min(0), month: z.number().min(0), all: z.number().min(0) });
const profile = z.object({
  user_id: z.string().regex(/^\d{15,21}$/),
  username: z.string().max(100).nullable().optional(),
  avatar: z.string().url().max(400).nullable().optional(),
  wins: z.number().int().min(0), level: z.number().int().min(0),
  voice: periods, active: periods,
  servers: z.array(z.object({ id: z.string(), name: z.string().max(100), icon: z.string().max(400).nullable(), level: z.number(), xp: z.number(), text: z.number(), voice: z.number() })).max(25),
});

// The bot pushes per-user profile stats (wins, voice minutes, active hours, servers),
// and reads a member's shop look (background, frame, name effect, colour, badges) to draw /profile.
export const Route = createFileRoute("/api/public/bot/profiles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const id = z.string().regex(/^\d{15,21}$/).safeParse(new URL(request.url).searchParams.get("user"));
        if (!id.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { mergeCatalog, itemById } = await import("@/lib/shop");
        const [style, rows] = await Promise.all([
          supabaseAdmin.from("profile_style").select("background, frame, effect, color, badges, bio").eq("user_id", id.data).maybeSingle(),
          supabaseAdmin.from("shop_items").select("id, kind, name, emoji, price, active"),
        ]);
        const items = mergeCatalog(rows.data ?? []);
        const s = style.data;
        return Response.json({
          background: s?.background ?? null, frame: s?.frame ?? null, effect: s?.effect ?? null,
          color: null, bio: s?.bio ?? null,
          badges: ((s?.badges ?? []) as string[]).map((b) => itemById(b, items)).filter((x) => !!x).map((b) => ({ id: b.id, name: b.name, emoji: b.emoji ?? null })),
        });
      },
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = z.object({ profiles: z.array(profile).max(500) }).safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const at = new Date().toISOString();
        const { error } = await supabaseAdmin.from("user_profiles").upsert(parsed.data.profiles.map(({ user_id, username, avatar, ...snapshot }) => ({
          user_id, username: username ?? null, avatar: avatar ?? null, snapshot, updated_at: at,
        })));
        if (error) return new Response("DB error", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
