import { apiError, apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { refreshOrderBankQrIfNeeded } from "@/lib/shop/payment";
import { authorizeOrderForRequest } from "@/lib/shop/order-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { code: string } },
) {
  try {
    await releaseExpiredReservations().catch(() => 0);

    const { order, authorized } = await authorizeOrderForRequest(req, params.code);
    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }
    if (!authorized) {
      return apiError("Không có quyền truy cập trạng thái đơn hàng này.", "FORBIDDEN", 403);
    }

    const paymentInfo = ["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(
      order.status,
    )
      ? await refreshOrderBankQrIfNeeded(order.id)
      : null;

    return apiSuccess({
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      totalVnd: order.totalVnd,
      reservationExpiresAt: order.reservationExpiresAt?.toISOString() ?? null,
      paidAt: order.paidAt?.toISOString() ?? null,
      qrDataUrl: paymentInfo?.qrDataUrl || null,
      transferContent: paymentInfo?.transferContent || order.payments[0]?.transferContent || null,
      checkoutUrl: paymentInfo?.checkoutUrl || order.payments[0]?.checkoutUrl || null,
      bankDetails: paymentInfo?.bankDetails || null,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}
