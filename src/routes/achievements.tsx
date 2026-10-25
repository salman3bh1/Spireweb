import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { AppShell, PageHeader, fmt } from "@/components/AppShell";
import { getMyAchievements } from "@/lib/profile.functions";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "الإنجازات — Spire" },
      { name: "description", content: "كل الإنجازات وتقدّمك فيها: الرسائل، الفويس، الألعاب، الكريدت والمزيد." },
      { property: "og:title", content: "الإنجازات — Spire" },
      { property: "og:description", content: "كل الإنجازات وتقدّمك فيها: الرسائل، الفويس، الألعاب، الكريدت والمزيد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["achievements"], queryFn: () => getMyAchievements(), retry: false, refetchInterval: 15_000 });
  const done = data?.achievements.filter((a) => a.done).length ?? 0;
  return (
    <AppShell>
      <PageHeader eyebrow="ACHIEVEMENTS" icon={Award} title="الإنجازات" subtitle={`فتحت ${done} من ${data?.achievements.length ?? 0} إنجاز`} />
      {isLoading && <div className="member-panel h-40 animate-pulse" />}
      <div className="ach-grid">
        {data?.achievements.map((a) => (
          <div key={a.id} className="panel ach-card" data-done={a.done || undefined}>
            <span className="ach-emoji">{a.emoji}</span>
            <div className="min-w-0 flex-1">
              <b className="block">{a.name}</b>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
              <div className="ach-bar"><i style={{ width: `${a.pct}%` }} /></div>
              <span className="text-xs text-muted-foreground" dir="ltr">{fmt(Math.min(a.value, a.goal))} / {fmt(a.goal)}</span>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
