import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  getOrCreateShopGuestToken,
  setShopGuestCookieOnResponse,
} from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { buildCartSummaryView, findOrCreateShopCart } from "@/lib/shop/cart";
import { releaseExpiredReservations } from "@/lib/shop/inventory";

const AddCartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
  customizationId: z.string().min(1).nullable().optional(),
  giftWrapCode: z.string().max(40).optional(),
  note: z.string().max(240).optional(),
});

export async function POST(req: Request) {
  try {
    await releaseExpiredReservations().catch(() => 0);

    const user = await getCurrentUser();
    const { token: guestToken, isNew } = getOrCreateShopGuestToken();
    const body = AddCartItemSchema.parse(await req.json());

    const variant = await prisma.storeVariant.findUnique({
      where: { id: body.variantId },
      include: {
        product: true,
        inventory: true,
      },
    });

    if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
      return apiError(
        "Sản phẩm hoặc phân loại này hiện chưa mở bán.",
        "PRODUCT_UNAVAILABLE",
        409,
      );
    }

    const available = variant.inventory
      ? Math.max(0, variant.inventory.onHand - variant.inventory.reserved)
      : 0;

    const cart = await findOrCreateShopCart({
      userId: user?.id ?? null,
      guestToken: user ? null : guestToken,
    });

    const existingVariantQty = await prisma.storeCartItem.aggregate({
      where: { cartId: cart.id, variantId: variant.id },
      _sum: { quantity: true },
    });
    const currentQty = existingVariantQty._sum.quantity || 0;
    if (currentQty + body.quantity > available) {
      return apiError(
        `Sản phẩm chỉ còn ${available} hộp khả dụng trong kho.`,
        "OUT_OF_STOCK",
        409,
        { available: String(available) },
      );
    }

    const wrapCode = body.giftWrapCode || "NONE";

    // Check if there is an existing cart item we can merge cleanly (when adding without distinct customization)
    const matchingExisting = body.customizationId
      ? null
      : await prisma.storeCartItem.findFirst({
          where: {
            cartId: cart.id,
            variantId: variant.id,
            customizationId: null,
            giftWrapCode: wrapCode,
          },
        });

    if (matchingExisting) {
      await prisma.storeCartItem.update({
        where: { id: matchingExisting.id },
        data: { quantity: matchingExisting.quantity + body.quantity },
      });
    } else {
      let resolvedCustomizationId: string | null = null;
      if (body.customizationId) {
        const cust = await prisma.storeGiftCustomization.findUnique({
          where: { id: body.customizationId },
        });
        if (cust) {
          resolvedCustomizationId = cust.id;
          await prisma.storeGiftCustomization.update({
            where: { id: cust.id },
            data: { status: "ATTACHED" },
          });
        }
      }

      const createdItem = await prisma.storeCartItem.create({
        data: {
          cartId: cart.id,
          variantId: variant.id,
          quantity: body.quantity,
          customizationId: resolvedCustomizationId,
          giftWrapCode: wrapCode,
          note: body.note || null,
        },
      });

      // Populate independent StoreCartItemUnit slots (1..quantity)
      for (let i = 1; i <= body.quantity; i += 1) {
        await prisma.storeCartItemUnit.create({
          data: {
            cartItemId: createdItem.id,
            unitIndex: i,
            customizationId: resolvedCustomizationId,
            giftWrapCode: wrapCode,
          },
        });
      }
    }

    const summary = await buildCartSummaryView(cart.id);
    const res = apiSuccess(summary, 201);
    if (!user && isNew) {
      setShopGuestCookieOnResponse(res, guestToken);
    }
    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

