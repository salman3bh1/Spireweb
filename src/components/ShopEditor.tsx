import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getShopAdmin, saveShopItem } from "@/lib/profile.functions";
import { SHOP_KINDS, type ShopKind } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = { id: string; kind: ShopKind; name: string; emoji: string | null; price: number; active: boolean };

// Owner-only shop management: edit price/name/emoji, hide items, add new ones.
export function ShopEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["shop-admin"], queryFn: () => getShopAdmin() });
  const save = useMutation({
    mutationFn: (r: Row) => saveShopItem({ data: r }),
    onSuccess: () => { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["shop-admin"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const blank: Row = { id: "", kind: "badge", name: "", emoji: "", price: 1000, active: true };
  const [draft, setDraft] = useState<Row>(blank);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold">إضافة منتج جديد</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <Input dir="ltr" placeholder="id (badge-cat)" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value.toLowerCase() })} />
          <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as ShopKind })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SHOP_KINDS.map((k) => <SelectItem key={k.kind} value={k.kind}>{k.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="الاسم" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="إيموجي" value={draft.emoji ?? ""} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
          <Input type="number" min={0} placeholder="السعر" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} />
        </div>
        <Button className="mt-4" variant="gold" disabled={save.isPending || !draft.id || !draft.name} onClick={() => save.mutate(draft, { onSuccess: () => setDraft(blank) })}><Plus className="h-4 w-4" /> إضافة</Button>
        <p className="mt-2 text-xs text-muted-foreground">الخلفيات والإطارات والتأثيرات الجديدة تاخذ شكل افتراضي بلون الموقع.</p>
      </section>
      {SHOP_KINDS.map(({ kind, label }) => (
        <section key={kind} className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">{label}</h2>
          <div className="grid gap-2">
            {data?.filter((i) => i.kind === kind).map((i) => <ItemRow key={i.id} item={{ ...i, emoji: i.emoji ?? null }} onSave={(r) => save.mutate(r)} busy={save.isPending} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function ItemRow({ item, onSave, busy }: { item: Row; onSave: (r: Row) => void; busy: boolean }) {
  const [r, setR] = useState(item);
  const dirty = JSON.stringify(r) !== JSON.stringify(item);
  return (
    <div className="grid items-center gap-2 rounded-xl border border-border p-2 md:grid-cols-[1fr_90px_140px_auto_auto]">
      <Input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} aria-label="الاسم" />
      <Input value={r.emoji ?? ""} onChange={(e) => setR({ ...r, emoji: e.target.value })} aria-label="إيموجي" />
      <Input type="number" min={0} value={r.price} onChange={(e) => setR({ ...r, price: Number(e.target.value) || 0 })} aria-label="السعر" />
      <label className="flex items-center gap-2 text-sm"><Switch checked={r.active} onCheckedChange={(v) => setR({ ...r, active: v })} /> معروض</label>
      <Button size="sm" variant="gold" disabled={!dirty || busy} onClick={() => onSave(r)}>حفظ</Button>
    </div>
  );
}
