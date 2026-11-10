import { z } from "zod";

export const EventDetailsSchema = z.object({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  timezone: z.string().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  mapsUrl: z.string().url().optional().or(z.literal("")),
});

export const PersonSchema = z.object({
  role: z.string(), // bride, groom, graduate, celebrant, sender, recipient
  displayName: z.string(),
});

export const BlockConfigSchema = z.object({
  id: z.string(),
  type: z.enum([
    "cover",
    "envelope_reveal",
    "intro_message",
    "event_details",
    "countdown",
    "gallery",
    "rsvp",
    "guestbook",
    "response_question",
    "music_control",
    "qr_display",
    "footer_cta",
  ]),
  enabled: z.boolean().default(true),
  config: z.record(z.unknown()).optional(),
});

export const InvitationContentSchema = z.object({
  schemaVersion: z.number().default(1),
  occasionKey: z.string(),
  locale: z.string().default("vi-VN"),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  subtitle: z.string().optional(),
  people: z.array(PersonSchema).default([]),
  event: EventDetailsSchema.optional(),
  message: z.string().optional(),
  loveMessages: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional(),
  galleryUrls: z.array(z.string()).default([]),
  privacy: z
    .object({
      mode: z.enum(["UNLISTED", "PASSWORD", "PUBLIC", "ARCHIVED"]).default("UNLISTED"),
      allowIndexing: z.boolean().default(false),
    })
    .default({ mode: "UNLISTED", allowIndexing: false }),
  features: z
    .object({
      rsvp: z.boolean().default(true),
      guestbook: z.boolean().default(false),
      backgroundMusicUrl: z.string().optional().nullable(),
      giftTransferInfo: z
        .object({
          enabled: z.boolean().default(false),
          bankName: z.string().optional(),
          accountNumber: z.string().optional(),
          accountHolder: z.string().optional(),
          qrImageUrl: z.string().optional(),
        })
        .optional(),
    })
    .default({ rsvp: true, guestbook: false }),
  responseQuestion: z
    .object({
      question: z.string(),
      options: z.array(z.string()),
    })
    .optional(),
  blocks: z.array(BlockConfigSchema).default([]),
});

export type InvitationContent = z.infer<typeof InvitationContentSchema>;
export type BlockConfig = z.infer<typeof BlockConfigSchema>;
