import { PageHeader } from "./kit";
import { useT as useSpireTranslation } from "@/lib/i18n";
import { createContext, useContext, useState } from "react";
import { useT } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart3, History, Mic, Gift, Flame, X, Trash2 as TrashIcon, Check, Vote, Plus } from "lucide-react";
import { createJob, listJobs, POLL_MAX_OPTIONS, POLL_MIN_OPTIONS } from "@/lib/create.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Role = { id: string; name: string };
type Job = import("zod").infer<typeof import("@/lib/create.functions").jobSchema>;

const LOGS = [
  ["security", "🛡️・security"], ["messages", "📁・messages-logs"], ["members", "📁・members-logs"],
  ["server", "📁・server-logs"], ["voice", "📁・voice-logs"], ["tickets", "📁・tickets-logs"],
] as const;

type Kind = "stats" | "logs" | "tempvoice" | "giveaway" | "poll" | "streak";
const ActiveKind = createContext<Kind>("stats");
const KINDS: { id: Kind; icon: typeof Mic; title: string; short: string }[] = [
  { id: "streak", icon: Flame, title: "إنشاء ستريك", short: "إعداد الستريك والتذكيرات" },
  { id: "logs", icon: History, title: "رومات اللوق", short: "قسم كامل لسجلات السيرفر" },
  { id: "tempvoice", icon: Mic, title: "الغرف المؤقتة", short: "كل عضو يسوي رومه الصوتي" },
  { id: "giveaway", icon: Gift, title: "القيف أواي", short: "سحب على جائزة بأي روم" },
  { id: "poll", icon: Vote, title: "التصويت", short: "اسأل الأعضاء وخلهم يختارون" },
];
function KindPicker({ value, onChange }: { value: Kind; onChange: (k: Kind) => void }) {
  const __tr = useSpireTranslation();

  const t = useT();
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3" role="tablist" aria-label={t("اختر وش تبي تنشئ")}>
      {KINDS.map((k) => (
        <button key={k.id} type="button" role="tab" aria-selected={value === k.id} onClick={() => onChange(k.id)}
          className={`relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-start transition ${value === k.id ? "border-primary bg-primary/10 shadow-gold" : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50"}`}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${value === k.id ? "bg-gold text-primary-foreground" : "bg-secondary text-primary"}`}><k.icon className="h-6 w-6" /></span>
          <span className="font-bold">{t(k.title)}</span>
          <span className="text-xs text-muted-foreground">{__tr(k.short)}</span>
          {value === k.id && <Check className="absolute end-4 top-4 h-5 w-5 text-primary" />}
        </button>
      ))}
    </div>
  );
}
function Card({ kind, icon: Icon, title, desc, children }: { kind: Kind; icon: typeof Mic; title: string; desc: string; children: React.ReactNode }) {
  const __tr = useSpireTranslation();

  const active = useContext(ActiveKind);
  if (active !== kind) return null;
  return (
    <section className="creation-section">
      <div className="creation-heading">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="h-5 w-5 text-gold" /> {__tr(title)}</h2>
      </div>
      <div className="creation-body"><p className="text-sm text-muted-foreground">{__tr(desc)}</p>{children}</div>
    </section>
  );
}
const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) =>  { const __tr = useSpireTranslation(); return (
  <div className="grid gap-1.5"><Label>{__tr(label)}</Label><Input value={value} maxLength={90} onChange={(e) => onChange(e.target.value)} /></div>
); };

function RolePicker({ label, roles, value, onChange }: { label: string; roles: Role[]; value: string[]; onChange: (v: string[]) => void }) {
  const __tr = useSpireTranslation();

  return (
    <div className="grid gap-1.5">
      <Label>{__tr(label)}</Label>
      <div className="flex flex-wrap gap-2">
        {value.map((id) => (
          <span key={id} className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-sm">
            {roles.find((r) => r.id === id)?.name ?? id}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== id))}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}>
        <option value="">{__tr("+ أضف رتبة")}</option>
        {roles.filter((r) => !value.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </div>
  );
}

export function CreateSection({ guildId, roles, channels = [], streakSettings }: { guildId: string; roles: Role[]; channels?: Role[]; streakSettings?: React.ReactNode }) {
  const __tr = useSpireTranslation();

  const qc = useQueryClient();
  const t = useT();
  const [kind, setKind] = useState<Kind>("logs");
  const sendJob = useServerFn(createJob);
  const [confirmation, setConfirmation] = useState<Job | null>(null);
  const [enabled, setEnabled] = useState<("members" | "voice" | "boosts")[]>(["members", "voice", "boosts"]);
  const [busy, setBusy] = useState(false);
  const jobs = useQuery({ queryKey: ["jobs", guildId], queryFn: () => listJobs({ data: { guildId } }), refetchInterval: 4000 });

  const [stats, setStats] = useState({ category: "📊 Server-Stats", members: "👥・الأعضاء : {n}", voice: "🔊・في الفويس : {n}", boosts: "💎・البوستات : {n}" });
  const [logCat, setLogCat] = useState("📁 LOGS");
  const [logs, setLogs] = useState<{ key: string; name: string; on: boolean }[]>(LOGS.map(([key, name]) => ({ key, name, on: true })));
  const [tv, setTv] = useState({ category: "🟢 الغرف المؤقتة", edit: "📝 | edit-تعديل", create: "➕ | Create-اصنع", template: "🎧 | {user}", allowed: [] as string[], blocked: [] as string[] });

  const [gw, setGw] = useState({ channelId: "", mode: "button" as "button" | "reaction", prize: "", winners: 1, duration: "1d", description: "", image: "", thumb: "" });
  const [poll, setPoll] = useState({ channelId: "", question: "", options: [{ text: "", emoji: "" }, { text: "", emoji: "" }], duration: "1d", multiple: false, mention: "none" });
  const pollValid = !!poll.channelId && !!poll.question.trim() && poll.options.filter((o) => o.text.trim()).length >= POLL_MIN_OPTIONS && /^(\d+\s*[smhdw]\s*)+$/i.test(poll.duration.trim());
  const setOption = (i: number, patch: Partial<{ text: string; emoji: string }>) => setPoll({ ...poll, options: poll.options.map((o, j) => j === i ? { ...o, ...patch } : o) });
  const gwValid = !!gw.channelId && !!gw.prize.trim() && /^(\d+\s*[smhdw]\s*)+$/i.test(gw.duration.trim()) && gw.winners >= 1 && gw.winners <= 50;

  const run = async (job: Job) => {
    setBusy(true);
    try {
      const result = await sendJob({ data: { guildId, job } });
      if (result.requiresConfirmation) { setConfirmation(job); return; }
      setConfirmation(null);
      toast.success(__tr("انرسل الطلب للبوت، بيتنفذ خلال ثواني"));
      qc.invalidateQueries({ queryKey: ["jobs", guildId] });
    } catch (error) { toast.error(error instanceof Error ? error.message : __tr("ما قدرت أرسل الطلب، تأكد من الأسماء")); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="إنشاء" />
      <KindPicker value={kind} onChange={setKind} />
      {kind === "streak" && streakSettings}
      <ActiveKind.Provider value={kind}>


      <Card kind="stats" icon={BarChart3} title={__tr("إحصائيات السيرفر (Server-Stats)")} desc={__tr("قسم فيه رومات تعرض عدد الأعضاء والفويس والبوستات وتتحدث تلقائياً. اكتب {n} مكان الرقم.")}>
        <Field label={__tr("اسم القسم")} value={stats.category} onChange={(v) => setStats({ ...stats, category: v })} />
        {([ ["members", __tr("روم الأعضاء")], ["voice", __tr("روم الفويس")], ["boosts", __tr("روم البوستات")] ] as const).map(([key, label]) => <div key={key} className="flex items-center gap-3">
          <Checkbox id={`stats-${key}`} checked={enabled.includes(key)} onCheckedChange={on => setEnabled(on === true ? [...enabled, key] : enabled.filter(k => k !== key))} aria-label={__tr(label)} />
          <div className="grid flex-1 gap-1.5"><Label htmlFor={`stats-${key}`}>{__tr(label)}</Label><Input disabled={!enabled.includes(key)} value={stats[key]} maxLength={90} onChange={e => setStats({ ...stats, [key]: e.target.value })} /></div>
        </div>)}
        <Button variant="gold" disabled={busy || !enabled.length} onClick={() => run({ type: "stats", payload: { ...stats, enabled } })}>{__tr("إنشاء الإحصائيات")}</Button>
      </Card>

      <Card kind="logs" icon={History} title={__tr("رومات اللوق")} desc={__tr("اختار الرومات اللي تبيها وغيّر أسماءها، والبوت يربطها باللوق تلقائياً.")}>
        <Field label={__tr("اسم القسم")} value={logCat} onChange={setLogCat} />
        {logs.map((l, k) => (
          <div key={l.key} className="flex items-center gap-3">
            <Checkbox aria-label={l.name} checked={l.on}
              onCheckedChange={(on) => setLogs(logs.map((x, j) => j === k ? { ...x, on: on === true } : x))} />
            <Input value={l.name} maxLength={90} disabled={!l.on}
              onChange={(e) => setLogs(logs.map((x, j) => j === k ? { ...x, name: e.target.value } : x))} />
          </div>
        ))}
        <Button variant="gold" disabled={busy || !logs.some((l) => l.on)}
          onClick={() => run({ type: "logs", payload: { category: logCat, channels: logs.filter((l) => l.on).map(({ key, name }) => ({ key, name })) } })}>
          {__tr("إنشاء رومات اللوق")}</Button>
      </Card>

      <Card kind="tempvoice" icon={Mic} title={__tr("الغرف المؤقتة")} desc={__tr("روم 'اصنع' أي أحد يدخله يتسوى له روم باسمه. اكتب {user} مكان اسم العضو.")}>
        <Field label={__tr("اسم القسم")} value={tv.category} onChange={(v) => setTv({ ...tv, category: v })} />
        <Field label={__tr("روم التعديل (اللوحة)")} value={tv.edit} onChange={(v) => setTv({ ...tv, edit: v })} />
        <Field label={__tr("روم الإنشاء")} value={tv.create} onChange={(v) => setTv({ ...tv, create: v })} />
        <Field label={__tr("اسم الغرف اللي تنصنع")} value={tv.template} onChange={(v) => setTv({ ...tv, template: v })} />
        <RolePicker label={__tr("الرتب اللي تقدر تسوي غرف (فاضي = الكل)")} roles={roles} value={tv.allowed} onChange={(v) => setTv({ ...tv, allowed: v, blocked: tv.blocked.filter((x) => !v.includes(x)) })} />
        <RolePicker label={__tr("الرتب الممنوعة")} roles={roles} value={tv.blocked} onChange={(v) => setTv({ ...tv, blocked: v, allowed: tv.allowed.filter((x) => !v.includes(x)) })} />
        <Button variant="gold" disabled={busy} onClick={() => run({ type: "tempvoice", payload: tv })}>{__tr("إنشاء الغرف المؤقتة")}</Button>
      </Card>

      <Card kind="giveaway" icon={Gift} title={__tr("القيف أواي (Giveaway)")} desc={__tr("أنشئ قيف أواي في أي روم، وتقدر تسوي أكثر من واحد بنفس الوقت. المدة مثل: 30m أو 2h أو 1d.")}>
        <div className="grid gap-1.5"><Label>{__tr("الروم")}</Label>
          <select aria-label={__tr("روم القيف أواي")} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={gw.channelId} onChange={(e) => setGw({ ...gw, channelId: e.target.value })}>
            <option value="">{__tr("اختر الروم")}</option>{channels.map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}
          </select></div>
        <div className="grid gap-1.5"><Label>{__tr("الجائزة")}</Label><Input value={gw.prize} maxLength={200} placeholder="Nitro, Gamepass, $10 Gift Card" onChange={(e) => setGw({ ...gw, prize: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label>{__tr("الوصف (اختياري)")}</Label><Input value={__tr(gw.description)} maxLength={1000} placeholder={__tr("شروط المشاركة أو أي تفاصيل")} onChange={(e) => setGw({ ...gw, description: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label>{__tr("المدة")}</Label><Input dir="ltr" value={gw.duration} maxLength={30} placeholder="10s, 1m, 10h, 1d" onChange={(e) => setGw({ ...gw, duration: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label>{__tr("عدد الفائزين")}</Label><Input type="number" min={1} max={50} value={gw.winners} onChange={(e) => setGw({ ...gw, winners: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} /></div>
        <div className="grid gap-1.5"><Label>{__tr("طريقة المشاركة")}</Label>
          <select aria-label={__tr("طريقة المشاركة")} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={gw.mode} onChange={(e) => setGw({ ...gw, mode: e.target.value as "button" | "reaction" })}>
            <option value="button">{__tr("زر 🎉")}</option><option value="reaction">{__tr("رياكشن 🎉")}</option>
          </select></div>
        <div className="grid gap-1.5"><Label>{__tr("صورة (اختياري)")}</Label><Input dir="ltr" value={gw.image} placeholder="https://media.discordapp.net/..." onChange={(e) => setGw({ ...gw, image: e.target.value.trim() })} /></div>
        <div className="grid gap-1.5"><Label>{__tr("صورة مصغرة (اختياري)")}</Label><Input dir="ltr" value={gw.thumb} placeholder="https://media.discordapp.net/..." onChange={(e) => setGw({ ...gw, thumb: e.target.value.trim() })} /></div>
        <Button variant="gold" disabled={busy || !gwValid} onClick={() => run({ type: "giveaway", payload: gw })}>{__tr("إنشاء القيف أواي")}</Button>
      </Card>

      <Card kind="poll" icon={Vote} title={__tr("التصويت (Poll)")} desc={__tr("اكتب سؤالك وخياراته، والبوت ينشر التصويت في الروم اللي تختاره. المدة مثل: 1h أو 1d.")}>
        <div className="grid gap-1.5"><Label>{__tr("الروم")}</Label>
          <select aria-label={__tr("روم التصويت")} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={poll.channelId} onChange={(e) => setPoll({ ...poll, channelId: e.target.value })}>
            <option value="">{__tr("اختر الروم")}</option>{channels.map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}
          </select></div>
        <div className="grid gap-1.5"><Label>{__tr("السؤال")}</Label><Input value={poll.question} maxLength={300} placeholder={__tr("وش أفضل وقت للفعالية؟")} onChange={(e) => setPoll({ ...poll, question: e.target.value })} /></div>
        <div className="grid gap-2">
          <Label>{__tr("الخيارات")}</Label>
          {poll.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input aria-label={__tr("إيموجي الخيار")} className="w-16 shrink-0 text-center" value={o.emoji} maxLength={64} placeholder="🙂" onChange={(e) => setOption(i, { emoji: e.target.value })} />
              <Input aria-label={`${__tr("الخيار")} ${i + 1}`} value={o.text} maxLength={55} placeholder={`${__tr("الخيار")} ${i + 1}`} onChange={(e) => setOption(i, { text: e.target.value })} />
              <Button type="button" variant="outline" size="icon" aria-label={__tr("حذف الخيار")} disabled={poll.options.length <= POLL_MIN_OPTIONS} onClick={() => setPoll({ ...poll, options: poll.options.filter((_, j) => j !== i) })}><TrashIcon /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="justify-self-start" disabled={poll.options.length >= POLL_MAX_OPTIONS} onClick={() => setPoll({ ...poll, options: [...poll.options, { text: "", emoji: "" }] })}><Plus />{__tr("إضافة خيار")}</Button>
        </div>
        <div className="grid gap-1.5"><Label>{__tr("المدة")}</Label><Input dir="ltr" value={poll.duration} maxLength={30} placeholder="1h, 12h, 1d, 7d" onChange={(e) => setPoll({ ...poll, duration: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label>{__tr("المنشن")}</Label>
          <select aria-label={__tr("المنشن")} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={poll.mention} onChange={(e) => setPoll({ ...poll, mention: e.target.value })}>
            <option value="none">{__tr("بدون منشن")}</option><option value="everyone">@everyone</option><option value="here">@here</option>
            {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
          </select></div>
        <label className="flex items-center gap-3 text-sm"><Switch checked={poll.multiple} onCheckedChange={(v) => setPoll({ ...poll, multiple: v })} />{__tr("السماح باختيار أكثر من خيار")}</label>
        <Button variant="gold" disabled={busy || !pollValid} onClick={() => run({ type: "poll", payload: { ...poll, options: poll.options.filter((o) => o.text.trim()) } })}>{__tr("نشر التصويت")}</Button>
      </Card>

      </ActiveKind.Provider>
      <Dialog open={confirmation !== null} onOpenChange={open => { if (!open && !busy) setConfirmation(null); }}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>{__tr("تم إنشاؤه من قبل وموجود حاليًا")}</DialogTitle><DialogDescription>{__tr("تقدر تعدّل الموجود بدون حذف الرومات والرسائل، أو تنشئ نسخة إضافية.")}</DialogDescription></DialogHeader>
          <div className="flex flex-wrap gap-3"><Button variant="gold" disabled={busy} onClick={() => confirmation && run({ ...confirmation, payload: { ...confirmation.payload, mode: "another" } } as Job)}>{__tr("إنشاء واحد ثاني")}</Button><Button variant="outline" disabled={busy} onClick={() => confirmation && run({ ...confirmation, payload: { ...confirmation.payload, mode: "edit" } } as Job)}>{__tr("تعديل الموجود")}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>{__tr("إلغاء")}</Button></div>
        </DialogContent>
      </Dialog>

    </>
  );
}
