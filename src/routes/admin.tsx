import { useT as useSpireTranslation } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Megaphone, Activity, Coins, Flame, Search, Server, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { TopBar, GuildIcon } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminOverview, runAdminOp, getAdminJob, type AdminOp } from "@/lib/admin.functions";
import { useT } from "@/lib/i18n";
import { ago } from "@/components/dash/members";
import { PostsEditor } from "@/components/PostsEditor";
import { ShopEditor } from "@/components/ShopEditor";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم المالك — Spire Bot" },
      { name: "description", content: "تحكم كامل بالبوت: المستخدمين، السيرفرات، الكريدت، اللفلات والستريك." },
      { property: "og:title", content: "لوحة تحكم المالك — Spire Bot" },
      { property: "og:description", content: "تحكم كامل بالبوت: المستخدمين، السيرفرات، الكريدت، اللفلات والستريك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});
type Tab = "control" | "users" | "servers" | "activity" | "rankings" | "posts" | "shop";
const ACTION_LABEL: Record<string, string> = {
  login: "سجل دخول", save_settings: "حفظ إعدادات",
  "admin:addCredits": "إضافة كريدت", "admin:removeCredits": "سحب كريدت", "admin:setCredits": "تحديد كريدت",
  "admin:setLevel": "تحديد لفل", "admin:setXp": "تحديد XP", "admin:setStreak": "تحديد ستريك", "admin:leaveGuild": "إخراج البوت",
};

function AdminPage() {
  const __tr = useSpireTranslation();

  const t = useT();
  const [tab, setTab] = useState<Tab>("control");
  const { data, isLoading, error } = useQuery({ queryKey: ["admin"], queryFn: () => getAdminOverview(), retry: false, refetchInterval: 20000 });
  const forbidden = error && String((error as Error).message).match(/FORBIDDEN|UNAUTHORIZED/);
  const tabs: { id: Tab; label: string; icon: typeof Users; count?: number | undefined }[] = [
    { id: "control", label: "التحكم بالأعضاء", icon: ShieldCheck },
    { id: "users", label: "المستخدمين", icon: Users, count: data?.users.length },
    { id: "servers", label: "السيرفرات", icon: Server, count: data?.guilds.length },
    { id: "activity", label: "النشاط", icon: Activity, count: data?.activity.length },
    { id: "rankings", label: "الكريدت", icon: Coins },
    { id: "posts", label: "التحديثات", icon: Megaphone },
    { id: "shop", label: "المتجر", icon: ShoppingBag },
  ];
  return (
    <>
      <TopBar />
      <main className="w-full px-4 py-8 md:px-8">
        <h1 className="font-display text-4xl">{t("لوحة التحكم")}</h1>
        {isLoading && <p className="mt-8 text-muted-foreground">{t("جاري التحميل…")}</p>}
        {forbidden && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
            <p className="mb-4">{__tr("هذي الصفحة خاصة بمالك البوت فقط.")}</p>
            <Button asChild variant="gold"><Link to="/dashboard">{t("كل السيرفرات")}</Link></Button>
          </div>
        )}
        {data && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={Users} label={__tr("مستخدمين سجلوا بالموقع")} value={data.users.length} />
              <Stat icon={Server} label={__tr("سيرفرات فيها البوت")} value={data.guilds.length} />
              <Stat icon={TrendingUp} label={__tr("أعضاء بكل السيرفرات")} value={data.guilds.reduce((n, g) => n + (g.members ?? 0), 0)} />
              <Stat icon={Activity} label={__tr("عمليات آخر 24 ساعة")} value={data.activity.filter((a) => Date.now() - new Date(a.created_at).getTime() < 86_400_000).length} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
              {tabs.map((x) => (
                <Button key={x.id} variant={tab === x.id ? "gold" : "ghost"} onClick={() => setTab(x.id)}>
                  <x.icon className="h-4 w-4" /> {t(x.label)} {x.count !== undefined && <span className="font-mono text-xs opacity-70">{x.count}</span>}
                </Button>
              ))}
            </div>
            <div className="mt-6">
              {tab === "control" && <Control guilds={data.guilds} jobs={data.jobs} />}
              {tab === "users" && <UsersTable users={data.users} />}
              {tab === "servers" && <ServersTable guilds={data.guilds} />}
              {tab === "activity" && <ActivityList rows={data.activity} />}
              {tab === "rankings" && <Rankings credit={data.creditTop} streak={data.streakTop} />}
              {tab === "posts" && <PostsEditor />}
              {tab === "shop" && <ShopEditor />}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  const __tr = useSpireTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-primary"><Icon className="h-5 w-5" /></span>
      <div className="mt-3 font-mono text-3xl font-bold">{value.toLocaleString("en")}</div>
      <div className="text-sm text-muted-foreground">{__tr(label)}</div>
    </div>
  );
}

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
const OPS: { id: AdminOp; label: string; needsGuild: boolean; amount: boolean }[] = [
  { id: "addCredits", label: "إضافة كريدت", needsGuild: false, amount: true },
  { id: "removeCredits", label: "سحب كريدت", needsGuild: false, amount: true },
  { id: "setCredits", label: "تحديد الكريدت", needsGuild: false, amount: true },
  { id: "setLevel", label: "تحديد اللفل", needsGuild: true, amount: true },
  { id: "setXp", label: "تحديد XP", needsGuild: true, amount: true },
  { id: "setStreak", label: "تحديد الستريك", needsGuild: false, amount: true },
  { id: "leaveGuild", label: "إخراج البوت من سيرفر", needsGuild: true, amount: false },
];

function Control({ guilds, jobs }: { guilds: Overview["guilds"]; jobs: Overview["jobs"] }) {
  const __tr = useSpireTranslation();

  const t = useT();
  const qc = useQueryClient();
  const [op, setOp] = useState<AdminOp>("addCredits");
  const [userId, setUserId] = useState("");
  const [guildId, setGuildId] = useState<string>("");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const cur = OPS.find((o) => o.id === op)!;
  const submit = async () => {
    if (op === "leaveGuild" && !confirm("متأكد تبي تطلع البوت من هذا السيرفر؟")) return;
    setBusy(true);
    try {
      const { id } = await runAdminOp({ data: { op, userId: userId.trim() || undefined, guildId: guildId || undefined, amount } });
      const tt = toast.loading(__tr("انرسل الطلب للبوت…"));
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const j = await getAdminJob({ data: { id } });
        if (j.status === "done") { toast.success(j.result ?? __tr("تم"), { id: tt }); qc.invalidateQueries({ queryKey: ["admin"] }); return; }
        if (j.status === "failed") { toast.error(j.result ?? __tr("ما قدر البوت ينفذ"), { id: tt }); return; }
      }
      toast.warning(__tr("البوت ما رد للحين — تأكد إنه شغال"), { id: tt });
    } catch (e) { toast.error(e instanceof Error ? e.message : __tr("صار خطأ")); }
    finally { setBusy(false); }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold">{t("التحكم بالأعضاء")}</h2>
        <div className="mb-5 flex flex-wrap gap-2">
          {OPS.map((o) => <Button key={o.id} size="sm" variant={op === o.id ? "gold" : "outline"} onClick={() => setOp(o.id)}>{__tr(o.label)}</Button>)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {op !== "leaveGuild" && <label className="grid gap-2"><span className="text-sm text-muted-foreground">{t("آيدي العضو")}</span><Input dir="ltr" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="123456789012345678" /></label>}
          <label className="grid gap-2"><span className="text-sm text-muted-foreground">{__tr("السيرفر")}{cur.needsGuild ? "" : __tr("(اختياري)")}</span>
            <Select value={guildId || "__none"} onValueChange={(v) => setGuildId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">{__tr("— بدون —")}</SelectItem>
                {guilds.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          {cur.amount && <label className="grid gap-2"><span className="text-sm text-muted-foreground">{__tr("القيمة")}</span><Input type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))} /></label>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{__tr("الكريدت والستريك عامة لكل السيرفرات، اللفل وال XP لكل سيرفر لحاله.")}</p>
        <Button className="mt-5" variant={op === "leaveGuild" || op === "removeCredits" ? "destructive" : "gold"} disabled={busy} onClick={submit}>{t("تطبيق")} — {__tr(cur.label)}</Button>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 text-lg font-bold">{__tr("آخر طلبات التحكم")}</h2>
        {!jobs.length && <p className="text-sm text-muted-foreground">—</p>}
        <ul className="grid gap-2 text-sm">
          {jobs.map((j) => {
            const p = j.payload as { op?: string; user_id?: string; amount?: number };
            return (
              <li key={j.id} className="rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex justify-between gap-2"><b>{ACTION_LABEL[`admin:${p.op}`] ?? p.op}</b><span className="text-xs text-muted-foreground">{ago(j.created_at)}</span></div>
                <div className="text-xs text-muted-foreground"><bdi dir="ltr">{p.user_id ?? j.guild_id}</bdi> · {p.amount ?? ""} · {j.result ?? (j.status === "pending" ? "⏳" : j.status)}</div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function useFilter<T>(rows: T[], text: (r: T) => string) {
  const __tr = useSpireTranslation();

  const [q, setQ] = useState("");
  const list = useMemo(() => rows.filter((r) => text(r).toLowerCase().includes(q.toLowerCase())), [rows, q, text]);
  const box = (
    <div className="relative mb-4 max-w-md">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="ps-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={__tr("بحث…")} />
    </div>
  );
  return { list, box };
}

const userText = (u: Overview["users"][number]) => `${u.username ?? ""} ${u.user_id}`;
function UsersTable({ users }: { users: Overview["users"] }) {
  const __tr = useSpireTranslation();

  const { list, box } = useFilter(users, userText);
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      {box}
      <ul className="grid gap-1">
        {list.map((u) => (
          <li key={u.user_id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary">
            {u.avatar ? <img src={u.avatar} alt="" className="h-10 w-10 rounded-full" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold">{(u.username ?? "?").slice(0, 1)}</span>}
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{u.username}</span><code className="text-xs text-muted-foreground">{u.user_id}</code></span>
            <span className="text-xs text-muted-foreground">{__tr("دخل")}{u.login_count} {__tr("مرة")}</span>
            <span className="w-28 text-end text-xs text-muted-foreground">{ago(u.last_login)}</span>
          </li>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">{__tr("ما فيه مستخدمين بعد.")}</p>}
      </ul>
    </section>
  );
}

const guildText = (g: Overview["guilds"][number]) => `${g.name} ${g.id}`;
function ServersTable({ guilds }: { guilds: Overview["guilds"] }) {
  const __tr = useSpireTranslation();

  const { list, box } = useFilter(guilds, guildText);
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      {box}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((g) => (
          <Link key={g.id} to="/dashboard/$guildId" params={{ guildId: g.id }} search={{ section: "overview" }} className="flex items-center gap-3 rounded-2xl border border-border p-4 transition hover:border-primary">
            <GuildIcon name={g.name} icon={g.icon} size="h-12 w-12" />
            <span className="min-w-0 flex-1"><span className="block truncate font-bold">{g.name}</span><code className="text-xs text-muted-foreground">{g.id}</code></span>
            <span className="text-end text-xs text-muted-foreground"><b className="block font-mono text-base text-foreground">{g.members ?? "—"}</b>{__tr("عضو")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const actText = (a: Overview["activity"][number]) => `${a.username ?? ""} ${a.user_id ?? ""} ${a.action} ${a.guild_id ?? ""}`;
function ActivityList({ rows }: { rows: Overview["activity"] }) {
  const __tr = useSpireTranslation();

  const { list, box } = useFilter(rows, actText);
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      {box}
      <ul className="grid gap-1 text-sm">
        {list.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl p-2 hover:bg-secondary">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{ACTION_LABEL[a.action] ?? a.action}</span>
            <b>{a.username ?? a.user_id}</b>
            {a.guild_id && <code className="text-xs text-muted-foreground">{a.guild_id}</code>}
            <span className="ms-auto text-xs text-muted-foreground">{ago(a.created_at)}</span>
          </li>
        ))}
        {!list.length && <p className="text-muted-foreground">{__tr("لا يوجد نشاط بعد.")}</p>}
      </ul>
    </section>
  );
}

function Rankings({ credit, streak }: { credit: Overview["creditTop"]; streak: Overview["streakTop"] }) {
  const __tr = useSpireTranslation();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Coins className="h-5 w-5 text-primary" /> {__tr("أكثر الناس كريدت")}</h2>
        <ol className="grid gap-1 text-sm">{credit.map((c, i) => <li key={c.id} className="flex justify-between rounded-lg p-2 hover:bg-secondary"><span>{i + 1}. {c.name} <code className="text-xs text-muted-foreground">{c.id}</code></span><b className="font-mono">${c.credits.toLocaleString("en")}</b></li>)}</ol>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Flame className="h-5 w-5 text-primary" /> {__tr("أعلى ستريك")}</h2>
        <ol className="grid gap-1 text-sm">{streak.map((c, i) => <li key={c.id} className="flex justify-between rounded-lg p-2 hover:bg-secondary"><span>{i + 1}. {c.name} <code className="text-xs text-muted-foreground">{c.id}</code></span><b className="font-mono">🔥 {c.streak}</b></li>)}</ol>
      </section>
    </div>
  );
}
