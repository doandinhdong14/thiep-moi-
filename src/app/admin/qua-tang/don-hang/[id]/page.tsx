"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Gift,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface AdminGiftUnitDetail {
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
  packingStatus: string;
  isCardLocked: boolean;
  readyAt: string | null;
  firstOpenedAt: string | null;
  expiresAt: string | null;
  openCount: number;
  qrVersion: number;
  qrPrintedAt: string | null;
  qrVerifyCount: number;
  cardSnapshot: {
    title?: string;
    message?: string;
    people?: { name?: string }[];
  };
}

interface AdminOrderDetail {
  id: string;
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
  shippingQuoteRequired: boolean;
  discountVnd: number;
  totalVnd: number;
  needsStockResolution: boolean;
  internalNotes: string | null;
  createdAt: string;
  items: {
    id: string;
    productNameSnapshot: string;
    variantNameSnapshot: string;
    skuSnapshot: string;
    quantity: number;
    lineTotalVnd: number;
  }[];
  giftUnits: AdminGiftUnitDetail[];
  payments: {
    id: string;
    provider: string;
    status: string;
    amountVnd: number;
    transferContent: string | null;
    paymentNote: string | null;
    providerRef: string | null;
  }[];
  shipments: {
    carrierName: string | null;
    trackingCode: string | null;
    trackingUrl: string | null;
    status: string;
    note: string | null;
  }[];
  auditLogs: {
    id: string;
    action: string;
    summary: string;
    createdAt: string;
  }[];
}

interface LoadedQrData {
  unitId: string;
  boxReferenceCode: string;
  unitLabel: string;
  qrVersion: number;
  qrDataUrl: string;
  giftUrl: string;
  previewUrl: string;
}

