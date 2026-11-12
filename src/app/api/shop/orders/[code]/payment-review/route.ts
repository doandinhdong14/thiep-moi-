import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { authorizeOrderForRequest } from "@/lib/shop/order-auth";
import { requestBankTransferReview } from "@/lib/shop/payment";

const ReviewSchema = z.object({
  note: z.string().max(400).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
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
      return apiError("Không có quyền gửi xác nhận cho đơn hàng này.", "FORBIDDEN", 403);
    }

    const body = ReviewSchema.parse(await req.json().catch(() => ({})));
    const result = await requestBankTransferReview({
      orderId: order.id,
      note: body.note,
      actorId: user?.id ?? null,
    });

    return apiSuccess(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "INVALID_PAYMENT_METHOD") {
        return apiError(
          "Đơn hàng không sử dụng phương thức chuyển khoản.",
          "INVALID_PAYMENT_METHOD",
          400,
        );
      }
      if (err.message === "ORDER_NOT_PENDING_PAYMENT") {
        return apiError(
          "Trạng thái đơn hàng hiện tại không hỗ trợ gửi yêu cầu đối soát.",
          "INVALID_ORDER_STATE",
          409,
        );
      }
    }
    return handleShopApiError(err);
  }
}

