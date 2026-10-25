import { describe, expect, it } from "vitest";
import { modulesSchema } from "./modules.schema";
import { SETTINGS_ACTIONS } from "./activity.functions";

describe("log style + bot language", () => {
  it("logs default to classic embeds", () => {
    expect(modulesSchema.parse({}).logs.style).toBe("embed");
  });
  it("logs can switch to images", () => {
    expect(modulesSchema.parse({ logs: { style: "image" } }).logs.style).toBe("image");
  });
  it("accepts the new bot languages", () => {
    expect(modulesSchema.parse({ general: { lang: "tr" } }).general.lang).toBe("tr");
  });
});

describe("server log", () => {
  it("only lists settings changes, not logins or moderation", () => {
    expect(SETTINGS_ACTIONS).toContain("save_settings");
    expect(SETTINGS_ACTIONS).not.toContain("login");
    expect(SETTINGS_ACTIONS).not.toContain("moderate:ban");
  });
});
