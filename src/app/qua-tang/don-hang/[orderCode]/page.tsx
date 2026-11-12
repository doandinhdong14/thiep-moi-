"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gift,
  Lock,
  MapPin,
  Package,
  QrCode,
  Sparkles,
  Truck,
} from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { useShopCart } from "@/components/shop/ShopCartContext";
import GiftPersonalizationWizard, {
  type WizardSavedResult,
} from "@/components/shop/GiftPersonalizationWizard";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface UnitCustomizationRow {
  unitId: string;
  unitIndex: number;
  customizationId: string | null;
  canEditCard: boolean;
  customization: {
    id: string;
    templateSlug: string;
    recipientName: string;
    senderName: string;
    title: string;
    message: string;
    occasion: string | null;
    musicTrackId: string | null;
    photoUrls: string[];
  } | null;
}

interface OrderDetailView {
  orderCode: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  recipientName: string;
  recipientPhone: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  streetAddress: string;
  addressNote: string | null;
  deliveryNote: string | null;
  subtotalVnd: number;
  giftWrapFeeVnd: number;
  giftCardFeeVnd: number;
  shippingFeeVnd: number;
  discountVnd: number;
  totalVnd: number;
  promoCode: string | null;
  createdAt: string;
  paidAt: string | null;
  packingStartedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelReason: string | null;
  items: {
    id: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPriceVnd: number;
    lineTotalVnd: number;
  }[];
  giftUnits: {
    id: string;
    unitIndex: number;
    unitLabel: string;
    boxReferenceCode: string;
    templateSlug: string;
    templateTitle: string;
    previewImageUrl: string;
    cardPlanCode: string;
    durationDays: number | null;
    cardState: string;
    isCardLocked: boolean;
    canEditCard: boolean;
    firstOpenedAt: string | null;
    expiresAt: string | null;
    customizationId: string | null;
  }[];
  shipments: {
    carrierName: string | null;
    trackingCode: string | null;
    trackingUrl: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
    note: string | null;
  }[];
}

