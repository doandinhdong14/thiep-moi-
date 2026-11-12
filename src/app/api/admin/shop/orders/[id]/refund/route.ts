import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { cancelOrRefundShopOrder } from "@/lib/shop/payment";

const RefundSchema = z.object({
  action: z.enum(["CANCEL", "REQUEST_MANUAL_REFUND", "MARK_REFUNDED"]),
  reason: z.string().trim().min(2, "Vui lòng nhập lý do hủy/hoàn tiền").max(400),
  restockReturned: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireShopStaff();
    const order = await prisma.storeOrder.findFirst({
      where: { OR: [{ id: params.id }, { orderCode: params.id.toUpperCase() }] },
    });
    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    const body = RefundSchema.parse(await req.json());
    const result = await cancelOrRefundShopOrder({
      orderId: order.id,
      action: body.action,
      reason: body.reason,
      restockReturned: body.restockReturned,
      actorId: user.id,
    });

    return apiSuccess(result);
  } catch (err) {
    if (err instanceof Error && err.message === "ORDER_NOT_ELIGIBLE_FOR_REFUND") {
      return apiError(
        "Trạng thái đơn hiện tại không phù hợp để đánh dấu hoàn tiền.",
        "INVALID_REFUND_STATE",
        409,
      );
    }
    return handleShopApiError(err);
  }
}

