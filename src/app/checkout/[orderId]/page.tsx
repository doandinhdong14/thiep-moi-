"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface PayOSQrInfo {
  orderCode: number;
  paymentLinkId: string;
  qrCode: string;
  qrDataUrl: string;
  bin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  expiredAt?: number;
}

export default function CheckoutOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosQr, setPayosQr] = useState<PayOSQrInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const payosInitAttemptedRef = useRef<string | null>(null);

  const loadOrder = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await fetch(`/api/v1/orders/${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/auth/sign-in?callbackUrl=/checkout/${orderId}`);
            return;
          }
          throw new Error("Không thể tải thông tin đơn hàng.");
        }
        const data = await res.json();
        const loadedOrder = data.data.order;
        setOrder(loadedOrder);
        if (loadedOrder?.payosQr) {
          setPayosQr(loadedOrder.payosQr);
        }
      } catch (err: any) {
        if (!silent) setError(err.message || "Đã xảy ra lỗi.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId, router]
  );

  useEffect(() => {
    if (orderId) {
      payosInitAttemptedRef.current = null;
      setPayosQr(null);
      loadOrder();
    }
  }, [orderId, loadOrder]);

  // Keep payment polling strictly in-app every 3.5 seconds while unpaid
  useEffect(() => {
    if (order && order.status !== "PAID") {
      pollTimerRef.current = setInterval(() => {
        loadOrder(true);
      }, 3500);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [order?.status, loadOrder]);

  const initializeInAppPayOSQr = useCallback(async () => {
    setPayosLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/payos-link`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Không thể khởi tạo mã VietQR tự động.");
      }
      if (data.data?.alreadyPaid) {
        await loadOrder(true);
        return;
      }
      if (data.data?.payosQr) {
        setPayosQr(data.data.payosQr);
      }
    } catch {
      // Fall back quietly to built-in in-app VietQR instructions without interrupting checkout
    } finally {
      setPayosLoading(false);
    }
  }, [orderId, loadOrder]);

  // Automatically generate & render live PayOS VietQR directly inside Ding Dong Gift
  useEffect(() => {
    if (
      order &&
      order.status !== "PAID" &&
      order.payosConfigured &&
      !order.payosQr &&
      !payosQr &&
      payosInitAttemptedRef.current !== order.id
    ) {
      payosInitAttemptedRef.current = order.id;
      initializeInAppPayOSQr();
    }
  }, [order, payosQr, initializeInAppPayOSQr]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCheckPaymentNow = async () => {
    setCheckingStatus(true);
    setError(null);
    await loadOrder(true);
    setCheckingStatus(false);
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
      await loadOrder(true);
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
      await loadOrder(true);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-rose-50/40 via-white to-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <p className="text-xs font-medium text-slate-500">Đang chuẩn bị cổng thanh toán Ding Dong Gift...</p>
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
  const activePayos = payosQr || order.payosQr || null;
  const isPayosActive = Boolean(activePayos?.qrDataUrl);

  const activeQrDataUrl = activePayos?.qrDataUrl || instructions?.qrDataUrl;
  const activeBankName = activePayos?.bankName || instructions?.bankName;
  const activeAccountNumber = activePayos?.accountNumber || instructions?.accountNumber;
  const activeAccountHolder = activePayos?.accountName || instructions?.accountHolder;
  const activeAmount = activePayos?.amount || instructions?.amountVnd || order.totalVnd;
  const activeDescription = activePayos?.description || instructions?.transferSyntax || order.orderNumber;

  const returnGiftId = order.purchaseContext?.giftId || order.lines?.[0]?.referenceId;
  const returnStep = order.purchaseContext?.step;
  const backToHref = returnGiftId
    ? `/editor/${returnGiftId}${returnStep ? `?step=${returnStep}` : ""}`
    : "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-slate-50 to-white py-6 sm:py-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5 sm:space-y-6">
        {/* In-app utility & security trust strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backToHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold shrink-0">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thanh toán trực tiếp tại Ding Dong Gift</span>
          </div>
        </div>
        {/* Order Header Status */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm text-center">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            Thanh toán Đơn hàng #{order.orderNumber}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Quét mã VietQR ngay trên màn hình này để hoàn tất thanh toán — không chuyển trang sang website bên ngoài.
          </p>

          <div className="mt-4 inline-flex items-center gap-2">
            {isPaid ? (
              <span className="bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã thanh toán thành công
              </span>
            ) : isSubmitted ? (
              <span className="bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Đang kiểm tra giao dịch chuyển khoản
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-rose-600" /> Chờ quét mã QR thanh toán
              </span>
            )}
          </div>
        </div>

        {/* Order Summary & Line Items */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chi tiết đơn hàng
          </h2>

          <div className="divide-y divide-slate-100">
            {order.lines.map((line: any) => (
              <div key={line.id} className="py-3 flex justify-between items-center gap-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{line.titleSnapshot}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Số lượng: {line.quantity} × {line.unitPriceVnd.toLocaleString("vi-VN")} đ
                  </div>
                </div>
                <div className="font-mono font-bold text-slate-900 shrink-0">
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

        {/* 100% In-App VietQR Checkout Card */}
        {!isPaid && (
          <div
            data-testid="in-app-vietqr-panel"
            className="bg-white rounded-3xl p-5 sm:p-7 border border-rose-200/80 shadow-md shadow-rose-950/5 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {isPayosActive ? "Quét mã VietQR tự động (PayOS)" : "Quét mã VietQR chuyển khoản nhanh"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isPayosActive
                      ? "Tự động xác nhận & cộng quyền lợi trong 3 giây sau khi chuyển khoản"
                      : "Mở app Ngân hàng bất kỳ và quét mã QR bên dưới"}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isPayosActive ? "Đối soát tự động 24/7" : "VietQR 24/7"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
              {/* Embedded QR Code Column */}
              <div className="flex flex-col items-center bg-gradient-to-b from-rose-50/70 to-white p-4 rounded-2xl border border-rose-100 space-y-3">
                <div className="text-[11px] font-bold tracking-wider uppercase text-rose-600 bg-white px-3 py-1 rounded-full border border-rose-100 shadow-2xs">
                  VIETQR • NAPAS 24/7
                </div>

                <div className="w-52 h-52 bg-white rounded-2xl border border-slate-200/90 p-2.5 flex items-center justify-center shadow-xs">
                  {payosLoading && !activeQrDataUrl ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                      <span className="text-[11px] font-medium">Đang tạo mã QR...</span>
                    </div>
                  ) : activeQrDataUrl ? (
                    <img
                      src={activeQrDataUrl}
                      alt="Mã QR thanh toán VietQR Ding Dong Gift"
                      data-testid="checkout-qr-image"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <QrCode className="w-12 h-12 text-slate-300" />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  {activeQrDataUrl && (
                    <a
                      href={activeQrDataUrl}
                      download={`vietqr-${order.orderNumber}.png`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Lưu ảnh QR</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckPaymentNow}
                    disabled={checkingStatus}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? "animate-spin" : ""}`} />
                    <span>Kiểm tra ngay</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Hệ thống tự động kiểm tra trạng thái thanh toán mỗi 3 giây.
                </p>
              </div>

              {/* Copyable Transfer Details Column */}
              <div className="space-y-3 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="text-[11px] text-slate-400 font-medium">Ngân hàng thụ hưởng</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{activeBankName}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 font-medium">Số tài khoản</div>
                    <div className="font-mono font-bold text-base sm:text-lg text-slate-900 mt-0.5 break-all">
                      {activeAccountNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(activeAccountNumber || ""), "acc")}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                  >
                    {copiedField === "acc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "acc" ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="text-[11px] text-slate-400 font-medium">Chủ tài khoản</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{activeAccountHolder}</div>
                </div>

                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-rose-700 font-medium">Số tiền chính xác</div>
                    <div className="font-mono font-bold text-lg text-rose-600 mt-0.5">
                      {Number(activeAmount).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(activeAmount), "amount")}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                  >
                    {copiedField === "amount" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "amount" ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-amber-800 font-medium">
                      Nội dung chuyển khoản (bắt buộc giữ nguyên)
                    </div>
                    <div className="font-mono font-bold text-base sm:text-lg text-amber-950 mt-0.5 break-all">
                      {activeDescription}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(activeDescription || ""), "syntax")}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                  >
                    {copiedField === "syntax" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "syntax" ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>
              </div>
            </div>

            {message && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* In-app manual confirmation & sandbox test actions */}
            <div className="pt-2 space-y-2.5">
              {!isSubmitted ? (
                <button
                  type="button"
                  onClick={handleMarkSubmitted}
                  disabled={submitting}
                  data-testid="mark-transfer-submitted-btn"
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi xác nhận...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Tôi đã chuyển khoản — kiểm tra &amp; kích hoạt
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs text-slate-600">
                  Đã ghi nhận thông báo chuyển khoản. Trang này sẽ tự động cập nhật ngay khi giao dịch được xác nhận.
                </div>
              )}

              {order.allowSandboxSimulation && (
                <button
                  type="button"
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
              )}
            </div>
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
              <h3 className="text-lg font-bold text-emerald-950">{successMsg}</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Quyền lợi của bạn đã được kích hoạt tự động trên hệ thống Ding Dong Gift.
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
