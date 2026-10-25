// Public profile (shareable /u/<id>), credit shop, inventory, gifts and achievements.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MAX_BADGES, mergeCatalog, itemById, type ShopRow } from "./shop";
import { progress } from "./achievements";

const uid = z.string().regex(/^\d{15,21}$/);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
type Periods = { day: number; week: number; month: number; all: number };
type Snap = { wins?: number; level?: number; voice?: Periods; active?: Periods; servers?: { id: string; name: string; icon: string | null; level: number; xp: number; text: number; voice: number }[] };
type Db = Awaited<ReturnType<typeof ctx>>["db"];
const zero: Periods = { day: 0, week: 0, month: 0, all: 0 };

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function catalog(db: Db) {
  const { data } = await db.from("shop_items").select("id, kind, name, emoji, price, active");
  return mergeCatalog((data ?? []) as ShopRow[]);
}

async function loadProfile(db: Db, userId: string) {
  const [p, bal, style, stats, owned, daily, items] = await Promise.all([
    db.from("user_profiles").select("username, avatar, snapshot, updated_at").eq("user_id", userId).maybeSingle(),
    db.from("credit_balances").select("credits, username, avatar").eq("user_id", userId).maybeSingle(),
    db.from("profile_style").select("background, badges, bio, color, frame, effect").eq("user_id", userId).maybeSingle(),
    db.from("member_stats").select("guild_id, username, display_name, avatar, level, messages, voice_seconds, in_guild").eq("user_id", userId).eq("in_guild", true).limit(100),
    db.from("shop_purchases").select("item_id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("daily_rewards").select("id", { count: "exact", head: true }).eq("user_id", userId),
    catalog(db),
  ]);
  const snap = (p.data?.snapshot ?? {}) as Snap;
  const rows = stats.data ?? [];
  if (!p.data && !bal.data && !rows.length) return null;
  const credits = Number(bal.data?.credits ?? 0);
  const above = await db.from("credit_balances").select("user_id", { count: "exact", head: true }).gt("credits", credits);
  const voice = snap.voice ?? { ...zero, all: Math.round(rows.reduce((n, r) => n + Number(r.voice_seconds), 0) / 60) };
  const level = Math.max(snap.level ?? 0, ...rows.map((r) => r.level));
  const messages = rows.reduce((n, r) => n + r.messages, 0);
  const wins = snap.wins ?? 0;
  return {
    id: userId,
    name: p.data?.username ?? bal.data?.username ?? rows[0]?.display_name ?? rows[0]?.username ?? userId,
    avatar: p.data?.avatar ?? bal.data?.avatar ?? rows[0]?.avatar ?? null,
    credits, wealthRank: (above.count ?? 0) + 1, wins, level, messages, voice,
    active: snap.active ?? zero,
    servers: snap.servers ?? [],
    serverCount: Math.max(rows.length, snap.servers?.length ?? 0),
    background: style.data?.background ?? null,
    frame: style.data?.frame ?? null,
    effect: style.data?.effect ?? null,
    color: null,
    badges: ((style.data?.badges ?? []) as string[]).map((b) => itemById(b, items)).filter((x) => !!x),
    bio: style.data?.bio ?? null,
    updatedAt: p.data?.updated_at ?? null,
    achievements: progress({ messages, voiceMinutes: voice.all, wins, credits, level, items: owned.count ?? 0, dailyClaims: daily.count ?? 0 }),
  };
}

// Intentionally public: only shareable profile stats, no private data.
export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ userId: uid }).parse(d))
  .handler(async ({ data }) => loadProfile(await adminDb(), data.userId));

async function ctx() {
  const { requireSession } = await import("./discord.server");
  const { OWNER_ID } = await import("./activity.server");
  const s = await requireSession();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { s, db: supabaseAdmin, isOwner: s.uid === OWNER_ID };
}
async function spendable(db: Db, user: string) {
  const [bal, pending] = await Promise.all([
    db.from("credit_balances").select("credits").eq("user_id", user).maybeSingle(),
    db.from("bot_jobs").select("payload").eq("type", "admin").eq("guild_id", "global").in("status", ["pending", "running"]).contains("payload", { op: "shopBuy", user_id: user }),
  ]);
  const held = (pending.data ?? []).reduce((n, j) => n + Number((j.payload as { amount?: number })?.amount ?? 0), 0);
  return Number(bal.data?.credits ?? 0) - held;
}

export const getShop = createServerFn({ method: "GET" }).handler(async () => {
  const { s, db } = await ctx();
  const [owned, style, credits, items] = await Promise.all([
    db.from("shop_purchases").select("item_id").eq("user_id", s.uid),
    db.from("profile_style").select("background, badges, bio, color, frame, effect").eq("user_id", s.uid).maybeSingle(),
    spendable(db, s.uid),
    catalog(db),
  ]);
  return {
    me: s.uid, name: s.name, avatar: s.avatar, credits, items,
    owned: (owned.data ?? []).map((r) => r.item_id),
    background: style.data?.background ?? null,
    frame: style.data?.frame ?? null,
    effect: style.data?.effect ?? null,
    color: null,
    badges: (style.data?.badges ?? []) as string[],
    bio: style.data?.bio ?? "",
  };
});

