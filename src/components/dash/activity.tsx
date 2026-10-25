import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Settings, ShieldAlert, Wand2, FileText, Image as ImageIcon, Users, LogIn } from "lucide-react";
import { getSiteActivity } from "@/lib/activity.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./kit";

type L = [string, string];
const ACTIONS: Record<string, L> = {
  save_settings: ["عدّل إعدادات السيرفر", "Updated server settings"],
  save_ticket: ["عدّل إعدادات التذاكر", "Updated ticket settings"],
  save_aliases: ["عدّل الاختصارات", "Updated command aliases"],
  add_note: ["أضاف ملاحظة على عضو", "Added a member note"],
  delete_note: ["حذف ملاحظة", "Deleted a member note"],
  create_embed: ["أنشأ رسالة إيمبد", "Created an embed"],
  update_embed: ["عدّل رسالة إيمبد", "Edited an embed"],
  save_embed: ["حفظ رسالة", "Saved a message"],
  delete_embed: ["حذف رسالة إيمبد", "Deleted an embed"],
  send_embed: ["أرسل رسالة عبر البوت", "Sent a message via the bot"],
  edit_embed: ["عدّل رسالة مرسلة", "Edited a sent message"],
  upload_image: ["رفع صورة", "Uploaded an image"],
  role_job: ["بدأ توزيع/سحب رتبة", "Started a bulk role job"],
  login: ["سجّل دخول للموقع", "Signed in to the dashboard"],
  "access:grant": ["عدّل صلاحيات اللوحة", "Changed dashboard access"],
};
const MOD: Record<string, L> = {
  warn: ["حذّر عضو", "Warned a member"], mute: ["أسكت عضو", "Muted a member"], unmute: ["فك الإسكات عن عضو", "Unmuted a member"],
  kick: ["طرد عضو", "Kicked a member"], ban: ["بنّد عضو", "Banned a member"], unban: ["فك الباند عن عضو", "Unbanned a member"],
};
const CREATE: Record<string, L> = {
  stats: ["رومات الإحصائيات", "stats channels"], logs: ["رومات اللوق", "log channels"], tempvoice: ["الرومات المؤقتة", "temp voice"],
  giveaway: ["قيف أواي", "giveaway"], poll: ["تصويت", "poll"], ticket: ["لوحة التكت", "ticket panel"], streak: ["الستريك", "streak"],
};
const SECTIONS: Record<string, L> = {
  dividers: ["الفواصل", "Dividers"], streak: ["الستريك", "Streak"], general: ["الأوامر العامة", "General commands"],
  moderation: ["الإشراف", "Moderation"], welcome: ["الترحيب & المغادرة", "Welcome & leave"], autoReply: ["الرد التلقائي", "Auto reply"],
  logs: ["اللوق", "Logs"], colors: ["الألوان", "Colors"], bannedWords: ["الكلمات المحظورة", "Banned words"], autoRoles: ["الرولات التلقائية", "Auto roles"], creators: ["صناع المحتوى", "Content creators"],
};
const MODES: Record<string, L> = { create: ["إنشاء", "create"], another: ["إنشاء جديد", "new copy"], replace: ["استبدال", "replace"], edit: ["تعديل", "edit"] };

function iconFor(action: string) {
  if (action.startsWith("moderate:")) return ShieldAlert;
  if (action.startsWith("create:")) return Wand2;
  if (action.startsWith("admin:")) return Users;
  if (action.includes("embed")) return FileText;
  if (action === "upload_image") return ImageIcon;
  if (action === "login") return LogIn;
  return Settings;
}

export function SiteActivity({ guildId }: { guildId: string }) {
  const [page, setPage] = useState(0);
  const { lang, t } = useI18n();
  const i = lang === "ar" ? 0 : 1;
  const { data, isLoading, error } = useQuery({
    queryKey: ["site-activity", guildId, page],
    queryFn: () => getSiteActivity({ data: { guildId, page } }),
    refetchInterval: 15000,
  });

  const label = (action: string) => {
    if (ACTIONS[action]) return ACTIONS[action][i];
    const [kind, rest = ""] = action.split(":");
    if (kind === "moderate" && MOD[rest]) return MOD[rest][i];
    if (kind === "create") return `${lang === "ar" ? "طلب إنشاء: " : "Requested "}${CREATE[rest]?.[i] ?? rest}`;
    if (kind === "admin") return `${lang === "ar" ? "إجراء إداري: " : "Admin action: "}${rest}`;
    return action;
  };
  const detail = (action: string, raw: unknown) => {
    if (!raw || typeof raw !== "object") return "";
    const d = raw as { sections?: unknown; name?: unknown; mode?: unknown; reason?: unknown; userId?: unknown; count?: unknown };
    const out: string[] = [];
    if (Array.isArray(d.sections) && d.sections.length) out.push(d.sections.map((s) => SECTIONS[String(s)]?.[i] ?? String(s)).join("، "));
    if (typeof d.name === "string") out.push(d.name);
    if (typeof d.mode === "string" && action.startsWith("create:")) out.push(MODES[d.mode]?.[i] ?? d.mode);
    if (typeof d.reason === "string" && d.reason) out.push(`${lang === "ar" ? "السبب" : "Reason"}: ${d.reason}`);
    if (typeof d.userId === "string") out.push(`ID ${d.userId}`);
    if (typeof d.count === "number") out.push(`${d.count} ${lang === "ar" ? "اختصار" : "aliases"}`);
    return out.join(" · ");
  };
  const fmt = (iso: string) => new Date(iso).toLocaleString(lang === "ar" ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <PageHeader title={t("السجل")} />
      {isLoading && <p className="text-muted-foreground">{t("جاري التحميل…")}</p>}
      {error && <p role="alert" className="text-destructive">{t("تعذر تحميل السجل")}</p>}

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4 font-bold"><History className="h-4 w-4 text-primary" />{t("تغييرات إعدادات السيرفر")}</div>
        <ol className="divide-y divide-border">
          {data?.activity.map((row) => {
            const Icon = iconFor(row.action);
            const extra = detail(row.action, row.details as never);
            return (
              <li key={row.id} className="flex items-start gap-4 px-5 py-4">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{label(row.action)}</p>
                  {extra && <p className="mt-0.5 truncate text-sm text-muted-foreground">{extra}</p>}
                </div>
                <div className="shrink-0 text-end text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{row.username ?? "—"}</p>
                  <p className="mt-0.5">{fmt(row.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {data && !data.activity.length && <p className="px-5 py-10 text-center text-muted-foreground">{t("لا توجد تغييرات مسجلة بعد")}</p>}
      </section>

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{t("السابق")}</Button>
        <span className="self-center">{page + 1}</span>
        <Button variant="outline" disabled={!data?.hasMore} onClick={() => setPage(page + 1)}>{t("التالي")}</Button>
      </div>
    </>
  );
}
