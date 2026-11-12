import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleShopApiError, serializeStoreProduct } from "@/lib/shop/api-helpers";
import {
  getEligibleShopTemplates,
  MESSAGE_SUGGESTIONS,
  SHOP_MUSIC_TRACKS,
} from "@/lib/shop/gift-card";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { getPublicShopSettings } from "@/lib/shop/settings";
import { safeJsonParse } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    await releaseExpiredReservations().catch(() => 0);

    const product = await prisma.storeProduct.findFirst({
      where: { slug: params.slug, status: "ACTIVE" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return apiError("Sản phẩm không tồn tại hoặc chưa mở bán.", "NOT_FOUND", 404);
    }

    const eligibleIds = safeJsonParse<string[]>(product.eligibleTemplateIdsJson, []);
    const [{ templates, fallbackSlug }, settings, relatedRaw] = await Promise.all([
      getEligibleShopTemplates(eligibleIds),
      getPublicShopSettings(),
      prisma.storeProduct.findMany({
        where: {
          status: "ACTIVE",
          id: { not: product.id },
        },
        include: {
          category: { select: { id: true, slug: true, name: true } },
          variants: {
            where: { isActive: true },
            include: { inventory: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        take: 4,
      }),
    ]);

    return apiSuccess({
      product: serializeStoreProduct(product),
      related: relatedRaw.map((r) => serializeStoreProduct(r)),
      giftCardConfig: {
        defaultTemplateSlug: product.defaultTemplateId || fallbackSlug,
        eligibleTemplates: templates,
        cardPlans: settings.cardPlans,
        giftWrapOptions: settings.giftWrapOptions,
        musicTracks: SHOP_MUSIC_TRACKS,
        messageSuggestions: MESSAGE_SUGGESTIONS,
      },
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

