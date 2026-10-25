import { useT as useSpireTranslation } from "@/lib/i18n";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Send, Save, Ticket, Lock, Hand, ChevronDown, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveTicketSettings, type getGuildData } from "@/lib/dashboard.functions";
import { createJob } from "@/lib/create.functions";
import { ticketSchema, type TicketSettings } from "@/lib/tickets.schema";
import { TicketPanelEditor } from "./TicketPanelEditor";
import { TicketWelcomeArtwork } from "./TicketWelcomeArtwork";
import { TicketWelcomeDesign } from "./TicketWelcomeDesign";
import { TicketQuestions, emptyForm } from "./TicketQuestions";

type Item = { id: string; name: string };
export function RolePicker({ value, items, onChange, label }: { value: string[]; items: Item[]; onChange: (v: string[]) => void; label: string }) {
  const __tr = useSpireTranslation();

  const [q, setQ] = useState("");
  return <Popover><PopoverTrigger asChild><Button variant="outline" className="role-picker-trigger" aria-label={__tr(label)}><span>{value.length ? items.filter(r => value.includes(r.id)).map(r => r.name).join(__tr("، ")) : __tr("اختر الرتب")}</span><ChevronDown /></Button></PopoverTrigger>
    <PopoverContent align="start" className="role-picker-menu" dir="rtl"><div className="relative"><Input aria-label={__tr("بحث عن رتبة")} placeholder={__tr("بحث عن رتبة…")} value={q} onChange={e => setQ(e.target.value)} /></div><div className="role-options">{items.filter(r => r.name.includes(q)).map(r => <Button key={r.id} variant="ghost" className="role-option" aria-pressed={value.includes(r.id)} onClick={() => onChange(value.includes(r.id) ? value.filter(id => id !== r.id) : [...value, r.id])}><span>{r.name}</span>{value.includes(r.id) && <Check />}</Button>)}</div>{value.length > 0 && <Button variant="ghost" onClick={() => onChange([])}><X /> {__tr("مسح الاختيارات")}</Button>}</PopoverContent></Popover>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  const __tr = useSpireTranslation();
 return <div className="ticket-field"><Label>{__tr(label)}</Label>{children}</div>; }
function Section({ title, children }: { title: string; children: ReactNode }) {
  const __tr = useSpireTranslation();
 return <section className="ticket-section"><h2>{__tr(title)}</h2><div className="ticket-section-body">{children}</div></section>; }
