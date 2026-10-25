import { useT as useSpireTranslation } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listGuilds } from "@/lib/dashboard.functions";
import { TopBar, GuildIcon } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "سيرفراتك — Spire Bot" },
      { name: "description", content: "اختر السيرفر اللي تبي تعدل إعدادات البوت فيه." },
      { property: "og:title", content: "سيرفراتك — Spire Bot" },
      { property: "og:description", content: "اختر السيرفر اللي تبي تعدل إعدادات البوت فيه." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Servers,
});

function Servers() {
  const __tr = useSpireTranslation();

  const { data, isLoading, error } = useQuery({ queryKey: ["guilds"], queryFn: () => listGuilds(), retry: false });
  return (
    <>
      <TopBar />
      <main className="servers-page">
        <header className="servers-hero">
          <span className="spire-eyebrow">{__tr("الخطوة 1 من 2")}</span>
          <h1 className="font-display">{__tr("اختر الخادم الخاص بك")}</h1>
          <p>{__tr("تظهر هنا الخوادم التي يمكنك التحكم بها")}</p>
        </header>
        {isLoading && <div className="server-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="server-card server-card-skeleton" />)}</div>}
        {error && (
          <div className="panel mx-auto max-w-md p-8 text-center">
            <p className="mb-4">{__tr("لازم تسجل دخولك أول.")}</p>
            <Button asChild variant="gold"><a href="/api/public/auth/login" target="_top">{__tr("تسجيل الدخول بديسكورد")}</a></Button>
          </div>
        )}
        {data && (
          <>
            <div className="servers-section-title"><h2>{__tr("الخوادم الموجود فيها البوت")}</h2><span>{data.withBot.length}</span></div>
            <div className="server-grid">
              {data.withBot.map((g, i) => (
                <Link key={g.id} to="/dashboard/$guildId" params={{ guildId: g.id }} search={{ section: "overview" }}
                  className="server-card spire-reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                  <span className="server-card-banner" style={g.icon ? { backgroundImage: `url(${g.icon})` } : undefined} />
                  <GuildIcon name={g.name} icon={g.icon} size="h-16 w-16" />
                  <div className="server-card-name">{g.name}</div>
                  <span className="server-card-cta">{__tr("إدارة السيرفر")} <ArrowLeft className="h-4 w-4 rtl-flip" /></span>
                </Link>
              ))}
              {!data.withBot.length && <p className="text-muted-foreground">{__tr("البوت مو موجود بأي سيرفر عندك فيه أدمن.")}</p>}
            </div>
            {data.withoutBot.length > 0 && (
              <>
                <div className="servers-section-title"><h2>{__tr("يمكنك إضافة البوت في هذه الخوادم")}</h2><span>{data.withoutBot.length}</span></div>
                <div className="server-grid">
                  {data.withoutBot.map((g) => (
                    <div key={g.id} className="server-card server-card-muted">
                      <GuildIcon name={g.name} icon={g.icon} size="h-14 w-14" />
                      <div className="server-card-name">{g.name}</div>
                      <Button asChild size="sm" variant="outline">
                        <a target="_blank" rel="noreferrer"
                          href={`https://discord.com/oauth2/authorize?client_id=${data.clientId}&scope=bot%20applications.commands&permissions=8&guild_id=${g.id}`}>
                          <Plus className="h-4 w-4" />{__tr("أضف البوت")}</a>
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
