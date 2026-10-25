// The dashboard's command list. The bot registers the same names per server and
// hides any command that is switched off here (or off by default below).
const raw: [string, string][] = [
  ["afk", "💤 قم بتعيين حالة إيفك التي تظهر عند ذكرك, وعرضها في اسم المستخدم"],
  ["announce", "📢 نشر إعلان بتنسيق مرتب"], ["apply", "📝 التقديم على فريق الإدارة"], ["autoreply", "💬 إنشاء رد تلقائي"],
  ["avatar", "🖼️ عرض صورة بروفايل العضو"], ["colors", "🎨 اختر لون اسمك"], ["credit", "💰 عرض الكريدت او تحويله"],
  ["freegames", "🎮 الألعاب المجانية على Epic و GOG و ستيم"], ["gamerank", "🏆 رانكك بالألعاب (FACEIT و League of Legends)"],
  ["giveaway", "🎉 السحوبات"], ["help", "💜 عرض جميع أوامر البوت"], ["invites", "📨 عدد الأعضاء اللي دخلتهم وتفاصيلهم"],
  ["mcstatus", "⛏️ حالة سيرفر ماينكرافت وعدد اللاعبين"], ["ping", "🏓 سرعة أستجابة البوت"], ["prayer", "🕌 أوقات الصلاة"],
  ["profile", "👤 تفاصيل المستخدم"], ["staff", "🏅 نقاط ترقيات الإدارة"], ["streak", "🔥 عرض ستريكك او ستريك شخص آخر"],
  ["streak-leaderboard", "🏆 قائمة المتصدرين للستريك"], ["setup-streak", "🔥 إعداد نظام الستريك"], ["suggest", "💡 أرسل اقتراحك"],
  ["rank", "📊 مستوى العضو في السيرفر"], ["top", "🏆 عرض التوب"],
  ["ban", "🔨 باند لعضو من السيرفر"], ["unban", "🔓 فك الباند عن عضو"], ["kick", "👢 طرد عضو من السيرفر"],
  ["clear", "🧹 مسح الرسائل"], ["lock", "🔒 قفل المحادثة"], ["unlock", "🔓 فتح المحادثة"], ["nick", "✏️ تغيير لقب عضو"],
  ["slowmode", "🐢 الوضع البطيء للروم"], ["timeout", "⏳ إعطاء تايم اوت"], ["untimeout", "⌛ فك التايم اوت"],
  ["mute", "🔇 إعطاء كتم"], ["unmute", "🔊 فك الكتم"], ["warn", "⚠️ إعطاء تحذير لعضو"], ["warnings", "📋 عرض تحذيرات عضو"],
  ["unwarn", "↩️ إزالة تحذير من عضو"], ["clearwarns", "🧽 مسح كل تحذيرات عضو"], ["ticket-setup", "🎫 إرسال لوحة التذاكر"],
  ["role", "🏷️ إعطاء او سحب رتبة من عضو"], ["hide", "🙈 إخفاء المحادثة عن الأعضاء"], ["unhide", "👁️ إظهار الروم للأعضاء"],
  ["say", "🗣️ البوت يرسل رسالتك"], ["poll", "📊 تصويت سريع"], ["roleinfo", "🏷️ معلومات رتبة"], ["server", "🏠 عرض معلومات السيرفر"],
  ["loop", "🔁 تكرار الأغنية او القائمة"], ["nowplaying", "🎶 شنو يشتغل الحين"], ["pause", "⏸️ إيقاف الأغنية"],
  ["play", "🎵 تشغيل أغنية"], ["queue", "📜 قائمة التشغيل"], ["remove", "🗑️ إزالة أغنية من القائمة"], ["resume", "▶️ أستكمال التشغيل"],
  ["xo", "❌ لعبة XO — بدون منشن تصير بطولة"], ["flags", "🌍 لعبة أعلام الدول"], ["roulette", "🎡 لعبة الروليت"],
  ["points", "🏆 ترتيب نقاط الألعاب"], ["fast", "⚡ لعبة أسرع"], ["fakk", "🧩 لعبة فكك"], ["reverse", "🔄 لعبة عكس"],
  ["plural", "👥 لعبة جمع"], ["singular", "👤 لعبة مفرد"], ["math", "➗ لعبة رياضيات"], ["riddle", "🧠 لغز"], ["language", "🌐 تغيير لغة البوت"],
  ["stickers", "🏷️ إضافة ملصق للسيرفر (PNG أو GIF)"], ["summon", "📣 استدعاء عضو برسالة على الخاص"], ["aemoji", "😀 إضافة إيموجي للسيرفر"], ["banner", "🖼️ عرض بنر العضو"],
  ["vkick", "🔇 طرد عضو من الروم الصوتي"], ["vmute", "🎙️ ميوت صوتي لعضو"], ["move", "↪️ سحب عضو إلى رومك"],
  ["moveme", "🚶 انتقال إلى روم عضو آخر"], ["moveto", "📍 سحب عضو أو نفسك إلى روم محدد"], ["moveall", "🚚 سحب جميع أعضاء روم إلى روم آخر"],
  ["mcplayer", "🧱 معلومات وسكن لاعب ماينكرافت"], ["mcskin", "👕 سكن لاعب ماينكرافت بالحجم الكامل"],
  ["whois", "🕵️ لعبة من يكون؟ — خمّن الشخصية من الصورة"], ["password", "🔐 لعبة كلمة السر — كل لاعب يكشف حرف"],
  ["skip", "⏭️ تخطي الأغنية الحالية"], ["stop", "⏹️ إيقاف الموسيقى"], ["volume", "🔊 تغيير مستوى الصوت"],
];
export const COMMAND_CATALOG = raw.map(([name, description]) => ({ name, description })).sort((a, b) => a.name.localeCompare(b.name));

// Commands that stay hidden in Discord until switched on from the dashboard.
export const DEFAULT_OFF = new Set([
  "announce", "apply", "colors", "freegames", "gamerank", "giveaway", "nowplaying",
  "poll", "prayer", "roleinfo", "say", "staff", "ticket-setup",
]);

export const defaultEnabled = (name: string) => !DEFAULT_OFF.has(name);
export const isCommandOn = (name: string, cfg?: { enabled?: boolean } | null) => cfg?.enabled ?? defaultEnabled(name);
