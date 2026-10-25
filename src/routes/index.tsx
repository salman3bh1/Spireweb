import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/dashboard.functions";
import { Ticket, Zap, ShieldCheck, ArrowUpRight, Plus, Flame, Users, History, Image, Sparkles, Gift } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useI18n } from "@/lib/i18n";
import mascotAsset from "@/assets/spire-mascot.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spire Bot — لوحة تحكم البوت" },
      { name: "description", content: "سجّل دخولك بالديسكورد وتحكم في إعدادات بوت Spire لكل سيرفر من الموقع." },
      { property: "og:title", content: "Spire Bot — لوحة تحكم البوت" },
      { property: "og:description", content: "تحكم في نظام التكت والاختصارات لسيرفرك من مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: mascotAsset.url },
      { name: "twitter:image", content: mascotAsset.url },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "إشراف بثقة", en: "Moderation, in control", text: "إدارة الأعضاء والتحذيرات والإسكات من مكان واحد.", english: "Members, warnings and moderation, all in one place." },
  { icon: Ticket, title: "تذاكر على طريقتك", en: "Support, your way", text: "خصّص لوحة الدعم والأنواع والصلاحيات لتناسب مجتمعك.", english: "Tailor your support panel, ticket types and permissions." },
  { icon: Zap, title: "أوامر أسرع", en: "Your own shortcuts", text: "اختصارات وردود تلقائية تجعل إدارة السيرفر أسهل.", english: "Command aliases and auto-replies simplify everyday tasks." },
  { icon: Users, title: "مجتمع أكثر تفاعلًا", en: "A more engaged community", text: "تابع الدعوات والنشاط والمستويات في سيرفرك.", english: "Track invitations, activity and levels in your server." },
  { icon: Flame, title: "ستريك يستمر", en: "Keep the streak going", text: "ردود وتذكيرات مخصصة، وترتيب يبرز الأعضاء المتفاعلين.", english: "Custom replies, reminders and rankings for active members." },
  { icon: Image, title: "ترحيب بصورة مخصصة", en: "Custom welcome cards", text: "صور ترحيب بألوانك وخلفيتك تطلع لكل عضو جديد.", english: "Welcome cards with your colors and background for every new member." },
  { icon: Sparkles, title: "فواصل بعد الرسائل", en: "Message dividers", text: "أكثر من 40 فاصل متحرك تختار ألوانه بنفسك.", english: "40+ animated dividers in the colors you choose." },
  { icon: History, title: "سجل كامل للتعديلات", en: "Full activity history", text: "كل تعديل يسويه فريقك محفوظ مع الوقت والشخص.", english: "Every change your team makes is saved with who and when." },
  { icon: Gift, title: "قيف أواي وغرف مؤقتة", en: "Giveaways & temp voice", text: "أنشئ القيف أواي والرومات الصوتية المؤقتة بضغطة.", english: "Launch giveaways and temporary voice rooms in one click." },
];
const marquee = ["التكت", "الترحيب", "اللوق", "الحماية", "الستريك", "المستويات", "الفواصل", "الردود التلقائية", "الموسيقى", "الإيمبد", "الكلمات المحظورة", "الرولات التلقائية"];
const marqueeEn = ["Tickets", "Welcome", "Logs", "Protection", "Streaks", "Levels", "Dividers", "Auto replies", "Music", "Embeds", "Banned words", "Auto roles"];

function Index() {
  const { lang } = useI18n();
  const copy = (ar: string, en: string) => lang === "ar" ? ar : en;
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setErr(new URLSearchParams(window.location.search).get("error")), []);
  return (
    <><TopBar /><main className="spire-home">
      <section className="spire-hero spire-reveal">
      <img src={mascotAsset.url} width={1024} height={1024} alt="Spire" className="spire-mascot" />
      <span className="spire-eyebrow">{copy("أفضل بوت متكامل لخادمك", "THE ALL-IN-ONE BOT FOR YOUR SERVER")}</span>
      <h1 className="spire-title font-display">Spire <span className="text-primary">Bot</span></h1>
      <p className="spire-subtitle">{copy("كل ما يحتاجه خادمك في مكان واحد", "Everything your server needs, in one place")}</p>
      {err && <p role="alert" className="mt-4 text-destructive">{copy("تعذر تسجيل الدخول. حاول مرة أخرى.", "Sign-in failed. Please try again.")}</p>}
      <div className="spire-actions">
        <Button asChild variant="gold" size="lg"><a href="https://discord.com/oauth2/authorize?client_id=1557375124527779842&permissions=8&integration_type=0&scope=bot" target="_blank" rel="noreferrer"><Plus />{copy("أضف Spire لسيرفرك", "Add Spire to your server")}</a></Button>
        {me ? (
          <Button asChild variant="outline" size="lg">
            <Link to="/home">{copy("لوحة التحكم", "Control panel")}<ArrowUpRight /></Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="lg">
            <a href="/api/public/auth/login" target="_top">{copy("تسجيل الدخول بديسكورد", "Sign in with Discord")}<ArrowUpRight /></a>
          </Button>
        )}
      </div>
      </section>
      <div className="spire-stats spire-reveal" style={{ animationDelay: ".15s" }}>
        {[["+40", copy("ميزة جاهزة", "Ready features")], ["10K+", copy("سيرفر بدون تأخير", "Servers, no lag")], ["24/7", copy("يشتغل دائمًا", "Always online")], ["0", copy("أوامر تحتاج تكتبها", "Commands to type")]].map(([n, l]) => <div key={l} className="spire-stat"><b>{n}</b><span>{l}</span></div>)}
      </div>
      <div className="spire-marquee" aria-hidden="true"><div className="spire-marquee-track">{[...(lang === "ar" ? marquee : marqueeEn), ...(lang === "ar" ? marquee : marqueeEn)].map((m, i) => <span key={i}>{m}</span>)}</div></div>
      <div className="spire-section-heading"><h2>{copy("مجتمعك يستحق الأفضل", "Built around your community")}</h2><span className="text-sm text-muted-foreground">{copy("من الإدارة إلى التفاعل", "From management to engagement")}</span></div>
      <div className="spire-feature-grid">
        {features.map((f, i) => (
          <div key={f.title} className="spire-feature spire-reveal text-start" style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
            <f.icon />
            <h3>{copy(f.title, f.en)}</h3>
            <p>{copy(f.text, f.english)}</p>
          </div>
        ))}
      </div>
      <section className="spire-cta"><h2>{copy("جاهز ترتقي بسيرفرك؟", "Ready to level up your server?")}</h2><p>{copy("أضف البوت وابدأ تعدّل كل شي من الموقع خلال دقيقة.", "Add the bot and start customizing everything in a minute.")}</p>
        <Button asChild variant="gold" size="lg"><a href="https://discord.com/oauth2/authorize?client_id=1557375124527779842&permissions=8&integration_type=0&scope=bot" target="_blank" rel="noreferrer"><Plus />{copy("أضف Spire الآن", "Add Spire now")}</a></Button></section>
      <footer className="spire-footer"><span>Spire Bot</span><span>{copy("صُنع لمجتمعك", "Made for your community")}</span></footer>
    </main></>
  );
}