function Pick({ value, items, onChange, label }: { value: string | null; items: Item[]; onChange: (v: string | null) => void; label: string }) {
  const __tr = useSpireTranslation();
 return <Select value={value || "none"} onValueChange={v => onChange(v === "none" ? null : v)}><SelectTrigger aria-label={__tr(label)}><SelectValue placeholder={__tr(label)} /></SelectTrigger><SelectContent dir="rtl"><SelectItem value="none">{__tr(label)}</SelectItem>{items.map(r => <SelectItem value={r.id} key={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>; }
export function TicketWelcomePreview({ t }: { t: TicketSettings }) {
  const __tr = useSpireTranslation();

  const w = t.welcome;
  const replace = (s: string) => s.replaceAll("{user}", "@المستخدم").replaceAll("{number}", "0001").replaceAll("{type}", t.types[0]?.label || "دعم فني").replaceAll("{role}", "@فريق الدعم");
  return <aside className="ticket-welcome-preview"><div className="ticket-preview-caption"><span>{__tr("معاينة داخل التذكرة")}</span><span># ticket-0001</span></div>
    {w.showImage && (w.imageUrl ? <img className="ticket-welcome-image" src={w.imageUrl} alt={__tr("صورة الترحيب داخل التذكرة")} /> : <TicketWelcomeArtwork t={t} />)}
    <div className="ticket-message-preview"><p className="text-primary">{__tr("@المستخدم")}{w.mentionStaff && __tr("@فريق الدعم")}</p>{w.title && <h3>{replace(w.title)}</h3>}<p>{replace(t.openMessage || __tr("مرحباً {user}، اكتب طلبك بالتفصيل وبيرد عليك فريق الدعم بأسرع وقت."))}</p>{w.showType && <p className="text-muted-foreground">{__tr("نوع التذكرة:")}{t.types[0]?.label || __tr("دعم فني")}</p>}<div className="ticket-preview-buttons"><Button variant={w.closeStyle === "danger" ? "destructive" : w.closeStyle === "primary" ? "default" : w.closeStyle} size="sm" disabled>{w.closeEmoji} {w.closeLabel}</Button>{w.showClaim && <Button variant={w.claimStyle === "danger" ? "destructive" : w.claimStyle === "primary" ? "default" : w.claimStyle} size="sm" disabled>{w.claimEmoji} {w.claimLabel}</Button>}</div></div></aside>;
}
export function TicketsSettings({ data, guildId }: { data: Awaited<ReturnType<typeof getGuildData>>; guildId: string }) {
  const __tr = useSpireTranslation();

  const [t, setT] = useState(() => { const parsed = ticketSchema.parse(data.ticket); return { ...parsed, staffRoleIds: parsed.staffRoleIds.length ? parsed.staffRoleIds : parsed.staffRoleId ? [parsed.staffRoleId] : [] }; });
  const [saving, setSaving] = useState(false); const [creating, setCreating] = useState(false); const [panelChannel, setPanelChannel] = useState<string | null>(null); const [confirmPanel, setConfirmPanel] = useState(false);
  const qc = useQueryClient(); const saveFn = useServerFn(saveTicketSettings); const createFn = useServerFn(createJob);
  const set = <K extends keyof TicketSettings>(k: K, v: TicketSettings[K]) => setT(p => ({ ...p, [k]: v }));
  const welcome = <K extends keyof TicketSettings["welcome"]>(k: K, v: TicketSettings["welcome"][K]) => setT(p => ({ ...p, welcome: { ...p.welcome, [k]: v } }));
  const chans = data.textChannels.map(c => ({ ...c, name: `# ${c.name}` }));
  const valid = t.staffRoleIds.length > 0 && t.types.length > 0 && t.types.every(x => x.label.trim()) && ticketSchema.safeParse(t).success;
  const save = async () => { setSaving(true); try { await saveFn({ data: { guildId, ticket: { ...t, staffRoleId: t.staffRoleIds[0] || null } } }); toast.success(__tr("تم حفظ إعدادات التذاكر")); await qc.invalidateQueries({ queryKey: ["guild", guildId] }); } catch(e) { toast.error(e instanceof Error ? e.message : __tr("تعذر الحفظ")); } finally { setSaving(false); } };
  const create = async () => { if (!panelChannel || !valid) return; setCreating(true); try { const ticket = { ...t, staffRoleId: t.staffRoleIds[0] || null }; await saveFn({ data: { guildId, ticket } }); await createFn({ data: { guildId, job: { type: "ticket", payload: { channelId: panelChannel, mode: "another", ticket } } } }); toast.success(__tr("تم طلب إنشاء لوحة التذاكر")); setConfirmPanel(false); } catch(e) { toast.error(e instanceof Error ? e.message : __tr("تعذر إنشاء اللوحة")); } finally { setCreating(false); } };
  return <div className="ticket-settings"><Tabs defaultValue="panel" dir="rtl">
    <TabsList aria-label={__tr("إعدادات التذاكر")} className="ticket-settings-tabs">
      <TabsTrigger value="panel"><Ticket aria-hidden="true" /> {__tr("لوحة التذاكر")}</TabsTrigger>
      <TabsTrigger value="inside"><Hand aria-hidden="true" /> {__tr("داخل التذكرة")}</TabsTrigger>
      <TabsTrigger value="permissions"><Lock aria-hidden="true" /> {__tr("الصلاحيات وحدود التذاكر")}</TabsTrigger>
    </TabsList>
    <TabsContent value="panel"><Section title={__tr("لوحة التذاكر")}><TicketPanelEditor t={t} onChange={d => set("design",d)}><Field label={__tr("عنوان لوحة التذاكر")}><Input aria-label={__tr("عنوان لوحة التذاكر")} maxLength={60} value={__tr(t.title)} placeholder={__tr("مركز الدعم")} onChange={e => set("title",e.target.value)} /></Field><Field label={__tr("الوصف تحت العنوان")}><Input value={t.subtitle} maxLength={120} onChange={e => set("subtitle",e.target.value)} /></Field><Field label={__tr("وقت الرد المعتاد")}><Input value={t.replyTime} maxLength={40} onChange={e => set("replyTime",e.target.value)} /></Field><Field label={__tr("نص قائمة فتح التذكرة")}><Input value={t.panelPlaceholder} maxLength={100} onChange={e => set("panelPlaceholder",e.target.value)} /></Field></TicketPanelEditor></Section>
    <Section title={__tr("أنواع التذاكر")}>{t.types.map((ty,idx) => <div className="ticket-type-block" key={ty.id}><div className="ticket-type-row"><Input aria-label={__tr("إيموجي النوع")} value={ty.emoji || ""} placeholder="🎫" onChange={e => set("types",t.types.map((x,k) => k === idx ? {...x,emoji:e.target.value || null}:x))} /><Input aria-label={__tr("اسم نوع التذكرة")} maxLength={80} value={__tr(ty.label)} onChange={e => set("types",t.types.map((x,k) => k === idx ? {...x,label:e.target.value}:x))} /><Input aria-label={__tr("وصف نوع التذكرة")} maxLength={100} value={__tr(ty.description)} onChange={e => set("types",t.types.map((x,k) => k === idx ? {...x,description:e.target.value}:x))} /><Pick label={__tr("رتبة النوع")} items={data.roles} value={ty.roleId} onChange={v => set("types",t.types.map((x,k) => k === idx ? {...x,roleId:v}:x))} /><Button variant="ghost" size="icon" aria-label={__tr("حذف نوع التذكرة")} onClick={() => set("types",t.types.filter((_,k) => k !== idx))}><Trash2 /></Button></div><TicketQuestions value={ty.form} typeLabel={__tr(ty.label)} onChange={f => set("types",t.types.map((x,k) => k === idx ? {...x,form:f}:x))} /></div>)}<Button variant="secondary" disabled={t.types.length >= 25} onClick={() => set("types",[...t.types,{id:crypto.randomUUID(),label:__tr("نوع جديد"),description:"",emoji:null,roleId:null,form:emptyForm()}])}><Plus /> {__tr("إضافة نوع")}</Button></Section>
    </TabsContent>
    <TabsContent value="inside"><Section title={__tr("داخل التذكرة")}><div className="ticket-inside-layout"><div className="ticket-welcome-fields"><Field label={__tr("عنوان رسالة الترحيب")}><Input aria-label={__tr("عنوان رسالة الترحيب")} value={__tr(t.welcome.title)} maxLength={100} onChange={e => welcome("title",e.target.value)} /></Field><Field label={__tr("رسالة الترحيب داخل التذكرة")}><Textarea aria-label={__tr("رسالة الترحيب داخل التذكرة")} rows={4} maxLength={1500} value={t.openMessage} onChange={e => set("openMessage",e.target.value)} /></Field><Field label={__tr("عنوان الصورة")}><Input aria-label={__tr("عنوان الصورة")} value={t.welcome.imageTitle} maxLength={60} onChange={e => welcome("imageTitle",e.target.value)} /></Field><Field label={__tr("النص تحت عنوان الصورة")}><Input value={t.welcome.imageSubtitle} maxLength={100} onChange={e => welcome("imageSubtitle",e.target.value)} /></Field><Field label={__tr("صورة مخصصة (رابط مباشر)")}><Input aria-label={__tr("صورة مخصصة")} dir="ltr" value={t.welcome.imageUrl} onChange={e => welcome("imageUrl",e.target.value)} /></Field>{([['showImage',__tr('إظهار الصورة')],['showNumber',__tr('إظهار رقم التذكرة في الصورة')],['showType',__tr('إظهار نوع التذكرة')],['mentionStaff',__tr('منشن فريق الإدارة')],['showClaim',__tr('إظهار زر الاستلام')]] as const).map(([k,l]) => <label className="ticket-toggle" key={k}>{l}<Switch aria-label={l} checked={t.welcome[k]} onCheckedChange={v => welcome(k,v)} /></label>)}<div className="ticket-fields-grid">{(['close','claim'] as const).map(k => <div className="ticket-field" key={k}><Label>{k==='close'?__tr('زر الإغلاق'):__tr('زر الاستلام')}</Label><Input aria-label={k==='close'?__tr('نص زر الإغلاق'):__tr('نص زر الاستلام')} value={t.welcome[`${k}Label`]} maxLength={80} onChange={e => welcome(`${k}Label`,e.target.value)} /><Input aria-label={k==='close'?__tr('إيموجي الإغلاق'):__tr('إيموجي الاستلام')} value={t.welcome[`${k}Emoji`]} onChange={e => welcome(`${k}Emoji`,e.target.value)} /><Select value={t.welcome[`${k}Style`]} onValueChange={v => welcome(`${k}Style`,v as TicketSettings['welcome']['closeStyle'])}><SelectTrigger aria-label={`لون زر ${k==='close'?__tr('الإغلاق'):__tr('الاستلام')}`}><SelectValue /></SelectTrigger><SelectContent>{(['primary','secondary','success','danger'] as const).map((v,i) => <SelectItem key={v} value={v}>{[__tr('أساسي'),__tr('ثانوي'),__tr('أخضر'),__tr('أحمر')][i]}</SelectItem>)}</SelectContent></Select></div>)}</div><TicketWelcomeDesign value={t.welcome.design} onChange={v => welcome("design",v)} /></div><TicketWelcomePreview t={t} /></div></Section>
    </TabsContent>
    <TabsContent value="permissions"><Section title={__tr("الصلاحيات وحدود التذاكر")}><div className="ticket-fields-grid"><Field label={__tr("رتب الإدارة (تشوف كل التذاكر)")}><RolePicker label={__tr("رتب الإدارة")} value={t.staffRoleIds} items={data.roles} onChange={v => set("staffRoleIds",v)} /></Field><Field label={__tr("الرتب المحظورة من فتح تذكرة")}><RolePicker label={__tr("الرتب المحظورة")} value={t.blockedRoleIds} items={data.roles} onChange={v => set("blockedRoleIds",v)} /></Field><Field label={__tr("الكاتيقوري")}><Pick label={__tr("بدون كاتيقوري")} items={data.categories} value={t.categoryId} onChange={v => set("categoryId",v)} /></Field><Field label={__tr("روم اللوق")}><Pick label={__tr("بدون روم لوق")} items={chans} value={t.logChannelId} onChange={v => set("logChannelId",v)} /></Field><Field label={__tr("عدد التذاكر المفتوحة للشخص الواحد")}><Input aria-label={__tr("عدد التذاكر المفتوحة للشخص الواحد")} type="number" min={1} max={10} value={t.maxOpenTickets} onChange={e => set("maxOpenTickets",Math.max(1,Math.min(10,Number(e.target.value)||1)))} /></Field></div><div className="ticket-notice">{__tr("عند محاولة فتح تذكرة إضافية يظهر تحذير، وعند بلوغ الحد يُمنع فتح تذاكر أخرى.")}</div></Section>
    <Section title={__tr("إنشاء لوحة التذاكر في السيرفر")}><div className="ticket-publish-row"><Pick label={__tr("روم لوحة التذاكر")} items={chans} value={panelChannel} onChange={v => {setPanelChannel(v);setConfirmPanel(false);}} /><Button variant="gold" disabled={!panelChannel || !valid || creating} onClick={() => setConfirmPanel(true)}><Send /> {__tr("إنشاء لوحة التذاكر")}</Button></div>{confirmPanel && <div className="ticket-notice" role="alert">{__tr("سيتم إرسال لوحة جديدة؛ إذا عندك لوحة سابقة بتظل موجودة.")}<div className="ticket-preview-buttons"><Button disabled={creating} onClick={create}>{creating?__tr('جاري الإنشاء…'):__tr('تأكيد إنشاء لوحة جديدة')}</Button><Button variant="ghost" onClick={() => setConfirmPanel(false)}>{__tr("إلغاء")}</Button></div></div>}</Section></TabsContent></Tabs><div className="ticket-save-row"><Button variant="gold" disabled={saving || !valid} onClick={save}><Save /> {saving?__tr('جاري الحفظ…'):__tr('حفظ التغييرات')}</Button></div></div>;
}
