"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Boxes, PlusCircle, RefreshCw, X } from "lucide-react";
import { formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface InventoryVariantRow {
  variantId: string;
  sku: string;
  variantName: string;
  priceVnd: number;
  isActive: boolean;
  productId: string;
  productName: string;
  productStatus: string;
  categoryName: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

interface InventoryMovementRow {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  type: string;
  deltaOnHand: number;
  deltaReserved: number;
  onHandAfter: number;
  reservedAfter: number;
  orderId: string | null;
  reason: string;
  createdAt: string;
}

export default function AdminShopInventoryPage() {
  const [variants, setVariants] = useState<InventoryVariantRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [adjustTarget, setAdjustTarget] = useState<InventoryVariantRow | null>(null);
  const [adjustType, setAdjustType] = useState<"IMPORT" | "ADJUST">("IMPORT");
  const [deltaOnHand, setDeltaOnHand] = useState<string>("10");
  const [lowThreshold, setLowThreshold] = useState<string>("5");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shop/inventory", { cache: "no-store" });
      const json = await res.json();
      if (isShopApiSuccess(json) && json.data) {
        setVariants(json.data.variants || []);
        setMovements(json.data.movements || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (v: InventoryVariantRow) => {
    setAdjustTarget(v);
    setAdjustType("IMPORT");
    setDeltaOnHand("10");
    setLowThreshold(String(v.lowStockThreshold));
    setReason("Nhập hàng thực tế tại kho");
    setErrorMsg(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/shop/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: adjustTarget.variantId,
          deltaOnHand: Number(deltaOnHand),
          type: adjustType,
          reason: reason.trim(),
          lowStockThreshold: Number(lowThreshold),
        }),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Không thể điều chỉnh tồn kho.");
        return;
      }
      setAdjustTarget(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Quản lý tồn kho &amp; Giữ chỗ (Anti-oversell)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tồn khả dụng = Thực tế (On-Hand) − Đang giữ chờ thanh toán (Reserved). Mọi biến động
            đều được ghi sổ cái.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <th className="py-3 px-4">SKU / Sản phẩm</th>
                <th className="py-3 px-4">Trạng thái SP</th>
                <th className="py-3 px-4 text-right">Giá bán</th>
                <th className="py-3 px-4 text-right">Thực tế</th>
                <th className="py-3 px-4 text-right">Đang giữ</th>
                <th className="py-3 px-4 text-right">Khả dụng</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Đang tải tồn kho...
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.variantId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{v.productName}</div>
                      <div className="text-xs text-slate-500">
                        <span className="font-mono">{v.sku}</span> • {v.variantName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          v.productStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {v.productStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {formatVnd(v.priceVnd)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {v.onHand}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-700 font-medium">
                      {v.reserved}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          v.available === 0
                            ? "bg-rose-50 text-rose-700"
                            : v.isLowStock
                              ? "bg-amber-50 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {v.available}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(v)}
                        className="px-3 py-1.5 rounded-lg bg-[#FFF0F3] hover:bg-[#FFE0E8] text-[#B94A67] text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Nhập / Chỉnh kho</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-[#C85A77]" />
          <span>Lịch sử biến động kho gần nhất</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3">Thời gian</th>
                <th className="py-2 pr-3">SKU / Sản phẩm</th>
                <th className="py-2 pr-3">Loại</th>
                <th className="py-2 pr-3 text-right">Δ Thực tế</th>
                <th className="py-2 pr-3 text-right">Δ Giữ chỗ</th>
                <th className="py-2 pr-3 text-right">Sau GD</th>
                <th className="py-2">Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                    {new Date(m.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-mono font-semibold text-slate-800">{m.sku}</span> —{" "}
                    {m.variantName}
                  </td>
                  <td className="py-2 pr-3 font-mono">{m.type}</td>
                  <td
                    className={`py-2 pr-3 text-right font-semibold ${
                      m.deltaOnHand > 0
                        ? "text-emerald-700"
                        : m.deltaOnHand < 0
                          ? "text-rose-600"
                          : "text-slate-400"
                    }`}
                  >
                    {m.deltaOnHand > 0 ? `+${m.deltaOnHand}` : m.deltaOnHand}
                  </td>
                  <td className="py-2 pr-3 text-right text-amber-700">
                    {m.deltaReserved > 0 ? `+${m.deltaReserved}` : m.deltaReserved}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-700">
                    {m.onHandAfter} ({m.reservedAfter} giữ)
                  </td>
                  <td className="py-2 text-slate-600">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Nhập / Điều chỉnh tồn kho
                </h3>
                <p className="text-xs text-slate-500">
                  {adjustTarget.productName} ({adjustTarget.sku} — {adjustTarget.variantName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loại thao tác
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as "IMPORT" | "ADJUST")}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="IMPORT">IMPORT (Nhập thêm lô hàng)</option>
                  <option value="ADJUST">ADJUST (Kiểm kê / điều chỉnh tăng giảm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số lượng thay đổi (âm để trừ bớt) *
                </label>
                <input
                  type="number"
                  required
                  value={deltaOnHand}
                  onChange={(e) => setDeltaOnHand(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hiện có: {adjustTarget.onHand} thực tế ({adjustTarget.reserved} đang giữ).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngưỡng cảnh báo tồn thấp
                </label>
                <input
                  type="number"
                  min={0}
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do (bắt buộc để lưu Audit) *
                </label>
                <input
                  required
                  minLength={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Nhập thêm 30 chiếc khăn lông thỏ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#C85A77] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Xác nhận lưu kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

