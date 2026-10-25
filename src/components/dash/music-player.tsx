import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListMusic, Pause, Play, Repeat, Repeat1, Rewind, FastForward, Shuffle, SkipBack, SkipForward, Square, Trash2, Volume1, Volume2, VolumeX } from "lucide-react";
import { getMusic, musicControl, type MusicState } from "@/lib/music.functions";
import type { z } from "zod";
import type { musicActionSchema } from "@/lib/music.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Cmd = z.infer<typeof musicActionSchema>;
const MY = "__me";
const clock = (s: number) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h ? `${h}:` : ""}${h ? String(m).padStart(2, "0") : m}:${String(x).padStart(2, "0")}`; };

export function MusicPlayer({ guildId, voiceChannels }: { guildId: string; voiceChannels: { id: string; name: string }[] }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["music", guildId], queryFn: () => getMusic({ data: { guildId } }), refetchInterval: 2500 });
  const st: MusicState | null = data?.state ?? null;
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState(MY);
  const [drag, setDrag] = useState<number | null>(null);
  const [vol, setVol] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);

  const send = useMutation({
    mutationFn: (cmd: Cmd) => musicControl({ data: { guildId, cmd } }),
    onSuccess: (_r, cmd) => { if (cmd.action === "play") { setQuery(""); toast.success("انرسل الطلب للبوت 🎶"); } setTimeout(() => qc.invalidateQueries({ queryKey: ["music", guildId] }), 2500); },
    onError: (e) => toast.error((e as Error).message),
  });
  const run = (cmd: Cmd) => send.mutate(cmd);

  const cur = st?.current;
  const dur = cur?.duration ?? 0;
  const live = st ? Math.min(dur || Infinity, st.position + (st.playing && !st.paused ? (now - st.at) / 1000 : 0)) : 0;
  const pos = drag ?? live;
  const volume = vol ?? st?.volume ?? 60;
  const VolIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="mp">
      <form className="panel flex flex-wrap items-center gap-3 p-4" onSubmit={(e) => { e.preventDefault(); if (query.trim()) run({ action: "play", query, channelId: channel === MY ? undefined : channel }); }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="رابط يوتيوب / سبوتيفاي / ساوند كلاود أو اسم الأغنية" className="min-w-[240px] flex-1" />
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={MY}>🎧 الروم اللي أنا فيه</SelectItem>
            {voiceChannels.map((c) => <SelectItem key={c.id} value={c.id}>🔊 {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit" variant="gold" disabled={send.isPending}><Play className="h-4 w-4" /> تشغيل</Button>
      </form>

      <section className="panel mp-now" style={{ ["--mp-art" as string]: cur?.thumbnail ? `url("${cur.thumbnail}")` : "none" }}>
        {cur?.thumbnail ? <img src={cur.thumbnail} alt="" className="mp-art" /> : <div className="mp-art">🎵</div>}
        <div className="flex min-w-0 flex-col justify-center gap-4">
          <div>
            {cur && <span className="mp-src">{cur.source}</span>}
            <p className="mp-title mt-2">{cur?.title ?? "ما فيه شي شغال"}</p>
            <p className="text-sm text-muted-foreground">{cur ? `${cur.author}${cur.requestedBy ? ` • طلب: ${cur.requestedBy}` : ""}` : "اكتب اسم أغنية فوق وبيدخل البوت رومك ويشغلها."}{st?.channel ? ` • 🔊 ${st.channel}` : ""}</p>
          </div>
          <div>
            <input type="range" className="mp-range" min={0} max={Math.max(1, dur)} value={Math.min(pos, dur || 1)} disabled={!cur || !dur}
              onChange={(e) => setDrag(Number(e.target.value))}
              onPointerUp={() => { if (drag !== null) { run({ action: "seek", seconds: Math.round(drag) }); setTimeout(() => setDrag(null), 2500); } }}
              onKeyUp={() => { if (drag !== null) { run({ action: "seek", seconds: Math.round(drag) }); setTimeout(() => setDrag(null), 2500); } }} aria-label="خط الوقت" />
            <div className="mp-time"><span>{clock(pos)}</span><span>{clock(dur)}</span></div>
          </div>
          <div className="mp-ctrls">
            <button type="button" className="mp-btn" data-on={st?.repeat !== "off" && st ? "" : undefined} disabled={!cur} title="تكرار"
              onClick={() => run({ action: "loop", mode: st?.repeat === "off" ? "queue" : st?.repeat === "queue" ? "song" : "off" })}>
              {st?.repeat === "song" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </button>
            <button type="button" className="mp-btn" disabled={!cur} title="السابقة" onClick={() => run({ action: "previous" })}><SkipBack className="h-5 w-5" /></button>
            <button type="button" className="mp-btn" disabled={!cur} title="رجوع 10 ثواني" onClick={() => run({ action: "forward", seconds: -10 })}><Rewind className="h-5 w-5" /></button>
            <button type="button" className="mp-btn mp-btn-main" disabled={!cur} title="تشغيل/إيقاف مؤقت" onClick={() => run({ action: st?.paused ? "resume" : "pause" })}>
              {st?.paused || !cur ? <Play className="h-7 w-7" /> : <Pause className="h-7 w-7" />}
            </button>
            <button type="button" className="mp-btn" disabled={!cur} title="تقديم 10 ثواني" onClick={() => run({ action: "forward", seconds: 10 })}><FastForward className="h-5 w-5" /></button>
            <button type="button" className="mp-btn" disabled={!cur} title="التالية" onClick={() => run({ action: "skip" })}><SkipForward className="h-5 w-5" /></button>
            <button type="button" className="mp-btn" disabled={!cur} title="خلط" onClick={() => run({ action: "shuffle" })}><Shuffle className="h-5 w-5" /></button>
            <button type="button" className="mp-btn" disabled={!cur} title="إيقاف وخروج" onClick={() => run({ action: "stop" })}><Square className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center gap-3" style={{ direction: "ltr" }}>
            <VolIcon className="h-5 w-5 text-primary" />
            <input type="range" className="mp-range" min={1} max={100} value={volume} disabled={!cur}
              onChange={(e) => setVol(Number(e.target.value))}
              onPointerUp={() => { if (vol !== null) { run({ action: "volume", value: vol }); setTimeout(() => setVol(null), 3000); } }} aria-label="الصوت" />
            <b className="w-10 text-sm">{volume}%</b>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><ListMusic className="h-5 w-5 text-primary" /> قائمة الانتظار ({st?.queue.length ?? 0})</h3>
        {!st?.queue.length ? <p className="text-sm text-muted-foreground">القائمة فاضية.</p> : (
          <ul className="mp-queue">
            {st.queue.map((t, i) => (
              <li key={`${t.url}-${i}`}>
                <b className="w-6 text-center text-muted-foreground">{i + 1}</b>
                {t.thumbnail ? <img src={t.thumbnail} alt="" /> : <span className="mp-art !h-11 !w-11 !text-lg">🎵</span>}
                <button type="button" className="min-w-0 flex-1 text-start" onClick={() => run({ action: "jump", index: i })} title="شغلها الحين">
                  <p className="truncate font-semibold">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.author} • {clock(t.duration)}</p>
                </button>
                <Button size="icon" variant="ghost" onClick={() => run({ action: "remove", index: i })} aria-label="حذف"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
