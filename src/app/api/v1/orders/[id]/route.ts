import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
        paymentAttempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (order.buyerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền truy cập đơn hàng này.", "FORBIDDEN", 403);
    }

    return apiSuccess({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotalVnd: order.subtotalVnd,
        discountVnd: order.discountVnd,
        totalVnd: order.totalVnd,
        currency: order.currency,
        paidAt: order.paidAt,
        lines: order.lines,
        paymentInstructions: {
          bankName: "Techcombank (Ngân hàng TMCP Kỹ Thương Việt Nam)",
          accountNumber: "19036789123456",
          accountHolder: "CONG TY CP DING DONG GIFT VN",
          transferSyntax: order.orderNumber,
          amountVnd: order.totalVnd,
        },
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

