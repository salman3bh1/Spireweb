import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Gift, ShoppingBag } from "lucide-react";
import { AppShell, PageHeader, fmt } from "@/components/AppShell";
import { buyItem, findMember, getShop, saveStyle } from "@/lib/profile.functions";
const PAGE = 12;
import { MAX_BADGES, SHOP_KINDS, cosmeticClass, type ShopItem, type ShopKind } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "المتجر — Spire" },
      { name: "description", content: "اشترِ خلفيات وإطارات وتأثيرات أسماء وعلامات لبروفايلك أو أهدها لأصحابك بالكريدت." },
      { property: "og:title", content: "المتجر — Spire" },
      { property: "og:description", content: "اشترِ خلفيات وإطارات وتأثيرات أسماء وعلامات لبروفايلك أو أهدها لأصحابك بالكريدت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShopPage,
});

type Slot = "background" | "frame" | "effect";

function Swatch({ item }: { item: ShopItem }) {
  if (item.kind === "background") return <div className={`shop-swatch ${cosmeticClass("pbg", item.id)}`}>{item.emoji}</div>;
  if (item.kind === "frame") return <div className="shop-swatch"><span className={`shop-frame-demo ${cosmeticClass("pfr", item.id)}`}>{item.emoji}</span></div>;
  if (item.kind === "effect") return <div className="shop-swatch text-2xl font-extrabold"><span className={cosmeticClass("nfx", item.id)}>Spire</span></div>;
  return <div className="shop-swatch">{item.emoji}</div>;
}

function ShopPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["shop"], queryFn: () => getShop(), retry: false, refetchInterval: 5_000 });
  const [slots, setSlots] = useState<Record<Slot, string | null>>({ background: null, frame: null, effect: null });
  const [badges, setBadges] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [gift, setGift] = useState<ShopItem | null>(null);
  useEffect(() => {
    if (data && !loaded) {
      setSlots({ background: data.background, frame: data.frame, effect: data.effect });
      setBadges(data.badges); setBio(data.bio); setColor(null); setLoaded(true);
    }
  }, [data, loaded]);

  const buy = useMutation({
    mutationFn: (v: { itemId: string; giftTo?: string }) => buyItem({ data: v }),
    onSuccess: (_r, v) => { toast.success(v.giftTo ? "تم إرسال الهدية! 🎁" : "تم الشراء! ينخصم من رصيدك بالبوت خلال ثواني"); setGift(null); qc.invalidateQueries({ queryKey: ["shop"] }); },
    onError: (e) => toast.error((e as Error).message.includes("NO_FUNDS") ? "رصيدك ما يكفي" : (e as Error).message),
  });
  type Look = { slots: Record<Slot, string | null>; badges: string[]; color: string | null; bio: string };
  // Every change is saved right away so the public profile and the bot's /profile card update without an extra step.
  const save = useMutation({
    mutationFn: (l: Look) => saveStyle({ data: { ...l.slots, color: l.color, badges: l.badges, bio: l.bio } }),
    onSuccess: () => toast.success("تم حفظ البروفايل ✅ يظهر في بروفايلك العام وفي /profile بالبوت"),
    onError: (e) => toast.error((e as Error).message),
  });
  const apply = (p: Partial<Look>) => {
    const next: Look = { slots, badges, color, bio, ...p };
    setSlots(next.slots); setBadges(next.badges); setColor(next.color);
    save.mutate(next);
  };
  const owned = new Set(data?.owned ?? []);
  const [tab, setTab] = useState<ShopKind>("background");
  const [shown, setShown] = useState(PAGE);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"default" | "low" | "high" | "owned">("default");
  const toggle = (kind: ShopKind, id: string) => {
    if (kind === "badge") {
      if (!badges.includes(id) && badges.length >= MAX_BADGES) { toast.error(`الحد ${MAX_BADGES} علامات`); return; }
      apply({ badges: badges.includes(id) ? badges.filter((x) => x !== id) : [...badges, id] });
    } else apply({ slots: { ...slots, [kind]: slots[kind as Slot] === id ? null : id } });
  };
  const badgeItems = badges.map((b) => data?.items.find((i) => i.id === b)).filter((x): x is ShopItem => !!x);

  return (
    <AppShell>
      <PageHeader eyebrow="SHOP" icon={ShoppingBag} title="المتجر" subtitle={`رصيدك المتاح: ${fmt(data?.credits ?? 0)} كريدت`} />
      <section className="panel mb-8 grid gap-5 p-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="panel-title mb-3">معاينة بروفايلك</h2>
          <div className="shop-preview">
            <div className={`shop-preview-cover ${cosmeticClass("pbg", slots.background)}`} style={!slots.background && color ? { background: `linear-gradient(135deg, ${color}, transparent)` } : undefined} />
            <div className="shop-preview-body">
              <span className={`pf-avatar-wrap rounded-full ${cosmeticClass("pfr", slots.frame)}`}>
                {data?.avatar ? <img src={data.avatar} alt="" className="shop-preview-avatar" style={color ? { borderColor: color } : undefined} /> : <span className="shop-preview-avatar block" style={color ? { borderColor: color } : undefined} />}
              </span>
              <div className="min-w-0">
                <b className="font-display block truncate text-xl"><span className={cosmeticClass("nfx", slots.effect)} style={color && !slots.effect ? { color } : undefined}>{data?.name ?? "…"}</span></b>
                {bio && <p className="truncate text-sm text-muted-foreground">{bio}</p>}
              </div>
            </div>
            <div className="pf-badges px-4 pb-4">
              {badgeItems.map((b) => <span key={b.id} className="pf-badge" style={color ? { borderColor: color } : undefined}>{b.emoji}</span>)}
              {!badgeItems.length && <span className="text-xs text-muted-foreground">ما اخترت علامات بعد</span>}
            </div>
          </div>
        </div>
        <div>
          <h2 className="panel-title mb-3">تخصيص البروفايل</h2>
          <label className="mb-1 block text-sm font-bold">نبذة عنك</label>
          <div className="flex gap-2">
            <Input value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة قصيرة تظهر في بروفايلك" />
            <Button variant="gold" disabled={save.isPending} onClick={() => apply({})}>حفظ</Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">اضغط "استخدم" على أي عنصر تملكه وينحفظ على طول. تقدر تختار حتى {MAX_BADGES} علامات، وإطار وتأثير وخلفية وحدة.</p>
        </div>
      </section>
      <nav className="shop-tabs" role="tablist">
        {SHOP_KINDS.map(({ kind, label }) => (
          <button key={kind} type="button" role="tab" aria-selected={tab === kind} data-active={tab === kind || undefined} onClick={() => { setTab(kind); setShown(PAGE); }}>
            {label} <small>{data?.items.filter((i) => i.kind === kind).length ?? 0}</small>
          </button>
        ))}
      </nav>
      <div className="shop-filter">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="ابحث بالاسم…" className="max-w-xs" />
        <select aria-label="الترتيب" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="default">الافتراضي</option><option value="low">الأرخص أولاً</option><option value="high">الأغلى أولاً</option><option value="owned">اللي أملكها</option>
        </select>
      </div>
      {(() => {
        const all = (data?.items ?? []).filter((i) => i.kind === tab && (!q.trim() || i.name.includes(q.trim())) && (sort !== "owned" || owned.has(i.id)));
        const list = sort === "low" ? [...all].sort((a, b) => a.price - b.price) : sort === "high" ? [...all].sort((a, b) => b.price - a.price) : all;
        const kind = tab;
        return <section className="mb-8">
          <div className="shop-grid">
            {list.slice(0, shown).map((i) => {
              const has = owned.has(i.id);
              const active = kind === "badge" ? badges.includes(i.id) : slots[kind as Slot] === i.id;
              const poor = (data?.credits ?? 0) < i.price;
              return (
                <div key={i.id} className="panel shop-card">
                  <Swatch item={i} />
                  <div className="flex items-center justify-between gap-2"><b className="truncate">{i.name}</b><span className="text-gold shrink-0 font-bold" dir="ltr">{fmt(i.price)}</span></div>
                  <div className="flex gap-2">
                    {has ? (
                      <Button className="flex-1" variant={active ? "gold" : "outline"} size="sm" onClick={() => toggle(kind, i.id)}>
                        {active ? <><Check className="h-4 w-4" /> مستخدم</> : "استخدم"}
                      </Button>
                    ) : (
                      <Button className="flex-1" size="sm" variant="secondary" disabled={buy.isPending || poor} onClick={() => buy.mutate({ itemId: i.id })}>شراء</Button>
                    )}
                    <Button size="sm" variant="outline" disabled={poor} onClick={() => setGift(i)} aria-label="إهداء"><Gift className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
          {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">ما فيه عناصر</p>}
          {list.length > shown && <div className="mt-5 flex justify-center"><Button variant="outline" onClick={() => setShown(shown + PAGE)}>عرض المزيد ({list.length - shown})</Button></div>}
        </section>;
      })()}
      <GiftDialog item={gift} onClose={() => setGift(null)} onSend={(to) => gift && buy.mutate({ itemId: gift.id, giftTo: to })} pending={buy.isPending} />
    </AppShell>
  );
}

function GiftDialog({ item, onClose, onSend, pending }: { item: ShopItem | null; onClose: () => void; onSend: (to: string) => void; pending: boolean }) {
  const [q, setQ] = useState("");
  const { data: found } = useQuery({ queryKey: ["find", q], queryFn: () => findMember({ data: { q } }), enabled: q.trim().length >= 2 });
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إهداء {item?.name} 🎁</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">السعر {fmt(item?.price ?? 0)} كريدت ينخصم من رصيدك.</p>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب اسم العضو أو الآيدي" />
        <div className="grid gap-2">
          {found?.map((u) => (
            <div key={u.user_id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
              <span className="flex min-w-0 items-center gap-2">{u.avatar ? <img src={u.avatar} alt="" className="h-8 w-8 rounded-full" /> : null}<span className="truncate">{u.username ?? u.user_id}</span></span>
              <Button size="sm" variant="gold" disabled={pending} onClick={() => onSend(u.user_id)}>إهداء</Button>
            </div>
          ))}
          {q.trim().length >= 2 && found && !found.length && <p className="text-sm text-muted-foreground">ما لقينا أحد بهذا الاسم.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
