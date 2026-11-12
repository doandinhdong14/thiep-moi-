import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/common/Breadcrumb";
import CollectionGrid from "@/components/collections/CollectionGrid";
import { getVisibleCollections } from "@/data/catalogData";
import { getEffectiveVisibleCatalogProducts } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bộ sưu tập quà tặng & Thiệp mời đặc biệt | Ding Dong Gift",
  description:
    "Khám phá bộ sưu tập thiệp tương tác 3D độc quyền được đánh số #01 – #10 cho từng dịp đặc biệt.",
};

export default async function CollectionsPage() {
  const visibleProducts = await getEffectiveVisibleCatalogProducts();
  const visibleCollections = getVisibleCollections(visibleProducts);

  const breadcrumbItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Bộ sưu tập" },
  ];

  return (
    <div className="flex-1 bg-white min-h-[calc(100svh-64px)] pb-24">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-8 sm:pt-10">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="text-center mt-9 sm:mt-11 max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 tracking-tight">
            Bộ sưu tập thiệp độc quyền
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Các bộ sưu tập thiệp tương tác 3D đang mở bán (#01 – #{String(visibleProducts.length).padStart(2, "0")})
          </p>
          <div className="pt-1">
            <Link
              href="/qua-tang"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFF9F5] border border-[#F2DCE2] text-xs font-semibold text-[#D94575] hover:bg-[#FDECF0] transition-colors"
            >
              Muốn gửi thêm món quà thật kèm thiệp QR? → Cửa hàng quà
            </Link>
          </div>
        </div>

        <div className="mt-14 sm:mt-16">
          <CollectionGrid collections={visibleCollections} />
        </div>
      </div>
    </div>
  );
}
