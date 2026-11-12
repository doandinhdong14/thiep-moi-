import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.storeCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return apiSuccess(
      categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        iconName: c.iconName,
        coverImage: c.coverImage,
        sortOrder: c.sortOrder,
        activeProductCount: c._count.products,
      })),
    );
  } catch (err) {
    return handleShopApiError(err);
  }
}

