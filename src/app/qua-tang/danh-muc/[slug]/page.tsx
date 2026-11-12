import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ShopCatalogClient from "@/components/shop/ShopCatalogClient";
import { loadCatalogInitialData } from "@/lib/shop/catalog-query";

export const dynamic = "force-dynamic";

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = await prisma.storeCategory.findFirst({
    where: { slug: params.slug, isActive: true },
  });
  if (!category) {
    notFound();
  }

  const data = await loadCatalogInitialData({
    categorySlug: params.slug,
    searchParams,
  });

  return (
    <ShopCatalogClient
      categories={data.categories}
      initialProducts={data.products}
      initialTotal={data.total}
      activeCategorySlug={params.slug}
      initialQuery={data.initialQuery}
    />
  );
}
