"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryTabs from "@/components/catalog/CategoryTabs";
import ProductGrid from "@/components/catalog/ProductGrid";
import ProductDemoModal from "@/components/modals/ProductDemoModal";
import EmptyState from "@/components/common/EmptyState";
import {
  CatalogCategory,
  CatalogProduct,
  getVisibleCatalogCategories,
} from "@/data/catalogData";

interface ProductsCatalogClientProps {
  initialProducts: CatalogProduct[];
}

export default function ProductsCatalogClient({
  initialProducts,
}: ProductsCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [demoProduct, setDemoProduct] = useState<CatalogProduct | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  const handleSelectCategory = (slug: string) => {
    setActiveCategory(slug);
    if (slug === "all") {
      router.push("/products");
    } else {
      router.push(`/products?category=${slug}`);
    }
  };

  const handleOpenDemo = (product: CatalogProduct) => {
    setDemoProduct(product);
    setIsDemoOpen(true);
  };

  const activeCategories: CatalogCategory[] = getVisibleCatalogCategories(initialProducts);

  const filteredProducts =
    activeCategory === "all" || !activeCategory
      ? initialProducts
      : initialProducts.filter((p) => p.categorySlug === activeCategory);

  return (
    <div className="flex-1 bg-white min-h-[calc(100svh-64px)] pb-20">
      <div className="max-w-[1180px] mx-auto px-4 pt-10 sm:pt-12 text-center">
        <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-semibold text-[#19191f] tracking-tight">
          Bộ Sưu Tập {initialProducts.length} Mẫu Thiệp Độc Quyền (#01 – #{String(initialProducts.length).padStart(2, "0")})
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Các mẫu thiệp tương tác 3D được đánh số thứ tự rõ ràng — cá nhân hóa ảnh, nhạc & nhận QR quét không quảng cáo.
        </p>
      </div>

      <div className="mt-10 sm:mt-12">
        <CategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          categories={activeCategories}
        />
      </div>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-14 sm:mt-16">
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} onOpenDemo={handleOpenDemo} />
        ) : (
          <EmptyState
            title="Chưa có sản phẩm thuộc danh mục này"
            description="Hãy chọn danh mục Tất cả hoặc một chủ đề khác để khám phá toàn bộ các mẫu thiệp."
            actionLabel="Xem tất cả sản phẩm"
            onAction={() => handleSelectCategory("all")}
          />
        )}
      </div>

      <ProductDemoModal
        product={demoProduct}
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
}

