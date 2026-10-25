import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { modulesSchema, embedDataSchema, type EmbedData } from "./modules.schema";

const gid = z.string().regex(/^\d{15,21}$/);
const snow = z.string().regex(/^\d{15,21}$/);

export const saveModules = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, modules: modulesSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin.from("guild_settings").select("modules").eq("guild_id", data.guildId).maybeSingle();
    const before = (prev?.modules ?? {}) as Record<string, unknown>;
    const changed = Object.keys(data.modules).filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify((data.modules as Record<string, unknown>)[k] ?? null));
    const { error } = await supabaseAdmin.from("guild_settings").upsert(
      { guild_id: data.guildId, modules: data.modules, updated_at: new Date().toISOString(), updated_by: s.uid },
      { onConflict: "guild_id" },
    );
    if (error) {
      console.error(error);
      throw new Error("Save failed");
    }
    const { logActivity } = await import("./activity.server");
    if (changed.length) await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "save_settings", details: { sections: changed } });
    return { ok: true };
  });

export const listEmbeds = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ guildId: gid }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("guild_embeds")
      .select("id, name, data, last_channel_id, last_message_id, updated_at")
      .eq("guild_id", data.guildId)
      .order("created_at");
    if (error) throw new Error("Load failed");
    return rows.map((r) => ({ ...r, data: embedDataSchema.parse(r.data ?? {}) }));
  });

export const upsertEmbed = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ guildId: gid, id: z.string().uuid().nullable(), name: z.string().trim().min(1).max(80), data: embedDataSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("guild_embeds")
        .update({ name: data.name, data: data.data, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .eq("guild_id", data.guildId);
      if (error) throw new Error("Save failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "update_embed", details: { name: data.name } });
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("guild_embeds")
      .insert({ guild_id: data.guildId, name: data.name, data: data.data })
      .select("id")
      .single();
    if (error) throw new Error("Save failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "create_embed", details: { name: data.name } });
    return { id: row.id };
  });

export const deleteEmbed = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("guild_embeds").delete().eq("id", data.id).eq("guild_id", data.guildId);
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "delete_embed" });
    return { ok: true };
  });

const isUrl = (u: string) => /^https?:\/\//i.test(u);
function toPayload(e: EmbedData) {
  const embed: { [k: string]: unknown; title?: string; url?: string; description?: string; author?: unknown; thumbnail?: unknown; image?: unknown; footer?: unknown; timestamp?: string; fields?: unknown } = { color: parseInt(e.color.slice(1), 16) };
  if (e.title) embed.title = e.title;
  if (e.url && isUrl(e.url)) embed.url = e.url;
  if (e.description) embed.description = e.description;
  if (e.authorName) embed.author = { name: e.authorName, ...(isUrl(e.authorIcon) ? { icon_url: e.authorIcon } : {}) };
  if (isUrl(e.thumbnail)) embed.thumbnail = { url: e.thumbnail };
  if (isUrl(e.image)) embed.image = { url: e.image };
  if (e.footer) embed.footer = { text: e.footer, ...(isUrl(e.footerIcon) ? { icon_url: e.footerIcon } : {}) };
  if (e.timestamp) embed.timestamp = new Date().toISOString();
  if (e.fields.length) embed.fields = e.fields;
  const hasEmbed = Object.keys(embed).length > 1;
  if (!hasEmbed && !e.content) throw new Error("الرسالة فاضية");
  return { content: e.content || undefined, embeds: hasEmbed ? [embed] : [] };
}

// Sends the embed through the bot, or edits a message the bot already sent.
export const sendEmbed = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ guildId: gid, embedId: z.string().uuid().nullable(), channelId: snow, messageId: snow.nullable(), data: embedDataSchema })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { guildChannels } = await import("./discord.server");
    const chans = await guildChannels(data.guildId);
    if (!chans.some((c) => c.id === data.channelId)) throw new Error("الروم مو في هذا السيرفر");
    const payload = toPayload(data.data);
    const msg = data.messageId
      ? await discordWrite<{ id: string }>("PATCH", `/channels/${data.channelId}/messages/${data.messageId}`, payload)
      : await discordWrite<{ id: string }>("POST", `/channels/${data.channelId}/messages`, payload);
    if (data.embedId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("guild_embeds")
        .update({ last_channel_id: data.channelId, last_message_id: msg.id })
        .eq("id", data.embedId)
        .eq("guild_id", data.guildId);
    }
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "send_embed", details: { channelId: data.channelId, edited: !!data.messageId } });
    return { messageId: msg.id };
  });

// Uploads a welcome-card background; returns a URL the bot can download.
export const uploadWelcomeBg = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guildId: gid, dataUrl: z.string().max(7_000_000) }).parse(d))
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/.exec(data.dataUrl);
    if (!m) throw new Error("الملف لازم يكون صورة");
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const bytes = Uint8Array.from(atob(m[2] ?? ""), (c) => c.charCodeAt(0));
    const name = `${data.guildId}-${Math.random().toString(36).slice(2, 12)}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("welcome").upload(name, bytes, { contentType: `image/${m[1]}` });
    if (error) throw new Error("فشل الرفع");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "upload_image" });
    return { path: `/api/public/bg/${name}` };
  });

// Queues a one-off bulk role give/remove; the bot picks it up on next sync.
export const startRoleJob = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ guildId: gid, roleId: snow, action: z.enum(["give", "remove"]), target: z.enum(["members", "all", "bots"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { requireSession, assertGuildAccess, discordWrite } = await import("./discord.server");
    const s = await requireSession();
    await assertGuildAccess(s, data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("guild_settings").select("modules").eq("guild_id", data.guildId).maybeSingle();
    const mods = modulesSchema.catch(modulesSchema.parse({})).parse(row?.modules ?? {});
    const id = Date.now().toString(36);
    mods.autoRoles.job = { id, roleId: data.roleId, action: data.action, target: data.target };
    const { error } = await supabaseAdmin.from("guild_settings").upsert(
      { guild_id: data.guildId, modules: mods, updated_at: new Date().toISOString(), updated_by: s.uid },
      { onConflict: "guild_id" },
    );
    if (error) throw new Error("Save failed");
    const { logActivity } = await import("./activity.server");
    await logActivity({ userId: s.uid, username: s.name, guildId: data.guildId, action: "role_job", details: { roleId: data.roleId, mode: data.action, target: data.target } });
    return { id };
  });
