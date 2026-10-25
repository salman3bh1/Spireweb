import { describe, expect, it } from "vitest";
import { BOT_REPLIES, fillReply } from "./bot-replies";
import { modulesSchema } from "./modules.schema";

const text = (key: string) => BOT_REPLIES.find((r) => r.key === key)!.text;

describe("bot replies", () => {
  it("ban shows the member mention only once", () => {
    const out = fillReply(text("ban"), { user: "<@1>", by: "<@2>", reason: "x" });
    expect(out.split("<@1>").length - 1).toBe(1);
    expect(out.startsWith("🚨 **تنبيه إداري: تم حظر العضو** 🚨")).toBe(true);
  });
  it("warn lists member, by, reason, then warning number", () => {
    expect(text("warn").split("\n").slice(2, 6)).toEqual([
      "👤 **العضو :** {user}", "🛡️ **بواسطة :** {by}", "📌 **السبب :** {reason}", "🔢 **رقم التحذير :** {number}",
    ]);
  });
  it("custom replies are saved with the server settings", () => {
    const m = modulesSchema.parse({ replies: { texts: { kick: "طردنا {user}" } } });
    expect(m.replies.texts["kick"]).toBe("طردنا {user}");
    expect(modulesSchema.parse({}).replies.texts).toEqual({});
  });
});
