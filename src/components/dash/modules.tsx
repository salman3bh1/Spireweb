import { useT as useSpireTranslation } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { defaultEnabled } from "@/lib/command-catalog";
import { Plus, Trash2, Users, MessageSquare, Rocket, Hash, Shield, Wifi, LogIn, LogOut, Mail, Image as ImageIcon, FileUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveModules } from "@/lib/modules.functions";
import { DEFAULT_LOG_COLOR, LOG_EVENTS, defaultCommand, bannedRuleSchema, type Modules, type CommandCfg, type BannedRule } from "@/lib/modules.schema";
import { SelectMulti, TagInput, Card, Field, MultiPick, PageHeader, Pick, ToggleRow, UnsavedBar, chanItems, roleItems, type GuildData } from "./kit";
import { WelcomeImages, BulkRole } from "./welcome-card";
import { ServerStatistics } from "./server-stats";
import { localDateKey, localMessageDays, BOT_DAY_ZONE } from "@/lib/local-time";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getGuildLive } from "@/lib/live.functions";

type Setter = <K extends keyof Modules>(k: K, v: Modules[K]) => void;

export function useModules(data: GuildData, guildId: string) {
  const __tr = useSpireTranslation();

  const [m, setM] = useState<Modules>(data.modules);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  useEffect(() => setM(data.modules), [data.modules]);
  const dirty = useMemo(() => JSON.stringify(m) !== JSON.stringify(data.modules), [m, data.modules]);
  const set: Setter = (k, v) => setM((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      await saveModules({ data: { guildId, modules: m } });
      toast.success(__tr("تم الحفظ — البوت بيطبق التغيير على هذا السيرفر فقط"));
      await qc.invalidateQueries({ queryKey: ["guild", guildId] });
    } catch {
      toast.error(__tr("ما قدرنا نحفظ، تأكد من البيانات"));
    }
    setSaving(false);
  };
  const bar = <UnsavedBar show={dirty} saving={saving} onSave={save} onReset={() => setM(data.modules)} />;
  return { m, set, bar, save };
}

type P = { data: GuildData; m: Modules; set: Setter; save?: (() => void) | undefined };

/* ---------------- Overview ---------------- */
export function Overview({ data }: { data: GuildData }) {
  const __tr = useSpireTranslation();
  // The bot pushes live numbers every ~3s; poll at the same pace so the page updates by itself.
  const { data: live } = useQuery({ queryKey: ["guild-live", data.guild.id], queryFn: () => getGuildLive({ data: { guildId: data.guild.id } }), refetchInterval: 3000, retry: false });
  return (
    <>
      <PageHeader title={__tr("النظرة العامة")} />
      <ServerStatistics data={data} live={live} />
    </>
  );
}