const CARD_STATE_LABELS: Record<string, { label: string; tone: string }> = {
  PREPARING: { label: "Chờ đóng gói & kích hoạt QR", tone: "bg-slate-100 text-slate-700" },
  READY_UNOPENED: {
    label: "QR sẵn sàng — chờ người nhận mở thiệp",
    tone: "bg-amber-50 text-amber-800",
  },
  ACTIVE: { label: "Người nhận đã mở thiệp", tone: "bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "Thiệp đã hết hạn hiển thị", tone: "bg-gray-100 text-gray-600" },
  DISABLED: { label: "Thiệp đã vô hiệu hóa", tone: "bg-rose-50 text-rose-700" },
};

export default function ShopOrderDetailPage() {
  const params = useParams<{ orderCode: string }>();
  const searchParams = useSearchParams();
  const { settings } = useShopCart();

  const orderCode = (params?.orderCode || "").toUpperCase();
  const tokenParam = searchParams?.get("token") || "";
  const tokenQuery = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : "";

  const [order, setOrder] = useState<OrderDetailView | null>(null);
  const [unitCustomizations, setUnitCustomizations] = useState<UnitCustomizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifyContact, setVerifyContact] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const [editingUnit, setEditingUnit] = useState<{
    unit: OrderDetailView["giftUnits"][number];
    customization: UnitCustomizationRow["customization"];
  } | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/shop/orders/${encodeURIComponent(orderCode)}/access${tokenQuery}`,
        { cache: "no-store" },
      );
      if (res.status === 403) {
        setNeedsVerify(true);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (res.ok && isShopApiSuccess(json) && json.data) {
        setNeedsVerify(false);
        setOrder(json.data.order);
        setUnitCustomizations(json.data.unitCustomizations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [orderCode, tokenQuery]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleLookupUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    const res = await fetch("/api/shop/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode, contact: verifyContact.trim() }),
    });
    const json = await res.json();
    if (!res.ok || !isShopApiSuccess(json)) {
      setVerifyError(json?.error?.message || "Thông tin xác nhận chưa khớp.");
      return;
    }
    await loadOrder();
  };

  const handleSaveEditedCard = async (res: WizardSavedResult) => {
    if (!editingUnit) return;
    const patchRes = await fetch(
      `/api/shop/orders/${encodeURIComponent(orderCode)}/units/${editingUnit.unit.id}/card${tokenQuery}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: res.templateSlug,
          recipientName: res.recipientName,
          senderName: res.senderName,
          title: res.title,
          message: res.message,
          occasion: res.occasion,
          musicTrackId: res.musicTrackId,
          photoUrls: res.photoUrls,
        }),
      },
    );
    const patchJson = await patchRes.json();
    if (!patchRes.ok || !isShopApiSuccess(patchJson)) {
      setSaveBanner(patchJson?.error?.message || "Không thể cập nhật nội dung thiệp.");
    } else {
      setSaveBanner(`Đã cập nhật nội dung thiệp cho ${editingUnit.unit.unitLabel}.`);
      await loadOrder();
    }
    setEditingUnit(null);
  };

  return (
    <ShopShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Link
              href="/tai-khoan/don-hang"
              className="text-xs font-medium text-[#B94A67] hover:underline inline-flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách đơn quà</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D]">
              Chi tiết đơn quà {orderCode}
            </h1>
          </div>
          {order && ["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(order.status) && (
            <Link
              href={`/qua-tang/thanh-toan/${order.orderCode}${tokenQuery}`}
              className="px-4 py-2.5 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-xs font-semibold"
            >
              Đi tới thanh toán / đối soát
            </Link>
          )}
        </div>

        {saveBanner && (
          <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium">
            {saveBanner}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-12 text-center text-[#6E555A]">
            Đang tải chi tiết đơn hàng...
          </div>
        ) : needsVerify ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-6 sm:p-8 max-w-md mx-auto">
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Xác thực chủ đơn hàng
            </h2>
            <p className="text-xs text-[#6E555A] mt-1.5">
              Để bảo vệ quyền riêng tư của người mua và người nhận, vui lòng nhập SĐT hoặc Email
              đặt hàng cho đơn {orderCode}.
            </p>
            <form onSubmit={handleLookupUnlock} className="mt-4 space-y-3">
              <input
                required
                value={verifyContact}
                onChange={(e) => setVerifyContact(e.target.value)}
                placeholder="Số điện thoại hoặc Email đặt hàng"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm"
              />
              {verifyError && <p className="text-xs text-rose-600">{verifyError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
              >
                Xác nhận xem đơn
              </button>
            </form>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-10 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Không tìm thấy đơn hàng {orderCode}
            </h2>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline milestones */}
            <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs text-[#6E555A]">Trạng thái hiện tại</span>
                  <div className="text-lg font-bold text-[#B94A67]">
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </div>
                </div>
                <div className="text-right text-xs text-[#6E555A]">
                  <div>Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}</div>
                  <div>
                    Thanh toán: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
                  </div>
                </div>
              </div>

              {order.cancelReason && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-rose-800 text-xs">
                  <strong>Lý do hủy / ghi chú:</strong> {order.cancelReason}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  {
                    label: "Đặt đơn",
                    done: true,
                    time: order.createdAt,
                    icon: Clock,
                  },
                  {
                    label: order.paymentMethod === "cod" ? "Xác nhận COD" : "Xác nhận thanh toán",
                    done:
                      order.paymentStatus === "PAID" ||
                      [
                        "CONFIRMED",
                        "PACKING",
                        "READY_TO_SHIP",
                        "SHIPPED",
                        "DELIVERED",
                        "COMPLETED",
                      ].includes(order.status),
                    time: order.paidAt,
                    icon: CheckCircle2,
                  },
                  {
                    label: "Gói quà & In QR",
                    done: Boolean(order.packingStartedAt),
                    time: order.packingStartedAt,
                    icon: Package,
                  },
                  {
                    label: "Giao tận tay",
                    done: Boolean(order.deliveredAt || order.shippedAt),
                    time: order.deliveredAt || order.shippedAt,
                    icon: Truck,
                  },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.label}
                      className={`rounded-2xl border p-3 ${
                        step.done
                          ? "bg-[#FFF7F9] border-[#E7B6C3] text-[#3E2A2D]"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-1.5 ${
                          step.done ? "text-[#C85A77]" : "text-gray-400"
                        }`}
                      />
                      <div className="font-semibold">{step.label}</div>
                      {step.time && (
                        <div className="text-[11px] opacity-80 mt-0.5">
                          {new Date(step.time).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recipient & Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 shadow-sm">
                <h2 className="font-serif text-base font-bold text-[#3E2A2D] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C85A77]" />
                  <span>Địa chỉ nhận quà</span>
                </h2>
                <div className="text-sm space-y-1 text-[#5C4448]">
                  <div className="font-semibold text-[#3E2A2D]">
                    {order.recipientName} — {order.recipientPhone}
                  </div>
                  <div>
                    {order.streetAddress}, {order.wardName}, {order.districtName},{" "}
                    {order.provinceName}
                  </div>
                  {order.addressNote && (
                    <div className="text-xs text-[#7D6368]">Ghi chú địa chỉ: {order.addressNote}</div>
                  )}
                  {order.deliveryNote && (
                    <div className="text-xs text-[#7D6368]">Lời dặn giao hàng: {order.deliveryNote}</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 shadow-sm">
                <h2 className="font-serif text-base font-bold text-[#3E2A2D] mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C85A77]" />
                  <span>Vận chuyển &amp; Mã vận đơn</span>
                </h2>
                {order.shipments[0]?.trackingCode ? (
                  <div className="text-sm space-y-1.5 text-[#5C4448]">
                    <div>
                      Đơn vị: <strong className="text-[#3E2A2D]">{order.shipments[0].carrierName}</strong>
                    </div>
                    <div>
                      Mã vận đơn:{" "}
                      <span className="font-mono font-bold text-[#3E2A2D]">
                        {order.shipments[0].trackingCode}
                      </span>
                    </div>
                    {order.shipments[0].trackingUrl && (
                      <a
                        href={order.shipments[0].trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#B94A67] hover:underline"
                      >
                        <span>Theo dõi hành trình nhà vận chuyển</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#6E555A]">
                    Shop sẽ cập nhật đơn vị vận chuyển và mã vận đơn ngay khi bàn giao kiện quà.
                  </p>
                )}
              </div>
            </div>

            {/* Per-box gift cards & pre-packing edits */}
            <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-serif text-lg font-bold text-[#3E2A2D] flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#C85A77]" />
                  <span>Từng hộp quà &amp; trạng thái thiệp QR ({order.giftUnits.length} hộp)</span>
                </h2>
                <span className="text-[11px] text-[#6E555A]">
                  Chú ý: Liên kết QR chỉ được in vào thiệp giấy bên trong hộp quà để đảm bảo bất ngờ.
                </span>
              </div>

              <div className="space-y-3">
                {order.giftUnits.map((unit) => {
                  const rowCustom =
                    unitCustomizations.find((u) => u.unitId === unit.id)?.customization || null;
                  const stateMeta = CARD_STATE_LABELS[unit.cardState] || {
                    label: unit.cardState,
                    tone: "bg-gray-100 text-gray-700",
                  };

                  return (
                    <div
                      key={unit.id}
                      className="rounded-2xl border border-[#F2DCE2] bg-[#FFF9FA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={unit.previewImageUrl}
                          alt={unit.templateTitle}
                          className="w-12 h-16 rounded-xl object-cover border border-[#EED5DC] shrink-0"
                        />
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-sm text-[#3E2A2D]">
                            {unit.unitLabel}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-mono text-[#6E555A]">
                              <QrCode className="w-3.5 h-3.5 text-[#C85A77]" />
                              {unit.boxReferenceCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${stateMeta.tone}`}>
                              {stateMeta.label}
                            </span>
                          </div>
                          <div className="text-[#5C4448]">
                            Mẫu thiệp: <strong>{unit.templateTitle}</strong>
                            {rowCustom && (
                              <>
                                {" "}
                                • Gửi <strong>{rowCustom.recipientName}</strong>
                              </>
                            )}
                          </div>
                          {unit.firstOpenedAt && (
                            <div className="text-[11px] text-emerald-700">
                              Mở lần đầu: {new Date(unit.firstOpenedAt).toLocaleString("vi-VN")}
                              {unit.expiresAt &&
                                ` • Hết hạn: ${new Date(unit.expiresAt).toLocaleDateString("vi-VN")}`}
                            </div>
                          )}
                        </div>
                      </div>

                      {unit.canEditCard ? (
                        <button
                          type="button"
                          onClick={() => setEditingUnit({ unit, customization: rowCustom })}
                          className="shrink-0 px-3.5 py-2 rounded-xl border border-[#DFB5C0] bg-white hover:bg-[#FFF0F3] text-xs font-semibold text-[#B94A67] inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sửa lời chúc / mẫu thiệp</span>
                        </button>
                      ) : (
                        <div className="shrink-0 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs inline-flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Đã khóa thiệp</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <h2 className="font-serif text-base font-bold text-[#3E2A2D] mb-3">
                Chi tiết sản phẩm &amp; Thanh toán
              </h2>
              <div className="space-y-2 text-sm border-b border-[#F6E4E8] pb-3 mb-3">
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between gap-2 text-[#5C4448]">
                    <span>
                      {it.productName} ({it.variantName}) × {it.quantity}
                    </span>
                    <span className="font-medium text-[#3E2A2D]">
                      {formatVnd(it.lineTotalVnd)}
                    </span>
                  </div>
                ))}
              </div>
              <dl className="space-y-1.5 text-xs sm:text-sm text-[#5C4448]">
                <div className="flex justify-between">
                  <dt>Tạm tính hàng</dt>
                  <dd>{formatVnd(order.subtotalVnd)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Phí gói quà + Thiệp nâng cấp</dt>
                  <dd>{formatVnd(order.giftWrapFeeVnd + order.giftCardFeeVnd)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Phí vận chuyển</dt>
                  <dd>{formatVnd(order.shippingFeeVnd)}</dd>
                </div>
                {order.discountVnd > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Ưu đãi ({order.promoCode})</dt>
                    <dd>-{formatVnd(order.discountVnd)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#B94A67] pt-2 border-t border-[#F6E4E8]">
                  <dt>Tổng thanh toán</dt>
                  <dd>{formatVnd(order.totalVnd)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {editingUnit && settings && (
        <GiftPersonalizationWizard
          open={true}
          onClose={() => setEditingUnit(null)}
          onComplete={handleSaveEditedCard}
          productName={editingUnit.unit.unitLabel}
          boxLabel={editingUnit.unit.boxReferenceCode}
          defaultTemplateSlug={
            editingUnit.customization?.templateSlug || editingUnit.unit.templateSlug
          }
          cardPlans={settings.cardPlans}
          giftWrapOptions={settings.giftWrapOptions}
          lockPricingTier={true}
          initialData={
            editingUnit.customization
              ? {
                  customizationId: editingUnit.customization.id,
                  templateSlug: editingUnit.customization.templateSlug,
                  cardPlanCode: editingUnit.unit.cardPlanCode,
                  recipientName: editingUnit.customization.recipientName,
                  senderName: editingUnit.customization.senderName,
                  title: editingUnit.customization.title,
                  message: editingUnit.customization.message,
                  occasion: editingUnit.customization.occasion,
                  musicTrackId: editingUnit.customization.musicTrackId,
                  photoUrls: editingUnit.customization.photoUrls,
                }
              : {
                  templateSlug: editingUnit.unit.templateSlug,
                  cardPlanCode: editingUnit.unit.cardPlanCode,
                  recipientName: order?.recipientName || "",
                  senderName: order?.customerName || "",
                }
          }
        />
      )}
    </ShopShell>
  );
}

