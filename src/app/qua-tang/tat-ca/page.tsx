import ShopCatalogClient from "@/components/shop/ShopCatalogClient";
import { loadCatalogInitialData } from "@/lib/shop/catalog-query";

export const dynamic = "force-dynamic";

export default async function AllShopProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const data = await loadCatalogInitialData({
    categorySlug: "tat-ca",
    searchParams,
  });

  return (
    <ShopCatalogClient
      categories={data.categories}
      initialProducts={data.products}
      initialTotal={data.total}
      activeCategorySlug="tat-ca"
      initialQuery={data.initialQuery}
    />
  );
}
