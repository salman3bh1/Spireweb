// Client-safe schemas for every dashboard module. The bot reads the same JSON
// from /api/public/bot/settings (field "modules").
import { z } from "zod";

export const BOT_LANGS = ["ar", "en", "fr", "es", "de", "it", "ru", "zh", "tr", "pt", "id", "ja", "ko", "hi"] as const;

const id = z.string().max(25);
const ids = z.array(id).max(100).default([]);
const cid = id.nullable().default(null);

export const STAT_KINDS = ["members", "humans", "bots", "online", "voice", "text", "voiceChannels", "channels", "roles", "boosts"] as const;
export type StatKind = (typeof STAT_KINDS)[number];

export const AUTOMOD_RULES = [
  { id: "words", group: "words", title: "فلترة الكلمات المحظورة", desc: "فلترة الكلمات المسيئة والشتائم والمحتوى غير اللائق" },
  { id: "invites", group: "words", title: "حظر دعوات السيرفرات", desc: "منع مشاركة روابط دعوات السيرفرات الأخرى" },
  { id: "spam", group: "spam", title: "مكافحة السبام", desc: "كشف الرسائل المزعجة والمتكررة بسرعة" },
  { id: "links", group: "spam", title: "حظر الروابط", desc: "حظر الروابط غير المسموح بها" },
  { id: "mentions", group: "spam", title: "حظر سبام المنشن", desc: "حد عدد المنشنات المسموح بها في الرسالة الواحدة" },
  { id: "caps", group: "spam", title: "حظر الحروف الكبيرة", desc: "منع الرسائل اللي فيها أحرف كبيرة بشكل مفرط" },
  { id: "spoilers", group: "spam", title: "إزعاج Spoilers", desc: "منع الاستخدام المفرط لعلامات السبويلر" },
  { id: "zalgo", group: "spam", title: "نص Zalgo", desc: "منع النصوص المشوهة والرموز الغريبة" },
  { id: "emojis", group: "spam", title: "سبام الإيموجي", desc: "حد عدد الإيموجي في الرسالة الواحدة" },
  { id: "newlines", group: "spam", title: "الأسطر الكثيرة", desc: "منع الرسائل الطويلة جداً بالأسطر" },
] as const;
export type AutomodRuleId = (typeof AUTOMOD_RULES)[number]["id"];
/** Sensible threshold per rule; the editor applies it when a rule is first turned on. */
export const AUTOMOD_DEFAULT_LIMIT: Record<AutomodRuleId, number> = { words: 1, invites: 1, links: 1, zalgo: 1, spam: 5, mentions: 5, caps: 70, spoilers: 3, emojis: 10, newlines: 15 };
const automodRule = z.object({
  enabled: z.boolean().default(false),
  // delete = حذف الرسالة · warn = حذف + تنبيه · timeout = حذف + تايم أوت
  action: z.enum(["delete", "warn", "timeout"]).default("delete"),
  timeoutMinutes: z.number().int().min(1).max(40320).default(5),
  // limit = threshold for spam (msgs in 5s), mentions, caps %, spoilers, emojis, newlines
  limit: z.number().int().min(1).max(100).default(5),
  words: z.array(z.string().trim().min(1).max(100)).max(300).default([]),
  allow: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  ignoreRoleIds: ids,
  ignoreChannelIds: ids,
}).default({});

export const commandSchema = z.object({
  enabled: z.boolean().default(true),
  aliases: z.array(z.string().trim().min(1).max(32)).max(20).default([]),
  allowRoles: ids,
  denyRoles: ids,
  allowChannels: ids,
  denyChannels: ids,
  deleteInvoke: z.boolean().default(false),
  deleteReplyAfter5s: z.boolean().default(false),
  deleteWithMessage: z.boolean().default(false),
});

