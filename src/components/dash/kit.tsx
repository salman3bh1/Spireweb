import { useT as useSpireTranslation } from "@/lib/i18n";
import { useState, type ReactNode } from "react";
import { ChevronDown, X, Eye, Copy, TerminalSquare, History, Settings, ListChecks, Hand, Ban, Send, Medal, Flame, TrendingUp, Music, Users, Wand2, Ticket, Trophy } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { getGuildData } from "@/lib/dashboard.functions";
import { useT } from "@/lib/i18n";

export type GuildData = Awaited<ReturnType<typeof getGuildData>>;
export type Item = { id: string; name: string };
const NONE = "__none";

const HEADS: Record<string, { d: string; i: ReactNode }> = {
  "النظرة العامة": { d: "ملخص سريع لإحصائيات خادمك والتفاعل بين الأعضاء.", i: <Eye /> },
  "رسائل الإيمبد": { d: "صمّم رسائل إيمبد مرتبة وأرسلها لأي روم، وعدّل عليها بعدين.", i: <Copy /> },
  "كل الأوامر": { d: "شغّل أو أوقف أي أمر، وحدد مين يقدر يستخدمه ووين.", i: <TerminalSquare /> },
  "السجل": { d: "كل تعديل يسويه فريقك في الموقع محفوظ هنا مع الوقت والشخص.", i: <History /> },
  "الأوامر العامة": { d: "إعدادات الأوامر العامة اللي يستخدمها كل الأعضاء.", i: <Settings /> },
  "الإشراف": { d: "أوامر الإشراف وصلاحياتها وسجل المخالفات.", i: <ListChecks /> },
  "الترحيب & المغادرة": { d: "رسائل وصور ترحيب ومغادرة تطلع بالشكل اللي تبيه.", i: <Hand /> },
  "الكلمات المحظورة": { d: "امنع كلمات معيّنة وحدد العقوبة والرومات المستثناة.", i: <Ban /> },
  "الرد التلقائي": { d: "ردود تلقائية على كلمات أو جمل تختارها.", i: <Send /> },
  "الرولات التلقائية": { d: "رولات تنعطى تلقائيًا للأعضاء الجدد والبوتات.", i: <Medal /> },
  "اللوق": { d: "سجّل كل اللي يصير في السيرفر في الرومات اللي تحددها.", i: <History /> },
  "إنشاء ستريك": { d: "خصص ستريك سيرفرك: الروم والرياكشن والرسائل.", i: <Flame /> },
  "توب الستريك": { d: "ترتيب أكثر الأعضاء محافظة على الستريك.", i: <Trophy /> },
  "المستويات والترتيب": { d: "مستويات الأعضاء وترتيبهم في الرسائل والصوت.", i: <TrendingUp /> },
  "الموسيقى": { d: "أوامر الموسيقى وإعداداتها.", i: <Music /> },
  "الأعضاء": { d: "أعضاء الخادم بجميع تفاصيلهم في مكان واحد.", i: <Users /> },
  "إنشاء": { d: "أنشئ رومات وأنظمة جاهزة، أو عدّل اللي أنشأته بدون ما تعيده.", i: <Wand2 /> },
  "صناع المحتوى": { d: "أول ما ينزل فيديو أو يبدأ بث في قناة من القنوات، البوت يرسل إشعار في الروم اللي تختاره.", i: <Eye /> },
  "نظام التكت": { d: "لوحة التذاكر وأنواعها وصلاحياتها ورسائلها.", i: <Ticket /> },
};

