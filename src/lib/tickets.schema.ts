import { z } from "zod";

const ticketTypeSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  description: z.string().max(100).default(""),
  emoji: z.string().max(64).nullable().default(null),
  roleId: z.string().max(25).nullable().default(null),
  form: z.object({
    enabled: z.boolean().default(false),
    title: z.string().max(45).default(""),
    answersTitle: z.string().max(100).default("إجابات صاحب التذكرة"),
    questions: z.array(z.object({
      id: z.string().min(1).max(40),
      label: z.string().trim().min(1).max(45),
      placeholder: z.string().max(100).default(""),
      style: z.enum(["short", "paragraph"]).default("short"),
      required: z.boolean().default(true),
    })).max(5).default([]),
  }).default({}),
});
export type TicketForm = z.infer<typeof ticketTypeSchema>["form"];

const pos = z.object({ x: z.number().min(-600).max(600).default(0), y: z.number().min(-400).max(400).default(0) }).default({});
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const ticketDesignSchema = z.object({
  bgFrom: hex.default("#16201f"), bgVia: hex.default("#1f2e2c"), bgTo: hex.default("#2b4842"),
  accent: hex.default("#7fd4c1"), text: hex.default("#eef5f3"), card: hex.default("#ffffff"),
  bgImage: z.string().url().max(500).or(z.literal("")).default(""),
  bgDim: z.number().min(0).max(0.9).default(0.35),
  stripes: z.boolean().default(true),
  titleSize: z.number().min(30).max(90).default(58),
  header: pos, stats: pos, list: pos,
});
export type TicketDesign = z.infer<typeof ticketDesignSchema>;
export const defaultTicketDesign = (): TicketDesign => ticketDesignSchema.parse({});

export const ticketSchema = z.object({
  title: z.string().max(60).default(""),
  subtitle: z.string().max(120).default(""),
  replyTime: z.string().max(40).default(""),
  openMessage: z.string().max(1500).default(""),
  staffRoleIds: z.array(z.string().max(25)).max(50).default([]),
  maxOpenTickets: z.number().int().min(1).max(10).default(1),
  panelPlaceholder: z.string().trim().min(1).max(100).default("🎫 اختر نوع التذكرة"),
  welcome: z.object({
    title: z.string().max(100).default("مرحباً بك في تذكرتك"),
    imageTitle: z.string().max(60).default("تذكرة الدعم"),
    imageSubtitle: z.string().max(100).default("فريق الدعم هنا لمساعدتك"),
    imageUrl: z.string().url().max(500).or(z.literal("")).default(""),
    showImage: z.boolean().default(true),
    showNumber: z.boolean().default(true),
    showType: z.boolean().default(true),
    mentionStaff: z.boolean().default(true),
    closeLabel: z.string().trim().min(1).max(80).default("إغلاق التذكرة"),
    closeEmoji: z.string().max(64).default("🔒"),
    closeStyle: z.enum(["primary", "secondary", "success", "danger"]).default("danger"),
    claimLabel: z.string().trim().min(1).max(80).default("استلام التذكرة"),
    claimEmoji: z.string().max(64).default("🙋"),
    claimStyle: z.enum(["primary", "secondary", "success", "danger"]).default("success"),
    showClaim: z.boolean().default(true),
    design: ticketDesignSchema.default({}),
  }).default({}),
  staffRoleId: z.string().max(25).nullable().default(null),
  categoryId: z.string().max(25).nullable().default(null),
  logChannelId: z.string().max(25).nullable().default(null),
  blockedRoleIds: z.array(z.string().max(25)).max(50).default([]),
  types: z.array(ticketTypeSchema).max(25).default([]),
  design: ticketDesignSchema.default({}),
});


export type TicketSettings = z.infer<typeof ticketSchema>;
export const defaultTicketSettings = () => ticketSchema.parse({});
