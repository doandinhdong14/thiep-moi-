import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { getPayOSClient, syncPayOSOrderStatus } from "@/lib/payments/payos";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (order.buyerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền thao tác trên đơn hàng này.", "FORBIDDEN", 403);
    }

    if (order.status === "PAID") {
      return apiSuccess({
        paid: true,
        alreadyPaid: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
        message: "Đơn hàng đã được thanh toán và kích hoạt tự động!",
      });
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return apiError("Đơn hàng đã bị hủy hoặc hoàn tiền.", "INVALID_STATUS", 400);
    }

    // If PayOS is configured, check PayOS immediately instead of forcing manual review
    if (getPayOSClient()) {
      const syncResult = await syncPayOSOrderStatus(order.id);
      if (syncResult.paid) {
        const paidOrder = await prisma.order.findUnique({ where: { id: order.id } });
        return apiSuccess({
          paid: true,
          order: {
            id: paidOrder?.id || order.id,
            orderNumber: paidOrder?.orderNumber || order.orderNumber,
            status: paidOrder?.status || "PAID",
            paymentStatus: paidOrder?.paymentStatus || "PAID",
          },
          message: "Thanh toán đã được xác nhận tự động và kích hoạt thành công!",
        });
      }

      const activePayosAttempt = await prisma.paymentAttempt.findFirst({
        where: {
          orderId: order.id,
          provider: "payos",
          status: "PENDING",
        },
      });

      if (activePayosAttempt) {
        return apiSuccess({
          paid: false,
          autoChecking: true,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
          },
          message:
            "Chưa ghi nhận giao dịch chuyển khoản mới trên PayOS. Hệ thống vẫn đang tự động kiểm tra mỗi 3 giây — vui lòng đợi trong giây lát.",
        });
      }
    }

    // Fallback when PayOS is not configured or manual QR was used: record TRANSFER_SUBMITTED for admin review
    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "TRANSFER_SUBMITTED",
          paymentStatus: "TRANSFER_SUBMITTED",
        },
      });

      await tx.paymentAttempt.create({
        data: {
          orderId: ord.id,
          provider: "manual_review",
          status: "PENDING",
          amountVnd: ord.totalVnd,
        },
      });

      return ord;
    });

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0],
      action: "ORDER_TRANSFER_SUBMITTED",
      resourceType: "Order",
      resourceId: updated.id,
      afterSummary: {
        orderNumber: updated.orderNumber,
        status: updated.status,
      },
    });

    return apiSuccess({
      paid: false,
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
      },
      message: "Đã gửi thông báo xác nhận chuyển khoản. Quản trị viên sẽ đối soát và mở khóa gói trong ít phút.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

