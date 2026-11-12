import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import {
  getOrCreateShopGuestToken,
  readShopGuestToken,
  setShopGuestCookieOnResponse,
} from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  buildCartSummaryView,
  findOrCreateShopCart,
  findShopCartReadonly,
} from "@/lib/shop/cart";
import { releaseExpiredReservations } from "@/lib/shop/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await releaseExpiredReservations().catch(() => 0);
    const user = await getCurrentUser();
    const guestToken = readShopGuestToken();
    const cart = await findShopCartReadonly({
      userId: user?.id ?? null,
      guestToken,
    });

    const summary = await buildCartSummaryView(cart?.id ?? null);
    return apiSuccess(summary);
  } catch (err) {
    return handleShopApiError(err);
  }
}

const PatchCartSchema = z.object({
  promoCode: z.string().max(40).nullable(),
});

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    const { token: guestToken, isNew } = getOrCreateShopGuestToken();
    const body = PatchCartSchema.parse(await req.json());

    const cart = await findOrCreateShopCart({
      userId: user?.id ?? null,
      guestToken: user ? null : guestToken,
    });

    await prisma.storeCart.update({
      where: { id: cart.id },
      data: {
        promoCode: body.promoCode ? body.promoCode.trim().toUpperCase() : null,
      },
    });

    const summary = await buildCartSummaryView(cart.id);
    const res = apiSuccess(summary);
    if (!user && isNew) {
      setShopGuestCookieOnResponse(res, guestToken);
    }
    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    const guestToken = readShopGuestToken();
    const cart = await findShopCartReadonly({
      userId: user?.id ?? null,
      guestToken,
    });
    if (cart) {
      await prisma.storeCartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.storeCart.update({
        where: { id: cart.id },
        data: { promoCode: null },
      });
    }
    const summary = await buildCartSummaryView(cart?.id ?? null);
    return apiSuccess(summary);
  } catch (err) {
    return handleShopApiError(err);
  }
}

