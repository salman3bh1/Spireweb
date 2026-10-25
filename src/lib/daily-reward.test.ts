import { describe, expect, it } from "vitest";
import { rollDailyReward, nextClaimAt, DAILY_COOLDOWN_MS } from "./daily-reward";

describe("daily reward", () => {
  it("never goes below 1000 or above 5000", () => {
    expect(rollDailyReward(0.99, 0)).toBe(1000);
    expect(rollDailyReward(0, 0.999999)).toBe(5000);
  });

  it("most rewards are above 2000", () => {
    let high = 0;
    for (let i = 0; i < 5000; i++) if (rollDailyReward() > 2000) high++;
    expect(high / 5000).toBeGreaterThan(0.7);
  });

  it("can only be claimed again 24 hours after the last claim", () => {
    const justNow = new Date(Date.now() - 1000).toISOString();
    expect(nextClaimAt(justNow)).toBeGreaterThan(Date.now());
    const longAgo = new Date(Date.now() - DAILY_COOLDOWN_MS - 1000).toISOString();
    expect(nextClaimAt(longAgo)).toBeNull();
  });
});
