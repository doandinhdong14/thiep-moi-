"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  QrCode,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function CheckoutOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosData, setPayosData] = useState<{ checkoutUrl: string; qrCode?: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadOrder = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/sign-in?callbackUrl=/checkout/${orderId}`);
          return;
        }
        throw new Error("Không thể tải thông tin đơn hàng.");
      }
      const data = await res.json();
      setOrder(data.data.order);
    } catch (err: any) {
      if (!silent) setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  // Real-time polling when order is UNPAID or TRANSFER_SUBMITTED
  useEffect(() => {
    if (order && order.status !== "PAID") {
      pollTimerRef.current = setInterval(() => {
        loadOrder(true);
      }, 3500);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [order?.status]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayOSCheckout = async () => {
    setPayosLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/payos-link`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Không thể khởi tạo cổng PayOS.");
      }
      if (data.data?.checkoutUrl) {
        setPayosData({
          checkoutUrl: data.data.checkoutUrl,
          qrCode: data.data.qrCode,
        });
        // Direct redirect to PayOS checkout page
        window.location.href = data.data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi kết nối PayOS.");
    } finally {
      setPayosLoading(false);
    }
  };

  const handleMarkSubmitted = async () => {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/mark-transfer-submitted`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Không thể gửi xác nhận.");
      }
      setMessage(data.data.message);
      loadOrder(true);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    setSimulating(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/simulate-payment`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Không thể thực hiện thanh toán thử nghiệm.");
      }
      loadOrder(true);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link
          href="/pricing"
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition"
        >
          Quay lại Bảng giá
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "PAID";
  const isSubmitted = order.status === "TRANSFER_SUBMITTED";
  const instructions = order.paymentInstructions;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center">
          <div className="inline-flex p-3 rounded-2xl bg-rose-50 text-rose-600 mb-3">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Thanh toán Đơn hàng #{order.orderNumber}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quét mã VietQR tự động qua PayOS hoặc chuyển khoản ngân hàng để kích hoạt ngay.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold">
            {isPaid ? (
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã thanh toán thành công
              </span>
            ) : isSubmitted ? (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Đang chờ duyệt đối soát
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                Chờ thanh toán
              </span>
            )}
          </div>
        </div>

        {/* Order Summary & Line Items */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Chi tiết đơn hàng
          </h2>

          <div className="divide-y divide-slate-100">
            {order.lines.map((line: any) => (
              <div key={line.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{line.titleSnapshot}</div>
                  <div className="text-xs text-slate-400">Số lượng: {line.quantity}</div>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  {line.totalVnd.toLocaleString("vi-VN")} đ
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-base font-bold text-slate-900">
            <span>Tổng cộng thanh toán:</span>
            <span className="text-xl text-rose-600 font-mono" data-testid="order-total-amount">
              {order.totalVnd.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* PayOS Automated VietQR Checkout Card */}
        {!isPaid && (
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/20 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Thanh toán tự động qua PayOS (VietQR)</h3>
                  <p className="text-xs text-indigo-200">Kích hoạt tài khoản tức thì sau 3 giây</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30">
                Tự động 24/7
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hỗ trợ quét mã VietQR trên mọi ứng dụng ngân hàng (Vietcombank, MB, Techcombank, VPBank, TPBank, Momo,...). Không cần nhập số tiền hay nội dung chuyển khoản.
            </p>

            <button
              onClick={handlePayOSCheckout}
              disabled={payosLoading}
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold text-sm shadow-lg shadow-rose-900/50 transition-all flex items-center justify-center gap-2"
            >
              {payosLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang kết nối cổng PayOS...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Mở Cổng Thanh Toán VietQR (PayOS)</span>
                  <ExternalLink className="w-4 h-4 ml-1 opacity-75" />
                </>
              )}
            </button>

            {payosData?.checkoutUrl && (
              <div className="text-center pt-2">
                <a
                  href={payosData.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-300 hover:text-white underline inline-flex items-center gap-1"
                >
                  Nhấn vào đây nếu trang thanh toán không tự động mở
                </a>
              </div>
            )}
          </div>
        )}

        {/* Fallback Bank Transfer Details */}
        {!isPaid && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Phương thức 2: Chuyển khoản ngân hàng thủ công</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-400 font-medium">Ngân hàng thụ hưởng</div>
                <div className="font-semibold text-slate-800 mt-1">{instructions.bankName}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                <div className="text-xs text-slate-400 font-medium">Số tài khoản</div>
                <div className="font-mono font-bold text-lg text-slate-900 mt-1">
                  {instructions.accountNumber}
                </div>
                <button
                  onClick={() => handleCopy(instructions.accountNumber, "acc")}
                  className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1"
                >
                  {copiedField === "acc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === "acc" ? "Đã chép" : "Chép"}
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-400 font-medium">Chủ tài khoản</div>
                <div className="font-semibold text-slate-800 mt-1">{instructions.accountHolder}</div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 relative">
                <div className="text-xs text-amber-700 font-medium">Nội dung chuyển khoản (bắt buộc)</div>
                <div className="font-mono font-bold text-lg text-amber-900 mt-1">
                  {instructions.transferSyntax}
                </div>
                <button
                  onClick={() => handleCopy(instructions.transferSyntax, "syntax")}
                  className="absolute top-4 right-4 text-amber-800 hover:text-amber-950 text-xs font-semibold flex items-center gap-1"
                >
                  {copiedField === "syntax" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === "syntax" ? "Đã chép" : "Chép"}
                </button>
              </div>
            </div>

            {message && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            {!isSubmitted && (
              <div className="space-y-2">
                <button
                  onClick={handleMarkSubmitted}
                  disabled={submitting}
                  data-testid="mark-transfer-submitted-btn"
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi xác nhận...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Tôi đã chuyển khoản — kiểm tra trạng thái
                    </>
                  )}
                </button>

                {/* Sandbox test button */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  data-testid="simulate-payment-btn"
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  {simulating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>Mô phỏng thanh toán thành công (Sandbox Test)</span>
                </button>
              </div>
            )}

            {isSubmitted && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs text-slate-600">
                  Bạn đã gửi thông báo chuyển khoản. Quản trị viên sẽ đối soát giao dịch và kích hoạt cho bạn.
                </div>
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  {simulating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>Mô phỏng thanh toán thành công (Sandbox Test)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {isPaid && (() => {
          const context = order.purchaseContext || {};
          const giftId = context.giftId || order.lines?.[0]?.referenceId;
          const purpose = order.purpose || context.purpose;

          let targetUrl = "/dashboard";
          let ctaText = "Về Bảng điều khiển (Dashboard)";
          let successMsg = "Đơn hàng đã được thanh toán thành công!";

          if (purpose === "image_credits") {
            targetUrl = giftId ? `/editor/${giftId}?step=images&paid=image_credits` : "/editor";
            ctaText = "Tiếp tục thêm ảnh";
            successMsg = "Đã cộng thêm lượt tải ảnh vào tài khoản của bạn!";
          } else if (purpose === "audio_credits") {
            targetUrl = giftId ? `/editor/${giftId}?step=audio&paid=audio_credits` : "/editor";
            ctaText = "Tiếp tục thêm nhạc";
            successMsg = "Đã cộng thêm lượt tải nhạc vào tài khoản của bạn!";
          } else if (purpose === "gift_unlock") {
            targetUrl = giftId ? `/editor/${giftId}?step=finish&paid=gift_unlock` : "/dashboard";
            ctaText = "Lấy link & tải mã QR";
            successMsg = "Món quà đã sẵn sàng! Mở khóa thiệp thành công.";
          } else if (purpose === "gift_renewal") {
            targetUrl = giftId ? `/editor/${giftId}?step=finish&paid=gift_renewal` : "/dashboard";
            ctaText = "Xem món quà đã gia hạn";
            successMsg = "Đã gia hạn thời hạn món quà thành công!";
          } else if (purpose === "tip") {
            targetUrl = giftId ? `/editor/${giftId}?step=finish&paid=tip` : "/";
            ctaText = "Quay lại món quà";
            successMsg = "Cảm ơn bạn đã ủng hộ Ding Dong Gift! Chúc bạn và người thương luôn hạnh phúc.";
          }

          return (
            <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-950">
                {successMsg}
              </h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Quyền lợi của bạn đã được kích hoạt tự động trên hệ thống.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={targetUrl}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-full shadow-md transition"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-full hover:bg-slate-50 transition"
                >
                  <span>Về Dashboard</span>
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
