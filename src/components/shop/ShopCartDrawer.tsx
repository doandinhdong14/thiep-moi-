"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Gift,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  PackageCheck,
} from "lucide-react";
import { formatVnd } from "@/lib/shop/types";
import { useShopCart } from "./ShopCartContext";
import ShopOrdersPanel from "./ShopOrdersPanel";

export default function ShopCartDrawer() {
  const {
    cart,
    settings,
    drawerOpen,
    drawerTab,
    undoToast,
    setDrawerTab,
    closeDrawer,
    updateCartItem,
    removeCartItem,
    undoRemoveItem,
    dismissUndoToast,
  } = useShopCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [drawerOpen, closeDrawer]);

  const handleQty = async (itemId: string, nextQty: number) => {
    if (nextQty < 1) return;
    setErrorMsg(null);
    setBusyId(itemId);
    const res = await updateCartItem(itemId, { quantity: nextQty });
    if (!res.ok) {
      setErrorMsg(res.error || "Không đủ tồn kho.");
    }
    setBusyId(null);
  };

  if (!drawerOpen) {
    if (!undoToast) return null;
    return (
      <div className="ddg-shop fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl bg-[#3E2A2D] text-white px-4 py-3 shadow-xl flex items-center gap-3">
        <span className="text-xs leading-relaxed">
          Đã xóa <strong>{undoToast.item.productName}</strong> khỏi giỏ.
        </span>
        <button
          onClick={undoRemoveItem}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF5C8D] text-white text-xs font-semibold shrink-0 hover:opacity-95"
        >
          <RotateCcw className="w-3 h-3" />
          Hoàn tác
        </button>
        <button
          onClick={dismissUndoToast}
          aria-label="Đóng thông báo"
          className="text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const threshold = cart?.freeshipThresholdVnd ?? settings?.shipping.freeshipThresholdVnd ?? null;
  const subtotal = cart?.subtotalVnd ?? 0;
  const freeshipPct =
    threshold && threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : null;

  return (
    <div className="ddg-shop fixed inset-0 z-[60] flex justify-end" role="presentation">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#3E2A2D]/40 backdrop-blur-[2px] transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ quà của bạn"
        className="relative z-10 w-full max-w-[440px] bg-[#FFF9F5] h-full shadow-2xl flex flex-col border-l border-[#F2DCE2]"
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-[#F2DCE2] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[#FDECF0] text-[#FF5C8D] flex items-center justify-center">
                {drawerTab === "orders" ? (
                  <PackageCheck className="w-4 h-4" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
              </span>
              <div>
                <h2 className="font-serif font-bold text-base text-[#3E2A2D]">
                  {drawerTab === "orders" ? "Đơn hàng của tôi" : "Giỏ quà của bạn"}
                </h2>
                <p className="text-xs text-[#7C6368]">
                  {drawerTab === "orders"
                    ? "Theo dõi đơn quà tặng & thiệp mời"
                    : cart?.boxCount
                      ? `${cart.boxCount} hộp quà kèm thiệp QR`
                      : "Chưa có hộp quà nào"}
                </p>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              onClick={closeDrawer}
              aria-label="Đóng giỏ quà"
              className="w-10 h-10 rounded-full hover:bg-[#FDECF0] text-[#3E2A2D] flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Integrated Segmented Tabs: Giỏ quà | Đơn hàng của tôi */}
          <div
            role="tablist"
            aria-label="Chuyển đổi giữa giỏ quà và đơn hàng"
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FFF5F7] border border-[#F2DCE2]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === "cart"}
              onClick={() => setDrawerTab("cart")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                drawerTab === "cart"
                  ? "bg-white text-[#3E2A2D] shadow-xs border border-[#F2DCE2]"
                  : "text-[#7C6368] hover:text-[#3E2A2D]"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#FF5C8D]" />
              <span>Giỏ quà</span>
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5C8D] text-white text-[10px] font-bold inline-flex items-center justify-center">
                {cart?.itemCount || 0}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === "orders"}
              onClick={() => setDrawerTab("orders")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                drawerTab === "orders"
                  ? "bg-white text-[#3E2A2D] shadow-xs border border-[#F2DCE2]"
                  : "text-[#7C6368] hover:text-[#3E2A2D]"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#FF5C8D]" />
              <span>Đơn hàng của tôi</span>
            </button>
          </div>
        </div>

        {/* Freeship Bar (only on cart tab & if admin configured freeshipThresholdVnd) */}
        {drawerTab === "cart" && threshold && threshold > 0 && cart && cart.items.length > 0 && (
          <div className="px-5 py-2.5 bg-[#FFF1E7] border-b border-[#F2DCE2]">
            <div className="flex items-center justify-between text-xs font-medium text-[#3E2A2D] mb-1.5">
              {cart.missingForFreeshipVnd && cart.missingForFreeshipVnd > 0 ? (
                <span>
                  Thêm <strong>{formatVnd(cart.missingForFreeshipVnd)}</strong> để được miễn phí vận chuyển
                </span>
              ) : (
                <span className="text-emerald-700 inline-flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đơn hàng đạt ưu đãi miễn phí vận chuyển
                </span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-white overflow-hidden border border-[#F2DCE2]">
              <div
                className="h-full bg-[#FF5C8D] transition-all duration-300"
                style={{ width: `${freeshipPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Undo banner inside drawer */}
        {drawerTab === "cart" && undoToast && (
          <div className="mx-5 mt-3 rounded-xl bg-[#3E2A2D] text-white px-3.5 py-2.5 text-xs flex items-center justify-between gap-2">
            <span>Đã xóa &ldquo;{undoToast.item.productName}&rdquo;</span>
            <button
              onClick={undoRemoveItem}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF5C8D] font-semibold shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Hoàn tác
            </button>
          </div>
        )}

        {drawerTab === "cart" && errorMsg && (
          <div className="mx-5 mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {drawerTab === "orders" ? (
            <ShopOrdersPanel variant="drawer" onNavigate={closeDrawer} />
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FDECF0] text-[#FF5C8D] mx-auto flex items-center justify-center">
                <Gift className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="font-serif font-bold text-lg text-[#3E2A2D]">
                  Giỏ quà đang đợi món quà đầu tiên
                </p>
                <p className="text-xs text-[#7C6368] leading-relaxed">
                  Mỗi hộp quà tại DingDong đều đi kèm một mẫu thiệp online có nhạc &amp; mã QR riêng cho người nhận mở thư.
                </p>
              </div>
              <Link
                href="/qua-tang/tat-ca"
                onClick={closeDrawer}
                className="ddg-shop-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold"
              >
                Khám phá quà tặng
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#F2DCE2] p-3.5 space-y-3 shadow-xs"
              >
                <div className="flex gap-3">
                  <Link
                    href={`/qua-tang/san-pham/${item.productSlug}`}
                    onClick={closeDrawer}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-[#FFF9F5] border border-[#F2DCE2] shrink-0"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/qua-tang/san-pham/${item.productSlug}`}
                        onClick={closeDrawer}
                        className="font-semibold text-sm text-[#3E2A2D] hover:text-[#FF5C8D] line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        disabled={busyId === item.id}
                        aria-label={`Xóa ${item.productName}`}
                        className="p-1.5 rounded-lg text-[#7C6368] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#7C6368] mt-0.5">{item.variantName}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="inline-flex items-center rounded-full border border-[#F2DCE2] bg-[#FFF9F5]">
                        <button
                          onClick={() => handleQty(item.id, item.quantity - 1)}
                          disabled={busyId === item.id || item.quantity <= 1}
                          aria-label="Giảm số lượng"
                          className="w-8 h-8 flex items-center justify-center text-[#3E2A2D] disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#3E2A2D]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQty(item.id, item.quantity + 1)}
                          disabled={busyId === item.id || item.quantity >= item.availableStock}
                          aria-label="Tăng số lượng"
                          className="w-8 h-8 flex items-center justify-center text-[#3E2A2D] disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-[#3E2A2D]">
                        {formatVnd(item.lineSubtotalVnd)}
                      </span>
                    </div>
                  </div>
                </div>

                {!item.isStockEnough && (
                  <p className="text-xs text-rose-600 font-medium bg-rose-50 rounded-lg px-2.5 py-1.5">
                    Hiện chỉ còn {item.availableStock} hộp khả dụng trong kho.
                  </p>
                )}

                {/* Per-box Gift Card badge */}
                {item.cardIncluded && (
                  <div className="rounded-xl bg-[#FFF9F5] border border-[#F2DCE2] p-2.5 space-y-1.5">
                    {item.units.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-[#FF5C8D] shrink-0" />
                          <span className="font-medium text-[#3E2A2D] truncate">
                            {item.quantity > 1 ? `Hộp #${u.unitIndex}: ` : "Thiệp QR: "}
                            {u.customization
                              ? `${u.customization.templateTitle} (${u.customization.recipientName || "Người nhận"})`
                              : "Dùng mẫu thiệp gợi ý của shop"}
                          </span>
                        </div>
                        <Link
                          href="/qua-tang/gio-hang"
                          onClick={closeDrawer}
                          className="text-[11px] font-semibold text-[#D94575] hover:underline shrink-0"
                        >
                          Sửa thiệp
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Sticky Summary */}
        {drawerTab === "cart" && cart && cart.items.length > 0 && (
          <div className="p-5 bg-white border-t border-[#F2DCE2] space-y-3">
            <div className="space-y-1 text-xs text-[#7C6368]">
              <div className="flex justify-between">
                <span>Tạm tính quà ({cart.itemCount} món)</span>
                <span className="font-semibold text-[#3E2A2D]">{formatVnd(cart.subtotalVnd)}</span>
              </div>
              {cart.giftWrapFeeVnd > 0 && (
                <div className="flex justify-between">
                  <span>Phí gói quà nâng cao</span>
                  <span className="font-semibold text-[#3E2A2D]">
                    {formatVnd(cart.giftWrapFeeVnd)}
                  </span>
                </div>
              )}
              {cart.giftCardFeeVnd > 0 && (
                <div className="flex justify-between">
                  <span>Gói lưu giữ thiệp nâng cao</span>
                  <span className="font-semibold text-[#3E2A2D]">
                    {formatVnd(cart.giftCardFeeVnd)}
                  </span>
                </div>
              )}
              {cart.discountVnd > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Ưu đãi mã {cart.promoCode}</span>
                  <span>-{formatVnd(cart.discountVnd)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#3E2A2D] pt-2 border-t border-[#F2DCE2]">
                <span>Tổng trước phí ship</span>
                <span className="text-[#FF5C8D]">
                  {formatVnd(cart.totalBeforeShippingVnd)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/qua-tang/gio-hang"
                onClick={closeDrawer}
                className="ddg-shop-btn-secondary py-3 px-4 text-center text-xs font-semibold flex items-center justify-center"
              >
                Xem giỏ chi tiết
              </Link>
              <Link
                href="/qua-tang/thanh-toan"
                onClick={closeDrawer}
                className="ddg-shop-btn-primary py-3 px-4 text-center text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                Đặt quà ngay
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