export const bannedRuleSchema = z.object({
  id: z.string().max(40),
  name: z.string().trim().max(60).default(""),
  words: z.array(z.string().trim().min(1).max(100)).max(200).default([]),
  // exact = الرسالة كلها نفس الكلمة · word = الكلمة موجودة ككلمة مستقلة بالجملة · contains = موجودة بأي مكان حتى داخل كلمة
  match: z.enum(["exact", "word", "contains"]).default("word"),
  punishment: z.enum(["none", "timeout", "mute", "kick", "ban"]).default("timeout"),
  durationMinutes: z.number().int().min(0).max(40320).default(10),
  deleteMessage: z.boolean().default(true),
  warnMessage: z.string().max(500).default("{user} ممنوع استخدام هذه الكلمة!"),
  ignoreRoles: ids,
  ignoreChannels: ids,
});
export type BannedRule = z.infer<typeof bannedRuleSchema>;

export const LOG_EVENTS = [
  ["banAdd", "إضافة باند"],
  ["banRemove", "إزالة باند"],
  ["timeout", "التايم اوت (إعطاء / إزالة)"],
  ["kick", "طرد عضو"],
  ["memberJoin", "دخول عضو"],
  ["memberLeave", "خروج عضو"],
  ["messageDelete", "حذف رسالة"],
  ["messageEdit", "تعديل رسالة"],
  ["channelCreate", "إنشاء روم جديد"],
  ["channelDelete", "حذف روم"],
  ["roleCreate", "إنشاء رتبة"],
  ["roleDelete", "حذف رتبة"],
  ["memberRoleUpdate", "تغيير رتب عضو"],
  ["nicknameChange", "تغيير اللقب"],
  ["voiceJoin", "دخول روم صوتي"],
  ["voiceLeave", "خروج من روم صوتي"],
  ["reactionAdd", "إضافة رياكشن"],
  ["reactionRemove", "إزالة رياكشن"],
] as const;

/** Default log embed color: rgb(127, 212, 193). */
export const DEFAULT_LOG_COLOR = "#7FD4C1";
const logEvent = z.object({
  enabled: z.boolean().default(false),
  channelId: cid,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default(DEFAULT_LOG_COLOR),
});

const pos = (x: number, y: number) => z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).default({ x, y });
// Cards saved with the old purple defaults switch to the site's own palette.
function fromOldPurple<T extends { bgColor1: string; bgColor2: string; accent: string }>(c: T): T {
  const old = c.bgColor1.toLowerCase() === "#140a26" && c.bgColor2.toLowerCase() === "#4c1d95";
  return old ? { ...c, bgColor1: "#0b1514", bgColor2: "#134e48", accent: c.accent.toLowerCase() === "#a855f7" ? "#7fd4c1" : c.accent } : c;
}
export const cardSchema = (title: string, subtitle: string) =>
  z
    .object({
      enabled: z.boolean().default(false),
      channelId: cid,
      backgroundUrl: z.string().max(500).default(""),
      // Background kind; when absent, an uploaded backgroundUrl means "image", otherwise "gradient".
      bgStyle: z.enum(["gradient", "solid", "image"]).optional(),
      bgColor1: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0b1514"),
      bgColor2: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#134e48"),
      title: z.string().max(60).default(title),
      subtitle: z.string().max(120).default(subtitle),
      avatar: pos(50, 30),
      avatarSize: z.number().min(60).max(300).default(170),
      titlePos: pos(50, 64),
      namePos: pos(50, 77),
      subtitlePos: pos(50, 90),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7fd4c1"),
    })
    .transform(fromOldPurple)
    .default({});
export type CardCfg = z.infer<ReturnType<typeof cardSchema>>;
export const cardBgStyle = (c: Pick<CardCfg, "bgStyle" | "backgroundUrl">) => c.bgStyle ?? (c.backgroundUrl ? "image" : "gradient");

