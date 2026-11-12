"use client";

import React from "react";
import ShopShell from "./ShopShell";
import ProductCard, { SerializedShopProduct } from "./ProductCard";

export interface LandingCategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  activeProductCount: number;
}

export interface LandingShowcaseCard {
  slug: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  tag: string;
}

interface ShopLandingClientProps {
  categories: LandingCategoryItem[];
  featuredProducts: SerializedShopProduct[];
  showcaseCards: LandingShowcaseCard[];
  isStaffUser: boolean;
  draftProductCount: number;
}

export default function ShopLandingClient({
  featuredProducts,
}: ShopLandingClientProps) {
  return (
    <ShopShell>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {featuredProducts.length === 0 ? (
          <p className="py-20 text-center text-sm text-[#777777]">
            Chưa có sản phẩm nào đang mở bán.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </ShopShell>
  );
}
