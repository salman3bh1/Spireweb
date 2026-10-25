import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";
import { modulesSchema, BOT_LANGS } from "@/lib/modules.schema";

const autoReplyBody = z.union([
  z.object({ guildId: z.string().regex(/^\d{15,21}$/), autoReply: modulesSchema.shape.autoReply }),
  // The bot reports a /language change so the dashboard shows it right away.
  z.object({ guildId: z.string().regex(/^\d{15,21}$/), lang: z.enum(BOT_LANGS) }),
]);

// The bot pulls dashboard settings changed since its last sync.
export const Route = createFileRoute("/api/public/bot/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const sinceRaw = new URL(request.url).searchParams.get("since");
        const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw).toISOString() : null;
        const now = new Date().toISOString();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const boundary = since ?? "1970-01-01T00:00:00.000Z";
        const guilds = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabaseAdmin.from("guild_settings").select("guild_id, ticket, aliases, modules, updated_at").gte("updated_at", boundary).lte("updated_at", now).order("updated_at").order("guild_id").range(offset, offset + 999);
          if (error) return new Response("DB error", { status: 500 });
          guilds.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        return Response.json({ now, guilds });
      },
      // The bot saves auto-replies created with /autoreply so the dashboard shows them.
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = autoReplyBody.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { guildId } = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row, error: readError } = await supabaseAdmin.from("guild_settings").select("modules").eq("guild_id", guildId).maybeSingle();
        if (readError) return new Response("DB error", { status: 500 });
        const prevModules = (row?.modules as Record<string, unknown> | null) ?? {};
        const modules = "lang" in parsed.data
          ? { ...prevModules, general: { ...((prevModules["general"] as Record<string, unknown> | undefined) ?? {}), lang: parsed.data.lang } }
          : { ...prevModules, autoReply: parsed.data.autoReply };
        const { error } = await supabaseAdmin.from("guild_settings").upsert(
          { guild_id: guildId, modules, updated_at: new Date().toISOString(), updated_by: "bot" },
          { onConflict: "guild_id" },
        );
        if (error) return new Response("DB error", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
