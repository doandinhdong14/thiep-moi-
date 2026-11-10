import type { Metadata } from "next";
import Breadcrumb from "@/components/common/Breadcrumb";
import CollectionGrid from "@/components/collections/CollectionGrid";
import { COLLECTIONS_LIST } from "@/data/catalogData";

export const metadata: Metadata = {
  title: "Bộ sưu tập quà tặng & Thiệp mời đặc biệt | Ding Dong Gift",
  description:
    "Khám phá các bộ sưu tập thiệp cưới, sinh nhật, kỷ niệm, ngày lễ 8/3, 20/10, Valentine và tốt nghiệp độc đáo cho mọi khoảnh khắc đáng nhớ.",
};

export default function CollectionsPage() {
  const breadcrumbItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Bộ sưu tập" },
  ];

  return (
    <div className="flex-1 bg-white min-h-[calc(100svh-64px)] pb-24">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb ~35-45px below header */}
        <div className="pt-8 sm:pt-10">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Headline ~40px below, centered */}
        <div className="text-center mt-9 sm:mt-11 max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 tracking-tight">
            Bộ sưu tập quà tặng
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Khám phá các bộ sưu tập quà tặng độc đáo cho mọi dịp đặc biệt
          </p>
        </div>

        {/* Collections Grid ~55-65px below tagline */}
        <div className="mt-14 sm:mt-16">
          <CollectionGrid collections={COLLECTIONS_LIST} />
        </div>
      </div>
    </div>
  );
}

