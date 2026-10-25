import { useState } from "react";
import { MonitorPlay, Plus, Trash2, Youtube, Twitch, Send, Instagram, Music2, Tv, AtSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { creatorSchema, type Creator, type CreatorPlatform, type Modules } from "@/lib/modules.schema";
import { PageHeader, Card, Field, Pick, chanItems, roleItems, type GuildData } from "./kit";

type P = { id: CreatorPlatform; ar: string; en: string; icon: typeof Youtube; ph: string; posts?: [string, string]; live?: boolean; vod?: boolean };
const PLATFORMS: P[] = [
  { id: "youtube", ar: "يوتيوب", en: "YouTube", icon: Youtube, ph: "youtube.com/@channel", posts: ["الفيديوهات الجديدة", "New videos"], live: true },
  { id: "twitch", ar: "تويتش", en: "Twitch", icon: Twitch, ph: "twitch.tv/name", live: true, vod: true },
  { id: "kick", ar: "كيك", en: "Kick", icon: Tv, ph: "kick.com/name", live: true, vod: true },
  { id: "tiktok", ar: "تيك توك", en: "TikTok", icon: Music2, ph: "tiktok.com/@name", posts: ["الفيديوهات الجديدة", "New videos"], live: true },
  { id: "telegram", ar: "تيليجرام", en: "Telegram", icon: Send, ph: "t.me/channel", posts: ["الرسائل الجديدة", "New messages"] },
  { id: "x", ar: "X", en: "X", icon: AtSign, ph: "x.com/name", posts: ["التغريدات الجديدة", "New posts"] },
  { id: "instagram", ar: "انستقرام", en: "Instagram", icon: Instagram, ph: "instagram.com/name", posts: ["البوستات الجديدة", "New posts"], live: true },
];
const byId = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<CreatorPlatform, P>;

const POST_DEFAULT: Partial<Record<CreatorPlatform, string>> = {
  youtube: "📢 {name} نزّل فيديو جديد! {link}",
  tiktok: "🎵 {name} نزّل فيديو جديد على تيك توك! {link}",
  telegram: "✉️ رسالة جديدة من {name}\n{link}",
  x: "{link}",
  instagram: "📸 {name} نزّل بوست جديد! {link}",
};
const LIVE_DEFAULT: Partial<Record<CreatorPlatform, string>> = {
  youtube: "🔴 {name} بدأ بث مباشر على يوتيوب! {link}",
  twitch: "🔴 {name} بدأ بث على تويتش! تعالوا",
  kick: "🔴 حياكم الله، {name} بدأ بث على كيك!",
  tiktok: "🔴 {name} بدأ لايف على تيك توك! {link}",
  instagram: "🔴 {name} بدأ لايف على انستقرام! {link}",
};

export function Creators({ data, m, set }: { data: GuildData; m: Modules; set: <K extends keyof Modules>(key: K, value: Modules[K]) => void }) {
  const { t, lang } = useI18n();
  const L = (p: P) => (lang === "ar" ? p.ar : p.en);
  const cfg = m.creators;
  const [platform, setPlatform] = useState<CreatorPlatform>("youtube");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState<string | null>(null);
  const up = (items: Creator[]) => set("creators", { ...cfg, items });
  const edit = (id: string, v: Partial<Creator>) => up(cfg.items.map((i) => (i.id === id ? { ...i, ...v } : i)));

  const add = () => {
    if (!handle.trim()) { toast.error(t("اكتب رابط القناة أو اسمها")); return; }
    if (cfg.items.length >= 50) { toast.error(t("وصلت الحد الأقصى (50 قناة)")); return; }
    const item = creatorSchema.parse({
      id: crypto.randomUUID().slice(0, 12), platform, handle: handle.trim(), name: name.trim(), channelId,
      postMessage: POST_DEFAULT[platform] ?? undefined, liveMessage: LIVE_DEFAULT[platform] ?? undefined,
    });
    up([item, ...cfg.items]);
    setHandle(""); setName("");
    toast.success(t("انضافت القناة — اضغط حفظ"));
  };

  const mentionItems = [{ id: "everyone", name: "@everyone" }, { id: "here", name: "@here" }, ...roleItems(data)];

  return (
    <>
      <PageHeader title="صناع المحتوى" desc="أول ما ينزل فيديو أو يبدأ بث في قناة من القنوات، البوت يرسل إشعار في الروم اللي تختاره." icon={<MonitorPlay />} enabled={cfg.enabled} onToggle={(enabled) => set("creators", { ...cfg, enabled })} />

      <Card title="أضف قناة">
        <div className="creator-tabs" role="tablist">
          {PLATFORMS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={platform === p.id} data-platform={p.id} onClick={() => setPlatform(p.id)}>
              <p.icon className="h-4 w-4" />{L(p)}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={byId[platform].ph} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("الاسم اللي يطلع (اختياري)")} />
          <Pick value={channelId} onChange={setChannelId} items={chanItems(data)} placeholder="روم الإشعارات" />
          <Button onClick={add}><Plus />{t("أضف")}</Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("تقدر تحط لكل قناة روم مختلف، أو تحطهم كلهم في نفس الروم. البوت يفحص القنوات كل دقيقة ونص تقريبًا.")}</p>
      </Card>

      <div className="mt-5 flex items-center gap-2 font-bold"><span className="panel-title">{t("القنوات")}</span><span className="rounded-full bg-primary/15 px-2 text-sm text-primary">{cfg.items.length}</span></div>

      {!cfg.items.length && (
        <div className="creator-empty">
          <MonitorPlay className="h-8 w-8 text-primary" />
          <b>{t("ما في ولا قناة مضافة")}</b>
          <p>{t("أضف قناة يوتيوب أو تويتش أو كيك أو تيك توك أو تيليجرام أو X أو انستقرام، والبوت يعلن عن كل جديد.")}</p>
        </div>
      )}

      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        {cfg.items.map((it) => {
          const p = byId[it.platform];
          return (
            <section key={it.id} className="panel creator-card" data-platform={it.platform}>
              <header className="creator-card-head">
                <span className="creator-badge" data-platform={it.platform}><p.icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <Input className="h-8 border-transparent bg-transparent px-1 font-bold" value={it.name} placeholder={t("اسم صانع المحتوى")} onChange={(e) => edit(it.id, { name: e.target.value })} />
                  <Input className="h-7 border-transparent bg-transparent px-1 text-xs text-muted-foreground" dir="ltr" value={it.handle} onChange={(e) => edit(it.id, { handle: e.target.value })} />
                </div>
                <span className="text-xs text-muted-foreground">{L(p)}</span>
                <Button size="icon" variant="ghost" aria-label={t("حذف")} onClick={() => up(cfg.items.filter((x) => x.id !== it.id))}><Trash2 /></Button>
              </header>
              <div className="grid gap-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="روم الإشعارات"><Pick value={it.channelId} onChange={(channelId) => edit(it.id, { channelId })} items={chanItems(data)} placeholder="اختر روم" /></Field>
                  <Field label="المنشن"><Pick value={it.mention || null} onChange={(v) => edit(it.id, { mention: v ?? "" })} items={mentionItems} placeholder="بدون منشن" /></Field>
                </div>
                {!it.channelId && <p className="text-xs text-destructive">{t("اختر روم عشان يشتغل الإشعار")}</p>}
                {p.posts && (
                  <Toggle label={lang === "ar" ? p.posts[0] : p.posts[1]} checked={it.notifyPosts} onChange={(notifyPosts) => edit(it.id, { notifyPosts })}>
                    <Input value={it.postMessage} onChange={(e) => edit(it.id, { postMessage: e.target.value })} />
                  </Toggle>
                )}
                {p.live && (
                  <Toggle label={t("البث المباشر")} checked={it.notifyLive} onChange={(notifyLive) => edit(it.id, { notifyLive })}>
                    <Input value={it.liveMessage} onChange={(e) => edit(it.id, { liveMessage: e.target.value })} />
                  </Toggle>
                )}
                {p.vod && (
                  <Toggle label={t("رابط البث المحفوظ بعد ما يخلص")} checked={it.notifyVod} onChange={(notifyVod) => edit(it.id, { notifyVod })}>
                    <Input value={it.vodMessage} onChange={(e) => edit(it.id, { vodMessage: e.target.value })} />
                  </Toggle>
                )}
                <p className="text-xs text-muted-foreground" dir="auto">{t("المتغيرات:")} <code>{"{name}"}</code> {t("الاسم")} · <code>{"{link}"}</code> {t("الرابط")} · <code>{"{title}"}</code> {t("العنوان")}</p>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Toggle({ label, checked, onChange, children }: { label: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 rounded-xl bg-secondary/40 p-3">
      <label className="flex items-center justify-between gap-3 text-sm font-semibold">{label}<Switch checked={checked} onCheckedChange={onChange} /></label>
      {checked && children}
    </div>
  );
}
