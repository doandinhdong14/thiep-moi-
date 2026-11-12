"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Gift,
  Heart,
  MailOpen,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  ZoomIn,
  X,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { formatVnd, type CardPlanOption, type GiftWrapOption } from "@/lib/shop/types";
import { useShopCart } from "./ShopCartContext";
import ProductCard, { SerializedShopProduct } from "./ProductCard";
import GiftPersonalizationWizard, {
  WizardSavedResult,
} from "./GiftPersonalizationWizard";
import ShopShell from "./ShopShell";

export interface FullDetailProduct extends SerializedShopProduct {
  description: string | null;
  materialCare: string | null;
  giftNote: string | null;
  boxSpecs: Record<string, string>;
  comboItems: string[];
  eligibleTemplateIds: string[];
  defaultTemplateId: string | null;
}

interface ProductDetailClientProps {
  product: FullDetailProduct;
  related: SerializedShopProduct[];
  defaultTemplateSlug: string;
  cardPlans: CardPlanOption[];
  giftWrapOptions: GiftWrapOption[];
}

export default function ProductDetailClient({
  product,
  related,
  defaultTemplateSlug,
  cardPlans,
  giftWrapOptions,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, wishlistIds, toggleWishlist } = useShopCart();

  const initialVariant =
    product.variants.find((v) => v.isDefault && v.inStock) ||
    product.variants.find((v) => v.inStock) ||
    product.variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariant?.id || "",
  );
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || initialVariant;

  const allImages = Array.from(
    new Set([
      ...(selectedVariant?.imageUrl ? [selectedVariant.imageUrl] : []),
      ...product.images,
    ]),
  ).filter(Boolean);
  if (allImages.length === 0) {
    allImages.push("/assets/shop/scarf-suong-mai.svg");
  }

  const [activeImage, setActiveImage] = useState<string>(allImages[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [attachedCard, setAttachedCard] = useState<WizardSavedResult | null>(null);

  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string>("desc");
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);

  const heroImgRef = useRef<HTMLImageElement | null>(null);
  const primaryCtaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedVariant?.imageUrl) {
      setActiveImage(selectedVariant.imageUrl);
    }
    if (selectedVariant && quantity > Math.max(1, selectedVariant.availableStock)) {
      setQuantity(Math.max(1, selectedVariant.availableStock));
    }
  }, [selectedVariantId, selectedVariant, quantity]);

  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        setShowStickyMobileBar(!entries[0].isIntersecting);
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isWishlisted = wishlistIds.includes(product.id);
  const maxQty = Math.max(1, selectedVariant?.availableStock ?? 0);
  const canBuy = Boolean(selectedVariant && selectedVariant.inStock);

  const selectedPlanFee = attachedCard
    ? cardPlans.find((p) => p.code === attachedCard.cardPlanCode)?.priceVnd || 0
    : 0;
  const selectedWrapFee = attachedCard
    ? giftWrapOptions.find((w) => w.code === attachedCard.giftWrapCode)?.priceVnd || 0
    : 0;
  const unitDisplayPrice = (selectedVariant?.priceVnd ?? product.minPriceVnd) + selectedPlanFee + selectedWrapFee;

  const handleAddToCart = async (goCheckout = false) => {
    if (!selectedVariant || !selectedVariant.inStock) return;
    setActionError(null);
    if (goCheckout) setBuyingNow(true);
    else setAdding(true);

    const res = await addToCart({
      variantId: selectedVariant.id,
      quantity,
      customizationId: attachedCard?.customizationId ?? null,
      giftWrapCode: attachedCard?.giftWrapCode || "NONE",
      flyFromEl: heroImgRef.current,
      flyImageUrl: activeImage,
      openDrawerAfter: !goCheckout,
    });

    setAdding(false);
    setBuyingNow(false);

    if (!res.ok) {
      setActionError(res.error || "Không thể thêm vào giỏ quà.");
      return;
    }

    if (goCheckout) {
      router.push("/qua-tang/thanh-toan");
    }
  };

  return (
    <ShopShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 pb-24 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#7C6368] flex flex-wrap items-center gap-1.5">
          <Link href="/qua-tang" className="hover:text-[#FF5C8D]">
            Cửa hàng quà
          </Link>
          <span>/</span>
          <Link
            href={`/qua-tang/danh-muc/${product.category.slug}`}
            className="hover:text-[#FF5C8D]"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#3E2A2D]">{product.name}</span>
        </nav>

        {/* Main 2-Col PDP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: GALLERY */}
          <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-20">
            <div className="relative aspect-[4/5] rounded-3xl bg-white border border-[#F2DCE2] overflow-hidden shadow-xs group">
              <img
                ref={heroImgRef}
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Phóng to ảnh sản phẩm"
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-[#F2DCE2] flex items-center justify-center text-[#3E2A2D] shadow-sm"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {product.cardIncluded && (
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 border border-[#F2DCE2] text-xs font-bold text-[#D94575] inline-flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5C8D]" />
                  Tặng kèm 1 thiệp QR riêng/hộp
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto ddg-no-scrollbar pb-1">
                {allImages.map((imgUrl) => (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 bg-white ${
                      activeImage === imgUrl
                        ? "border-[#FF5C8D]"
                        : "border-[#F2DCE2] hover:border-[#E892A9]"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: BUY PANEL & GIFT CARD CUSTOMIZATION */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#D94575]">
                    {product.category.name}
                  </span>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#3E2A2D] mt-1">
                    {product.name}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Lưu vào yêu thích"
                  className="w-11 h-11 rounded-full bg-white border border-[#F2DCE2] flex items-center justify-center text-[#D94575] shrink-0"
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? "fill-[#FF5C8D] text-[#FF5C8D]" : ""}`}
                  />
                </button>
              </div>

              {product.subtitle && (
                <p className="text-sm text-[#7C6368]">{product.subtitle}</p>
              )}

              <div className="pt-2 flex flex-wrap items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#FF5C8D]">
                  {formatVnd(unitDisplayPrice)}
                </span>
                {selectedVariant?.compareAtVnd &&
                  selectedVariant.compareAtVnd > selectedVariant.priceVnd && (
                    <span className="text-sm text-[#9A7B81] line-through">
                      {formatVnd(selectedVariant.compareAtVnd)}
                    </span>
                  )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    canBuy
                      ? selectedVariant?.lowStock
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {canBuy
                    ? `Còn ${selectedVariant?.availableStock} hộp sẵn sàng`
                    : "Tạm hết hàng"}
                </span>
              </div>
            </div>

            {/* Combo Breakdown */}
            {product.comboItems.length > 0 && (
              <div className="rounded-2xl bg-white border border-[#F2DCE2] p-4 space-y-2">
                <p className="text-xs font-bold text-[#3E2A2D]">Bên trong hộp quà gồm:</p>
                <ul className="space-y-1 text-xs text-[#7C6368]">
                  {product.comboItems.map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#FF5C8D] shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variants Selector */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#3E2A2D]">
                Chọn phiên bản / màu sắc:{" "}
                <span className="font-normal text-[#7C6368]">
                  {selectedVariant?.name} (SKU: {selectedVariant?.sku})
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active = v.id === selectedVariant?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all min-h-[44px] ${
                        active
                          ? "border-[#FF5C8D] bg-white ring-2 ring-[#FF5C8D]/20 text-[#3E2A2D]"
                          : "border-[#F2DCE2] bg-white/80 text-[#3E2A2D] hover:border-[#E892A9]"
                      } ${!v.inStock ? "opacity-55" : ""}`}
                    >
                      {v.colorHex && (
                        <span
                          className="w-4 h-4 rounded-full border border-[#D4B8C0] shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{v.name}</span>
                      {!v.inStock && (
                        <span className="text-[10px] text-rose-600">(Hết)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PERSONALIZE GIFT CARD BLOCK */}
            {product.cardIncluded && (
              <div className="rounded-3xl bg-gradient-to-br from-[#FFFFFF] to-[#FFF1E7]/70 border-2 border-[#F2DCE2] p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-[#FDECF0] text-[#FF5C8D] flex items-center justify-center shrink-0">
                      <MailOpen className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="font-serif font-bold text-base text-[#3E2A2D]">
                        Thiệp online kèm hộp quà ♡
                      </h2>
                      <p className="text-xs text-[#7C6368]">
                        {attachedCard
                          ? "Đã cá nhân hóa thiệp & gắn vào hộp quà này"
                          : "Chọn mẫu thiệp 3D, nhạc nền & lời chúc cho người nhận quét QR"}
                      </p>
                    </div>
                  </div>
                </div>

                {attachedCard ? (
                  <div className="rounded-2xl bg-white border border-[#F2DCE2] p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={attachedCard.previewImageUrl}
                        alt={attachedCard.templateTitle}
                        className="w-14 h-11 rounded-xl object-cover border border-[#F2DCE2] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#3E2A2D] truncate">
                          {attachedCard.templateTitle}
                        </p>
                        <p className="text-[11px] text-[#7C6368] truncate">
                          Từ {attachedCard.senderName} → {attachedCard.recipientName} •{" "}
                          {attachedCard.photoUrls.length} ảnh
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWizardOpen(true)}
                      className="ddg-shop-btn-secondary px-3.5 py-2 text-xs font-semibold shrink-0"
                    >
                      Sửa thiệp
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setWizardOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#3E2A2D] hover:bg-[#52393D] text-white text-xs font-semibold transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5C8D]" />
                      <span>Chọn mẫu &amp; Viết thiệp ngay (4 bước)</span>
                    </button>
                    <span className="text-[11px] text-[#7C6368]">
                      Hoặc chỉnh sửa lại sau trong giỏ hàng
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-[#7C6368]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF5C8D] shrink-0" />
                  <span>
                    Mua nhiều hộp vẫn tạo được QR &amp; lời chúc riêng từng hộp.
                  </span>
                </div>
              </div>
            )}

            {/* Quantity & Action CTAs */}
            <div ref={primaryCtaRef} className="space-y-3 pt-1">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#3E2A2D]">Số lượng hộp:</span>
                <div className="inline-flex items-center rounded-full bg-white border border-[#F2DCE2] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Giảm số lượng"
                    className="w-9 h-9 rounded-full hover:bg-[#FDECF0] flex items-center justify-center disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-[#3E2A2D]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={!canBuy || quantity >= maxQty}
                    aria-label="Tăng số lượng"
                    className="w-9 h-9 rounded-full hover:bg-[#FDECF0] flex items-center justify-center disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {quantity > 1 && (
                  <span className="text-xs text-[#D94575] font-medium">
                    Nhận {quantity} mã QR độc lập
                  </span>
                )}
              </div>

              {actionError && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  {actionError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={!canBuy || adding || buyingNow}
                  className="ddg-shop-btn-secondary py-3.5 px-5 text-sm font-bold inline-flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4 text-[#FF5C8D]" />
                  <span>{adding ? "Đang thêm..." : canBuy ? "Thêm vào giỏ quà" : "Tạm hết hàng"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={!canBuy || adding || buyingNow}
                  className="ddg-shop-btn-primary py-3.5 px-5 text-sm font-bold inline-flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{buyingNow ? "Đang chuyển..." : "Mua ngay"}</span>
                </button>
              </div>
            </div>

            {/* Accordion Specs */}
            <div className="space-y-2 pt-2">
              {[
                {
                  key: "desc",
                  title: "Mô tả & Cảm hứng hộp quà",
                  content:
                    product.description ||
                    product.shortDesc ||
                    "Món quà được chuẩn bị tinh tế kèm thiệp QR độc bản.",
                },
                {
                  key: "care",
                  title: "Chất liệu, Kích thước & Bảo quản",
                  content: [
                    product.materialCare,
                    ...Object.entries(product.boxSpecs).map(
                      ([k, val]) => `${k}: ${val}`,
                    ),
                  ]
                    .filter(Boolean)
                    .join(" • ") || "Đóng gói chuẩn hộp quà DingDongGift.",
                },
                {
                  key: "qr",
                  title: "Cách gắn thiệp QR & Giao nhận",
                  content:
                    product.giftNote ||
                    "Thiệp QR chỉ tính thời hạn kể từ lần đầu tiên người nhận quét QR nhấn Mở thiệp.",
                },
              ].map((acc) => {
                const isOpen = openAccordion === acc.key;
                return (
                  <div
                    key={acc.key}
                    className="rounded-2xl bg-white border border-[#F2DCE2] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(isOpen ? "" : acc.key)}
                      aria-expanded={isOpen}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-bold text-[#3E2A2D]"
                    >
                      <span>{acc.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#FF5C8D] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 text-xs text-[#7C6368] leading-relaxed border-t border-[#F9EEF1] pt-2.5">
                        {acc.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cross-sell Related */}
        {related.length > 0 && (
          <section className="pt-8 border-t border-[#F2DCE2] space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#3E2A2D]">
                Có thể bạn muốn gửi kèm
              </h2>
              <Link
                href="/qua-tang/tat-ca"
                className="text-xs font-semibold text-[#D94575] hover:underline"
              >
                Xem thêm quà khác →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Bottom CTA (only after primary CTA leaves viewport) */}
      {showStickyMobileBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-[#F2DCE2] px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="min-w-0">
            <p className="text-[11px] text-[#7C6368] truncate">{product.name}</p>
            <p className="text-sm font-bold text-[#FF5C8D]">
              {formatVnd(unitDisplayPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAddToCart(false)}
            disabled={!canBuy || adding}
            className="ddg-shop-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{canBuy ? "Thêm vào giỏ" : "Hết hàng"}</span>
          </button>
        </div>
      )}

      {/* Zoom Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng xem ảnh"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-[#3E2A2D] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={activeImage}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain bg-white"
          />
        </div>
      )}

      {/* 4-Step Card Personalization Wizard */}
      <GiftPersonalizationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(result) => setAttachedCard(result)}
        productName={product.name}
        eligibleSlugs={product.eligibleTemplateIds}
        defaultTemplateSlug={defaultTemplateSlug}
        cardPlans={cardPlans}
        giftWrapOptions={giftWrapOptions}
        initialData={
          attachedCard
            ? {
                customizationId: attachedCard.customizationId,
                templateSlug: attachedCard.templateSlug,
                cardPlanCode: attachedCard.cardPlanCode,
                giftWrapCode: attachedCard.giftWrapCode,
                recipientName: attachedCard.recipientName,
                senderName: attachedCard.senderName,
                title: attachedCard.title,
                message: attachedCard.message,
                occasion: attachedCard.occasion,
                musicTrackId: attachedCard.musicTrackId,
                photoUrls: attachedCard.photoUrls,
              }
            : undefined
        }
      />
    </ShopShell>
  );
}

