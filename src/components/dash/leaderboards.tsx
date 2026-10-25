import { useT as useSpireTranslation } from "@/lib/i18n";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Flame, Trophy, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGlobalLeaderboards } from "@/lib/leaderboards.functions";
import { PageHeader, type GuildData } from "./kit";

type Kind = "activity" | "credits" | "streak";
const tabs = [{ id: "activity", label: "الأكثر تفاعلًا", icon: TrendingUp }, { id: "credits", label: "الأكثر كريدت", icon: Coins }, { id: "streak", label: "توب الستريك", icon: Flame }] as const;
type Row = { id: string; name: string; avatar?: string | null | undefined; score: number; detail?: string };

export function Leaderboards({ data, guildId }: { data: GuildData; guildId: string }) {
  const __tr = useSpireTranslation();

  const [kind, setKind] = useState<Kind>("activity");
  const [scope, setScope] = useState<"guild" | "global">("guild");
  const [page, setPage] = useState(0);
  const global = useQuery({ queryKey: ["global-leaderboards", guildId], queryFn: () => getGlobalLeaderboards({ data: { guildId } }), enabled: scope === "global" && kind !== "activity", staleTime: 60000, retry: false });
  const globalScope = kind !== "activity" && scope === "global";
  const rows: Row[] = kind === "activity"
    ? data.activityTop.map(r => ({ ...r, score: r.xp, detail: `المستوى ${r.level}` }))
    : kind === "credits"
      ? (globalScope ? global.data?.creditTop ?? [] : data.creditTop).map(r => ({ ...r, score: r.credits }))
      : (globalScope ? global.data?.streakTop ?? [] : data.streakTop).map(r => ({ ...r, score: r.streak, detail: `أفضل ستريك: ${r.best}` }));
  const ranked = [...rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 100);
  const pages = Math.max(1, Math.ceil(ranked.length / 20));
  const currentPage = Math.min(page, pages - 1);
  const label = kind === "activity" ? "XP" : kind === "credits" ? "كريدت" : "يوم";
  return <>
    <PageHeader title={__tr("المستويات والترتيب")} />
    <div className="leaderboard-tabs mb-5" role="tablist" aria-label={__tr("نوع الترتيب")}>
      {tabs.map(tab => <Button key={tab.id} role="tab" aria-selected={kind === tab.id} variant={kind === tab.id ? "gold" : "secondary"} onClick={() => { setKind(tab.id); setPage(0); }}><tab.icon />{__tr(tab.label)}</Button>)}
    </div>
    <div className="leaderboard-controls mb-6">
      {kind !== "activity" && <div className="flex flex-wrap gap-2" role="group" aria-label={__tr("نطاق الترتيب")}>
        <Button variant={scope === "guild" ? "default" : "outline"} aria-pressed={scope === "guild"} onClick={() => { setScope("guild"); setPage(0); }}>{__tr("هذا السيرفر")}</Button>
        <Button variant={scope === "global" ? "default" : "outline"} aria-pressed={scope === "global"} onClick={() => { setScope("global"); setPage(0); }}>{__tr("جميع السيرفرات")}</Button>
      </div>}
      <span className="text-sm text-muted-foreground">{globalScope ? __tr("جميع السيرفرات") : data.guild.name} {__tr("· أفضل 100")}</span>
    </div>
    <div role="tabpanel" aria-label={__tr(tabs.find(t => t.id === kind)?.label)} className="min-h-96">
      {globalScope && global.isPending ? <p className="py-16 text-center text-muted-foreground">{__tr("جاري تحميل الترتيب…")}</p> : globalScope && global.isError ? <div className="py-16 text-center"><p className="mb-4 text-destructive">{__tr("تعذر تحميل الترتيب العام.")}</p><Button variant="outline" onClick={() => global.refetch()}>{__tr("إعادة المحاولة")}</Button></div> : !ranked.length ? <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground"><Trophy className="h-9 w-9" /><p>{(globalScope ? global.data?.updatedAt : data.telemetryAt) ? __tr("لا توجد أسماء في هذا الترتيب بعد.") : __tr("بانتظار وصول بيانات الترتيب من البوت.")}</p></div> : <>
        <table className="leaderboard-table"><thead><tr><th className="rank-column">{__tr("الترتيب")}</th><th>{__tr("العضو")}</th><th className="score-column">{__tr(label)}</th></tr></thead><tbody>
          {ranked.slice(currentPage * 20, currentPage * 20 + 20).map((row, index) => <tr key={row.id}><td className={currentPage === 0 && index < 3 ? "text-primary font-bold" : "text-muted-foreground"}><span dir="ltr">#{currentPage * 20 + index + 1}</span></td><td><div className="flex min-w-0 items-center gap-3">{row.avatar ? <img src={row.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">{row.name.slice(0, 1)}</span>}<div className="member-name min-w-0"><b>{row.name}</b>{row.detail && <p className="text-xs text-muted-foreground">{row.detail}</p>}</div></div></td><td className="score-column font-mono font-bold">{row.score.toLocaleString("en-US")}</td></tr>)}
        </tbody></table>
        <div className="mt-5 flex items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{currentPage + 1} / {pages} · {ranked.length} {__tr("عضو")}</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label={__tr("الصفحة السابقة")} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronRight /></Button><Button variant="outline" size="icon" aria-label={__tr("الصفحة التالية")} disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronLeft /></Button></div></div>
      </>}
    </div>
  </>;
}