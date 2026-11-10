"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, X, Check, Loader2, Sparkles, ShieldCheck } from "lucide-react";

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftId: string;
  giftTitle: string;
  expiresAt?: string | null;
}

const RENEWAL_PLANS = [
  {
    id: "month_1",
    name: "Gia hạn thêm 1 tháng",
    duration: "30 ngày",
    priceVnd: 19000,
    desc: "Phù hợp để tiếp tục lưu giữ kỷ niệm cho dịp đặc biệt",
  },
  {
    id: "year_1",
    name: "Gia hạn thêm 1 năm (Khuyên dùng)",
    duration: "365 ngày",
    priceVnd: 39000,
    desc: "Tiết kiệm 80%, đường link và QR hoạt động trọn vẹn 1 năm",
    badge: "Phổ biến nhất",
  },
];

export default function RenewalModal({
  isOpen,
  onClose,
  giftId,
  giftTitle,
  expiresAt,
}: RenewalModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>("year_1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlan = RENEWAL_PLANS.find((p) => p.id === selectedPlan) || RENEWAL_PLANS[1];

  const handleRenewalCheckout = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "gift_renewal",
          giftId,
          amountVnd: currentPlan.priceVnd,
          returnContext: {
            giftId,
            step: "finish",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Không thể tạo đơn gia hạn.");
      }

      const orderId = data.data?.order?.id;
      if (orderId) {
        onClose();
        router.push(`/checkout/${orderId}`);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSubmitting(false);
    }
  };

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "30 ngày kể từ kích hoạt";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Gia hạn / Nâng cấp món quà</h3>
              <p className="text-[11px] text-slate-400">Giữ link và mã QR đã gửi luôn hoạt động</p>
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

        {/* Current status */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex justify-between items-center">
          <span className="text-slate-500">Hạn sử dụng hiện tại:</span>
          <span className="font-bold text-indigo-600 font-mono">{formattedExpiry}</span>
        </div>

        {/* Plan selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700">Chọn gói gia hạn:</label>
          <div className="space-y-2">
            {RENEWAL_PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-rose-500 bg-rose-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-xs text-slate-900">{plan.name}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-rose-600">
                      {plan.priceVnd.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6 leading-relaxed">
                    {plan.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guarantee note */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Đường link và mã QR đã in/gửi cho người ấy được bảo toàn tuyệt đối, không thay đổi.
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
            Đóng
          </button>
          <button
            type="button"
            onClick={handleRenewalCheckout}
            disabled={submitting}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Thanh toán {currentPlan.priceVnd.toLocaleString("vi-VN")}đ</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

