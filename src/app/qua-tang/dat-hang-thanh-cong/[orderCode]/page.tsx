"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Gift,
  Package,
  QrCode,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface OrderAccessPayload {
  order: {
    orderCode: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    recipientName: string;
    provinceName: string;
    districtName: string;
    totalVnd: number;
    items: {
      id: string;
      productName: string;
      variantName: string;
      quantity: number;
      lineTotalVnd: number;
    }[];
    giftUnits: {
      id: string;
      unitIndex: number;
      unitLabel: string;
      boxReferenceCode: string;
      templateTitle: string;
      previewImageUrl: string;
      cardState: string;
    }[];
  };
}

export default function ShopOrderSuccessPage() {
  const params = useParams<{ orderCode: string }>();
  const searchParams = useSearchParams();
  const orderCode = (params?.orderCode || "").toUpperCase();
  const tokenParam = searchParams?.get("token") || "";
  const tokenQuery = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : "";

  const [payload, setPayload] = useState<OrderAccessPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shop/orders/${encodeURIComponent(orderCode)}/access${tokenQuery}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json) => {
        if (isShopApiSuccess(json) && json.data) {
          setPayload(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderCode, tokenQuery]);

  const order = payload?.order;
  const isPaid = order?.paymentStatus === "PAID";
  const isCod = order?.paymentMethod === "cod";

  return (
    <ShopShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-12 text-center text-[#6E555A]">
            Đang tải thông tin đơn quà...
          </div>
        ) : !order ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-8 text-center">
            <h1 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Đã ghi nhận mã đơn {orderCode}
            </h1>
            <p className="text-sm text-[#6E555A] mt-2">
              Vui lòng dùng SĐT/Email đặt hàng để xem chi tiết đơn tại trang Tra cứu đơn.
            </p>
            <Link
              href={`/qua-tang/tra-cuu-don?code=${encodeURIComponent(orderCode)}`}
              className="mt-5 inline-flex px-5 py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
            >
              Tra cứu đơn hàng
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-6 sm:p-8 shadow-sm">
            <div className="text-center pb-6 border-b border-[#F6E4E8]">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                  isPaid || isCod
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {isPaid || isCod ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <Clock className="w-9 h-9" />
                )}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#B94A67]">
                Mã đơn quà: {order.orderCode}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D] mt-1">
                {isPaid
                  ? "Cảm ơn bạn! Đơn quà đã được xác nhận thanh toán"
                  : isCod
                    ? "Đặt quà COD thành công — Shop sẽ sớm chuẩn bị hộp quà"
                    : `Trạng thái đơn: ${ORDER_STATUS_LABELS[order.status] || order.status}`}
              </h1>
              <p className="text-sm text-[#6E555A] mt-2 max-w-lg mx-auto">
                Người nhận: <strong>{order.recipientName}</strong> ({order.districtName},{" "}
                {order.provinceName}) • Tổng đơn:{" "}
                <strong className="text-[#B94A67]">{formatVnd(order.totalVnd)}</strong>
              </p>
            </div>

            <div className="py-5 space-y-3 border-b border-[#F6E4E8]">
              <h2 className="text-sm font-bold text-[#3E2A2D] flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#C85A77]" />
                <span>Danh sách hộp quà &amp; thiệp QR đi kèm ({order.giftUnits.length} hộp)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.giftUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="rounded-2xl bg-[#FFF9FA] border border-[#F2DCE2] p-3 flex items-center gap-3"
                  >
                    <img
                      src={unit.previewImageUrl}
                      alt={unit.templateTitle}
                      className="w-11 h-14 rounded-lg object-cover border border-[#EED5DC] shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <div className="font-semibold text-[#3E2A2D] truncate">
                        {unit.unitLabel}
                      </div>
                      <div className="text-[#6E555A] truncate">
                        Thiệp: {unit.templateTitle}
                      </div>
                      <div className="text-[11px] text-[#B94A67] mt-0.5 inline-flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        <span>Mã hộp: {unit.boxReferenceCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6E555A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C85A77]" />
                <span>
                  Bạn vẫn có thể chỉnh sửa nội dung thiệp trước khi shop bấm bắt đầu đóng gói tại
                  trang chi tiết đơn hàng.
                </span>
              </p>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
              {["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(order.status) && (
                <Link
                  href={`/qua-tang/thanh-toan/${order.orderCode}${tokenQuery}`}
                  className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <span>Đi tới trang thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href={`/qua-tang/don-hang/${order.orderCode}${tokenQuery}`}
                className="px-5 py-3 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>Theo dõi đơn &amp; Sửa thiệp</span>
              </Link>
              <Link
                href="/qua-tang"
                className="px-5 py-3 rounded-xl border border-[#E7C6CF] text-[#3E2A2D] text-sm font-medium hover:bg-[#FFF5F7]"
              >
                Tiếp tục dạo cửa hàng
              </Link>
            </div>
          </div>
        )}
      </div>
    </ShopShell>
  );
}

