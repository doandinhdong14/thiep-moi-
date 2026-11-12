"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import ShopShell from "@/components/shop/ShopShell";
import { useShopCart } from "@/components/shop/ShopCartContext";
import { VIETNAM_PROVINCES } from "@/lib/shop/shipping";
import { formatVnd, isShopApiSuccess } from "@/lib/shop/types";

type PaymentMethodType = "bank_transfer" | "payos" | "cod";

interface ShippingQuoteView {
  provinceCode: string;
  provinceName: string;
  zone: string;
  feeVnd: number;
  freeshipApplied: boolean;
  quoteRequired: boolean;
  deliveryEstimateText: string;
  note: string;
}

export default function ShopCheckoutPage() {
  const router = useRouter();
  const { cart, settings, loading, refreshCart, applyPromoCode } = useShopCart();

  // Stable idempotency key per checkout session in memory to protect against double-clicks
  const idempotencyKeyRef = useRef<string>("");
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ddg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sameAsBuyer, setSameAsBuyer] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [provinceCode, setProvinceCode] = useState("SG");
  const [districtName, setDistrictName] = useState("");
  const [wardName, setWardName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteView | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync recipient name/phone when sameAsBuyer toggled
  useEffect(() => {
    if (sameAsBuyer) {
      setRecipientName(customerName);
      setRecipientPhone(customerPhone);
    }
  }, [sameAsBuyer, customerName, customerPhone]);

  // Pick first genuinely enabled payment method from server settings
  const availableMethods = useMemo(() => {
    if (!settings) return [] as PaymentMethodType[];
    const list: PaymentMethodType[] = [];
    if (settings.paymentCapabilities.bankTransferAvailable) list.push("bank_transfer");
    if (settings.paymentCapabilities.payosAvailable) list.push("payos");
    if (settings.paymentCapabilities.codAvailable) list.push("cod");
    return list;
  }, [settings]);

  useEffect(() => {
    if (availableMethods.length > 0 && (!paymentMethod || !availableMethods.includes(paymentMethod))) {
      setPaymentMethod(availableMethods[0]);
    } else if (availableMethods.length === 0) {
      setPaymentMethod(null);
    }
  }, [availableMethods, paymentMethod]);

  // Fetch authoritative server shipping quote whenever province or subtotal changes
  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    let active = true;
    setQuoteLoading(true);
    fetch("/api/shop/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provinceCode,
        subtotalVnd: cart.subtotalVnd,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (active && isShopApiSuccess(json) && json.data) {
          setShippingQuote(json.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setQuoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provinceCode, cart?.subtotalVnd, cart?.items.length]);

  const selectedProvince = useMemo(
    () => VIETNAM_PROVINCES.find((p) => p.code === provinceCode),
    [provinceCode],
  );

  const estimatedTotalVnd =
    (cart?.totalBeforeShippingVnd || 0) + (shippingQuote?.feeVnd || 0);

  const codExceedsLimit = Boolean(
    paymentMethod === "cod" &&
      settings?.paymentCapabilities.codMaxOrderTotalVnd &&
      estimatedTotalVnd > settings.paymentCapabilities.codMaxOrderTotalVnd,
  );

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await applyPromoCode(promoCodeInput.trim() || null);
    setPromoMessage(res.message || (res.ok ? "Đã áp dụng mã." : "Mã không hợp lệ."));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!paymentMethod) {
      setErrorMsg("Hiện chưa có phương thức thanh toán khả dụng được cấu hình.");
      return;
    }
    if (!acceptTerms) {
      setErrorMsg("Vui lòng xác nhận đồng ý điều khoản đặt hàng trước khi tiếp tục.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKeyRef.current,
          customerName,
          customerPhone,
          customerEmail,
          recipientName,
          recipientPhone,
          provinceCode,
          districtName,
          wardName,
          streetAddress,
          addressNote,
          deliveryNote,
          promoCode: cart?.promoCode || promoCodeInput.trim() || undefined,
          paymentMethod,
          acceptTerms: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(
          json?.error?.message || "Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin.",
        );
        // Generate a fresh key only if checkout failed with business validation so user can fix and retry cleanly
        if (res.status === 400 || res.status === 409) {
          idempotencyKeyRef.current =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `ddg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
        await refreshCart();
        setSubmitting(false);
        return;
      }

      const data = json.data;
      await refreshCart();

      const tokenQuery = data.guestAccessToken
        ? `?token=${encodeURIComponent(data.guestAccessToken)}`
        : "";

      if (data.paymentMethod === "cod") {
        router.push(`/qua-tang/dat-hang-thanh-cong/${data.orderCode}${tokenQuery}`);
      } else {
        router.push(`/qua-tang/thanh-toan/${data.orderCode}${tokenQuery}`);
      }
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ khi tạo đơn hàng. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (loading && !cart) {
    return (
      <ShopShell>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[#6E555A]">
          Đang tải thông tin thanh toán...
        </div>
      </ShopShell>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <ShopShell>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl border border-[#F2DCE2] p-8">
            <Gift className="w-10 h-10 text-[#C85A77] mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Giỏ quà đang trống
            </h1>
            <p className="text-sm text-[#6E555A] mt-2">
              Vui lòng chọn ít nhất một món quà trước khi điền địa chỉ nhận hàng.
            </p>
            <Link
              href="/qua-tang/tat-ca"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C85A77] text-white text-sm font-semibold"
            >
              Xem sản phẩm quà tặng
            </Link>
          </div>
        </div>
      </ShopShell>
    );
  }

  return (
    <ShopShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Link
              href="/qua-tang/gio-hang"
              className="text-xs font-medium text-[#B94A67] hover:underline inline-flex items-center gap-1 mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại giỏ quà</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D]">
              Thanh toán &amp; Địa chỉ nhận quà
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#F2DCE2] text-xs text-[#5C4448]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Giá &amp; tồn kho được giữ chỗ và xác thực bởi máy chủ</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left: Buyer, Recipient & Payment method */}
          <div className="lg:col-span-7 space-y-5">
            {/* Buyer info */}
            <section className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#3E2A2D] mb-4">
                1. Thông tin người đặt quà
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Họ tên người mua *
                  </label>
                  <input
                    required
                    minLength={2}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Minh Anh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Số điện thoại đặt hàng *
                  </label>
                  <input
                    required
                    minLength={9}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Email nhận thông tin đơn &amp; thiệp (không bắt buộc)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>
              </div>
            </section>

            {/* Recipient shipping address */}
            <section className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-serif text-lg font-bold text-[#3E2A2D]">
                  2. Người nhận &amp; Địa chỉ giao tận tay
                </h2>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5C4448] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsBuyer}
                    onChange={(e) => setSameAsBuyer(e.target.checked)}
                    className="rounded border-[#D46C88] text-[#C85A77]"
                  />
                  <span>Tôi là người trực tiếp nhận hộp quà</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Tên người nhận quà *
                  </label>
                  <input
                    required
                    minLength={2}
                    value={recipientName}
                    onChange={(e) => {
                      setSameAsBuyer(false);
                      setRecipientName(e.target.value);
                    }}
                    placeholder="Trần Thảo Vy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Số điện thoại người nhận *
                  </label>
                  <input
                    required
                    minLength={9}
                    value={recipientPhone}
                    onChange={(e) => {
                      setSameAsBuyer(false);
                      setRecipientPhone(e.target.value);
                    }}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Tỉnh / Thành phố *
                  </label>
                  <select
                    required
                    value={provinceCode}
                    onChange={(e) => setProvinceCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  >
                    {VIETNAM_PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Quận / Huyện / TP *
                  </label>
                  <input
                    required
                    minLength={2}
                    list="ddg-popular-districts"
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    placeholder="Quận 1 / Cầu Giấy..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                  {selectedProvince?.popularDistricts && (
                    <datalist id="ddg-popular-districts">
                      {selectedProvince.popularDistricts.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Phường / Xã *
                  </label>
                  <input
                    required
                    minLength={2}
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    placeholder="Phường Bến Nghé"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Ghi chú tìm đường (không bắt buộc)
                  </label>
                  <input
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    placeholder="Tòa nhà, khung giờ nhận..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Số nhà, tên đường *
                  </label>
                  <input
                    required
                    minLength={4}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Ví dụ: 123 Nguyễn Huệ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5C4448] mb-1">
                    Lời dặn cho đơn vị gói &amp; giao quà (không bắt buộc)
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Ví dụ: Đây là quà tặng bất ngờ, nhờ shipper gọi trước khi tới..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E7C6CF] text-sm focus:outline-none focus:ring-2 focus:ring-[#D46C88]/30"
                  />
                </div>
              </div>

              {shippingQuote && (
                <div className="mt-4 rounded-2xl bg-[#FFF7F9] border border-[#F2DCE2] p-3.5 text-xs text-[#5C4448] flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-[#C85A77] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#3E2A2D]">
                      {shippingQuote.provinceName}: {shippingQuote.deliveryEstimateText} —{" "}
                      {shippingQuote.quoteRequired
                        ? "Báo phí sau"
                        : shippingQuote.freeshipApplied
                          ? "Miễn phí vận chuyển"
                          : formatVnd(shippingQuote.feeVnd)}
                    </div>
                    <p className="mt-0.5 text-[#6E555A]">{shippingQuote.note}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Payment method */}
            <section className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#3E2A2D] mb-4">
                3. Phương thức thanh toán hợp lệ
              </h2>

              {availableMethods.length === 0 ? (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Chưa có phương thức thanh toán khả dụng.</strong>
                    <p className="text-xs mt-1">
                      Admin cần cấu hình tài khoản ngân hàng VietQR, PayOS hoặc bật COD trong{" "}
                      <code className="px-1 py-0.5 bg-white rounded">/admin/qua-tang/cau-hinh</code>{" "}
                      trước khi nhận đơn thật.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {settings?.paymentCapabilities.bankTransferAvailable && (
                    <label
                      className={`block rounded-2xl border p-4 cursor-pointer transition-all ${
                        paymentMethod === "bank_transfer"
                          ? "border-[#C85A77] bg-[#FFF7F9] ring-1 ring-[#C85A77]"
                          : "border-[#EED5DC] hover:border-[#D46C88]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentMethod === "bank_transfer"}
                          onChange={() => setPaymentMethod("bank_transfer")}
                          className="mt-1 text-[#C85A77]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-semibold text-sm text-[#3E2A2D]">
                            <Building2 className="w-4 h-4 text-[#C85A77]" />
                            <span>Chuyển khoản ngân hàng (VietQR theo tài khoản Shop)</span>
                          </div>
                          <p className="text-xs text-[#6E555A] mt-1">
                            Hiển thị mã QR chính chủ của cửa hàng ở bước tiếp theo. Sau khi chuyển
                            khoản, bấm &ldquo;Tôi đã chuyển khoản&rdquo; để Admin đối soát thực tế.
                          </p>
                        </div>
                      </div>
                    </label>
                  )}

                  {settings?.paymentCapabilities.payosAvailable && (
                    <label
                      className={`block rounded-2xl border p-4 cursor-pointer transition-all ${
                        paymentMethod === "payos"
                          ? "border-[#C85A77] bg-[#FFF7F9] ring-1 ring-[#C85A77]"
                          : "border-[#EED5DC] hover:border-[#D46C88]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="payos"
                          checked={paymentMethod === "payos"}
                          onChange={() => setPaymentMethod("payos")}
                          className="mt-1 text-[#C85A77]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-semibold text-sm text-[#3E2A2D]">
                            <CreditCard className="w-4 h-4 text-[#C85A77]" />
                            <span>Thanh toán QR tự động qua cổng PayOS</span>
                          </div>
                          <p className="text-xs text-[#6E555A] mt-1">
                            Xác nhận tự động bằng chữ ký Webhook ngay khi giao dịch thành công.
                          </p>
                        </div>
                      </div>
                    </label>
                  )}

                  {settings?.paymentCapabilities.codAvailable && (
                    <label
                      className={`block rounded-2xl border p-4 cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "border-[#C85A77] bg-[#FFF7F9] ring-1 ring-[#C85A77]"
                          : "border-[#EED5DC] hover:border-[#D46C88]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="mt-1 text-[#C85A77]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-semibold text-sm text-[#3E2A2D]">
                            <Banknote className="w-4 h-4 text-[#C85A77]" />
                            <span>Thanh toán khi nhận hàng (COD)</span>
                          </div>
                          <p className="text-xs text-[#6E555A] mt-1">
                            Thanh toán trực tiếp với nhân viên giao hàng khi nhận hộp quà.
                            {settings.paymentCapabilities.codMaxOrderTotalVnd
                              ? ` Áp dụng cho đơn tối đa ${formatVnd(settings.paymentCapabilities.codMaxOrderTotalVnd)}.`
                              : ""}
                          </p>
                          {codExceedsLimit && (
                            <p className="text-xs font-medium text-rose-600 mt-1">
                              Đơn hàng vượt hạn mức COD ({formatVnd(settings.paymentCapabilities.codMaxOrderTotalVnd || 0)}). Vui lòng chọn phương thức khác.
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right: Order summary */}
          <aside className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-3xl border border-[#F2DCE2] p-5 sm:p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#3E2A2D] mb-4">
                Hộp quà trong đơn ({cart.boxCount} hộp)
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 pb-3 border-b border-[#F7E7EB] last:border-b-0"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover bg-[#FFF6F8] border border-[#F3DFE4] shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-semibold text-[#3E2A2D] truncate">
                        {item.productName}
                      </div>
                      <div className="text-[#6E555A] mt-0.5">
                        {item.variantName} × {item.quantity}
                      </div>
                      <div className="text-[11px] text-[#B94A67] mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {item.units.filter((u) => u.customization).length}/{item.units.length}{" "}
                          hộp đã viết thiệp riêng
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#3E2A2D] shrink-0">
                      {formatVnd(item.lineSubtotalVnd)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline promo apply */}
              <div className="mt-4 pt-4 border-t border-[#F6E4E8]">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#8A6D73] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder={cart.promoCode || "Mã ưu đãi"}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E7C6CF]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-3 py-2 rounded-xl bg-[#3E2A2D] text-white text-xs font-medium"
                  >
                    Áp dụng
                  </button>
                </div>
                {(promoMessage || cart.promoMessage) && (
                  <p className="text-[11px] text-[#B94A67] mt-1">
                    {promoMessage || cart.promoMessage}
                  </p>
                )}
              </div>

              <dl className="mt-4 pt-4 border-t border-[#F6E4E8] space-y-2 text-sm">
                <div className="flex justify-between text-[#5C4448]">
                  <dt>Tiền sản phẩm</dt>
                  <dd className="font-medium text-[#3E2A2D]">{formatVnd(cart.subtotalVnd)}</dd>
                </div>
                <div className="flex justify-between text-[#5C4448]">
                  <dt>Gói quà</dt>
                  <dd className="font-medium text-[#3E2A2D]">{formatVnd(cart.giftWrapFeeVnd)}</dd>
                </div>
                <div className="flex justify-between text-[#5C4448]">
                  <dt>Nâng cấp thiệp QR</dt>
                  <dd className="font-medium text-[#3E2A2D]">{formatVnd(cart.giftCardFeeVnd)}</dd>
                </div>
                {cart.discountVnd > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Ưu đãi ({cart.promoCode})</dt>
                    <dd className="font-semibold">-{formatVnd(cart.discountVnd)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#5C4448]">
                  <dt>Phí vận chuyển</dt>
                  <dd className="font-medium text-[#3E2A2D]">
                    {quoteLoading
                      ? "Đang tính..."
                      : shippingQuote?.quoteRequired
                        ? "Báo phí riêng"
                        : shippingQuote?.freeshipApplied
                          ? "Miễn phí"
                          : formatVnd(shippingQuote?.feeVnd || 0)}
                  </dd>
                </div>
                <div className="border-t border-[#F2DCE2] pt-3 flex justify-between items-baseline">
                  <dt className="font-semibold text-[#3E2A2D]">Tổng thanh toán</dt>
                  <dd className="text-2xl font-bold text-[#B94A67]">
                    {formatVnd(estimatedTotalVnd)}
                  </dd>
                </div>
              </dl>

              <label className="mt-4 flex items-start gap-2 text-xs text-[#5C4448] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#D46C88] text-[#C85A77]"
                />
                <span>
                  Tôi xác nhận địa chỉ nhận quà chính xác và hiểu rằng tồn kho được giữ chỗ tạm thời{" "}
                  <strong>{settings?.inventory.reservationTtlMinutes || 30} phút</strong> trong khi chờ xác nhận
                  thanh toán.
                </span>
              </label>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !paymentMethod ||
                  codExceedsLimit ||
                  cart.hasStockIssues ||
                  !settings?.storeOpen
                }
                className="mt-5 w-full py-3.5 px-4 rounded-xl bg-[#C85A77] hover:bg-[#B04562] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {submitting
                    ? "Đang giữ hàng & tạo đơn..."
                    : paymentMethod === "cod"
                      ? "Xác nhận đặt quà (COD)"
                      : "Tạo đơn & Chuyển tới bước thanh toán"}
                </span>
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#7D6368]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mỗi hộp quà tạo riêng một QR độc nhất sau khi shop xác nhận đơn</span>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </ShopShell>
  );
}
