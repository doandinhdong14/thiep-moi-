import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { createAffiliateCommissionForOrder, fulfillOrder } from "@/lib/payments/fulfillment";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allowSandboxSimulation =
      process.env.NODE_ENV !== "production" || process.env.PAYMENT_MODE === "sandbox";

    if (!allowSandboxSimulation) {
      return apiError(
        "Thanh toán thử nghiệm chỉ khả dụng trong môi trường Sandbox.",
        "FORBIDDEN",
        403
      );
    }

    const user = await getCurrentUser();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { lines: true },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (order.buyerId !== user?.id && !user?.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền thao tác trên đơn hàng này.", "FORBIDDEN", 403);
    }

    if (order.status === "PAID") {
      return apiSuccess({
        message: "Đơn hàng đã được thanh toán.",
        order,
      });
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: { id: order.id, status: { not: "PAID" } },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paidAt: now,
        },
      });

      if (claim.count > 0) {
        await tx.paymentAttempt.create({
          data: {
            orderId: order.id,
            provider: "sandbox",
            status: "PAID",
            amountVnd: order.totalVnd,
            paidAt: now,
          },
        });

        await fulfillOrder(order.id, tx);
        await createAffiliateCommissionForOrder(order.id, now, tx);
      }

      return tx.order.findUnique({ where: { id: order.id } });
    });

    return apiSuccess({
      message: "Thanh toán thử nghiệm thành công.",
      order: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

