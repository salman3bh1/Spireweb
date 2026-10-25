import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Clock, Coins, Gift, History, Hourglass, Sparkles, TrendingUp } from "lucide-react";
import { AppShell, PageHeader, fmt } from "@/components/AppShell";
import { claimDaily, getDaily } from "@/lib/economy.functions";
import { nextClaimAt, DAILY_MIN, DAILY_MAX, DAILY_COOLDOWN_MS } from "@/lib/daily-reward";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "المكافأة اليومية — Spire" },
      { name: "description", content: "استلم كل 24 ساعة كريدت عشوائي من 1,000 إلى 5,000 وتابع سجل مكافآتك." },
      { property: "og:title", content: "المكافأة اليومية — Spire" },
      { property: "og:description", content: "استلم كل 24 ساعة كريدت عشوائي من 1,000 إلى 5,000 وتابع سجل مكافآتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DailyPage,
});

function useCountdown(target: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!target) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [target]);
  if (!target || target <= now) return null;
  const s = Math.floor((target - now) / 1000);
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function DailyPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["daily"], queryFn: () => getDaily(), retry: false, refetchInterval: 5_000 });
  const [won, setWon] = useState<number | null>(null);
  const next = nextClaimAt(data?.lastClaim);
  const left = useCountdown(next);
  const claim = useMutation({
    mutationFn: () => claimDaily(),
    onSuccess: (r) => {
      setWon(r.amount);
      toast.success(`حصلت على ${fmt(r.amount)} كريدت! 🎉`);
      // Start the next 24h countdown immediately, before the refetch lands.
      qc.setQueryData(["daily"], (d: typeof data) => (d ? { ...d, lastClaim: new Date().toISOString() } : d));
      qc.invalidateQueries({ queryKey: ["daily"] }); qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e) => toast.error(String((e as Error).message).includes("TOO_SOON") ? "استلمت مكافأتك، ارجع بعد 24 ساعة" : "صار خطأ، جرب مرة ثانية"),
  });
  const avg = data && data.history.length ? Math.round(data.total / data.history.length) : 0;
  const pct = next ? Math.max(0, Math.min(100, Math.round(100 - ((next - Date.now()) / DAILY_COOLDOWN_MS) * 100))) : 100;
  return (
    <AppShell>
      <PageHeader eyebrow="ECONOMY MODULE" icon={Sparkles} title="المكافأة اليومية" subtitle={`احصل على مكافأة يومية عشوائية من ${fmt(DAILY_MIN)} إلى ${fmt(DAILY_MAX)} كريدت كل 24 ساعة.`} />
      <section className="dr-main">
        <div className="dr-intro">
          <span className="daily-gift"><Gift className="h-12 w-12" /></span>
          <h2>المكافأة اليومية</h2>
          <p className="text-muted-foreground">كل 24 ساعة فرصة جديدة للحصول على رصيد.</p>
          <div className="dr-feat"><i><Coins className="h-4 w-4" /></i><div><b>مكافأة عشوائية</b><small>المبلغ عشوائي بين {fmt(DAILY_MIN)} و {fmt(DAILY_MAX)}</small></div></div>
          <div className="dr-feat"><i><Clock className="h-4 w-4" /></i><div><b>كل 24 ساعة</b><small>مرة واحدة يومياً بعد انتهاء المؤقت</small></div></div>
        </div>
        <div className="dr-side">
          <div className="dr-status">
            <div><small>عمر الحساب</small><b>صالح</b></div>
            <div><small>حالة الحظر</small><b>غير محظور</b></div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs"><span>تقدم المكافأة</span><span dir="ltr">{pct}%</span></div>
            <div className="dr-bar"><span style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="dr-timer">
            {left ? <><small className="text-muted-foreground">الوقت المتبقي</small><b>{left}</b><small className="text-muted-foreground">{won !== null ? `حصلت على +${fmt(won)} 🎉 — المكافأة الجاية بعد المؤقت` : "انتظر حتى انتهاء المؤقت"}</small></>
              : <><small className="text-muted-foreground">جاهزة</small><b className="text-gold">🎁</b><small className="text-muted-foreground">مكافأتك جاهزة للاستلام</small></>}
          </div>
          <Button variant={left ? "secondary" : "gold"} size="lg" disabled={!data || !!left || claim.isPending} onClick={() => claim.mutate()}>
            {left ? <><Hourglass className="h-4 w-4" /> غير متاح حالياً</> : <><Sparkles className="h-4 w-4" /> {claim.isPending ? "جاري الاستلام…" : "استلم المكافأة"}</>}
          </Button>
        </div>
      </section>
      <div className="dr-stats">
        <div className="dr-stat"><h3><TrendingUp className="h-4 w-4" /> نطاق المكافأة</h3><b>{fmt(DAILY_MIN)} - {fmt(DAILY_MAX)}</b><small>مكافأة عشوائية ضمن هذا النطاق</small></div>
        <div className="dr-stat"><h3><Hourglass className="h-4 w-4" /> وقت الانتظار</h3><b>24 ساعة</b><small>بين كل مكافأة والتي تليها</small></div>
        <div className="dr-stat"><h3><BarChart3 className="h-4 w-4" /> متوسط المكافأة</h3><b>{fmt(avg)}</b><small>متوسط المكافآت السابقة</small></div>
      </div>
      <section className="member-panel">
        <div className="flex items-center justify-between"><h2><span className="member-panel-icon"><History className="h-4 w-4" /></span> سجل المكافآت الأخير</h2><small className="text-muted-foreground">آخر {data?.history.slice(0, 10).length ?? 0} مكافآت</small></div>
        {data && !data.history.length && <p className="text-muted-foreground">ما استلمت أي مكافأة للحين.</p>}
        {data?.history.slice(0, 10).map((r) => (
          <div key={r.id} className="dr-hist-row">
            <div><b dir="ltr">+{fmt(r.amount)}</b><small className="block text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</small></div>
            <span className={`dr-pill ${r.applied ? "" : "is-wait"}`}>{r.applied ? "تم الاستلام" : "بانتظار البوت"}</span>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
