import { useT as useSpireTranslation } from "@/lib/i18n";
import { useRef, useState, type PointerEvent as RPE } from "react";
import { toast } from "sonner";
import { Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { uploadWelcomeBg, startRoleJob } from "@/lib/modules.functions";
import { cardBgStyle, type CardCfg } from "@/lib/modules.schema";

// Same background the bot draws: diagonal gradient, solid color, or uploaded image.
export function cardBackground(cfg: CardCfg): string {
  const style = cardBgStyle(cfg);
  if (style === "image" && cfg.backgroundUrl) return `center / cover no-repeat url("${cfg.backgroundUrl}"), ${cfg.bgColor1}`;
  if (style === "solid") return cfg.bgColor1;
  return `radial-gradient(circle at 50% 30%, ${cfg.accent}40, transparent 55%), linear-gradient(135deg, ${cfg.bgColor1}, ${cfg.bgColor2})`;
}

const PRESETS: { name: string; c1: string; c2: string }[] = [
  { name: "ألوان الموقع", c1: "#0b1514", c2: "#134e48" },
  { name: "بنفسجي", c1: "#140a26", c2: "#4c1d95" },
  { name: "ليلي", c1: "#020617", c2: "#1e3a8a" },
  { name: "ذهبي", c1: "#1c1203", c2: "#a16207" },
  { name: "وردي", c1: "#2a0a1a", c2: "#be185d" },
  { name: "أخضر", c1: "#03140d", c2: "#047857" },
  { name: "أحمر", c1: "#1a0505", c2: "#b91c1c" },
  { name: "رمادي", c1: "#0a0a0a", c2: "#3f3f46" },
];
import { Card, Field, Pick, chanItems, roleItems, type GuildData } from "./kit";

export function Segmented<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; name: string }[] }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-background/60 p-1">
      {items.map((i) => (
        <button key={i.id} type="button" onClick={() => onChange(i.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${value === i.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
          {i.name}
        </button>
      ))}
    </div>
  );
}

type Key = "avatar" | "titlePos" | "namePos" | "subtitlePos";
const fill = (s: string, data: GuildData) =>
  s.replaceAll("{count}", String(data.stats.members ?? 0)).replaceAll("{server}", data.guild.name).replaceAll("{user}", "Member").replaceAll("{username}", "Member");

function Preview({ cfg, data, onMove }: { cfg: CardCfg; data: GuildData; onMove: (k: Key, x: number, y: number) => void }) {
  const __tr = useSpireTranslation();

  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Key | null>(null);
  const move = (e: RPE) => {
    if (!drag || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const c = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
    onMove(drag, c(((e.clientX - r.left) / r.width) * 100), c(((e.clientY - r.top) / r.height) * 100));
  };
  const grab = (k: Key) => (e: RPE) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDrag(k); };
  const at = (p: { x: number; y: number }) => ({ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)" });
  const handle = "absolute cursor-grab select-none whitespace-nowrap rounded-md outline-dashed outline-1 outline-transparent hover:outline-white/50 active:cursor-grabbing";
  const av = (cfg.avatarSize / 1100) * 100;
  return (
    <div ref={box} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}
      className="relative w-full overflow-hidden rounded-xl border border-border [container-type:inline-size]"
      style={{ aspectRatio: "1100 / 500", background: cardBackground(cfg) }}>
      <div className="pointer-events-none absolute inset-[3%] rounded-[3cqw] border border-white/25" />
      {data.guild.icon !== undefined && (
        <div onPointerDown={grab("avatar")} className={`${handle} rounded-full`} style={{ ...at(cfg.avatar), width: `${av}cqw`, height: `${av}cqw` }}>
          <div className="h-full w-full rounded-full p-[0.5cqw]" style={{ background: cfg.accent, boxShadow: `0 0 3cqw ${cfg.accent}` }}>
            {data.guild.icon
              ? <img src={data.guild.icon} alt="" draggable={false} className="h-full w-full rounded-full border-[0.4cqw] border-black/80 object-cover" />
              : <div className="h-full w-full rounded-full border-[0.4cqw] border-black/80 bg-black/40" />}
          </div>
        </div>
      )}
      <div onPointerDown={grab("titlePos")} className={`${handle} font-display font-bold text-white`} style={{ ...at(cfg.titlePos), fontSize: "6.5cqw", textShadow: `0 0 2cqw ${cfg.accent}` }}>{__tr(cfg.title)}</div>
      <div onPointerDown={grab("namePos")} className={handle} style={{ ...at(cfg.namePos), fontSize: "4cqw", fontWeight: 700, color: "#d8c4ff" }}>Member</div>
      <div onPointerDown={grab("subtitlePos")} className={handle} style={{ ...at(cfg.subtitlePos), fontSize: "3cqw", color: "#e6dcff" }}>{fill(cfg.subtitle, data)}</div>
    </div>
  );
}

export function WelcomeImages({ data, join, leave, onJoin, onLeave }: {
  data: GuildData; join: CardCfg; leave: CardCfg; onJoin: (c: CardCfg) => void; onLeave: (c: CardCfg) => void;
}) {
  const __tr = useSpireTranslation();

  const [tab, setTab] = useState<"join" | "leave">("join");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const cfg = tab === "join" ? join : leave;
  const up = (p: Partial<CardCfg>) => (tab === "join" ? onJoin : onLeave)({ ...cfg, ...p });
  const bgStyle = cardBgStyle(cfg);
  const pick = async (f: File | undefined) => {
    if (!f) return undefined;
    if (f.size > 4.5 * 1024 * 1024) { toast.error(__tr("الصورة أكبر من 4.5MB")); return; }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsDataURL(f); });
      const { path } = await uploadWelcomeBg({ data: { guildId: data.guild.id, dataUrl } });
      // Saved as a site path; the bot prefixes it with DASHBOARD_URL.
      up({ backgroundUrl: path, bgStyle: "image" });
      toast.success(__tr("تم رفع الخلفية — اضغط حفظ"));
    } catch { toast.error(__tr("ما قدرنا نرفع الصورة")); }
    setBusy(false);
  };
  return (
    <Card title={__tr("صورة الترحيب والمغادرة")} right={<Switch checked={join.enabled || leave.enabled} onCheckedChange={(v) => { onJoin({ ...join, enabled: v }); onLeave({ ...leave, enabled: v }); }} aria-label={__tr("تفعيل صورة الترحيب والمغادرة")} />}>
      <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={tab} onChange={setTab} items={[{ id: "join", name: __tr("مرحباً") }, { id: "leave", name: "Goodbye" }]} />
        <div className="flex flex-wrap gap-2">
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          <Button variant={bgStyle === "gradient" ? "gold" : "outline"} size="sm" onClick={() => up({ bgStyle: "gradient" })}>{__tr("تدرج لوني")}</Button>
          <Button variant={bgStyle === "solid" ? "gold" : "outline"} size="sm" onClick={() => up({ bgStyle: "solid" })}>{__tr("لون واحد")}</Button>
          <Button variant={bgStyle === "image" ? "gold" : "outline"} size="sm" disabled={busy} onClick={() => file.current?.click()}><Upload className="h-4 w-4" /> {busy ? __tr("جاري الرفع..") : __tr("رفع خلفية")}</Button>
        </div>
      </div>
      {bgStyle !== "image" && (
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button key={p.name} type="button" title={p.name} aria-label={p.name} onClick={() => up({ bgColor1: p.c1, bgColor2: p.c2 })}
              className={`h-8 w-8 rounded-full border-2 transition ${cfg.bgColor1 === p.c1 && cfg.bgColor2 === p.c2 ? "border-primary scale-110" : "border-border hover:scale-105"}`}
              style={{ background: bgStyle === "solid" ? p.c2 : `linear-gradient(135deg, ${p.c1}, ${p.c2})` }} />
          ))}
        </div>
      )}
      <Preview cfg={cfg} data={data} onMove={(k, x, y) => up({ [k]: { x, y } } as Partial<CardCfg>)} />
      <p className="text-xs text-muted-foreground">{__tr("أفضل حجم 1100×500. يتم قص الصور تلقائيًا لتناسب الحجم. الخلفية خاصة بهذا السيرفر فقط.")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={__tr("تفعيل الإرسال")}><div><Switch checked={cfg.enabled} onCheckedChange={(v) => up({ enabled: v })} /></div></Field>
        <Field label={__tr("الروم")}><Pick value={cfg.channelId} onChange={(v) => up({ channelId: v })} items={chanItems(data)} /></Field>
        <Field label={__tr("العنوان")}><Input value={__tr(cfg.title)} onChange={(e) => up({ title: e.target.value })} /></Field>
        <Field label={__tr("الكلام تحت الاسم")} hint={<>{__tr("المتغيرات:")}{"{count}"} {"{server}"} {"{username}"}</>}><Input value={cfg.subtitle} onChange={(e) => up({ subtitle: e.target.value })} /></Field>
        <Field label={`حجم الصورة: ${cfg.avatarSize}`}><input type="range" min={60} max={300} value={cfg.avatarSize} onChange={(e) => up({ avatarSize: +e.target.value })} className="accent-primary" /></Field>
        <Field label={__tr("لون الإطار والتوهج")}><input type="color" value={cfg.accent} onChange={(e) => up({ accent: e.target.value })} className="h-11 w-full cursor-pointer rounded-xl border border-border bg-transparent" /></Field>
        {bgStyle !== "image" && <Field label={bgStyle === "solid" ? __tr("لون الخلفية") : __tr("لون الخلفية 1")}><input type="color" value={cfg.bgColor1} onChange={(e) => up({ bgColor1: e.target.value })} className="h-11 w-full cursor-pointer rounded-xl border border-border bg-transparent" /></Field>}
        {bgStyle === "gradient" && <Field label={__tr("لون الخلفية 2")}><input type="color" value={cfg.bgColor2} onChange={(e) => up({ bgColor2: e.target.value })} className="h-11 w-full cursor-pointer rounded-xl border border-border bg-transparent" /></Field>}
      </div>
      </>
    </Card>
  );
}

