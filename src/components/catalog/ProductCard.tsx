"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Eye, BookOpen, PlayCircle, ImageOff } from "lucide-react";
import { CatalogProduct } from "@/data/catalogData";

interface ProductCardProps {
  product: CatalogProduct;
  onOpenDemo: (product: CatalogProduct) => void;
}

export default function ProductCard({ product, onOpenDemo }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : null;

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  return (
    <div className="group flex flex-col bg-white rounded-[16px] border border-[#eee] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* 1. Cover Image (16:10 Aspect Ratio) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imageError ? (
          <img
            src={product.coverImage}
            alt={product.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-xs gap-1.5">
            <ImageOff className="w-6 h-6 stroke-[1.5]" />
            <span>Ảnh sản phẩm</span>
          </div>
        )}

        {/* Category Pill on Image */}
        {product.category && (
          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
            {product.category}
          </span>
        )}
      </div>

      {/* 2. Card Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-5">
        {/* Title: Left-aligned, bold 14px, 2-line clamp */}
        <h3 className="text-[14px] font-bold text-[#19191f] leading-snug line-clamp-2 min-h-[42px] mb-2 text-left">
          {product.title}
        </h3>

        {/* Price Block: Bottom right below title */}
        <div className="flex flex-col items-end mb-4">
          <div className="flex items-center gap-1.5">
            {hasDiscount && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatVnd(product.compareAtPrice!)}
              </span>
            )}
            {hasDiscount && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-200">
                -{discountPercent}%
              </span>
            )}
          </div>
          <span className="text-[15px] sm:text-[16px] font-bold text-[#e93459]">
            {formatVnd(product.price)}
          </span>
        </div>

        {/* 3. Action Buttons: Mua ngay & Xem demo */}
        <div className="grid grid-cols-2 gap-2 mb-3 mt-auto">
          <Link
            href={`/create?template=${product.slug}`}
            className="flex items-center justify-center gap-1.5 h-[34px] px-2.5 rounded-[8px] bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-opacity"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Mua ngay</span>
          </Link>

          <button
            type="button"
            onClick={() => onOpenDemo(product)}
            className="flex items-center justify-center gap-1.5 h-[34px] px-2.5 rounded-[8px] bg-white border border-[#fa416a] text-[#fa416a] hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem demo</span>
          </button>
        </div>

        {/* 4. Guide Links Row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
          {product.guideUrl ? (
            <Link
              href={product.guideUrl}
              className="flex items-center gap-1 hover:text-[#fa416a] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#fa416a]" />
              <span>Hướng dẫn</span>
            </Link>
          ) : (
            <span
              className="flex items-center gap-1 text-slate-300 cursor-not-allowed"
              title="Hướng dẫn đang được cập nhật"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-300" />
              <span>Hướng dẫn</span>
            </span>
          )}

          {product.videoGuideUrl ? (
            <a
              href={product.videoGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#fa416a] transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#fa416a]" />
              <span>Video hướng dẫn</span>
            </a>
          ) : (
            <span
              className="flex items-center gap-1 text-slate-300 cursor-not-allowed"
              title="Video hướng dẫn đang được cập nhật"
            >
              <PlayCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>Video HD</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

