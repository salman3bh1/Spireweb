import EN_FULL from "./i18n-en.json";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";
const KEY = "lx_lang";

// Arabic text is the key; English is the translation. Missing keys fall back to Arabic.
const EN: Record<string, string> = {
  "عام": "General",
  "قائمة الخصائص": "Features",
  "نظرة عامة": "Overview",
  "الأعضاء": "Members",
  "رسائل الإيمبد": "Embed messages",
  "كل الأوامر": "All commands",
  "إنشاء": "Create",
  "الأوامر العامة": "General commands",
  "الإشراف": "Moderation",
  "الترحيب & المغادرة": "Welcome & leave",
  "الكلمات المحظورة": "Banned words",
  "الرد التلقائي": "Auto reply",
  "الرولات التلقائية": "Auto roles",
  "اللوق": "Logs",
  "نظام التكت": "Tickets",
  "الستريك": "Streak",
  "المستويات والترتيب": "Levels & ranking",
  "الموسيقى": "Music",
  "كل السيرفرات": "All servers",
  "أقسام لوحة التحكم": "Dashboard sections",
  "جاري التحميل…": "Loading…",
  "لوحة التحكم": "Control panel",
  "تسجيل خروج": "Log out",
  "تسجيل الدخول": "Log in",
  "احذر — لديك تغييرات لم يتم حفظها!": "Careful — you have unsaved changes!",
  "إلغاء": "Cancel",
  "حفظ التغييرات": "Save changes",
  "جاري الحفظ…": "Saving…",
  "تعديل": "Edit",
  "حذف": "Delete",
  "إضافة": "Add",
  "بحث…": "Search…",
  "لا يوجد": "None",
  "اختر ..": "Choose ..",
  "الروم": "Channel",
  "الرسالة": "Message",
  "كل الأعضاء": "All members",
  "أكثر الناس عقوبات": "Most punished",
  "أكثر الناس تفاعلًا بالكتابة": "Most active in chat",
  "أكثر الناس تفاعلًا بالصوت": "Most active in voice",
  "أكثر الناس كريدت": "Richest members (credits)",
  "رسالة": "messages",
  "ساعة": "hours",
  "الناس اللي دخلهم": "People invited by",
  "ما دعى أحد بعد.": "Hasn't invited anyone yet.",
  "موجود": "In server",
  "طلع": "Left",
  "وهمي": "Fake",
  "الدعوات": "Invites",
  "اضغط على العدد حتى تشوف الأشخاص": "Click the number to see the people",
  "الكلمات": "Words",
  "رفع ملف Word": "Upload Word file",
  "العقوبة": "Punishment",
  "روم سجل المخالفات": "Violations log channel",
  "الرومات المفعلة": "Enabled channels",
  "الرومات المعطلة": "Disabled channels",
  "الرولات المفعلة": "Enabled roles",
  "الرولات المعطلة": "Disabled roles",
  "اختر وش تبي تنشئ": "Choose what you want to create",
  "إحصائيات السيرفر": "Server stats",
  "رومات اللوق": "Log channels",
  "الغرف المؤقتة": "Temporary voice",
  "القيف أواي": "Giveaway",
  "آخر الطلبات": "Recent requests",
  "دخول": "Join",
  "خروج": "Leave",
  "رسالة خاصة": "DM",
  "صورة ترحيب": "Welcome image",
  "المستخدمين": "Users",
  "السيرفرات": "Servers",
  "النشاط": "Activity",
  "التحكم بالأعضاء": "Member control",
  "الكريدت": "Credits",
  "اللفل": "Level",
  "تطبيق": "Apply",
  "إضافة كريدت": "Add credits",
  "سحب كريدت": "Remove credits",
  "تحديد اللفل": "Set level",
  "تحديد الستريك": "Set streak",
  "آيدي العضو": "User ID",
  "اللغة": "Language",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: <T,>(ar: T) => T };
const I18n = createContext<Ctx>({ lang: "ar", setLang: () => {}, t: (s) => s });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "ar") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => { localStorage.setItem(KEY, l); setLangState(l); };
  const t = <T,>(ar: T): T => (lang === "en" && typeof ar === "string" ? ((EN[ar] ?? (EN_FULL as Record<string,string>)[ar] ?? ar) as T) : ar);
  return <I18n.Provider value={{ lang, setLang, t }}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
export const useT = () => useContext(I18n).t;