export function BulkRole({ data }: { data: GuildData }) {
  const __tr = useSpireTranslation();

  const [roleId, setRole] = useState<string | null>(null);
  const [action, setAction] = useState<"give" | "remove">("give");
  const [target, setTarget] = useState<"members" | "all" | "bots">("members");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const job = data.roleJob;
  const start = async () => {
    if (!roleId) return;
    setBusy(true);
    try {
      await startRoleJob({ data: { guildId: data.guild.id, roleId, action, target } });
      toast.success(__tr("تم الإرسال للبوت — يبدأ خلال ثواني"));
      setTimeout(() => qc.invalidateQueries({ queryKey: ["guild", data.guild.id] }), 20000);
    } catch { toast.error(__tr("ما قدرنا نبدأ")); }
    setBusy(false);
  };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={__tr("يثبت")}>
        <Field label={__tr("دور")}><Pick value={roleId} onChange={setRole} items={roleItems(data)} placeholder={__tr("اختر دورًا")} /></Field>
        <Field label={__tr("فعل")}><Segmented value={action} onChange={setAction} items={[{ id: "give", name: __tr("يعطي") }, { id: "remove", name: __tr("يزيل") }]} /></Field>
        <Field label="From"><Segmented value={target} onChange={setTarget} items={[{ id: "members", name: __tr("للأعضاء فقط") }, { id: "all", name: __tr("الجميع") }, { id: "bots", name: __tr("للروبوتات فقط") }]} /></Field>
        {!roleId && <p className="text-xs text-muted-foreground">{__tr("اختر الدور أولاً.")}</p>}
        <div><Button variant="gold" disabled={!roleId || busy} onClick={start}><Users className="h-4 w-4" /> {__tr("يبدأ")}</Button></div>
      </Card>
      <Card title={__tr("تقدم")}>
        {!job ? <p className="text-sm text-muted-foreground">{__tr("لا يوجد شيء يعمل حالياً.")}</p> : (
          <div className="grid gap-2 text-sm">
            <span>{job.status === "running" ? __tr("جاري التنفيذ…") : job.status === "done" ? __tr("✅ اكتمل") : `❌ ${job.error ?? __tr("صار خطأ")}`}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${job.total ? (job.done / job.total) * 100 : 0}%` }} /></div>
            <span className="text-muted-foreground">{job.done} / {job.total}</span>
          </div>
        )}
      </Card>
      <p className="text-xs text-muted-foreground md:col-span-2">{__tr("لا يمكن منح الأدوار التي تتضمن صلاحيات الموظفين للجميع. يجب أن يكون دور البوت أعلى من هذا الدور.")}</p>
    </div>
  );
}
