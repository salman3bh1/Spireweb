import { PageHeader } from "./kit";
import { useT as useSpireTranslation } from "@/lib/i18n";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Search, Plus, Trash2, FileText, IdCard, MessageSquare, Mic, Coins, UserPlus, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import {
  getMembersOverview, getMemberProfile, addMemberNote, deleteMemberNote, getTicketTranscript,
  moderateMember, getModerationJob, getInvitedBy, type ModAction,
  MEMBER_FILTERS, PAGE_SIZE, type MemberFilter,
} from "@/lib/members.functions";
import { Card } from "./kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const rtf = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat("ar", { numeric: "always" }) : null;
export function ago(iso: string | null | undefined) {
  if (!iso || !rtf) return "—";
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, s] of units) if (Math.abs(sec) >= s) return rtf.format(Math.round(sec / s), u);
  return "الآن";
}
const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" }) : "—");
const KIND: Record<string, string> = { warn: "تحذير", mute: "إسكات", kick: "طرد", ban: "باند", unmute: "فك الإسكات", unban: "فك الحظر" };
const FILTER_LABEL: Record<MemberFilter, string> = { all: "الكل", muted: "المكتومين", warned: "محذرين", new: "أعضاء جديدين", posters: "بوسترز", banned: "المحظورين" };
const hours = (s: number) => (s / 3600).toFixed(s >= 36000 ? 0 : 1);
const dur = (s: number | null) => (!s ? "" : s >= 86400 ? `${Math.round(s / 86400)} يوم` : s >= 3600 ? `${Math.round(s / 3600)} ساعة` : `${Math.round(s / 60)} دقيقة`);

function Avatar({ src, name }: { src: string | null; name: string }) {
  return src ? <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">{name.slice(0, 1)}</span>;
}
function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  const __tr = useSpireTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="text-sm text-muted-foreground">{__tr(label)}</div>
      <div className="mt-2 font-mono text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Members({ guildId }: { guildId: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (open) return <MemberProfile guildId={guildId} userId={open} onBack={() => setOpen(null)} />;
  return <MembersList guildId={guildId} onOpen={setOpen} />;
}

