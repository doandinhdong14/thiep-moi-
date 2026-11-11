"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryTabs from "@/components/catalog/CategoryTabs";
import ProductGrid from "@/components/catalog/ProductGrid";
import ProductDemoModal from "@/components/modals/ProductDemoModal";
import EmptyState from "@/components/common/EmptyState";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { CATALOG_PRODUCTS, CatalogProduct } from "@/data/catalogData";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [demoProduct, setDemoProduct] = useState<CatalogProduct | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state with URL parameter changes (e.g. back/forward navigation)
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

  const handleCloseDemo = () => {
    setIsDemoOpen(false);
  };

  // Filter products by category
  const filteredProducts =
    activeCategory === "all" || !activeCategory
      ? CATALOG_PRODUCTS
      : CATALOG_PRODUCTS.filter((p) => p.categorySlug === activeCategory);

  return (
    <div className="flex-1 bg-white min-h-[calc(100svh-64px)] pb-20">
      {/* 1. Main Heading: Desktop ~28px semibold, top margin ~40px */}
      <div className="max-w-[1180px] mx-auto px-4 pt-10 sm:pt-12 text-center">
        <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-semibold text-[#19191f] tracking-tight">
          Tất Cả Sản Phẩm
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Khám phá bộ sưu tập thiệp cưới, sinh nhật, kỷ niệm & quà tặng tương tác cao cấp
        </p>
      </div>

      {/* 2. Category Tabs Strip: ~45–55px below heading */}
      <div className="mt-10 sm:mt-12">
        <CategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* 3. Catalog Grid: ~70–80px below tab strip */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-14 sm:mt-16">
        {loading ? (
          <LoadingSkeleton count={6} />
        ) : filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            onOpenDemo={handleOpenDemo}
          />
        ) : (
          <EmptyState
            title="Chưa có sản phẩm thuộc danh mục này"
            description="Chúng tôi đang chuẩn bị thêm nhiều mẫu mới cho danh mục này. Hãy thử xem các danh mục khác nhé!"
            actionLabel="Xem tất cả sản phẩm"
            onAction={() => handleSelectCategory("all")}
          />
        )}
      </div>

      {/* 4. Product Demo Modal */}
      <ProductDemoModal
        product={demoProduct}
        isOpen={isDemoOpen}
        onClose={handleCloseDemo}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-white py-20 px-4">
          <LoadingSkeleton count={6} />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

