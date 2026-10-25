import { describe, expect, it } from "vitest";
import { mergeCatalog, SHOP_ITEMS } from "./shop";
import { progress } from "./achievements";

describe("shop catalog", () => {
  it("owner price override replaces the default price", () => {
    const items = mergeCatalog([{ id: "badge-star", kind: "badge", name: "نجمة", emoji: "⭐", price: 999, active: true }]);
    expect(items.find((i) => i.id === "badge-star")?.price).toBe(999);
  });
  it("hidden items disappear from the shop", () => {
    const items = mergeCatalog([{ id: "bg-gold", kind: "background", name: "x", emoji: null, price: 1, active: false }]);
    expect(items.some((i) => i.id === "bg-gold")).toBe(false);
    expect(items.length).toBe(SHOP_ITEMS.length - 1);
  });
  it("owner-added items are sold", () => {
    const items = mergeCatalog([{ id: "custom-1", kind: "badge", name: "قطة", emoji: "🐱", price: 500, active: true }]);
    expect(items.find((i) => i.id === "custom-1")?.price).toBe(500);
  });
});

describe("achievements", () => {
  it("100 messages unlocks the first chat achievement but not the second", () => {
    const p = progress({ messages: 100, voiceMinutes: 0, wins: 0, credits: 0, level: 0, items: 0, dailyClaims: 0 });
    expect(p.find((a) => a.id === "messages-100")?.done).toBe(true);
    expect(p.find((a) => a.id === "messages-1000")?.done).toBe(false);
  });
});
