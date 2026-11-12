"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { ORDER_STATUS_LABELS, formatVnd, isShopApiSuccess } from "@/lib/shop/types";

interface PaymentStatusData {
  orderCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalVnd: number;
  reservationExpiresAt: string | null;
  paidAt: string | null;
  qrDataUrl: string | null;
  transferContent: string | null;
  checkoutUrl: string | null;
  bankDetails: {
    bankCode: string;
    bankName: string;
    accountNo: string;
    accountName: string;
    branch?: string;
    instructions?: string;
  } | null;
}

function formatCountdown(targetIso: string | null, nowMs: number): string | null {
  if (!targetIso) return null;
  const diff = Math.max(0, new Date(targetIso).getTime() - nowMs);
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ShopOrderPaymentPage() {
  const params = useParams<{ orderCode: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderCode = (params?.orderCode || "").toUpperCase();
  const tokenParam = searchParams?.get("token") || "";
  const tokenQuery = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : "";

  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifyContact, setVerifyContact] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [reviewNote, setReviewNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/shop/orders/${encodeURIComponent(orderCode)}/payment-status${tokenQuery}`,
        { cache: "no-store" },
      );
      if (res.status === 403) {
        setNeedsVerify(true);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (res.ok && isShopApiSuccess(json) && json.data) {
        setNeedsVerify(false);
        setData(json.data);
      }
    } catch {
      // keep previous state silently during polling
    } finally {
      setLoading(false);
    }
  }, [orderCode, tokenQuery]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll every 5s while waiting for payment/reconciliation
  useEffect(() => {
    if (!data) return;
    if (!["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(data.status)) {
      return;
    }
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [data, fetchStatus]);

  const handleCopy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleRequestReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await fetch(
        `/api/shop/orders/${encodeURIComponent(orderCode)}/payment-review${tokenQuery}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: reviewNote.trim() || undefined }),
        },
      );
      const json = await res.json();
      if (res.ok && isShopApiSuccess(json)) {
        setReviewMessage(
          json.data?.message ||
            "Đã gửi yêu cầu đối soát chuyển khoản. Admin sẽ kiểm tra và xác nhận đơn hàng.",
        );
        await fetchStatus();
      } else {
        setReviewMessage(json?.error?.message || "Không thể gửi yêu cầu đối soát.");
      }
    } catch {
      setReviewMessage("Lỗi kết nối máy chủ.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLookupUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    const res = await fetch("/api/shop/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode, contact: verifyContact.trim() }),
    });
    const json = await res.json();
    if (!res.ok || !isShopApiSuccess(json)) {
      setVerifyError(json?.error?.message || "Thông tin xác nhận chưa khớp với đơn hàng.");
      return;
    }
    await fetchStatus();
  };

  const isPaid =
    data?.paymentStatus === "PAID" ||
    ["CONFIRMED", "PACKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "COMPLETED"].includes(
      data?.status || "",
    );

  const countdown = formatCountdown(data?.reservationExpiresAt || null, nowMs);

  return (
    <ShopShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={`/qua-tang/don-hang/${orderCode}${tokenQuery}`}
              className="text-xs font-medium text-[#B94A67] hover:underline inline-flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem chi tiết đơn {orderCode}</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D]">
              Thanh toán đơn quà {orderCode}
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            className="px-3.5 py-2 rounded-xl border border-[#E7C6CF] bg-white text-xs font-medium text-[#3E2A2D] hover:bg-[#FFF5F7] inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới trạng thái</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-12 text-center text-[#6E555A]">
            Đang tải thông tin thanh toán...
          </div>
        ) : needsVerify ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-6 sm:p-8 max-w-md mx-auto">
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Xác thực quyền xem thanh toán
            </h2>
            <p className="text-xs text-[#6E555A] mt-1.5">
              Để bảo vệ thông tin riêng tư của đơn hàng {orderCode}, vui lòng nhập SĐT hoặc Email
              đã dùng khi đặt hàng.
            </p>
            <form onSubmit={handleLookupUnlock} className="mt-4 space-y-3">
              <input
                required
                value={verifyContact}
                onChange={(e) => setVerifyContact(e.target.value)}
                placeholder="SĐT hoặc Email đặt hàng"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm"
              />
              {verifyError && <p className="text-xs text-rose-600">{verifyError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
              >
                Mở khóa trang thanh toán
              </button>
            </form>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-10 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Không tìm thấy đơn hàng {orderCode}
            </h2>
            <Link
              href="/qua-tang/tra-cuu-don"
              className="mt-4 inline-flex px-4 py-2 rounded-xl bg-[#C85A77] text-white text-sm font-medium"
            >
              Tra cứu đơn hàng
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status header card */}
            <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#6E555A]">Trạng thái đơn hàng</div>
                <div className="text-lg font-bold text-[#3E2A2D] mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{ORDER_STATUS_LABELS[data.status] || data.status}</span>
                  {data.status === "PAYMENT_REVIEW_REQUESTED" && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      Chờ Admin đối soát ngân hàng
                    </span>
                  )}
                  {isPaid && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Đã thanh toán
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#6E555A]">Số tiền cần thanh toán</div>
                <div className="text-2xl font-bold text-[#B94A67]">
                  {formatVnd(data.totalVnd)}
                </div>
              </div>
            </div>

            {isPaid ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h2 className="font-serif text-xl font-bold text-emerald-950">
                  Thanh toán đã được xác nhận!
                </h2>
                <p className="text-sm text-emerald-800 mt-1">
                  Đơn hàng {data.orderCode} đã sẵn sàng để shop gói quà và phát hành mã QR riêng cho
                  từng hộp.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/qua-tang/dat-hang-thanh-cong/${orderCode}${tokenQuery}`)
                    }
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    Xem trang hoàn tất đơn
                  </button>
                  <Link
                    href={`/qua-tang/don-hang/${orderCode}${tokenQuery}`}
                    className="px-5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-sm font-semibold"
                  >
                    Theo dõi đơn hàng
                  </Link>
                </div>
              </div>
            ) : ["EXPIRED", "CANCELLED", "STOCK_CONFLICT_REFUND_NEEDED"].includes(data.status) ? (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center">
                <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
                <h2 className="font-serif text-xl font-bold text-rose-950">
                  {ORDER_STATUS_LABELS[data.status] || data.status}
                </h2>
                <p className="text-sm text-rose-800 mt-1">
                  Phiên giữ hàng hoặc đơn hàng đã hết hiệu lực. Nếu bạn vừa chuyển khoản nhầm vào lúc
                  hết hạn, vui lòng liên hệ shop kèm mã đơn {data.orderCode}.
                </p>
                <Link
                  href="/qua-tang"
                  className="mt-4 inline-flex px-5 py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
                >
                  Đặt lại hộp quà mới
                </Link>
              </div>
            ) : data.paymentMethod === "bank_transfer" ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* VietQR column */}
                <div className="md:col-span-5 bg-white rounded-3xl border border-[#F2DCE2] p-5 text-center shadow-sm">
                  {countdown && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Giữ chỗ tồn kho còn: {countdown}</span>
                    </div>
                  )}

                  {data.qrDataUrl ? (
                    <div className="bg-[#FFF9FA] p-4 rounded-2xl border border-[#F2DCE2] inline-block">
                      <img
                        src={data.qrDataUrl}
                        alt={`VietQR thanh toán đơn ${data.orderCode}`}
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-amber-50 text-xs text-amber-900">
                      Không thể tạo ảnh VietQR tự động. Vui lòng chuyển khoản thủ công theo thông tin
                      tài khoản bên cạnh.
                    </div>
                  )}

                  <p className="text-xs text-[#6E555A] mt-3">
                    Quét bằng ứng dụng ngân hàng bất kỳ (VietQR Napas 247). Kiểm tra đúng số tiền và
                    nội dung chuyển khoản trước khi bấm xác nhận.
                  </p>
                </div>

                {/* Bank details + I Have Transferred */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 shadow-sm space-y-3">
                    <h2 className="font-serif text-lg font-bold text-[#3E2A2D]">
                      Thông tin chuyển khoản chính chủ
                    </h2>

                    {data.bankDetails ? (
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-[#F7E7EB]">
                          <span className="text-[#6E555A]">Ngân hàng</span>
                          <span className="font-semibold text-[#3E2A2D]">
                            {data.bankDetails.bankName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[#F7E7EB] gap-2">
                          <span className="text-[#6E555A]">Số tài khoản</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#3E2A2D]">
                              {data.bankDetails.accountNo}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy("stk", data.bankDetails!.accountNo)}
                              className="text-xs px-2 py-1 rounded-lg bg-[#FFF0F3] text-[#B94A67] hover:bg-[#FFE0E8] inline-flex items-center gap-1"
                            >
                              {copiedField === "stk" ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedField === "stk" ? "Đã chép" : "Chép"}</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[#F7E7EB]">
                          <span className="text-[#6E555A]">Chủ tài khoản</span>
                          <span className="font-semibold text-[#3E2A2D]">
                            {data.bankDetails.accountName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[#F7E7EB] gap-2">
                          <span className="text-[#6E555A]">Số tiền chính xác</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#B94A67]">
                              {formatVnd(data.totalVnd)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy("amount", String(data.totalVnd))}
                              className="text-xs px-2 py-1 rounded-lg bg-[#FFF0F3] text-[#B94A67] hover:bg-[#FFE0E8] inline-flex items-center gap-1"
                            >
                              {copiedField === "amount" ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedField === "amount" ? "Đã chép" : "Chép"}</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2 gap-2">
                          <span className="text-[#6E555A]">Nội dung CK</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#3E2A2D] bg-[#FFF5F7] px-2 py-0.5 rounded">
                              {data.transferContent || data.orderCode}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy("content", data.transferContent || data.orderCode)
                              }
                              className="text-xs px-2 py-1 rounded-lg bg-[#FFF0F3] text-[#B94A67] hover:bg-[#FFE0E8] inline-flex items-center gap-1"
                            >
                              {copiedField === "content" ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedField === "content" ? "Đã chép" : "Chép"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-900">
                        Shop chưa cấu hình đầy đủ thông tin ngân hàng.
                      </div>
                    )}
                  </div>

                  {/* Manual confirmation request form */}
                  <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 shadow-sm">
                    {data.status === "PAYMENT_REVIEW_REQUESTED" ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-amber-800 font-semibold text-sm">
                          <ShieldCheck className="w-5 h-5 text-amber-600" />
                          <span>Đã gửi yêu cầu đối soát chuyển khoản</span>
                        </div>
                        <p className="text-xs text-[#5C4448] leading-relaxed">
                          Hệ thống đã ghi nhận thông báo chuyển khoản của bạn và giữ tồn kho đơn
                          hàng trong thời gian chờ đối soát. Admin sẽ kiểm tra sao kê thực tế và
                          chuyển đơn sang trạng thái Đã thanh toán (trạng thái này hoàn toàn do nhân
                          viên/Admin xác nhận, không tự động xác nhận giả).
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleRequestReview} className="space-y-3">
                        <div className="text-sm font-semibold text-[#3E2A2D]">
                          Sau khi chuyển khoản thành công:
                        </div>
                        <input
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Ghi chú giao dịch (ví dụ: 4 số cuối STK hoặc mã giao dịch, không bắt buộc)"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E7C6CF] text-xs"
                        />
                        {reviewMessage && (
                          <p className="text-xs text-[#B94A67] font-medium">{reviewMessage}</p>
                        )}
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="w-full py-3 rounded-xl bg-[#C85A77] hover:bg-[#B04562] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>
                            {submittingReview ? "Đang gửi yêu cầu..." : "Tôi đã chuyển khoản"}
                          </span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* PayOS Gateway panel */
              <div className="bg-white rounded-3xl border border-[#F2DCE2] p-6 sm:p-8 text-center shadow-sm">
                <CreditCard className="w-10 h-10 text-[#C85A77] mx-auto mb-3" />
                <h2 className="font-serif text-xl font-bold text-[#3E2A2D]">
                  Thanh toán qua cổng PayOS
                </h2>
                {countdown && (
                  <p className="text-xs text-amber-800 mt-1">
                    Thời gian giữ hàng còn lại: <strong>{countdown}</strong>
                  </p>
                )}
                <p className="text-sm text-[#6E555A] mt-2 max-w-md mx-auto">
                  Nhấn nút bên dưới để mở trang thanh toán PayOS chính thức. Sau khi hoàn tất, trang
                  này sẽ tự cập nhật qua Webhook.
                </p>
                {data.checkoutUrl ? (
                  <a
                    href={data.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C85A77] hover:bg-[#B04562] text-white text-sm font-semibold"
                  >
                    <span>Mở cổng thanh toán PayOS</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-xs text-rose-600 mt-4">
                    Liên kết thanh toán PayOS chưa khả dụng. Vui lòng thử tạo đơn lại hoặc chọn
                    chuyển khoản ngân hàng.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ShopShell>
  );
}
