import prisma from "@/lib/prisma";
import { serializeStoreProduct } from "@/lib/shop/api-helpers";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { normalizeViText } from "@/lib/shop/types";

export async function loadCatalogInitialData(params: {
  categorySlug: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await releaseExpiredReservations().catch(() => 0);

  const q = typeof params.searchParams.q === "string" ? params.searchParams.q : "";
  const occasion =
    typeof params.searchParams.occasion === "string" ? params.searchParams.occasion : "";
  const productType =
    typeof params.searchParams.productType === "string" ? params.searchParams.productType : "";
  const minPrice =
    typeof params.searchParams.minPrice === "string" ? params.searchParams.minPrice : "";
  const maxPrice =
    typeof params.searchParams.maxPrice === "string" ? params.searchParams.maxPrice : "";
  const inStockOnly = params.searchParams.inStockOnly === "true";
  const sort = typeof params.searchParams.sort === "string" ? params.searchParams.sort : "featured";
  const page = Math.max(
    1,
    Number(typeof params.searchParams.page === "string" ? params.searchParams.page : "1"),
  );
  const template =
    typeof params.searchParams.template === "string" ? params.searchParams.template : "";

  const [categories, rawProducts] = await Promise.all([
    prisma.storeCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.storeProduct.findMany({
      where: {
        status: "ACTIVE",
        ...(params.categorySlug && params.categorySlug !== "tat-ca"
          ? { category: { slug: params.categorySlug } }
          : {}),
        ...(productType && ["SINGLE", "COMBO", "ADDON"].includes(productType)
          ? { productType }
          : {}),
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
    }),
  ]);

  const serialized = rawProducts.map((p) => serializeStoreProduct(p));
  const qNorm = normalizeViText(q);
  const occNorm = normalizeViText(occasion);
  const minNum = Number(minPrice || 0);
  const maxNum = Number(maxPrice || 0);

  const filtered = serialized.filter((item) => {
    if (qNorm) {
      const hay = normalizeViText(
        `${item.name} ${item.subtitle || ""} ${item.shortDesc || ""} ${item.tags.join(" ")} ${item.occasionTags.join(" ")}`,
      );
      if (!hay.includes(qNorm)) return false;
    }
    if (occNorm) {
      if (!item.occasionTags.some((o) => normalizeViText(o).includes(occNorm))) {
        return false;
      }
    }
    if (minNum > 0 && item.maxPriceVnd < minNum) return false;
    if (maxNum > 0 && item.minPriceVnd > maxNum) return false;
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
      default:
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.sortOrder - b.sortOrder;
    }
  });

  const start = (page - 1) * 12;
  return {
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      activeProductCount: c._count.products,
    })),
    products: filtered.slice(start, start + 12),
    total: filtered.length,
    initialQuery: {
      q,
      occasion,
      productType,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      page,
      template,
    },
  };
}

