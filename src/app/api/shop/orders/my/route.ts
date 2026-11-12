import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  maskEmail,
  maskName,
  maskPhone,
  maskStreetAddress,
} from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { serializeOrderSafeForCustomer } from "@/lib/shop/checkout";
import { releaseExpiredReservations } from "@/lib/shop/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Vui lòng đăng nhập để xem lịch sử đơn hàng.", "UNAUTHORIZED", 401);
    }

    await releaseExpiredReservations().catch(() => 0);

    const orders = await prisma.storeOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        giftUnits: { orderBy: { unitIndex: "asc" } },
        shipments: { orderBy: { createdAt: "desc" } },
      },
    });

    return apiSuccess(
      orders.map((o) =>
        serializeOrderSafeForCustomer(o, true, {
          maskName,
          maskPhone,
          maskEmail,
          maskStreetAddress,
        }),
      ),
    );
  } catch (err) {
    return handleShopApiError(err);
  }
}

