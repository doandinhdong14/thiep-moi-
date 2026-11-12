import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import {
  DEFAULT_TEMPLATE_SLUG,
  TEMPLATES_REGISTRY,
  TemplateMeta,
  getTemplateDemoContent,
} from "@/lib/templates/registry";
import { getEffectiveVisibleTemplates } from "@/lib/templates/adminConfig";
import { hydrateInteractiveHtml, INTERACTIVE_TEMPLATE_URLS } from "@/lib/templates/hydrateInteractiveHtml";
import type { InvitationContent } from "@/lib/templates/schema";
import {
  decryptGiftToken,
  encryptGiftToken,
  generateOpaqueGiftToken,
  hashShopToken,
} from "./auth";
import { safeJsonParse, sanitizeImageUrl } from "./types";

export interface ShopMusicTrack {
  id: string;
  label: string;
  url: string;
  mood: string;
}

export const SHOP_MUSIC_TRACKS: ShopMusicTrack[] = [
  { id: "", label: "Không phát nhạc nền", url: "", mood: "Tĩnh lặng" },
  {
    id: "romantic-musicbox",
    label: "Hộp nhạc lãng mạn",
    url: "/audio/romantic-musicbox.wav",
    mood: "Ngọt ngào • Lãng mạn",
  },
  {
    id: "piano-memories",
    label: "Piano ký ức",
    url: "/audio/piano-memories.wav",
    mood: "Nhẹ nhàng • Sâu lắng",
  },
  {
    id: "christmas-bell",
    label: "Chuông mùa đông ấm áp",
    url: "/audio/christmas-bell.wav",
    mood: "Lễ hội • Ấm áp",
  },
];

export const MESSAGE_SUGGESTIONS: { key: string; label: string; text: string }[] = [
  {
    key: "warm_winter",
    label: "Chúc ấm áp mùa đông",
    text: "Gửi bạn một chút mềm mại cho những ngày gió về. Mong mỗi khi khoác lên mình món quà nhỏ này, bạn sẽ luôn cảm thấy bình yên và được yêu thương.",
  },
  {
    key: "birthday",
    label: "Chúc mừng sinh nhật",
    text: "Chúc mừng sinh nhật người đặc biệt nhất! Mong tuổi mới mang thật nhiều tiếng cười, sức khỏe và những khoảnh khắc dịu dàng bên những người thương.",
  },
  {
    key: "love_anniversary",
    label: "Kỷ niệm & Lời thương",
    text: "Cảm ơn vì đã luôn ở bên và làm những ngày bình thường trở nên rực rỡ. Món quà nhỏ kèm tấm thiệp này thay cho thật nhiều cái ôm.",
  },
  {
    key: "thank_you",
    label: "Lời cảm ơn tinh tế",
    text: "Cảm ơn bạn thật nhiều vì sự đồng hành và tử tế trong suốt thời gian qua. Chúc bạn luôn rạng rỡ và an yên trên mọi hành trình.",
  },
];

export interface GiftCustomizationPayload {
  templateSlug: string;
  cardPlanCode?: string;
  giftWrapCode?: string;
  recipientName: string;
  senderName: string;
  title?: string;
  message: string;
  occasion?: string;
  musicTrackId?: string;
  photoUrls?: string[];
  presetColor?: string;
}

