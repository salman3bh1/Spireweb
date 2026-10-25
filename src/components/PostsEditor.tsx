import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { createPost, deletePost, listPosts } from "@/lib/economy.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Owner-only editor: posts appear on the "Latest updates" page.
export function PostsEditor() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const { data } = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const publish = useMutation({
    mutationFn: () => createPost({ data: { title, body, imageUrl } }),
    onSuccess: () => { toast.success("انتشر التحديث ✅"); setTitle(""); setBody(""); setImageUrl(""); qc.invalidateQueries({ queryKey: ["posts"] }); },
    onError: () => toast.error("ما قدرت أنشر — تأكد من العنوان والمحتوى ورابط الصورة"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePost({ data: { id } }),
    onSuccess: () => { toast.success("انحذف"); qc.invalidateQueries({ queryKey: ["posts"] }); },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5" onSubmit={(e) => { e.preventDefault(); publish.mutate(); }}>
        <h2 className="text-lg font-bold">تحديث جديد</h2>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان" maxLength={120} required />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="اكتب التحديث هنا…" rows={8} maxLength={4000} required />
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="رابط صورة (اختياري)" dir="ltr" />
        <Button type="submit" variant="gold" disabled={publish.isPending || !title.trim() || !body.trim()}><Send className="h-4 w-4" /> نشر في صفحة آخر التحديثات</Button>
      </form>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">المنشورات ({data?.posts.length ?? 0})</h2>
        {data?.posts.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0">
              <strong className="block truncate">{p.title}</strong>
              <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
            </div>
            <Button variant="ghost" size="sm" aria-label="حذف" onClick={() => remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
