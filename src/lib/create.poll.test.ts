import { describe, expect, it } from "vitest";
import { pollPayloadSchema } from "./create.functions";

const base = { channelId: "123456789012345678", question: "Best time?", duration: "1d" };
const opts = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `Option ${i + 1}`, emoji: "" }));

describe("poll payload", () => {
  it("rejects a poll with fewer than 2 options", () => {
    expect(pollPayloadSchema.safeParse({ ...base, options: opts(1) }).success).toBe(false);
  });
  it("accepts 2 and 5 options", () => {
    expect(pollPayloadSchema.safeParse({ ...base, options: opts(2) }).success).toBe(true);
    expect(pollPayloadSchema.safeParse({ ...base, options: opts(5) }).success).toBe(true);
  });
  it("rejects more than 5 options", () => {
    expect(pollPayloadSchema.safeParse({ ...base, options: opts(6) }).success).toBe(false);
  });
  it("defaults to single choice and no mention", () => {
    const r = pollPayloadSchema.parse({ ...base, options: opts(2) });
    expect(r.multiple).toBe(false);
    expect(r.mention).toBe("none");
  });
});
