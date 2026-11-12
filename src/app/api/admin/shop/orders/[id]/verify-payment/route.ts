import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { confirmStoreOrderPaid } from "@/lib/shop/payment";
import { getShopSettings } from "@/lib/shop/settings";

const VerifyPaymentSchema = z.object({
  decision: z.enum(["CONFIRM_PAID", "REJECT_REVIEW"]).default("CONFIRM_PAID"),
  note: z.string().trim().max(400).optional(),
  providerRef: z.string().trim().max(100).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user, isAdmin } = await requireShopStaff();
    const settings = await getShopSettings();
    if (!isAdmin && !settings.allowShopManagerPaymentReview) {
      return apiError(
        "Cấu hình hiện tại chỉ cho phép ADMIN xác nhận đối soát tiền.",
        "FORBIDDEN",
        403,
      );
    }

    const order = await prisma.storeOrder.findFirst({
      where: { OR: [{ id: params.id }, { orderCode: params.id.toUpperCase() }] },
    });
    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    const body = VerifyPaymentSchema.parse(await req.json());

    if (body.decision === "REJECT_REVIEW") {
      if (order.paymentStatus === "PAID") {
        return apiError("Đơn đã xác nhận thanh toán trước đó.", "ALREADY_PAID", 409);
      }
      await prisma.$transaction(async (tx) => {
        await tx.storeOrder.update({
          where: { id: order.id },
          data: { status: "PENDING_PAYMENT", paymentStatus: "UNPAID" },
        });
        await tx.storePayment.updateMany({
          where: { orderId: order.id },
          data: { status: "PENDING" },
        });
        await tx.storeAuditLog.create({
          data: {
            orderId: order.id,
            actorId: user.id,
            action: "ADMIN_REJECTED_TRANSFER_PROOF",
            targetType: "StoreOrder",
            targetId: order.id,
            summary: `Từ chối yêu cầu xác nhận chuyển khoản: ${body.note || "Chưa thấy tiền vào tài khoản."}`,
          },
        });
      });
      return apiSuccess({ ok: true, status: "PENDING_PAYMENT" });
    }

    const result = await confirmStoreOrderPaid({
      orderId: order.id,
      provider: order.paymentMethod,
      providerRef: body.providerRef || `MANUAL_${user.id.slice(0, 8)}_${Date.now()}`,
      verifiedBy: user.id,
      amountVnd: order.totalVnd,
      reason: body.note || "Admin đối soát sao kê xác nhận đã nhận tiền.",
    });

    return apiSuccess(result);
  } catch (err) {
    return handleShopApiError(err);
  }
}

