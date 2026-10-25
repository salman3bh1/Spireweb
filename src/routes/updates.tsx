import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Megaphone, PenLine } from "lucide-react";
import { AppShell, PageHeader, ago } from "@/components/AppShell";
import { listPosts, togglePostLike } from "@/lib/economy.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "آخر التحديثات — Spire" },
      { name: "description", content: "آخر أخبار وتحديثات البوت والموقع من الإدارة." },
      { property: "og:title", content: "آخر التحديثات — Spire" },
      { property: "og:description", content: "آخر أخبار وتحديثات البوت والموقع من الإدارة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["posts"], queryFn: () => listPosts(), retry: false, refetchInterval: 15_000 });
  const like = useMutation({ mutationFn: (id: string) => togglePostLike({ data: { id } }), onSettled: () => qc.invalidateQueries({ queryKey: ["posts"] }) });
  return (
    <AppShell>
      <PageHeader eyebrow="NEWS" icon={Megaphone} title="آخر التحديثات" subtitle="كل جديد عن البوت والموقع." />
      {data?.isOwner && (
        <Button asChild variant="gold" className="mb-6"><Link to="/admin"><PenLine className="h-4 w-4" /> اكتب تحديث جديد</Link></Button>
      )}
      {isLoading && <div className="member-panel h-40 animate-pulse" />}
      {data && !data.posts.length && <div className="member-panel text-center text-muted-foreground">ما فيه تحديثات للحين.</div>}
      <div className="flex flex-col gap-5">
        {data?.posts.map((p) => (
          <article key={p.id} className="member-panel post-card">
            {p.image_url && <img src={p.image_url} alt="" className="post-image" />}
            <div className="post-meta"><span>{p.author_name ?? "الإدارة"}</span><span>·</span><time dateTime={p.created_at} title={new Date(p.created_at).toLocaleString()}>{ago(p.created_at)}</time></div>
            <h2 className="font-display text-2xl">{p.title}</h2>
            <p className="post-body">{p.body}</p>
            <div className="mt-3">
              <Button size="sm" variant={p.liked ? "gold" : "outline"} disabled={like.isPending} onClick={() => like.mutate(p.id)} aria-pressed={p.liked}>
                <Heart className={`h-4 w-4 ${p.liked ? "fill-current" : ""}`} /> {p.likes}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
