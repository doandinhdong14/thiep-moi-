import { Suspense } from "react";
import ProductsCatalogClient from "@/components/catalog/ProductsCatalogClient";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { getEffectiveVisibleCatalogProducts } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const initialProducts = await getEffectiveVisibleCatalogProducts();

  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-white py-20 px-4">
          <LoadingSkeleton count={6} />
        </div>
      }
    >
      <ProductsCatalogClient initialProducts={initialProducts} />
    </Suspense>
  );
}
