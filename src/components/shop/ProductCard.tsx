"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import {
  formatVnd,
  PHYSICAL_SHOP_LAUNCH_LABEL,
  PHYSICAL_SHOP_LOCKED,
} from "@/lib/shop/types";

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
      <div className="relative aspect-square w-full overflow-hidden bg-[#F7F7F7]">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        {PHYSICAL_SHOP_LOCKED && (
          <div className="absolute inset-0 bg-slate-950/20 flex items-start justify-start p-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-amber-300/45 text-amber-200 text-[10px] sm:text-[11px] font-bold shadow-sm">
              <Lock className="w-3 h-3 shrink-0" />
              <span>{PHYSICAL_SHOP_LAUNCH_LABEL}</span>
            </span>
          </div>
        )}
      </div>
      <h2 className="mt-3 text-[14px] leading-[1.45] font-normal text-[#222222] line-clamp-2">
        {product.name}
      </h2>
      <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[15px] leading-tight font-bold text-[#111111]">
          {formatVnd(product.minPriceVnd)}
        </p>
        {PHYSICAL_SHOP_LOCKED && (
          <span className="text-[11px] font-semibold text-[#D94575]">
            {PHYSICAL_SHOP_LAUNCH_LABEL}
          </span>
        )}
      </div>
    </Link>
  );
}
