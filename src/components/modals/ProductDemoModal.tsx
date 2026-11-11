"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Eye, Pencil, Loader2 } from "lucide-react";
import { BrandMark } from "@/components/common/BrandLogo";
import ModalShell from "./ModalShell";
import { CatalogProduct } from "@/data/catalogData";
import { generateQrDataUrl } from "@/lib/qr";

interface ProductDemoModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDemoModal({
  product,
  isOpen,
  onClose,
}: ProductDemoModalProps) {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [customizing, setCustomizing] = useState(false);

  const handleCustomize = async () => {
    if (customizing || !product) return;
    setCustomizing(true);
    try {
      const res = await fetch("/api/v1/invitations/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug: product.slug }),
      });
      const data = await res.json();
      if (res.ok && data.data?.editorUrl) {
        onClose();
        router.push(data.data.editorUrl);
        return;
      }
    } catch (err) {
      console.error("Customize draft error:", err);
    } finally {
      setCustomizing(false);
    }
    // Fallback
    onClose();
    router.push(`/create?template=${product.slug}`);
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  const isFree = !product?.price || product.price === 0;

  // Generate glowing red QR Code on black background
  useEffect(() => {
    if (!product || !isOpen) {
      setQrCodeUrl("");
      setIframeLoading(true);
      return;
    }

    setIframeLoading(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://dingdonggift.vn";
    const absoluteDemoUrl = product.demoUrl.startsWith("http")
      ? product.demoUrl
      : `${origin}${product.demoUrl}`;

    generateQrDataUrl(absoluteDemoUrl, {
      width: 220,
      margin: 1,
      darkColor: "#ff2a5f",
      lightColor: "#050508",
    })
      .then((dataUrl) => setQrCodeUrl(dataUrl))
      .catch((err) => console.error("Error generating QR:", err));
  }, [product, isOpen]);

  if (!product) return null;

  const embedUrl = product.demoUrl
    ? `${product.demoUrl}${product.demoUrl.includes("?") ? "&" : "?"}embed=true`
    : "";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="product-demo-modal-title"
      maxWidthClass="md:max-w-[780px]"
      fullScreenMobile={true}
      className="md:h-[860px] md:max-h-[calc(100dvh-48px)] p-0"
    >
      {/* 1. Header: Fixed row at top */}
      <div className="shrink-0 flex items-center justify-between px-5 md:px-6 h-[50px] md:h-[58px] border-b border-slate-100 bg-white">
        <h2
          id="product-demo-modal-title"
          className="text-[15px] md:text-base font-bold text-slate-900 tracking-tight"
        >
          Xem mẫu sản phẩm
        </h2>

        <button
          onClick={onClose}
          aria-label="Đóng popup xem mẫu"
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Scroll Area: Single scroll container for all modal contents */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col md:grid md:grid-cols-[300px_minmax(0,1fr)] md:gap-6 px-5 py-4 sm:px-6 md:px-6 lg:px-10 md:pt-6 md:pb-10">
          {/* Left Column / Top (Mobile): Preview Frame */}
          <div className="w-full flex flex-col items-center justify-center mb-5 md:mb-0 md:w-[300px] md:self-center">
            <div className="relative w-full max-w-[284px] aspect-[9/16] md:w-[300px] md:h-[600px] md:aspect-auto md:max-w-none bg-black rounded-[24px] md:rounded-[30px] border-2 md:border-[5px] border-slate-900 shadow-md md:shadow-[0_12px_32px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col">
              {/* Phone Screen Viewport */}
              <div className="relative flex-1 w-full h-full overflow-hidden">
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-xs gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#fa416a]" />
                    <span>Đang tải xem trước...</span>
                  </div>
                )}

                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={`Xem mẫu ${product.title}`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={() => setIframeLoading(false)}
                    className="w-full h-full border-0 select-none overflow-y-auto block"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white">
                    <img
                      src={product.coverImage}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-xl mb-3"
                    />
                    <p className="text-xs text-slate-400">Mẫu đang được cập nhật xem trước trực tiếp.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column / Bottom (Mobile): Info, Price, Buttons, QR */}
          <div className="w-full min-w-0 flex flex-col">
            {/* Title */}
            <h3 className="text-lg md:text-[20px] font-bold text-slate-900 leading-snug break-words">
              {product.title}
            </h3>

            {/* Specs Information Box */}
            <div className="mt-3.5 md:mt-4 bg-[#f8f9fa] border border-slate-100 rounded-[12px] md:rounded-[14px] p-3 md:p-4 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#e93459] shrink-0 w-[68px] md:w-[86px]">
                  Thiết kế:
                </span>
                <span className="text-slate-600 leading-relaxed flex-1 min-w-0 break-words">
                  {product.specs.design}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#e93459] shrink-0 w-[68px] md:w-[86px]">
                  Thao tác:
                </span>
                <span className="text-slate-600 leading-relaxed flex-1 min-w-0 break-words">
                  {product.specs.interaction}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#e93459] shrink-0 w-[68px] md:w-[86px]">
                  Chia sẻ:
                </span>
                <span className="text-slate-600 leading-relaxed flex-1 min-w-0 break-words">
                  {product.specs.sharing}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#e93459] shrink-0 w-[68px] md:w-[86px]">
                  Tương thích:
                </span>
                <span className="text-slate-600 leading-relaxed flex-1 min-w-0 break-words">
                  {product.specs.compatibility}
                </span>
              </div>
            </div>

            {/* Price & Discount Badge */}
            <div className="mt-3.5 md:mt-4 flex items-center flex-wrap gap-2.5">
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  {formatVnd(product.compareAtPrice)}
                </span>
              )}
              <span className="text-lg md:text-xl font-bold text-emerald-600">
                {isFree ? "0đ" : formatVnd(product.price)}
              </span>
              {isFree ? (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200">
                  Miễn phí
                </span>
              ) : product.compareAtPrice && product.compareAtPrice > product.price ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200">
                  -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                </span>
              ) : null}
            </div>

            {/* Action Buttons: Secondary (38%) & Primary (62%) */}
            <div className="mt-4 md:mt-5 flex items-center gap-2 w-full">
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[38%] shrink-0 h-11 md:h-[36px] px-2 rounded-[9px] border border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50/50 text-[#e93459] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#e93459]" />
                <span className="truncate">Xem trực tiếp</span>
              </a>

              <button
                type="button"
                onClick={handleCustomize}
                disabled={customizing}
                className="flex-1 h-11 md:h-[36px] px-3 rounded-[9px] bg-gradient-to-r from-[#ff4d68] to-[#e93459] hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 transition-all disabled:opacity-60"
              >
                {customizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
                <span className="truncate">{customizing ? "Đang chuẩn bị..." : "Tùy chỉnh ngay"}</span>
              </button>
            </div>

            {/* QR Section: Centered vertical container */}
            <div className="mt-5 md:mt-6 flex flex-col items-center w-full pb-8 md:pb-0">
              <div className="w-[200px] h-[322px] bg-white rounded-[16px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-3.5 flex flex-col items-center justify-between">
                {/* Polaroid QR frame */}
                <div className="relative w-[172px] aspect-square bg-[#0a0a0f] rounded-xl overflow-hidden p-2 flex items-center justify-center border border-slate-900 mt-0.5">
                  {/* Red Washi Tape Top-Left */}
                  <div className="absolute -top-1.5 -left-2 w-7 h-3.5 bg-rose-500/85 -rotate-35 shadow-xs z-10 pointer-events-none" />
                  {/* Red Washi Tape Bottom-Right */}
                  <div className="absolute -bottom-1.5 -right-2 w-7 h-3.5 bg-rose-500/85 -rotate-35 shadow-xs z-10 pointer-events-none" />

                  {/* Character cute doodle accents */}
                  <span className="absolute top-1 right-1 text-[10px] select-none pointer-events-none">🐾</span>
                  <span className="absolute bottom-1 left-1 text-[10px] select-none pointer-events-none">🐶</span>

                  {/* Heart Glowing QR Code */}
                  {qrCodeUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={qrCodeUrl}
                        alt={`Mã QR xem mẫu ${product.title}`}
                        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,42,95,0.6)]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center shadow-xs">
                          <BrandMark size="xs" alt="" className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 mb-0.5 select-none">
                  <BrandMark size="xs" surface="pill" alt="" className="w-4 h-4 p-0.5" />
                  <span className="text-[10px] text-slate-400 font-mono">Ding Dong Gift</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2.5 font-medium text-center">
                Quét mã QR để xem trên điện thoại
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
