import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";
import { nextRun, REPEATS } from "@/lib/schedule";

// The bot claims pending "create" jobs from the dashboard and reports results.
export const Route = createFileRoute("/api/public/bot/jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const query = new URL(request.url).searchParams;
        const worker = query.get("worker");
        const guildIds = (query.get("guilds") ?? "").split(",").filter(id => /^\d{15,21}$/.test(id) || id === "global");
        if (!worker || worker.length > 100 || !guildIds.length || guildIds.length > 500) return new Response("Bad request", { status: 400 });
        const { data, error } = await supabaseAdmin.rpc("claim_bot_jobs", { worker, guild_ids: guildIds });
        if (error) return new Response("DB error", { status: 500 });
        return Response.json({ jobs: (data ?? []).map(({ id, guild_id, type, payload }) => ({ id, guild_id, type, payload })) });
      },
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = z.object({ id: z.string().uuid(), worker: z.string().min(1).max(100), ok: z.boolean(), result: z.string().max(500) }).safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("bot_jobs").update({
          status: parsed.data.ok ? "done" : "failed", result: parsed.data.result, updated_at: new Date().toISOString(),
        }).eq("id", parsed.data.id).eq("claimed_by", parsed.data.worker).eq("status", "running");
        if (error) return new Response("DB error", { status: 500 });
        // Repeating announcements queue their next run once the bot has sent this one.
        const { data: job } = await supabaseAdmin.from("bot_jobs").select("guild_id, type, payload, created_by, run_after").eq("id", parsed.data.id).maybeSingle();
        if (job?.type === "announce") {
          const repeat = (job.payload as { repeat?: string })?.repeat;
          const next = REPEATS.includes(repeat as never) ? nextRun(new Date(job.run_after ?? Date.now()), repeat as (typeof REPEATS)[number]) : null;
          if (next) await supabaseAdmin.from("bot_jobs").insert({ guild_id: job.guild_id, type: "announce", payload: job.payload, created_by: job.created_by, run_after: next.toISOString() });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
