"use client";

import React, { useEffect, useState } from "react";
import ShopShell from "./ShopShell";
import ProductCard, { SerializedShopProduct } from "./ProductCard";

export interface CatalogCategoryOption {
  id: string;
  slug: string;
  name: string;
  activeProductCount: number;
}

interface ShopCatalogClientProps {
  categories: CatalogCategoryOption[];
  initialProducts: SerializedShopProduct[];
  initialTotal: number;
  activeCategorySlug: string;
  initialQuery: {
    q: string;
    occasion: string;
    productType: string;
    minPrice: string;
    maxPrice: string;
    inStockOnly: boolean;
    sort: string;
    page: number;
    template: string;
  };
}

export default function ShopCatalogClient({
  initialProducts,
}: ShopCatalogClientProps) {
  const [products, setProducts] = useState<SerializedShopProduct[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  return (
    <ShopShell>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {products.length === 0 ? (
          <p className="py-20 text-center text-sm text-[#777777]">
            Chưa có sản phẩm nào đang mở bán.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </ShopShell>
  );
}
