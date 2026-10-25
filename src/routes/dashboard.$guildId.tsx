import { useT as useSpireTranslation } from "@/lib/i18n";
import { createJob } from "@/lib/create.functions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteActivity } from "@/components/dash/activity";
import { Dividers } from "@/components/dash/dividers";
import { Creators } from "@/components/dash/creators";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, Copy, Settings, ListChecks, Hand, Send, Medal, History, Ticket, Flame, TrendingUp, Music, Menu, X, ArrowRight, LayoutGrid, TerminalSquare, Ban, Wand2, Users, MonitorPlay, Languages, CalendarClock, KeyRound, MessageSquareText, ShieldCheck, BarChart3 } from "lucide-react";
import { ScheduledAnnouncements, DashboardAccess } from "@/components/dash/guild-tools";
import { useModules, AllCommands, Overview, General, Moderation, Welcome, Logs, AutoRoles, CategorizedCommands, BannedWords, BotSettings } from "@/components/dash/modules";
import { PageHeader } from "@/components/dash/kit";
import { Leaderboards } from "@/components/dash/leaderboards";
import { Streak } from "@/components/dash/streak";
import { Embeds } from "@/components/dash/embeds";
import { MusicPlayer } from "@/components/dash/music-player";
import { BotReplies } from "@/components/dash/bot-replies";
import { SelfRoles } from "@/components/dash/selfroles";
import { Members } from "@/components/dash/members";
import { AutoReplyPanel, AutomodPanel, StatChannelsPanel } from "@/components/dash/automation";
import { CreateSection } from "@/components/dash/create";
import { TicketsSettings } from "@/components/dash/TicketsSettings";
import { TicketPanelEditor } from "@/components/dash/TicketPanelEditor";
import {
  getGuildData, saveTicketSettings, saveAliases, type TicketSettings, type Alias,
} from "@/lib/dashboard.functions";
import { TopBar, GuildIcon } from "@/components/TopBar";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/$guildId")({
  validateSearch: (search: Record<string, unknown>) => ({ section: typeof search["section"] === "string" && SECTIONS.some(group => group.items.some(item => item.id === search["section"])) ? search["section"] : "overview" }),
  head: () => ({
    meta: [
      { title: "إعدادات السيرفر — Spire Bot" },
      { name: "description", content: "لوحة تحكم كاملة للبوت: الأوامر، الإشراف، الترحيب، اللوق، الإيمبد والتكت." },
      { property: "og:title", content: "إعدادات السيرفر — Spire Bot" },
      { property: "og:description", content: "لوحة تحكم كاملة للبوت: الأوامر، الإشراف، الترحيب، اللوق، الإيمبد والتكت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuildPage,
});

type Data = Awaited<ReturnType<typeof getGuildData>>;
const NONE = "__none";

const SECTIONS = [
  { group: "الإعدادات", items: [
    { id: "bot", label: "إعدادات البوت", icon: Languages },
    { id: "commands", label: "كل الأوامر", icon: TerminalSquare },
    { id: "replies", label: "ردود البوت", icon: MessageSquareText },
    { id: "activity", label: "السجل", icon: History },
    { id: "access", label: "صلاحيات اللوحة", icon: KeyRound },
  ] },
  { group: "الإدارة", items: [
    { id: "overview", label: "النظرة العامة", icon: Eye },
    { id: "members", label: "الأعضاء", icon: Users },
    { id: "create", label: "إنشاء", icon: Wand2 },
    { id: "statchannels", label: "قنوات الإحصائيات", icon: BarChart3 },
    { id: "automod", label: "الرقابة التلقائية", icon: ShieldCheck },
    { id: "moderation", label: "الإشراف", icon: ListChecks },
    { id: "welcome", label: "الترحيب & المغادرة", icon: Hand },
    { id: "bannedwords", label: "الكلمات المحظورة", icon: Ban },
    { id: "logs", label: "اللوق", icon: History },
  ] },
  { group: "التفاعل", items: [
    { id: "general", label: "الأوامر العامة", icon: Settings },
    { id: "autoreply", label: "الرد التلقائي", icon: Send },
    { id: "music", label: "الموسيقى", icon: Music },
    { id: "creators", label: "صناع المحتوى", icon: MonitorPlay },
    { id: "levels", label: "المستويات والترتيب", icon: TrendingUp },
  ] },
  { group: "الأنظمة", items: [
    { id: "tickets", label: "نظام التكت", icon: Ticket },
    { id: "streak", label: "الستريك", icon: Flame },
    { id: "autoroles", label: "الرولات التلقائية", icon: Medal },
    { id: "selfroles", label: "الرتب القابلة للأخذ", icon: Hand },
    { id: "embeds", label: "رسائل الإيمبد", icon: Copy },
    { id: "schedule", label: "الإعلانات المجدولة", icon: CalendarClock },
    { id: "dividers", label: "الفواصل", icon: Wand2 },
  ] },
] as const;
type SectionId = (typeof SECTIONS)[number]["items"][number]["id"];
// Moderators only see member tools; dashboard roles are managed by server owners/admins.
const MODERATOR_SECTIONS = new Set<string>(["overview", "members", "activity"]);
const canSee = (role: "owner" | "manager" | "moderator", id: string) =>
  role === "owner" || (role === "manager" ? id !== "access" : MODERATOR_SECTIONS.has(id));

function GuildPage() {
  const __tr = useSpireTranslation();

  const { guildId } = Route.useParams();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const { section } = Route.useSearch();
  const { data, isLoading, error } = useQuery({
    queryKey: ["guild", guildId],
    queryFn: () => getGuildData({ data: { guildId } }),
    retry: false,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
  return (
    <>
      <div className="dashboard-page">
      <TopBar />
      <main className="dashboard-shell w-full px-3 py-5 sm:px-6 lg:px-8 2xl:px-12">
        <Button asChild variant="servers"><Link to="/dashboard"><ArrowRight aria-hidden="true" /><LayoutGrid aria-hidden="true" /> {t("جميع الخوادم")}</Link></Button>
        {isLoading && <p className="mt-10 text-muted-foreground">{t("جاري التحميل…")}</p>}
        {error && (
          <p className="mt-10 text-destructive">
            {String((error as Error).message).includes("NOT_ADMIN")
              ? __tr("ما عندك صلاحية أدمنستريتر في هذا السيرفر.")
              : String((error as Error).message).includes("BOT_MISSING")
                ? __tr("البوت غير مضاف لهذا السيرفر. أضفه ثم حدّث الصفحة.")
                : String((error as Error).message).includes("UNAUTHORIZED")
                  ? __tr("انتهت جلستك، سجّل الدخول من جديد.")
                  : __tr("ما قدرنا نفتح هذا السيرفر. جرّب تحديث الصفحة أو تسجيل الخروج والدخول من جديد.")}
          </p>
        )}
        {data && (
          <div className="dashboard-grid mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
            <Button variant="outline" className="shrink-0 justify-start lg:hidden" onClick={() => setMenuOpen(!menuOpen)}><Menu className="h-5 w-5"/> {t("أقسام لوحة التحكم")}</Button>
            <aside className={`${menuOpen ? "block" : "hidden"} dashboard-sidebar lg:block`}>
              <div className="side-guild">
                <GuildIcon name={data.guild.name} icon={data.guild.icon} size="h-14 w-14" />
                <div className="min-w-0"><span className="block truncate font-bold">{data.guild.name}</span><span className="side-guild-status">{t("البوت متصل")}</span></div>
              </div>
              {SECTIONS.map((g) => ({ ...g, items: g.items.filter((it) => canSee(data.siteRole, it.id)) })).filter((g) => g.items.length).map((g) => (
                <div key={g.group} className="side-group">
                  <p className="side-group-label">{t(g.group)}</p>
                  <nav className="grid gap-0.5">
                    {g.items.map((it) => (
                      <Link key={it.id} to="/dashboard/$guildId" params={{ guildId }} search={{ section: it.id }} onClick={() => setMenuOpen(false)}
                        className="side-link" data-active={section === it.id || undefined} aria-current={section === it.id ? "page" : undefined}>
                        <it.icon className="h-4 w-4 shrink-0" /> <span className="truncate">{t(it.label)}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </aside>
            <div className="dashboard-content min-w-0"><div key={section} className="section-enter"><SectionView id={canSee(data.siteRole, section) ? section : "overview"} data={data} guildId={guildId} /></div></div>
          </div>
        )}
      </main>
      </div>
    </>
  );
}

function SectionView({ id, data, guildId }: { id: string; data: Data; guildId: string }) {
  const __tr = useSpireTranslation();

  const { m, set, bar, save } = useModules(data, guildId);
  const p = { data, m, set, save };
  return (
    <>
      {id === "bot" && <BotSettings {...p} />}
      {id === "overview" && <Overview data={data} />}
      {id === "members" && <Members guildId={guildId} />}
      {id === "embeds" && <Embeds data={data} guildId={guildId} />}
      {id === "commands" && <AllCommands {...p} />}
      {id === "replies" && <BotReplies m={m} set={set} />}
      {id === "create" && <CreateSection guildId={guildId} roles={data.roles} channels={data.textChannels} streakSettings={<Streak {...p} mode="settings" />} />}
      {id === "activity" && <SiteActivity guildId={guildId} />}
      {id === "schedule" && <ScheduledAnnouncements data={data} guildId={guildId} />}
      {id === "access" && <DashboardAccess guildId={guildId} />}
      {id === "dividers" && <Dividers {...p} />}
      {id === "creators" && <Creators {...p} />}
      {id === "general" && <General {...p} />}
      {id === "moderation" && <Moderation {...p} />}
      {id === "welcome" && <Welcome {...p} />}
      {id === "bannedwords" && <BannedWords {...p} />}
      {id === "autoreply" && <AutoReplyPanel {...p} />}
      {id === "automod" && <AutomodPanel {...p} />}
      {id === "statchannels" && <StatChannelsPanel {...p} />}
      {id === "autoroles" && <AutoRoles {...p} />}
      {id === "selfroles" && <SelfRoles data={data} guildId={guildId} />}
      {id === "logs" && <Logs {...p} />}
      {id === "tickets" && <><PageHeader title="نظام التكت" /><TicketsSettings data={data} guildId={guildId} /></>}
      {id === "streak" && <Streak {...p} mode="top" />}
      {id === "levels" && <Leaderboards data={data} guildId={guildId} />}
      {id === "music" && <><PageHeader title="الموسيقى" /><MusicPlayer guildId={guildId} voiceChannels={data.voiceChannels} /><div className="mt-8"><CategorizedCommands {...p} kind="music" /></div></>}
      {bar}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const __tr = useSpireTranslation();

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-5 text-lg font-bold">{__tr(title)}</h2>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function Pick({ value, onChange, items, placeholder }: {
  value: string | null; onChange: (v: string | null) => void; items: { id: string; name: string }[]; placeholder: string;
}) {
  const __tr = useSpireTranslation();

  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger><SelectValue placeholder={__tr(placeholder)} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— {__tr(placeholder)} —</SelectItem>
        {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

