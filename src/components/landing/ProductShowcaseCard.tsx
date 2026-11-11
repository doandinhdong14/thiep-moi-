"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Eye, PlayCircle, ShoppingCart } from "lucide-react";
import type { ProductItem } from "@/data/landingData";
import { getTemplateDemoContent, TEMPLATES_REGISTRY } from "@/lib/templates/registry";
import VerticalScrollPreview from "./VerticalScrollPreview";
import styles from "./ProductShowcase.module.css";

interface ProductShowcaseCardProps {
  product: ProductItem;
  index: number;
  onOpenDemo?: (product: ProductItem) => void;
  formatVnd?: (amount: number) => string;
  primaryLabel?: string;
  primaryHref?: string;
  onPrimaryAction?: (product: ProductItem) => void;
  isCreating?: boolean;
  showGuideLinks?: boolean;
  showPrice?: boolean;
  subtitleText?: string;
}

const DEFAULT_FORMAT_VND = (amount: number) => {
  if (amount <= 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
};

function IsolatedTemplateFallback({ slug, fallbackCoverUrl }: { slug: string; fallbackCoverUrl: string }) {
  const template = TEMPLATES_REGISTRY[slug];
  const content = useMemo(() => getTemplateDemoContent(slug), [slug]);
  const [coverSrc, setCoverSrc] = useState(content.coverImageUrl || fallbackCoverUrl);

  if (!template) return null;
  const { theme } = template;

  return (
    <div
      className="w-full px-3.5 py-6 text-center space-y-4 select-none"
      style={{
        backgroundColor: theme.background,
        color: theme.foreground,
        fontFamily: theme.fontFamily === "serif" ? "var(--font-serif)" : "var(--font-sans)",
      }}
    >
      <div
        className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border"
        style={{
          backgroundColor: `${theme.accent}18`,
          borderColor: `${theme.accent}40`,
          color: theme.accent,
        }}
      >
        Trân Trọng Kính Mời
      </div>

      {content.people && content.people.length > 0 && (
        <p className="text-base font-bold tracking-tight" style={{ color: theme.accent }}>
          {content.people.map((p) => p.displayName).join(" & ")}
        </p>
      )}

      <p className="text-sm font-bold leading-snug">{content.title}</p>
      {content.subtitle && <p className="text-[11px] opacity-75">{content.subtitle}</p>}

      {coverSrc && (
        <div
          className="rounded-xl overflow-hidden border-2 shadow-md mx-auto"
          style={{ borderColor: `${theme.accent}45` }}
        >
          <img
            src={coverSrc}
            alt=""
            onError={() => {
              if (fallbackCoverUrl && coverSrc !== fallbackCoverUrl) {
                setCoverSrc(fallbackCoverUrl);
              }
            }}
            className="w-full aspect-[4/3] object-cover block"
          />
        </div>
      )}

      {content.message && (
        <p className="text-[11px] leading-relaxed opacity-85 px-1">{content.message}</p>
      )}

      {content.event && (
        <div
          className="rounded-xl p-3 text-[10.5px] space-y-1 border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.accent}35`,
          }}
        >
          <p className="font-bold uppercase tracking-wider text-[9px]" style={{ color: theme.accent }}>
            Thời Gian & Địa Điểm
          </p>
          <p className="font-semibold">{content.event.venueName}</p>
          {content.event.address && <p className="opacity-75">{content.event.address}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Vertical 4:7 product showcase card displaying an auto-scrolling invitation preview
 * with fixed bottom typography, price, action buttons, and guide links.
 */
export default function ProductShowcaseCard({
  product,
  index,
  onOpenDemo,
  formatVnd = DEFAULT_FORMAT_VND,
  primaryLabel = "Mua ngay",
  primaryHref,
  onPrimaryAction,
  isCreating = false,
  showGuideLinks = true,
  showPrice = true,
  subtitleText,
}: ProductShowcaseCardProps) {
  const hasTemplateFallback = Boolean(TEMPLATES_REGISTRY[product.slug]);
  const fallbackBg = TEMPLATES_REGISTRY[product.slug]?.theme.background || "#18181b";

  const hasDiscount = Boolean(
    showPrice && product.compareAtPriceVnd && product.compareAtPriceVnd > product.priceVnd
  );
  const discountPercent = hasDiscount
    ? Math.round((1 - product.priceVnd / product.compareAtPriceVnd!) * 100)
    : null;

  const topOverlay =
    product.category || product.badge || hasDiscount ? (
      <div className="absolute top-0 inset-x-0 z-20 p-2 sm:p-2.5 lg:p-3 flex items-start justify-between gap-1.5 pointer-events-none">
        {product.category ? (
          <span className="px-2 py-1 sm:px-2.5 rounded-full bg-black/55 backdrop-blur-xs text-white/95 text-[9.5px] sm:text-[10.5px] font-medium leading-none tracking-tight truncate max-w-[66%] shadow-xs border border-white/15">
            {product.category}
          </span>
        ) : (
          <span />
        )}

        {(product.badge || hasDiscount) && (
          <div className="flex flex-col-reverse items-end sm:flex-row sm:items-center gap-1 shrink-0">
            {product.badge && (
              <span className="px-2 py-1 rounded-full bg-amber-400/95 text-slate-950 text-[9px] sm:text-[10.5px] font-bold leading-none shadow-xs">
                {product.badge}
              </span>
            )}
            {hasDiscount && (
              <span className="px-2 py-1 sm:px-2.5 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-[9.5px] sm:text-[10.5px] font-bold leading-none shadow-sm">
                -{discountPercent}%
              </span>
            )}
          </div>
        )}
      </div>
    ) : null;

  const bottomOverlay = (
    <div className="absolute inset-x-0 bottom-0 z-20 p-2 max-[359px]:p-1.5 sm:p-3 lg:p-4 flex flex-col items-center text-center">
      <h3 className="text-white font-semibold text-[12px] max-[359px]:text-[11px] sm:text-[13.5px] lg:text-[15.5px] leading-[1.25] sm:leading-[1.32] line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] max-w-full">
        {product.title}
      </h3>

      {subtitleText && (
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11.5px] text-white/80 line-clamp-1 max-w-full">
          {subtitleText}
        </p>
      )}

      {showPrice && (
        <div className="mt-0.5 sm:mt-1.5 flex items-baseline justify-center gap-1.5 flex-wrap">
          {hasDiscount && (
            <span className="text-[9.5px] sm:text-[11px] text-white/75 line-through font-medium">
              {formatVnd(product.compareAtPriceVnd!)}
            </span>
          )}
          <span className="text-[12px] max-[359px]:text-[11.5px] sm:text-[13.5px] lg:text-[15px] font-bold text-[#ff9aa8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
            {formatVnd(product.priceVnd)}
          </span>
        </div>
      )}

      <div className="mt-1.5 max-[359px]:mt-1 sm:mt-2.5 w-full flex flex-col items-center justify-center gap-[5px] sm:gap-[6px] md:flex-row md:gap-2">
        {onOpenDemo ? (
          <button
            type="button"
            onClick={() => onOpenDemo(product)}
            aria-label={`Xem demo ${product.title}`}
            className={`${styles.cardActionFocus} inline-flex items-center justify-center gap-1 sm:gap-1.5 h-[29px] max-[359px]:h-[26px] sm:h-[31px] lg:h-[33px] w-full max-w-[144px] md:w-auto md:max-w-none md:flex-1 px-2.5 lg:px-3 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-xs border border-white/60 text-white text-[11px] max-[359px]:text-[10px] lg:text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer`}
          >
            <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
            <span>Xem demo</span>
          </button>
        ) : (
          <Link
            href={product.demoUrl || `/templates/${product.slug}`}
            aria-label={`Xem demo ${product.title}`}
            className={`${styles.cardActionFocus} inline-flex items-center justify-center gap-1 sm:gap-1.5 h-[29px] max-[359px]:h-[26px] sm:h-[31px] lg:h-[33px] w-full max-w-[144px] md:w-auto md:max-w-none md:flex-1 px-2.5 lg:px-3 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-xs border border-white/60 text-white text-[11px] max-[359px]:text-[10px] lg:text-[12px] font-semibold whitespace-nowrap transition-colors`}
          >
            <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
            <span>Xem demo</span>
          </Link>
        )}

        {onPrimaryAction ? (
          <button
            type="button"
            disabled={isCreating}
            onClick={() => onPrimaryAction(product)}
            aria-label={`${primaryLabel} ${product.title}`}
            className={`${styles.cardActionFocus} inline-flex items-center justify-center gap-1 sm:gap-1.5 h-[29px] max-[359px]:h-[26px] sm:h-[31px] lg:h-[33px] w-full max-w-[144px] md:w-auto md:max-w-none md:flex-1 px-2.5 lg:px-3 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 disabled:opacity-65 text-white text-[11px] max-[359px]:text-[10px] lg:text-[12px] font-semibold whitespace-nowrap shadow-[0_4px_12px_rgba(250,65,106,0.38)] transition-opacity cursor-pointer`}
          >
            <ShoppingCart className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
            <span>{isCreating ? "Đang tạo..." : primaryLabel}</span>
          </button>
        ) : (
          <Link
            href={primaryHref || `/create?template=${product.slug}`}
            aria-label={`${primaryLabel} ${product.title}`}
            className={`${styles.cardActionFocus} inline-flex items-center justify-center gap-1 sm:gap-1.5 h-[29px] max-[359px]:h-[26px] sm:h-[31px] lg:h-[33px] w-full max-w-[144px] md:w-auto md:max-w-none md:flex-1 px-2.5 lg:px-3 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-[11px] max-[359px]:text-[10px] lg:text-[12px] font-semibold whitespace-nowrap shadow-[0_4px_12px_rgba(250,65,106,0.38)] transition-opacity`}
          >
            <ShoppingCart className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
            <span>{primaryLabel}</span>
          </Link>
        )}
      </div>

      {showGuideLinks && (
        <div className="mt-1 sm:mt-2 flex items-center justify-center gap-2 max-[359px]:gap-1.5 sm:gap-3 text-[10px] max-[359px]:text-[9.5px] sm:text-[11px] text-white/85">
          <Link
            href={product.guideUrl || "/occasions"}
            aria-label={`Hướng dẫn ${product.title}`}
            className={`${styles.cardActionFocus} inline-flex items-center gap-1 py-0.5 rounded-sm hover:text-white transition-colors whitespace-nowrap`}
          >
            <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" aria-hidden="true" />
            <span>Hướng dẫn</span>
          </Link>

          <span className="text-white/35 select-none" aria-hidden="true">
            •
          </span>

          <a
            href={product.videoGuideUrl || "https://youtube.com"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Video HD ${product.title}`}
            className={`${styles.cardActionFocus} inline-flex items-center gap-1 py-0.5 rounded-sm hover:text-white transition-colors whitespace-nowrap`}
          >
            <PlayCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" aria-hidden="true" />
            <span>Video HD</span>
          </a>
        </div>
      )}
    </div>
  );

  return (
    <VerticalScrollPreview
      id={product.id}
      slug={product.slug}
      index={index}
      previewImage={product.previewImage}
      previewVideo={product.previewVideo}
      coverUrl={product.coverUrl}
      fallbackBg={fallbackBg}
      hasTemplateFallback={hasTemplateFallback}
      renderTemplateFallback={() => (
        <IsolatedTemplateFallback slug={product.slug} fallbackCoverUrl={product.coverUrl} />
      )}
      topOverlay={topOverlay}
      bottomOverlay={bottomOverlay}
    />
  );
}
