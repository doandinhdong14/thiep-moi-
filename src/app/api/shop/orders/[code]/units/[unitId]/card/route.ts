import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { authorizeOrderForRequest } from "@/lib/shop/order-auth";
import {
  buildGiftInvitationContent,
  sanitizeCardText,
} from "@/lib/shop/gift-card";
import { safeJsonParse, sanitizeImageUrl } from "@/lib/shop/types";

const UnitCardPatchSchema = z.object({
  templateSlug: z.string().min(1).max(60).optional(),
  recipientName: z.string().min(1, "Vui lòng nhập tên người nhận").max(80),
  senderName: z.string().min(1, "Vui lòng nhập tên người gửi").max(80),
  title: z.string().max(120).optional().default(""),
  message: z.string().min(1, "Vui lòng nhập lời chúc").max(2000),
  occasion: z.string().max(60).nullable().optional(),
  musicTrackId: z.string().max(120).nullable().optional(),
  photoUrls: z.array(z.string().max(500)).max(6).optional(),
});

const LOCKED_ORDER_STATUSES = [
  "PACKING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "REFUND_PENDING_MANUAL",
];

export async function PATCH(
  req: Request,
  { params }: { params: { code: string; unitId: string } },
) {
  try {
    const { order, authorized, user } = await authorizeOrderForRequest(
      req,
      params.code,
    );

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }
    if (!authorized) {
      return apiError(
        "Bạn không có quyền chỉnh sửa thiệp cho đơn hàng này.",
        "FORBIDDEN",
        403,
      );
    }
    if (LOCKED_ORDER_STATUSES.includes(order.status)) {
      return apiError(
        "Đơn hàng đã vào bước đóng gói hoặc đã kết thúc, không thể sửa nội dung thiệp.",
        "ORDER_CARD_LOCKED",
        409,
      );
    }

    const unit = order.giftUnits.find((u) => u.id === params.unitId);
    if (!unit) {
      return apiError("Không tìm thấy hộp quà thuộc đơn hàng này.", "NOT_FOUND", 404);
    }
    if (unit.isCardLocked) {
      return apiError(
        "Thiệp của hộp quà này đã được khóa khi đóng gói hoặc đã được mở.",
        "CARD_LOCKED",
        409,
      );
    }

    const body = UnitCardPatchSchema.parse(await req.json());
    const cleanPhotos = (body.photoUrls || [])
      .map((u) => sanitizeImageUrl(u))
      .filter((u): u is string => Boolean(u))
      .slice(0, 6);

    const recipientName = sanitizeCardText(body.recipientName, 80);
    const senderName = sanitizeCardText(body.senderName, 80);
    const title = sanitizeCardText(body.title, 120);
    const message = sanitizeCardText(body.message, 2000);
    const occasion = sanitizeCardText(body.occasion, 60) || null;
    const musicTrackId = sanitizeCardText(body.musicTrackId, 120) || null;

    const { templateMeta, content } = buildGiftInvitationContent({
      templateSlug: body.templateSlug || unit.templateSlug,
      recipientName,
      senderName,
      title,
      message,
      occasion: occasion || undefined,
      musicTrackId: musicTrackId || undefined,
      photoUrls: cleanPhotos,
    });

    const result = await prisma.$transaction(async (tx) => {
      let customizationId = unit.customizationId;

      if (customizationId) {
        await tx.storeGiftCustomization.update({
          where: { id: customizationId },
          data: {
            templateSlug: templateMeta.slug,
            recipientName,
            senderName,
            title,
            message,
            occasion,
            musicTrackId,
            photoUrlsJson: JSON.stringify(cleanPhotos),
            status: "ATTACHED",
          },
        });
      } else {
        const created = await tx.storeGiftCustomization.create({
          data: {
            userId: order.userId ?? user?.id ?? null,
            templateSlug: templateMeta.slug,
            cardPlanCode: unit.cardPlanCode,
            cardUpgradeFeeVnd: unit.cardUpgradeFeeVnd,
            giftWrapCode: unit.giftWrapCode,
            giftWrapFeeVnd: unit.giftWrapFeeVnd,
            recipientName,
            senderName,
            title,
            message,
            occasion,
            musicTrackId,
            photoUrlsJson: JSON.stringify(cleanPhotos),
            status: "ATTACHED",
          },
        });
        customizationId = created.id;
      }

      const updatedUnit = await tx.storeOrderGiftUnit.update({
        where: { id: unit.id },
        data: {
          customizationId,
          templateSlug: templateMeta.slug,
          cardSnapshotJson: JSON.stringify(content),
        },
      });

      await tx.storeAuditLog.create({
        data: {
          orderId: order.id,
          actorId: user?.id ?? null,
          action: "CUSTOMER_UPDATED_CARD_PRE_PACKING",
          targetType: "StoreOrderGiftUnit",
          targetId: unit.id,
          summary: `Cập nhật thiệp cho ${unit.unitLabel} (${unit.boxReferenceCode}) trước khi đóng gói.`,
        },
      });

      return updatedUnit;
    });

    return apiSuccess({
      unitId: result.id,
      customizationId: result.customizationId,
      templateSlug: result.templateSlug,
      photoUrls: safeJsonParse<string[]>(JSON.stringify(cleanPhotos), cleanPhotos),
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

