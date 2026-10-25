// Server-only helpers: signed session cookie + Discord REST calls.
import { getCookie } from "@tanstack/react-start/server";

export const SESSION_COOKIE = "lx_session";
const API = "https://discord.com/api/v10";
const ADMINISTRATOR = 0x8n;

export type Session = {
  uid: string;
  name: string;
  avatar: string | null;
  token: string;
  exp: number; // ms epoch
};

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const str = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(str, (c) => c.charCodeAt(0));
};

async function sessionKey() {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET missing");
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function signValue(obj: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await sessionKey(), enc.encode(JSON.stringify(obj)));
  return `${b64url(iv)}.${b64url(encrypted)}`;
}

export async function verifyValue<T>(raw: string | undefined | null): Promise<T | null> {
  if (!raw) return null;
  const [iv, body] = raw.split(".");
  if (!body || !iv) return null;
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64url(iv) }, await sessionKey(), fromB64url(body));
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<Session | null> {
  const s = await verifyValue<Session>(getCookie(SESSION_COOKIE));
  if (!s || s.exp < Date.now()) return null;
  return s;
}

export async function requireSession() {
  const s = await readSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

// The real public origin (behind proxies request.url can be internal)
export function requestOrigin(request: Request) {
  const u = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? u.host;
  const proto = request.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${proto}://${host}`;
}

// Login works on whatever address the site is opened from (Lovable URL or a
// custom domain). Each address must be listed under OAuth2 > Redirects in the
// Discord Developer Portal as <origin>/api/auth/callback.
export function canonicalOrigin(request: Request) {
  return requestOrigin(request);
}

export function cookieAttrs(maxAgeSec: number) {
  return `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

async function discord<T>(path: string, auth: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(API + path, { headers: { Authorization: auth === "BOT" ? botHeader() : auth } });
    if (res.status === 429) {
      const j = (await res.json().catch(() => ({}))) as { retry_after?: number };
      await new Promise((r) => setTimeout(r, Math.min((j.retry_after ?? 1) * 1000, 5000)));
      continue;
    }
    if (!res.ok) { const body = await res.text(); console.error(`Discord [${res.status}]: ${body}`); throw new Error(`Discord [${res.status}]: ${body}`); }
    return (await res.json()) as T;
  }
  throw new Error("Discord rate limited");
}

function botHeader() {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) throw new Error("DISCORD_TOKEN missing");
  return `Bot ${token}`;
}
const botAuth = () => "BOT";

type RawGuild = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };

// small in-memory cache to avoid Discord rate limits
const cache = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.v as T;
  const v = await fn();
  cache.set(key, { at: Date.now(), v });
  return v;
}

// Discord returns max 200 guilds per page (25 by default) — paginate with
// `after` or guilds beyond the first page silently disappear, which made the
// dashboard report "no permission" for valid servers.
async function allGuilds<T extends { id: string }>(auth: string): Promise<T[]> {
  const out: T[] = [];
  let after: string | undefined;
  for (;;) {
    const page = await discord<T[]>(`/users/@me/guilds?limit=200${after ? `&after=${after}` : ""}`, auth);
    out.push(...page);
    if (page.length < 200) return out;
    const last = page.at(-1);
    if (!last) return out;
    after = last.id;
  }
}

export async function userAdminGuilds(s: Session) {
  const guilds = await cached(`ug:${s.uid}`, 15_000, () => allGuilds<RawGuild>(`Bearer ${s.token}`));
  return guilds.filter((g) => g.owner || (BigInt(g.permissions) & ADMINISTRATOR) === ADMINISTRATOR);
}

export async function botGuildIds() {
  const list = await cached("botguilds", 15_000, () => allGuilds<{ id: string }>(botAuth()));
  return new Set(list.map((g) => g.id));
}

export type SiteRole = "moderator" | "manager" | "owner";
const RANK: Record<SiteRole, number> = { moderator: 1, manager: 2, owner: 3 };
export const roleAtLeast = (have: SiteRole, need: SiteRole) => RANK[have] >= RANK[need];

/** Guilds the user belongs to (any permission) — used to confirm site-granted access is still valid. */
export async function userGuilds(s: Session) {
  return cached(`ug:${s.uid}`, 15_000, () => allGuilds<RawGuild>(`Bearer ${s.token}`));
}

async function grantedRole(guildId: string, userId: string): Promise<SiteRole | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("dashboard_access").select("role").eq("guild_id", guildId).eq("user_id", userId).maybeSingle();
  return (data?.role as SiteRole | undefined) ?? null;
}

/**
 * Server owners/Discord admins (and the bot owner) are "owner". Others need a role granted
 * from the dashboard: "manager" (all settings) or "moderator" (members + activity only).
 */
export async function assertGuildAccess(s: Session, guildId: string, need: SiteRole = "manager"): Promise<RawGuild & { siteRole: SiteRole }> {
  const { OWNER_ID } = await import("./activity.server");
  if (s.uid === OWNER_ID) {
    // The bot owner can open any server the bot is in.
    const g = await discord<{ id: string; name: string; icon: string | null }>(`/guilds/${guildId}`, botAuth()).catch(() => null);
    if (!g) throw new Error("BOT_MISSING");
    return { id: g.id, name: g.name, icon: g.icon, owner: false, permissions: "8", siteRole: "owner" };
  }
  const [all, bot] = await Promise.all([userGuilds(s), botGuildIds()]);
  const g = all.find((x) => x.id === guildId);
  if (!g) throw new Error("NOT_ADMIN");
  const isAdmin = g.owner || (BigInt(g.permissions) & ADMINISTRATOR) === ADMINISTRATOR;
  const siteRole: SiteRole | null = isAdmin ? "owner" : await grantedRole(guildId, s.uid);
  if (!siteRole || !roleAtLeast(siteRole, need)) throw new Error("NOT_ADMIN");
  if (!bot.has(guildId)) {
    // The cached bot list may be stale (bot just invited) — ask Discord directly.
    const inGuild = await discord(`/guilds/${guildId}`, botAuth()).then(() => true, () => false);
    if (!inGuild) throw new Error("BOT_MISSING");
    cache.delete("botguilds");
  }
  return { ...g, siteRole };
}

export type Role = { id: string; name: string; color: number; position: number; managed: boolean };
export type Channel = { id: string; name: string; type: number; position: number; topic?: string | null };

export const guildRoles = (id: string) => discord<Role[]>(`/guilds/${id}/roles`, botAuth());
export const guildChannels = (id: string) => discord<Channel[]>(`/guilds/${id}/channels`, botAuth());

/** Position of the bot's highest role in a guild: it can only give roles below this. */
export async function botTopRolePosition(guildId: string, roles: Role[]): Promise<number> {
  const me = await cached("botme", 3_600_000, () => discord<{ id: string }>("/users/@me", botAuth()));
  const member = await discord<{ roles: string[] }>(`/guilds/${guildId}/members/${me.id}`, botAuth());
  const pos = new Map(roles.map((r) => [r.id, r.position]));
  return Math.max(0, ...member.roles.map((id) => pos.get(id) ?? 0));
}

export async function botCommands() {
  return cached("cmds", 60_000, async () => {
    const app = await discord<{ id: string }>("/oauth2/applications/@me", botAuth());
    const cmds = await discord<{ name: string; description: string }[]>(`/applications/${app.id}/commands`, botAuth());
    return cmds.map((c) => ({ name: c.name, description: c.description }));
  });
}

export async function discordWrite<T>(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: botHeader(), "Content-Type": "application/json" },
    body: body === undefined ? null : JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`Discord ${method} ${path} → ${res.status}: ${t}`);
    throw new Error(`Discord [${res.status}]: ${t}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const guildInfo = (id: string) =>
  cached(`gi:${id}`, 30_000, () =>
    discord<{ approximate_member_count?: number; approximate_presence_count?: number; premium_subscription_count?: number }>(
      `/guilds/${id}?with_counts=true`,
      botAuth(),
    ),
  );

// Every server the bot is in (owner control panel).
export async function botGuildsFull() {
  return cached("botguildsfull", 30_000, () =>
    allGuilds<{ id: string; name: string; icon: string | null; approximate_member_count?: number }>(botAuth()),
  );
}
