import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, KeyRound, Trash2 } from "lucide-react";
import { Card, Field, PageHeader, Pick, chanItems, type GuildData } from "./kit";
import { cancelScheduled, listAccess, listScheduled, scheduleAnnouncement, searchGuildMembers, setAccess } from "@/lib/guild-tools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REPEAT_LABEL = { none: "مرة وحدة", daily: "كل يوم", weekly: "كل أسبوع" } as const;
const STATUS_LABEL: Record<string, string> = { pending: "مجدول", running: "يرسل الحين", done: "انرسل", failed: "فشل" };
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export function ScheduledAnnouncements({ data, guildId }: { data: GuildData; guildId: string }) {
  const qc = useQueryClient();
  const { data: rows } = useQuery({ queryKey: ["scheduled", guildId], queryFn: () => listScheduled({ data: { guildId } }), refetchInterval: 10_000 });
  const [f, setF] = useState({ channelId: null as string | null, title: "", message: "", color: "#e7b448", image: "", mention: "none" as "none" | "everyone" | "here", repeat: "none" as keyof typeof REPEAT_LABEL, at: localInput(new Date(Date.now() + 3600_000)) });
  const create = useMutation({
    mutationFn: () => scheduleAnnouncement({ data: { guildId, at: new Date(f.at).toISOString(), payload: { channelId: f.channelId ?? "", title: f.title, message: f.message, color: f.color, image: f.image, mention: f.mention, repeat: f.repeat } } }),
    onSuccess: () => { toast.success("تمت جدولة الإعلان"); setF({ ...f, message: "", title: "" }); qc.invalidateQueries({ queryKey: ["scheduled", guildId] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const cancel = useMutation({ mutationFn: (id: string) => cancelScheduled({ data: { guildId, id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled", guildId] }) });

  return (
    <>
      <PageHeader title="الإعلانات المجدولة" desc="اكتب إعلان واختر وقت إرساله، والبوت يرسله تلقائياً — مرة وحدة أو كل يوم أو كل أسبوع." icon={<CalendarClock />} />
      <Card title="إعلان جديد">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="الروم"><Pick value={f.channelId} onChange={(v) => setF({ ...f, channelId: v })} items={chanItems(data)} placeholder="اختر روم" /></Field>
          <Field label="وقت الإرسال"><Input type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} /></Field>
          <Field label="العنوان (اختياري)"><Input value={f.title} maxLength={256} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="رابط صورة (اختياري)"><Input dir="ltr" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="https://" /></Field>
          <Field label="التكرار">
            <Select value={f.repeat} onValueChange={(v) => setF({ ...f, repeat: v as typeof f.repeat })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(REPEAT_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="المنشن">
            <Select value={f.mention} onValueChange={(v) => setF({ ...f, mention: v as typeof f.mention })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">بدون</SelectItem><SelectItem value="everyone">@everyone</SelectItem><SelectItem value="here">@here</SelectItem></SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_120px]">
          <Field label="نص الإعلان"><Textarea rows={5} maxLength={4000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
          <Field label="اللون"><input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-10 w-full cursor-pointer rounded-md border border-border bg-transparent" /></Field>
        </div>
        <Button className="mt-4" variant="gold" disabled={create.isPending || !f.channelId || !f.message.trim()} onClick={() => create.mutate()}>جدولة الإعلان</Button>
      </Card>
      <Card title="الإعلانات">
        {!rows?.length && <p className="text-sm text-muted-foreground">ما فيه إعلانات مجدولة.</p>}
        <div className="grid gap-2">
          {rows?.map((r) => {
            const p = r.payload as { title?: string; message?: string; repeat?: keyof typeof REPEAT_LABEL; channelId?: string };
            const ch = data.textChannels.find((c) => c.id === p.channelId);
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <b className="block truncate">{p.title || p.message?.slice(0, 60)}</b>
                  <span className="text-xs text-muted-foreground">#{ch?.name ?? "?"} · {r.run_after ? new Date(r.run_after).toLocaleString() : ""} · {REPEAT_LABEL[p.repeat ?? "none"]} · {STATUS_LABEL[r.status] ?? r.status}</span>
                </div>
                {r.status === "pending" && <Button size="sm" variant="outline" onClick={() => cancel.mutate(r.id)}><Trash2 className="h-4 w-4" /> إلغاء</Button>}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

const ROLE_LABEL = { manager: "مدير — كل الإعدادات", moderator: "مشرف — الأعضاء والسجل فقط" } as const;

export function DashboardAccess({ guildId }: { guildId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<keyof typeof ROLE_LABEL>("moderator");
  const { data: rows } = useQuery({ queryKey: ["access", guildId], queryFn: () => listAccess({ data: { guildId } }) });
  const { data: found } = useQuery({ queryKey: ["access-find", guildId, q], queryFn: () => searchGuildMembers({ data: { guildId, q } }), enabled: q.trim().length >= 2 });
  const save = useMutation({
    mutationFn: (v: { userId: string; role: keyof typeof ROLE_LABEL | null }) => setAccess({ data: { guildId, ...v } }),
    onSuccess: () => { toast.success("تم تحديث الصلاحيات"); setQ(""); qc.invalidateQueries({ queryKey: ["access", guildId] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <>
      <PageHeader title="صلاحيات لوحة التحكم" desc="المالك (أي أحد عنده أدمنستريتر) يقدر يعطي أعضاء صلاحية مدير أو مشرف في لوحة تحكم هذا السيرفر." icon={<KeyRound />} />
      <Card title="إضافة عضو">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الآيدي" />
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(ROLE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="mt-3 grid gap-2">
          {found?.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2">
              <span className="flex min-w-0 items-center gap-2">{m.avatar && <img src={m.avatar} alt="" className="h-8 w-8 rounded-full" />}<span className="truncate">{m.display_name ?? m.username}</span></span>
              <Button size="sm" variant="gold" disabled={save.isPending} onClick={() => save.mutate({ userId: m.user_id, role })}>إضافة</Button>
            </div>
          ))}
        </div>
      </Card>
      <Card title="الفريق">
        {!rows?.length && <p className="text-sm text-muted-foreground">ما أعطيت أحد صلاحية بعد.</p>}
        <div className="grid gap-2">
          {rows?.map((r) => (
            <div key={r.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
              <span className="font-bold">{r.username ?? r.user_id}</span>
              <div className="flex gap-2">
                <Select value={r.role} onValueChange={(v) => save.mutate({ userId: r.user_id, role: v as keyof typeof ROLE_LABEL })}>
                  <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROLE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => save.mutate({ userId: r.user_id, role: null })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
