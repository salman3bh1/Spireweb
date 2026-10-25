import { describe, expect, it } from "vitest";
import { DEFAULT_LOG_COLOR, embedDataSchema, modulesSchema } from "./modules.schema";

describe("module defaults", () => {
  it("log color defaults to rgb(127, 212, 193)", () => {
    expect(DEFAULT_LOG_COLOR).toBe("#7FD4C1");
  });
  it("new embeds default to RGB 127, 212, 193", () => {
    expect(embedDataSchema.parse({}).color).toBe("#7FD4C1");
  });
  it("saved custom embed colors remain unchanged", () => {
    expect(embedDataSchema.parse({ color: "#123456" }).color).toBe("#123456");
  });
  it("auto-reply items accept allowed/blocked channels and roles", () => {
    const m = modulesSchema.parse({ autoReply: { items: [{ trigger: "hi", reply: "yo", ignoreChannelIds: ["123"], roleIds: ["456"], ignoreRoleIds: ["789"] }] } });
    const it0 = m.autoReply.items[0];
    if (!it0) throw new Error("Missing parsed auto reply");
    expect(it0.ignoreChannelIds).toEqual(["123"]);
    expect(it0.roleIds).toEqual(["456"]);
    expect(it0.ignoreRoleIds).toEqual(["789"]);
  });
});
