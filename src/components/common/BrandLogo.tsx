import Link from "next/link";

export type BrandMarkSize = "xs" | "sm" | "md" | "lg" | "xl";
export type BrandMarkSurface = "none" | "white-card" | "pill";

const MARK_SIZE_CLASSES: Record<BrandMarkSize, { box: string; img: string }> = {
  xs: { box: "w-5 h-5 rounded-md p-0.5", img: "h-4 w-4" },
  sm: { box: "w-9 h-9 rounded-xl p-1.5", img: "h-8 w-auto" },
  md: { box: "w-10 h-10 rounded-xl p-1.5", img: "h-9 w-auto" },
  lg: { box: "w-14 h-14 rounded-2xl p-2.5", img: "h-12 w-auto" },
  xl: { box: "w-16 h-16 rounded-3xl p-3", img: "h-14 w-auto" },
};

interface BrandMarkProps {
  size?: BrandMarkSize;
  surface?: BrandMarkSurface;
  alt?: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Reusable Ding Dong Gift monogram mark (/brand/dingdonggift-logo.png).
 */
export function BrandMark({
  size = "md",
  surface = "none",
  alt = "Ding Dong Gift",
  className = "",
  imgClassName = "",
}: BrandMarkProps) {
  const sizing = MARK_SIZE_CLASSES[size];

  if (surface === "none") {
    return (
      <img
        src="/brand/dingdonggift-logo.png"
        alt={alt}
        className={`object-contain shrink-0 select-none ${sizing.img} ${className} ${imgClassName}`.trim()}
      />
    );
  }

  const surfaceClass =
    surface === "pill"
      ? "rounded-full bg-white shadow-xs ring-1 ring-rose-100/80"
      : "bg-white shadow-sm ring-1 ring-rose-100/70";

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${surfaceClass} ${sizing.box} ${className}`.trim()}
    >
      <img
        src="/brand/dingdonggift-logo.png"
        alt={alt}
        className={`w-full h-full object-contain ${imgClassName}`.trim()}
      />
    </span>
  );
}

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md";
  theme?: "light" | "dark";
  className?: string;
  showWordmark?: boolean;
}

/**
 * Full brand lockup combining the Ding Dong Gift logo mark and wordmark.
 */
export function BrandLogo({
  href = "/",
  size = "md",
  theme = "light",
  className = "",
  showWordmark = true,
}: BrandLogoProps) {
  const isDark = theme === "dark";
  const textClass =
    size === "sm"
      ? isDark
        ? "text-lg font-bold text-white tracking-tight"
        : "text-lg font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent tracking-tight"
      : isDark
      ? "text-xl font-bold text-white tracking-tight"
      : "text-xl font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent tracking-tight";

  const content = (
    <>
      <BrandMark
        size={size === "sm" ? "sm" : "md"}
        surface={isDark ? "white-card" : "none"}
        alt={showWordmark ? "" : "Ding Dong Gift"}
        imgClassName="group-hover:scale-105 transition-transform"
      />
      {showWordmark && <span className={textClass}>Ding Dong Gift</span>}
    </>
  );

  if (!href) {
    return (
      <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`.trim()}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 group shrink-0 ${className}`.trim()}
    >
      {content}
    </Link>
  );
}
