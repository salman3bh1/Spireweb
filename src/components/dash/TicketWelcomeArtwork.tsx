import { useT as useSpireTranslation } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import type { TicketSettings } from "@/lib/tickets.schema";

export function TicketWelcomeArtwork({ t }: { t: TicketSettings }) {
  const __tr = useSpireTranslation();

  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      await document.fonts.ready;
      const ctx = canvas.current?.getContext("2d");
      if (!ctx || cancelled) return;
      const w = t.welcome, d = w.design;
      const W = 1200, H = 440;
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, d.bgFrom); bg.addColorStop(0.55, d.bgVia); bg.addColorStop(1, d.bgTo);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (d.bgImage) {
        const image = new Image(); image.src = d.bgImage;
        try {
          await image.decode();
          if (cancelled) return;
          const scale = Math.max(W / image.width, H / image.height);
          ctx.drawImage(image, (W-image.width*scale)/2, (H-image.height*scale)/2, image.width*scale, image.height*scale);
          ctx.fillStyle = `rgb(0 0 0 / ${d.bgDim})`; ctx.fillRect(0,0,W,H);
        } catch { /* Keep the default artwork if the image cannot load. */ }
      }
      ctx.fillStyle = d.accent; ctx.fillRect(W-14,0,14,H);
      ctx.direction = "rtl"; ctx.textAlign = "center";
      const replace = (v: string) => v.replaceAll("{number}", "0001").replaceAll("{type}",t.types[0]?.label || "دعم فني").replaceAll("{user}","@المستخدم").replaceAll("{role}","@فريق الدعم");
      const fit = (v: string) => { let text = replace(v); while (text.length > 1 && ctx.measureText(text).width > W-120) text = text.slice(0,-2)+"…"; return text; };
      ctx.fillStyle=d.text; ctx.font=`bold ${d.titleSize + 4}px Cairo`; ctx.fillText(fit(w.imageTitle),W/2,145);
      if (w.showNumber) { ctx.fillStyle=d.accent; ctx.font="bold 84px Cairo"; ctx.fillText("#0001",W/2,255); }
      ctx.globalAlpha=0.75; ctx.fillStyle=d.text; ctx.font="32px Cairo"; ctx.fillText(fit(w.imageSubtitle),W/2,350); ctx.globalAlpha=1;
    }
    void draw();
    return () => { cancelled = true; };
  }, [t]);
  return <canvas ref={canvas} width={1200} height={440} className="ticket-welcome-canvas" role="img" aria-label={__tr("معاينة صورة الترحيب داخل التذكرة")} />;
}