export function sanitizeCardText(input: string | null | undefined, maxLen: number): string {
  return String(input || "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim()
    .slice(0, maxLen);
}

export function resolveMusicTrackUrl(trackId?: string | null): string | null {
  if (!trackId) return null;
  const matched = SHOP_MUSIC_TRACKS.find(
    (t) => t.id === trackId || t.url === trackId,
  );
  return matched && matched.url ? matched.url : null;
}

export async function getEligibleShopTemplates(eligibleSlugs?: string[]): Promise<{
  templates: (TemplateMeta & { previewUrl: string })[];
  fallbackSlug: string;
}> {
  const templates = await getEffectiveVisibleTemplates();
  const normalizedAllowlist = (eligibleSlugs || []).filter(Boolean);

  let pool = templates;
  if (normalizedAllowlist.length > 0) {
    const filtered = templates.filter((t: TemplateMeta) => normalizedAllowlist.includes(t.slug));
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  if (pool.length === 0) {
    const fallbackMeta = TEMPLATES_REGISTRY[DEFAULT_TEMPLATE_SLUG] || Object.values(TEMPLATES_REGISTRY)[0];
    pool = [fallbackMeta];
  }

  const enriched = pool.map((t: TemplateMeta) => ({
    ...t,
    previewUrl: `/previews/${t.slug}.webp`,
  }));

  return {
    templates: enriched,
    fallbackSlug: enriched[0]?.slug || DEFAULT_TEMPLATE_SLUG,
  };
}

export function resolveTemplateMetaWithFallback(slug: string | null | undefined): TemplateMeta {
  if (slug && TEMPLATES_REGISTRY[slug]) {
    return TEMPLATES_REGISTRY[slug];
  }
  return TEMPLATES_REGISTRY[DEFAULT_TEMPLATE_SLUG] || Object.values(TEMPLATES_REGISTRY)[0];
}

export function buildGiftInvitationContent(input: GiftCustomizationPayload): {
  templateMeta: TemplateMeta;
  content: InvitationContent;
} {
  const templateMeta = resolveTemplateMetaWithFallback(input.templateSlug);
  const demo = getTemplateDemoContent(templateMeta.slug);

  const recipientName = sanitizeCardText(input.recipientName, 80) || "Người thương";
  const senderName = sanitizeCardText(input.senderName, 80) || "Một người thương bạn";
  const title =
    sanitizeCardText(input.title, 120) ||
    `Gửi ${recipientName} một lời chúc ấm áp`;
  const message =
    sanitizeCardText(input.message, 2000) ||
    demo.message ||
    "Chúc bạn luôn thật nhiều niềm vui và bình an.";

  const cleanPhotos = (input.photoUrls || [])
    .map((u) => sanitizeImageUrl(u))
    .filter((u): u is string => Boolean(u))
    .slice(0, 6);

  const musicUrl = resolveMusicTrackUrl(input.musicTrackId);

  const content: InvitationContent = {
    schemaVersion: 1,
    occasionKey: input.occasion || templateMeta.occasionKey || "love",
    locale: "vi-VN",
    title,
    subtitle: sanitizeCardText(input.occasion, 60) || templateMeta.occasionTitle,
    people: [
      { role: "sender", displayName: senderName },
      { role: "recipient", displayName: recipientName },
    ],
    message,
    coverImageUrl: cleanPhotos[0] || demo.coverImageUrl,
    galleryUrls: cleanPhotos,
    privacy: {
      mode: "UNLISTED",
      allowIndexing: false,
    },
    features: {
      rsvp: false,
      guestbook: false,
      backgroundMusicUrl: musicUrl,
    },
    responseQuestion: demo.responseQuestion,
    blocks: (templateMeta.blocks || demo.blocks.map((b) => b.type)).map((type, i) => ({
      id: `blk_${i}`,
      type: type as InvitationContent["blocks"][number]["type"],
      enabled: true,
    })),
  };

  return { templateMeta, content };
}

export function hydrateShopCardHtml(params: {
  templateSlug: string;
  content: InvitationContent;
  unitReference?: string;
  isPreview?: boolean;
}): {
  templateMeta: TemplateMeta;
  interactiveHtml?: string;
} {
  const templateMeta = resolveTemplateMetaWithFallback(params.templateSlug);
  let interactiveHtml: string | undefined;

  if (INTERACTIVE_TEMPLATE_URLS[templateMeta.slug]) {
    try {
      const htmlPath = path.join(
        process.cwd(),
        "public",
        "templates",
        `${templateMeta.slug}.html`,
      );
      if (fs.existsSync(htmlPath)) {
        const rawHtml = fs.readFileSync(htmlPath, "utf-8");
        interactiveHtml = hydrateInteractiveHtml(rawHtml, templateMeta.slug, params.content, {
          invitationSlug: params.unitReference,
          isPreview: Boolean(params.isPreview),
        });
      }
    } catch {
      interactiveHtml = undefined;
    }
  }

  return { templateMeta, interactiveHtml };
}

export function createGiftUnitTokenPair() {
  const rawToken = generateOpaqueGiftToken();
  return {
    rawToken,
    giftTokenHash: hashShopToken(rawToken),
    giftTokenEncrypted: encryptGiftToken(rawToken),
  };
}

export function revealGiftUnitRawToken(giftTokenEncrypted: string): string | null {
  return decryptGiftToken(giftTokenEncrypted);
}

export interface RecipientLandingPayload {
  found: boolean;
  state:
    | "NOT_FOUND"
    | "PREPARING"
    | "READY_UNOPENED"
    | "ACTIVE"
    | "EXPIRED"
    | "DISABLED";
  isAdminPreview?: boolean;
  envelope?: {
    boxReferenceCode: string;
    templateSlug: string;
    templateTitle: string;
    templateBadge: string;
    previewImageUrl: string;
    theme: TemplateMeta["theme"];
    durationDays: number | null;
    hasMusic: boolean;
    photoCount: number;
  };
  card?: {
    templateSlug: string;
    templateTitle: string;
    theme: TemplateMeta["theme"];
    content: InvitationContent;
    interactiveHtml?: string;
    firstOpenedAt: string | null;
    expiresAt: string | null;
  };
}

function resolveSnapshotToContent(unit: {
  templateSlug: string;
  cardSnapshotJson: string;
  customization?: {
    templateSlug: string;
    recipientName: string;
    senderName: string;
    title: string;
    message: string;
    occasion: string | null;
    musicTrackId: string | null;
    photoUrlsJson: string;
    presetColor: string | null;
  } | null;
}): { templateSlug: string; content: InvitationContent } {
  const parsed = safeJsonParse<InvitationContent | null>(unit.cardSnapshotJson, null);
  if (parsed && parsed.title && Array.isArray(parsed.people)) {
    return {
      templateSlug: unit.templateSlug,
      content: parsed,
    };
  }
  const c = unit.customization;
  const built = buildGiftInvitationContent({
    templateSlug: c?.templateSlug || unit.templateSlug,
    recipientName: c?.recipientName || "Bạn thương",
    senderName: c?.senderName || "Người gửi",
    title: c?.title || "",
    message: c?.message || "",
    occasion: c?.occasion || undefined,
    musicTrackId: c?.musicTrackId || undefined,
    photoUrls: safeJsonParse<string[]>(c?.photoUrlsJson, []),
    presetColor: c?.presetColor || undefined,
  });
  return { templateSlug: built.templateMeta.slug, content: built.content };
}

export async function getRecipientGiftLanding(
  rawToken: string,
  options?: { isAdminPreview?: boolean },
): Promise<RecipientLandingPayload> {
  if (!rawToken || rawToken.length < 8) {
    return { found: false, state: "NOT_FOUND" };
  }

  const hash = hashShopToken(rawToken);
  const unit = await prisma.storeOrderGiftUnit.findUnique({
    where: { giftTokenHash: hash },
    include: {
      order: {
        select: {
          status: true,
          paymentStatus: true,
        },
      },
      customization: true,
    },
  });

  if (!unit) {
    return { found: false, state: "NOT_FOUND" };
  }

  const cancelledStatuses = [
    "CANCELLED",
    "REFUND_PENDING_MANUAL",
    "REFUNDED",
    "EXPIRED",
    "STOCK_CONFLICT_REFUND_NEEDED",
  ];
  if (unit.cardState === "DISABLED" || cancelledStatuses.includes(unit.order.status)) {
    return { found: true, state: "DISABLED" };
  }

  const now = new Date();
  if (unit.cardState === "EXPIRED" || (unit.expiresAt && unit.expiresAt <= now)) {
    return { found: true, state: "EXPIRED" };
  }

  const { templateSlug, content } = resolveSnapshotToContent(unit);
  const templateMeta = resolveTemplateMetaWithFallback(templateSlug);
  const envelope: RecipientLandingPayload["envelope"] = {
    boxReferenceCode: unit.boxReferenceCode,
    templateSlug: templateMeta.slug,
    templateTitle: templateMeta.title,
    templateBadge: templateMeta.badge || templateMeta.occasionTitle,
    previewImageUrl: `/previews/${templateMeta.slug}.webp`,
    theme: templateMeta.theme,
    durationDays: unit.durationDays,
    hasMusic: Boolean(content.features?.backgroundMusicUrl),
    photoCount: content.galleryUrls?.length || 0,
  };

  if (options?.isAdminPreview) {
    const { interactiveHtml } = hydrateShopCardHtml({
      templateSlug,
      content,
      unitReference: unit.boxReferenceCode,
      isPreview: true,
    });
    return {
      found: true,
      state:
        unit.cardState === "ACTIVE"
          ? "ACTIVE"
          : unit.cardState === "PREPARING"
            ? "PREPARING"
            : "READY_UNOPENED",
      isAdminPreview: true,
      envelope,
      card: {
        templateSlug,
        templateTitle: templateMeta.title,
        theme: templateMeta.theme,
        content,
        interactiveHtml,
        firstOpenedAt: unit.firstOpenedAt ? unit.firstOpenedAt.toISOString() : null,
        expiresAt: unit.expiresAt ? unit.expiresAt.toISOString() : null,
      },
    };
  }

  if (unit.cardState === "PREPARING") {
    return {
      found: true,
      state: "PREPARING",
      envelope,
    };
  }

  if (unit.cardState === "READY_UNOPENED") {
    // Strictly NEVER activate firstOpenedAt on GET!
    return {
      found: true,
      state: "READY_UNOPENED",
      envelope,
    };
  }

  // Already ACTIVE (within validity)
  const { interactiveHtml } = hydrateShopCardHtml({
    templateSlug,
    content,
    unitReference: unit.boxReferenceCode,
    isPreview: false,
  });

  return {
    found: true,
    state: "ACTIVE",
    envelope,
    card: {
      templateSlug,
      templateTitle: templateMeta.title,
      theme: templateMeta.theme,
      content,
      interactiveHtml,
      firstOpenedAt: unit.firstOpenedAt ? unit.firstOpenedAt.toISOString() : null,
      expiresAt: unit.expiresAt ? unit.expiresAt.toISOString() : null,
    },
  };
}

export async function openRecipientGiftCard(rawToken: string): Promise<{
  ok: boolean;
  state: RecipientLandingPayload["state"];
  firstOpenedNow?: boolean;
  card?: RecipientLandingPayload["card"];
}> {
  if (!rawToken || rawToken.length < 8) {
    return { ok: false, state: "NOT_FOUND" };
  }
  const hash = hashShopToken(rawToken);
  const existing = await prisma.storeOrderGiftUnit.findUnique({
    where: { giftTokenHash: hash },
    include: {
      order: { select: { id: true, status: true } },
      customization: true,
    },
  });

  if (!existing) {
    return { ok: false, state: "NOT_FOUND" };
  }

  const cancelledStatuses = [
    "CANCELLED",
    "REFUND_PENDING_MANUAL",
    "REFUNDED",
    "EXPIRED",
    "STOCK_CONFLICT_REFUND_NEEDED",
  ];
  if (existing.cardState === "DISABLED" || cancelledStatuses.includes(existing.order.status)) {
    return { ok: false, state: "DISABLED" };
  }
  if (existing.cardState === "PREPARING") {
    return { ok: false, state: "PREPARING" };
  }

  const now = new Date();
  if (existing.cardState === "EXPIRED" || (existing.expiresAt && existing.expiresAt <= now)) {
    await prisma.storeOrderGiftUnit.updateMany({
      where: { id: existing.id, cardState: { not: "EXPIRED" } },
      data: { cardState: "EXPIRED" },
    });
    return { ok: false, state: "EXPIRED" };
  }

  let firstOpenedNow = false;
  let activeUnit = existing;

  if (existing.cardState === "READY_UNOPENED") {
    const expiresAt =
      existing.durationDays !== null && existing.durationDays > 0
        ? new Date(now.getTime() + existing.durationDays * 86_400_000)
        : null;

    const claimed = await prisma.$transaction(async (tx) => {
      const updated = await tx.storeOrderGiftUnit.updateMany({
        where: { id: existing.id, cardState: "READY_UNOPENED" },
        data: {
          cardState: "ACTIVE",
          isCardLocked: true,
          firstOpenedAt: now,
          lastOpenedAt: now,
          expiresAt,
          openCount: { increment: 1 },
        },
      });
      if (updated.count === 1) {
        await tx.storeAuditLog.create({
          data: {
            orderId: existing.orderId,
            action: "GIFT_CARD_FIRST_OPENED",
            targetType: "StoreOrderGiftUnit",
            targetId: existing.id,
            summary: `Người nhận mở thiệp hộp quà (${existing.boxReferenceCode}) lần đầu.`,
          },
        });
      }
      return updated.count;
    });

    firstOpenedNow = claimed === 1;
    const reloaded = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: existing.id },
      include: { order: { select: { id: true, status: true } }, customization: true },
    });
    if (reloaded) activeUnit = reloaded;
  } else {
    activeUnit = await prisma.storeOrderGiftUnit.update({
      where: { id: existing.id },
      data: {
        openCount: { increment: 1 },
        lastOpenedAt: now,
      },
      include: { order: { select: { id: true, status: true } }, customization: true },
    });
  }

  const { templateSlug, content } = resolveSnapshotToContent(activeUnit);
  const { templateMeta, interactiveHtml } = hydrateShopCardHtml({
    templateSlug,
    content,
    unitReference: activeUnit.boxReferenceCode,
    isPreview: false,
  });

  return {
    ok: true,
    state: "ACTIVE",
    firstOpenedNow,
    card: {
      templateSlug,
      templateTitle: templateMeta.title,
      theme: templateMeta.theme,
      content,
      interactiveHtml,
      firstOpenedAt: activeUnit.firstOpenedAt
        ? activeUnit.firstOpenedAt.toISOString()
        : null,
      expiresAt: activeUnit.expiresAt ? activeUnit.expiresAt.toISOString() : null,
    },
  };
}