function RankList({ title, icon: Icon, rows, unit, onOpen }: { title: string; icon: typeof Mic; rows?: { id: string; name: string; avatar: string | null; value: number }[] | undefined; unit: string; onOpen: (id: string) => void }) {
  const __tr = useSpireTranslation();

  return (
    <Card title={<span className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{__tr(title)}</span>}>
      {!rows?.length ? <p className="text-sm text-muted-foreground">—</p> : (
        <ol className="grid gap-1">
          {rows.map((u, i) => (
            <li key={u.id}><button type="button" onClick={() => onOpen(u.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-start transition hover:bg-secondary">
              <span className={`w-6 text-center font-mono ${i < 3 ? "font-bold text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
              <Avatar src={u.avatar} name={u.name} />
              <span className="min-w-0 flex-1 truncate font-semibold">{u.name}</span>
              <span className="shrink-0 font-mono text-sm font-bold">{u.value.toLocaleString("en")} <span className="text-xs font-normal text-muted-foreground">{unit}</span></span>
            </button></li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/** Invite count; clicking it lists the people this member brought into the server. */
function InvitesBadge({ guildId, userId, name, count }: { guildId: string; userId: string; name: string; count: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["invited", guildId, userId], queryFn: () => getInvitedBy({ data: { guildId, userId } }), enabled: open });
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title={t("اضغط على العدد حتى تشوف الأشخاص")}
        className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1 text-xs transition hover:border-primary hover:text-primary">
        <UserPlus className="h-3.5 w-3.5" /> <span className="font-mono font-bold">{count}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("الناس اللي دخلهم")} {name}</DialogTitle></DialogHeader>
          {isLoading && <p className="text-sm text-muted-foreground">{t("جاري التحميل…")}</p>}
          {data && !data.length && <p className="text-sm text-muted-foreground">{t("ما دعى أحد بعد.")}</p>}
          <ul className="grid max-h-[60vh] gap-1 overflow-y-auto">
            {data?.map((x) => (
              <li key={x.id} className="flex items-center gap-3 rounded-xl border border-border p-2 text-sm">
                <Avatar src={x.avatar} name={x.name ?? x.id} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{x.name ?? "—"}</span>{x.username && <span className="text-xs text-muted-foreground">@{x.username}</span>}</span>
                {x.left ? <span className="rounded-full bg-destructive/15 px-2 py-1 text-xs text-destructive">{t("طلع")}</span> : <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">{t("موجود")}</span>}
                {x.fake && <span className="rounded-full bg-secondary px-2 py-1 text-xs">{t("وهمي")}</span>}
                <span className="shrink-0 text-xs text-muted-foreground">{ago(x.joined_at)}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MembersList({ guildId, onOpen }: { guildId: string; onOpen: (id: string) => void }) {
  const __tr = useSpireTranslation();

  const tr = useT();
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["members", guildId, filter, q, page],
    queryFn: () => getMembersOverview({ data: { guildId, filter, q, page } }),
    placeholderData: (p) => p, refetchInterval: 30000,
  });
  const t = data?.totals;
  const filterCount: Record<MemberFilter, number | undefined> = { all: t?.members, muted: t?.mutedNow, warned: t?.warned, new: t?.newMembers, posters: t?.posters, banned: t?.banned };
  return (
    <>
      <PageHeader title="الأعضاء" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label={__tr("الأعضاء المكتومين حاليًا")} value={t?.mutedNow ?? "—"} sub={<>{__tr("من أصل")} <b>{t?.members ?? 0}</b> {__tr("عضو")}</>} />
        <Stat label={__tr("عدد الإسكاتات")} value={data?.counts["mute"] ?? "—"} sub={<>{__tr("آخر 30 يوم")} <b>{data?.recent["mute"] ?? 0}</b></>} />
        <Stat label={__tr("التحذيرات")} value={data?.counts["warn"] ?? "—"} sub={<>{__tr("آخر 30 يوم")} <b>{data?.recent["warn"] ?? 0}</b></>} />
        <Stat label={__tr("الطرد")} value={data?.counts["kick"] ?? "—"} sub={<>{__tr("آخر 30 يوم")} <b>{data?.recent["kick"] ?? 0}</b></>} />
        <Stat label={__tr("الباند")} value={data?.counts["ban"] ?? "—"} sub={<>{__tr("آخر 30 يوم")} <b>{data?.recent["ban"] ?? 0}</b></>} />
      </div>

      <div className="mt-6"><Card title={<>{tr("كل الأعضاء")} <span className="ms-2 text-sm text-muted-foreground">{data?.total ?? 0}</span></>}>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={__tr("اسم العضو أو الآيدي")} className="ps-9" />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-border p-1">
            {MEMBER_FILTERS.map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "gold" : "ghost"} onClick={() => { setFilter(f); setPage(0); }}>
                {__tr(FILTER_LABEL[f])} <span className="font-mono text-xs opacity-70">{filterCount[f] ?? 0}</span>
              </Button>
            ))}
          </div>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">{__tr("جاري التحميل…")}</p>}
        {data && !data.members.length && <p className="text-sm text-muted-foreground">{__tr("ما فيه أعضاء هنا. إذا البوت توه مضاف، انتظر شوي لين يرسل قائمة الأعضاء.")}</p>}
        <ul className="grid gap-1">
          {data?.members.map((m) => {
            const name = m.display_name ?? m.username ?? m.user_id;
            const muted = m.muted_until && new Date(m.muted_until) > new Date();
            return (
              <li key={m.user_id} className="flex items-center gap-2"><button type="button" onClick={() => onOpen(m.user_id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-start transition hover:bg-secondary">
                <Avatar src={m.avatar} name={name} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{name}</span><span className="text-xs text-muted-foreground">@{m.username}</span></span>
                <span className="hidden flex-wrap gap-1 text-xs sm:flex">
                  {muted && <span className="rounded-full bg-destructive/15 px-2 py-1 text-destructive">{__tr("مكتوم")}</span>}
                  {m.warns > 0 && <span className="rounded-full bg-secondary px-2 py-1">{__tr("تحذيرات")} {m.warns}</span>}
                  {m.posts > 0 && <span className="rounded-full bg-secondary px-2 py-1">{__tr("بوستات")} {m.posts}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground" title={__tr("عمر الحساب")}>{ago(m.created_at_discord)}</span>
              </button>
                <Button asChild size="icon" variant="ghost" title={__tr("البروفايل العام")} aria-label={__tr("البروفايل العام")}><Link to="/u/$userId" params={{ userId: m.user_id }}><UserRound /></Link></Button>
                <InvitesBadge guildId={guildId} userId={m.user_id} name={name} count={Math.max(0, m.invites_total - m.invites_left - m.invites_fake)} />
              </li>
            );
          })}
        </ul>
        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{__tr("السابق")}</Button>
            <span className="text-sm text-muted-foreground">{page + 1} / {Math.ceil(data.total / PAGE_SIZE)}</span>
            <Button size="sm" variant="outline" disabled={(page + 1) * PAGE_SIZE >= data.total} onClick={() => setPage(page + 1)}>{__tr("التالي")}</Button>
          </div>
        )}
      </Card></div>
      <div className="mt-6"><Card title={tr("أكثر الناس عقوبات")}>
        {!data?.top.length ? <p className="text-sm text-muted-foreground">{__tr("ما انعاقب أحد بعد.")}</p> : (
          <ol className="grid gap-2">
            {data.top.map((u, i) => (
              <li key={u.id}><button type="button" onClick={() => onOpen(u.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-start transition hover:bg-secondary">
                <span className="w-6 text-center font-mono text-muted-foreground">{i + 1}</span>
                <Avatar src={u.avatar} name={u.name} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{u.name}</span>{u.username && <span className="text-xs text-muted-foreground">@{u.username}</span>}</span>
                <span className="flex flex-wrap gap-1 text-xs">
                  {(["warn", "mute", "kick", "ban"] as const).map((k) => u[k] > 0 && <span key={k} className="rounded-full bg-secondary px-2 py-1">{__tr(KIND[k])} {u[k]}</span>)}
                </span>
                <span className="font-mono text-lg font-bold">{u.total}</span>
              </button></li>
            ))}
          </ol>
        )}
      </Card></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <RankList title={tr("أكثر الناس تفاعلًا بالكتابة")} icon={MessageSquare} rows={data?.topChat} unit={tr("رسالة")} onOpen={onOpen} />
        <RankList title={tr("أكثر الناس تفاعلًا بالصوت")} icon={Mic} rows={data?.topVoice?.map((r) => ({ ...r, value: Number(hours(r.value)) }))} unit={tr("ساعة")} onOpen={onOpen} />
        <RankList title={tr("أكثر الناس كريدت")} icon={Coins} rows={data?.topCredits} unit="$" onOpen={onOpen} />
      </div>
    </>
  );
}

function MemberProfile({ guildId, userId, onBack }: { guildId: string; userId: string; onBack: () => void }) {
  const __tr = useSpireTranslation();

  const qc = useQueryClient();
  const key = ["member", guildId, userId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => getMemberProfile({ data: { guildId, userId } }), refetchInterval: 15000, refetchOnWindowFocus: true });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<{ title: string; html: string } | null>(null);
  const m = data?.member;
  const warns = data?.punishments.filter((p) => p.kind === "warn") ?? [];
  const others = data?.punishments.filter((p) => p.kind !== "warn") ?? [];
  const name = m?.display_name ?? m?.username ?? userId;

  const save = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try { await addMemberNote({ data: { guildId, userId, body: note } }); setNote(""); await qc.invalidateQueries({ queryKey: key }); }
    catch { toast.error(__tr("ما قدرنا نحفظ الملاحظة")); } finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    try { await deleteMemberNote({ data: { guildId, id } }); await qc.invalidateQueries({ queryKey: key }); } catch { toast.error(__tr("ما قدرنا نحذفها")); }
  };
  const openTicket = async (id: string, title: string) => {
    try { const r = await getTicketTranscript({ data: { guildId, id } }); setViewer({ title, html: r.html }); } catch { toast.error(__tr("ما قدرنا نفتح التذكرة")); }
  };
  const download = () => {
    if (!viewer) return;
    const url = URL.createObjectURL(new Blob([viewer.html], { type: "text/html" }));
    const a = document.createElement("a"); a.href = url; a.download = `${viewer.title}.html`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onBack}><ArrowRight aria-hidden="true" /> {__tr("كل الأعضاء")}</Button>
      <Button asChild variant="gold"><Link to="/u/$userId" params={{ userId }}><UserRound aria-hidden="true" /> {__tr("البروفايل العام")}</Link></Button></div>
      {isLoading && <p className="mt-6 text-muted-foreground">{__tr("جاري التحميل…")}</p>}
      {data && !m && <p className="mt-6 text-muted-foreground">{__tr("ما عندنا بيانات لهذا العضو بعد.")}</p>}
      {m && (
        <>
          <header className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-6">
            {m.avatar ? <img src={m.avatar} alt="" className="h-20 w-20 rounded-full object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold">{name.slice(0, 1)}</span>}
            <div className="grid gap-1">
              <h1 className="font-display text-3xl">{name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>@{m.username}</span><code className="rounded bg-secondary px-2 py-0.5 text-xs">{m.user_id}</code>
                <span className={`rounded-full px-2 py-0.5 text-xs ${m.in_guild ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>{m.banned ? __tr("محظور") : m.in_guild ? __tr("بالسيرفر") : __tr("طالع من السيرفر")}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{__tr("دخل السيرفر")}<b className="text-foreground">{fmtDate(m.joined_at)}</b></span>
                <span>{__tr("انسوى الحساب")}<b className="text-foreground">{fmtDate(m.created_at_discord)}</b> ({ago(m.created_at_discord)})</span>
              </div>
            </div>
            <ModActions guildId={guildId} userId={userId} name={name} banned={m.banned} muted={!!m.muted_until && new Date(m.muted_until).getTime() > Date.now()} onDone={() => qc.invalidateQueries({ queryKey: key })} />
          </header>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <Stat label={__tr("اللفل")} value={m.level} sub={data.levelRank ? `#${data.levelRank}` : undefined} />
            <Stat label={__tr("الرسائل")} value={m.messages} />
            <Stat label={__tr("ساعات الصوت")} value={hours(Number(m.voice_seconds))} />
            <Stat label={__tr("التحذيرات")} value={warns.length} />
            <Stat label={__tr("العقوبات")} value={others.length} />
            <Stat label={__tr("التذاكر")} value={data.tickets.length + data.openTickets.length} sub={data.openTickets.length ? `${data.openTickets.length} مفتوحة` : undefined} />
            <Stat label={__tr("الدعوات")} value={Math.max(0, m.invites_total - m.invites_left - m.invites_fake)} sub={__tr("الحقيقية")} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="grid content-start gap-6">
              <Card title={__tr("ملاحظات الإدارة")} desc={__tr("يشوفها بس اللي يدخل لوحة التحكم")}>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder={__tr("اكتب ملاحظة عن العضو…")} />
                <div><Button variant="gold" disabled={saving || !note.trim()} onClick={save}><Plus /> {__tr("أضف ملاحظة")}</Button></div>
                {!data.notes.length ? <p className="text-sm text-muted-foreground">{__tr("ماكو ملاحظات بعد.")}</p> : data.notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{n.author_name} · {ago(n.created_at)}</span>
                      <Button size="icon" variant="ghost" aria-label={__tr("حذف")} onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  </div>
                ))}
              </Card>
              <Card title={__tr("التحذيرات")}>
                {!warns.length ? <p className="text-sm text-muted-foreground">{__tr("ما عنده أي تحذير.")}</p> : warns.map((w, i) => (
                  <div key={w.id} className="rounded-xl border border-border p-3 text-sm"><b>{i + 1}.</b> {w.reason || __tr("بدون سبب")}
                    <div className="mt-1 text-xs text-muted-foreground">{w.moderator_name ?? (w.moderator_id ? `<@${w.moderator_id}>` : "")} · {ago(w.created_at)}</div></div>
                ))}
              </Card>
              <Card title={__tr("سجل العقوبات")}>
                {!others.length ? <p className="text-sm text-muted-foreground">{__tr("ما انعاقب ولا مرة.")}</p> : others.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border p-3 text-sm">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{__tr(KIND[p.kind])}</span> {dur(p.duration_seconds)} — {p.reason || __tr("بدون سبب")}
                    <div className="mt-1 text-xs text-muted-foreground">{p.moderator_name ?? ""} · {fmtDate(p.created_at)}</div>
                  </div>
                ))}
              </Card>
            </div>
            <div className="grid content-start gap-6">
              <Card title={__tr("التذاكر")}>
                {data.openTickets.map((t) => (
                  <a key={t.id} href={`https://discord.com/channels/${guildId}/${t.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border p-3 text-start text-sm transition hover:bg-secondary">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="flex-1"><b>{t.name}</b></span>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{__tr("مفتوحة")}</span>
                  </a>
                ))}
                {!data.tickets.length && !data.openTickets.length ? <p className="text-sm text-muted-foreground">{__tr("ما فتح أي تذكرة.")}</p> : data.tickets.map((t) => (
                  <button key={t.id} type="button" onClick={() => openTicket(t.id, t.channel_name ?? "ticket")} className="flex items-center gap-3 rounded-xl border border-border p-3 text-start text-sm transition hover:bg-secondary">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="flex-1"><b>{t.channel_name ?? __tr("تذكرة")}</b>{t.ticket_type && <span className="ms-2 text-muted-foreground">{t.ticket_type}</span>}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(t.closed_at)}</span>
                  </button>
                ))}
              </Card>
              <Card title={__tr("الدعوات")}>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1">{__tr("الحقيقية")}{Math.max(0, m.invites_total - m.invites_left - m.invites_fake)}</span>
                  <span className="rounded-full bg-secondary px-3 py-1">{__tr("الكل")}{m.invites_total}</span>
                  <span className="rounded-full bg-secondary px-3 py-1">{__tr("طلعوا")}{m.invites_left}</span>
                  <span className="rounded-full bg-secondary px-3 py-1">{__tr("وهمية")}{m.invites_fake}</span>
                </div>
                {!m.invites_total && !data.invitedMembers.length && <p className="text-sm text-muted-foreground">{__tr("ما دعى أحد بعد.")}</p>}
                {!!data.invitedMembers.length && (
                  <ul className="grid gap-1">
                    {data.invitedMembers.map((x) => (
                      <li key={x.id} className="flex items-center gap-3 rounded-xl border border-border p-2 text-sm">
                        <Avatar src={x.avatar} name={x.name ?? x.id} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{x.name ?? __tr("عضو")}</span>
                          <code className="text-xs text-muted-foreground">{x.id}</code>
                        </span>
                        <span className="flex shrink-0 flex-wrap gap-1 text-xs">
                          {x.left ? <span className="rounded-full bg-destructive/15 px-2 py-1 text-destructive">{__tr("طلع")}</span>
                            : <span className="rounded-full bg-primary/15 px-2 py-1 text-primary">{__tr("موجود")}</span>}
                          {x.fake && <span className="rounded-full bg-secondary px-2 py-1">{__tr("وهمي")}</span>}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{ago(x.joined_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle className="flex items-center justify-between gap-3">{__tr(viewer?.title)}<Button size="sm" variant="outline" onClick={download}>{__tr("تحميل HTML")}</Button></DialogTitle></DialogHeader>
          {viewer && <iframe title={__tr("نسخة التذكرة")} sandbox="" srcDoc={viewer.html} className="h-[70vh] w-full rounded-xl border border-border bg-card" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

const MOD_LABEL: Record<ModAction, string> = { warn: "تحذير", mute: "إسكات", kick: "طرد", ban: "باند", unmute: "فك الإسكات", unban: "فك الحظر" };
const MUTE_PRESETS = [{ l: "10 دقايق", v: 10 }, { l: "ساعة", v: 60 }, { l: "6 ساعات", v: 360 }, { l: "يوم", v: 1440 }, { l: "أسبوع", v: 10080 }];

function ModActions({ guildId, userId, name, onDone, muted = false, banned = false }: { guildId: string; userId: string; name: string; muted?: boolean; banned?: boolean; onDone: () => void }) {
  const __tr = useSpireTranslation();

  const [action, setAction] = useState<ModAction | null>(null);
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!action) return;
    setBusy(true);
    try {
      const { id } = await moderateMember({ data: { guildId, userId, action, reason, minutes: action === "mute" ? minutes : undefined } });
      const t = toast.loading(__tr("تم إرسال الطلب للبوت…"));
      setAction(null); setReason("");
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const j = await getModerationJob({ data: { guildId, id } });
        if (j.status === "done") { toast.success(j.result ?? __tr("تم"), { id: t }); onDone(); return; }
        if (j.status === "failed") { toast.error(j.result ?? __tr("ما قدر البوت ينفذ"), { id: t }); return; }
      }
      toast.warning(__tr("البوت ما رد للحين — تأكد إنه شغال"), { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : __tr("صار خطأ"));
    } finally { setBusy(false); }
  };

  return (
    <div className="ms-auto flex flex-wrap gap-2 self-start">
      {(banned ? ["unban"] : ["warn", muted ? "unmute" : "mute", "kick", "ban"]).map((value) => { const a = value as ModAction; return (
        <Button key={a} size="sm" variant={a === "ban" ? "destructive" : "outline"} className="rounded-full" onClick={() => setAction(a)}>{__tr(MOD_LABEL[a])}</Button>
      ); })}
      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action && MOD_LABEL[action]} — {name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {action === "mute" && (
              <div className="flex flex-wrap gap-2">
                {MUTE_PRESETS.map((p) => (
                  <Button key={p.v} size="sm" variant={minutes === p.v ? "gold" : "outline"} onClick={() => setMinutes(p.v)}>{p.l}</Button>
                ))}
              </div>
            )}
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder={__tr("السبب (اختياري)")} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAction(null)}>{__tr("إلغاء")}</Button>
              <Button variant={action === "ban" || action === "kick" ? "destructive" : "gold"} disabled={busy} onClick={submit}>{__tr("تأكيد")}{action && MOD_LABEL[action]}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