export const CREATOR_PLATFORMS = ["youtube", "twitch", "kick", "tiktok", "telegram", "x", "instagram"] as const;
export type CreatorPlatform = (typeof CREATOR_PLATFORMS)[number];
export const creatorSchema = z.object({
  id: z.string().max(40),
  platform: z.enum(CREATOR_PLATFORMS),
  handle: z.string().trim().min(1).max(200),
  name: z.string().trim().max(80).default(""),
  channelId: cid,
  mention: z.string().max(25).default(""), // "" | "everyone" | "here" | role id
  notifyPosts: z.boolean().default(true),
  notifyLive: z.boolean().default(true),
  notifyVod: z.boolean().default(true),
  postMessage: z.string().max(1500).default("{name} نزّل جديد! {link}"),
  liveMessage: z.string().max(1500).default("🔴 {name} بدأ بث مباشر! {link}"),
  vodMessage: z.string().max(1500).default("📼 انتهى بث {name} — شوف البث المحفوظ"),
});
export type Creator = z.infer<typeof creatorSchema>;

export const modulesSchema = z.object({
  creators: z.object({
    enabled: z.boolean().default(true),
    items: z.array(creatorSchema).max(50).default([]),
  }).default({}),
  dividers: z.object({
    enabled: z.boolean().default(false),
    channelIds: ids,
    style: z.string().regex(/^[a-z0-9-]{1,32}$/).default("diamond"),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#b8f5e6"),
    ignoreBots: z.boolean().default(true),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7fd4c1"),
    imageUrl: z.string().max(500).default(""),
  }).default({}),
  streak: z.object({
    enabled: z.boolean().default(true),
    channelId: cid,
    reaction: z.string().trim().min(1).max(64).default("🔥"),
    duplicateReaction: z.string().trim().min(1).max(64).default("⚠️"),
    message: z.string().min(1).max(1800).default("تم تحديث ستريك {user} — 🔥 {streak} يوم"),
    duplicateMessage: z.string().min(1).max(1800).default("{user} ستريكك مُحدث اليوم — {streak} يوم"),
    reminderMessage: z.string().min(1).max(1800).default("لا تنسى ترسل الستريك قبل نهاية اليوم!"),
  }).default({}),
  general: z
    .object({
      enabled: z.boolean().default(true),
      commands: z.record(z.string().max(32), commandSchema).default({}),
      // Bot language (synced both ways with /language) and chat prefix ("" = no prefix).
      lang: z.enum(BOT_LANGS).optional(),
      prefix: z.string().trim().max(5).optional(),
    })
    .default({}),
  moderation: z
    .object({
      enabled: z.boolean().default(true),
      modRoleIds: ids,
      muteDuration: z.enum(["untilLeave", "1h", "6h", "12h", "1d", "7d"]).default("untilLeave"),
      maxWarnings: z.number().int().min(0).max(50).default(0),
    })
    .default({}),
  welcome: z
    .object({
      enabled: z.boolean().default(true),
      joinMessage: z
        .object({ enabled: z.boolean().default(false), channelId: cid, text: z.string().max(1800).default("مرحبا {user} في {server}! أنت العضو رقم {count}") })
        .default({}),
      joinImage: cardSchema("أهلاً وسهلاً", "أنت العضو رقم {count} في {server}"),
      leaveImage: cardSchema("إلى اللقاء", "نتمنى نشوفك مرة ثانية • صرنا {count} عضو"),
      joinDm: z.object({ enabled: z.boolean().default(false), text: z.string().max(1800).default("") }).default({}),
      leaveMessage: z
        .object({ enabled: z.boolean().default(false), channelId: cid, text: z.string().max(1800).default("{username} غادر السيرفر") })
        .default({}),
    })
    .default({}),
  autoReply: z
    .object({
      enabled: z.boolean().default(true),
      items: z
        .array(
          z.object({
            trigger: z.string().trim().min(1).max(200),
            // text = plain reply · embed = embed built here · react = emoji reaction · image = picture + optional caption
            kind: z.enum(["text", "embed", "react", "image"]).default("text"),
            reply: z.string().trim().max(1800).default(""),
            match: z.enum(["exact", "contains", "startsWith", "endsWith", "regex"]).default("exact"),
            embedTitle: z.string().max(256).default(""),
            embedColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#38bdf8"),
            emoji: z.string().max(64).default(""),
            imageUrl: z.string().max(500).default(""),
            mentionUser: z.boolean().default(false),
            deleteTrigger: z.boolean().default(false),
            cooldownSeconds: z.number().int().min(0).max(3600).default(2),
            channelIds: ids,
            ignoreChannelIds: ids,
            roleIds: ids,
            ignoreRoleIds: ids,
          }),
        )
        .max(100)
        .default([]),
    })
    .default({}),
  logs: z
    .object({
      enabled: z.boolean().default(true),
      // "embed" = classic Discord embed, "image" = the bot draws the same info as a picture.
      style: z.enum(["embed", "image"]).default("embed"),
      events: z.record(z.string().max(32), logEvent).default({}),
    })
    .default({}),
  colors: z.object({ roleIds: ids }).default({}),
  // Owner-edited bot reply texts by key (see src/lib/bot-replies.ts); missing/empty = bot default.
  replies: z.object({ texts: z.record(z.string().max(40), z.string().max(1800)).default({}) }).default({}),
  // Server counters shown as locked voice channels; the bot renames them every ~10 minutes.
  statChannels: z
    .object({
      enabled: z.boolean().default(false),
      category: z.string().trim().max(90).default("📊・إحصائيات السيرفر"),
      items: z.array(z.object({ kind: z.enum(STAT_KINDS), name: z.string().trim().min(1).max(90) })).max(8).default([]),
    })
    .default({}),
  // Auto-moderation rules enforced by the bot on every message.
  automod: z
    .object({
      enabled: z.boolean().default(false),
      logChannelId: cid,
      ignoreRoleIds: ids,
      ignoreChannelIds: ids,
      rules: z.object(Object.fromEntries(AUTOMOD_RULES.map((r) => [r.id, automodRule])) as Record<AutomodRuleId, typeof automodRule>).default({} as never),
    })
    .default({}),
  bannedWords: z
    .object({
      enabled: z.boolean().default(true),
      logChannelId: cid,
      rules: z.array(bannedRuleSchema).max(50).default([]),
    })
    .default({}),
  autoRoles: z
    .object({
      enabled: z.boolean().default(true),
      memberRoleIds: ids,
      botRoleIds: ids,
      job: z
        .object({ id: z.string().max(40), roleId: id, action: z.enum(["give", "remove"]), target: z.enum(["members", "all", "bots"]) })
        .nullable()
        .default(null),
    })
    .default({}),
});

export type Modules = z.infer<typeof modulesSchema>;
export type CommandCfg = z.infer<typeof commandSchema>;
export const defaultCommand = (): CommandCfg => commandSchema.parse({});

export const embedFieldSchema = z.object({
  name: z.string().trim().min(1).max(256),
  value: z.string().trim().min(1).max(1024),
  inline: z.boolean().default(false),
});

export const embedDataSchema = z.object({
  content: z.string().max(2000).default(""),
  title: z.string().max(256).default(""),
  url: z.string().max(500).default(""),
  description: z.string().max(4000).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default(DEFAULT_LOG_COLOR),
  authorName: z.string().max(256).default(""),
  authorIcon: z.string().max(500).default(""),
  thumbnail: z.string().max(500).default(""),
  image: z.string().max(500).default(""),
  footer: z.string().max(2048).default(""),
  footerIcon: z.string().max(500).default(""),
  timestamp: z.boolean().default(false),
  fields: z.array(embedFieldSchema).max(25).default([]),
});
export type EmbedData = z.infer<typeof embedDataSchema>;
