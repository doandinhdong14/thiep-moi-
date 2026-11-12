"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, PackageSearch, ShieldCheck } from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface LookupResultOrder {
  orderCode: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  recipientName: string;
  provinceName: string;
  districtName: string;
  totalVnd: number;
  createdAt: string;
  items: { id: string; productName: string; variantName: string; quantity: number }[];
  shipments: { carrierName: string | null; trackingCode: string | null; status: string }[];
}

function ShopOrderLookupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderCode, setOrderCode] = useState(searchParams?.get("code") || "");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<LookupResultOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setFoundOrder(null);
    try {
      const res = await fetch("/api/shop/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: orderCode.trim().toUpperCase(),
          contact: contact.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(
          json?.error?.message || "Không tìm thấy đơn hàng hoặc thông tin xác nhận chưa khớp.",
        );
        return;
      }
      const orderPayload = json.data?.order ?? json.data;
      if (!orderPayload?.orderCode) {
        setErrorMsg("Không đọc được dữ liệu đơn hàng vừa tra cứu.");
        return;
      }
      setFoundOrder(orderPayload);
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#C85A77] flex items-center justify-center mx-auto mb-3">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D]">
            Tra cứu đơn hàng quà tặng
          </h1>
          <p className="text-sm text-[#6E555A] mt-1.5">
            Nhập mã đơn quà và số điện thoại hoặc email đặt hàng để xem tiến độ, sửa thiệp trước khi
            gói, hoặc tiếp tục thanh toán.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-[#F2DCE2] p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#5C4448] mb-1">
              Mã đơn hàng *
            </label>
            <input
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="Ví dụ: DDG261112ABCD"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C4448] mb-1">
              Số điện thoại hoặc Email đặt hàng *
            </label>
            <input
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="0901234567 hoặc email@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#C85A77] hover:bg-[#B04562] disabled:opacity-50 text-white text-sm font-semibold"
          >
            {loading ? "Đang xác thực đơn..." : "Tra cứu đơn hàng"}
          </button>

          <p className="text-[11px] text-[#7D6368] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thông tin địa chỉ và thiệp được ẩn với người không có thông tin xác nhận</span>
          </p>
        </form>

        {foundOrder && (
          <div className="mt-6 bg-white rounded-3xl border border-[#F2DCE2] p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F6E4E8]">
              <div>
                <div className="text-xs text-[#6E555A]">Mã đơn quà</div>
                <div className="font-mono font-bold text-lg text-[#3E2A2D]">
                  {foundOrder.orderCode}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FFF0F3] text-[#B94A67] text-xs font-semibold">
                {ORDER_STATUS_LABELS[foundOrder.status] || foundOrder.status}
              </span>
            </div>

            <div className="text-sm space-y-1 text-[#5C4448]">
              <div>
                Người nhận: <strong className="text-[#3E2A2D]">{foundOrder.recipientName}</strong> (
                {foundOrder.districtName}, {foundOrder.provinceName})
              </div>
              <div>
                Tổng đơn:{" "}
                <strong className="text-[#B94A67]">{formatVnd(foundOrder.totalVnd)}</strong>
              </div>
              {foundOrder.shipments?.[0]?.trackingCode && (
                <div>
                  Vận đơn: <strong>{foundOrder.shipments[0].carrierName}</strong> —{" "}
                  <span className="font-mono">{foundOrder.shipments[0].trackingCode}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push(`/qua-tang/don-hang/${foundOrder.orderCode}`)}
                className="px-4 py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <span>Mở chi tiết đơn &amp; Sửa thiệp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(foundOrder.status) && (
                <Link
                  href={`/qua-tang/thanh-toan/${foundOrder.orderCode}`}
                  className="px-4 py-2.5 rounded-xl border border-[#E7C6CF] text-sm font-semibold text-[#3E2A2D]"
                >
                  Thanh toán / Đối soát
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </ShopShell>
  );
}

export default function ShopOrderLookupPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-[#6E555A]">Đang tải trang tra cứu...</div>}>
      <ShopOrderLookupContent />
    </Suspense>
  );
}
