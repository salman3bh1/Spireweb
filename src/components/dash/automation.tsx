// Auto-reply editor (dialog with message/rules/access tabs), auto-moderation rules and stats channels.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, AtSign, Bot, CaseUpper, ChevronDown, EyeOff, Hash, Info, Link2, ListOrdered, Lock, MailX, Mic, Pencil, Plus,
  Radio, Rocket, Shapes, ShieldAlert, ShieldCheck, Smile, Trash2, Upload, User, Users, Volume2, WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadWelcomeBg } from "@/lib/modules.functions";
import { useT } from "@/lib/i18n";
import {
  AUTOMOD_DEFAULT_LIMIT, AUTOMOD_RULES, STAT_KINDS, type AutomodRuleId, type Modules, type StatKind,
} from "@/lib/modules.schema";
import { Card, Field, PageHeader, Pick, SelectMulti, TagInput, chanItems, roleItems, type GuildData } from "./kit";

type Setter = <K extends keyof Modules>(k: K, v: Modules[K]) => void;
type P = { data: GuildData; m: Modules; set: Setter };

/* ---------------- Auto reply ---------------- */
type Item = Modules["autoReply"]["items"][number];
const MATCHES = [["contains", "يحتوي على"], ["exact", "مطابقة تامة"], ["startsWith", "يبدأ بـ"], ["endsWith", "ينتهي بـ"], ["regex", "تعبير منتظم"]] as const;
const KINDS = [["text", "رد نصي", "رسالة نصية عادية"], ["embed", "رد إيمبد", "رسالة Embed منسقة"], ["react", "تفاعل", "رياكشن على رسالة العضو"], ["image", "رد بصورة", "صورة مع تعليق اختياري"]] as const;
const VARS = ["{user}", "{username}", "{server}", "{count}", "{channel}"];
const EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👋", "✅", "❌", "😎", "🙏", "💯", "👑", "⭐", "💎", "😍", "🤝", "👀", "🥳", "😢", "🤔"];
const blank = (): Item => ({
  trigger: "", reply: "", kind: "text", match: "contains", embedTitle: "", embedColor: "#38bdf8", emoji: "", imageUrl: "",
  mentionUser: false, deleteTrigger: false, cooldownSeconds: 2, channelIds: [], ignoreChannelIds: [], roleIds: [], ignoreRoleIds: [],
});
const valid = (it: Item) => !!it.trigger.trim() && (it.kind === "react" ? !!it.emoji : it.kind === "image" ? !!it.imageUrl : !!it.reply.trim());

function Seg<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: readonly (readonly [T, string])[] }) {
  const t = useT();
  return <div className="ar-seg" role="radiogroup">{items.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={value === v} data-active={value === v || undefined} onClick={() => onChange(v)}>{t(l)}</button>)}</div>;
}

