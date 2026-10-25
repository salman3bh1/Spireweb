// Signed-in member area: overview, leaderboards, updates, daily reward, credit history.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function ctx() {
  const { requireSession } = await import("./discord.server");
  const { OWNER_ID } = await import("./activity.server");
  const s = await requireSession();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { s, db: supabaseAdmin, isOwner: s.uid === OWNER_ID };
}

async function balanceOf(db: Awaited<ReturnType<typeof ctx>>["db"], uid: string) {
  const [bal, pending] = await Promise.all([
    db.from("credit_balances").select("credits").eq("user_id", uid).maybeSingle(),
    db.from("bot_jobs").select("payload").eq("type", "admin").eq("guild_id", "global").in("status", ["pending", "running"]).contains("payload", { op: "dailyReward", user_id: uid }),
  ]);
  const credits = Number(bal.data?.credits ?? 0);
  const pendingDaily = (pending.data ?? []).reduce((n, j) => n + Number((j.payload as { amount?: number })?.amount ?? 0), 0);
  return { credits, pendingDaily };
}

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const { s, db, isOwner } = await ctx();
  const { credits, pendingDaily } = await balanceOf(db, s.uid);
  const [rank, totals, lastDaily] = await Promise.all([
    db.from("credit_balances").select("user_id", { count: "exact", head: true }).gt("credits", credits),
    db.rpc("member_totals", { p_user: s.uid }),
    db.from("daily_rewards").select("created_at").eq("user_id", s.uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const t = totals.data?.[0];
  return {
    me: { id: s.uid, name: s.name, avatar: s.avatar, isOwner },
    credits, pendingDaily,
    wealthRank: (rank.count ?? 0) + 1,
    interactionRank: Number(t?.interaction_rank ?? 0),
    messages: Number(t?.messages ?? 0), voiceSeconds: Number(t?.voice_seconds ?? 0), xp: Number(t?.xp ?? 0), maxLevel: Number(t?.max_level ?? 0),
    lastDaily: lastDaily.data?.created_at ?? null,
  };
});

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    kind: z.enum(["wealth", "interaction"]),
    mode: z.enum(["both", "text", "voice"]).default("both"),
    period: z.enum(["all", "month", "week", "day"]).default("all"),
  }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await ctx();
    if (data.kind === "wealth") {
      const { data: rows, error } = await db.from("credit_balances").select("user_id, username, avatar, credits").gt("credits", 0).order("credits", { ascending: false }).limit(100);
      if (error) throw new Error("تعذر تحميل الترتيب");
      const mine = await balanceOf(db, s.uid);
      const above = await db.from("credit_balances").select("user_id", { count: "exact", head: true }).gt("credits", mine.credits);
      return {
        rows: (rows ?? []).map((r) => ({ id: r.user_id, name: r.username ?? r.user_id, avatar: r.avatar, value: Number(r.credits), text: null as number | null, voice: null as number | null })),
        me: { id: s.uid, name: s.name, avatar: s.avatar, value: mine.credits, rank: (above.count ?? 0) + 1, text: null as number | null, voice: null as number | null },
      };
    }
    const { interactionBoardsSchema } = await import("./telemetry.schema");
    const snap = await db.from("bot_leaderboards").select("snapshot").eq("id", "interaction").maybeSingle();
    const parsed = interactionBoardsSchema.safeParse(snap.data?.snapshot);
    const valueOf = (r: { text: number; voice: number }) => data.mode === "text" ? r.text : data.mode === "voice" ? r.voice : r.text + r.voice;
    const list = parsed.success ? parsed.data[data.period][data.mode] : [];
    const idx = list.findIndex((r) => r.id === s.uid);
    const mineRow = idx >= 0 ? list[idx] : parsed.success ? parsed.data[data.period].both.find((r) => r.id === s.uid) : undefined;
    return {
      rows: list.map((r) => ({ id: r.id, name: r.name, avatar: r.avatar ?? null, value: valueOf(r), text: r.text, voice: r.voice })),
      me: { id: s.uid, name: s.name, avatar: s.avatar, value: mineRow ? valueOf(mineRow) : 0, rank: idx >= 0 ? idx + 1 : 0, text: mineRow?.text ?? 0, voice: mineRow?.voice ?? 0 },
    };
  });

// ===== Updates (owner posts) =====
export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { s, db, isOwner } = await ctx();
  const { data, error } = await db.from("site_posts").select("id, title, body, image_url, author_name, created_at").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("تعذر تحميل التحديثات");
  const ids = (data ?? []).map((p) => p.id);
  const likes = ids.length ? (await db.from("post_likes").select("post_id, user_id").in("post_id", ids)).data ?? [] : [];
  return {
    isOwner,
    posts: (data ?? []).map((p) => ({ ...p, likes: likes.filter((l) => l.post_id === p.id).length, liked: likes.some((l) => l.post_id === p.id && l.user_id === s.uid) })),
  };
});

