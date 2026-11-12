import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import { getOrCreateShopGuestToken, setShopGuestCookieOnResponse } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  buildGiftInvitationContent,
  sanitizeCardText,
} from "@/lib/shop/gift-card";
import { getShopSettings } from "@/lib/shop/settings";
import { sanitizeImageUrl } from "@/lib/shop/types";

const CreateCustomizationSchema = z.object({
  templateSlug: z.string().min(1).max(60),
  cardPlanCode: z.string().max(40).optional(),
  giftWrapCode: z.string().max(40).optional(),
  recipientName: z.string().max(80).default(""),
  senderName: z.string().max(80).default(""),
  title: z.string().max(120).optional(),
  message: z.string().max(2000).default(""),
  occasion: z.string().max(60).optional(),
  musicTrackId: z.string().max(120).optional(),
  photoUrls: z.array(z.string().max(500)).max(6).optional(),
  presetColor: z.string().max(30).optional(),
  status: z.enum(["DRAFT", "ATTACHED"]).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { token: guestToken, isNew } = getOrCreateShopGuestToken();
    const body = CreateCustomizationSchema.parse(await req.json());
    const settings = await getShopSettings();

    const plan =
      settings.cardPlans.find((p) => p.code === body.cardPlanCode && p.isActive) ||
      settings.cardPlans.find((p) => p.isDefault && p.isActive) ||
      settings.cardPlans[0];

    const wrap =
      settings.giftWrapOptions.find((w) => w.code === body.giftWrapCode && w.isActive) ||
      settings.giftWrapOptions[0];

    const cleanPhotos = (body.photoUrls || [])
      .map((u) => sanitizeImageUrl(u))
      .filter((u): u is string => Boolean(u))
      .slice(0, 6);

    const recipientName = sanitizeCardText(body.recipientName, 80);
    const senderName = sanitizeCardText(body.senderName, 80);
    const title = sanitizeCardText(body.title, 120);
    const message = sanitizeCardText(body.message, 2000);

    const { templateMeta } = buildGiftInvitationContent({
      templateSlug: body.templateSlug,
      recipientName: recipientName || "Người thương",
      senderName: senderName || "Bạn",
      title,
      message,
      occasion: body.occasion,
      musicTrackId: body.musicTrackId,
      photoUrls: cleanPhotos,
    });

    const created = await prisma.storeGiftCustomization.create({
      data: {
        userId: user?.id ?? null,
        guestToken: user ? null : guestToken,
        templateSlug: templateMeta.slug,
        cardPlanCode: plan.code,
        cardUpgradeFeeVnd: plan.priceVnd,
        giftWrapCode: wrap.code,
        giftWrapFeeVnd: wrap.priceVnd,
        recipientName,
        senderName,
        title,
        message,
        occasion: sanitizeCardText(body.occasion, 60) || null,
        musicTrackId: sanitizeCardText(body.musicTrackId, 120) || null,
        photoUrlsJson: JSON.stringify(cleanPhotos),
        presetColor: sanitizeCardText(body.presetColor, 30) || null,
        status: body.status || "DRAFT",
        previewReady: true,
      },
    });

    const res = apiSuccess(
      {
        id: created.id,
        templateSlug: created.templateSlug,
        cardPlanCode: created.cardPlanCode,
        cardUpgradeFeeVnd: created.cardUpgradeFeeVnd,
        giftWrapCode: created.giftWrapCode,
        giftWrapFeeVnd: created.giftWrapFeeVnd,
        recipientName: created.recipientName,
        senderName: created.senderName,
        title: created.title,
        message: created.message,
        occasion: created.occasion,
        musicTrackId: created.musicTrackId,
        photoUrls: cleanPhotos,
        status: created.status,
      },
      201,
    );
    if (!user && isNew) {
      setShopGuestCookieOnResponse(res, guestToken);
    }
    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

