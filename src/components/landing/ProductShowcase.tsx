"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  ShoppingCart,
  BookOpen,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import { productList, topicChips, ProductItem } from "@/data/landingData";
import ProductDemoModal from "@/components/modals/ProductDemoModal";
import { CATALOG_PRODUCTS, CatalogProduct } from "@/data/catalogData";

export default function ProductShowcase() {
  const [currentPage, setCurrentPage] = useState(1);
  const [demoProduct, setDemoProduct] = useState<CatalogProduct | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const itemsPerPage = 5; // 5 cards per page to form the 5-column row matching the screenshot!
  const totalPages = Math.ceil(productList.length / itemsPerPage);

  const displayedProducts = productList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
  };

  const handleOpenDemo = (prod: ProductItem) => {
    const matched = CATALOG_PRODUCTS.find((p) => p.slug === prod.slug);
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
    <section id="products" className="py-12 lg:py-16 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex items-center justify-center gap-2.5 mb-10 text-center">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-[#ff6b61] shrink-0" />
          <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent">
            Hơn 50+ sản phẩm đang chờ bạn khám phá
          </h2>
        </div>

        {/* 5-Column Grid (Desktop) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6 ${
            displayedProducts.length < 5 ? "justify-center" : ""
          }`}
        >
          {displayedProducts.map((product: ProductItem) => {
            const hasDiscount =
              product.compareAtPriceVnd && product.compareAtPriceVnd > product.priceVnd;
            const discountPercent = hasDiscount
              ? Math.round((1 - product.priceVnd / product.compareAtPriceVnd!) * 100)
              : null;

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-white rounded-[15px] border border-[#e9e9ed] shadow-[0_3px_18px_rgba(20,20,30,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(20,20,30,0.12)]"
              >
                {/* Product Cover (Aspect Ratio 1.5:1 ~ 270x180) */}
                <div className="relative aspect-[1.5/1] w-full overflow-hidden bg-slate-100">
                  <img
                    src={product.coverUrl}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {hasDiscount && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#fa416a] text-white text-[11px] font-bold shadow-sm">
                      -{discountPercent}%
                    </span>
                  )}
                  {product.category && (
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col p-4 sm:p-5">
                  {/* Title (2 lines clamp, fixed min-height for axis alignment) */}
                  <h3 className="text-[14px] font-bold text-[#19191f] leading-snug line-clamp-2 min-h-[42px] mb-3">
                    {product.title}
                  </h3>

                  {/* Price Block (Aligned Right) */}
                  <div className="flex items-baseline justify-end gap-2 mb-4">
                    {hasDiscount && (
                      <span className="text-xs text-[#73737d] line-through font-medium">
                        {formatVnd(product.compareAtPriceVnd!)}
                      </span>
                    )}
                    <span className="text-[15px] sm:text-[16px] font-bold text-[#e93459]">
                      {formatVnd(product.priceVnd)}
                    </span>
                  </div>

                  {/* 2 CTA Buttons on Same Row */}
                  <div className="grid grid-cols-2 gap-2 mb-3 mt-auto">
                    <Link
                      href={`/create?template=${product.slug}`}
                      className="flex items-center justify-center gap-1.5 h-[34px] px-2.5 rounded-[6px] bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-opacity"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Mua ngay</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenDemo(product)}
                      className="flex items-center justify-center gap-1.5 h-[34px] px-2.5 rounded-[6px] bg-white border border-[#fa416a] text-[#fa416a] hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem demo</span>
                    </button>
                  </div>

                  {/* 2 Guide Links Below */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-[#73737d]">
                    <Link
                      href={product.guideUrl || "/occasions"}
                      className="flex items-center gap-1 hover:text-[#fa416a] transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Hướng dẫn</span>
                    </Link>

                    <a
                      href={product.videoGuideUrl || "https://youtube.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#fa416a] transition-colors"
                    >
                      <PlayCircle className="w-3 h-3" />
                      <span>Video HD</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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

          <span className="text-sm font-semibold text-slate-700 px-3 py-1 bg-slate-50 rounded-lg">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        </div>

        {/* Topic Chips */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
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

