"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Download, RefreshCw, Search } from "lucide-react";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface AdminOrderRow {
  id: string;
  orderCode: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  provinceName: string;
  totalVnd: number;
  needsStockResolution: boolean;
  boxCount: number;
  itemSummary: string;
  trackingCode: string | null;
  carrierName: string | null;
  createdAt: string;
}

export default function AdminShopOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [status, setStatus] = useState(searchParams?.get("status") || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (paymentMethod) qs.set("paymentMethod", paymentMethod);
      if (q.trim()) qs.set("q", q.trim());

      const res = await fetch(`/api/admin/shop/orders?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (isShopApiSuccess(json) && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [status, paymentMethod, q]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Quản lý Đơn hàng &amp; Xử lý QR từng hộp
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Đối soát chuyển khoản thật, khóa thiệp khi đóng gói, in QR độc nhất từng hộp &amp; gắn
            mã vận đơn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/shop/orders?format=csv"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV an toàn</span>
          </a>
          <button
            type="button"
            onClick={loadOrders}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm mã đơn, tên hoặc SĐT người mua / người nhận..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
        >
          <option value="">Tất cả thanh toán</option>
          <option value="bank_transfer">Chuyển khoản VietQR</option>
          <option value="payos">PayOS</option>
          <option value="cod">COD</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Khách / Người nhận</th>
                <th className="py-3 px-4">Hộp quà</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Tổng đơn</th>
                <th className="py-3 px-4 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Đang tải đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Không có đơn hàng nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{o.orderCode}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(o.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        Đặt: {o.customerName} ({o.customerPhone})
                      </div>
                      <div className="text-slate-500">
                        Nhận: {o.recipientName} — {o.provinceName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      <div className="font-semibold text-slate-800">{o.boxCount} hộp QR</div>
                      <div className="truncate">{o.itemSummary}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div
                        className={`inline-block px-2.5 py-0.5 rounded-full font-semibold ${
                          o.status === "PAYMENT_REVIEW_REQUESTED"
                            ? "bg-amber-100 text-amber-800"
                            : o.status === "STOCK_CONFLICT_REFUND_NEEDED"
                              ? "bg-rose-100 text-rose-700"
                              : o.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {o.paymentMethod.toUpperCase()} • {o.paymentStatus}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#B94A67]">
                      {formatVnd(o.totalVnd)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/qua-tang/don-hang/${o.id}`}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF0F3] hover:bg-[#FFE0E8] text-[#B94A67] text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>Mở &amp; In QR</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

