import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CalendarDays, Clock, Flame, FolderOpen, Grid3x3, Hash, Headphones, HeartPulse, LayoutGrid, MessageSquare, Mic, TrendingUp, UserPlus, Users, Video, MicOff, Radio, LineChart as LineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import type { GuildData } from "./kit";
import type { ServerStats, GuildLive } from "@/lib/telemetry.schema";
import { Link } from "@tanstack/react-router";
import { Link2, ExternalLink, Boxes, Gavel, LogIn, LogOut, Rocket, Ticket, Wifi } from "lucide-react";

type Day = ServerStats["days"][number];
type Range = "24h" | "7d" | "30d";
type Tab = "overview" | "invites" | "messages" | "voice" | "members" | "xp";
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OFFSET = 3 * 3600_000; // the bot buckets days in Bahrain time (UTC+3)
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" } };
const axis = { tick: { fill: "var(--muted-foreground)", fontSize: 11 }, stroke: "var(--border)" };

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
const add = (into: Record<string, number>, o: Record<string, number>) => { for (const [k, v] of Object.entries(o)) into[k] = (into[k] ?? 0) + v; return into; };
const AR: Record<string, string> = {"Sun": "الأحد", "Invites": "الدعوات", "Top Inviters": "أكثر الأعضاء دعوة", "Active Invite Links": "روابط الدعوة النشطة", "Code": "الكود", "Creator": "المنشئ", "Channel": "القناة", "Uses": "الاستخدامات", "Limit": "الحد", "Expires": "الانتهاء", "Joined via": "دخلوا عن طريق", "invites": "دعوة", "left": "طلع", "Nobody joined via this link yet": "ما أحد دخل عن طريق هذا الرابط لسا", "Mon": "الإثنين", "Tue": "الثلاثاء", "Wed": "الأربعاء", "Thu": "الخميس", "Fri": "الجمعة", "Sat": "السبت", "No data available for this period": "لا توجد بيانات لهذه الفترة", "No category": "بدون قسم", "Streaming": "بث", "Camera": "كاميرا", "Muted": "كتم", "Talking": "تحدث", "Server Statistics": "إحصائيات الخادم", "Messages": "الرسائل", "Voice": "الصوت", "Members": "الأعضاء", "XP": "XP", "Settings": "الإعدادات", "Category + Channels": "القسم + الرومات", "Categories": "الأقسام", "SERVER STATISTICS": "إحصائيات السيرفر", "Track your server's activity and engagement": "تابع نشاط وتفاعل سيرفرك", "Include bots": "تضمين البوتات", "Show current period": "إظهار الفترة الحالية", "All categories": "كل الأقسام", "All channel types": "كل أنواع الرومات", "Text": "كتابي", "Announcement": "إعلانات", "Forum": "منتدى", "Search user by ID or name": "ابحث عن عضو بالآيدي أو الاسم", "Waiting for the bot to send statistics — run the latest bot version and give it a couple of minutes.": "بانتظار البوت يرسل الإحصائيات — شغّل آخر نسخة من البوت وانتظر دقيقتين.", "Total Messages": "إجمالي الرسائل", "Total Time in Voice": "إجمالي الوقت في الصوت", "Active Members": "الأعضاء المتفاعلين", "Server Health": "صحة السيرفر", "Very active": "نشط جدًا", "Active": "نشط", "Needs attention": "يحتاج اهتمام", "Activity over time": "النشاط عبر الوقت", "Voice (hours)": "الصوت (ساعات)", "Activity Heatmap": "خريطة النشاط الحرارية", "Average Hourly Activity": "متوسط النشاط بالساعة", "Messages / day": "رسائل / يوم", "Activity by Day of Week": "النشاط حسب أيام الأسبوع", "Top 10 Most Active Days": "أكثر 10 أيام نشاطًا", "Top Chatters": "أكثر الكتّاب", "Top Voice Users": "أكثر المتواجدين بالصوت", "Message activity": "نشاط الرسائل", "Message Leaderboard": "متصدرين الرسائل", "Messages by Channel": "الرسائل حسب الروم", "Voice activity": "نشاط الصوت", "Voice Leaderboard": "متصدرين الصوت", "Voice by Channel": "الصوت حسب الروم", "Voice Activity Breakdown": "تفصيل نشاط الصوت", "Top Streamers": "أكثر من يبث", "Top Camera Users": "أكثر من يفتح الكاميرا", "Most Muted": "أكثر من يكتم", "Current Members": "الأعضاء الحاليين", "Change": "التغيير", "Data Points": "عدد الأيام", "Member Trend": "اتجاه الأعضاء", "Joins & Leaves": "الدخول والخروج", "Joins": "دخول", "Leaves": "خروج", "Cumulative Net Growth": "صافي النمو التراكمي", "XP Leaderboard": "متصدرين XP", "How statistics work": "كيف تعمل الإحصائيات", "The bot keeps 31 days of messages, voice minutes, joins and leaves for this server only.": "البوت يحفظ 31 يوم من الرسائل ودقائق الصوت والدخول والخروج لهذا السيرفر فقط.", "Days follow Bahrain time (UTC+3). Voice time counts every minute a member is in a voice channel (AFK channel excluded).": "الأيام بتوقيت البحرين (UTC+3). وقت الصوت يحسب كل دقيقة يكون فيها العضو بروم صوتي (ما عدا روم AFK).", "Data refreshes every few minutes after activity happens in the server.": "البيانات تتحدث كل كم دقيقة بعد حدوث نشاط بالسيرفر.", "Total Members": "إجمالي الأعضاء", "Online Now": "الأعضاء المتصلين حاليًا", "Boosts": "البوستات", "Open Tickets": "التذاكر المفتوحة", "In Voice": "عدد الأعضاء بالفويس", "Most Active Channels": "أكثر الرومات تفاعلًا", "Latest Punishments": "آخر العقوبات", "Joins & Leaves Log": "الداخلين والطالعين", "Joined": "دخل", "Left": "طلع", "Live": "مباشر", "updated": "آخر تحديث", "sec ago": "ثانية", "No punishments yet": "ما فيه عقوبات", "Nobody joined or left yet": "ما دخل ولا طلع أحد للحين", "warn": "تحذير", "mute": "إسكات", "kick": "طرد", "ban": "باند", "by": "بواسطة", "msgs": "رسالة"};
function useL() { const { lang } = useI18n(); return (s: string) => (lang === "ar" ? AR[s] ?? s : s); }
const fmtH = (min: number) => `${(min / 60).toFixed(1)}h`;

