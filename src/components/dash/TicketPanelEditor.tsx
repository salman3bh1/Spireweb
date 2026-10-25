import { useT as useSpireTranslation } from "@/lib/i18n";
import { useEffect, useRef, useState, type PointerEvent as RPE, type CSSProperties, type ReactNode } from "react";
import { Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { defaultTicketDesign, type TicketDesign, type TicketSettings } from "@/lib/tickets.schema";

type Part = "header" | "stats" | "list";
const W = 1200;
const ACCENTS = ["#7c8cff", "#5cd65c", "#ff5a4f", "#ffd23f", "#3fd2ff", "#ff7ad9"];

/* معاينة مطابقة لرسم البوت (canvas بعرض 1200) مع سحب العناصر */
export function TicketPanelEditor({ t, onChange, children }: {
  t: TicketSettings; guildName?: string; onChange: (d: TicketDesign) => void; children?: ReactNode;
}) {
  const __tr = useSpireTranslation();

  const d = { ...defaultTicketDesign(), ...(t.design ?? {}) };
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ part: Part; sx: number; sy: number; ox: number; oy: number; k: number } | null>(null);
  const [active, setActive] = useState<Part | null>(null);
  const [bw, setBw] = useState(600);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setBw(el.clientWidth)); ro.observe(el); setBw(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const set = <K extends keyof TicketDesign>(k: K, v: TicketDesign[K]) => onChange({ ...d, [k]: v });

  const types = t.types.length ? t.types : [{ id: "x", label: "دعم فني", description: "مشكلة أو استفسار عام", emoji: null, roleId: null }];
  const H = 400 + types.length * 130 + 30;

  const down = (part: Part) => (e: RPE) => {
    const k = bw / W;
    drag.current = { part, sx: e.clientX, sy: e.clientY, ox: d[part].x, oy: d[part].y, k };
    setActive(part);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: RPE) => {
    const g = drag.current; if (!g) return;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, Math.round(v)));
    set(g.part, { x: clamp(g.ox + (e.clientX - g.sx) / g.k, 600), y: clamp(g.oy + (e.clientY - g.sy) / g.k, 400) });
  };
  const up = () => { drag.current = null; setActive(null); };

  const part = (p: Part, style: CSSProperties) => ({
    onPointerDown: down(p), onPointerMove: move, onPointerUp: up,
    style: { ...style, transform: `translate(${d[p].x}px, ${d[p].y}px)`, touchAction: "none" as const },
    className: `absolute cursor-grab rounded-2xl outline-2 outline-dashed transition-[outline-color] ${active === p ? "outline-primary" : "outline-transparent hover:outline-primary/60"}`,
  });

  const soft = (a: number) => `color-mix(in srgb, ${d.card} ${a}%, transparent)`;
  const textSoft = (a: number) => `color-mix(in srgb, ${d.text} ${a}%, transparent)`;

  return (
    <div className="ticket-design-editor">
      <div className="ticket-panel-preview">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Move className="h-3.5 w-3.5" /> {__tr("اسحب العنوان أو الإحصائيات أو القائمة لتغيير مكانها")}</span>
          <span>{__tr("معاينة مباشرة")}</span>
        </div>
        <div ref={box} className="relative w-full overflow-hidden" style={{ aspectRatio: `${W} / ${H}` }}>
          <div dir="rtl" className="absolute left-0 top-0 origin-top-left select-none"
            style={{ width: W, height: H, transform: `scale(${bw / W})`, borderRadius: 34, overflow: "hidden",
              background: `linear-gradient(135deg, ${d.bgFrom}, ${d.bgVia} 55%, ${d.bgTo})`, color: d.text, fontFamily: "Cairo, sans-serif",
              boxShadow: `inset 0 0 0 3px ${soft(35)}` }}>
            {d.bgImage && <>
              <img src={d.bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${d.bgDim})` }} />
            </>}
            {d.stripes && <div className="absolute inset-0" style={{
              background: `repeating-linear-gradient(110deg, transparent 0 35px, ${soft(10)} 35px 38px)`,
              maskImage: "linear-gradient(90deg, #000 0 25%, transparent 40%)" }} />}

            <div {...part("header", { right: 56, top: 50, width: W - 112, height: 160 })}>
              <div className="absolute right-0 top-0 grid h-[104px] w-[104px] place-items-center rounded-[22px] text-5xl"
                style={{ background: soft(18), boxShadow: `inset 0 0 0 2px ${soft(40)}` }}>💬</div>
              <div className="absolute right-[134px] top-0">
                <div className="font-bold leading-tight" style={{ fontSize: d.titleSize }}>{t.title || __tr("مركز الدعم")}</div>
                <div className="text-[22px]" style={{ color: textSoft(85) }}>{t.subtitle || __tr("الدعم · الطلبات · البلاغات · الشراكات")}</div>
              </div>
            </div>
            <div className="absolute h-[2px]" style={{ right: 56, left: 56, top: 225, background: soft(30) }} />

            <div {...part("stats", { right: 56, top: 250, width: W - 112, height: 100 })}>
              <div className="flex h-full">
                {[[__tr("التذاكر المنجزة"), "0"], [__tr("وقت الرد المعتاد"), t.replyTime || __tr("أقل من 24 ساعة")]].map(([l, v], k) => (
                  <div key={l} className="flex-1 px-1" style={k ? { borderRight: `2px solid ${soft(30)}`, paddingRight: 40 } : {}}>
                    <div className="text-xl font-bold" style={{ color: textSoft(75) }}>{l}</div>
                    <div className="text-[40px] font-bold" style={{ color: k ? d.text : d.accent }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div {...part("list", { right: 56, top: 400, width: W - 112, height: types.length * 130 - 18 })}>
              {types.map((ty, k) => (
                <div key={ty.id} className="relative mb-[18px] h-[112px] rounded-[18px]"
                  style={{ background: soft(14), boxShadow: `inset 0 0 0 2px ${soft(28)}` }}>
                  <div className="absolute right-0 top-2 h-[96px] w-[7px] rounded" style={{ background: k === 0 ? d.accent : ACCENTS[k % ACCENTS.length] }} />
                  <div className="absolute right-[28px] top-5 grid h-[72px] w-[72px] place-items-center rounded-[14px] text-[34px] font-bold" style={{ background: soft(20) }}>
                    {ty.emoji || k + 1}</div>
                  <div className="absolute right-[125px] top-4">
                    <div className="text-[32px] font-bold">{__tr(ty.label)}</div>
                    <div className="text-[22px]" style={{ color: textSoft(82) }}>{__tr(ty.description)}</div>
                  </div>
                  <div className="absolute left-7 top-[34px] grid h-11 w-11 place-items-center rounded-full text-2xl" style={{ background: soft(22) }}>‹</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">{t.panelPlaceholder} ▾</div>
      </div>

      <div className="ticket-design-controls">{children}<h3 className="ticket-sub-heading">{__tr("ألوان وتصميم اللوحة")}</h3><div className="ticket-color-grid">
        {([["bgFrom", __tr("الخلفية (بداية)")], ["bgVia", __tr("الخلفية (وسط)")], ["bgTo", __tr("الخلفية (نهاية)")], ["accent", __tr("لون التمييز")], ["text", __tr("لون الكتابة")], ["card", __tr("لون البطاقات")]] as const).map(([k, l]) => (
          <div key={k} className="grid gap-2"><Label>{l}</Label>
            <div className="flex gap-2">
              <input type="color" value={d[k]} onChange={(e) => set(k, e.target.value)} className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent" />
              <Input value={d[k]} dir="ltr" onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && e.target.value.length === 7 && set(k, e.target.value)} />
            </div></div>
        ))}
      </div>
      <div className="grid gap-2"><Label>{__tr("صورة خلفية (رابط مباشر للصورة — اتركه فاضي للتدرج)")}</Label>
        <Input dir="ltr" value={d.bgImage} placeholder="https://…/background.png" onChange={(e) => set("bgImage", e.target.value.trim())} /></div>
      <div className="ticket-slider-grid">
        <div className="grid gap-2"><Label>{__tr("تعتيم الصورة (")}{Math.round(d.bgDim * 100)}%)</Label>
          <Slider min={0} max={0.9} step={0.05} value={[d.bgDim]} onValueChange={([v]) => set("bgDim", v ?? 0)} /></div>
        <div className="grid gap-2"><Label>{__tr("حجم العنوان (")}{d.titleSize})</Label>
          <Slider min={30} max={90} step={1} value={[d.titleSize]} onValueChange={([v]) => set("titleSize", v ?? 58)} /></div>
        <div className="ticket-toggle"><Label>{__tr("خطوط زخرفية")}</Label>
          <Switch checked={d.stripes} onCheckedChange={(v) => set("stripes", v)} /></div>
      </div>
      <Button variant="secondary" className="justify-self-start" onClick={() => onChange(defaultTicketDesign())}>
        <RotateCcw className="h-4 w-4" /> {__tr("رجوع للتصميم الافتراضي")}</Button></div>
    </div>
  );
}
