import { createFileRoute } from "@tanstack/react-router";
import { SESSION_COOKIE, cookieAttrs, signValue, canonicalOrigin, type Session } from "@/lib/discord.server";

const readCookie = (req: Request, name: string) =>
  req.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1);

export const Route = createFileRoute("/api/public/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state || state !== readCookie(request, "lx_state"))
          return new Response(null, { status: 302, headers: { Location: "/?error=state" } });

        const body = new URLSearchParams({
          client_id: process.env["DISCORD_CLIENT_ID"] ?? "1557375124527779842",
          client_secret: process.env["DISCORD_CLIENT_SECRET"] ?? "",
          grant_type: "authorization_code",
          code,
          redirect_uri: `${canonicalOrigin(request)}/api/public/auth/callback`,
        });
        const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!tokenRes.ok) {
          console.error("Discord token exchange failed", tokenRes.status);
          return new Response(null, { status: 302, headers: { Location: "/?error=token" } });
        }
        const tok = (await tokenRes.json()) as { access_token: string; expires_in: number };
        const meResponse = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${tok.access_token}` } });
        if (!meResponse.ok) return new Response(null, { status: 302, headers: { Location: "/?error=profile" } });
        const me = (await meResponse.json()) as { id: string; username: string; global_name?: string; avatar: string | null };

        const session: Session = {
          uid: me.id,
          name: me.global_name || me.username,
          avatar: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128` : null,
          token: tok.access_token,
          exp: Date.now() + Math.min(tok.expires_in, 7 * 86400) * 1000,
        };
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const prev = await supabaseAdmin.from("site_users").select("login_count").eq("user_id", me.id).maybeSingle();
          await supabaseAdmin.from("site_users").upsert({
            user_id: me.id, username: session.name, avatar: session.avatar,
            last_login: new Date().toISOString(), login_count: (prev.data?.login_count ?? 0) + 1,
          }, { onConflict: "user_id" });
          const { logActivity } = await import("@/lib/activity.server");
          await logActivity({ userId: me.id, username: session.name, action: "login" });
        } catch (e) { console.error("site user record failed", e); }
        const headers = new Headers({ Location: "/home" });
        headers.append("Set-Cookie", `${SESSION_COOKIE}=${await signValue(session)}; ${cookieAttrs(7 * 86400)}`);
        headers.append("Set-Cookie", `lx_state=; ${cookieAttrs(0)}`);
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