function Panel({ icon, title, right, children, tone = "primary" }: { icon: ReactNode; title: string; right?: ReactNode; children: ReactNode; tone?: "primary" | "voice" | "warm" | "violet" }) {
  return (
    <section className="ss-panel">
      <header className="ss-panel-head">
        <span className="ss-icon" data-tone={tone}>{icon}</span>
        <h3>{title}</h3>
        <div className="ms-auto">{right}</div>
      </header>
      <div className="ss-panel-body">{children}</div>
    </section>
  );
}
function Empty({ icon, h = "h-56" }: { icon?: ReactNode; h?: string }) {
  const L = useL();
  return (
  <div className={`flex ${h} flex-col items-center justify-center gap-3 text-sm text-muted-foreground`}>{icon && <span className="opacity-40 [&_svg]:h-10 [&_svg]:w-10">{icon}</span>}{L("No data available for this period")}</div>
  );
}
function ChartToggle({ v, set }: { v: "line" | "bar"; set: (v: "line" | "bar") => void }) {
  return <div className="ss-seg"><Button variant="statistics" aria-label="Line chart" title="Line chart" aria-selected={v === "line"} onClick={() => set("line")}><LineIcon className="h-3.5 w-3.5" /></Button><Button variant="statistics" aria-label="Bar chart" title="Bar chart" aria-selected={v === "bar"} onClick={() => set("bar")}><BarChart3 className="h-3.5 w-3.5" /></Button></div>;
}
function Series({ data, keys, kind }: { data: Record<string, number | string>[]; keys: { k: string; name: string; color: string }[]; kind: "line" | "bar" }) {
  if (!data.length || data.every((d) => keys.every((k) => !d[k.k]))) return <Empty />;
  return (
    <div className="h-64 w-full" dir="ltr"><ResponsiveContainer>
      {kind === "bar" ? (
        <BarChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis allowDecimals={false} {...axis} width={36} /><Tooltip {...tip} />{keys.map((k) => <Bar key={k.k} dataKey={k.k} name={k.name} fill={k.color} radius={[4, 4, 0, 0]} />)}</BarChart>
      ) : (
        <AreaChart data={data}><defs>{keys.map((k) => <linearGradient key={k.k} id={`g-${k.k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={k.color} stopOpacity={0.35} /><stop offset="100%" stopColor={k.color} stopOpacity={0} /></linearGradient>)}</defs><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis allowDecimals={false} {...axis} width={36} /><Tooltip {...tip} />{keys.map((k) => <Area key={k.k} type="monotone" dataKey={k.k} name={k.name} stroke={k.color} strokeWidth={2.5} fill={`url(#g-${k.k})`} />)}</AreaChart>
      )}
    </ResponsiveContainer></div>
  );
}
function Heatmap({ grid }: { grid: number[][] }) {
  const L = useL();
  const max = Math.max(0, ...grid.flat());
  if (!max) return <Empty />;
  return (
    <div className="overflow-x-auto" dir="ltr">
      <div className="ss-heat">
        <span />{Array.from({ length: 24 }, (_, h) => <span key={h} className="ss-heat-h">{h % 3 === 0 ? h : ""}</span>)}
        {grid.map((row, d) => [<span key={`l${d}`} className="ss-heat-d">{L((DOW[d] ?? "Sun"))}</span>, ...row.map((v, h) => <span key={`${d}-${h}`} className="ss-heat-cell" title={`${L((DOW[d] ?? "Sun"))} ${h}:00 — ${v}`} style={{ background: v ? `color-mix(in oklab, var(--primary) ${Math.round(15 + (v / max) * 85)}%, transparent)` : undefined }} />)])}
      </div>
    </div>
  );
}
function Board({ rows, unit, icon }: { rows: { id: string; name: string; avatar?: string | null; value: number }[]; unit: (n: number) => string; icon: ReactNode }) {
  if (!rows.length) return <Empty icon={icon} />;
  const max = rows[0]?.value || 1;
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.id} className="ss-row">
          <span className="w-6 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
          {r.avatar ? <img src={r.avatar} alt="" className="h-7 w-7 rounded-full" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs">{r.name.slice(0, 1)}</span>}
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold"><bdi>{r.name}</bdi></div><div className="ss-bar"><span style={{ width: `${(r.value / max) * 100}%` }} /></div></div>
          <span className="font-mono text-sm">{unit(r.value)}</span>
        </li>
      ))}
    </ol>
  );
}

