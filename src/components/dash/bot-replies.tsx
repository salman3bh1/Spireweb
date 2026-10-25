import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BOT_REPLIES, REPLY_VAR_LABELS, fillReply } from "@/lib/bot-replies";
import type { Modules } from "@/lib/modules.schema";
import { Card, PageHeader } from "./kit";

type Setter = <K extends keyof Modules>(k: K, v: Modules[K]) => void;

const SAMPLE: Record<string, string> = {
  user: "@Ahmed", by: "@Admin", reason: "سبام", duration: "1 ساعة", number: "2", left: "1",
  username: "Ahmed", balance: "$12,500", amount: "$1,000", target: "@Sara",
};

// Light Discord-style preview: **bold** and `code`, everything else as typed.
function Preview({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <div className="reply-preview" dir="auto">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p.startsWith("`") && p.endsWith("`") ? <code key={i}>{p.slice(1, -1)}</code>
            : <span key={i}>{p}</span>)}
    </div>
  );
}

export function BotReplies({ m, set }: { m: Modules; set: Setter }) {
  const t = useT();
  const texts = m.replies?.texts ?? {};
  const groups = useMemo(() => [...new Set(BOT_REPLIES.map((r) => r.group))], []);
  const [group, setGroup] = useState(groups[0]!);
  const put = (key: string, value: string) => {
    const next = { ...texts };
    if (value.trim()) next[key] = value; else delete next[key];
    set("replies", { texts: next });
  };
  return (
    <>
      <PageHeader title={t("ردود البوت")} desc={t("غيّر الكلام اللي يرد فيه البوت. اترك الخانة مثل ما هي أو اضغط رجوع للافتراضي عشان يرجع النص الأصلي.")} />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {groups.map((g) => (
          <Button key={g} size="sm" variant={g === group ? "gold" : "outline"} role="tab" aria-selected={g === group} onClick={() => setGroup(g)}>{t(g)}</Button>
        ))}
      </div>
      <div className="grid gap-4">
        {BOT_REPLIES.filter((r) => r.group === group).map((r) => {
          const custom = texts[r.key];
          const value = custom ?? r.text;
          return (
            <Card key={r.key} title={<span dir="auto">{t(r.label)}</span>}
              right={custom !== undefined ? <Button size="sm" variant="ghost" onClick={() => put(r.key, "")}><RotateCcw className="h-4 w-4" /> {t("رجوع للافتراضي")}</Button> : undefined}>
              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                  <Textarea dir="auto" rows={Math.min(9, value.split("\n").length + 1)} maxLength={1800} value={value}
                    onChange={(e) => put(r.key, e.target.value === r.text ? "" : e.target.value)} />
                  {r.vars.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.vars.map((v) => (
                        <button key={v} type="button" className="reply-var" onClick={() => put(r.key, `${value}{${v}}`)} title={t("إضافة")}>
                          <code dir="ltr">{`{${v}}`}</code> {t(REPLY_VAR_LABELS[v] ?? v)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Preview text={fillReply(value, SAMPLE)} />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
