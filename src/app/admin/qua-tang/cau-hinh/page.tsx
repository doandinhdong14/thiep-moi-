"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { VIETQR_BANKS } from "@/lib/payments/vietqr";
import { isShopApiSuccess, type ShopSettings } from "@/lib/shop/types";

export default function AdminShopSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shop/settings", { cache: "no-store" });
      const json = await res.json();
      if (isShopApiSuccess(json) && json.data) {
        setSettings(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setBanner(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/shop/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(
          json?.error?.message || "Lưu cấu hình thất bại (chỉ ADMIN mới có quyền lưu).",
        );
        return;
      }
      setSettings(json.data);
      setBanner("Đã lưu cấu hình Cửa hàng quà thành công!");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return <div className="py-16 text-center text-slate-500">Đang tải cấu hình...</div>;
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        Không thể tải cấu hình.
      </div>
    );
  }

  const bankReady = Boolean(
    settings.bankTransfer.enabled &&
      settings.bankTransfer.bankCode &&
      settings.bankTransfer.accountNo &&
      settings.bankTransfer.accountName,
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Cấu hình Thanh toán, Vận chuyển &amp; Chính sách Shop
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Thiết lập số tài khoản nhận chuyển khoản VietQR thật, hạn mức COD, bảng phí ship theo
            vùng &amp; mã ưu đãi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSettings}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải lại</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Đang lưu..." : "Lưu cấu hình"}</span>
          </button>
        </div>
      </div>

      {banner && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Storefront Status & Announcement */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">1. Trạng thái Storefront &amp; Thông báo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex items-center gap-2 font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={settings.storeOpen}
              onChange={(e) => setSettings({ ...settings, storeOpen: e.target.checked })}
            />
            <span>Đang mở bán &amp; nhận đơn đặt hàng (Storefront Open)</span>
          </label>
          <label className="flex items-center gap-2 font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={settings.allowShopManagerPaymentReview}
              onChange={(e) =>
                setSettings({ ...settings, allowShopManagerPaymentReview: e.target.checked })
              }
            />
            <span>Cho phép SHOP_MANAGER xác nhận đối soát tiền</span>
          </label>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên thương hiệu Shop</label>
            <input
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Thông báo khi tạm ngừng nhận đơn
            </label>
            <input
              value={settings.pauseMessage}
              onChange={(e) => setSettings({ ...settings, pauseMessage: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.announcementBar.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcementBar: { ...settings.announcementBar, enabled: e.target.checked },
                  })
                }
              />
              <span>Hiện thanh thông báo top</span>
            </label>
            <input
              value={settings.announcementBar.text}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcementBar: { ...settings.announcementBar, text: e.target.value },
                })
              }
              placeholder="Nội dung thanh thông báo..."
              className="px-3 py-2 rounded-xl border border-slate-300"
            />
            <input
              value={settings.announcementBar.href}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcementBar: { ...settings.announcementBar, href: e.target.value },
                })
              }
              placeholder="Đường dẫn (tùy chọn, VD: /qua-tang/tat-ca)"
              className="px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
        </div>
      </section>

      {/* Bank Transfer VietQR, PayOS, COD */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            2. Chuyển khoản VietQR chính chủ, PayOS &amp; COD
          </h2>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              bankReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            {bankReady ? "VietQR đã đủ thông tin" : "Chưa nhập đủ STK ngân hàng thật"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="sm:col-span-2 flex items-center gap-2 font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={settings.bankTransfer.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankTransfer: { ...settings.bankTransfer, enabled: e.target.checked },
                })
              }
            />
            <span>Bật phương thức Chuyển khoản ngân hàng (VietQR đối soát Admin)</span>
          </label>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ngân hàng (VietQR)</label>
            <select
              value={settings.bankTransfer.bankCode}
              onChange={(e) => {
                const chosen = VIETQR_BANKS.find((b) => b.code === e.target.value);
                setSettings({
                  ...settings,
                  bankTransfer: {
                    ...settings.bankTransfer,
                    bankCode: e.target.value,
                    bankName: chosen?.name || settings.bankTransfer.bankName,
                  },
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              <option value="">-- Chọn ngân hàng --</option>
              {VIETQR_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị ngân hàng</label>
            <input
              value={settings.bankTransfer.bankName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankTransfer: { ...settings.bankTransfer, bankName: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số tài khoản nhận tiền</label>
            <input
              value={settings.bankTransfer.accountNo}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankTransfer: { ...settings.bankTransfer, accountNo: e.target.value },
                })
              }
              placeholder="Ví dụ: 1903..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên chủ tài khoản (VIẾT HOA KHÔNG DẤU)
            </label>
            <input
              value={settings.bankTransfer.accountName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankTransfer: { ...settings.bankTransfer, accountName: e.target.value },
                })
              }
              placeholder="NGUYEN VAN A"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase"
            />
          </div>

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={settings.payosEnabled}
                onChange={(e) => setSettings({ ...settings, payosEnabled: e.target.checked })}
              />
              <span>Cho phép cổng PayOS (nếu có ENV)</span>
            </label>
            <label className="flex items-center gap-2 font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={settings.cod.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cod: { ...settings.cod, enabled: e.target.checked },
                  })
                }
              />
              <span>Bật COD khi nhận hàng</span>
            </label>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hạn mức tối đa COD (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                value={settings.cod.maxOrderTotalVnd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cod: { ...settings.cod, maxOrderTotalVnd: Number(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Shipping zones */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            3. Vận chuyển, Freeship &amp; Giữ chỗ tồn kho
          </h2>
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={settings.shipping.configured}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  shipping: { ...settings.shipping, configured: e.target.checked },
                })
              }
            />
            <span>Đánh dấu đã rà soát bảng phí vận chuyển</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Ngưỡng Freeship chuẩn (VNĐ)
            </label>
            <input
              type="number"
              min={0}
              value={settings.shipping.freeshipThresholdVnd ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  shipping: {
                    ...settings.shipping,
                    freeshipThresholdVnd: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kho xuất phát</label>
            <input
              value={settings.shipping.originCity}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  shipping: { ...settings.shipping, originCity: e.target.value },
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              TTL giữ chỗ chờ thanh toán (phút)
            </label>
            <input
              type="number"
              min={5}
              max={1440}
              value={settings.inventory.reservationTtlMinutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  inventory: {
                    ...settings.inventory,
                    reservationTtlMinutes: Number(e.target.value) || 30,
                  },
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {settings.shipping.zones.map((z, idx) => (
            <div
              key={z.zone}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center"
            >
              <div className="font-mono font-bold text-slate-700">{z.zone}</div>
              <input
                value={z.label}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      zones: settings.shipping.zones.map((row, i) =>
                        i === idx ? { ...row, label: e.target.value } : row,
                      ),
                    },
                  })
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
              <input
                type="number"
                value={z.feeVnd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      zones: settings.shipping.zones.map((row, i) =>
                        i === idx ? { ...row, feeVnd: Number(e.target.value) || 0 } : row,
                      ),
                    },
                  })
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
              <input
                value={z.estimatedDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: {
                      ...settings.shipping,
                      zones: settings.shipping.zones.map((row, i) =>
                        i === idx ? { ...row, estimatedDays: e.target.value } : row,
                      ),
                    },
                  })
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Promo codes */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">4. Mã ưu đãi đơn hàng</h2>
          <button
            type="button"
            onClick={() =>
              setSettings({
                ...settings,
                promoCodes: [
                  ...settings.promoCodes,
                  {
                    code: `QTT${Date.now().toString().slice(-3)}`,
                    label: "Ưu đãi mới",
                    discountType: "FIXED_VND",
                    discountValue: 20000,
                    minSubtotalVnd: 200000,
                    maxDiscountVnd: null,
                    isActive: true,
                  },
                ],
              })
            }
            className="text-[#B94A67] font-semibold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mã ưu đãi</span>
          </button>
        </div>

        <div className="space-y-2">
          {settings.promoCodes.map((p, idx) => (
            <div
              key={`${p.code}-${idx}`}
              className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2.5 rounded-xl border border-slate-200 items-center"
            >
              <input
                value={p.code}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoCodes: settings.promoCodes.map((row, i) =>
                      i === idx ? { ...row, code: e.target.value.toUpperCase() } : row,
                    ),
                  })
                }
                className="px-2 py-1.5 rounded-lg border border-slate-300 font-mono uppercase"
              />
              <input
                value={p.label}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoCodes: settings.promoCodes.map((row, i) =>
                      i === idx ? { ...row, label: e.target.value } : row,
                    ),
                  })
                }
                className="px-2 py-1.5 rounded-lg border border-slate-300"
              />
              <select
                value={p.discountType}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoCodes: settings.promoCodes.map((row, i) =>
                      i === idx
                        ? { ...row, discountType: e.target.value as "PERCENT" | "FIXED_VND" }
                        : row,
                    ),
                  })
                }
                className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="FIXED_VND">Giảm VNĐ</option>
                <option value="PERCENT">Giảm %</option>
              </select>
              <input
                type="number"
                value={p.discountValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoCodes: settings.promoCodes.map((row, i) =>
                      i === idx ? { ...row, discountValue: Number(e.target.value) || 0 } : row,
                    ),
                  })
                }
                className="px-2 py-1.5 rounded-lg border border-slate-300"
              />
              <input
                type="number"
                value={p.minSubtotalVnd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoCodes: settings.promoCodes.map((row, i) =>
                      i === idx ? { ...row, minSubtotalVnd: Number(e.target.value) || 0 } : row,
                    ),
                  })
                }
                placeholder="Đơn tối thiểu"
                className="px-2 py-1.5 rounded-lg border border-slate-300"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={p.isActive}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promoCodes: settings.promoCodes.map((row, i) =>
                          i === idx ? { ...row, isActive: e.target.checked } : row,
                        ),
                      })
                    }
                  />
                  <span>Bật</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      promoCodes: settings.promoCodes.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

