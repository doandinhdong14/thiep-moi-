import Link from "next/link";
import { Suspense } from "react";
import ProductsCatalogClient from "@/components/catalog/ProductsCatalogClient";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { getEffectiveVisibleCatalogProducts } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const initialProducts = await getEffectiveVisibleCatalogProducts();

  return (
    <>
      <div className="bg-[#FFF9F5] border-b border-[#F2DCE2] px-4 py-2.5 text-center text-xs text-[#3E2A2D]">
        <span>Muốn gửi thêm món quà thật (Khăn len, Găng tay, Móc khóa) kèm thiệp QR? </span>
        <Link href="/qua-tang" className="font-bold text-[#FF5C8D] hover:underline">
          Ghé Cửa hàng quà DingDong →
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="flex-1 bg-white py-20 px-4">
            <LoadingSkeleton count={6} />
          </div>
        }
      >
        <ProductsCatalogClient initialProducts={initialProducts} />
      </Suspense>
    </>
  );
}