function ReplyDialog({ data, initial, onClose, onSave }: { data: GuildData; initial: Item; onClose: () => void; onSave: (it: Item) => void }) {
  const t = useT();
  const [it, setIt] = useState<Item>(initial);
  const [tab, setTab] = useState<"msg" | "rules" | "access">("msg");
  const [busy, setBusy] = useState(false);
  const up = (p: Partial<Item>) => setIt((x) => ({ ...x, ...p }));
  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("الحد الأقصى 5MB")); return; }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
      const { path } = await uploadWelcomeBg({ data: { guildId: data.guild.id, dataUrl } });
      up({ imageUrl: path });
    } catch { toast.error(t("ما قدرنا نرفع الصورة")); } finally { setBusy(false); }
  };
  const roles = roleItems(data), chans = chanItems(data);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="ar-dialog max-h-[90vh] overflow-y-auto sm:max-w-xl" dir="rtl">
        <DialogHeader><DialogTitle>{t(initial.trigger ? "تعديل الرد" : "إضافة رد جديد")}</DialogTitle></DialogHeader>
        <Field label="حقل المحفز"><Input value={it.trigger} maxLength={200} placeholder={t("اكتب الكلمة أو العبارة...")} onChange={(e) => up({ trigger: e.target.value })} /></Field>
        <Seg value={tab} onChange={setTab} items={[["msg", "الرسالة"], ["rules", "القواعد"], ["access", "الوصول"]]} />
        <div className="ar-box">
          {tab === "msg" && <>
            <Field label="نوع المطابقة"><Seg value={it.match} onChange={(v) => up({ match: v })} items={MATCHES} /></Field>
            <Field label="نوع الرد">
              <div className="ar-kinds">
                {KINDS.map(([k, l, d]) => <button key={k} type="button" className="ar-kind" data-active={it.kind === k || undefined} onClick={() => up({ kind: k })}><b>{t(l)}</b><small>{t(d)}</small></button>)}
              </div>
            </Field>
            {it.kind === "embed" && <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <Field label="عنوان الإيمبد"><Input value={it.embedTitle} maxLength={256} onChange={(e) => up({ embedTitle: e.target.value })} /></Field>
              <Field label="اللون"><input type="color" value={it.embedColor} onChange={(e) => up({ embedColor: e.target.value })} className="h-10 w-full cursor-pointer rounded-md border border-border bg-transparent" /></Field>
            </div>}
            {it.kind === "react" && <Field label="إيموجي">
              <div className="ar-emojis">{EMOJIS.map((e) => <button key={e} type="button" data-active={it.emoji === e || undefined} onClick={() => up({ emoji: e })}>{e}</button>)}</div>
              <Input value={it.emoji} maxLength={64} placeholder={t("أو الصق إيموجي السيرفر <:name:id>")} onChange={(e) => up({ emoji: e.target.value })} />
            </Field>}
            {it.kind === "image" && <Field label="رد بصورة">
              <label className="ar-drop">
                {it.imageUrl ? <img src={it.imageUrl} alt="" /> : <><Upload className="h-5 w-5 text-primary" /><b>{t(busy ? "جاري الرفع…" : "اضغط للرفع أو اسحب الصورة هنا")}</b><small>PNG, JPG, WEBP, GIF — 5MB</small></>}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
              </label>
              {it.imageUrl && <Button variant="ghost" size="sm" onClick={() => up({ imageUrl: "" })}><Trash2 className="h-4 w-4" /> {t("إزالة الصورة")}</Button>}
            </Field>}
            {it.kind !== "react" && <Field label={it.kind === "image" ? "التعليق (اختياري)" : "الرد"}>
              <Textarea value={it.reply} maxLength={1800} rows={4} placeholder={t("اكتب الرد...")} onChange={(e) => up({ reply: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">{VARS.map((v) => <button key={v} type="button" className="ar-var" onClick={() => up({ reply: `${it.reply}${v}` })}>{v}</button>)}</div>
            </Field>}
          </>}
          {tab === "rules" && <div className="grid gap-4">
            <Toggle label="منشن العضو بالرد" checked={it.mentionUser} onChange={(v) => up({ mentionUser: v })} />
            <Toggle label="حذف رسالة المحفز" checked={it.deleteTrigger} onChange={(v) => up({ deleteTrigger: v })} />
            <Field label="مدة الانتظار بين الردود (ثانية)"><Input type="number" min={0} max={3600} value={it.cooldownSeconds} onChange={(e) => up({ cooldownSeconds: Math.max(0, Math.min(3600, Number(e.target.value) || 0)) })} /></Field>
          </div>}
          {tab === "access" && <div className="grid gap-4 md:grid-cols-2">
            <Field label="الرومات المفعلة" hint={t("فارغ = كل الرومات")}><SelectMulti value={it.channelIds} items={chans} onChange={(v) => up({ channelIds: v, ignoreChannelIds: it.ignoreChannelIds.filter((x) => !v.includes(x)) })} /></Field>
            <Field label="الرومات المعطلة"><SelectMulti value={it.ignoreChannelIds} items={chans} onChange={(v) => up({ ignoreChannelIds: v, channelIds: it.channelIds.filter((x) => !v.includes(x)) })} /></Field>
            <Field label="الرولات المفعلة" hint={t("فارغ = الكل")}><SelectMulti value={it.roleIds} items={roles} onChange={(v) => up({ roleIds: v, ignoreRoleIds: it.ignoreRoleIds.filter((x) => !v.includes(x)) })} /></Field>
            <Field label="الرولات المعطلة"><SelectMulti value={it.ignoreRoleIds} items={roles} onChange={(v) => up({ ignoreRoleIds: v, roleIds: it.roleIds.filter((x) => !v.includes(x)) })} /></Field>
          </div>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>{t("إلغاء")}</Button>
          <Button variant="gold" disabled={!valid(it) || busy} onClick={() => onSave({ ...it, trigger: it.trigger.trim(), reply: it.reply.trim() })}>{t(initial.trigger ? "حفظ" : "إضافة رد تلقائي")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  return <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"><span className="text-sm font-semibold">{t(label)}</span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}

export function AutoReplyPanel({ data, m, set }: P) {
  const t = useT();
  const a = m.autoReply;
  const [edit, setEdit] = useState<number | "new" | null>(null);
  const setItems = (v: Item[]) => set("autoReply", { ...a, items: v });
  const kindLabel = (k: Item["kind"]) => t(KINDS.find((x) => x[0] === k)?.[1] ?? "رد نصي");
  return (
    <>
      <PageHeader title="الرد التلقائي" enabled={a.enabled} onToggle={(v) => set("autoReply", { ...a, enabled: v })}
        actions={<Button variant="gold" disabled={a.items.length >= 100} onClick={() => setEdit("new")}><Plus className="h-4 w-4" /> {t("إضافة رد جديد")}</Button>} />
      <div className="grid gap-3">
        {a.items.map((it, i) => (
          <div key={i} className="ar-row">
            <span className="ar-row-icon">{it.kind === "react" ? it.emoji || "😀" : it.kind === "image" ? "🖼️" : it.kind === "embed" ? "🧾" : "💬"}</span>
            <div className="min-w-0 flex-1">
              <b className="block truncate">{it.trigger}</b>
              <small className="block truncate text-muted-foreground">{kindLabel(it.kind)} · {t(MATCHES.find((x) => x[0] === it.match)?.[1] ?? "")}{it.reply ? ` · ${it.reply}` : ""}</small>
            </div>
            <Button variant="ghost" size="icon" aria-label={t("تعديل")} onClick={() => setEdit(i)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label={t("حذف")} onClick={() => setItems(a.items.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {!a.items.length && <Card title="ما فيه ردود لسا" desc="اضغط «إضافة رد جديد» عشان تسوي أول رد تلقائي." />}
      </div>
      {edit !== null && <ReplyDialog data={data} initial={edit === "new" ? blank() : a.items[edit] ?? blank()} onClose={() => setEdit(null)}
        onSave={(it) => { setItems(edit === "new" ? [...a.items, it] : a.items.map((x, k) => (k === edit ? it : x))); setEdit(null); toast.success(t("تمت الإضافة — اضغط حفظ")); }} />}
    </>
  );
}

/* ---------------- Auto moderation ---------------- */
const RULE_ICON: Record<AutomodRuleId, typeof ShieldCheck> = {
  words: ShieldAlert, invites: MailX, spam: ShieldCheck, links: Link2, mentions: AtSign, caps: CaseUpper, spoilers: EyeOff, zalgo: Shapes, emojis: Smile, newlines: WrapText,
};
const LIMIT_LABEL: Partial<Record<AutomodRuleId, string>> = {
  spam: "عدد الرسائل خلال 5 ثواني", mentions: "أقصى عدد منشنات", caps: "نسبة الحروف الكبيرة %", spoilers: "أقصى عدد سبويلر", emojis: "أقصى عدد إيموجي", newlines: "أقصى عدد أسطر",
};

export function AutomodPanel({ data, m, set }: P) {
  const t = useT();
  const a = m.automod;
  const [open, setOpen] = useState<AutomodRuleId | null>(null);
  const roles = roleItems(data), chans = chanItems(data);
  const rule = (id: AutomodRuleId) => a.rules[id] ?? { enabled: false, action: "delete" as const, timeoutMinutes: 5, limit: AUTOMOD_DEFAULT_LIMIT[id], words: [], allow: [], ignoreRoleIds: [], ignoreChannelIds: [] };
  const upRule = (id: AutomodRuleId, p: Partial<ReturnType<typeof rule>>) => set("automod", { ...a, rules: { ...a.rules, [id]: { ...rule(id), ...p } } });
  const group = (g: string, title: string) => (
    <>
      <p className="am-group">{t(title)}</p>
      {AUTOMOD_RULES.filter((r) => r.group === g).map((r) => {
        const c = rule(r.id), Icon = RULE_ICON[r.id], isOpen = open === r.id;
        return (
          <div key={r.id} className="am-rule" data-on={c.enabled || undefined}>
            <div className="am-rule-head">
              <span className="am-rule-icon"><Icon className="h-4 w-4" /></span>
              <button type="button" className="min-w-0 flex-1 text-start" onClick={() => setOpen(isOpen ? null : r.id)}>
                <b className="block">{t(r.title)}</b><small className="block text-muted-foreground">{t(r.desc)}</small>
              </button>
              <button type="button" aria-label={t("الإعدادات")} className="am-chev" data-open={isOpen || undefined} onClick={() => setOpen(isOpen ? null : r.id)}><ChevronDown className="h-4 w-4" /></button>
              <Switch checked={c.enabled} onCheckedChange={(v) => upRule(r.id, v && !a.rules[r.id] ? { enabled: v, limit: AUTOMOD_DEFAULT_LIMIT[r.id] } : { enabled: v })} />
            </div>
            {isOpen && <div className="am-rule-body">
              <Field label="العقوبة"><Seg value={c.action} onChange={(v) => upRule(r.id, { action: v })} items={[["delete", "حذف الرسالة"], ["warn", "حذف + تنبيه"], ["timeout", "حذف + تايم أوت"]]} /></Field>
              {c.action === "timeout" && <Field label="مدة التايم أوت (دقيقة)"><Input type="number" min={1} max={40320} value={c.timeoutMinutes} onChange={(e) => upRule(r.id, { timeoutMinutes: Math.max(1, Math.min(40320, Number(e.target.value) || 1)) })} /></Field>}
              {LIMIT_LABEL[r.id] && <Field label={LIMIT_LABEL[r.id]!}><Input type="number" min={1} max={100} value={c.limit} onChange={(e) => upRule(r.id, { limit: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} /></Field>}
              {r.id === "words" && <Field label="الكلمات المحظورة" hint={t("فارغ = قائمة البوت الافتراضية للشتائم")}><TagInput value={c.words} onChange={(v) => upRule(r.id, { words: v })} placeholder={t("اكتب كلمة واضغط Enter")} /></Field>}
              {r.id === "links" && <Field label="روابط مسموحة" hint={t("مثال: youtube.com")}><TagInput value={c.allow} onChange={(v) => upRule(r.id, { allow: v })} placeholder="youtube.com" /></Field>}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="رولات مستثناة"><SelectMulti value={c.ignoreRoleIds} items={roles} onChange={(v) => upRule(r.id, { ignoreRoleIds: v })} /></Field>
                <Field label="رومات مستثناة"><SelectMulti value={c.ignoreChannelIds} items={chans} onChange={(v) => upRule(r.id, { ignoreChannelIds: v })} /></Field>
              </div>
            </div>}
          </div>
        );
      })}
    </>
  );
  return (
    <>
      <PageHeader title="الرقابة التلقائية" desc="البوت يراقب كل رسالة ويطبق القواعد اللي تفعّلها تلقائياً." icon={<ShieldCheck />} enabled={a.enabled} onToggle={(v) => set("automod", { ...a, enabled: v })} />
      {!a.enabled && <p className="am-warn"><AlertTriangle className="h-4 w-4" /> {t("نظام الرقابة التلقائية معطل حالياً. فعّله لحماية السيرفر.")}</p>}
      <Card title="الإعدادات العامة" desc="المشرفين واللي عندهم صلاحية إدارة الرسائل مستثنين دائماً.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="روم سجل الرقابة"><Pick value={a.logChannelId} onChange={(v) => set("automod", { ...a, logChannelId: v })} items={chans} placeholder="بدون سجل" /></Field>
          <Field label="رولات مستثناة من الكل"><SelectMulti value={a.ignoreRoleIds} items={roles} onChange={(v) => set("automod", { ...a, ignoreRoleIds: v })} /></Field>
          <Field label="رومات مستثناة من الكل"><SelectMulti value={a.ignoreChannelIds} items={chans} onChange={(v) => set("automod", { ...a, ignoreChannelIds: v })} /></Field>
        </div>
      </Card>
      <div className="mt-4 grid gap-2">
        {group("words", "فلاتر الكلمات")}
        {group("spam", "فلاتر السبام")}
      </div>
    </>
  );
}

/* ---------------- Stats channels ---------------- */
export const STAT_META: Record<StatKind, { label: string; desc: string; icon: typeof Users; name: string }> = {
  members: { label: "إجمالي الأعضاء", desc: "عدد كل الأعضاء", icon: Users, name: "👥・الأعضاء : {count}" },
  humans: { label: "البشر", desc: "عدد الأعضاء البشريين فقط", icon: User, name: "👤・البشر : {count}" },
  bots: { label: "البوتات", desc: "عدد البوتات في السيرفر", icon: Bot, name: "🤖・البوتات : {count}" },
  online: { label: "الأعضاء الأونلاين", desc: "عدد الأعضاء المتصلين حالياً", icon: Radio, name: "🟢・الأونلاين : {count}" },
  voice: { label: "المتصلين صوتياً", desc: "عدد الأعضاء في القنوات الصوتية", icon: Mic, name: "🔊・في الفويس : {count}" },
  text: { label: "القنوات النصية", desc: "عدد القنوات النصية", icon: Hash, name: "💬・القنوات النصية : {count}" },
  voiceChannels: { label: "القنوات الصوتية", desc: "عدد القنوات الصوتية", icon: Volume2, name: "🎙️・القنوات الصوتية : {count}" },
  channels: { label: "عدد القنوات الكلي", desc: "إجمالي عدد جميع القنوات", icon: ListOrdered, name: "📁・القنوات : {count}" },
  roles: { label: "الرتب الكلية", desc: "عدد الرتب في السيرفر", icon: Shapes, name: "🏷️・الرتب : {count}" },
  boosts: { label: "البوستات", desc: "عدد البوستات", icon: Rocket, name: "💎・البوستات : {count}" },
};
const SAMPLE = 3421;

export function StatChannelsPanel({ m, set }: P) {
  const t = useT();
  const s = m.statChannels;
  const [edit, setEdit] = useState<StatKind | null>(null);
  const [name, setName] = useState("");
  const has = (k: StatKind) => s.items.find((x) => x.kind === k);
  const open = (k: StatKind) => { setEdit(k); setName(has(k)?.name ?? STAT_META[k].name); };
  const save = () => {
    if (!edit) return;
    const items = has(edit) ? s.items.map((x) => (x.kind === edit ? { ...x, name } : x)) : [...s.items, { kind: edit, name }];
    set("statChannels", { ...s, enabled: true, items }); setEdit(null);
  };
  const preview = (n: string) => n.replaceAll("{count}", SAMPLE.toLocaleString("en")).replaceAll("{kind}", edit ? t(STAT_META[edit].label) : "");
  return (
    <>
      <PageHeader title="قنوات الإحصائيات" desc="اعرض أرقام سيرفرك في قنوات صوتية مقفلة في الشريط الجانبي." icon={<Volume2 />} enabled={s.enabled} onToggle={(v) => set("statChannels", { ...s, enabled: v })} />
      <p className="am-warn am-info"><Info className="h-4 w-4" /> {t("البوت يفحص الأرقام كل 5 ثوانٍ ويحدّث القناة فوراً، لكن ديسكورد يسمح بتغيير اسم القناة مرتين فقط كل 10 دقائق. يحتاج البوت صلاحية Manage Channels.")}</p>
      <Card title="اسم القسم"><Input value={s.category} maxLength={90} onChange={(e) => set("statChannels", { ...s, category: e.target.value })} /></Card>
      <p className="am-group mt-4">{t("العدادات الأساسية")} <small>— {t("يمكن إنشاء 8 عدادات فقط.")}</small></p>
      <div className="grid gap-2">
        {STAT_KINDS.map((k) => {
          const meta = STAT_META[k], on = has(k), Icon = meta.icon;
          return (
            <div key={k} className="am-rule" data-on={on ? true : undefined}>
              <div className="am-rule-head">
                <span className="am-rule-icon"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><b className="block">{t(meta.label)}</b><small className="block truncate text-muted-foreground">{on ? <span className="text-primary">{on.name}</span> : t(meta.desc)}</small></div>
                {on ? <>
                  <Button variant="ghost" size="icon" aria-label={t("تعديل")} onClick={() => open(k)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label={t("حذف")} onClick={() => set("statChannels", { ...s, items: s.items.filter((x) => x.kind !== k) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </> : <Button variant="gold" size="sm" disabled={s.items.length >= 8} onClick={() => open(k)}>{t("إنشاء")}</Button>}
              </div>
            </div>
          );
        })}
      </div>
      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader><DialogTitle>{t(STAT_META[edit].label)}</DialogTitle></DialogHeader>
            <Field label="اسم قناة Discord"><Input value={name} maxLength={90} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="معاينة"><div className="sc-preview"><Volume2 className="h-4 w-4" /><span className="truncate">{preview(name)}</span><Lock className="h-3.5 w-3.5 opacity-60" /></div></Field>
            <VarsBox items={[["{count}", SAMPLE.toLocaleString("en")], ["{kind}", t(STAT_META[edit].label)]]} onPick={(v) => setName(`${name}${v}`)} />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setEdit(null)}>{t("إلغاء")}</Button>
              <Button variant="gold" disabled={!name.trim() || !name.includes("{count}")} onClick={save}>{t("حفظ")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function VarsBox({ items, onPick }: { items: [string, ReactNode][]; onPick: (v: string) => void }) {
  const t = useT();
  return <div className="sc-vars"><b>{t("المتغيرات المتاحة:")}</b><div>{items.map(([k, v]) => <button key={k} type="button" onClick={() => onPick(k)}><code>{k}</code><span>{v}</span></button>)}</div></div>;
}
