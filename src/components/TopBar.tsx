import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/dashboard.functions";
import { Languages, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <Button variant="outline" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={t("اللغة")}>
      <Languages className="h-4 w-4" /> {lang === "ar" ? "English" : "العربية"}
    </Button>
  );
}

export function TopBar() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-20 w-full items-center justify-between gap-3 px-4 md:px-8">
        <Link to="/" className="font-display text-xl">
          👑 <span className="text-gold">Spire</span>
        </Link>
        <div className="flex items-center gap-3">
          {me?.isOwner && (
            <Button asChild variant="gold" size="sm"><Link to="/admin"><ShieldCheck className="h-4 w-4" /> {t("لوحة التحكم")}</Link></Button>
          )}
          <LangSwitch />
          {me && (
            <>
              {me.avatar && <img src={me.avatar} alt="" className="h-8 w-8 rounded-full" />}
              <span className="hidden text-sm font-semibold sm:inline">{me.name}</span>
              <a href="/api/public/auth/logout" className="text-muted-foreground hover:text-foreground" aria-label={t("تسجيل خروج")}>
                <LogOut className="h-4 w-4" />
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function GuildIcon({ name, icon, size = "h-16 w-16" }: { name: string; icon: string | null; size?: string }) {
  return icon ? (
    <img src={icon} alt="" className={`${size} rounded-2xl`} />
  ) : (
    <div className={`${size} flex items-center justify-center rounded-2xl bg-secondary text-xl font-bold`}>
      {name.slice(0, 2)}
    </div>
  );
}
