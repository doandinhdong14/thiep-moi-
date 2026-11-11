"use client";

import Link from "next/link";
import {
  Cake,
  Moon,
  HeartHandshake,
  Sparkles,
  Heart,
  Gift,
  Flower2,
  Crown,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { CollectionItem } from "@/data/catalogData";
import VerticalScrollPreview from "@/components/landing/VerticalScrollPreview";

interface CollectionCardProps {
  collection: CollectionItem;
  index?: number;
}

const COLLECTION_ICONS = {
  Cake,
  Moon,
  HeartHandshake,
  Sparkles,
  Heart,
  Gift,
  Flower2,
  Crown,
  GraduationCap,
} as const;

export default function CollectionCard({ collection, index = 0 }: CollectionCardProps) {
  const IconComp =
    COLLECTION_ICONS[collection.iconName as keyof typeof COLLECTION_ICONS] || Gift;

  const topOverlay = (
    <div className="absolute top-0 inset-x-0 z-20 p-2 sm:p-2.5 lg:p-3 flex items-start justify-between gap-1.5 pointer-events-none">
      <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-full bg-black/55 backdrop-blur-xs text-white/95 text-[9.5px] sm:text-[10.5px] font-medium leading-none shadow-xs border border-white/15">
        <IconComp className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>Bộ sưu tập</span>
      </span>

      <span className="px-2 py-1 sm:px-2.5 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-[9.5px] sm:text-[10.5px] font-bold leading-none shadow-sm shrink-0">
        {collection.productCount} mẫu
      </span>
    </div>
  );

  const bottomOverlay = (
    <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 max-[359px]:p-2 sm:p-3.5 lg:p-4 flex flex-col items-center text-center">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/18 backdrop-blur-md border border-white/35 flex items-center justify-center text-white mb-1.5 shadow-md transition-transform duration-300 group-hover:scale-110">
        <IconComp className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[1.8]" aria-hidden="true" />
      </div>

      <h2 className="text-white font-bold text-[13px] max-[359px]:text-[12px] sm:text-[15px] lg:text-[17px] tracking-tight leading-snug line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
        {collection.title}
      </h2>

      <p className="text-white/85 text-[10.5px] sm:text-[12px] leading-[1.35] max-w-xs mt-1 line-clamp-2 drop-shadow-xs">
        {collection.subtitle}
      </p>

      <div className="mt-2 sm:mt-2.5">
        <span className="inline-flex items-center gap-1.5 h-[29px] sm:h-[32px] px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-[11px] sm:text-[12px] font-semibold shadow-[0_4px_12px_rgba(250,65,106,0.38)] transition-transform duration-300 group-hover:scale-[1.03]">
          <span>Khám phá ngay</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
        </span>
      </div>
    </div>
  );

  return (
    <Link
      href={`/products?category=${collection.categorySlug}`}
      aria-label={`Khám phá bộ sưu tập ${collection.title}`}
      className="group block rounded-[18px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fa416a]"
    >
      <VerticalScrollPreview
        id={collection.id}
        slug={collection.slug}
        index={index}
        previewImage={collection.previewImage}
        coverUrl={collection.image}
        topOverlay={topOverlay}
        bottomOverlay={bottomOverlay}
      />
    </Link>
  );
}
