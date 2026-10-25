import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Coins, Crown, Mic, PenLine, Star, Trophy, UserRound } from "lucide-react";
import { AppShell, PageHeader, StatCard, fmt } from "@/components/AppShell";
import { getHome } from "@/lib/economy.functions";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "نظرة عامة — Spire" },
      { name: "description", content: "رصيدك وترتيبك ونشاطك الكتابي والصوتي في كل السيرفرات." },
      { property: "og:title", content: "نظرة عامة — Spire" },
      { property: "og:description", content: "رصيدك وترتيبك ونشاطك الكتابي والصوتي في كل السيرفرات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function Row({ label, value }: { label: string; value: string }) {
  return <div className="member-row"><span>{label}</span><strong>{value}</strong></div>;
}

function HomePage() {
  const { data } = useQuery({ queryKey: ["home"], queryFn: () => getHome(), retry: false, refetchInterval: 5_000 });
  const hours = data ? Math.floor(data.voiceSeconds / 3600) : 0;
  const mins = data ? Math.floor((data.voiceSeconds % 3600) / 60) : 0;
  return (
    <AppShell>
      <PageHeader title={<>مرحباً، <span className="text-gold">{data?.me.name ?? "…"}</span> 👋</>} subtitle="لوحة التحكم الخاصة بك. تابع نشاطك وتأثيرك في جميع المجتمعات." />
      {data && (
        <Link to="/u/$userId" params={{ userId: data.me.id }} className="profile-cta group">
          <span className="profile-cta-avatar">{data.me.avatar ? <img src={data.me.avatar} alt="" /> : <UserRound className="h-7 w-7" />}</span>
          <span className="min-w-0 flex-1">
            <b className="font-display block text-lg">بروفايلي العام</b>
            <span className="text-sm text-muted-foreground">شوف بروفايلك بالخلفية والإطار والعلامات، وانسخ الرابط لأصحابك</span>
          </span>
          <ArrowLeft className="profile-cta-arrow h-5 w-5" />
        </Link>
      )}
      <div className="member-stats">
        <StatCard icon={Coins} value={data ? fmt(data.credits) : "—"} label="رصيد الكريدت" />
        <StatCard icon={Crown} value={data ? `#${fmt(data.wealthRank)}` : "—"} label="ترتيبك العالمي" />
        <StatCard icon={Star} value={data ? fmt(data.xp) : "—"} label="مجموع نقاط XP" />
        <StatCard icon={Trophy} value={data ? (data.interactionRank ? `#${fmt(data.interactionRank)}` : "—") : "—"} label="ترتيب التفاعل" />
      </div>
      {data && data.pendingDaily > 0 && <p className="member-note">⏳ {fmt(data.pendingDaily)} كريدت من المكافأة اليومية في الطريق لرصيدك (تنضاف أول ما يكون البوت شغال).</p>}
      <div className="member-grid-2">
        <section className="member-panel">
          <h2><span className="member-panel-icon"><PenLine className="h-4 w-4" /></span> النشاط الكتابي</h2>
          <Row label="الرسائل" value={data ? fmt(data.messages) : "—"} />
          <Row label="نقاط XP" value={data ? fmt(data.xp) : "—"} />
          <Row label="أعلى لفل" value={data ? String(data.maxLevel) : "—"} />
        </section>
        <section className="member-panel">
          <h2><span className="member-panel-icon"><Mic className="h-4 w-4" /></span> النشاط الصوتي</h2>
          <Row label="الوقت في الرومات الصوتية" value={data ? `${hours} ساعة ${mins} دقيقة` : "—"} />
          <Row label="بالدقائق" value={data ? fmt(Math.floor(data.voiceSeconds / 60)) : "—"} />
        </section>
      </div>
    </AppShell>
  );
}
