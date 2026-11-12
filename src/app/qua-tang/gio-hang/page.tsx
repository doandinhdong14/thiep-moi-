"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Copy,
  Gift,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { useShopCart } from "@/components/shop/ShopCartContext";
import ShopOrdersPanel from "@/components/shop/ShopOrdersPanel";
import GiftPersonalizationWizard, {
  type WizardSavedResult,
} from "@/components/shop/GiftPersonalizationWizard";
import { formatVnd } from "@/lib/shop/types";
import type { CartItemView, CartUnitView } from "@/lib/shop/cart";

export default function ShopCartPage() {
  const {
    cart,
    settings,
    loading,
    updateCartItem,
    removeCartItem,
    applyPromoCode,
  } = useShopCart();

  const [activeTab, setActiveTab] = useState<"cart" | "orders">("cart");
  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<{
    item: CartItemView;
    unit: CartUnitView;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "orders") {
        setActiveTab("orders");
      }
    }
  }, []);

  const handleQty = async (item: CartItemView, nextQty: number) => {
    setBusyId(item.id);
    if (nextQty <= 0) {
      await removeCartItem(item.id);
    } else {
      await updateCartItem(item.id, { quantity: nextQty });
    }
    setBusyId(null);
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await applyPromoCode(promoInput.trim() || null);
    setPromoFeedback(res.message || (res.ok ? "Đã áp dụng mã ưu đãi." : "Mã không hợp lệ."));
  };

  const handleWizardComplete = async (res: WizardSavedResult) => {
    if (!editingTarget) return;
    setBusyId(editingTarget.item.id);
    await updateCartItem(editingTarget.item.id, {
      unitIndex: editingTarget.unit.unitIndex,
      customizationId: res.customizationId,
      giftWrapCode: res.giftWrapCode,
    });
    setBusyId(null);
    setEditingTarget(null);
  };

  const items = cart?.items || [];
  const freeshipThreshold = cart?.freeshipThresholdVnd;
  const freeshipProgress =
    freeshipThreshold && freeshipThreshold > 0
      ? Math.min(100, Math.round(((cart?.subtotalVnd || 0) / freeshipThreshold) * 100))
      : 0;

  return (
    <ShopShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <nav className="text-xs text-[#6E555A] mb-1.5 flex items-center gap-1.5">
              <Link href="/qua-tang" className="hover:text-[#B94A67]">
                Cửa hàng quà
              </Link>
              <span>/</span>
              <span className="text-[#3E2A2D] font-medium">Giỏ quà của bạn</span>
            </nav>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D]">
              Giỏ quà &amp; Thiệp đi kèm
            </h1>
            <p className="text-sm text-[#6E555A] mt-1">
              Mỗi hộp quà có thể gắn một mẫu thiệp và lời chúc riêng, in một mã QR độc nhất.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="Giỏ quà và đơn hàng của tôi"
              className="inline-flex p-1 rounded-xl bg-[#FFF5F7] border border-[#F2DCE2]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "cart"}
                onClick={() => setActiveTab("cart")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "cart"
                    ? "bg-white text-[#3E2A2D] shadow-xs border border-[#F2DCE2]"
                    : "text-[#6E555A] hover:text-[#3E2A2D]"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C85A77]" />
                <span>Giỏ quà ({cart?.itemCount || 0})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "orders"}
                onClick={() => setActiveTab("orders")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-white text-[#3E2A2D] shadow-xs border border-[#F2DCE2]"
                    : "text-[#6E555A] hover:text-[#3E2A2D]"
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5 text-[#C85A77]" />
                <span>Đơn hàng của tôi</span>
              </button>
            </div>
            <Link
              href="/qua-tang/tat-ca"
              className="text-sm font-semibold text-[#B94A67] hover:underline"
            >
              + Chọn thêm quà tặng
            </Link>
          </div>
        </div>

        {activeTab === "orders" ? (
          <ShopOrdersPanel variant="page" />
        ) : loading && !cart ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-12 text-center text-[#6E555A]">
            Đang tải giỏ quà...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-10 sm:p-14 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF0F3] text-[#C85A77] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Giỏ quà của bạn đang trống
            </h2>
            <p className="text-sm text-[#6E555A] mt-2">
              Hãy chọn một chiếc khăn ấm, găng tay mềm hay hộp combo để gắn thiệp QR cá nhân hóa.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/qua-tang/tat-ca"
                className="px-6 py-3 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <span>Khám phá quà tặng</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/qua-tang"
                className="px-5 py-3 rounded-xl border border-[#E7C6CF] text-[#3E2A2D] text-sm font-medium hover:bg-[#FFF5F7]"
              >
                Về trang cửa hàng
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left column: Items + Per-box card assignments */}
            <div className="lg:col-span-8 space-y-5">
              {freeshipThreshold && freeshipThreshold > 0 && (
                <div className="bg-white rounded-2xl border border-[#F2DCE2] p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-[#3E2A2D] mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#C85A77]" />
                      {cart?.missingForFreeshipVnd && cart.missingForFreeshipVnd > 0 ? (
                        <>
                          Mua thêm{" "}
                          <strong className="text-[#B94A67]">
                            {formatVnd(cart.missingForFreeshipVnd)}
                          </strong>{" "}
                          để được hỗ trợ miễn phí vận chuyển (nội thành &amp; vùng chuẩn)
                        </>
                      ) : (
                        <span className="text-emerald-700 font-semibold">
                          Đơn hàng của bạn đã đủ điều kiện miễn phí vận chuyển chuẩn!
                        </span>
                      )}
                    </span>
                    <span>{freeshipProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F9E8EC] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D46C88] to-[#B94A67] transition-all duration-300"
                      style={{ width: `${freeshipProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {cart?.hasStockIssues && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Một số sản phẩm không đủ tồn kho hoặc vừa tạm ngừng bán.</strong>
                    <p className="text-xs mt-0.5">
                      Vui lòng điều chỉnh số lượng hoặc xóa mục báo lỗi trước khi thanh toán.
                    </p>
                  </div>
                </div>
              )}

              {items.map((item) => {
                const isBusy = busyId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#F2DCE2] p-4 sm:p-5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href={`/qua-tang/san-pham/${item.productSlug}`}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#FFF6F8] border border-[#F3DFE4] overflow-hidden shrink-0"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/qua-tang/san-pham/${item.productSlug}`}
                              className="font-semibold text-[#3E2A2D] hover:text-[#B94A67] text-base"
                            >
                              {item.productName}
                            </Link>
                            <div className="text-xs text-[#6E555A] mt-0.5 flex flex-wrap items-center gap-2">
                              <span>Phân loại: {item.variantName}</span>
                              <span>• SKU: {item.sku}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-[#3E2A2D]">
                              {formatVnd(item.lineSubtotalVnd)}
                            </div>
                            <div className="text-xs text-[#6E555A]">
                              {formatVnd(item.unitPriceVnd)} / hộp
                            </div>
                          </div>
                        </div>

                        {(!item.isStockEnough || !item.isProductAvailable) && (
                          <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium inline-flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {!item.isProductAvailable
                              ? "Sản phẩm hiện chưa mở bán"
                              : `Chỉ còn ${item.availableStock} hộp khả dụng trong kho`}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-xl border border-[#E7C6CF] bg-[#FFFDFE]">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQty(item, item.quantity - 1)}
                              aria-label="Giảm số lượng"
                              className="w-9 h-9 flex items-center justify-center text-[#3E2A2D] hover:bg-[#FFF0F3] rounded-l-xl disabled:opacity-40"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold text-[#3E2A2D]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isBusy || item.quantity >= item.availableStock}
                              onClick={() => handleQty(item, item.quantity + 1)}
                              aria-label="Tăng số lượng"
                              className="w-9 h-9 flex items-center justify-center text-[#3E2A2D] hover:bg-[#FFF0F3] rounded-r-xl disabled:opacity-40"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => removeCartItem(item.id)}
                            className="text-xs text-[#7D6368] hover:text-rose-600 inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa khỏi giỏ</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Per-unit card personalization & wrap breakdown */}
                    {item.units.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#F7E7EB] space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#5C4448]">
                          <span className="inline-flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-[#C85A77]" />
                            Chi tiết từng hộp quà &amp; mã thiệp QR riêng ({item.units.length} hộp)
                          </span>
                          {item.units.length > 1 && item.units[0]?.customizationId && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setBusyId(item.id);
                                await updateCartItem(item.id, {
                                  customizationId: item.units[0].customizationId,
                                  applyToAllUnits: true,
                                });
                                setBusyId(null);
                              }}
                              className="text-[#B94A67] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Dùng thiệp Hộp #1 cho tất cả</span>
                            </button>
                          )}
                        </div>

                        {item.units.map((unit) => (
                          <div
                            key={unit.id}
                            className="rounded-2xl bg-[#FFF9FA] border border-[#F3DFE4] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-11 h-14 rounded-lg bg-white border border-[#EED5DC] overflow-hidden shrink-0">
                                <img
                                  src={
                                    unit.customization?.previewImageUrl ||
                                    `/previews/${item.defaultTemplateId || "thiep-8"}.webp`
                                  }
                                  alt="Xem trước mẫu thiệp"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 text-xs">
                                <div className="font-semibold text-[#3E2A2D] flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full bg-[#FFE8EE] text-[#B94A67]">
                                    Hộp #{unit.unitIndex}
                                  </span>
                                  <span>
                                    {unit.customization
                                      ? unit.customization.templateTitle
                                      : "Thiệp mặc định của hộp quà"}
                                  </span>
                                </div>
                                {unit.customization ? (
                                  <p className="text-[#5C4448] mt-1 truncate">
                                    Gửi: <strong>{unit.customization.recipientName}</strong> — &ldquo;
                                    {unit.customization.message}&rdquo;
                                  </p>
                                ) : (
                                  <p className="text-[#7D6368] mt-1">
                                    Chưa viết lời chúc riêng — bấm nút để chọn mẫu &amp; cá nhân hóa.
                                  </p>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#6E555A]">
                                  <span>Gói quà:</span>
                                  <select
                                    value={unit.giftWrapCode}
                                    disabled={isBusy}
                                    onChange={async (e) => {
                                      setBusyId(item.id);
                                      await updateCartItem(item.id, {
                                        unitIndex: unit.unitIndex,
                                        giftWrapCode: e.target.value,
                                      });
                                      setBusyId(null);
                                    }}
                                    className="rounded-lg border border-[#E7C6CF] bg-white px-2 py-1 text-[11px] text-[#3E2A2D]"
                                  >
                                    {(settings?.giftWrapOptions || []).map((w) => (
                                      <option key={w.code} value={w.code}>
                                        {w.label}
                                        {w.priceVnd > 0 ? ` (+${formatVnd(w.priceVnd)})` : ""}
                                      </option>
                                    ))}
                                  </select>
                                  {unit.customization && unit.customization.cardUpgradeFeeVnd > 0 && (
                                    <span className="text-[#B94A67]">
                                      • {unit.customization.cardPlanLabel} (+
                                      {formatVnd(unit.customization.cardUpgradeFeeVnd)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setEditingTarget({ item, unit })}
                              className="shrink-0 px-3.5 py-2 rounded-xl border border-[#DFB5C0] bg-white hover:bg-[#FFF0F3] text-xs font-semibold text-[#B94A67] inline-flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{unit.customization ? "Sửa thiệp" : "Viết thiệp hộp này"}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right column: Server Summary & Promo */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
              <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 shadow-sm">
                <h2 className="font-serif text-lg font-bold text-[#3E2A2D] mb-4">
                  Tóm tắt đơn quà
                </h2>

                <form onSubmit={handleApplyPromo} className="mb-4">
                  <label className="text-xs font-medium text-[#5C4448] block mb-1.5">
                    Mã ưu đãi (nếu có)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#8A6D73] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder={cart?.promoCode || "Nhập mã ưu đãi"}
                        className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[#E7C6CF] focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#3E2A2D] text-white text-xs font-semibold hover:bg-[#543A3E]"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {(promoFeedback || cart?.promoMessage) && (
                    <p
                      className={`text-xs mt-1.5 ${
                        cart?.promoValid ? "text-emerald-700" : "text-[#B94A67]"
                      }`}
                    >
                      {promoFeedback || cart?.promoMessage}
                    </p>
                  )}
                </form>

                <dl className="space-y-2.5 text-sm border-t border-[#F6E4E8] pt-4">
                  <div className="flex justify-between text-[#5C4448]">
                    <dt>Tiền hàng ({cart?.boxCount || 0} hộp)</dt>
                    <dd className="font-medium text-[#3E2A2D]">
                      {formatVnd(cart?.subtotalVnd || 0)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-[#5C4448]">
                    <dt>Phí gói quà / hộp cao cấp</dt>
                    <dd className="font-medium text-[#3E2A2D]">
                      {formatVnd(cart?.giftWrapFeeVnd || 0)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-[#5C4448]">
                    <dt>Phí nâng cấp thiệp QR</dt>
                    <dd className="font-medium text-[#3E2A2D]">
                      {formatVnd(cart?.giftCardFeeVnd || 0)}
                    </dd>
                  </div>
                  {(cart?.discountVnd || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <dt>Giảm giá ưu đãi</dt>
                      <dd className="font-semibold">-{formatVnd(cart?.discountVnd || 0)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-[#6E555A]">
                    <dt>Phí vận chuyển</dt>
                    <dd>Tính theo tỉnh thành ở bước tiếp theo</dd>
                  </div>
                  <div className="border-t border-[#F2DCE2] pt-3 flex justify-between items-baseline">
                    <dt className="font-semibold text-[#3E2A2D]">Tạm tính (từ máy chủ)</dt>
                    <dd className="text-xl font-bold text-[#B94A67]">
                      {formatVnd(cart?.totalBeforeShippingVnd || 0)}
                    </dd>
                  </div>
                </dl>

                {settings && !settings.storeOpen ? (
                  <div className="mt-5 p-3 rounded-2xl bg-amber-50 text-amber-900 text-xs">
                    {settings.pauseMessage}
                  </div>
                ) : cart?.hasStockIssues ? (
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full py-3.5 rounded-xl bg-gray-200 text-gray-500 font-semibold text-sm cursor-not-allowed"
                  >
                    Vui lòng xử lý cảnh báo tồn kho trước
                  </button>
                ) : (
                  <Link
                    href="/qua-tang/thanh-toan"
                    className="mt-5 w-full py-3.5 px-4 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <span>Tiến hành đặt quà</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {editingTarget && settings && (
        <GiftPersonalizationWizard
          open={true}
          onClose={() => setEditingTarget(null)}
          onComplete={handleWizardComplete}
          productName={editingTarget.item.productName}
          boxLabel={`Hộp #${editingTarget.unit.unitIndex}`}
          eligibleSlugs={editingTarget.item.eligibleTemplateIds}
          defaultTemplateSlug={
            editingTarget.unit.customization?.templateSlug ||
            editingTarget.item.defaultTemplateId ||
            "thiep-8"
          }
          cardPlans={settings.cardPlans}
          giftWrapOptions={settings.giftWrapOptions}
          initialData={
            editingTarget.unit.customization
              ? {
                  customizationId: editingTarget.unit.customization.id,
                  templateSlug: editingTarget.unit.customization.templateSlug,
                  cardPlanCode: editingTarget.unit.customization.cardPlanCode,
                  giftWrapCode: editingTarget.unit.giftWrapCode,
                  recipientName: editingTarget.unit.customization.recipientName,
                  senderName: editingTarget.unit.customization.senderName,
                  title: editingTarget.unit.customization.title,
                  message: editingTarget.unit.customization.message,
                  occasion: editingTarget.unit.customization.occasion,
                  musicTrackId: editingTarget.unit.customization.musicTrackId,
                  photoUrls: editingTarget.unit.customization.photoUrls,
                }
              : {
                  giftWrapCode: editingTarget.unit.giftWrapCode,
                }
          }
        />
      )}
    </ShopShell>
  );
}

