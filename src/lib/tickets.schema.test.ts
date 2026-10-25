import { describe, it, expect } from "vitest";
import { ticketSchema } from "./tickets.schema";

describe("ticket configuration", () => {
  it("retains multiple administration roles", () => {
    expect(ticketSchema.parse({ staffRoleIds: ["111", "222"] }).staffRoleIds).toEqual(["111", "222"]);
  });
  it("retains multiple blocked roles", () => {
    expect(ticketSchema.parse({ blockedRoleIds: ["333", "444"] }).blockedRoleIds).toEqual(["333", "444"]);
  });
  it("retains the chosen per-member open-ticket limit", () => {
    expect(ticketSchema.parse({ maxOpenTickets: 3 }).maxOpenTickets).toBe(3);
    expect(ticketSchema.safeParse({ maxOpenTickets: 0 }).success).toBe(false);
  });
});