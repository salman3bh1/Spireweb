import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Award, Backpack, Calendar, Gift, LayoutGrid, LogOut, Megaphone, Receipt, Server, ShieldCheck, ShoppingBag, TerminalSquare, Trophy } from "lucide-react";
import { getMe, listGuilds } from "@/lib/dashboard.functions";
import { GuildIcon } from "@/components/TopBar";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "إدارة السيرفرات", icon: Server },
  { to: "/home", label: "النظرة العامة", icon: LayoutGrid },
  { to: "/leaderboard", label: "لوحة المتصدرين", icon: Trophy },
  { to: "/updates", label: "آخر التحديثات", icon: Megaphone },
  { to: "/daily", label: "المكافأة اليومية", icon: Gift },
  { to: "/transactions", label: "سجل العمليات", icon: Receipt },
  { to: "/shop", label: "المتجر", icon: ShoppingBag },
  { to: "/inventory", label: "حقيبتي", icon: Backpack },
  { to: "/achievements", label: "الإنجازات", icon: Award },
  { to: "/commands", label: "الأوامر", icon: TerminalSquare },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
  const { data: guilds } = useQuery({ queryKey: ["guilds"], queryFn: () => listGuilds(), retry: false, enabled: !!me });
  const path = useLocation({ select: (l) => l.pathname });

  if (!isLoading && !me) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center px-4">
        <div className="panel max-w-md p-8 text-center">
          <p className="mb-4 text-lg font-bold">لازم تسجل دخولك أول.</p>
          <Button asChild variant="gold"><a href="/api/public/auth/login" target="_top">تسجيل الدخول بديسكورد</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="member-shell">
      <header className="member-top">
        <Link to="/" className="member-brand font-display">👑 <span className="text-gold">Spire</span></Link>
        <span className="member-online"><i /> SYSTEM ONLINE</span>
      </header>
      <aside className="member-rail" aria-label="سيرفراتك">
        {me?.avatar ? <img src={me.avatar} alt="" className="member-rail-me" /> : <span className="member-rail-me" />}
        {guilds?.withBot.map((g) => (
          <Link key={g.id} to="/dashboard/$guildId" params={{ guildId: g.id }} search={{ section: "overview" }} title={g.name} className="member-rail-guild">
            <GuildIcon name={g.name} icon={g.icon} size="h-11 w-11" />
          </Link>
        ))}
      </aside>
      <nav className="member-side">
        <div className="member-user">
          {me?.avatar ? <img src={me.avatar} alt="" /> : <span className="member-user-ph" />}
          <strong>{me?.name ?? "…"}</strong>
        </div>
        <ul>
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className={`member-link ${path === to || (to !== "/dashboard" && path.startsWith(to)) ? "is-active" : ""}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            </li>
          ))}
          {me?.isOwner && (
            <li><Link to="/admin" className={`member-link ${path === "/admin" ? "is-active" : ""}`}><ShieldCheck className="h-4 w-4" /> لوحة التحكم</Link></li>
          )}
        </ul>
        <a href="/api/public/auth/logout" className="member-logout"><LogOut className="h-4 w-4" /> تسجيل خروج</a>
      </nav>
      <main className="member-main">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, icon: Icon = Calendar }: { eyebrow?: string; title: ReactNode; subtitle?: string; icon?: typeof Calendar }) {
  return (
    <header className="member-head">
      {eyebrow && <span className="member-eyebrow"><Icon className="h-3.5 w-3.5" /> {eyebrow}</span>}
      <h1 className="font-display">{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

export function StatCard({ icon: Icon, value, label }: { icon: typeof Calendar; value: ReactNode; label: string }) {
  return (
    <div className="member-stat">
      <span className="member-stat-icon"><Icon className="h-5 w-5" /></span>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export const fmt = (n: number) => n.toLocaleString("en");
export const short = (n: number) => n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : String(n);
export function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `قبل ${s} ثانية`;
  if (s < 3600) return `قبل ${Math.round(s / 60)} دقيقة`;
  if (s < 86400) return `قبل ${Math.round(s / 3600)} ساعة`;
  return `قبل ${Math.round(s / 86400)} يوم`;
}
