import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Send, Trash2 } from "lucide-react";
import { createJob, listJobs } from "@/lib/create.functions";
import { PageHeader, Card, Field, Pick, chanItems, roleItems, type GuildData } from "@/components/dash/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Kind = "buttons" | "select" | "reactions";
type Style = "primary" | "secondary" | "success" | "danger";
type Row = { roleId: string | null; label: string; emoji: string; description: string; style: Style };
const KINDS: [Kind, string][] = [["buttons", "أزرار"], ["select", "قائمة"], ["reactions", "رياكشن"]];
const STYLES: [Style, string][] = [["secondary", "رمادي"], ["primary", "أزرق"], ["success", "أخضر"], ["danger", "أحمر"]];
const COLORS = ["#f5b324", "#ffffff", "#ef4444", "#ec4899", "#facc15", "#22c55e", "#3b82f6", "#a855f7"];

export function SelfRoles({ data, guildId }: { data: GuildData; guildId: string }) {
  const [kind, setKind] = useState<Kind>("buttons");
  const [channelId, setChannel] = useState<string | null>(null);
  const [title, setTitle] = useState("اختر رتبتك");
  const [description, setDesc] = useState("اضغط على الزر أو اختر من القائمة للحصول على الرتبة المطلوبة.");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#f5b324");
  const [image, setImage] = useState("");
  const [placeholder, setPh] = useState("اختر رتبة...");
  const [rows, setRows] = useState<Row[]>([{ roleId: null, label: "", emoji: "", description: "", style: "secondary" }]);
  const upd = (n: number, p: Partial<Row>) => setRows((r) => r.map((x, i) => (i === n ? { ...x, ...p } : x)));

  const qc = useQueryClient();
  const jobs = useQuery({ queryKey: ["jobs", guildId], queryFn: () => listJobs({ data: { guildId } }), refetchInterval: 4000 });
  const last = jobs.data?.find((j) => j.type === "selfroles");
  const tooHigh = (id: string | null) => !!id && data.roles.find((r) => r.id === id)?.assignable === false;
  const send = useMutation({
    mutationFn: () => {
      const roles = rows.filter((r) => r.roleId).map((r) => ({ ...r, roleId: r.roleId as string }));
      if (!channelId) throw new Error("اختر الروم");
      if (!roles.length) throw new Error("أضف رتبة واحدة على الأقل");
      if (roles.some((r) => tooHigh(r.roleId))) throw new Error("فيه رتب أعلى من رتبة البوت — ارفع رتبة البوت فوقها من إعدادات السيرفر في ديسكورد");
      if (kind === "reactions" && roles.some((r) => !r.emoji)) throw new Error("كل رتبة تحتاج إيموجي في وضع الرياكشن");
      return createJob({ data: { guildId, job: { type: "selfroles", payload: { channelId, kind, title, description, content, color, image, placeholder, roles } } } });
    },
    onSuccess: () => { toast.success("تم الإرسال، البوت ينشر اللوحة خلال ثواني"); qc.invalidateQueries({ queryKey: ["jobs", guildId] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const roleName = (id: string | null) => data.roles.find((r) => r.id === id)?.name ?? "رتبة";

  return (
    <>
      <PageHeader title="الرتب القابلة للأخذ" desc="لوحة فيها أزرار أو قائمة أو رياكشن: ضغطة تعطي الرتبة وضغطة ثانية تشيلها." />
      <Card title="لوحة جديدة">
        <div className="grid gap-5">
          <Field label="نوع اللوحة">
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map(([k, l]) => <Button key={k} type="button" variant={kind === k ? "gold" : "outline"} onClick={() => setKind(k)}>{l}</Button>)}
            </div>
          </Field>
          <Field label="الروم"><Pick value={channelId} onChange={setChannel} items={chanItems(data)} placeholder="اختر الروم" /></Field>
          <Field label="محتوى الرسالة (اختياري — نص فوق الإيمبد)"><Textarea value={content} maxLength={2000} onChange={(e) => setContent(e.target.value)} /></Field>
          <Field label="لون الشريط الجانبي">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />)}
            </div>
          </Field>
          <Field label="العنوان"><Input value={title} maxLength={256} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="الوصف"><Textarea value={description} maxLength={4000} onChange={(e) => setDesc(e.target.value)} /></Field>
          <Field label="صورة (رابط، اختياري)"><Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://" dir="ltr" /></Field>
          {kind === "select" && <Field label="نص القائمة"><Input value={placeholder} maxLength={150} onChange={(e) => setPh(e.target.value)} /></Field>}

          <Field label={`الرتب (${rows.length}/25)`}>
            <div className="grid gap-3">
              {rows.map((r, n) => (
                <div key={n} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[1.4fr_1fr_0.6fr_auto]">
                  <Pick value={r.roleId} onChange={(v) => upd(n, { roleId: v })} items={roleItems(data)} placeholder="اختر الرتبة" />
                  <Input value={r.label} maxLength={80} onChange={(e) => upd(n, { label: e.target.value })} placeholder="النص (افتراضي اسم الرتبة)" />
                  <Input value={r.emoji} maxLength={64} onChange={(e) => upd(n, { emoji: e.target.value })} placeholder="إيموجي" />
                  <Button type="button" variant="outline" size="icon" aria-label="حذف" onClick={() => setRows((x) => x.filter((_, i) => i !== n))}><Trash2 className="h-4 w-4" /></Button>
                  {kind === "buttons" && (
                    <div className="flex flex-wrap gap-1 md:col-span-4">
                      {STYLES.map(([s, l]) => <Button key={s} type="button" size="sm" variant={r.style === s ? "gold" : "outline"} onClick={() => upd(n, { style: s })}>{l}</Button>)}
                    </div>
                  )}
                  {kind === "select" && <Input className="md:col-span-4" value={r.description} maxLength={100} onChange={(e) => upd(n, { description: e.target.value })} placeholder="وصف الخيار (اختياري)" />}
                  {tooHigh(r.roleId) && <p className="text-xs text-destructive md:col-span-4">⚠️ هذي الرتبة أعلى من رتبة البوت، البوت ما يقدر يعطيها. ارفع رتبة البوت فوقها في ديسكورد.</p>}
                </div>
              ))}
              {rows.length < 25 && <Button type="button" variant="outline" onClick={() => setRows((x) => [...x, { roleId: null, label: "", emoji: "", description: "", style: "secondary" }])}><Plus className="h-4 w-4" /> إضافة رتبة</Button>}
            </div>
          </Field>

          <Field label="معاينة">
            <div className="rounded-xl bg-secondary p-4">
              <div className="border-s-4 ps-3" style={{ borderColor: color }}>
                {content && <p className="mb-2 text-sm">{content}</p>}
                <b>{title}</b>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {kind === "select" ? <div className="w-72 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{placeholder}</div>
                  : rows.filter((r) => r.roleId).map((r, n) => kind === "buttons"
                    ? <span key={n} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">{r.emoji} {r.label || roleName(r.roleId)}</span>
                    : <span key={n} className="rounded-full border border-border bg-background px-2 py-1 text-sm">{r.emoji || "❔"} 1</span>)}
              </div>
            </div>
          </Field>
          <Button variant="gold" className="justify-self-start" disabled={send.isPending} onClick={() => send.mutate()}><Send className="h-4 w-4" /> إرسال الرسالة</Button>
          {last && (
            <p className={`text-sm ${last.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
              آخر إرسال: {last.status === "pending" || last.status === "running" ? "⏳ البوت يجهزها…" : last.result ?? last.status}
              {last.status === "failed" && String(last.result ?? "").includes("رتبة البوت") && " — من إعدادات السيرفر ← الرتب، اسحب رتبة البوت فوق الرتب اللي اخترتها."}
            </p>
          )}
        </div>
      </Card>
    </>
  );
}
