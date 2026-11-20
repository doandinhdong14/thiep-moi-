"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PlanSelectButtonProps {
  planCode: string;
  isFree: boolean;
  isFeatured: boolean;
}

export default function PlanSelectButton({
  planCode,
  isFree,
  isFeatured,
}: PlanSelectButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (isFree) {
      router.push("/products");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/sign-in?callbackUrl=/pricing`);
          return;
        }
        const data = await res.json();
        alert(data.error?.message || "Không thể tạo đơn hàng thanh toán.");
        return;
      }

      const data = await res.json();
      router.push(`/checkout/${data.data.order.id}`);
    } catch (err: any) {
      alert("Đã xảy ra lỗi khi tạo đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      data-testid={`select-plan-${planCode.toLowerCase()}-btn`}
      className={`w-full py-3 rounded-full text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 ${
        isFeatured
          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
          : "bg-slate-900 hover:bg-slate-800 text-white"
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo đơn...
        </>
      ) : isFree ? (
        "Bắt đầu miễn phí"
      ) : (
        "Chọn gói này"
      )}
    </button>
  );
}