/* ---------------- Commands (general + moderation share this) ---------------- */
function CommandRow({ name, description, cfg, onChange, data, onSave }: {
  name: string; description: string; cfg: CommandCfg; onChange: (c: CommandCfg) => void; data: GuildData; onSave?: (() => void) | undefined;
}) {
  const __tr = useSpireTranslation();

  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<CommandCfg>(cfg);
  const up = <K extends keyof CommandCfg>(k: K, v: CommandCfg[K]) => onChange({ ...cfg, [k]: v });
  const roles = roleItems(data), chans = chanItems(data);
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 text-start"><h3 className="text-lg font-bold"><bdi dir="ltr">/{name}</bdi></h3><p className="mt-1 text-sm text-muted-foreground">{__tr(description)}</p></div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant={open ? "gold" : "secondary"} size="sm" onClick={() => { if (!open) setSnap(cfg); setOpen(!open); }}>{__tr("تعديل")}</Button>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => up("enabled", v)} />
        </div>
      </div>
      {open && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <Field label={__tr("الاختصارات")}><TagInput value={cfg.aliases} onChange={(v) => up("aliases", v)} placeholder={__tr("اكتب الاختصار واضغط Enter")} /></Field>
            <Field label={__tr("الرولات المفعلة")}><SelectMulti value={cfg.allowRoles} onChange={(v) => up("allowRoles", v)} items={roles} /></Field>
            <Field label={__tr("الرولات المعطلة")}><SelectMulti value={cfg.denyRoles} onChange={(v) => up("denyRoles", v)} items={roles} /></Field>
            <Field label={__tr("الرومات المفعلة")}><SelectMulti value={cfg.allowChannels} onChange={(v) => up("allowChannels", v)} items={chans} /></Field>
            <Field label={__tr("الرومات المعطلة")}><SelectMulti value={cfg.denyChannels} onChange={(v) => up("denyChannels", v)} items={chans} /></Field>
            <PlainToggle label={__tr("حذف رد البوت مع حذف رسالة الأمر")} checked={cfg.deleteWithMessage} onChange={(v) => up("deleteWithMessage", v)} />
            <PlainToggle label={__tr("الحذف التلقائي لرسالة الأمر")} checked={cfg.deleteInvoke} onChange={(v) => up("deleteInvoke", v)} />
            <PlainToggle label={__tr("حذف رد البوت تلقائيًا بعد ٥ ثواني")} checked={cfg.deleteReplyAfter5s} onChange={(v) => up("deleteReplyAfter5s", v)} />
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="gold" onClick={() => { onSave?.(); setOpen(false); }}>{__tr("حفظ التغييرات")}</Button>
            <Button variant="outline" onClick={() => { onChange(snap); setOpen(false); }}>{__tr("إلغاء")}</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function PlainToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const __tr = useSpireTranslation();

  return <label className="flex items-center justify-between gap-4 py-2"><span className="text-sm">{__tr(label)}</span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}

function CommandList({ data, m, set, save, filter }: P & { filter?: (n: string) => boolean }) {
  const __tr = useSpireTranslation();

  const [search, setSearch] = useState("");
  const list = data.commands.filter((c) => (filter ? filter(c.name) : true) && `${c.name} ${c.description}`.toLowerCase().includes(search.toLowerCase()));
  const cmds = m.general.commands;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3"><Input className="sm:max-w-md" placeholder={__tr("ابحث عن أمر أو وصفه…")} value={search} onChange={e => setSearch(e.target.value)}/><span className="text-sm text-muted-foreground">{list.length} {__tr("أمر")}</span></div>
      {!list.length && <p className="text-muted-foreground">{__tr("لا توجد أوامر مطابقة. تأكد من تشغيل البوت وتسجيل أوامره.")}</p>}
      {list.map((c) => (
        <CommandRow key={c.name} name={c.name} description={__tr(c.description)} data={data}
          cfg={{ ...defaultCommand(), enabled: defaultEnabled(c.name), ...cmds[c.name] }} onSave={save}
          onChange={(cfg) => set("general", { ...m.general, commands: { ...cmds, [c.name]: cfg } })} />
      ))}
    </div>
  );
}

const MOD = new Set(["nick", "ban", "unban", "kick", "mute", "unmute", "timeout", "untimeout", "warn", "warnings", "clearwarns", "unwarn", "clear", "purge", "lock", "unlock", "nick", "setnick", "slowmode", "hide", "unhide", "say", "poll", "vmute", "unvmute", "role", "jail", "unjail", "announce"]);
export const isModeration = (n: string) => MOD.has(n) || n.startsWith("welcome") || n.startsWith("ticket");
const LEVELS = new Set(["leaderboard", "rank", "xp", "top", "level"]);
const MUSIC = new Set(["play", "pause", "resume", "stop", "skip", "queue", "volume", "loop", "nowplaying", "join", "leave", "shuffle", "seek", "remove"]);
const GAMES = new Set(["freegames", "gamerank", "mcstatus", "giveaway", "xo", "flags", "roulette", "points", "fast", "fakk", "reverse", "plural", "singular", "math", "riddle"]);
export const categoryOf = (n: string) =>
  MUSIC.has(n) ? "music" : LEVELS.has(n) ? "levels" : n.startsWith("ticket") ? "tickets" : n.includes("setup") || n.endsWith("-off") || n.endsWith("-test") ? "setup" : isModeration(n) ? "moderation" : GAMES.has(n) ? "games" : "general";
