import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isBotRequest } from "@/lib/bot-auth.server";

const id = z.string().regex(/^\d{15,21}$/);
const name = z.string().max(100).nullable().optional();
const bodySchema = z.object({
  events: z.array(z.object({
    kind: z.enum(["transfer", "admin", "daily", "game"]),
    from_id: id.nullable(), to_id: id.nullable(),
    from_name: name, to_name: name, from_avatar: z.string().url().max(400).nullable().optional(), to_avatar: z.string().url().max(400).nullable().optional(),
    amount: z.number().int().min(0).max(1e15),
    from_balance: z.number().int().nullable().optional(), to_balance: z.number().int().nullable().optional(),
    note: z.string().max(200).nullable().optional(), at: z.string().datetime(),
  })).max(500),
  balances: z.array(z.object({
    user_id: id, credits: z.number().int().min(0).max(1e15), username: name, avatar: z.string().url().max(400).nullable().optional(),
  })).max(1000),
});

// The bot pushes changed credit balances and transfer events (bot is the source of truth).
export const Route = createFileRoute("/api/public/bot/credits")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isBotRequest(request))) return new Response("Unauthorized", { status: 401 });
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();
        if (parsed.data.balances.length) {
          const { error } = await supabaseAdmin.from("credit_balances").upsert(parsed.data.balances.map((b) => ({
            user_id: b.user_id, credits: b.credits, username: b.username ?? null, avatar: b.avatar ?? null, updated_at: now,
          })));
          if (error) { console.error("credit_balances", error); return new Response("DB error", { status: 500 }); }
        }
        if (parsed.data.events.length) {
          const { error } = await supabaseAdmin.from("credit_ledger").insert(parsed.data.events.map((e) => ({
            kind: e.kind, from_id: e.from_id, to_id: e.to_id, from_name: e.from_name ?? null, to_name: e.to_name ?? null,
            from_avatar: e.from_avatar ?? null, to_avatar: e.to_avatar ?? null, amount: e.amount,
            from_balance: e.from_balance ?? null, to_balance: e.to_balance ?? null, note: e.note ?? null, created_at: e.at,
          })));
          if (error) { console.error("credit_ledger", error); return new Response("DB error", { status: 500 }); }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
