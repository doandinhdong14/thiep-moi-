import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { createPayOSPaymentLink } from "@/lib/payments/payos";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
      },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (order.buyerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền truy cập đơn hàng này.", "FORBIDDEN", 403);
    }

    if (order.status === "PAID") {
      return apiSuccess({
        message: "Đơn hàng đã được thanh toán.",
        alreadyPaid: true,
      });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";

    const payosQr = await createPayOSPaymentLink({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalVnd: order.totalVnd,
        lines: order.lines,
      },
      origin,
    });

    return apiSuccess({
      orderId: order.id,
      payosQr,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

