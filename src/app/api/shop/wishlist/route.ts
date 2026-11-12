import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import {
  getOrCreateShopGuestToken,
  readShopGuestToken,
  setShopGuestCookieOnResponse,
} from "@/lib/shop/auth";
import { handleShopApiError, serializeStoreProduct } from "@/lib/shop/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const guestToken = readShopGuestToken();
    if (!user && !guestToken) {
      return apiSuccess({ productIds: [], items: [] });
    }

    const rows = await prisma.storeWishlistItem.findMany({
      where: user ? { userId: user.id } : { guestToken: guestToken! },
      include: {
        product: {
          include: {
            category: { select: { id: true, slug: true, name: true } },
            variants: {
              where: { isActive: true },
              include: { inventory: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeRows = rows.filter((r) => r.product.status === "ACTIVE");
    return apiSuccess({
      productIds: activeRows.map((r) => r.productId),
      items: activeRows.map((r) => serializeStoreProduct(r.product)),
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

const ToggleWishlistSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { token: guestToken, isNew } = getOrCreateShopGuestToken();
    const body = ToggleWishlistSchema.parse(await req.json());

    const whereClause = user
      ? { userId_productId: { userId: user.id, productId: body.productId } }
      : { guestToken_productId: { guestToken, productId: body.productId } };

    const existing = await prisma.storeWishlistItem.findUnique({ where: whereClause });
    let wishlisted = false;
    if (existing) {
      await prisma.storeWishlistItem.delete({ where: { id: existing.id } });
      wishlisted = false;
    } else {
      await prisma.storeWishlistItem.create({
        data: {
          productId: body.productId,
          userId: user?.id ?? null,
          guestToken: user ? null : guestToken,
        },
      });
      wishlisted = true;
    }

    const res = apiSuccess({ wishlisted, productId: body.productId });
    if (!user && isNew) {
      setShopGuestCookieOnResponse(res, guestToken);
    }
    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

