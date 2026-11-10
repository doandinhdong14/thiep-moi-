"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { CatalogProduct } from "@/data/catalogData";

interface ProductGridProps {
  products: CatalogProduct[];
  onOpenDemo: (product: CatalogProduct) => void;
  itemsPerPage?: number;
}

export default function ProductGrid({
  products,
  onOpenDemo,
  itemsPerPage = 9,
}: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const displayedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3-Column Desktop Grid Centered to ~960px */}
      <div className="w-full max-w-[960px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9 sm:gap-y-10">
        {displayedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpenDemo={onOpenDemo}
          />
        ))}
      </div>

      {/* Pagination (if more than 1 page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
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

          <span className="text-xs sm:text-sm font-semibold text-slate-700 px-3.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
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
      )}
    </div>
  );
}

