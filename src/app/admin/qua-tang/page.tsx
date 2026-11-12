"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface DashboardData {
  kpis: {
    ordersToday: number;
    pendingPaymentOrders: number;
    reviewRequestedOrders: number;
    packingOrders: number;
    stockConflictOrders: number;
    confirmedRevenueVnd: number;
    paidOrdersCount: number;
    activeProductCount: number;
    draftProductCount: number;
    lowStockCount: number;
  };
  configurationStatus: {
    storeOpen: boolean;
    bankTransferConfigured: boolean;
    payosConfigured: boolean;
    codEnabled: boolean;
    shippingConfigured: boolean;
  };
  lowStockVariants: {
    variantId: string;
    sku: string;
    variantName: string;
    productName: string;
    productStatus: string;
    onHand: number;
    reserved: number;
    available: number;
    lowStockThreshold: number;
  }[];
  recentOrders: {
    id: string;
    orderCode: string;
    customerName: string;
    recipientName: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalVnd: number;
    boxCount: number;
    createdAt: string;
  }[];
  recentAudit: {
    id: string;
    action: string;
    summary: string;
    createdAt: string;
  }[];
}

export default function AdminShopDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qaBusy, setQaBusy] = useState(false);
  const [qaMessage, setQaMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shop/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (isShopApiSuccess(json) && json.data) {
        setData(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleQaDemo = async (mode: "PUBLISH_SAMPLE_CATALOG" | "REVERT_SAMPLE_TO_DRAFT") => {
    setQaBusy(true);
    setQaMessage(null);
    try {
      const res = await fetch("/api/admin/shop/qa-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (res.ok && isShopApiSuccess(json)) {
        setQaMessage(
          mode === "PUBLISH_SAMPLE_CATALOG"
            ? "Đã kích hoạt sản phẩm mẫu (ACTIVE + nhập 20 tồn thử nghiệm mỗi biến thể) để test luồng."
            : "Đã chuyển toàn bộ sản phẩm đang ACTIVE về DRAFT an toàn.",
        );
        await loadDashboard();
      } else {
        setQaMessage(json?.error?.message || "Chỉ ADMIN mới thực hiện được thao tác QA này.");
      }
    } finally {
      setQaBusy(false);
    }
  };

  if (loading && !data) {
    return <div className="py-16 text-center text-slate-500">Đang tải bảng điều khiển Shop...</div>;
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
        Không thể tải dữ liệu Admin Shop.
      </div>
    );
  }

  const cfg = data.configurationStatus;
  const kpis = data.kpis;
  const hasAnyPayment = cfg.bankTransferConfigured || cfg.payosConfigured || cfg.codEnabled;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Quản trị Cửa hàng quà tặng (Offline + Thiệp QR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi đơn cần đối soát, in mã QR duy nhất từng hộp, kiểm soát tồn kho &amp; cấu hình bán
            thật.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Onboarding & Configuration Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#C85A77]" />
            <span>Trạng thái sẵn sàng mở bán thật</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={qaBusy}
              onClick={() => handleQaDemo("PUBLISH_SAMPLE_CATALOG")}
              className="px-3 py-1.5 rounded-lg bg-[#FFF0F3] hover:bg-[#FFE0E8] text-[#B94A67] text-xs font-semibold disabled:opacity-50"
            >
              Mở catalog mẫu để test QA (+20 tồn/mã)
            </button>
            {kpis.activeProductCount > 0 && (
              <button
                type="button"
                disabled={qaBusy}
                onClick={() => handleQaDemo("REVERT_SAMPLE_TO_DRAFT")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50"
              >
                Đưa sản phẩm về DRAFT
              </button>
            )}
          </div>
        </div>

        {qaMessage && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            {qaMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3.5 flex items-start gap-2.5">
            {kpis.activeProductCount > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-slate-800">
                Sản phẩm mở bán: {kpis.activeProductCount} ACTIVE / {kpis.draftProductCount} DRAFT
              </div>
              <p className="text-slate-500 mt-0.5">
                {kpis.activeProductCount === 0
                  ? "Sản phẩm seed đang ở trạng thái DRAFT & tồn = 0 để tránh bán nhầm hàng demo."
                  : "Có sản phẩm đang hiển thị trên Storefront."}
              </p>
              <Link
                href="/admin/qua-tang/san-pham"
                className="inline-block mt-1 font-semibold text-[#B94A67] hover:underline"
              >
                Nhập hàng &amp; ảnh thật →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3.5 flex items-start gap-2.5">
            {hasAnyPayment ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-slate-800">
                Thanh toán:{" "}
                {[
                  cfg.bankTransferConfigured ? "VietQR Bank" : null,
                  cfg.payosConfigured ? "PayOS" : null,
                  cfg.codEnabled ? "COD" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "Chưa cấu hình"}
              </div>
              <p className="text-slate-500 mt-0.5">
                {cfg.bankTransferConfigured
                  ? "VietQR đang dùng tài khoản ngân hàng do Admin thiết lập."
                  : "Chưa nhập số tài khoản ngân hàng thật hoặc bật COD."}
              </p>
              <Link
                href="/admin/qua-tang/cau-hinh"
                className="inline-block mt-1 font-semibold text-[#B94A67] hover:underline"
              >
                Cấu hình ngân hàng &amp; COD →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3.5 flex items-start gap-2.5">
            {cfg.shippingConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-slate-800">
                Cấu hình phí vận chuyển: {cfg.shippingConfigured ? "Đã xác nhận" : "Đang dùng bảng mặc định"}
              </div>
              <p className="text-slate-500 mt-0.5">
                Cửa hàng hiện {cfg.storeOpen ? "đang mở nhận đơn" : "đang tạm ngưng nhận đơn"}.
              </p>
              <Link
                href="/admin/qua-tang/cau-hinh"
                className="inline-block mt-1 font-semibold text-[#B94A67] hover:underline"
              >
                Chỉnh vùng ship &amp; freeship →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-[#C85A77]" />
            <span>Đơn hôm nay</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.ordersToday}</div>
        </div>

        <Link
          href="/admin/qua-tang/don-hang?status=PAYMENT_REVIEW_REQUESTED"
          className="bg-white rounded-2xl border border-amber-200 p-4 hover:border-amber-400 transition-colors"
        >
          <div className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span>Cần đối soát chuyển khoản</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {kpis.reviewRequestedOrders}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            + {kpis.pendingPaymentOrders} đơn đang chờ khách CK
          </div>
        </Link>

        <Link
          href="/admin/qua-tang/don-hang?status=PAID"
          className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#D46C88]"
        >
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#C85A77]" />
            <span>Cần gói &amp; in QR</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.packingOrders}</div>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Doanh thu đã xác nhận</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {formatVnd(kpis.confirmedRevenueVnd)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{kpis.paidOrdersCount} đơn PAID</div>
        </div>

        <Link
          href="/admin/qua-tang/kho"
          className={`bg-white rounded-2xl border p-4 ${
            kpis.stockConflictOrders > 0 ? "border-rose-300 bg-rose-50/40" : "border-slate-200"
          }`}
        >
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-amber-600" />
            <span>Sắp hết / Cần xử lý kho</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.lowStockCount}</div>
          {kpis.stockConflictOrders > 0 && (
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
              {kpis.stockConflictOrders} đơn tiền về muộn lệch kho!
            </div>
          )}
        </Link>
      </div>

      {/* Recent orders & Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Đơn hàng gần đây</h2>
            <Link
              href="/admin/qua-tang/don-hang"
              className="text-xs font-semibold text-[#B94A67] hover:underline inline-flex items-center gap-1"
            >
              <span>Tất cả đơn hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/qua-tang/don-hang/${o.id}`}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors"
                >
                  <div>
                    <div className="text-sm font-mono font-bold text-slate-900">{o.orderCode}</div>
                    <div className="text-xs text-slate-500">
                      {o.customerName} → {o.recipientName} ({o.boxCount} hộp)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#B94A67]">{formatVnd(o.totalVnd)}</div>
                    <div className="text-[11px] font-medium text-slate-600">
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Cảnh báo tồn kho thấp</h2>
              <Link href="/admin/qua-tang/kho" className="text-xs font-semibold text-[#B94A67]">
                Nhập kho →
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {data.lowStockVariants.slice(0, 6).map((v) => (
                <div
                  key={v.variantId}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-b-0"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-800 truncate">{v.productName}</div>
                    <div className="text-[11px] text-slate-500">
                      {v.sku} • {v.variantName} ({v.productStatus})
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold shrink-0">
                    Còn {v.available}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Nhật ký thao tác mới nhất</h2>
            <div className="space-y-2 text-xs">
              {data.recentAudit.slice(0, 6).map((a) => (
                <div key={a.id} className="text-slate-600 pb-2 border-b border-slate-100 last:border-b-0">
                  <div className="font-medium text-slate-800">{a.summary}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(a.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

