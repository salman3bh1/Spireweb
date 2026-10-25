import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TerminalSquare } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { COMMAND_CATALOG } from "@/lib/command-catalog";
import { exampleOf, groupCommands } from "@/lib/command-help";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/commands")({
  head: () => ({
    meta: [
      { title: "أوامر البوت — Spire" },
      { name: "description", content: "شرح كل أوامر بوت Spire مع مثال لكل أمر: الألعاب، الإشراف، الموسيقى، ماينكرافت والمزيد." },
      { property: "og:title", content: "أوامر البوت — Spire" },
      { property: "og:description", content: "شرح كل أوامر بوت Spire مع مثال لكل أمر: الألعاب، الإشراف، الموسيقى، ماينكرافت والمزيد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommandsPage,
});

function CommandsPage() {
  const [q, setQ] = useState("");
  const list = COMMAND_CATALOG.filter((c) => !q.trim() || c.name.includes(q.trim().toLowerCase()) || c.description.includes(q.trim()));
  return (
    <AppShell>
      <PageHeader eyebrow="COMMANDS" icon={TerminalSquare} title="أوامر البوت" subtitle={`${COMMAND_CATALOG.length} أمر مع شرح ومثال لكل واحد`} />
      <Input className="mb-6 max-w-md" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن أمر…" />
      {groupCommands(list).map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="panel-title mb-4">{g.title}</h2>
          <div className="cmd-grid">
            {g.items.map((c) => (
              <div key={c.name} className="panel cmd-card">
                <b dir="ltr" className="block text-start text-gold">/{c.name}</b>
                <p className="my-1 text-sm">{c.description}</p>
                <code dir="ltr" className="inline-block">{exampleOf(c.name)}</code>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
