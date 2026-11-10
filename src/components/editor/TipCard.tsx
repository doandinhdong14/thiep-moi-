"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Heart, Loader2, Sparkles, QrCode } from "lucide-react";

const TIP_OPTIONS = [10000, 20000, 50000, 100000];

interface TipCardProps {
  giftId?: string;
}

export default function TipCard({ giftId }: TipCardProps) {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState<string>("30000");
  const [loading, setLoading] = useState(false);

  const amount = isCustom ? parseInt(customInput, 10) || 0 : selectedAmount;

  const handleTip = async () => {
    if (amount < 5000) {
      alert("Số tiền tip tối thiểu là 5.000 VND.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "tip",
          giftId,
          amountVnd: amount,
          returnContext: {
            giftId,
            step: "finish",
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.order?.id) {
        router.push(`/checkout/${data.data.order.id}`);
      } else {
        throw new Error(data?.error?.message || "Không thể tạo đơn ủng hộ.");
      }
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/80 via-rose-50/50 to-orange-50/60 rounded-3xl border border-rose-200/80 shadow-xs space-y-4 text-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-2xl bg-amber-100 text-amber-700">
          <Coffee className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-900">
            Ưng món quà này chứ? Tip shop ly trà sữa nha
          </h4>
          <p className="text-[11px] text-slate-500">
            Sự ủng hộ tự nguyện của bạn giúp chúng mình duy trì máy chủ và sáng tạo thêm nhiều mẫu thiệp đẹp!
          </p>
        </div>
      </div>

      {/* Amount pills */}
      <div className="flex flex-wrap gap-2">
        {TIP_OPTIONS.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              setSelectedAmount(val);
              setIsCustom(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !isCustom && selectedAmount === val
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {val.toLocaleString("vi-VN")}đ
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsCustom(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isCustom
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Số khác
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step={5000}
            min={5000}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Nhập số tiền VND..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 font-mono font-bold"
          />
          <span className="text-xs text-slate-500 font-semibold">VND</span>
        </div>
      )}

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleTip}
        disabled={loading || amount <= 0}
        className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Tip {amount.toLocaleString("vi-VN")}đ qua Chuyển khoản QR ngân hàng</span>
          </>
        )}
      </button>
    </div>
  );
}

