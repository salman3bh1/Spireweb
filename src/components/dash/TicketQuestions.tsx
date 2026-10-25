import { useT as useSpireTranslation } from "@/lib/i18n";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TicketForm } from "@/lib/tickets.schema";

export const emptyForm = (): TicketForm => ({ enabled: false, title: "", answersTitle: "إجابات صاحب التذكرة", questions: [] });

/* أسئلة مخصصة تظهر للعضو بنافذة قبل فتح التذكرة، وإجاباته تنرسل داخل التذكرة */
export function TicketQuestions({ value, typeLabel, onChange }: { value?: TicketForm; typeLabel: string; onChange: (f: TicketForm) => void }) {
  const __tr = useSpireTranslation();

  const f = value ?? emptyForm();
  const set = <K extends keyof TicketForm>(k: K, v: TicketForm[K]) => onChange({ ...f, [k]: v });
  const q = (idx: number, patch: Partial<TicketForm["questions"][number]>) => set("questions", f.questions.map((x, k) => (k === idx ? { ...x, ...patch } : x)));
  const setCount = (n: number) => {
    const qs = f.questions.slice(0, n);
    while (qs.length < n) qs.push({ id: `q${Date.now().toString(36)}${qs.length}`, label: `سؤال ${qs.length + 1}`, placeholder: "", style: "short", required: true });
    set("questions", qs);
  };
  return (
    <div className="ticket-questions">
      <label className="ticket-toggle">{__tr("أسئلة قبل فتح التذكرة")}<Switch aria-label={`أسئلة ${typeLabel}`} checked={f.enabled} onCheckedChange={(v) => onChange({ ...f, enabled: v, questions: v && !f.questions.length ? [{ id: `q${Date.now().toString(36)}`, label: __tr("وش طلبك؟"), placeholder: "", style: "paragraph", required: true }] : f.questions })} /></label>
      {f.enabled && <div className="ticket-questions-layout">
        <div className="ticket-questions-form">
        <div className="ticket-field"><Label>{__tr("عنوان نافذة الأسئلة")}</Label><Input value={__tr(f.title)} maxLength={45} placeholder={typeLabel} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="ticket-field"><Label>{__tr("عنوان الإجابات داخل التذكرة")}</Label><Input value={f.answersTitle} maxLength={100} onChange={(e) => set("answersTitle", e.target.value)} /></div>
        <div className="ticket-field"><Label>{__tr("عدد الأسئلة (الحد 5 من ديسكورد)")}</Label>
          <Select value={String(f.questions.length)} onValueChange={(v) => setCount(Number(v))}>
            <SelectTrigger aria-label={__tr("عدد الأسئلة")}><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select></div>
        {f.questions.map((x, idx) => (
          <div className="ticket-question" key={x.id}>
            <div className="ticket-question-head"><b>{__tr("سؤال")}{idx + 1}</b><Button variant="ghost" size="icon" aria-label={__tr("حذف السؤال")} onClick={() => set("questions", f.questions.filter((_, k) => k !== idx))}><Trash2 /></Button></div>
            <div className="ticket-field"><Label>{__tr("نص السؤال")}</Label><Input value={__tr(x.label)} maxLength={45} onChange={(e) => q(idx, { label: e.target.value })} /></div>
            <div className="ticket-field"><Label>{__tr("النص داخل الخانة (مثال)")}</Label><Input value={x.placeholder} maxLength={100} onChange={(e) => q(idx, { placeholder: e.target.value })} /></div>
            <div className="ticket-field"><Label>{__tr("نوع الإجابة")}</Label>
              <Select value={x.style} onValueChange={(v) => q(idx, { style: v as "short" | "paragraph" })}>
                <SelectTrigger aria-label={__tr("نوع الإجابة")}><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl"><SelectItem value="short">{__tr("سطر واحد")}</SelectItem><SelectItem value="paragraph">{__tr("نص طويل")}</SelectItem></SelectContent>
              </Select></div>
            <label className="ticket-toggle">{__tr("إجباري")}<Switch checked={x.required} onCheckedChange={(v) => q(idx, { required: v })} /></label>
          </div>
        ))}
        {f.questions.length < 5 && <Button variant="secondary" onClick={() => setCount(f.questions.length + 1)}><Plus /> {__tr("إضافة سؤال")}</Button>}
        </div>
        <div className="ticket-modal-preview" dir="rtl">
          <strong>{f.title || typeLabel}</strong>
          {f.questions.map((x) => <div key={x.id}><span>{__tr(x.label)}{x.required && <em> *</em>}</span><div className={x.style === "paragraph" ? "tall" : ""}>{x.placeholder}</div></div>)}
          <div className="ticket-modal-actions"><span>{__tr("إلغاء")}</span><span>{__tr("إرسال")}</span></div>
        </div>
      </div>}
    </div>
  );
}
