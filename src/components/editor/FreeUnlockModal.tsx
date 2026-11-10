"use client";

import { useState } from "react";
import { Gift, X, Sparkles, Loader2, CheckCircle2 } from "lucide-react";

interface FreeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitationId: string;
  giftTitle: string;
  onSuccess: (data: { publicUrl: string; shortUrl: string; expiresAt: string }) => void;
}

export default function FreeUnlockModal({
  isOpen,
  onClose,
  invitationId,
  giftTitle,
  onSuccess,
}: FreeUnlockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/unlock`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Không thể mở khóa thiệp.");
      }

      onSuccess({
        publicUrl: data.data.publicUrl,
        shortUrl: data.data.shortUrl,
        expiresAt: data.data.expiresAt,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi mở khóa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-rose-50 text-rose-600">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Hoàn tất mở khóa</h3>
              <p className="text-[11px] text-slate-400">Sẵn sàng xuất bản món quà</p>
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

        {/* Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Món quà:</span>
            <span className="font-semibold text-slate-900 line-clamp-1 max-w-[180px]">
              {giftTitle}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Thời hạn gói:</span>
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              1 tháng (30 ngày)
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-sm font-bold">
            <span>Tổng cộng:</span>
            <span className="text-emerald-600 font-mono text-base">Miễn phí / 0đ</span>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Xem trước thiệp sống động với đầy đủ hiệu ứng</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Nhận đường link công khai riêng tư gửi cho người thương</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Thiết kế và tải mã QR nghệ thuật chất lượng cao</span>
          </div>
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
            Để sau
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang mở khóa...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mở khóa miễn phí</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

