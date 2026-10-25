import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Backpack, Gift, ShoppingBag } from "lucide-react";
import { AppShell, PageHeader, ago, fmt } from "@/components/AppShell";
import { getInventory } from "@/lib/profile.functions";
import { SHOP_KINDS, cosmeticClass } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "حقيبتي — Spire" },
      { name: "description", content: "كل العناصر اللي تملكها من المتجر والهدايا اللي وصلتك." },
      { property: "og:title", content: "حقيبتي — Spire" },
      { property: "og:description", content: "كل العناصر اللي تملكها من المتجر والهدايا اللي وصلتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => getInventory(), retry: false, refetchInterval: 10_000 });
  return (
    <AppShell>
      <PageHeader eyebrow="INVENTORY" icon={Backpack} title="حقيبتي" subtitle={`عندك ${data?.items.length ?? 0} عنصر`} />
      <Button asChild variant="outline" className="mb-6"><Link to="/shop"><ShoppingBag className="h-4 w-4" /> روح المتجر</Link></Button>
      {isLoading && <div className="member-panel h-40 animate-pulse" />}
      {data && !data.items.length && <div className="member-panel text-center text-muted-foreground">حقيبتك فاضية — اشترِ أول عنصر من المتجر.</div>}
      {SHOP_KINDS.map(({ kind, label }) => {
        const list = data?.items.filter((i) => i.kind === kind) ?? [];
        if (!list.length) return null;
        return (
          <section key={kind} className="mb-8">
            <h2 className="panel-title mb-4">{label}</h2>
            <div className="shop-grid">
              {list.map((i) => (
                <div key={i.id} className="panel shop-card">
                  <div className={`shop-swatch ${kind === "background" ? cosmeticClass("pbg", i.id) : ""}`}>
                    {kind === "frame" ? <span className={`shop-frame-demo ${cosmeticClass("pfr", i.id)}`} /> : kind === "effect" ? <span className={`text-2xl font-extrabold ${cosmeticClass("nfx", i.id)}`}>Spire</span> : i.emoji}
                  </div>
                  <div className="flex items-center justify-between"><b>{i.name}</b>{i.inUse && <span className="text-xs font-bold text-gold">مستخدم</span>}</div>
                  <p className="text-xs text-muted-foreground">
                    {i.giftedBy ? <><Gift className="inline h-3 w-3" /> هدية من {i.giftedBy} · </> : null}
                    {ago(i.at)} · <span dir="ltr">{fmt(i.price)}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </AppShell>
  );
}
