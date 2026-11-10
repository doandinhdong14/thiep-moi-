"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function AbuseReportPage({
  params,
}: {
  params: { publicId: string };
}) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/public/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "INVITATION",
          targetId: params.publicId,
          reporterEmail: email || undefined,
          reason,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể gửi báo cáo lúc này. Vui lòng thử lại.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <Link
          href="/"
          className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>

        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Báo cáo nội dung vi phạm
          </h1>
          <p className="text-xs text-slate-500">
            Mã định danh nội dung: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{params.publicId}</code>
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
            <h3 className="text-base font-bold text-slate-800">Báo cáo đã được tiếp nhận</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Đội ngũ kiểm duyệt Ding Dong Gift sẽ xem xét nội dung và có biện pháp xử lý kịp thời theo chính sách nền tảng.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do báo cáo vi phạm *
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mô tả cụ thể hành vi vi phạm (ví dụ: mạo danh, spam, lừa đảo, hình ảnh không có sự cho phép...)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email của bạn (Tùy chọn để nhận kết quả phản hồi)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi báo cáo vi phạm"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

