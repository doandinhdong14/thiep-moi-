"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Plus, Minus, Loader2, Sparkles } from "lucide-react";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "image_credits" | "audio_credits";
  giftId?: string;
}

export default function BuyCreditsModal({
  isOpen,
  onClose,
  type,
  giftId,
}: BuyCreditsModalProps) {
  const router = useRouter();
  const isImage = type === "image_credits";
  const unitPrice = isImage ? 2000 : 10000;
  const defaultQty = isImage ? 10 : 1;
  const minQty = 1;
  const maxQty = 100;

  const [quantity, setQuantity] = useState<number>(defaultQty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = quantity * unitPrice;

  const handleCheckout = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: type,
          giftId,
          quantity,
          returnContext: {
            giftId,
            step: isImage ? "images" : "audio",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Không thể tạo đơn hàng thanh toán.");
      }

      const orderId = data.data?.order?.id;
      if (orderId) {
        onClose();
        router.push(`/checkout/${orderId}`);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-rose-50 text-rose-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isImage ? "Mua thêm ảnh" : "Mua thêm lượt tải nhạc"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isImage
                  ? "Đơn giá: 2.000 VND / ảnh"
                  : "Đơn giá: 10.000 VND / bài nhạc"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quantity Stepper */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">
            Số lượng {isImage ? "lượt ảnh" : "bài nhạc"}:
          </label>
          <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              disabled={quantity <= minQty}
              onClick={() => setQuantity((q) => Math.max(q - 1, minQty))}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition shadow-xs"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={minQty}
              max={maxQty}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setQuantity(Math.min(Math.max(val, minQty), maxQty));
              }}
              className="w-20 text-center font-bold font-mono text-lg bg-transparent focus:outline-none"
            />
            <button
              type="button"
              disabled={quantity >= maxQty}
              onClick={() => setQuantity((q) => Math.min(q + 1, maxQty))}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Tổng thanh toán:</span>
          <span className="text-lg font-bold font-mono text-rose-600">
            {total.toLocaleString("vi-VN")} VND
          </span>
        </div>

        {/* Note */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Lượt tải sẽ được tự động cộng vào tài khoản của bạn ngay sau khi hoàn tất thanh toán.
          </span>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Thanh toán</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

