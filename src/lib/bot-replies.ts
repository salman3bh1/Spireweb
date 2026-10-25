// Editable bot replies. Keys and default texts mirror the bot's features/replies.js;
// an empty saved text means "use the default", so the bot always has a reply.
const L = "┈┈┈┈┈┈┈┈┈┈┈┈┈┈";
const card = (head: string, rows: string[]) => [head, L, ...rows, L].join("\n");

export type ReplyDef = { key: string; group: string; label: string; vars: string[]; text: string };

export const BOT_REPLIES: ReplyDef[] = [
  { key: "ban", group: "العقوبات", label: "/ban — حظر عضو", vars: ["user", "by", "reason"],
    text: card("🚨 **تنبيه إداري: تم حظر العضو** 🚨", ["👤 **العضو :** {user}", "🛡️ **بواسطة :** {by}", "📌 **السبب :** {reason}"]) },
  { key: "unban", group: "العقوبات", label: "/unban — فك الحظر", vars: ["user"], text: "✅ **تم فك الباند عن** {user}" },
  { key: "kick", group: "العقوبات", label: "/kick — طرد عضو", vars: ["user", "by", "reason"],
    text: card("🚨 **تنبيه إداري: تم طرد العضو** 🚨", ["👤 **العضو :** {user}", "🛡️ **بواسطة :** {by}", "📌 **السبب :** {reason}"]) },
  { key: "warn", group: "العقوبات", label: "/warn — تحذير", vars: ["user", "by", "reason", "number"],
    text: card("⚠️ **تنبيه إداري: تم تحذير العضو** ⚠️", ["👤 **العضو :** {user}", "🛡️ **بواسطة :** {by}", "📌 **السبب :** {reason}", "🔢 **رقم التحذير :** {number}"]) },
  { key: "unwarn", group: "العقوبات", label: "/unwarn — إزالة تحذير", vars: ["user", "number", "reason", "left"],
    text: card("🔄 **تنبيه إداري: تم إزالة التحذير** 🔄", ["👤 **العضو :** {user}", "🔢 **رقم التحذير :** {number}", "📌 **السبب :** {reason}"]) },
  { key: "clearwarns", group: "العقوبات", label: "/clearwarns — مسح التحذيرات", vars: ["user"], text: "🧹 **تم مسح كل تحذيرات** {user}" },
  { key: "mute", group: "العقوبات", label: "/mute — ميوت", vars: ["user", "by", "duration", "reason"],
    text: card("🔇 **تنبيه إداري: تم إعطاء ميوت** 🔇", ["👤 **العضو :** {user}", "🛡️ **بواسطة :** {by}", "⏱️ **المدة :** {duration}", "📌 **السبب :** {reason}"]) },
  { key: "unmute", group: "العقوبات", label: "/unmute — فك الميوت", vars: ["user"], text: "✅ **تم فك الميوت عن** {user}" },
  { key: "timeout", group: "العقوبات", label: "/timeout — تايم أوت", vars: ["user", "by", "duration", "reason"],
    text: card("🔇 **تنبيه إداري: تم إعطاء تايم اوت** 🔇", ["👤 **العضو :** {user}", "🛡️ **بواسطة :** {by}", "⏱️ **المدة :** {duration}", "📌 **السبب :** {reason}"]) },
  { key: "untimeout", group: "العقوبات", label: "/untimeout — فك التايم أوت", vars: ["user"], text: "**تم فك التايم أوت**✅👤 {user}" },
  { key: "failed", group: "العقوبات", label: "لما يفشل تنفيذ العقوبة", vars: [],
    text: "❌ **لم أستطع التنفيذ — تأكد إن رتبة البوت فوق رتبة العضو وعنده الصلاحيات**" },
  { key: "credit_self", group: "الكريدت", label: "/credit — رصيدك", vars: ["username", "user", "balance"], text: "💳 **| {username}، رصيد حسابك هو `{balance}`**" },
  { key: "credit_other", group: "الكريدت", label: "/credit — رصيد شخص ثاني", vars: ["target", "username", "balance"], text: "💳 **| رصيد {target} هو `{balance}`**" },
  { key: "credit_low", group: "الكريدت", label: "الرصيد غير كافي", vars: ["balance"], text: "❌ **رصيدك غير كافي ! عندك `{balance}`**" },
  { key: "credit_code", group: "الكريدت", label: "طلب كود التحويل", vars: ["user", "username", "amount", "target"],
    text: "🔐 **{user}، أكتب الكود الموجود بالصورة , لديك 30 ثانية فقط**\n💸 **المبلغ :** `{amount}` ← {target}" },
  { key: "credit_wrong", group: "الكريدت", label: "الكود غلط", vars: [], text: "❌ **الكود غلط، تم إلغاء التحويل**" },
  { key: "credit_timeout", group: "الكريدت", label: "انتهى الوقت", vars: [], text: "⌛ **أنتهى الوقت , تم إلغاء التحويل**" },
  { key: "credit_sent", group: "الكريدت", label: "تم التحويل", vars: ["username", "user", "amount", "target"], text: "✅ **| {username}، تم تحويل `{amount}` لـ {target}**" },
  { key: "credit_bot", group: "الكريدت", label: "البوتات ما عندها كريدت", vars: [], text: "❌ **البوتات ليس لديها كريدت**" },
  { key: "profile_bot", group: "البروفايل", label: "/profile — على بوت", vars: [], text: "❌ **البوتات ليس لها بروفايل**" },
];

export const REPLY_VAR_LABELS: Record<string, string> = {
  user: "منشن العضو", by: "منشن الإداري", reason: "السبب", duration: "المدة", number: "رقم التحذير",
  left: "التحذيرات المتبقية", username: "اسم الشخص", balance: "الرصيد", amount: "المبلغ", target: "منشن المستلم",
};

/** Same placeholder fill the bot uses; unknown placeholders stay as written. */
export function fillReply(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (all, k: string) => (vars[k] !== undefined ? String(vars[k]) : all));
}