type LiveData = { live: GuildLive | null; updatedAt: string | null; punishments: { id: string; user_id: string; kind: string; reason: string | null; moderator_name: string | null; created_at: string; name: string; avatar: string | null }[] } | undefined;
export function ServerStatistics({ data, live: liveData }: { data: GuildData; live?: LiveData }) {
  const L = useL();
  const stats = data.serverStats as ServerStats | null;
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>("24h");
  const live = liveData?.live ?? null;
  const [bots, setBots] = useState(false);
  const [current, setCurrent] = useState(true);
  const [cat, setCat] = useState("all");
  const [ctype, setCtype] = useState("all");
  const [kind, setKind] = useState<"line" | "bar">("line");
  const [group, setGroup] = useState<"channels" | "categories">("channels");
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1_000); return () => clearInterval(t); }, []);

  const view = useMemo(() => {
    const all = stats?.days ?? [];
    const today = new Date((now ?? Date.now()) + OFFSET).toISOString().slice(0, 10);
    const pool = current ? all : all.filter((d) => d.date !== today);
    const n = range === "30d" ? 30 : range === "7d" ? 7 : 2;
    const days = pool.slice(-n);
    const chans = stats?.chans ?? {};
    const chanOk = (id: string) => { const c = chans[id]; return (cat === "all" || c?.categoryId === cat) && (ctype === "all" || c?.type === ctype); };
    const filtered = cat !== "all" || ctype !== "all";
    const msgUsers: Record<string, number> = {}, voiceUsers: Record<string, number> = {}, msgCh: Record<string, number> = {}, voiceCh: Record<string, number> = {}, st: Record<string, number> = {}, cam: Record<string, number> = {}, mu: Record<string, number> = {};
    const hourly = Array(24).fill(0), hourlyV = Array(24).fill(0), dow = Array(7).fill(0), dowV = Array(7).fill(0);
    const grid = { m: Array.from({ length: 7 }, () => Array(24).fill(0)), v: Array.from({ length: 7 }, () => Array(24).fill(0)) };
    const msgsOf = (d: Day) => filtered ? sum(Object.fromEntries(Object.entries(d.c).filter(([id]) => chanOk(id)))) : d.h.reduce((a, x, i) => a + x + (bots ? d.bh[i] ?? 0 : 0), 0);
    const voiceOf = (d: Day) => filtered ? sum(Object.fromEntries(Object.entries(d.vc).filter(([id]) => chanOk(id)))) : d.vh.reduce((a, b) => a + b, 0);
    for (const d of days) {
      add(msgUsers, d.m); if (bots) add(msgUsers, d.bm); add(voiceUsers, d.v); add(st, d.st); add(cam, d.cam); add(mu, d.mu);
      for (const [id, v] of Object.entries(d.c)) if (chanOk(id)) msgCh[id] = (msgCh[id] ?? 0) + v;
      for (const [id, v] of Object.entries(d.vc)) if (chanOk(id)) voiceCh[id] = (voiceCh[id] ?? 0) + v;
      const wd = new Date(`${d.date}T00:00:00Z`).getUTCDay();
      const messageGrid = grid.m[wd];
      const voiceGrid = grid.v[wd];
      d.h.forEach((v, h) => { const x = v + (bots ? d.bh[h] ?? 0 : 0); hourly[h] += x; if (messageGrid) messageGrid[h] += x; dow[wd] += x; });
      d.vh.forEach((v, h) => { hourlyV[h] += v; if (voiceGrid) voiceGrid[h] += v; dowV[wd] += v; });
    }
    let series: { label: string; messages: number; voice: number }[];
    if (range === "24h") {
      const hNow = new Date((now ?? Date.now()) + OFFSET).getUTCHours();
      const last2 = all.slice(-2); const flat: { label: string; messages: number; voice: number }[] = [];
      for (const d of last2) for (let h = 0; h < 24; h++) { if (d.date === today && h > hNow) break; flat.push({ label: `${String(h).padStart(2, "0")}:00`, messages: (d.h[h] ?? 0) + (bots ? d.bh[h] ?? 0 : 0), voice: +((d.vh[h] ?? 0) / 60).toFixed(1) }); }
      series = flat.slice(current ? -24 : -25, current ? undefined : -1);
    } else series = days.map((d) => ({ label: d.date.slice(5), messages: msgsOf(d), voice: +(voiceOf(d) / 60).toFixed(1) }));
    const users = stats?.users ?? {};
    const rows = (o: Record<string, number>, n = 10) => Object.entries(o).filter(([id]) => (bots || !users[id]?.bot)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([id, value]) => ({ id, value, name: users[id]?.name ?? id, avatar: users[id]?.avatar ?? null }));
    const chRows = (o: Record<string, number>) => {
      if (group === "categories") {
        const by: Record<string, number> = {}; for (const [id, v] of Object.entries(o)) { const k = chans[id]?.category ?? L("No category"); by[k] = (by[k] ?? 0) + v; }
        return Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ id: name, name, value }));
      }
      return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, value]) => ({ id, value, name: `${chans[id]?.type === "voice" ? "🔊" : "#"} ${chans[id]?.name ?? id}` }));
    };
    const totalMsgs = days.reduce((a, d) => a + msgsOf(d), 0);
    const totalVoice = days.reduce((a, d) => a + voiceOf(d), 0);
    const unique = new Set([...Object.keys(msgUsers), ...Object.keys(voiceUsers)].filter((id) => bots || !users[id]?.bot)).size;
    const members = data.stats.members ?? days.at(-1)?.mem ?? 0;
    const health = members ? Math.min(100, Math.round((unique / Math.max(1, members)) * 250)) : 0;
    const memberDays = days.map((d) => ({ label: d.date.slice(5), members: d.mem, joins: d.j, leaves: d.l }));
    let run = 0; const growth = days.map((d) => ({ label: d.date.slice(5), net: (run += d.j - d.l) }));
    const first = days.find((d) => d.mem)?.mem ?? members;
    return {
      days, series, hourly, hourlyV, dow, dowV, grid, totalMsgs, totalVoice, unique, health, members, memberDays, growth, change: members - first,
      chatters: rows(msgUsers), talkers: rows(voiceUsers), msgCh: chRows(msgCh), voiceCh: chRows(voiceCh),
      streamers: rows(st, 5), campers: rows(cam, 5), muted: rows(mu, 5),
      breakdown: [{ name: L("Streaming"), value: sum(st) }, { name: L("Camera"), value: sum(cam) }, { name: L("Muted"), value: sum(mu) }, { name: L("Talking"), value: Math.max(0, sum(voiceUsers) - sum(mu)) }].filter((x) => x.value),
    };
  }, [stats, range, bots, current, cat, ctype, group, now === null ? null : Math.floor(now / 60_000), data.stats.members]);

  const cats = useMemo(() => { const m = new Map<string, string>(); for (const c of Object.values(stats?.chans ?? {})) if (c.categoryId && c.category) m.set(c.categoryId, c.category); return [...m]; }, [stats]);
  const tabs: [Tab, string, ReactNode][] = [["overview", L("Server Statistics"), <LayoutGrid key="o" />], ["invites", L("Invites"), <Link2 key="i" />], ["messages", L("Messages"), <MessageSquare key="m" />], ["voice", L("Voice"), <Headphones key="v" />], ["members", L("Members"), <Users key="u" />], ["xp", "XP", <TrendingUp key="x" />]];
  const hourBars = (vals: number[], days: number) => vals.map((v, h) => ({ label: `${String(h).padStart(2, "0")}`, avg: +(v / Math.max(1, days)).toFixed(1) }));
  const C = { msg: "var(--chart-msg)", voice: "var(--chart-voice)", join: "var(--chart-join)", leave: "var(--chart-leave)" };
  const pieColors = [C.msg, C.voice, C.leave, C.join];
  const segToggle = <ChartToggle v={kind} set={setKind} />;
  const groupPick = <select className="ss-select" value={group} onChange={(e) => setGroup(e.target.value as "channels" | "categories")}><option value="channels">{L("Category + Channels")}</option><option value="categories">{L("Categories")}</option></select>;

  return (
    <div className="ss-root" aria-label={L("Server Statistics")}>
      <nav className="ss-tabs" role="tablist">{tabs.map(([id, label, icon]) => <Button variant="statistics" key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{icon}{label}</Button>)}</nav>

      {tab !== "xp" && (
        <div className="ss-filters">
          <div className="ss-seg ss-seg-text">{(["24h", "7d", "30d"] as Range[]).map((r) => <Button variant="statistics" key={r} aria-selected={range === r} onClick={() => setRange(r)}>{r}</Button>)}</div>
          {tab !== "members" && <label className="ss-check"><Switch checked={bots} onCheckedChange={setBots} />{L("Include bots")}</label>}
          <label className="ss-check"><Switch checked={current} onCheckedChange={setCurrent} />{L("Show current period")}</label>
          {tab !== "members" && <>
            <label className="ss-check"><FolderOpen className="h-3.5 w-3.5" /><select className="ss-select" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">{L("All categories")}</option>{cats.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>
            <select className="ss-select" value={ctype} onChange={(e) => setCtype(e.target.value)}><option value="all">{L("All channel types")}</option><option value="text">{L("Text")}</option><option value="voice">{L("Voice")}</option><option value="announcement">{L("Announcement")}</option><option value="forum">{L("Forum")}</option></select>
          </>}
        </div>
      )}

      {!stats && <div className="ss-panel p-6 text-center text-sm text-muted-foreground">{L("Waiting for the bot to send statistics — run the latest bot version and give it a couple of minutes.")}</div>}

      {tab === "overview" && (() => {
        const use24 = range === "24h" && live && cat === "all" && ctype === "all" && !bots;
        const ago = liveData?.updatedAt && now ? Math.max(0, Math.round((now - new Date(liveData.updatedAt).getTime()) / 1000)) : null;
        const n = (v: number | null | undefined) => (v ?? 0).toLocaleString();
        const chatters = use24 ? live.topChatters : view.chatters;
        const talkers = use24 ? live.topVoice : view.talkers;
        const channels = use24 ? live.topChannels.map((c) => ({ id: c.id, name: `${c.type === "voice" ? "🔊" : "#"} ${c.name}`, value: c.messages + c.voice })) : view.msgCh;
        return <>
        <div className="ov-live"><span className="ov-dot" data-on={ago !== null && ago < 30 || undefined} />{L("Live")}{ago !== null && <span className="text-muted-foreground"> · {L("updated")} {ago} {L("sec ago")}</span>}</div>
        <div className="ss-stat-grid ov-grid">
          <Stat icon={<Users />} label={L("Total Members")} value={n(live?.members ?? data.stats.members)} tone="violet" />
          <Stat icon={<Wifi />} label={L("Online Now")} value={live?.online != null || data.stats.online != null ? n(live?.online ?? data.stats.online) : "—"} tone="voice" />
          <Stat icon={<HeartPulse />} label={L("Active Members")} value={n(use24 ? live.active24 : view.unique)} tone="warm" />
          <Stat icon={<MessageSquare />} label={L("Total Messages")} value={n(use24 ? live.messages24 : view.totalMsgs)} tone="primary" />
          <Stat icon={<Rocket />} label={L("Boosts")} value={n(live?.boosts ?? data.stats.boosts)} tone="violet" />
          <Stat icon={<Ticket />} label={L("Open Tickets")} value={n(live?.openTickets ?? data.stats.openTickets)} tone="warm" />
          <Stat icon={<Headphones />} label={L("In Voice")} value={n(live?.voice ?? data.stats.voice)} tone="voice" />
        </div>
        <Panel icon={<TrendingUp />} title={L("Activity over time")} right={segToggle}>
          <div className="grid gap-4 lg:grid-cols-2"><Series data={view.series} kind={kind} keys={[{ k: "messages", name: L("Messages"), color: C.msg }]} /><Series data={view.series} kind={kind} keys={[{ k: "voice", name: L("Voice (hours)"), color: C.voice }]} /></div>
        </Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={<Clock />} title={L("Average Hourly Activity")} tone="violet"><Series data={hourBars(view.hourly, view.days.length)} kind="bar" keys={[{ k: "avg", name: L("Messages / day"), color: C.msg }]} /></Panel>
          <Panel icon={<CalendarDays />} title={L("Activity by Day of Week")} tone="violet"><Series data={view.dow.map((v, i) => ({ label: L((DOW[i] ?? "Sun")), messages: v }))} kind="bar" keys={[{ k: "messages", name: L("Messages"), color: C.msg }]} /></Panel>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel icon={<MessageSquare />} title={L("Top Chatters")}><Board rows={chatters} unit={(x) => x.toLocaleString()} icon={<MessageSquare />} /></Panel>
          <Panel icon={<Headphones />} title={L("Top Voice Users")} tone="voice"><Board rows={talkers} unit={fmtH} icon={<Headphones />} /></Panel>
          <Panel icon={<Boxes />} title={L("Most Active Channels")} tone="warm"><Board rows={channels} unit={(x) => x.toLocaleString()} icon={<Hash />} /></Panel>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={<Gavel />} title={L("Latest Punishments")} tone="warm">
            {liveData?.punishments.length ? <ul className="ov-list">{liveData.punishments.map((p) => (
              <li key={p.id} className="ov-item">
                <Avatar src={p.avatar} name={p.name} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold"><Link to="/u/$userId" params={{ userId: p.user_id }} className="hover:text-primary"><bdi>{p.name}</bdi></Link> <span className="ov-kind" data-kind={p.kind}>{L(p.kind)}</span></div>
                  <div className="truncate text-xs text-muted-foreground">{p.reason ?? "—"}{p.moderator_name ? ` · ${L("by")} ${p.moderator_name}` : ""}</div></div>
                <time className="ov-time">{fmtTime(p.created_at)}</time>
              </li>))}</ul> : <Empty icon={<Gavel />} h="h-40" />}
          </Panel>
          <Panel icon={<UserPlus />} title={L("Joins & Leaves Log")} tone="voice">
            {live?.events.length ? <ul className="ov-list">{live.events.map((e) => (
              <li key={`${e.id}-${e.at}`} className="ov-item">
                <span className="ov-ev" data-type={e.type}>{e.type === "join" ? <LogIn /> : <LogOut />}</span>
                <Avatar src={e.avatar} name={e.name} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold"><Link to="/u/$userId" params={{ userId: e.id }} className="hover:text-primary"><bdi>{e.name}</bdi></Link> <span className="text-xs text-muted-foreground">{L(e.type === "join" ? "Joined" : "Left")}</span></div>
                  <div className="truncate font-mono text-xs text-muted-foreground" dir="ltr">{e.username ? `@${e.username} · ` : ""}{e.id}</div></div>
                <time className="ov-time">{fmtTime(e.at)}</time>
              </li>))}</ul> : <Empty icon={<UserPlus />} h="h-40" />}
          </Panel>
        </div>
      </>; })()}

      {tab === "invites" && <Invites live={live} L={L} />}
      {tab === "messages" && <>
        <Panel icon={<TrendingUp />} title={L("Message activity")} right={segToggle}><Series data={view.series} kind={kind} keys={[{ k: "messages", name: L("Messages"), color: C.msg }]} /></Panel>
        <Panel icon={<Grid3x3 />} title={L("Activity Heatmap")} tone="warm"><Heatmap grid={view.grid.m} /></Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={<BarChart3 />} title={L("Message Leaderboard")}><Board rows={view.chatters} unit={(n) => n.toLocaleString()} icon={<MessageSquare />} /></Panel>
          <Panel icon={<FolderOpen />} title={L("Messages by Channel")} tone="violet" right={groupPick}><Board rows={view.msgCh} unit={(n) => n.toLocaleString()} icon={<Hash />} /></Panel>
        </div>
      </>}

      {tab === "voice" && <>
        <Panel icon={<TrendingUp />} title={L("Voice activity")} tone="voice" right={segToggle}><Series data={view.series} kind={kind} keys={[{ k: "voice", name: L("Voice (hours)"), color: C.voice }]} /></Panel>
        <Panel icon={<Grid3x3 />} title={L("Activity Heatmap")} tone="warm"><Heatmap grid={view.grid.v} /></Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={<BarChart3 />} title={L("Voice Leaderboard")} tone="voice"><Board rows={view.talkers} unit={fmtH} icon={<Headphones />} /></Panel>
          <Panel icon={<FolderOpen />} title={L("Voice by Channel")} tone="voice" right={groupPick}><Board rows={view.voiceCh} unit={fmtH} icon={<Mic />} /></Panel>
        </div>
        <Panel icon={<Radio />} title={L("Voice Activity Breakdown")} tone="violet">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="ss-sub">{view.breakdown.length ? <div className="h-48" dir="ltr"><ResponsiveContainer><PieChart><Pie data={view.breakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>{view.breakdown.map((_, i) => <Cell key={i} fill={pieColors[i % 4]} />)}</Pie><Tooltip {...tip} formatter={(v: number) => fmtH(v)} /></PieChart></ResponsiveContainer></div> : <Empty h="h-48" />}</div>
            <MiniList icon={<Video />} title={L("Top Streamers")} rows={view.streamers} />
            <MiniList icon={<Video />} title={L("Top Camera Users")} rows={view.campers} />
            <MiniList icon={<MicOff />} title={L("Most Muted")} rows={view.muted} />
          </div>
        </Panel>
      </>}

      {tab === "members" && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat icon={<Users />} label={L("Current Members")} value={view.members.toLocaleString()} tone="violet" />
          <Stat icon={<TrendingUp />} label={L("Change")} value={`${view.change >= 0 ? "+" : ""}${view.change} (${view.members ? ((view.change / Math.max(1, view.members - view.change)) * 100).toFixed(1) : 0}%)`} tone="voice" />
          <Stat icon={<CalendarDays />} label={L("Data Points")} value={String(view.days.length)} tone="warm" />
        </div>
        <Panel icon={<TrendingUp />} title={L("Member Trend")} tone="violet" right={segToggle}><MemberLine data={view.memberDays.filter((d) => d.members)} k="members" color={C.msg} kind={kind} /></Panel>
        <Panel icon={<UserPlus />} title={L("Joins & Leaves")} tone="voice" right={segToggle}><Series data={view.memberDays} kind={kind === "line" ? "bar" : "line"} keys={[{ k: "joins", name: L("Joins"), color: C.join }, { k: "leaves", name: L("Leaves"), color: C.leave }]} /></Panel>
        <Panel icon={<TrendingUp />} title={L("Cumulative Net Growth")} tone="violet"><MemberLine data={view.growth} k="net" color={C.voice} kind="line" /></Panel>
      </>}

      {tab === "xp" && <Panel icon={<Flame />} title={L("XP Leaderboard")} tone="warm"><Board rows={(data.activityTop ?? []).slice(0, 25).map((r) => ({ id: r.id, name: r.name, avatar: r.avatar ?? null, value: r.xp }))} unit={(n) => `${n.toLocaleString()} XP`} icon={<TrendingUp />} /></Panel>}

    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  return src ? <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-full" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs">{name.slice(0, 1)}</span>;
}
const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bahrain", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
function Stat({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: string; sub?: string; tone: "primary" | "voice" | "warm" | "violet" }) {
  return <div className="ss-stat"><span className="ss-icon" data-tone={tone}>{icon}</span><div><div className="text-xs text-muted-foreground">{label}</div><div className="font-mono text-2xl font-bold">{value}</div>{sub && <div className="text-xs text-muted-foreground">{sub}</div>}</div></div>;
}
function MiniList({ icon, title, rows }: { icon: ReactNode; title: string; rows: { id: string; name: string; value: number }[] }) {
  const L = useL();
  return <div><div className="mb-2 flex items-center gap-2 text-sm font-bold [&_svg]:h-4 [&_svg]:w-4">{icon}{title}</div>{rows.length ? <ol className="space-y-1 text-sm">{rows.map((r) => <li key={r.id} className="flex justify-between gap-2"><bdi className="truncate">{r.name}</bdi><span className="font-mono text-muted-foreground">{fmtH(r.value)}</span></li>)}</ol> : <div className="text-xs text-muted-foreground">{L("No data available for this period")}</div>}</div>;
}
function MemberLine({ data, k, color, kind }: { data: Record<string, number | string>[]; k: string; color: string; kind: "line" | "bar" }) {
  if (data.length < 1) return <Empty />;
  return <div className="h-64" dir="ltr"><ResponsiveContainer>{kind === "bar" ? <BarChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} width={44} domain={["auto", "auto"]} /><Tooltip {...tip} /><Bar dataKey={k} fill={color} radius={[4, 4, 0, 0]} /></BarChart> : <LineChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} width={44} domain={["auto", "auto"]} /><Tooltip {...tip} /><Line type="monotone" dataKey={k} stroke={color} strokeWidth={2.5} dot={false} /></LineChart>}</ResponsiveContainer></div>;
}

