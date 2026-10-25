import { describe, expect, it } from "vitest";
import { nextRun } from "./schedule";

describe("scheduled announcements", () => {
  const at = new Date("2026-10-20T18:00:00Z");
  it("one-time announcements do not repeat", () => expect(nextRun(at, "none", at)).toBeNull());
  it("daily repeats 24 hours later", () => expect(nextRun(at, "daily", at)?.toISOString()).toBe("2026-10-21T18:00:00.000Z"));
  it("weekly repeats 7 days later", () => expect(nextRun(at, "weekly", at)?.toISOString()).toBe("2026-10-27T18:00:00.000Z"));
});
