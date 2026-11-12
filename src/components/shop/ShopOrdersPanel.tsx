"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Gift,
  LogIn,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface OrderSummaryItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
}

interface OrderSummaryShipment {
  carrierName: string | null;
  trackingCode: string | null;
  status: string;
}

interface ShopOrderSummary {
  id?: string;
  orderCode: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  recipientName: string;
  provinceName: string;
  totalVnd: number;
  createdAt: string;
  items: OrderSummaryItem[];
  giftUnits?: { id: string }[];
  shipments?: OrderSummaryShipment[];
}

interface ShopOrdersPanelProps {
  variant?: "drawer" | "page";
  onNavigate?: () => void;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAYMENT_REVIEW_REQUESTED: "bg-sky-50 text-sky-800 border-sky-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PACKING: "bg-rose-50 text-[#B94A67] border-rose-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
};

/**
 * Integrated "My Orders" panel inside Gift Bag Drawer and Cart Page.
 * Supports signed-in customer order history (/api/shop/orders/my), guest code lookup
 * (/api/shop/orders/lookup), and quick access to personalized invitations (/dashboard).
 */
export default function ShopOrdersPanel({
  variant = "drawer",
  onNavigate,
}: ShopOrdersPanelProps) {
  const [orders, setOrders] = useState<ShopOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [showLookupForm, setShowLookupForm] = useState(false);

  const [lookupCode, setLookupCode] = useState("");
  const [lookupContact, setLookupContact] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<ShopOrderSummary | null>(null);

  const loadMyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
      if (!meRes.ok) {
        setUnauthenticated(true);
        setOrders([]);
        return;
      }
      const res = await fetch("/api/shop/orders/my", { cache: "no-store" });
      if (res.status === 401) {
        setUnauthenticated(true);
        setOrders([]);
        return;
      }
      const json = await res.json();
      if (isShopApiSuccess(json) && Array.isArray(json.data)) {
        setUnauthenticated(false);
        setOrders(json.data);
      }
    } catch {
      // keep silent UI fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyOrders();
    const onAuthChange = () => loadMyOrders();
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, [loadMyOrders]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupBusy(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await fetch("/api/shop/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: lookupCode.trim().toUpperCase(),
          contact: lookupContact.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setLookupError(
          json?.error?.message || "Không tìm thấy đơn hoặc số điện thoại/email chưa khớp.",
        );
        return;
      }
      const orderPayload = json.data?.order ?? json.data;
      if (!orderPayload?.orderCode) {
        setLookupError("Không đọc được thông tin đơn hàng.");
        return;
      }
      setLookupResult(orderPayload);
    } catch {
      setLookupError("Không thể kết nối máy chủ, vui lòng thử lại.");
    } finally {
      setLookupBusy(false);
    }
  };

