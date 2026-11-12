import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import {
  readShopGuestToken,
  saveOrderAccessToCookie,
} from "@/lib/shop/auth";
import { getRequestBaseUrl, handleShopApiError } from "@/lib/shop/api-helpers";
import { CheckoutInputSchema, executeShopCheckout } from "@/lib/shop/checkout";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const guestToken = readShopGuestToken();
    const input = CheckoutInputSchema.parse(await req.json());
    const baseUrl = getRequestBaseUrl(req);

    const result = await executeShopCheckout({
      input,
      userId: user?.id ?? null,
      guestToken,
      baseUrl,
    });

    const res = apiSuccess(
      {
        orderCode: result.orderCode,
        orderId: result.orderId,
        status: result.status,
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        totalVnd: result.totalVnd,
        reservationExpiresAt: result.reservationExpiresAt,
        guestAccessToken: result.guestAccessToken || null,
        idempotentReplay: result.idempotentReplay,
        payment: result.payment,
      },
      result.idempotentReplay ? 200 : 201,
    );

    if (result.guestAccessToken) {
      saveOrderAccessToCookie(res, result.orderCode, result.guestAccessToken);
    }

    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

