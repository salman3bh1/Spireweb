import { useT as useSpireTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCcw } from "lucide-react";
import { defaultTicketDesign, type TicketDesign } from "@/lib/tickets.schema";

export function TicketWelcomeDesign({ value, onChange }: { value: TicketDesign; onChange: (value: TicketDesign) => void }) {
  const __tr = useSpireTranslation();

  const set = <K extends keyof TicketDesign>(key: K, next: TicketDesign[K]) => onChange({ ...value, [key]: next });
  return <div className="ticket-welcome-design">
    <h3>{__tr("تصميم صورة الترحيب")}</h3>
    <div className="ticket-fields-grid">
      {([['bgFrom',__tr('الخلفية · بداية')],['bgVia',__tr('الخلفية · وسط')],['bgTo',__tr('الخلفية · نهاية')],['accent',__tr('لون التمييز')],['text',__tr('لون الكتابة')]] as const).map(([key,label]) => <div className="ticket-field" key={key}><Label htmlFor={`welcome-${key}`}>{__tr(label)}</Label><input id={`welcome-${key}`} aria-label={`صورة الترحيب · ${label}`} className="ticket-color-swatch" type="color" value={value[key]} onChange={e => set(key,e.target.value)} /></div>)}
    </div>
    <div className="ticket-field"><Label htmlFor="welcome-art-bg">{__tr("خلفية الصورة")}</Label><Input id="welcome-art-bg" dir="ltr" value={value.bgImage} onChange={e => set('bgImage',e.target.value)} /></div>
    <div className="ticket-field"><Label>{__tr("تعتيم الخلفية")}</Label><Slider aria-label={__tr("تعتيم خلفية صورة الترحيب")} min={0} max={0.9} step={0.05} value={[value.bgDim]} onValueChange={([v]) => set('bgDim',v ?? 0.35)} /></div>
    <div className="ticket-field"><Label>{__tr("حجم عنوان الصورة")}</Label><Slider aria-label={__tr("حجم عنوان صورة الترحيب")} min={30} max={90} step={1} value={[value.titleSize]} onValueChange={([v]) => set('titleSize',v ?? 58)} /></div>
    <Button variant="secondary" onClick={() => onChange(defaultTicketDesign())}><RotateCcw /> {__tr("استعادة ألوان الموقع")}</Button>
  </div>;
}