function Invites({ live, L }: { live: GuildLive | null; L: (s: string) => string }) {
  const [open, setOpen] = useState<string | null>(null);
  const inv = live?.invites ?? [];
  const byUser = new Map<string, { id: string; name: string; avatar: string | null; value: number }>();
  for (const i of inv) if (i.inviterId) { const r = byUser.get(i.inviterId) ?? { id: i.inviterId, name: i.inviterName, avatar: i.inviterAvatar, value: 0 }; r.value += i.uses; byUser.set(i.inviterId, r); }
  const top = [...byUser.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return <>
    <Panel icon={<Flame />} title={L("Top Inviters")} tone="warm">
      {top.length ? <ul className="ov-list">{top.map((u, k) => (
        <li key={u.id} className="ov-item"><b className="w-6 text-center text-primary">{k + 1}</b><Avatar src={u.avatar} name={u.name} />
          <div className="min-w-0 flex-1"><Link to="/u/$userId" params={{ userId: u.id }} className="truncate text-sm font-semibold hover:text-primary"><bdi>{u.name}</bdi></Link><div className="truncate font-mono text-xs text-muted-foreground" dir="ltr">{u.id}</div></div>
          <span className="text-end"><b className="text-gold">{u.value.toLocaleString()}</b> <small className="text-muted-foreground">{L("invites")}</small></span></li>))}</ul> : <Empty icon={<UserPlus />} h="h-40" />}
    </Panel>
    <Panel icon={<Link2 />} title={L("Active Invite Links")} right={<span className="text-xs text-muted-foreground">{inv.length}</span>}>
      {inv.length ? <div className="inv-table" role="table">
        <div className="inv-row inv-head" role="row"><span>{L("Code")}</span><span>{L("Channel")}</span><span>{L("Creator")}</span><span>{L("Uses")}</span><span>{L("Limit")}</span><span>{L("Expires")}</span></div>
        {inv.map((i) => <div key={i.code}>
          <button type="button" className="inv-row" role="row" data-open={open === i.code || undefined} onClick={() => setOpen(open === i.code ? null : i.code)}>
            <a href={`https://discord.gg/${i.code}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inv-code" dir="ltr"><ExternalLink className="h-3.5 w-3.5" />discord.gg/{i.code}</a>
            <span># {i.channelName || "—"}</span><span><bdi>{i.inviterName || "—"}</bdi></span><b>{i.uses}</b>
            <span>{i.maxUses ? i.maxUses : "∞"}</span><span dir="ltr">{i.expiresAt ? fmt(i.expiresAt) : "∞"}</span>
          </button>
          {open === i.code && <div className="inv-joined"><b>{L("Joined via")}</b>{i.joined.length ? <ul>{i.joined.map((j) => <li key={`${j.id}-${j.at}`}><Link to="/u/$userId" params={{ userId: j.id }} className="hover:text-primary"><bdi>{j.name}</bdi></Link><span className="font-mono text-xs text-muted-foreground" dir="ltr">{j.id}</span><time className="ov-time">{fmt(j.at)}</time>{j.left && <span className="ov-kind" data-kind="kick">{L("left")}</span>}</li>)}</ul> : <p className="text-sm text-muted-foreground">{L("Nobody joined via this link yet")}</p>}</div>}
        </div>)}
      </div> : <Empty icon={<Link2 />} h="h-40" />}
    </Panel>
  </>;
}
