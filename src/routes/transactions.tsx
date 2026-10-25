import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Coins, LayoutGrid, List, Receipt, Search, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell, PageHeader, StatCard, ago, fmt } from "@/components/AppShell";
import { listTransactions } from "@/lib/economy.functions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "سجل العمليات — Spire" },
      { name: "description", content: "كل تحويلات الكريدت والإيداعات والسحوبات الخاصة بك مع البحث." },
      { property: "og:title", content: "سجل العمليات — Spire" },
      { property: "og:description", content: "كل تحويلات الكريدت والإيداعات والسحوبات الخاصة بك مع البحث." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransactionsPage,
});

type Kind = "all" | "transfer" | "daily" | "admin" | "game";
type Dir = "all" | "in" | "out";
type Sort = "new" | "old" | "big";
const KIND_LABEL: Record<string, string> = { transfer: "تحويل", daily: "مكافأة يومية", admin: "من الإدارة", game: "ألعاب" };

function TransactionsPage() {
  const [kind, setKind] = useState<Kind>("all");
  const [direction, setDirection] = useState<Dir>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [view, setView] = useState<"table" | "grid">("table");
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);
  const { data, isLoading } = useQuery({
    queryKey: ["tx", kind, direction, sort, dq],
    queryFn: () => listTransactions({ data: { kind, direction, sort, q: dq } }),
    placeholderData: keepPreviousData, retry: false, refetchInterval: 5_000,
  });
  const party = (id: string | null, name: string | null, avatar: string | null, fallback: string) => (
    <div className="tx-party">
      {avatar ? <img src={avatar} alt="" /> : <span className="tx-party-ph">{(name ?? fallback).slice(0, 1)}</span>}
      <div><strong>{id ? name ?? id : fallback}</strong>{id && <small>{id}</small>}</div>
    </div>
  );
  return (
    <AppShell>
      <PageHeader eyebrow="ECONOMY MODULE" icon={Receipt} title="سجل عمليات الكريدت" subtitle="تتبع جميع تحويلاتك بكل شفافية ومراقبة تفاصيل الإيداعات والسحوبات." />
      <div className="member-stats">
        <StatCard icon={Coins} value={data ? fmt(data.credits) : "—"} label="الرصيد الحالي" />
        <StatCard icon={Receipt} value={data ? fmt(data.count) : "—"} label="عدد العمليات" />
        <StatCard icon={ArrowUpCircle} value={data ? fmt(data.withdrawals) : "—"} label="إجمالي السحوبات" />
        <StatCard icon={ArrowDownCircle} value={data ? fmt(data.deposits) : "—"} label="إجمالي الإيداعات" />
      </div>
      <div className="tx-filters">
        <label className="tx-search"><Search className="h-4 w-4" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الآيدي أو المبلغ…" aria-label="بحث" /></label>
        <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <SelectTrigger aria-label="النوع"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem><SelectItem value="transfer">تحويلات</SelectItem>
            <SelectItem value="daily">المكافأة اليومية</SelectItem><SelectItem value="admin">من الإدارة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={direction} onValueChange={(v) => setDirection(v as Dir)}>
          <SelectTrigger aria-label="الاتجاه"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">وارد وصادر</SelectItem><SelectItem value="in">الوارد فقط</SelectItem><SelectItem value="out">الصادر فقط</SelectItem></SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger aria-label="الترتيب"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="new">الأحدث أولاً</SelectItem><SelectItem value="old">الأقدم أولاً</SelectItem><SelectItem value="big">الأكبر مبلغاً</SelectItem></SelectContent>
        </Select>
        <div className="tx-view">
          <button className={view === "table" ? "is-on" : ""} onClick={() => setView("table")}><List className="h-4 w-4" /> جدول</button>
          <button className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /> شبكة</button>
        </div>
      </div>
      {isLoading && <div className="member-panel h-32 animate-pulse" />}
      {data && !data.rows.length && <div className="member-panel text-center text-muted-foreground">ما فيه عمليات تطابق البحث.</div>}
      {data && data.rows.length > 0 && view === "table" && (
        <div className="tx-table-wrap">
          <table className="tx-table">
            <thead><tr><th>من</th><th>التاريخ</th><th>المبلغ</th><th>الرصيد بعد</th><th>إلى</th></tr></thead>
            <tbody>
              {data.rows.map((r) => {
                const incoming = r.to_id === data.me;
                const after = incoming ? r.to_balance : r.from_balance;
                return (
                  <tr key={r.id}>
                    <td>{party(r.from_id, r.from_name, r.from_avatar, r.kind === "daily" ? "المكافأة اليومية" : "نظام الكريدت")}</td>
                    <td><strong>{new Date(r.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</strong><small>{ago(r.created_at)}</small></td>
                    <td className={incoming ? "text-success" : "text-destructive"}><strong>{incoming ? "+" : "−"}{fmt(r.amount)}</strong><small>{KIND_LABEL[r.kind] ?? r.kind}</small></td>
                    <td>{after == null ? "—" : <strong className="inline-flex items-center gap-1">{incoming ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{fmt(after)}</strong>}</td>
                    <td>{party(r.to_id, r.to_name, r.to_avatar, "نظام الكريدت")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && data.rows.length > 0 && view === "grid" && (
        <div className="tx-grid">
          {data.rows.map((r) => {
            const incoming = r.to_id === data.me;
            return (
              <div key={r.id} className="member-panel tx-card">
                <strong className={incoming ? "text-success text-2xl" : "text-destructive text-2xl"}>{incoming ? "+" : "−"}{fmt(r.amount)}</strong>
                <span className="text-muted-foreground text-sm">{KIND_LABEL[r.kind] ?? r.kind} · {ago(r.created_at)}</span>
                <span className="text-sm">{incoming ? `من ${r.from_name ?? (r.kind === "daily" ? "المكافأة اليومية" : "النظام")}` : `إلى ${r.to_name ?? "النظام"}`}</span>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
