// Verifies the bot's shared secret (Authorization: Bearer <BOT_API_SECRET>).
export async function isBotRequest(request: Request) {
  const secret = process.env["BOT_API_SECRET"];
  if (!secret) return false;
  const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return false;
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const d = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(d(token), d(secret));
}
