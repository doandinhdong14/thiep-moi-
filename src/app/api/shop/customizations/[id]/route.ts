import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  getShopActorFromRoles,
  readOrderAccessCookieMap,
  readShopGuestToken,
} from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  buildGiftInvitationContent,
  sanitizeCardText,
} from "@/lib/shop/gift-card";
import { getShopSettings } from "@/lib/shop/settings";
import { safeJsonParse, sanitizeImageUrl } from "@/lib/shop/types";

const UpdateCustomizationSchema = z.object({
  templateSlug: z.string().min(1).max(60).optional(),
  cardPlanCode: z.string().max(40).optional(),
  giftWrapCode: z.string().max(40).optional(),
  recipientName: z.string().max(80).optional(),
  senderName: z.string().max(80).optional(),
  title: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  occasion: z.string().max(60).nullable().optional(),
  musicTrackId: z.string().max(120).nullable().optional(),
  photoUrls: z.array(z.string().max(500)).max(6).optional(),
  presetColor: z.string().max(30).nullable().optional(),
  status: z.enum(["DRAFT", "ATTACHED"]).optional(),
});

async function authorizeCustomizationAccess(id: string) {
  const user = await getCurrentUser();
  const guestToken = readShopGuestToken();
  const accessMap = readOrderAccessCookieMap();

  const cust = await prisma.storeGiftCustomization.findUnique({
    where: { id },
    include: {
      giftUnits: {
        include: {
          order: { select: { id: true, orderCode: true, userId: true, status: true } },
        },
      },
    },
  });
  if (!cust) {
    return { cust: null, allowed: false, isStaff: false };
  }

  const isStaff = user ? getShopActorFromRoles(user.roles).canManageShop : false;
  const ownsDirect =
    (user && cust.userId === user.id) ||
    (guestToken && cust.guestToken === guestToken) ||
    cust.giftUnits.some(
      (u) =>
        (user && u.order.userId === user.id) || Boolean(accessMap[u.order.orderCode]),
    );

  return { cust, allowed: isStaff || Boolean(ownsDirect), isStaff };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { cust, allowed } = await authorizeCustomizationAccess(params.id);
    if (!cust) {
      return apiError("Không tìm thấy thiệp cá nhân hóa.", "NOT_FOUND", 404);
    }
    if (!allowed) {
      return apiError("Bạn không có quyền truy cập bản thiệp này.", "FORBIDDEN", 403);
    }

    return apiSuccess({
      id: cust.id,
      templateSlug: cust.templateSlug,
      cardPlanCode: cust.cardPlanCode,
      cardUpgradeFeeVnd: cust.cardUpgradeFeeVnd,
      giftWrapCode: cust.giftWrapCode,
      giftWrapFeeVnd: cust.giftWrapFeeVnd,
      recipientName: cust.recipientName,
      senderName: cust.senderName,
      title: cust.title,
      message: cust.message,
      occasion: cust.occasion,
      musicTrackId: cust.musicTrackId,
      photoUrls: safeJsonParse<string[]>(cust.photoUrlsJson, []),
      presetColor: cust.presetColor,
      status: cust.status,
      lockedAt: cust.lockedAt?.toISOString() ?? null,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { cust, allowed } = await authorizeCustomizationAccess(params.id);
    if (!cust) {
      return apiError("Không tìm thấy thiệp cá nhân hóa.", "NOT_FOUND", 404);
    }
    if (!allowed) {
      return apiError("Bạn không có quyền chỉnh sửa thiệp này.", "FORBIDDEN", 403);
    }

    const lockedByPacking =
      cust.status === "LOCKED" ||
      cust.giftUnits.some(
        (u) =>
          u.isCardLocked ||
          [
            "PACKING",
            "READY_TO_SHIP",
            "SHIPPED",
            "DELIVERED",
            "COMPLETED",
            "CANCELLED",
            "REFUNDED",
            "REFUND_PENDING_MANUAL",
            "EXPIRED",
          ].includes(u.order.status),
      );

    if (lockedByPacking) {
      return apiError(
        "Thiệp đã được khóa khi đóng gói hoặc đơn hàng đã hoàn tất, không thể sửa đổi.",
        "CARD_LOCKED",
        409,
      );
    }

    const body = UpdateCustomizationSchema.parse(await req.json());
    const settings = await getShopSettings();
    const isAlreadyOrdered = cust.giftUnits.length > 0;

    let cardPlanCode = cust.cardPlanCode;
    let cardUpgradeFeeVnd = cust.cardUpgradeFeeVnd;
    if (!isAlreadyOrdered && body.cardPlanCode) {
      const plan = settings.cardPlans.find(
        (p) => p.code === body.cardPlanCode && p.isActive,
      );
      if (plan) {
        cardPlanCode = plan.code;
        cardUpgradeFeeVnd = plan.priceVnd;
      }
    }

    let giftWrapCode = cust.giftWrapCode;
    let giftWrapFeeVnd = cust.giftWrapFeeVnd;
    if (!isAlreadyOrdered && body.giftWrapCode) {
      const wrap = settings.giftWrapOptions.find(
        (w) => w.code === body.giftWrapCode && w.isActive,
      );
      if (wrap) {
        giftWrapCode = wrap.code;
        giftWrapFeeVnd = wrap.priceVnd;
      }
    }

    const photoUrls =
      body.photoUrls !== undefined
        ? body.photoUrls
            .map((u) => sanitizeImageUrl(u))
            .filter((u): u is string => Boolean(u))
            .slice(0, 6)
        : safeJsonParse<string[]>(cust.photoUrlsJson, []);

    const recipientName =
      body.recipientName !== undefined
        ? sanitizeCardText(body.recipientName, 80)
        : cust.recipientName;
    const senderName =
      body.senderName !== undefined
        ? sanitizeCardText(body.senderName, 80)
        : cust.senderName;
    const title =
      body.title !== undefined ? sanitizeCardText(body.title, 120) : cust.title;
    const message =
      body.message !== undefined
        ? sanitizeCardText(body.message, 2000)
        : cust.message;
    const occasion =
      body.occasion !== undefined
        ? sanitizeCardText(body.occasion, 60) || null
        : cust.occasion;
    const musicTrackId =
      body.musicTrackId !== undefined
        ? sanitizeCardText(body.musicTrackId, 120) || null
        : cust.musicTrackId;

    const { templateMeta, content } = buildGiftInvitationContent({
      templateSlug: body.templateSlug || cust.templateSlug,
      recipientName: recipientName || "Bạn thương",
      senderName: senderName || "Người gửi",
      title,
      message,
      occasion: occasion || undefined,
      musicTrackId: musicTrackId || undefined,
      photoUrls,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.storeGiftCustomization.update({
        where: { id: cust.id },
        data: {
          templateSlug: templateMeta.slug,
          cardPlanCode,
          cardUpgradeFeeVnd,
          giftWrapCode,
          giftWrapFeeVnd,
          recipientName,
          senderName,
          title,
          message,
          occasion,
          musicTrackId,
          photoUrlsJson: JSON.stringify(photoUrls),
          presetColor:
            body.presetColor !== undefined
              ? sanitizeCardText(body.presetColor, 30) || null
              : cust.presetColor,
          ...(body.status ? { status: body.status } : {}),
        },
      });

      if (isAlreadyOrdered) {
        await tx.storeOrderGiftUnit.updateMany({
          where: {
            customizationId: cust.id,
            isCardLocked: false,
          },
          data: {
            templateSlug: templateMeta.slug,
            cardSnapshotJson: JSON.stringify(content),
          },
        });
      }

      return saved;
    });

    return apiSuccess({
      id: updated.id,
      templateSlug: updated.templateSlug,
      cardPlanCode: updated.cardPlanCode,
      cardUpgradeFeeVnd: updated.cardUpgradeFeeVnd,
      giftWrapCode: updated.giftWrapCode,
      giftWrapFeeVnd: updated.giftWrapFeeVnd,
      recipientName: updated.recipientName,
      senderName: updated.senderName,
      title: updated.title,
      message: updated.message,
      occasion: updated.occasion,
      musicTrackId: updated.musicTrackId,
      photoUrls,
      status: updated.status,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

