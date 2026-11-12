import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError, serializeStoreProduct } from "@/lib/shop/api-helpers";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { normalizeViText } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await releaseExpiredReservations().catch(() => 0);

    const url = new URL(req.url);
    const category = url.searchParams.get("category")?.trim() || "";
    const q = url.searchParams.get("q")?.trim() || "";
    const occasion = url.searchParams.get("occasion")?.trim() || "";
    const productType = url.searchParams.get("productType")?.trim() || "";
    const minPrice = Number(url.searchParams.get("minPrice") || 0);
    const maxPrice = Number(url.searchParams.get("maxPrice") || 0);
    const inStockOnly = url.searchParams.get("inStockOnly") === "true";
    const featuredOnly = url.searchParams.get("featured") === "true";
    const sort = url.searchParams.get("sort") || "featured";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit") || 12)));

    const products = await prisma.storeProduct.findMany({
      where: {
        status: "ACTIVE",
        ...(category && category !== "tat-ca" ? { category: { slug: category } } : {}),
        ...(productType && ["SINGLE", "COMBO", "ADDON"].includes(productType)
          ? { productType }
          : {}),
        ...(featuredOnly ? { isFeatured: true } : {}),
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const serialized = products.map((p) => serializeStoreProduct(p));
    const qNorm = normalizeViText(q);
    const occNorm = normalizeViText(occasion);

    const filtered = serialized.filter((item) => {
      if (qNorm) {
        const haystack = normalizeViText(
          `${item.name} ${item.subtitle || ""} ${item.shortDesc || ""} ${item.tags.join(" ")} ${item.occasionTags.join(" ")} ${item.category.name}`,
        );
        if (!haystack.includes(qNorm)) return false;
      }
      if (occNorm) {
        const matchOcc = item.occasionTags.some((o) =>
          normalizeViText(o).includes(occNorm),
        );
        if (!matchOcc) return false;
      }
      if (minPrice > 0 && item.maxPriceVnd < minPrice) return false;
      if (maxPrice > 0 && item.minPriceVnd > maxPrice) return false;
      if (inStockOnly && !item.inStock) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sort) {
        case "price_asc":
          return a.minPriceVnd - b.minPriceVnd;
        case "price_desc":
          return b.minPriceVnd - a.minPriceVnd;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "featured":
        default:
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          return a.sortOrder - b.sortOrder;
      }
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return apiSuccess(
      {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      200,
    );
  } catch (err) {
    return handleShopApiError(err);
  }
}

