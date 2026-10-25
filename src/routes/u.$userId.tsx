import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Clock, Coins, Copy, Gamepad2, Mic, Server, Trophy, TrendingUp } from "lucide-react";
import { getPublicProfile } from "@/lib/profile.functions";
import { StatCard, fmt } from "@/components/AppShell";
import { GuildIcon } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { cosmeticClass } from "@/lib/shop";

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي — Spire" },
      { name: "description", content: "إحصائيات العضو: الكريدت، الفوز بالألعاب، اللفل، السيرفرات وساعات النشاط والفويس." },
      { property: "og:title", content: "الملف الشخصي — Spire" },
      { property: "og:description", content: "إحصائيات العضو: الكريدت، الفوز بالألعاب، اللفل، السيرفرات وساعات النشاط والفويس." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const PERIODS = [["day", "اليوم"], ["week", "هذا الأسبوع"], ["month", "هذا الشهر"], ["all", "طول الوقت"]] as const;
const hrs = (min: number) => `${+(min / 60).toFixed(1)} س`;

function ProfilePage() {
  const { userId } = Route.useParams();
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("all");
  const { data: p, isLoading } = useQuery({ queryKey: ["profile", userId], queryFn: () => getPublicProfile({ data: { userId } }), refetchInterval: 5_000 });
  const copy = () => { navigator.clipboard.writeText(window.location.href); toast.success("تم نسخ رابط البروفايل"); };

  return (
    <div dir="rtl" className="member-main min-h-screen">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="member-brand font-display mb-4 inline-block">👑 <span className="text-gold">Spire</span></Link>
        {isLoading && <p className="text-muted-foreground">جاري التحميل…</p>}
        {!isLoading && !p && <div className="panel p-8 text-center">ما لقينا هذا العضو.</div>}
        {p && (
          <>
            <div className={`pf-cover ${cosmeticClass("pbg", p.background)}`} style={p.color && !p.background ? { background: `linear-gradient(135deg, ${p.color}, transparent)` } : undefined} />
            <div className="pf-head">
              <span className={`pf-avatar-wrap rounded-full ${cosmeticClass("pfr", p.frame)}`}>{p.avatar ? <img src={p.avatar} alt="" className="pf-avatar" style={p.color ? { borderColor: p.color } : undefined} /> : <span className="pf-avatar block" />}</span>
              <div className="min-w-0 flex-1 pb-2">
                <h1 className="font-display text-3xl"><span className={cosmeticClass("nfx", p.effect)} style={p.color && !p.effect ? { color: p.color } : undefined}>{p.name}</span></h1>
                {p.bio && <p className="text-muted-foreground">{p.bio}</p>}
                <div className="pf-badges mt-2">
                  {p.badges.map((b) => <span key={b.id} className="pf-badge" title={b.name}>{b.emoji}</span>)}
                </div>
              </div>
              <Button variant="gold" onClick={copy}><Copy className="h-4 w-4" /> نسخ رابط البروفايل</Button>
            </div>

            <div className="pf-grid">
              <StatCard icon={Coins} value={fmt(p.credits)} label={`الكريدت · المركز #${p.wealthRank}`} />
              <StatCard icon={Gamepad2} value={fmt(p.wins)} label="مرات الفوز بالألعاب" />
              <StatCard icon={TrendingUp} value={p.level} label="أعلى لفل" />
              <StatCard icon={Server} value={p.serverCount} label="السيرفرات" />
            </div>

            <section className="panel mt-6 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="panel-title">النشاط والفويس</h2>
                <div className="flex flex-wrap gap-1">
                  {PERIODS.map(([k, l]) => <Button key={k} size="sm" variant={period === k ? "gold" : "outline"} onClick={() => setPeriod(k)}>{l}</Button>)}
                </div>
              </div>
              <div className="pf-grid !mt-0">
                <StatCard icon={Clock} value={`${fmt(p.active[period])} س`} label="ساعات النشاط" />
                <StatCard icon={Mic} value={hrs(p.voice[period])} label="ساعات الفويس" />
              </div>
            </section>

            <section className="panel mt-6 p-5">
              <h2 className="panel-title mb-4"><Award className="h-4 w-4" /> الإنجازات ({p.achievements.filter((a) => a.done).length}/{p.achievements.length})</h2>
              <div className="pf-badges">
                {p.achievements.filter((a) => a.done).map((a) => <span key={a.id} className="pf-badge" title={a.desc}>{a.emoji} {a.name}</span>)}
                {!p.achievements.some((a) => a.done) && <p className="text-muted-foreground">ما فتح إنجازات بعد.</p>}
              </div>
            </section>

            <section className="panel mt-6 p-5">
              <h2 className="panel-title mb-4"><Trophy className="h-4 w-4" /> أكثر السيرفرات تفاعلاً</h2>
              {p.servers.length ? (
                <table className="pf-table">
                  <thead><tr><th>السيرفر</th><th>اللفل</th><th>XP</th></tr></thead>
                  <tbody>
                    {p.servers.map((s) => (
                      <tr key={s.id}>
                        <td><span className="flex items-center gap-2"><GuildIcon name={s.name} icon={s.icon} size="h-8 w-8" /> {s.name}</span></td>
                        <td>{s.level}</td><td dir="ltr">{fmt(s.xp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted-foreground">ما فيه نشاط بعد.</p>}
            </section>
            <p className="mt-4 text-xs text-muted-foreground">يتحدث تلقائياً كل 5 ثواني.</p>
          </>
        )}
      </div>
    </div>
  );
}
