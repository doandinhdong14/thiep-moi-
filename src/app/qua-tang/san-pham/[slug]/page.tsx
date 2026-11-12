import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { serializeStoreProduct } from "@/lib/shop/api-helpers";
import { getEligibleShopTemplates } from "@/lib/shop/gift-card";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { getPublicShopSettings } from "@/lib/shop/settings";
import { safeJsonParse } from "@/lib/shop/types";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function ShopProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
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
    notFound();
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

  let resolvedDefaultTemplateSlug = fallbackSlug;
  if (product.defaultTemplateId) {
    if (templates.some((t) => t.slug === product.defaultTemplateId)) {
      resolvedDefaultTemplateSlug = product.defaultTemplateId;
    } else {
      const matchedTpl = await prisma.template.findUnique({
        where: { id: product.defaultTemplateId },
        select: { slug: true },
      });
      if (matchedTpl?.slug && templates.some((t) => t.slug === matchedTpl.slug)) {
        resolvedDefaultTemplateSlug = matchedTpl.slug;
      }
    }
  }

  const serialized = serializeStoreProduct(product);

  return (
    <ProductDetailClient
      product={{
        ...serialized,
        description: product.description,
        materialCare: product.materialCare,
        giftNote: product.giftNote,
        boxSpecs: serialized.boxSpecs,
        comboItems: serialized.comboItems,
        eligibleTemplateIds: serialized.eligibleTemplateIds,
        defaultTemplateId: product.defaultTemplateId,
      }}
      related={relatedRaw.map((r) => serializeStoreProduct(r))}
      defaultTemplateSlug={resolvedDefaultTemplateSlug}
      cardPlans={settings.cardPlans}
      giftWrapOptions={settings.giftWrapOptions}
    />
  );
}

