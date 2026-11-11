"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { CatalogProduct } from "@/data/catalogData";
import styles from "@/components/landing/ProductShowcase.module.css";

interface ProductGridProps {
  products: CatalogProduct[];
  onOpenDemo: (product: CatalogProduct) => void;
  itemsPerPage?: number;
}

export default function ProductGrid({
  products,
  onOpenDemo,
  itemsPerPage = 12,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const displayedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage);
    if (gridRef.current && typeof window !== "undefined") {
      const targetTop = Math.max(
        0,
        window.scrollY + gridRef.current.getBoundingClientRect().top - 96
      );
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div ref={gridRef} className={styles.showcaseGrid}>
        {displayedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            onOpenDemo={onOpenDemo}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
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

          <span className="text-xs sm:text-sm font-semibold text-slate-700 px-3.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            Trang {currentPage} / {totalPages}
          </span>

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
        </div>
      )}
    </div>
  );
}
