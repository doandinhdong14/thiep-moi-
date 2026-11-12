import { apiError, apiSuccess } from "@/lib/api/response";
import {
  maskEmail,
  maskName,
  maskPhone,
  maskStreetAddress,
  saveOrderAccessToCookie,
} from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { serializeOrderSafeForCustomer } from "@/lib/shop/checkout";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { authorizeOrderForRequest } from "@/lib/shop/order-auth";
import { refreshOrderBankQrIfNeeded } from "@/lib/shop/payment";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { code: string } },
) {
  try {
    await releaseExpiredReservations().catch(() => 0);

    const { order, authorized, providedQueryToken } = await authorizeOrderForRequest(
      req,
      params.code,
    );

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (!authorized) {
      return apiError(
        "Cần xác thực chủ đơn hoặc tra cứu bằng số điện thoại/email đặt hàng.",
        "ORDER_ACCESS_REQUIRED",
        403,
      );
    }

    const paymentInfo = ["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(
      order.status,
    )
      ? await refreshOrderBankQrIfNeeded(order.id)
      : null;

    const serialized = serializeOrderSafeForCustomer(order, true, {
      maskName,
      maskPhone,
      maskEmail,
      maskStreetAddress,
    });

    const unitCustomizations = order.giftUnits.map((u) => ({
      unitId: u.id,
      unitIndex: u.unitIndex,
      customizationId: u.customizationId,
      canEditCard:
        !u.isCardLocked &&
        ![
          "PACKING",
          "READY_TO_SHIP",
          "SHIPPED",
          "DELIVERED",
          "COMPLETED",
          "CANCELLED",
          "REFUNDED",
          "REFUND_PENDING_MANUAL",
          "EXPIRED",
        ].includes(order.status),
      customization: u.customization
        ? {
            id: u.customization.id,
            templateSlug: u.customization.templateSlug,
            recipientName: u.customization.recipientName,
            senderName: u.customization.senderName,
            title: u.customization.title,
            message: u.customization.message,
            occasion: u.customization.occasion,
            musicTrackId: u.customization.musicTrackId,
            photoUrls: JSON.parse(u.customization.photoUrlsJson || "[]") as string[],
          }
        : null,
    }));

    const res = apiSuccess({
      order: serialized,
      unitCustomizations,
      payment: order.payments[0]
        ? {
            id: order.payments[0].id,
            provider: order.payments[0].provider,
            status: order.payments[0].status,
            amountVnd: order.payments[0].amountVnd,
            requestedReviewAt: order.payments[0].requestedReviewAt?.toISOString() ?? null,
            verifiedAt: order.payments[0].verifiedAt?.toISOString() ?? null,
            qrDataUrl: paymentInfo?.qrDataUrl || null,
            transferContent:
              paymentInfo?.transferContent || order.payments[0].transferContent,
            checkoutUrl:
              paymentInfo?.checkoutUrl || order.payments[0].checkoutUrl,
            bankDetails: paymentInfo?.bankDetails || null,
          }
        : null,
    });

    if (providedQueryToken) {
      saveOrderAccessToCookie(res, order.orderCode, providedQueryToken);
    }

    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}
