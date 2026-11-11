"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import { productList, topicChips, ProductItem } from "@/data/landingData";
import ProductDemoModal from "@/components/modals/ProductDemoModal";
import { findCatalogProductBySlug, CatalogProduct } from "@/data/catalogData";
import ProductShowcaseCard from "./ProductShowcaseCard";
import styles from "./ProductShowcase.module.css";

interface ProductShowcaseProps {
  initialProducts?: ProductItem[];
}

export default function ProductShowcase({ initialProducts }: ProductShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [demoProduct, setDemoProduct] = useState<CatalogProduct | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const activeItems = initialProducts && initialProducts.length > 0 ? initialProducts : productList;
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / itemsPerPage));

  const displayedProducts = activeItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      const gridEl = gridRef.current;
      const sectionEl = sectionRef.current;
      if (!gridEl || !sectionEl) return;
      const gridRect = gridEl.getBoundingClientRect();
      // Keep the newly rendered page grid visible inside the viewport without jumping to page top
      if (gridRect.top < 84 || gridRect.top > window.innerHeight - 160) {
        const targetTop = Math.max(
          0,
          sectionEl.getBoundingClientRect().top + window.scrollY - 64
        );
        window.scrollTo({ top: targetTop, behavior: "smooth" });
      }
    });
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
  };

  const handleOpenDemo = (prod: ProductItem) => {
    const matched = findCatalogProductBySlug(prod.slug);
    if (matched) {
      setDemoProduct(matched);
    } else {
      setDemoProduct({
        id: prod.id,
        slug: prod.slug,
        title: prod.title,
        coverImage: prod.coverUrl,
        price: prod.priceVnd,
        compareAtPrice: prod.compareAtPriceVnd,
        category: prod.category || "Thiệp cưới & Đính hôn",
        categorySlug: "cuoi-dinh-hon",
        demoUrl: prod.demoUrl || `/templates/${prod.slug}`,
        guideUrl: prod.guideUrl,
        videoGuideUrl: prod.videoGuideUrl,
        description: "Mẫu thiệp mời thông minh, tương tác cao cấp trên điện thoại.",
        specs: {
          design: "Phong cách tinh tế, chuẩn visual cao cấp",
          interaction: "Mở phong bì 3D, phát nhạc nền & RSVP",
          sharing: "Gửi link qua Zalo hoặc in mã QR vật lý",
          compatibility: "Tương thích 100% trên điện thoại & máy tính",
        },
      });
    }
    setDemoModalOpen(true);
  };

  return (
    <section ref={sectionRef} id="products" className="py-12 lg:py-16 bg-white">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex items-center justify-center gap-2.5 mb-8 sm:mb-10 text-center">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-[#ff6b61] shrink-0" />
          <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent">
            Bộ sưu tập {activeItems.length} mẫu thiệp tương tác độc quyền (#01 – #{String(activeItems.length).padStart(2, "0")})
          </h2>
        </div>

        {/* Vertical Auto-Scrolling Card Grid (4 cols desktop, 3 cols tablet, 2 cols mobile) */}
        <div ref={gridRef} className={styles.showcaseGrid}>
          {displayedProducts.map((product: ProductItem, index: number) => (
            <ProductShowcaseCard
              key={product.id}
              product={product}
              index={index}
              onOpenDemo={handleOpenDemo}
              formatVnd={formatVnd}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        <nav
          aria-label="Phân trang sản phẩm"
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-8 sm:mt-9"
        >
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Trang trước"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
              currentPage === 1
                ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                : "border-rose-200 text-[#fa416a] hover:bg-rose-50 cursor-pointer shadow-xs"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageChange(pageNum)}
                aria-label={`Trang ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
                className={`w-9 h-9 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center border transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white border-transparent shadow-sm"
                    : "border-slate-200 text-slate-700 bg-white hover:border-rose-200 hover:text-[#fa416a] hover:bg-rose-50/50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Trang tiếp theo"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
              currentPage === totalPages
                ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                : "border-rose-200 text-[#fa416a] hover:bg-rose-50 cursor-pointer shadow-xs"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span
            aria-live="polite"
            className="text-xs sm:text-sm font-medium text-slate-500 pl-1"
          >
            Trang {currentPage} / {totalPages}
          </span>
        </nav>

        {/* Topic Chips */}
        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <span className="text-xs sm:text-sm font-semibold text-[#19191f] flex items-center gap-1.5 mr-1">
            <Tag className="w-3.5 h-3.5 text-[#fa416a]" />
            <span>Chủ đề nổi bật:</span>
          </span>

          {topicChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="px-3.5 py-1.5 rounded-full bg-[#fff0f3] hover:bg-rose-100 text-[#fa416a] text-xs font-medium border border-rose-200/70 transition-all hover:scale-105"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Product Demo Modal */}
      <ProductDemoModal
        product={demoProduct}
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </section>
  );
}
