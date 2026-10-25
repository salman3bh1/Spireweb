import { createFileRoute } from "@tanstack/react-router";

// Serves uploaded welcome-card backgrounds (non-sensitive images) to the bot and dashboard.
export const Route = createFileRoute("/api/public/bg/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^\d{15,21}-[a-z0-9]{6,20}\.(png|jpg|jpeg|webp|gif)$/.test(params.file)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("welcome").download(params.file);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, { headers: { "Content-Type": data.type || "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
      },
    },
  },
});