const CATS = [["all", "All"], ["games", "Games"], ["general", "General"], ["levels", "Levels"], ["moderation", "Moderation"], ["music", "Music"], ["setup", "Setup"], ["tickets", "Tickets"]] as const;
export function AllCommands(p: P) {
  const __tr = useSpireTranslation();

  const [cat, setCat] = useState<(typeof CATS)[number][0]>("all");
  const [q, setQ] = useState("");
  const list = p.data.commands.filter((c) => (cat === "all" || categoryOf(c.name) === cat) && `${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase()));
  const cmds = p.m.general.commands;
  return (
    <>
      <PageHeader title={__tr("كل الأوامر")} />
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:items-center" dir="ltr">
        <div className="flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
          {CATS.map(([id, label]) => (
            <button key={id} onClick={() => setCat(id)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${cat === id ? "bg-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{__tr(label)}</button>
          ))}
        </div>
        <Input className="lg:flex-1" placeholder="Search commands..." value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="shrink-0 text-sm text-muted-foreground">{list.length} / {p.data.commands.length}</span>
      </div>
      <div className="grid gap-4">
        {list.map((c) => (
          <CommandRow key={c.name} name={c.name} description={__tr(c.description)} data={p.data} cfg={{ ...defaultCommand(), enabled: defaultEnabled(c.name), ...cmds[c.name] }}
            onChange={(cfg) => p.set("general", { ...p.m.general, commands: { ...cmds, [c.name]: cfg } })} />
        ))}
        {!list.length && <p className="text-muted-foreground">{__tr("لا توجد أوامر مطابقة.")}</p>}
      </div>
    </>
  );
}
export function CategorizedCommands(p: P & { kind: "levels" | "music" }) {
  const __tr = useSpireTranslation();

  return <><PageHeader title={p.kind === "levels" ? __tr("المستويات والترتيب") : __tr("الموسيقى")}/><CommandList {...p} filter={n => (p.kind === "levels" ? LEVELS : MUSIC).has(n)}/></>;
}

export function General(p: P) {
  const __tr = useSpireTranslation();

  return (
    <>
      <PageHeader title={__tr("الأوامر العامة")} />
      <CommandList {...p} filter={(n) => !isModeration(n) && !LEVELS.has(n) && !MUSIC.has(n) && !n.includes("streak")} />
    </>
  );
}

export function Moderation(p: P) {
  const __tr = useSpireTranslation();

  const mo = p.m.moderation;
  const up = <K extends keyof typeof mo>(k: K, v: (typeof mo)[K]) => p.set("moderation", { ...mo, [k]: v });
  return (
    <>
      <PageHeader title={__tr("الإشراف")} />
      <h2 className="mb-3 mt-8 text-xl font-bold">{__tr("أوامر الإشراف")}</h2>
      <CommandList {...p} filter={isModeration} />
    </>
  );
}

/* ---------------- Welcome ---------------- */
type WelcomeTab = "join" | "image" | "dm" | "leave";
export function Welcome({ data, m, set }: P) {
  const __tr = useSpireTranslation();

  const t = useT();
  const w = m.welcome;
  const [tab, setTab] = useState<WelcomeTab>("join");
  const up = <K extends keyof typeof w>(k: K, v: (typeof w)[K]) => set("welcome", { ...w, [k]: v });
  const chans = chanItems(data);
  const vars = <>{__tr("المتغيرات:")}<bdi dir="ltr">{"{user}"} {"{username}"} {"{server}"} {"{count}"}</bdi></>;
  const tabs: { id: WelcomeTab; label: string; desc: string; icon: typeof Users; on: boolean }[] = [
    { id: "join", label: "دخول", desc: "رسالة بالروم لما يدخل عضو", icon: LogIn, on: w.joinMessage.enabled },
    { id: "image", label: "صورة ترحيب", desc: "بطاقة ترحيب ومغادرة بالصورة", icon: ImageIcon, on: w.joinImage.enabled || w.leaveImage.enabled },
    { id: "dm", label: "رسالة خاصة", desc: "رسالة بالخاص للعضو الجديد", icon: Mail, on: w.joinDm.enabled },
    { id: "leave", label: "خروج", desc: "رسالة بالروم لما يطلع عضو", icon: LogOut, on: w.leaveMessage.enabled },
  ];
  return (
    <>
      <PageHeader title={__tr("الترحيب & المغادرة")} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tabs.map((x) => (
          <button key={x.id} type="button" onClick={() => setTab(x.id)}
            className={`group flex items-start gap-3 rounded-2xl border p-4 text-start transition ${tab === x.id ? "border-primary bg-primary/10 shadow-gold" : "border-border bg-card hover:border-primary/50"}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tab === x.id ? "bg-gold text-primary-foreground" : "bg-secondary text-primary"}`}><x.icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-bold">{t(x.label)}<span className={`h-2 w-2 rounded-full ${x.on ? "bg-primary" : "bg-muted-foreground/40"}`} /></span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{x.desc}</span>
            </span>
          </button>
        ))}
      </div>
      {tab === "join" && (
        <Card title={__tr("رسالة الدخول")} desc={__tr("تنرسل بالروم اللي تختاره أول ما يدخل عضو جديد")} right={<Switch checked={w.joinMessage.enabled} onCheckedChange={(v) => up("joinMessage", { ...w.joinMessage, enabled: v })} />}>
          <div className={w.joinMessage.enabled ? "grid gap-4" : "pointer-events-none grid gap-4 opacity-50"}>
            <Field label={__tr("الروم")}><Pick value={w.joinMessage.channelId} onChange={(v) => up("joinMessage", { ...w.joinMessage, channelId: v })} items={chans} /></Field>
            <Field label={__tr("الرسالة")} hint={vars}><Textarea rows={4} value={w.joinMessage.text} onChange={(e) => up("joinMessage", { ...w.joinMessage, text: e.target.value })} /></Field>
          </div>
        </Card>
      )}
      {tab === "image" && <div className="grid gap-4"><WelcomeImages data={data} join={w.joinImage} leave={w.leaveImage} onJoin={(c) => up("joinImage", c)} onLeave={(c) => up("leaveImage", c)} /></div>}
      {tab === "dm" && (
        <Card title={__tr("رسالة خاصة للعضو الجديد")} desc={__tr("البوت يرسلها بالخاص على شكل إيمبد مرتب")} right={<Switch checked={w.joinDm.enabled} onCheckedChange={(v) => up("joinDm", { ...w.joinDm, enabled: v })} />}>
          <div className={w.joinDm.enabled ? "grid gap-4" : "pointer-events-none grid gap-4 opacity-50"}>
            <Field label={__tr("الرسالة")} hint={vars}><Textarea rows={4} value={w.joinDm.text} onChange={(e) => up("joinDm", { ...w.joinDm, text: e.target.value })} /></Field>
          </div>
        </Card>
      )}
      {tab === "leave" && (
        <Card title={__tr("رسالة الخروج")} desc={__tr("تنرسل بالروم لما يطلع عضو من السيرفر")} right={<Switch checked={w.leaveMessage.enabled} onCheckedChange={(v) => up("leaveMessage", { ...w.leaveMessage, enabled: v })} />}>
          <div className={w.leaveMessage.enabled ? "grid gap-4" : "pointer-events-none grid gap-4 opacity-50"}>
            <Field label={__tr("الروم")}><Pick value={w.leaveMessage.channelId} onChange={(v) => up("leaveMessage", { ...w.leaveMessage, channelId: v })} items={chans} /></Field>
            <Field label={__tr("الرسالة")} hint={vars}><Textarea rows={4} value={w.leaveMessage.text} onChange={(e) => up("leaveMessage", { ...w.leaveMessage, text: e.target.value })} /></Field>
          </div>
        </Card>
      )}
    </>
  );
}

/* ---------------- Logs ---------------- */
export function Logs({ data, m, set }: P) {
  const __tr = useSpireTranslation();

  const l = m.logs;
  const chans = chanItems(data);
  return (
    <>
      <PageHeader title={__tr("اللوق")} enabled={l.enabled} onToggle={(v) => set("logs", { ...l, enabled: v })} />
      <Card title={__tr("شكل اللوق")}>
        <div className="log-style-pick" role="radiogroup">
          {([["embed", "إيمبد (كتابة)", "رسالة ديسكورد عادية فيها المعلومات مكتوبة"], ["image", "صور", "البوت يرسم نفس المعلومات في صورة مرتبة بلون الحدث"]] as const).map(([v, label, hint]) => (
            <button key={v} type="button" role="radio" aria-checked={(l.style ?? "embed") === v} className="log-style-opt" data-active={(l.style ?? "embed") === v || undefined} onClick={() => set("logs", { ...l, style: v })}>
              <span className="log-style-preview" data-kind={v}>{v === "embed" ? <><i /><b /><b /><b /></> : <><i /><em /><b /><b /></>}</span>
              <span className="font-bold">{__tr(label)}</span>
              <span className="text-xs text-muted-foreground">{__tr(hint)}</span>
            </button>
          ))}
        </div>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {LOG_EVENTS.map(([key, label]) => {
          const ev = l.events[key] ?? { enabled: false, channelId: null, color: DEFAULT_LOG_COLOR };
          const up = (patch: Partial<typeof ev>) => set("logs", { ...l, events: { ...l.events, [key]: { ...ev, ...patch } } });
          return (
            <Card key={key} title={__tr(label)} right={<Switch checked={ev.enabled} onCheckedChange={(v) => up({ enabled: v })} />}>
              <Pick value={ev.channelId} onChange={(v) => up({ channelId: v })} items={chans} />
              <Field label={__tr("لون")}>
                <input type="color" value={ev.color} onChange={(e) => up({ color: e.target.value })} className="h-11 w-full cursor-pointer rounded-xl border border-border bg-transparent" />
              </Field>
            </Card>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Auto roles ---------------- */
export function AutoRoles({ data, m, set }: P) {
  const __tr = useSpireTranslation();

  const a = m.autoRoles;
  return (
    <>
      <PageHeader title={__tr("الرولات التلقائية")} enabled={a.enabled} onToggle={(v) => set("autoRoles", { ...a, enabled: v })} />
      <div className="grid gap-4">
        <BulkRole data={data} />
      </div>
    </>
  );
}

/* ---------------- Banned words ---------------- */
const PUNISH: [BannedRule["punishment"], string][] = [["timeout", "تايم اوت"], ["mute", "ميوت (رتبة Muted)"], ["kick", "طرد"], ["ban", "باند"], ["none", "حذف الرسالة وتحذير فقط"]];
const MATCH: [BannedRule["match"], string, string][] = [
  ["word", "داخل الجملة", "الكلمة موجودة ككلمة مستقلة في أي مكان بالرسالة"],
  ["exact", "متطابقة", "الرسالة كلها هي الكلمة بالضبط"],
  ["contains", "أي جزء", "حتى لو الكلمة جزء من كلمة ثانية"],
];
/** Reads words from a .docx / .txt file: one per line or separated by commas. */
async function wordsFromFile(file: File): Promise<string[]> {
  let text = "";
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth/mammoth.browser");
    text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  } else text = await file.text();
  return text.split(/[\n\r,،;]+/).map((w) => w.trim()).filter((w) => w.length > 0 && w.length <= 100);
}
export function BannedWords({ data, m, set }: P) {
  const __tr = useSpireTranslation();

  const t = useT();
  const bw = m.bannedWords;
  // One flat list: every word from older groups is merged into a single rule.
  const rule: BannedRule = { ...(bw.rules[0] ?? bannedRuleSchema.parse({ id: "main", name: "main" })), words: [...new Set(bw.rules.flatMap((r) => r.words))] };
  const upAll = (v: Partial<typeof bw>) => set("bannedWords", { ...bw, ...v });
  const upRule = (v: Partial<BannedRule>) => upAll({ rules: [{ ...rule, ...v, words: (v.words ?? rule.words).slice(0, 200) }] });
  const roles = roleItems(data), chans = chanItems(data);
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const words = await wordsFromFile(f);
      const merged = [...new Set([...rule.words, ...words])];
      if (merged.length > 200) toast.warning(__tr("الحد الأقصى 200 كلمة — انضاف أول 200"));
      upRule({ words: merged });
      toast.success(`انضافت ${Math.min(merged.length, 200) - rule.words.length} كلمة — لا تنسى تحفظ`);
    } catch { toast.error(__tr("ما قدرنا نقرأ الملف — استخدم ملف Word (.docx) أو نص (.txt)")); }
    if (fileRef.current) fileRef.current.value = "";
  };
  return (
    <>
      <PageHeader title={__tr("الكلمات المحظورة")} />
      <p className="mb-4 text-sm text-muted-foreground">{__tr("أي كلمة تضيفها هنا يطبقها البوت تلقائيًا بعد الحفظ. اللي يكتبها بالسيرفر ياخذ العقوبة اللي تحددها. الأدمن ما تنطبق عليهم.")}</p>
      <div className="grid gap-4">
        <Card title={<>{t("الكلمات")} <span className="ms-2 font-mono text-sm text-muted-foreground">{rule.words.length} / 200</span></>}
          right={<>
            <input ref={fileRef} type="file" accept=".docx,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4" /> {t("رفع ملف Word")}</Button>
          </>}>
          <TagInput value={rule.words} onChange={(v) => upRule({ words: v })} placeholder={__tr("اكتب الكلمة واضغط Enter — أو الصق عدة كلمات بينها فاصلة")} />
          <p className="text-xs text-muted-foreground">{__tr("ملف Word: كل كلمة بسطر، أو بينها فاصلة.")}</p>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={__tr("طريقة المطابقة")}>
            <div className="grid gap-2">{MATCH.map(([k, l, d]) => (
              <button type="button" key={k} onClick={() => upRule({ match: k })} className={`rounded-xl border px-3 py-2 text-start ${rule.match === k ? "border-primary bg-primary/10" : "border-border"}`}>
                <div className="text-sm font-bold">{l}</div><div className="text-xs text-muted-foreground">{d}</div></button>))}</div>
          </Card>
          <Card title={__tr("العقوبة")}>
            <Pick value={rule.punishment} onChange={(v) => upRule({ punishment: (v ?? "none") as BannedRule["punishment"] })} items={PUNISH.map(([id, name]) => ({ id, name }))} />
            {(rule.punishment === "timeout" || rule.punishment === "mute") && (
              <Field label={__tr("المدة بالدقائق")} hint={rule.punishment === "timeout" ? __tr("أقصى شي 40320 دقيقة (28 يوم)") : __tr("0 = ميوت دائم")}>
                <Input type="number" min={0} max={40320} value={rule.durationMinutes} onChange={(e) => upRule({ durationMinutes: Math.max(0, Math.min(40320, Number(e.target.value) || 0)) })} />
              </Field>)}
            <Field label={__tr("رسالة التحذير")} hint={__tr("{user} = منشن العضو · {word} = الكلمة")}><Input value={rule.warnMessage} onChange={(e) => upRule({ warnMessage: e.target.value })} /></Field>
            <ToggleRow label={__tr("حذف الرسالة المخالفة")} checked={rule.deleteMessage} onChange={(v) => upRule({ deleteMessage: v })} />
          </Card>
          <Card title={__tr("الاستثناءات")}>
            <Field label={__tr("رولات مستثناة")}><SelectMulti value={rule.ignoreRoles} onChange={(v) => upRule({ ignoreRoles: v })} items={roles} /></Field>
            <Field label={__tr("رومات مستثناة")}><SelectMulti value={rule.ignoreChannels} onChange={(v) => upRule({ ignoreChannels: v })} items={chans} /></Field>
          </Card>
          <Card title={t("روم سجل المخالفات")}><Pick value={bw.logChannelId} onChange={(v) => upAll({ logChannelId: v })} items={chans} placeholder={__tr("بدون سجل")} /></Card>
        </div>
      </div>
    </>
  );
}

/* ---------------- Bot language + chat prefix (synced with /language in the bot) ---------------- */
const LANG_OPTIONS: [string, string][] = [["ar", "🇸🇦 العربية"], ["en", "🇺🇸 English"], ["fr", "🇫🇷 Français"], ["es", "🇪🇸 Español"], ["de", "🇩🇪 Deutsch"], ["it", "🇮🇹 Italiano"], ["ru", "🇷🇺 Русский"], ["zh", "🇨🇳 中文"], ["tr", "🇹🇷 Türkçe"], ["pt", "🇧🇷 Português"], ["id", "🇮🇩 Bahasa Indonesia"], ["ja", "🇯🇵 日本語"], ["ko", "🇰🇷 한국어"], ["hi", "🇮🇳 हिन्दी"]];
export function BotSettings(p: P) {
  const __tr = useSpireTranslation();
  const g = p.m.general;
  return (
    <>
      <PageHeader title={__tr("إعدادات البوت")} />
      <Card>
        <Field label={__tr("لغة البوت")}>
          <Select value={g.lang ?? "ar"} onValueChange={(code) => p.set("general", { ...g, lang: code as NonNullable<Modules["general"]["lang"]> })}>
            <SelectTrigger className="max-w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{LANG_OPTIONS.map(([code, label]) => <SelectItem key={code} value={code}>{label}</SelectItem>)}</SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">{__tr("تتغير في البوت خلال ثواني بعد الحفظ، ولو غيرتها بـ /language في البوت تتغير هنا تلقائياً.")}</p>
        </Field>
        <Field label={__tr("البادئة (البيرفكس)")}>
          <Input dir="ltr" maxLength={5} className="max-w-40" value={g.prefix ?? ""} placeholder="#"
            onChange={(e) => p.set("general", { ...g, prefix: e.target.value })} />
          <p className="mt-2 text-xs text-muted-foreground">{__tr("الرمز اللي ينكتب قبل الأمر (مثل #ping). اتركه فاضي وتشتغل الأوامر بدون أي رمز (مثل ping).")}</p>
        </Field>
      </Card>
    </>
  );
}
