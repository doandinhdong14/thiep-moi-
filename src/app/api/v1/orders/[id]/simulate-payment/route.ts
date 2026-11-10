import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { fulfillOrder } from "@/lib/payments/fulfillment";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { lines: true },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (order.status === "PAID") {
      return apiSuccess({
        message: "Đơn hàng đã được thanh toán.",
        order,
      });
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paidAt: now,
        },
      });

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

      return ord;
    });

    return apiSuccess({
      message: "Thanh toán thử nghiệm thành công.",
      order: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

