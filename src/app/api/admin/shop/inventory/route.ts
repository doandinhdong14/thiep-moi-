import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { releaseExpiredReservations } from "@/lib/shop/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireShopStaff();
    await releaseExpiredReservations().catch(() => 0);

    const [variants, movements] = await Promise.all([
      prisma.storeVariant.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              category: { select: { name: true } },
            },
          },
          inventory: true,
        },
        orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      }),
      prisma.storeInventoryMovement.findMany({
        include: {
          variant: {
            select: {
              sku: true,
              name: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

    return apiSuccess({
      variants: variants.map((v) => {
        const onHand = v.inventory?.onHand ?? 0;
        const reserved = v.inventory?.reserved ?? 0;
        const available = Math.max(0, onHand - reserved);
        const lowStockThreshold = v.inventory?.lowStockThreshold ?? 5;
        return {
          variantId: v.id,
          sku: v.sku,
          variantName: v.name,
          priceVnd: v.priceVnd,
          isActive: v.isActive,
          productId: v.product.id,
          productName: v.product.name,
          productStatus: v.product.status,
          categoryName: v.product.category.name,
          onHand,
          reserved,
          available,
          lowStockThreshold,
          isLowStock: available <= lowStockThreshold && v.product.status === "ACTIVE",
        };
      }),
      movements: movements.map((m) => ({
        id: m.id,
        sku: m.variant.sku,
        productName: m.variant.product.name,
        variantName: m.variant.name,
        type: m.type,
        deltaOnHand: m.deltaOnHand,
        deltaReserved: m.deltaReserved,
        onHandAfter: m.onHandAfter,
        reservedAfter: m.reservedAfter,
        orderId: m.orderId,
        reason: m.reason,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

