import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Play, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { uploadWelcomeBg } from "@/lib/modules.functions";
import { useI18n } from "@/lib/i18n";
import type { Modules } from "@/lib/modules.schema";
import { DIVIDERS, DIVIDER_CATEGORIES, dividerSvg, type DividerCategory } from "@/lib/divider-art";
import { PageHeader, Card, Field, SelectMulti, chanItems, type GuildData } from "./kit";

const SWATCHES = ["#7fd4c1", "#5eead4", "#a78bfa", "#f472b6", "#facc15", "#60a5fa", "#f87171", "#ffffff"];

export function DividerArt({ style, color = "#7fd4c1", accent, animate = true, crop = false }: { style: string; color?: string; accent?: string; animate?: boolean; crop?: boolean }) {
  const html = useMemo(() => dividerSvg(style, color, accent, { animate, uid: `${style}${color}${accent ?? ""}`.replace(/#/g, "") }).replace('width="1200" height="100"', 'class="divider-svg" preserveAspectRatio="xMidYMid meet"').replace('viewBox="0 0 1200 100"', crop ? 'viewBox="330 5 540 90"' : 'viewBox="0 0 1200 100"'), [style, color, accent, animate, crop]);
  return <span className="divider-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Dividers({ data, m, set }: { data: GuildData; m: Modules; set: <K extends keyof Modules>(key: K, value: Modules[K]) => void }) {
  const { t, lang } = useI18n();
  const cfg = m.dividers;
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState<"all" | DividerCategory>("all");
  const up = (value: Partial<typeof cfg>) => set("dividers", { ...cfg, ...value });
  const list = DIVIDERS.filter((d) => cat === "all" || d.cat.includes(cat));
  const current = DIVIDERS.find((d) => d.id === cfg.style);
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) { toast.error(t("الصورة أكبر من 4.5MB")); return; }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
      const { path } = await uploadWelcomeBg({ data: { guildId: data.guild.id, dataUrl } });
      up({ imageUrl: path });
      toast.success(t("تم رفع الفاصل — اضغط حفظ"));
    } catch { toast.error(t("ما قدرنا نرفع الصورة")); } finally { setBusy(false); }
  };

  return <>
    <PageHeader title="الفواصل" desc="في الرومات اللي تختارها، البوت ينزّل فاصل بعد كل رسالة. اختر الشكل وألوانه، أو ارفع فاصلك الخاص." enabled={cfg.enabled} onToggle={(enabled) => up({ enabled })} icon={<SlidersHorizontal />} />

    <div className="divider-stage">
      <span className="divider-stage-label">{t("هيك يطلع بالروم")}</span>
      <div className="divider-stage-frame">
        {cfg.imageUrl ? <img src={cfg.imageUrl} alt={t("معاينة الفاصل")} /> : <DividerArt style={cfg.style} color={cfg.color} accent={cfg.accent} />}
      </div>
      <span className="divider-stage-name">{cfg.imageUrl ? t("فاصل مخصص") : current ? (lang === "ar" ? current.ar : current.en) : cfg.style}</span>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="الإعدادات">
        <label className="setting-row">
          <span><b>{t("تشغيل الفواصل")}</b><small>{t("فاصل واحد بعد ما يهدأ الروم (دفعة الرسائل تاخذ فاصل واحد)")}</small></span>
          <Switch checked={cfg.enabled} onCheckedChange={(enabled) => up({ enabled })} />
        </label>
        <Field label="الرومات"><SelectMulti value={cfg.channelIds} onChange={(channelIds) => up({ channelIds })} items={chanItems(data)} placeholder="اختر الرومات" /></Field>
        <label className="setting-row">
          <span><b>{t("تجاهل رسائل البوتات")}</b><small>{t("ما ينزل فاصل بعد رسائل البوتات الثانية")}</small></span>
          <Switch checked={cfg.ignoreBots} onCheckedChange={(ignoreBots) => up({ ignoreBots })} />
        </label>
      </Card>
      <Card title="الألوان والفاصل المخصص">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اللون الأساسي">
            <div className="swatch-row">{SWATCHES.map((c) => <button key={c} type="button" aria-label={c} className="swatch" aria-pressed={cfg.color === c} style={{ background: c }} onClick={() => up({ color: c })} />)}
              <input aria-label={t("لون مخصص")} className="swatch-input" type="color" value={cfg.color} onChange={(e) => up({ color: e.target.value })} /></div>
          </Field>
          <Field label="لون الزخرفة">
            <div className="swatch-row">{SWATCHES.map((c) => <button key={c} type="button" aria-label={c} className="swatch" aria-pressed={cfg.accent === c} style={{ background: c }} onClick={() => up({ accent: c })} />)}
              <input aria-label={t("لون مخصص")} className="swatch-input" type="color" value={cfg.accent} onChange={(e) => up({ accent: e.target.value })} /></div>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" disabled={busy}><label className="cursor-pointer"><Upload />{busy ? t("جاري الرفع…") : t("ارفع فاصلك")}<input hidden disabled={busy} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label></Button>
          {cfg.imageUrl && <Button variant="ghost" onClick={() => up({ imageUrl: "" })}><Trash2 />{t("إزالة الفاصل المخصص")}</Button>}
        </div>
        <p className="text-xs text-muted-foreground">{t("PNG أو JPG أو WEBP أو GIF متحرك، لحد 4.5MB. يفضّل يكون عرضه أكبر من طوله.")}</p>
      </Card>
    </div>

    <div className="divider-filter" role="tablist">
      {DIVIDER_CATEGORIES.map((c) => <button key={c.id} role="tab" type="button" aria-selected={cat === c.id} onClick={() => setCat(c.id)}>{lang === "ar" ? c.ar : c.en}</button>)}
    </div>
    <div className="divider-gallery">
      {list.map((d) => (
        <button key={d.id} type="button" className="divider-tile" aria-pressed={!cfg.imageUrl && cfg.style === d.id} onClick={() => up({ style: d.id, imageUrl: "" })}>
          <span className="divider-tile-art"><DividerArt crop style={d.id} color={cfg.color} accent={cfg.accent} /></span>
          <span className="divider-tile-meta"><span>{lang === "ar" ? d.ar : d.en}</span>{d.animated && <span className="divider-badge"><Play />{t("متحرك")}</span>}</span>
        </button>
      ))}
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{t("الفواصل المتحركة تتحرك هنا بالموقع، وفي ديسكورد تنرسل كصورة ثابتة بنفس الشكل والألوان.")}</p>
  </>;
}