  const renderOrderCard = (order: ShopOrderSummary) => {
    const needsPayment = ["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(order.status);
    const activeShipment = order.shipments?.[0];
    const badgeCls =
      STATUS_BADGE_CLASSES[order.status] || "bg-rose-50 text-[#B94A67] border-rose-200";

    return (
      <div
        key={order.id || order.orderCode}
        className="bg-white rounded-2xl border border-[#F2DCE2] p-3.5 sm:p-4 space-y-2.5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs sm:text-sm font-bold text-[#3E2A2D]">
              {order.orderCode}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeCls}`}
            >
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-[#D94575] shrink-0">
            {formatVnd(order.totalVnd)}
          </span>
        </div>

        <div className="text-xs text-[#6E555A] space-y-1">
          <div className="flex items-start gap-1.5 min-w-0">
            <Gift className="w-3.5 h-3.5 text-[#FF5C8D] shrink-0 mt-0.5" />
            <span className="text-[#3E2A2D] font-medium line-clamp-2">
              {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
            </span>
          </div>
          <p className="text-[11px]">
            Người nhận: <strong className="text-[#3E2A2D]">{order.recipientName}</strong> (
            {order.provinceName}) • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
          </p>
          {activeShipment?.trackingCode && (
            <p className="text-[11px] text-indigo-700 inline-flex items-center gap-1">
              <Truck className="w-3 h-3 shrink-0" />
              <span>
                {activeShipment.carrierName || "Vận chuyển"}: {activeShipment.trackingCode}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {needsPayment && (
            <Link
              href={`/qua-tang/thanh-toan/${order.orderCode}`}
              onClick={onNavigate}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              Thanh toán
            </Link>
          )}
          <Link
            href={`/qua-tang/don-hang/${order.orderCode}`}
            onClick={onNavigate}
            className="px-3 py-1.5 rounded-xl border border-[#E7C6CF] hover:bg-[#FFF5F7] text-[#3E2A2D] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>Chi tiết đơn</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  };

  const containerCls =
    variant === "page" ? "max-w-3xl mx-auto space-y-5" : "space-y-4";

  return (
    <div className={containerCls}>
      {/* Shortcut card for digital invitations + full history */}
      <div className="rounded-2xl bg-gradient-to-r from-[#FFF0F3] to-[#FFF8F5] border border-[#F2DCE2] p-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-white text-[#fa416a] flex items-center justify-center border border-rose-100 shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#3E2A2D]">Thiệp mời &amp; Đơn hàng</p>
            <p className="text-[11px] text-[#7C6368] truncate">
              Quản lý thiệp online đã tạo hoặc theo dõi hộp quà QR
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-[#fa416a] text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Thiệp của tôi</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Signed-in vs Guest Orders */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#F2DCE2] p-8 text-center text-xs text-[#7C6368]">
          Đang tải danh sách đơn hàng...
        </div>
      ) : !unauthenticated ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E555A] inline-flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-[#FF5C8D]" />
              <span>Đơn quà đã đặt ({orders.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadMyOrders}
                className="text-[11px] text-[#7C6368] hover:text-[#3E2A2D] inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới</span>
              </button>
              <Link
                href="/tai-khoan/don-hang"
                onClick={onNavigate}
                className="text-[11px] font-semibold text-[#D94575] hover:underline"
              >
                Mở toàn trang
              </Link>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#F2DCE2] p-6 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-[#FF5C8D] mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#3E2A2D]">
                  Tài khoản của bạn chưa có đơn quà nào
                </p>
                <p className="text-xs text-[#7C6368]">
                  Nếu trước đó bạn đặt không cần đăng nhập, hãy tra cứu nhanh bằng mã đơn bên dưới.
                </p>
              </div>
              <Link
                href="/qua-tang"
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C8D] text-white text-xs font-semibold hover:opacity-95"
              >
                <span>Chọn quà ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">{orders.map(renderOrderCard)}</div>
          )}

          <button
            type="button"
            onClick={() => setShowLookupForm((prev) => !prev)}
            className="text-xs font-semibold text-[#6E555A] hover:text-[#D94575] inline-flex items-center gap-1.5"
          >
            <PackageSearch className="w-3.5 h-3.5" />
            <span>
              {showLookupForm ? "Ẩn khung tra cứu mã đơn" : "Tra cứu đơn đặt không đăng nhập"}
            </span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F2DCE2] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#3E2A2D]">Đồng bộ lịch sử đơn hàng</p>
            <p className="text-[11px] text-[#7C6368] mt-0.5">
              Đăng nhập để xem mọi đơn quà &amp; thiệp mời đã tạo trên tài khoản của bạn.
            </p>
          </div>
          <Link
            href="/login?callbackUrl=/qua-tang/gio-hang?tab=orders"
            onClick={onNavigate}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
        </div>
      )}

      {/* Guest Lookup Form (Always visible for guest, toggleable for signed-in users) */}
      {(unauthenticated || showLookupForm) && (
        <div className="bg-white rounded-2xl border border-[#F2DCE2] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-[#3E2A2D] inline-flex items-center gap-1.5">
              <PackageSearch className="w-4 h-4 text-[#C85A77]" />
              <span>Tra cứu nhanh theo mã đơn</span>
            </h3>
            <Link
              href="/qua-tang/tra-cuu-don"
              onClick={onNavigate}
              className="text-[11px] font-semibold text-[#D94575] hover:underline"
            >
              Trang tra cứu riêng
            </Link>
          </div>

          <form onSubmit={handleLookupSubmit} className="space-y-2.5">
            <input
              type="text"
              required
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="Mã đơn hàng (VD: DDG-...)"
              className="w-full px-3 py-2 rounded-xl border border-[#E7C6CF] text-xs font-mono text-[#3E2A2D] focus:outline-none focus:ring-2 focus:ring-[#FF5C8D]/30"
            />
            <input
              type="text"
              required
              value={lookupContact}
              onChange={(e) => setLookupContact(e.target.value)}
              placeholder="Số điện thoại hoặc email lúc đặt hàng"
              className="w-full px-3 py-2 rounded-xl border border-[#E7C6CF] text-xs text-[#3E2A2D] focus:outline-none focus:ring-2 focus:ring-[#FF5C8D]/30"
            />
            {lookupError && (
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{lookupError}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={lookupBusy}
              className="w-full py-2.5 rounded-xl bg-[#3E2A2D] hover:bg-[#543A3E] text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {lookupBusy ? "Đang kiểm tra..." : "Kiểm tra tiến độ đơn"}
            </button>
          </form>

          {lookupResult && <div className="pt-1">{renderOrderCard(lookupResult)}</div>}
        </div>
      )}
    </div>
  );
}
