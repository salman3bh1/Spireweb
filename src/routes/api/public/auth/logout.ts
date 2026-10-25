import { createFileRoute } from "@tanstack/react-router";
import { SESSION_COOKIE, cookieAttrs } from "@/lib/discord.server";

export const Route = createFileRoute("/api/public/auth/logout")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "/", "Set-Cookie": `${SESSION_COOKIE}=; ${cookieAttrs(0)}` },
        }),
    },
  },
});