export function PageHeader({ title, desc, icon, enabled, onToggle, actions }: {
  title: string; desc?: string; icon?: ReactNode; enabled?: boolean; onToggle?: (v: boolean) => void; actions?: ReactNode;
}) {
  const t = useT();
  const meta = HEADS[title];
  desc ??= meta?.d; icon ??= meta?.i;
  return (
    <header className="page-hero">
      <div className="page-hero-text">
        {icon && <span className="page-hero-icon">{icon}</span>}
        <div className="min-w-0">
          <h1 className="font-display">{t(title)}</h1>
          {desc && <p>{t(desc)}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {actions}
        {onToggle && <label className="page-hero-toggle"><span>{enabled ? t("مفعّل") : t("معطّل")}</span><Switch checked={!!enabled} onCheckedChange={onToggle} aria-label={t("تفعيل")} /></label>}
      </div>
    </header>
  );
}

export function Card({ title, desc, right, children }: { title?: ReactNode; desc?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  const __tr = useSpireTranslation();

  return (
    <section className="module-section panel">
      {(title || right) && (
        <div className="module-section-heading">
          <div>
            {title && <h3 className="panel-title">{__tr(title)}</h3>}
            {desc && <p className="mt-1 text-sm text-muted-foreground">{__tr(desc)}</p>}
          </div>
          {right}
        </div>
      )}
      {children && <div className="module-section-body">{children}</div>}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  const __tr = useSpireTranslation();

  return (
    <div className="grid gap-2">
      <span className="text-sm text-muted-foreground">{__tr(label)}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function Pick({ value, onChange, items, placeholder = "اختر .." }: {
  value: string | null; onChange: (v: string | null) => void; items: Item[]; placeholder?: string;
}) {
  const __tr = useSpireTranslation();

  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger><SelectValue placeholder={__tr(placeholder)} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{__tr(placeholder)}</SelectItem>
        {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function MultiPick({ value, onChange, items, empty = "لا يوجد" }: {
  value: string[]; onChange: (v: string[]) => void; items: Item[]; empty?: string;
}) {
  const __tr = useSpireTranslation();

  if (!items.length) return <p className="text-sm text-muted-foreground">{__tr(empty)}</p>;
  return (
    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
      {items.map((r) => {
        const on = value.includes(r.id);
        return (
          <button key={r.id} type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== r.id) : [...value, r.id])}
            className={`rounded-full border px-3 py-1 text-sm transition ${on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {r.name}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const __tr = useSpireTranslation();

  return (
    <label className="flex items-center justify-between gap-4 rounded-xl bg-secondary/50 px-4 py-3">
      <span className="text-sm font-semibold">{__tr(label)}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function UnsavedBar({ show, saving, onSave, onReset }: { show: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  const t = useT();
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-popover px-5 py-3 shadow-gold">
        <span className="text-sm font-bold">{t("احذر — لديك تغييرات لم يتم حفظها!")}</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReset} disabled={saving}>{t("إلغاء")}</Button>
          <Button variant="gold" onClick={onSave} disabled={saving}>{saving ? t("جاري الحفظ…") : t("حفظ التغييرات")}</Button>
        </div>
      </div>
    </div>
  );
}

export const roleItems = (d: GuildData): Item[] => d.roles.map((r) => ({ id: r.id, name: `@${r.name}` }));
export const chanItems = (d: GuildData): Item[] => d.textChannels.map((c) => ({ id: c.id, name: `# ${c.name}` }));

/* ProBot-style multi-select dropdown: chips inside the box, × to remove, list opens below. */
export function SelectMulti({ value, onChange, items, placeholder = "اختر .." }: {
  value: string[]; onChange: (v: string[]) => void; items: Item[]; placeholder?: string;
}) {
  const __tr = useSpireTranslation();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const chosen = value.map((id) => items.find((i) => i.id === id) ?? { id, name: id });
  const list = items.filter((i) => !value.includes(i.id) && i.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div role="button" tabIndex={0} className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {chosen.length ? chosen.map((c) => (
              <span key={c.id} className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs">
                <button type="button" aria-label={__tr("إزالة")} onClick={(e) => { e.stopPropagation(); onChange(value.filter((x) => x !== c.id)); }} className="font-bold text-muted-foreground hover:text-foreground">×</button>
                {c.name}
              </span>
            )) : <span className="text-muted-foreground">{__tr(placeholder)}</span>}
          </div>
          {value.length > 0 && <button type="button" aria-label={__tr("مسح الكل")} onClick={(e) => { e.stopPropagation(); onChange([]); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-2">
        <Input autoFocus value={q} placeholder={__tr("بحث…")} onChange={(e) => setQ(e.target.value)} className="mb-2 h-8" />
        <div className="max-h-56 overflow-y-auto">
          {!list.length && <p className="p-2 text-sm text-muted-foreground">{__tr("لا يوجد")}</p>}
          {list.map((i) => (
            <button type="button" key={i.id} onClick={() => onChange([...value, i.id])} className="block w-full rounded px-2 py-1.5 text-start text-sm hover:bg-secondary">{i.name}</button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* Tag input: type then Enter (or comma) to add; chips with × inside the box. */
export function TagInput({ value, onChange, placeholder, prefix = "" }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; prefix?: string;
}) {
  const __tr = useSpireTranslation();

  const [t, setT] = useState("");
  const add = () => {
    const parts = t.split(/[,،\n]/).map((x) => x.trim().replace(/^#/, "")).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setT("");
  };
  return (
    <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm">
      {value.map((a) => (
        <span key={a} className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs">
          <button type="button" aria-label={__tr("إزالة")} onClick={() => onChange(value.filter((x) => x !== a))} className="font-bold text-muted-foreground hover:text-foreground">×</button>
          {prefix}{a}
        </span>
      ))}
      <input value={t} placeholder={value.length ? "" : placeholder} onChange={(e) => setT(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } else if (e.key === "Backspace" && !t && value.length) onChange(value.slice(0, -1)); }}
        className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      {value.length > 0 && <button type="button" aria-label={__tr("مسح الكل")} onClick={() => onChange([])} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
    </div>
  );
}