// Buying for yourself or as a gift: the buyer always pays; the item lands with the recipient.
export const buyItem = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ itemId: z.string().max(40), giftTo: uid.optional() }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await ctx();
    const item = itemById(data.itemId, await catalog(db));
    if (!item) throw new Error("المنتج غير موجود");
    const to = data.giftTo ?? s.uid;
    if (data.giftTo === s.uid) throw new Error("ما تقدر تهدي نفسك");
    if ((await spendable(db, s.uid)) < item.price) throw new Error("NO_FUNDS");
    const ins = await db.from("shop_purchases").insert({ user_id: to, item_id: item.id, price: item.price, gifted_by: data.giftTo ? s.uid : null });
    if (ins.error) throw new Error(ins.error.code === "23505" ? (data.giftTo ? "العضو يملكه من قبل" : "تملكه من قبل") : "تعذر الشراء");
    // The bot owns balances: it deducts the price and pushes the new balance back.
    await db.from("bot_jobs").insert({ guild_id: "global", type: "admin", created_by: s.uid, payload: { op: "shopBuy", user_id: s.uid, amount: item.price, item: item.id, gift_to: data.giftTo ?? null } });
    return { ok: true };
  });

export const findMember = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(2).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await ctx();
    const q = data.q.replace(/[%,()]/g, "");
    const r = /^\d{15,21}$/.test(q)
      ? await db.from("credit_balances").select("user_id, username, avatar").eq("user_id", q).limit(1)
      : await db.from("credit_balances").select("user_id, username, avatar").ilike("username", `%${q}%`).limit(8);
    return (r.data ?? []).filter((u) => u.user_id !== s.uid);
  });

export const saveStyle = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    background: z.string().max(40).nullable(), frame: z.string().max(40).nullable(), effect: z.string().max(40).nullable(),
    color: hex.nullable(), badges: z.array(z.string().max(40)).max(MAX_BADGES), bio: z.string().trim().max(160),
  }).parse(d))
  .handler(async ({ data }) => {
    const { s, db } = await ctx();
    const owned = new Set(((await db.from("shop_purchases").select("item_id").eq("user_id", s.uid)).data ?? []).map((r) => r.item_id));
    for (const id of [data.background, data.frame, data.effect, ...data.badges]) if (id && !owned.has(id)) throw new Error("ما تملك هذا العنصر");
    const { error } = await db.from("profile_style").upsert({
      user_id: s.uid, background: data.background, frame: data.frame, effect: data.effect, color: null,
      badges: data.badges, bio: data.bio || null, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("تعذر الحفظ");
    return { ok: true };
  });

export const getInventory = createServerFn({ method: "GET" }).handler(async () => {
  const { s, db } = await ctx();
  const [rows, items, style] = await Promise.all([
    db.from("shop_purchases").select("item_id, price, created_at, gifted_by").eq("user_id", s.uid).order("created_at", { ascending: false }),
    catalog(db),
    db.from("profile_style").select("background, badges, frame, effect").eq("user_id", s.uid).maybeSingle(),
  ]);
  const gifters = [...new Set((rows.data ?? []).map((r) => r.gifted_by).filter((x): x is string => !!x))];
  const names = gifters.length ? (await db.from("credit_balances").select("user_id, username").in("user_id", gifters)).data ?? [] : [];
  const nameOf = new Map(names.map((n) => [n.user_id, n.username]));
  const inUse = new Set([style.data?.background, style.data?.frame, style.data?.effect, ...((style.data?.badges ?? []) as string[])].filter(Boolean));
  return {
    me: s.uid,
    items: (rows.data ?? []).map((r) => {
      const it = itemById(r.item_id, items);
      return { id: r.item_id, name: it?.name ?? r.item_id, kind: it?.kind ?? "badge", emoji: it?.emoji, price: Number(r.price), at: r.created_at, inUse: inUse.has(r.item_id), giftedBy: r.gifted_by ? nameOf.get(r.gifted_by) ?? r.gifted_by : null };
    }),
  };
});

export const getMyAchievements = createServerFn({ method: "GET" }).handler(async () => {
  const { s, db } = await ctx();
  const p = await loadProfile(db, s.uid);
  return { me: s.uid, achievements: p?.achievements ?? progress({ messages: 0, voiceMinutes: 0, wins: 0, credits: 0, level: 0, items: 0, dailyClaims: 0 }) };
});

// ===== Owner: shop management =====
export const getShopAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { db, isOwner } = await ctx();
  if (!isOwner) throw new Error("FORBIDDEN");
  const { data } = await db.from("shop_items").select("id, kind, name, emoji, price, active");
  const rows = (data ?? []) as ShopRow[];
  const all = mergeCatalog(rows.map((r) => ({ ...r, active: true })));
  const hidden = new Set(rows.filter((r) => !r.active).map((r) => r.id));
  return all.map((i) => ({ ...i, active: !hidden.has(i.id) }));
});

export const saveShopItem = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    id: z.string().trim().regex(/^[a-z0-9-]{2,40}$/), kind: z.enum(["background", "badge", "frame", "effect"]),
    name: z.string().trim().min(1).max(40), emoji: z.string().trim().max(8).nullable(),
    price: z.number().int().min(0).max(1_000_000_000), active: z.boolean(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { db, isOwner } = await ctx();
    if (!isOwner) throw new Error("FORBIDDEN");
    const { error } = await db.from("shop_items").upsert({ ...data, emoji: data.emoji || null, updated_at: new Date().toISOString() });
    if (error) throw new Error("تعذر حفظ المنتج");
    return { ok: true };
  });
