"use client";

import React from "react";
import Link from "next/link";
import { formatVnd } from "@/lib/shop/types";

export interface SerializedShopProduct {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  shortDesc: string | null;
  productType: string;
  isFeatured: boolean;
  tags: string[];
  occasionTags: string[];
  images: string[];
  cardIncluded: boolean;
  minPriceVnd: number;
  maxPriceVnd: number;
  totalAvailableStock: number;
  inStock: boolean;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  variants: {
    id: string;
    sku: string;
    name: string;
    colorName: string | null;
    colorHex: string | null;
    priceVnd: number;
    compareAtVnd: number | null;
    imageUrl: string | null;
    availableStock: number;
    inStock: boolean;
    lowStock: boolean;
    isDefault: boolean;
  }[];
}

export default function ProductCard({
  product,
}: {
  product: SerializedShopProduct;
}) {
  const defaultVariant =
    product.variants.find((v) => v.isDefault && v.inStock) ||
    product.variants.find((v) => v.inStock) ||
    product.variants[0];

  const primaryImage =
    product.images[0] || defaultVariant?.imageUrl || "/assets/shop/scarf-suong-mai.svg";

  return (
    <Link
      href={`/qua-tang/san-pham/${product.slug}`}
      className="group block text-left"
    >
      <div className="aspect-square w-full overflow-hidden bg-[#F7F7F7]">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <h2 className="mt-3 text-[14px] leading-[1.45] font-normal text-[#222222] line-clamp-2">
        {product.name}
      </h2>
      <p className="mt-1.5 text-[15px] leading-tight font-bold text-[#111111]">
        {formatVnd(product.minPriceVnd)}
      </p>
    </Link>
  );
}
