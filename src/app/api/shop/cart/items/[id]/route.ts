import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { readShopGuestToken } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { buildCartSummaryView, findShopCartReadonly } from "@/lib/shop/cart";
import { releaseExpiredReservations } from "@/lib/shop/inventory";

const PatchCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(20).optional(),
  giftWrapCode: z.string().max(40).optional(),
  unitIndex: z.number().int().min(1).max(20).optional(),
  customizationId: z.string().min(1).nullable().optional(),
  applyToAllUnits: z.boolean().optional(),
});

async function resolveAuthorizedCartItem(itemId: string) {
  const user = await getCurrentUser();
  const guestToken = readShopGuestToken();
  const cart = await findShopCartReadonly({
    userId: user?.id ?? null,
    guestToken,
  });
  if (!cart) return { cart: null, item: null };

  const item = await prisma.storeCartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: {
      variant: { include: { inventory: true, product: true } },
    },
  });
  return { cart, item };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await releaseExpiredReservations().catch(() => 0);

    const { cart, item } = await resolveAuthorizedCartItem(params.id);
    if (!cart || !item) {
      return apiError("Không tìm thấy sản phẩm trong giỏ.", "NOT_FOUND", 404);
    }

    const body = PatchCartItemSchema.parse(await req.json());

    if (body.quantity !== undefined) {
      const available = item.variant.inventory
        ? Math.max(0, item.variant.inventory.onHand - item.variant.inventory.reserved)
        : 0;
      const otherQtyAgg = await prisma.storeCartItem.aggregate({
        where: {
          cartId: cart.id,
          variantId: item.variantId,
          id: { not: item.id },
        },
        _sum: { quantity: true },
      });
      const otherQty = otherQtyAgg._sum.quantity || 0;
      if (otherQty + body.quantity > available) {
        return apiError(
          `Sản phẩm chỉ còn tối đa ${Math.max(0, available - otherQty)} hộp khả dụng.`,
          "OUT_OF_STOCK",
          409,
        );
      }

      await prisma.storeCartItem.update({
        where: { id: item.id },
        data: { quantity: body.quantity },
      });
    }

    if (body.unitIndex !== undefined) {
      const dataToUpdate: { giftWrapCode?: string; customizationId?: string | null } = {};
      if (body.giftWrapCode !== undefined) dataToUpdate.giftWrapCode = body.giftWrapCode;
      if (body.customizationId !== undefined) dataToUpdate.customizationId = body.customizationId;

      if (body.applyToAllUnits) {
        await prisma.storeCartItemUnit.updateMany({
          where: { cartItemId: item.id },
          data: dataToUpdate,
        });
        if (body.giftWrapCode !== undefined) {
          await prisma.storeCartItem.update({
            where: { id: item.id },
            data: { giftWrapCode: body.giftWrapCode },
          });
        }
      } else {
        await prisma.storeCartItemUnit.upsert({
          where: {
            cartItemId_unitIndex: { cartItemId: item.id, unitIndex: body.unitIndex },
          },
          update: dataToUpdate,
          create: {
            cartItemId: item.id,
            unitIndex: body.unitIndex,
            giftWrapCode: body.giftWrapCode || item.giftWrapCode,
            customizationId: body.customizationId ?? null,
          },
        });
      }
    } else if (body.giftWrapCode !== undefined || body.customizationId !== undefined) {
      const dataToUpdate: { giftWrapCode?: string; customizationId?: string | null } = {};
      if (body.giftWrapCode !== undefined) dataToUpdate.giftWrapCode = body.giftWrapCode;
      if (body.customizationId !== undefined) dataToUpdate.customizationId = body.customizationId;

      await prisma.storeCartItem.update({
        where: { id: item.id },
        data: dataToUpdate,
      });
      await prisma.storeCartItemUnit.updateMany({
        where: { cartItemId: item.id },
        data: dataToUpdate,
      });
    }

    const summary = await buildCartSummaryView(cart.id);
    return apiSuccess(summary);
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { cart, item } = await resolveAuthorizedCartItem(params.id);
    if (!cart || !item) {
      return apiError("Không tìm thấy sản phẩm trong giỏ.", "NOT_FOUND", 404);
    }

    await prisma.storeCartItem.delete({ where: { id: item.id } });
    const summary = await buildCartSummaryView(cart.id);
    return apiSuccess(summary);
  } catch (err) {
    return handleShopApiError(err);
  }
}

