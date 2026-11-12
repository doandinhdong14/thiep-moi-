import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { readShopGuestToken } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  buildCartSummaryView,
  findShopCartReadonly,
  mergeGuestCartIntoUser,
} from "@/lib/shop/cart";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Vui lòng đăng nhập.", "UNAUTHORIZED", 401);
    }
    const guestToken = readShopGuestToken();
    if (guestToken) {
      await mergeGuestCartIntoUser(guestToken, user.id);
    }
    const cart = await findShopCartReadonly({ userId: user.id });
    const summary = await buildCartSummaryView(cart?.id ?? null);
    return apiSuccess(summary);
  } catch (err) {
    return handleShopApiError(err);
  }
}

