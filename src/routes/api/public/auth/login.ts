import { createFileRoute } from "@tanstack/react-router";
import { cookieAttrs, requestOrigin, canonicalOrigin } from "@/lib/discord.server";

export const Route = createFileRoute("/api/public/auth/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env["DISCORD_CLIENT_ID"] ?? "1557375124527779842";
        const origin = canonicalOrigin(request);
        if (origin !== requestOrigin(request))
          return new Response(null, { status: 302, headers: { Location: `${origin}/api/public/auth/login` } });
        const state = crypto.randomUUID();
        const url = new URL("https://discord.com/oauth2/authorize");
        url.searchParams.set("client_id", clientId);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("redirect_uri", `${origin}/api/public/auth/callback`);
        url.searchParams.set("scope", "identify guilds");
        url.searchParams.set("state", state);
        url.searchParams.set("prompt", "consent");
        return new Response(null, {
          status: 302,
          headers: { Location: url.toString(), "Set-Cookie": `lx_state=${state}; ${cookieAttrs(600)}` },
        });
      },
    },
  },
});
