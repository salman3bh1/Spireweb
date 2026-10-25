import { useT as useSpireTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Send, Pencil, Save, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { listEmbeds, upsertEmbed, deleteEmbed, sendEmbed } from "@/lib/modules.functions";
import { embedDataSchema, type EmbedData } from "@/lib/modules.schema";
import { Card, Field, PageHeader, Pick, chanItems, type GuildData } from "./kit";

type Row = Awaited<ReturnType<typeof listEmbeds>>[number];
const blank = (): EmbedData => embedDataSchema.parse({ title: "عنوان الإيمبد", description: "اكتب المحتوى هنا" });
const errMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : "صار خطأ");

export function Embeds({ data, guildId }: { data: GuildData; guildId: string }) {
  const __tr = useSpireTranslation();

  const qc = useQueryClient();
  const key = ["embeds", guildId];
  const { data: rows = [], isLoading } = useQuery({ queryKey: key, queryFn: () => listEmbeds({ data: { guildId } }) });
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [e, setE] = useState<EmbedData>(blank());
  const [channel, setChannel] = useState<string | null>(null);
  const [editMsgId, setEditMsgId] = useState("");
  const [busy, setBusy] = useState(false);
  const current: Row | undefined = rows.find((r) => r.id === sel);

  useEffect(() => {
    if (current) { setName(current.name); setE(current.data); setChannel(current.last_channel_id); setEditMsgId(current.last_message_id ?? ""); }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const up = <K extends keyof EmbedData>(k: K, v: EmbedData[K]) => setE((p) => ({ ...p, [k]: v }));
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  // The editor is always open; "new" just clears it to a fresh unsaved draft.
  const create = () => { setSel(null); setName(""); setE(blank()); setEditMsgId(""); };
  const save = async () => {
    setBusy(true);
    try { const r = await upsertEmbed({ data: { guildId, id: sel, name: name || "embed", data: e } }); await refresh(); setSel(r.id); toast.success(__tr("تم حفظ الإيمبد")); }
    catch (x) { toast.error(errMsg(x)); }
    setBusy(false);
  };
  const remove = async () => {
    if (!sel || !confirm("حذف الإيمبد؟")) return;
    await deleteEmbed({ data: { guildId, id: sel } }); setSel(null); refresh();
  };
  const send = async (edit: boolean) => {
    if (!channel) return toast.error(__tr("اختر الروم أولاً"));
    const mid = editMsgId.trim();
    if (edit && !/^\d{15,21}$/.test(mid)) return toast.error(__tr("اكتب آيدي الرسالة اللي أرسلها البوت"));
    setBusy(true);
    try {
      if (sel) await upsertEmbed({ data: { guildId, id: sel, name: name || "embed", data: e } });
      const r = await sendEmbed({ data: { guildId, embedId: sel, channelId: channel, messageId: edit ? mid : null, data: e } });
      setEditMsgId(r.messageId); refresh();
      toast.success(edit ? __tr("تم تعديل الرسالة") : __tr("تم إرسال الرسالة عن طريق البوت"));
    } catch (x) { toast.error(errMsg(x)); }
    setBusy(false);
    return undefined;
  };

  return (
    <>
      <PageHeader title={__tr("رسائل الإيمبد")} actions={
        <div className="flex gap-2">
          <div className="w-48"><Pick value={sel} onChange={setSel} items={rows.map((r) => ({ id: r.id, name: r.name }))} placeholder={__tr("اختر ايمبد")} /></div>
          <Button variant="gold" onClick={create} disabled={busy}><Plus className="h-4 w-4" /> {__tr("جديد")}</Button>
        </div>
      } />
      {isLoading && <p className="text-muted-foreground">{__tr("جاري التحميل…")}</p>}
      {!isLoading && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-4">
            {sel && <div><Button variant="outline" className="border-destructive text-destructive" onClick={remove}><Trash2 className="h-4 w-4" /> {__tr("حذف الإيمبد")}</Button></div>}
            <Card>
              <Field label={__tr("اسم الإيمبد")}><Input value={name} onChange={(x) => setName(x.target.value)} /></Field>
              <Field label={__tr("نص فوق الإيمبد (اختياري)")}><Textarea rows={2} value={e.content} onChange={(x) => up("content", x.target.value)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={__tr("اسم الكاتب")}><Input value={e.authorName} onChange={(x) => up("authorName", x.target.value)} /></Field>
                <Field label={__tr("صورة الكاتب (رابط)")}><Input dir="ltr" value={e.authorIcon} onChange={(x) => up("authorIcon", x.target.value)} /></Field>
                <Field label={__tr("العنوان")}><Input value={__tr(e.title)} onChange={(x) => up("title", x.target.value)} /></Field>
                <Field label={__tr("رابط العنوان")}><Input dir="ltr" value={e.url} onChange={(x) => up("url", x.target.value)} /></Field>
              </div>
              <Field label={__tr("محتوى الرسالة")}><Textarea rows={6} value={__tr(e.description)} onChange={(x) => up("description", x.target.value)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={__tr("صورة (رابط https)")}><Input dir="ltr" placeholder="https://..." value={e.image} onChange={(x) => up("image", x.target.value)} /></Field>
                <Field label={__tr("صورة مصغرة (رابط)")}><Input dir="ltr" value={e.thumbnail} onChange={(x) => up("thumbnail", x.target.value)} /></Field>
                <Field label={__tr("الفوتر")}><Input value={e.footer} onChange={(x) => up("footer", x.target.value)} /></Field>
                <Field label={__tr("صورة الفوتر (رابط)")}><Input dir="ltr" value={e.footerIcon} onChange={(x) => up("footerIcon", x.target.value)} /></Field>
                <Field label={__tr("اللون")}><input type="color" value={e.color} onChange={(x) => up("color", x.target.value)} className="h-10 w-full cursor-pointer rounded-xl border border-border bg-transparent" /></Field>
                <label className="flex items-center justify-between rounded-xl bg-secondary/50 px-4"><span className="text-sm">{__tr("إظهار الوقت")}</span><Switch checked={e.timestamp} onCheckedChange={(v) => up("timestamp", v)} /></label>
              </div>
            </Card>
            <Card title={__tr("الحقول")} right={e.fields.length < 25 && (
              <Button variant="secondary" size="sm" onClick={() => up("fields", [...e.fields, { name: __tr("عنوان"), value: __tr("قيمة"), inline: false }])}><Plus className="h-4 w-4" /> {__tr("أضف حقل")}</Button>
            )}>
              {e.fields.map((f, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[1fr_2fr_auto_auto]">
                  <Input value={f.name} onChange={(x) => up("fields", e.fields.map((y, k) => (k === i ? { ...y, name: x.target.value } : y)))} />
                  <Input value={f.value} onChange={(x) => up("fields", e.fields.map((y, k) => (k === i ? { ...y, value: x.target.value } : y)))} />
                  <label className="flex items-center gap-2 text-xs">{__tr("بجانب بعض")}<Switch checked={f.inline} onCheckedChange={(v) => up("fields", e.fields.map((y, k) => (k === i ? { ...y, inline: v } : y)))} /></label>
                  <Button variant="ghost" size="icon" aria-label={__tr("حذف")} onClick={() => up("fields", e.fields.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </Card>
            <Card title={__tr("الإرسال")}>
              <Field label={__tr("الروم")}><Pick value={channel} onChange={setChannel} items={chanItems(data)} /></Field>
              <Field label={__tr("آيدي الرسالة (للتعديل على رسالة مُرسلة)")}><Input dir="ltr" value={editMsgId} onChange={(x) => setEditMsgId(x.target.value)} /></Field>
              <div className="flex flex-wrap gap-2">
                <Button variant="gold" onClick={save} disabled={busy}><Save className="h-4 w-4" /> {__tr("حفظ التغييرات")}</Button>
                <Button variant="secondary" onClick={() => send(false)} disabled={busy}><Send className="h-4 w-4" /> {__tr("إرسال رسالة جديدة")}</Button>
                <Button variant="secondary" onClick={() => send(true)} disabled={busy}><Pencil className="h-4 w-4" /> {__tr("تعديل رسالة مُرسلة")}</Button>
              </div>
            </Card>
          </div>
          <Preview e={e} />
        </div>
      )}
    </>
  );
}

function Preview({ e }: { e: EmbedData }) {
  const __tr = useSpireTranslation();

  return (
    <div className="sticky top-24 h-fit rounded-2xl border border-border bg-card p-4" dir="auto">
      <p className="mb-3 text-xs text-muted-foreground">{__tr("معاينة")}</p>
      {e.content && <p className="mb-2 whitespace-pre-wrap text-sm">{e.content}</p>}
      <div className="rounded-md bg-secondary p-4" style={{ borderInlineStart: `4px solid ${e.color}` }}>
        {e.authorName && <div className="mb-2 flex items-center gap-2 text-sm font-semibold">{e.authorIcon && <img src={e.authorIcon} alt="" className="h-6 w-6 rounded-full" />}{e.authorName}</div>}
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            {e.title && <div className="font-bold text-primary">{__tr(e.title)}</div>}
            {e.description && <p className="mt-1 whitespace-pre-wrap text-sm">{__tr(e.description)}</p>}
            {!!e.fields.length && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {e.fields.map((f, i) => (
                  <div key={i} className={f.inline ? "col-span-1" : "col-span-3"}>
                    <div className="text-xs font-bold">{f.name}</div><div className="text-sm">{f.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {e.thumbnail && <img src={e.thumbnail} alt="" className="h-16 w-16 rounded object-cover" />}
        </div>
        {e.image && <img src={e.image} alt="" className="mt-3 w-full rounded" />}
        {(e.footer || e.timestamp) && <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">{e.footerIcon && <img src={e.footerIcon} alt="" className="h-5 w-5 rounded-full" />}{e.footer}{e.timestamp && __tr(" • اليوم")}</div>}
      </div>
    </div>
  );
}
