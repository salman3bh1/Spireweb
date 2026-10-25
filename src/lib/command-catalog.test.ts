import { describe, expect, it } from "vitest";
import { COMMAND_CATALOG, isCommandOn } from "./command-catalog";

const names = new Set(COMMAND_CATALOG.map((c) => c.name));

describe("command catalog", () => {
  it("keeps announce and apply off by default", () => {
    expect(isCommandOn("announce")).toBe(false);
    expect(isCommandOn("apply")).toBe(false);
  });
  it("keeps avatar and credit on by default", () => {
    expect(isCommandOn("avatar")).toBe(true);
    expect(isCommandOn("credit")).toBe(true);
  });
  it("respects a saved switch over the default", () => {
    expect(isCommandOn("avatar", { enabled: false })).toBe(false);
    expect(isCommandOn("say", { enabled: true })).toBe(true);
  });
  it("removes deleted commands", () => {
    for (const n of ["leaderboard", "shuffle", "welcome-off", "welcome-setup", "welcome-test", "xp"]) expect(names.has(n)).toBe(false);
  });
  it("includes autoreply, invites and credit", () => {
    for (const n of ["autoreply", "invites", "credit"]) expect(names.has(n)).toBe(true);
  });
});

describe("afk command", () => {
  it("is listed and on by default", () => {
    expect(names.has("afk")).toBe(true);
    expect(isCommandOn("afk")).toBe(true);
  });
});