export const togglePostLike = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await ctx();
    const had = await db.from("post_likes").delete().eq("post_id", data.id).eq("user_id", s.uid).select("post_id");
    if (had.data?.length) return { liked: false };
    const { error } = await db.from("post_likes").insert({ post_id: data.id, user_id: s.uid });
    if (error && error.code !== "23505") throw new Error("تعذر الإعجاب");
    return { liked: true };
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(4000),
    imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  }).parse(d))
  .handler(async ({ data }) => {
    const { s, db, isOwner } = await ctx();
    if (!isOwner) throw new Error("FORBIDDEN");
    const { error } = await db.from("site_posts").insert({ title: data.title, body: data.body, image_url: data.imageUrl || null, author_id: s.uid, author_name: s.name });
    if (error) throw new Error("تعذر نشر التحديث");
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db, isOwner } = await ctx();
    if (!isOwner) throw new Error("FORBIDDEN");
    const { error } = await db.from("site_posts").delete().eq("id", data.id);
    if (error) throw new Error("تعذر الحذف");
    return { ok: true };
  });

// ===== Daily reward =====
export const getDaily = createServerFn({ method: "GET" }).handler(async () => {
  const { s, db } = await ctx();
  const { data } = await db.from("daily_rewards").select("id, amount, created_at").eq("user_id", s.uid).order("created_at", { ascending: false }).limit(60);
  // A reward counts as applied once the bot logged it into the credit ledger.
  const ledger = await db.from("credit_ledger").select("amount, created_at").eq("kind", "daily").eq("to_id", s.uid).order("created_at", { ascending: false }).limit(60);
  const pool = [...(ledger.data ?? [])];
  const rows = (data ?? []).map((r) => {
    const i = pool.findIndex((l) => Number(l.amount) === r.amount && new Date(l.created_at).getTime() >= new Date(r.created_at).getTime() - 60_000);
    if (i >= 0) pool.splice(i, 1);
    return { ...r, applied: i >= 0 };
  });
  return { history: rows, total: rows.reduce((n, r) => n + r.amount, 0), lastClaim: rows[0]?.created_at ?? null };
});

export const claimDaily = createServerFn({ method: "POST" }).handler(async () => {
  const { s, db } = await ctx();
  const { rollDailyReward } = await import("./daily-reward");
  const amount = rollDailyReward();
  const { data, error } = await db.rpc("claim_daily_reward", { p_user: s.uid, p_amount: amount });
  if (error) throw new Error(error.message.includes("TOO_SOON") ? "TOO_SOON" : "تعذر استلام المكافأة");
  // The bot owns balances: it applies the reward and reports the new balance back.
  const job = await db.from("bot_jobs").insert({ guild_id: "global", type: "admin", created_by: s.uid, payload: { op: "dailyReward", user_id: s.uid, amount } });
  if (job.error) console.error("daily job", job.error);
  return { amount, createdAt: (data as { created_at?: string } | null)?.created_at ?? new Date().toISOString() };
});

// ===== Credit history =====
export const listTransactions = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    kind: z.enum(["all", "transfer", "daily", "admin", "game"]).default("all"),
    direction: z.enum(["all", "in", "out"]).default("all"),
    sort: z.enum(["new", "old", "big"]).default("new"),
    q: z.string().trim().max(60).default(""),
  }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await ctx();
    let q = db.from("credit_ledger").select("id, kind, from_id, from_name, from_avatar, to_id, to_name, to_avatar, amount, from_balance, to_balance, note, created_at");
    if (data.direction === "in") q = q.eq("to_id", s.uid);
    else if (data.direction === "out") q = q.eq("from_id", s.uid);
    else q = q.or(`from_id.eq.${s.uid},to_id.eq.${s.uid}`);
    if (data.kind !== "all") q = q.eq("kind", data.kind);
    q = data.sort === "big" ? q.order("amount", { ascending: false }) : q.order("created_at", { ascending: data.sort === "old" });
    const { data: rows, error } = await q.limit(300);
    if (error) throw new Error("تعذر تحميل السجل");
    const needle = data.q.toLowerCase();
    const list = (rows ?? []).filter((r) => !needle || [r.from_name, r.to_name, r.from_id, r.to_id, String(r.amount), r.note].some((v) => v?.toLowerCase().includes(needle)));
    const { credits } = await balanceOf(db, s.uid);
    const all = await db.from("credit_ledger").select("from_id, to_id, amount").or(`from_id.eq.${s.uid},to_id.eq.${s.uid}`).limit(5000);
    let deposits = 0, withdrawals = 0;
    for (const r of all.data ?? []) { if (r.to_id === s.uid) deposits += Number(r.amount); if (r.from_id === s.uid) withdrawals += Number(r.amount); }
    return {
      me: s.uid, credits, deposits, withdrawals, count: all.data?.length ?? 0,
      rows: list.map((r) => ({ ...r, amount: Number(r.amount), from_balance: r.from_balance == null ? null : Number(r.from_balance), to_balance: r.to_balance == null ? null : Number(r.to_balance) })),
    };
  });
