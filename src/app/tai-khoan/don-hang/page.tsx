"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gift, Lock, PackageSearch, ShoppingBag } from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface MyOrderRow {
  id: string;
  orderCode: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  recipientName: string;
  provinceName: string;
  totalVnd: number;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
  giftUnits: { id: string }[];
}

export default function MyShopOrdersPage() {
  const [orders, setOrders] = useState<MyOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/shop/orders/my", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          setUnauthenticated(true);
          return;
        }
        const json = await res.json();
        if (isShopApiSuccess(json) && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShopShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D]">
              Đơn hàng quà tặng của tôi
            </h1>
            <p className="text-sm text-[#6E555A] mt-1">
              Theo dõi trạng thái thanh toán, gói quà, thiệp QR và mã vận đơn.
            </p>
          </div>
          <Link
            href="/qua-tang/tra-cuu-don"
            className="px-4 py-2 rounded-xl border border-[#E7C6CF] bg-white text-xs font-semibold text-[#3E2A2D] hover:bg-[#FFF5F7] inline-flex items-center gap-1.5"
          >
            <PackageSearch className="w-4 h-4 text-[#C85A77]" />
            <span>Tra cứu đơn mua không đăng nhập</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-12 text-center text-[#6E555A]">
            Đang tải đơn hàng...
          </div>
        ) : unauthenticated ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-8 sm:p-10 text-center max-w-xl mx-auto">
            <Lock className="w-10 h-10 text-[#C85A77] mx-auto mb-3" />
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Đăng nhập để xem lịch sử đơn quà đồng bộ tài khoản
            </h2>
            <p className="text-sm text-[#6E555A] mt-2">
              Nếu bạn đặt quà với tư cách khách vãng lai, bạn vẫn có thể tra cứu trực tiếp bằng mã
              đơn + SĐT/Email.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?callbackUrl=/tai-khoan/don-hang"
                className="px-5 py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
              >
                Đăng nhập tài khoản
              </Link>
              <Link
                href="/qua-tang/tra-cuu-don"
                className="px-5 py-2.5 rounded-xl border border-[#E7C6CF] text-[#3E2A2D] text-sm font-medium"
              >
                Tra cứu đơn khách vãng lai
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-10 text-center max-w-xl mx-auto">
            <ShoppingBag className="w-10 h-10 text-[#C85A77] mx-auto mb-3" />
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Bạn chưa có đơn quà nào gắn với tài khoản này
            </h2>
            <Link
              href="/qua-tang/tat-ca"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
            >
              <span>Chọn hộp quà ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#F2DCE2] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#3E2A2D]">{order.orderCode}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0F3] text-[#B94A67] text-xs font-semibold">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#6E555A]">
                    Người nhận: <strong className="text-[#3E2A2D]">{order.recipientName}</strong> (
                    {order.provinceName}) • {order.giftUnits.length} hộp quà • Đặt lúc{" "}
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-xs text-[#5C4448] inline-flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-[#C85A77]" />
                    <span>
                      {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:text-right">
                  <div>
                    <div className="text-xs text-[#6E555A]">Tổng tiền</div>
                    <div className="font-bold text-[#B94A67]">{formatVnd(order.totalVnd)}</div>
                  </div>
                  {["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(order.status) && (
                    <Link
                      href={`/qua-tang/thanh-toan/${order.orderCode}`}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold"
                    >
                      Thanh toán
                    </Link>
                  )}
                  <Link
                    href={`/qua-tang/don-hang/${order.orderCode}`}
                    className="px-3.5 py-2 rounded-xl border border-[#E7C6CF] text-xs font-semibold text-[#3E2A2D] hover:bg-[#FFF5F7]"
                  >
                    Chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopShell>
  );
}

