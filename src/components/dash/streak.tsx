import { useT as useSpireTranslation } from "@/lib/i18n";
import type { Modules } from "@/lib/modules.schema";
import { Card, Field, PageHeader, Pick, chanItems, type GuildData } from "./kit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Trophy } from "lucide-react";

export function Streak({ data, m, set, mode = "settings" }: { data: GuildData; m: Modules; mode?: "settings" | "top"; set: <K extends keyof Modules>(k: K, v: Modules[K]) => void }) {
  const __tr = useSpireTranslation();

  const s = m.streak;
  const up = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => set("streak", { ...s, [k]: v });
  return <>
    <PageHeader title={mode === "settings" ? __tr("إنشاء ستريك") : __tr("توب الستريك")} {...(mode === "settings" ? { enabled: s.enabled, onToggle: (v: boolean) => up("enabled", v) } : {})}/>
    <div className="grid gap-6 xl:grid-cols-2">
      {mode === "settings" && <Card title={__tr("خصص ستريك سيرفرك")} desc={__tr("التغييرات تُطبق على هذا السيرفر فقط بعد الحفظ")}>
        <Field label={__tr("روم الستريك")}><Pick value={s.channelId} onChange={v => up("channelId", v)} items={chanItems(data)}/></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={__tr("رياكشن التحديث")}><Input maxLength={64} value={s.reaction} onChange={e => up("reaction", e.target.value)}/></Field><Field label={__tr("رياكشن التكرار")}><Input maxLength={64} value={s.duplicateReaction} onChange={e => up("duplicateReaction", e.target.value)}/></Field></div>
        <Field label={__tr("رسالة التحديث")} hint={__tr("المتغيرات: {user} {username} {streak} {best} {server}")}><Textarea maxLength={1800} value={s.message} onChange={e => up("message", e.target.value)}/></Field>
        <Field label={__tr("رسالة التكرار")}><Textarea maxLength={1800} value={s.duplicateMessage} onChange={e => up("duplicateMessage", e.target.value)}/></Field>
        <Field label={__tr("رسالة التذكير")}><Textarea maxLength={1800} value={s.reminderMessage} onChange={e => up("reminderMessage", e.target.value)}/></Field>
      </Card>}
      <div className="grid content-start gap-6">{mode === "settings" && <Card title={__tr("معاينة الرد")}><div className="rounded-xl bg-secondary p-5"><Flame className="mb-3 text-gold"/><p>{s.message.replaceAll("{user}", __tr("@عضو")).replaceAll("{username}", __tr("عضو")).replaceAll("{streak}", "7").replaceAll("{best}", "14").replaceAll("{server}", data.guild.name)}</p><span className="mt-4 inline-block rounded-lg bg-background px-3 py-1">{s.reaction} 1</span></div></Card>}
      {mode === "top" && <Card title={<span className="flex items-center gap-2"><Trophy className="text-gold"/> {__tr("Top الستريك في السيرفر")}</span>} desc={__tr("يتحدث تلقائيًا من البوت؛ الأمر /streak-leaderboard يعرض القائمة في ديسكورد")}>
        {data.streakTop.length ? data.streakTop.map((u, i) => <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-4"><div className="flex min-w-0 items-center gap-3"><span className="text-gold">#{i + 1}</span><span className="truncate">{u.name}</span></div><span className="shrink-0 text-sm text-muted-foreground">{__tr("أفضل:")}{u.best}</span><span className="shrink-0 text-gold">🔥 {u.streak} {__tr("يوم")}</span></div>) : <p className="py-6 text-muted-foreground">{__tr("لا توجد بيانات ستريك بعد؛ تأكد من اتصال البوت.")}</p>}
      </Card>}</div>
    </div>
  </>;
}