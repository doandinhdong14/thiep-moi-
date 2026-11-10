"use client";

import { useState } from "react";
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
  ImageOff,
} from "lucide-react";
import { CollectionItem } from "@/data/catalogData";

interface CollectionCardProps {
  collection: CollectionItem;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const [imageError, setImageError] = useState(false);

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
        return Gift;
    }
  };

  const IconComp = getIcon(collection.iconName);

  return (
    <Link
      href={`/products?category=${collection.categorySlug}`}
      className="group relative block aspect-[1.28/1] w-full rounded-[20px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fa416a]"
    >
      {/* Background Cover Image */}
      {!imageError ? (
        <img
          src={collection.image}
          alt={collection.title}
          loading="lazy"
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
          <ImageOff className="w-10 h-10" />
        </div>
      )}

      {/* Linear Gradient Overlay: transparent top -> dark black bottom for high contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity duration-300 group-hover:from-black/95 group-hover:via-black/55" />

      {/* Content in Lower Half Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-7 text-center z-10">
        {/* Category Icon Badge */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <IconComp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-[22px] lg:text-[24px] font-bold text-white tracking-tight leading-snug drop-shadow-sm">
          {collection.title}
        </h2>

        {/* Subtitle */}
        <p className="text-white/85 text-xs sm:text-[13px] sm:leading-relaxed max-w-xs mt-1.5 line-clamp-2 drop-shadow-xs">
          {collection.subtitle}
        </p>

        {/* Hover Pill CTA */}
        <div className="mt-4 pt-1 opacity-90 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#fa416a] hover:bg-[#ff6b61] text-white text-xs font-semibold shadow-md">
            <span>Khám phá ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