export default function AdminShopOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id || "";

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Payment verification fields
  const [verifyRef, setVerifyRef] = useState("");
  const [verifyNote, setVerifyNote] = useState("");

  // Shipping form
  const [carrierName, setCarrierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shipmentNote, setShipmentNote] = useState("");
  const [quoteShippingFee, setQuoteShippingFee] = useState("");

  // Refund/cancel form
  const [cancelReason, setCancelReason] = useState("");
  const [restockReturned, setRestockReturned] = useState(true);

  // Per-box QR preview map + Print sheet size
  const [qrMap, setQrMap] = useState<Record<string, LoadedQrData>>({});
  const [printSize, setPrintSize] = useState<"A6" | "A7" | "90x55">("A6");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shop/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (isShopApiSuccess(json) && json.data) {
        const o: AdminOrderDetail = json.data;
        setOrder(o);
        const ship = o.shipments?.[0];
        setCarrierName(ship?.carrierName || "");
        setTrackingCode(ship?.trackingCode || "");
        setTrackingUrl(ship?.trackingUrl || "");
        setShipmentNote(ship?.note || "");
        setQuoteShippingFee(String(o.shippingFeeVnd || 0));
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const loadQrForUnit = async (unitId: string) => {
    const res = await fetch(`/api/admin/shop/qr/${encodeURIComponent(unitId)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok && isShopApiSuccess(json) && json.data) {
      setQrMap((prev) => ({ ...prev, [unitId]: json.data }));
    } else {
      setErrorMsg(json?.error?.message || "Không tải được mã QR của hộp.");
    }
  };

  const loadAllUnitQrs = async () => {
    if (!order) return;
    await Promise.all(order.giftUnits.map((u) => loadQrForUnit(u.id)));
  };

  const handleVerifyPayment = async (decision: "CONFIRM_PAID" | "REJECT_REVIEW") => {
    setBusy(true);
    setBanner(null);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/admin/shop/orders/${encodeURIComponent(orderId)}/verify-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            providerRef: verifyRef.trim() || undefined,
            note: verifyNote.trim() || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Không thể cập nhật đối soát thanh toán.");
        return;
      }
      setBanner(
        decision === "CONFIRM_PAID"
          ? "Đã xác nhận đã nhận tiền — đã chốt kho & kích hoạt thiệp READY_UNOPENED!"
          : "Đã trả đơn về chờ chuyển khoản.",
      );
      await loadOrder();
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateOrder = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setBanner(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/shop/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Không cập nhật được đơn hàng.");
        return;
      }
      setBanner("Đã cập nhật trạng thái đơn hàng & vận chuyển.");
      await loadOrder();
    } finally {
      setBusy(false);
    }
  };

  const handleQrAction = async (
    unitId: string,
    action: "MARK_PRINTED" | "VERIFY_SCAN" | "REISSUE_QR",
  ) => {
    if (
      action === "REISSUE_QR" &&
      !window.confirm("Cấp lại QR mới sẽ vô hiệu hóa mã QR cũ ngay lập tức. Tiếp tục?")
    ) {
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/shop/qr/${encodeURIComponent(unitId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Thao tác QR thất bại.");
        return;
      }
      if (action === "REISSUE_QR" && json.data?.qrDataUrl) {
        await loadQrForUnit(unitId);
      }
      setBanner(
        action === "VERIFY_SCAN"
          ? "Đã xác minh quét QR nội bộ thành công (chưa tính hạn mở của người nhận)."
          : action === "MARK_PRINTED"
            ? "Đã đánh dấu đã in phiếu QR."
            : "Đã cấp lại mã QR mới & vô hiệu hóa mã cũ.",
      );
      await loadOrder();
    } finally {
      setBusy(false);
    }
  };

  const handlePrintQrSheet = async () => {
    if (!order) return;
    await loadAllUnitQrs();
    await Promise.all(
      order.giftUnits.map((u) =>
        fetch(`/api/admin/shop/qr/${encodeURIComponent(u.id)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_PRINTED" }),
        }),
      ),
    );
    await loadOrder();
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleRefundOrCancel = async (
    action: "CANCEL" | "REQUEST_MANUAL_REFUND" | "MARK_REFUNDED",
  ) => {
    if (!cancelReason.trim()) {
      setErrorMsg("Vui lòng nhập lý do hủy / hoàn tiền.");
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/shop/orders/${encodeURIComponent(orderId)}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: cancelReason.trim(),
          restockReturned,
        }),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Thao tác hủy / hoàn tiền thất bại.");
        return;
      }
      setBanner("Đã xử lý hủy / hoàn tiền đơn hàng.");
      setCancelReason("");
      await loadOrder();
    } finally {
      setBusy(false);
    }
  };

  if (loading && !order) {
    return <div className="py-16 text-center text-slate-500">Đang tải chi tiết đơn...</div>;
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        Không tìm thấy đơn hàng.
      </div>
    );
  }

  const latestPayment = order.payments?.[0];
  const printDimensionsClass =
    printSize === "A6"
      ? "w-[105mm] min-h-[148mm]"
      : printSize === "A7"
        ? "w-[74mm] min-h-[105mm]"
        : "w-[90mm] min-h-[55mm]";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/qua-tang/don-hang"
            className="text-xs font-semibold text-[#B94A67] hover:underline inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Danh sách đơn hàng</span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
            <span>Đơn quà {order.orderCode}</span>
            <span className="text-xs px-3 py-1 rounded-full bg-[#FFF0F3] text-[#B94A67] font-sans font-semibold">
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>
          </h1>
        </div>
        <button
          type="button"
          onClick={loadOrder}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {banner && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium">
          {banner}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Payment verification / reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C85A77]" />
            <span>Thanh toán &amp; Đối soát sao kê</span>
          </h2>
          <div className="text-xs space-y-1 text-slate-600">
            <div>
              Phương thức: <strong>{order.paymentMethod.toUpperCase()}</strong> • Trạng thái:{" "}
              <strong>{order.paymentStatus}</strong>
            </div>
            <div>
              Tổng đơn: <strong className="text-[#B94A67]">{formatVnd(order.totalVnd)}</strong>
            </div>
            {latestPayment?.transferContent && (
              <div>
                Nội dung CK kỳ vọng:{" "}
                <span className="font-mono font-bold text-slate-900">
                  {latestPayment.transferContent}
                </span>
              </div>
            )}
            {latestPayment?.paymentNote && (
              <div className="p-2 rounded-lg bg-amber-50 text-amber-900">
                Ghi chú khách gửi đối soát: <strong>{latestPayment.paymentNote}</strong>
              </div>
            )}
          </div>

          {order.paymentStatus !== "PAID" &&
            order.paymentMethod !== "cod" &&
            !["CANCELLED", "EXPIRED", "REFUNDED"].includes(order.status) && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={verifyRef}
                    onChange={(e) => setVerifyRef(e.target.value)}
                    placeholder="Mã FT / Ref ngân hàng"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <input
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    placeholder="Ghi chú đối soát"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleVerifyPayment("CONFIRM_PAID")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác nhận ĐÃ NHẬN TIỀN</span>
                  </button>
                  {order.status === "PAYMENT_REVIEW_REQUESTED" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleVerifyPayment("REJECT_REVIEW")}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối (chưa thấy tiền)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          {order.status === "STOCK_CONFLICT_REFUND_NEEDED" && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Đơn nhận tiền sau khi giữ chỗ hết hạn &amp; hiện thiếu tồn kho!</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleUpdateOrder({ status: "PAID" })}
                className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-semibold"
              >
                Thử chốt lại kho sau khi nhập hàng
              </button>
            </div>
          )}
        </div>

        {/* Customer / Address + Custom shipping fee */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
          <h2 className="text-sm font-bold text-slate-900">Thông tin đặt &amp; giao hàng</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
            <div>
              <div className="text-slate-400">Người mua</div>
              <div className="font-semibold text-slate-900">{order.customerName}</div>
              <div>{order.customerPhone}</div>
              {order.customerEmail && <div>{order.customerEmail}</div>}
            </div>
            <div>
              <div className="text-slate-400">Người nhận quà</div>
              <div className="font-semibold text-slate-900">{order.recipientName}</div>
              <div>{order.recipientPhone}</div>
              <div>
                {order.streetAddress}, {order.wardName}, {order.districtName}, {order.provinceName}
              </div>
            </div>
          </div>

          {order.shippingQuoteRequired && order.paymentStatus !== "PAID" && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <input
                type="number"
                value={quoteShippingFee}
                onChange={(e) => setQuoteShippingFee(e.target.value)}
                className="w-36 px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => handleUpdateOrder({ shippingFeeVnd: Number(quoteShippingFee) })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Cập nhật phí ship báo giá
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Packing workflow + Carrier tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Chuyển bước đóng gói &amp; giao hàng</h2>
          <p className="text-xs text-slate-500">
            Khi chuyển sang <strong>Đang đóng gói (PACKING)</strong>, mọi nội dung thiệp của khách
            tự động khóa để in QR chính xác.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["PACKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "COMPLETED"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  disabled={busy || order.status === st}
                  onClick={() => handleUpdateOrder({ status: st })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    order.status === st
                      ? "bg-[#C85A77] text-white border-[#C85A77]"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {ORDER_STATUS_LABELS[st] || st}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#C85A77]" />
            <span>Gắn nhà vận chuyển &amp; Mã vận đơn</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              placeholder="Đơn vị (GHN, GHTK, Viettel Post...)"
              className="px-3 py-2 rounded-xl border border-slate-300"
            />
            <input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Mã vận đơn"
              className="px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
            <input
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="Link tracking HTTPS (allowlisted)"
              className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              handleUpdateOrder({
                carrierName: carrierName.trim() || null,
                trackingCode: trackingCode.trim() || null,
                trackingUrl: trackingUrl.trim() || null,
                shipmentNote: shipmentNote.trim() || null,
              })
            }
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Lưu thông tin vận chuyển
          </button>
        </div>
      </div>

      {/* Per-box Unique QR Control + Print Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#C85A77]" />
              <span>Quản lý QR độc nhất cho TỪNG HỘP QUÀ ({order.giftUnits.length} hộp)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi hộp có token ngẫu nhiên riêng. Kiểm tra nội bộ dùng <code>?mode=preview</code> hoặc{" "}
              &ldquo;Xác minh quét QR&rdquo; không làm kích hoạt hạn mở lần đầu của người nhận.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={printSize}
              onChange={(e) => setPrintSize(e.target.value as "A6" | "A7" | "90x55")}
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="A6">Khổ A6 (105×148mm)</option>
              <option value="A7">Khổ A7 (74×105mm)</option>
              <option value="90x55">Card 90×55mm</option>
            </select>
            <button
              type="button"
              onClick={loadAllUnitQrs}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tải QR tất cả hộp</span>
            </button>
            <button
              type="button"
              onClick={handlePrintQrSheet}
              className="px-4 py-2 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu QR</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {order.giftUnits.map((unit) => {
            const loadedQr = qrMap[unit.id];
            return (
              <div
                key={unit.id}
                className="rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  <img
                    src={unit.previewImageUrl}
                    alt={unit.templateTitle}
                    className="w-12 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">
                      {unit.unitLabel} —{" "}
                      <span className="font-mono text-[#B94A67]">{unit.boxReferenceCode}</span>
                    </div>
                    <div className="text-slate-600">
                      Mẫu thiệp: <strong>{unit.templateTitle}</strong> • Trạng thái thiệp:{" "}
                      <strong>{unit.cardState}</strong> • Đóng gói:{" "}
                      <strong>{unit.packingStatus}</strong>
                    </div>
                    <div className="text-slate-500">
                      QR v{unit.qrVersion} • In lúc:{" "}
                      {unit.qrPrintedAt
                        ? new Date(unit.qrPrintedAt).toLocaleString("vi-VN")
                        : "Chưa in"}{" "}
                      • Quét nội bộ: {unit.qrVerifyCount} lần • Khách mở: {unit.openCount} lần
                    </div>
                    {unit.cardSnapshot?.message && (
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-700 italic max-w-xl">
                        &ldquo;{unit.cardSnapshot.message}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
                  {loadedQr ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={loadedQr.qrDataUrl}
                        alt={`QR ${unit.boxReferenceCode}`}
                        className="w-24 h-24 rounded-xl border border-slate-200 bg-white p-1"
                      />
                      <div className="flex flex-col gap-1.5 text-xs">
                        <a
                          href={`/api/admin/shop/qr/${unit.id}?format=png`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải PNG</span>
                        </a>
                        <a
                          href={`/api/admin/shop/qr/${unit.id}?format=svg`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải SVG</span>
                        </a>
                        <a
                          href={loadedQr.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#FFF0F3] text-[#B94A67] inline-flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Mở kiểm tra nội bộ</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => loadQrForUnit(unit.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF0F3] text-[#B94A67] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Hiển thị mã QR hộp này</span>
                    </button>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleQrAction(unit.id, "VERIFY_SCAN")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Xác minh quét (không tính hạn)</span>
                    </button>
                    {!unit.firstOpenedAt && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleQrAction(unit.id, "REISSUE_QR")}
                        className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Cấp lại QR</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel / Manual Refund & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Hủy đơn / Hoàn tiền thủ công</h2>
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy hoặc hoàn tiền..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={restockReturned}
              onChange={(e) => setRestockReturned(e.target.checked)}
            />
            <span>Hoàn trả tồn kho hàng hóa</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRefundOrCancel("CANCEL")}
              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
            >
              Hủy đơn hàng
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRefundOrCancel("MARK_REFUNDED")}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
            >
              Đánh dấu Đã hoàn tiền
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <h2 className="text-sm font-bold text-slate-900">Nhật ký xử lý đơn hàng</h2>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
            {order.auditLogs.map((log) => (
              <div key={log.id} className="py-2 flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-800">{log.summary}</span>
                  <div className="text-[11px] font-mono text-slate-400">{log.action}</div>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print-only QR slip sheet (.ddg-print-qr-area from shop.css) */}
      <div className="hidden print:block ddg-print-qr-area p-4">
        <div className="flex flex-wrap gap-4">
          {order.giftUnits.map((unit) => {
            const loaded = qrMap[unit.id];
            if (!loaded) return null;
            return (
              <div
                key={unit.id}
                className={`${printDimensionsClass} border border-dashed border-slate-400 p-4 rounded-xl flex flex-col items-center justify-center text-center bg-white break-inside-avoid`}
              >
                <div className="text-[11px] font-serif font-bold text-[#3E2A2D] mb-1">
                  Có một lời thương đang đợi bạn mở ♡
                </div>
                <img
                  src={loaded.qrDataUrl}
                  alt={unit.boxReferenceCode}
                  className="w-32 h-32 object-contain my-1"
                />
                <div className="text-[10px] text-slate-700 mt-1">
                  Quét mã QR bằng camera điện thoại để mở tấm thiệp dành riêng cho hộp quà này.
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1.5">
                  {unit.boxReferenceCode} • v{unit.qrVersion}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
