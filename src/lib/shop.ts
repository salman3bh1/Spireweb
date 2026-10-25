import { EXTRA_ITEMS } from "./shop-extra";
// Shop catalog: profile backgrounds, badges, avatar frames and name effects bought with bot credits.
// SHOP_ITEMS are the defaults; the owner can override price/name/emoji, hide items or add new ones from /admin.
export type ShopKind = "background" | "badge" | "frame" | "effect";
export type ShopItem = { id: string; kind: ShopKind; name: string; price: number; emoji?: string | undefined };
export type ShopRow = { id: string; kind: string; name: string; emoji: string | null; price: number; active: boolean };

export const SHOP_KINDS: { kind: ShopKind; label: string }[] = [
  { kind: "background", label: "خلفيات البروفايل" },
  { kind: "frame", label: "إطارات الصورة" },
  { kind: "effect", label: "تأثيرات الاسم" },
  { kind: "badge", label: "العلامات" },
];

const BASE_ITEMS: ShopItem[] = [
  { id: "bg-gold", kind: "background", name: "ذهبي ملكي", price: 15000 },
  { id: "bg-night", kind: "background", name: "ليل النجوم", price: 10000 },
  { id: "bg-ember", kind: "background", name: "جمر", price: 20000 },
  { id: "bg-ocean", kind: "background", name: "محيط", price: 12000 },
  { id: "bg-aurora", kind: "background", name: "شفق", price: 30000 },
  { id: "bg-royal", kind: "background", name: "بنفسجي فاخر", price: 50000 },
  { id: "badge-crown", kind: "badge", name: "التاج", emoji: "👑", price: 25000 },
  { id: "badge-fire", kind: "badge", name: "نار", emoji: "🔥", price: 8000 },
  { id: "badge-diamond", kind: "badge", name: "ماسة", emoji: "💎", price: 40000 },
  { id: "badge-star", kind: "badge", name: "نجمة", emoji: "⭐", price: 5000 },
  { id: "badge-gamer", kind: "badge", name: "قيمر", emoji: "🎮", price: 7000 },
  { id: "badge-mic", kind: "badge", name: "صوت الفويس", emoji: "🎙️", price: 9000 },
  { id: "frame-gold", kind: "frame", name: "إطار ذهبي", price: 12000 },
  { id: "frame-neon", kind: "frame", name: "إطار نيون", price: 18000 },
  { id: "frame-fire", kind: "frame", name: "إطار ناري", price: 22000 },
  { id: "frame-rainbow", kind: "frame", name: "إطار قوس قزح", price: 35000 },
  { id: "fx-gold", kind: "effect", name: "اسم ذهبي لامع", price: 15000 },
  { id: "fx-glow", kind: "effect", name: "توهج", price: 10000 },
  { id: "fx-rainbow", kind: "effect", name: "قوس قزح", price: 30000 },
  { id: "fx-fire", kind: "effect", name: "نار", price: 20000 },
];
export const SHOP_ITEMS: ShopItem[] = [...BASE_ITEMS, ...EXTRA_ITEMS];
export const MAX_BADGES = 5;
export const PROFILE_COLORS = ["#e7b448", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

const KINDS = new Set<string>(["background", "badge", "frame", "effect"]);

/** Default items overridden by owner-edited rows; inactive rows hide an item, unknown rows add one. */
export function mergeCatalog(rows: ShopRow[] = []): ShopItem[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: ShopItem[] = [];
  for (const d of SHOP_ITEMS) {
    const r = byId.get(d.id);
    if (r && !r.active) continue;
    out.push(r ? { ...d, name: r.name, price: Number(r.price), emoji: r.emoji ?? d.emoji } : d);
  }
  for (const r of rows) {
    if (!r.active || !KINDS.has(r.kind) || SHOP_ITEMS.some((d) => d.id === r.id)) continue;
    out.push({ id: r.id, kind: r.kind as ShopKind, name: r.name, price: Number(r.price), emoji: r.emoji ?? undefined });
  }
  return out;
}

export const itemById = (id: string, items: ShopItem[] = SHOP_ITEMS) => items.find((i) => i.id === id);
/** CSS class for a cosmetic; owner-added items without a built-in look fall back to a generic style. */
export const cosmeticClass = (prefix: "pbg" | "pfr" | "nfx", id: string | null | undefined) =>
  !id ? "" : SHOP_ITEMS.some((d) => d.id === id) ? `${prefix}-${id}` : `${prefix}-custom`;
