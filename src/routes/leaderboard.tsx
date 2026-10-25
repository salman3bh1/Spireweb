import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Coins, Crown, Mic, PenLine, Target } from "lucide-react";
import { getLeaderboard } from "@/lib/economy.functions";
import { AppShell, fmt, short } from "@/components/AppShell";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "قائمة الشرف — Spire" },
      { name: "description", content: "توب الأثرياء وتوب التفاعل الكتابي والصوتي عبر كل المجتمعات." },
      { property: "og:title", content: "قائمة الشرف — Spire" },
      { property: "og:description", content: "توب الأثرياء وتوب التفاعل الكتابي والصوتي عبر كل المجتمعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeaderboardPage,
});

type Kind = "wealth" | "interaction";
type Mode = "both" | "text" | "voice";
type Period = "all" | "month" | "week" | "day";
const MODES: [Mode, string][] = [["both", "شامل"], ["text", "كتابي"], ["voice", "صوتي"]];
const PERIODS: [Period, string][] = [["all", "كل الأوقات"], ["month", "شهري"], ["week", "أسبوعي"], ["day", "يومي"]];

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="lb-medal lb-gold"><Crown className="h-5 w-5" /></span>;
  if (rank === 2) return <span className="lb-medal lb-silver"><Award className="h-5 w-5" /></span>;
  if (rank === 3) return <span className="lb-medal lb-bronze"><Award className="h-5 w-5" /></span>;
  return <span className="lb-medal lb-num">{rank || "—"}</span>;
}

type RowT = { id: string; name: string; avatar: string | null; value: number; text: number | null; voice: number | null };

function LbRow({ r, rank, me, unit, caption, sticky }: { r: RowT; rank: number; me: boolean; unit: string; caption: string; sticky?: boolean }) {
  return (
    <li className={`lb-row ${me ? "is-me" : ""} ${sticky ? "lb-me-sticky" : ""}`}>
      <Medal rank={rank} />
      {r.avatar ? <img src={r.avatar} alt="" className="lb-avatar" /> : <span className="lb-avatar" />}
      <div className="min-w-0">
        <strong className="lb-name">{me && <em>YOU</em>}{r.name}</strong>
        {r.text !== null && (
          <div className="lb-sub">
            <span><PenLine className="h-3.5 w-3.5" /> {fmt(r.text)}</span>
            <span><Mic className="h-3.5 w-3.5" /> {fmt(r.voice ?? 0)}</span>
          </div>
        )}
      </div>
      <div className="lb-value"><b>{short(r.value)}</b><small>{unit}</small><span>{caption}</span></div>
    </li>
  );
}

function LeaderboardPage() {
  const [kind, setKind] = useState<Kind>("wealth");
  const [mode, setMode] = useState<Mode>("both");
  const [period, setPeriod] = useState<Period>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["lb", kind, mode, period],
    queryFn: () => getLeaderboard({ data: { kind, mode, period } }),
    retry: false, refetchInterval: 5_000,
  });
  const unit = kind === "wealth" ? "كريدت" : "XP";
  const caption = kind === "wealth" ? "WEALTH INDEX" : `${MODES.find((m) => m[0] === mode)?.[1]} · ${PERIODS.find((p) => p[0] === period)?.[1]}`;
  const meInTop = data?.rows.some((r) => r.id === data.me.id);

  return (
    <AppShell>
      <header className="lb-head">
        <h1 className="font-display">قائمة <span className="text-gold">الشرف</span></h1>
        <p>تنافس مع أفضل الأعضاء عبر كافة المجتمعات واستعرض قوتك الحقيقية.</p>
      </header>
      <div className="lb-tabs" role="tablist">
        <button role="tab" aria-selected={kind === "wealth"} className={kind === "wealth" ? "is-on" : ""} onClick={() => setKind("wealth")}><Coins className="h-4 w-4" /> توب الأثرياء</button>
        <button role="tab" aria-selected={kind === "interaction"} className={kind === "interaction" ? "is-on" : ""} onClick={() => setKind("interaction")}><Target className="h-4 w-4" /> توب التفاعل</button>
      </div>
      {kind === "interaction" && (
        <div className="lb-filters">
          <div className="lb-seg" role="group" aria-label="نوع التفاعل">
            {MODES.map(([id, label]) => <button key={id} aria-pressed={mode === id} className={mode === id ? "is-on" : ""} onClick={() => setMode(id)}>{label}</button>)}
          </div>
          <div className="lb-seg" role="group" aria-label="الفترة">
            {PERIODS.map(([id, label]) => <button key={id} aria-pressed={period === id} className={period === id ? "is-on" : ""} onClick={() => setPeriod(id)}>{label}</button>)}
          </div>
        </div>
      )}
      <ol className="lb-list">
        {isLoading && Array.from({ length: 5 }, (_, i) => <li key={i} className="lb-row lb-skel" />)}
        {data?.rows.map((r, i) => <LbRow key={r.id} r={r} rank={i + 1} me={r.id === data.me.id} unit={unit} caption={caption} />)}
        {data && !data.rows.length && <li className="lb-empty">ما فيه بيانات للحين — تنضاف أول ما يرسلها البوت.</li>}
        {data && !meInTop && (
          <LbRow r={{ ...data.me, avatar: data.me.avatar ?? null }} rank={data.me.rank} me sticky unit={unit} caption={caption} />
        )}
      </ol>
    </AppShell>
  );
}
