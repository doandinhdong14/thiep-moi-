"use client";

import { useRef, useEffect } from "react";
import {
  LayoutGrid,
  Cake,
  Moon,
  HeartHandshake,
  Sparkles,
  Heart,
  Gift,
  Flower2,
  Crown,
  GraduationCap,
} from "lucide-react";
import { CATALOG_CATEGORIES, CatalogCategory } from "@/data/catalogData";

interface CategoryTabsProps {
  activeCategory: string; // slug or 'all'
  onSelectCategory: (slug: string) => void;
  categories?: CatalogCategory[];
}

export default function CategoryTabs({
  activeCategory,
  onSelectCategory,
  categories = CATALOG_CATEGORIES,
}: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map icon name to Lucide icon component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Cake":
        return Cake;
      case "Moon":
        return Moon;
      case "HeartHandshake":
        return HeartHandshake;
      case "Sparkles":
        return Sparkles;
      case "Heart":
        return Heart;
      case "Gift":
        return Gift;
      case "Flower2":
        return Flower2;
      case "Crown":
        return Crown;
      case "GraduationCap":
        return GraduationCap;
      default:
        return LayoutGrid;
    }
  };

  return (
    <div className="w-full border-b border-gray-200">
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Danh mục sản phẩm"
        className="max-w-[1180px] mx-auto px-4 flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        {categories.map((category: CatalogCategory) => {
          const isActive =
            activeCategory === category.slug ||
            (activeCategory === "" && category.slug === "all");
          const IconComp = getIcon(category.iconName);

          return (
            <button
              key={category.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => onSelectCategory(category.slug)}
              className={`group relative flex items-center gap-2 py-3 px-1.5 whitespace-nowrap text-xs sm:text-sm font-medium transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#fa416a] rounded-md ${
                isActive
                  ? "text-[#fa416a] font-semibold"
                  : "text-slate-600 hover:text-[#fa416a]"
              }`}
            >
              {/* Pink circular background icon */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  isActive
                    ? "bg-rose-100 text-[#fa416a]"
                    : "bg-[#fff0f3] text-[#fa416a] group-hover:bg-rose-100"
                }`}
              >
                <IconComp className="w-4 h-4 stroke-[1.8]" />
              </div>

              <span>{category.title}</span>

              {/* Active Underline (~80px centered or fit) */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-[2.5px] bg-[#fa416a] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

