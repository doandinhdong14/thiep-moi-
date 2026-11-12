"use client";

import React, { useEffect, useState } from "react";
import { Clock, Gift, Heart, MailOpen, Sparkles } from "lucide-react";
import TemplateRenderer from "@/components/template-renderer/TemplateRenderer";
import type { RecipientLandingPayload } from "@/lib/shop/gift-card";
import { isShopApiSuccess } from "@/lib/shop/types";

interface GiftRecipientClientProps {
  giftToken: string;
  initialPayload: RecipientLandingPayload;
}

export default function GiftRecipientClient({
  giftToken,
  initialPayload,
}: GiftRecipientClientProps) {
  const [payload, setPayload] = useState<RecipientLandingPayload>(initialPayload);
  const [revealed, setRevealed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [sealBurst, setSealBurst] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isPreview = Boolean(payload.isAdminPreview);

  const handleOpenEnvelope = async () => {
    setErrorMsg(null);
    setSealBurst(true);

    // Admin internal preview reveals hydrated template directly WITHOUT triggering firstOpenedAt
    if (isPreview && payload.card) {
      setTimeout(() => {
        setRevealed(true);
      }, 360);
      return;
    }

    // Returning visit while ACTIVE unlocks browser audio gesture cleanly
    if (payload.state === "ACTIVE" && payload.card) {
      setTimeout(() => {
        setRevealed(true);
      }, 360);
      return;
    }

    setOpening(true);
    try {
      const res = await fetch(`/api/gifts/${encodeURIComponent(giftToken)}/open`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setPayload((prev) => ({
          ...prev,
          state: json?.data?.state || prev.state,
        }));
        setErrorMsg(json?.error?.message || "Thiệp hiện chưa sẵn sàng để mở.");
        setOpening(false);
        setSealBurst(false);
        return;
      }

      setPayload((prev) => ({
        ...prev,
        state: "ACTIVE",
        card: json.data.card,
      }));
      setTimeout(() => {
        setRevealed(true);
        setOpening(false);
      }, 380);
    } catch {
      setErrorMsg("Không thể mở thiệp lúc này. Vui lòng thử quét lại QR.");
      setOpening(false);
      setSealBurst(false);
    }
  };

  if (revealed && payload.card) {
    return (
      <div className="min-h-screen w-full relative bg-[#120d10]">
        {isPreview && (
          <div className="sticky top-0 z-50 bg-[#3E2A2D]/95 backdrop-blur-sm text-[#FFF9F5] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#D46C88]/40">
            <span>
              Chế độ kiểm tra nội bộ (Admin Preview) — Không kích hoạt thời hạn mở lần đầu của
              khách.
            </span>
            <button
              type="button"
              onClick={() => {
                setRevealed(false);
                setSealBurst(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#C85A77] text-white font-semibold"
            >
              Đóng lại màn hình phong bì
            </button>
          </div>
        )}
        <TemplateRenderer
          content={payload.card.content}
          theme={payload.card.theme}
          templateSlug={payload.card.templateSlug}
          interactiveHtml={payload.card.interactiveHtml}
          isPreview={isPreview}
        />
      </div>
    );
  }

  return (
    <div
      className="ddg-shop min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top center, #FFF6F8 0%, #FDEFF3 48%, #F8E2E9 100%)",
      }}
    >
      {isPreview && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] rounded-full bg-[#3E2A2D] text-[#FFF9F5] px-4 py-2 text-xs text-center shadow-lg">
          Admin Preview ({payload.envelope?.boxReferenceCode}) — Mở thử không kích hoạt thời hạn.
        </div>
      )}

      {/* Soft ambient circles (motion disabled cleanly via CSS reduced-motion rules) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#F5B9C9]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#D46C88]/20 blur-3xl"
      />

      <main className="relative z-10 w-full max-w-md text-center">
        {!payload.found || payload.state === "NOT_FOUND" ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-[#F0D5DC] p-8 shadow-xl">
            <Gift className="w-11 h-11 text-[#C85A77] mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Liên kết hộp quà không tồn tại
            </h1>
            <p className="text-sm text-[#6E555A] mt-2 leading-relaxed">
              Vui lòng kiểm tra lại mã QR in trên tấm thiệp bên trong hộp quà.
            </p>
          </div>
        ) : payload.state === "DISABLED" ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-[#F0D5DC] p-8 shadow-xl">
            <Gift className="w-11 h-11 text-[#8A6D73] mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Tấm thiệp này hiện không còn hiệu lực
            </h1>
            <p className="text-sm text-[#6E555A] mt-2 leading-relaxed">
              Đơn quà đã bị hủy hoặc mã QR này đã được thay bằng mã mới.
            </p>
          </div>
        ) : payload.state === "EXPIRED" ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-[#F0D5DC] p-8 shadow-xl">
            <Clock className="w-11 h-11 text-[#B94A67] mx-auto mb-3" />
            <h1 className="font-serif text-xl font-bold text-[#3E2A2D]">
              Thời hạn hiển thị thiệp đã khép lại
            </h1>
            <p className="text-sm text-[#6E555A] mt-2 leading-relaxed">
              Tấm thiệp trực tuyến kèm món quà đã hết thời hạn lưu giữ theo gói dịch vụ đã chọn.
            </p>
          </div>
        ) : payload.state === "PREPARING" ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-[#F0D5DC] p-8 shadow-xl ddg-reveal-stagger">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF0F3] text-[#C85A77] flex items-center justify-center mx-auto mb-4 ddg-float-gentle">
              <Gift className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#3E2A2D]">
              Món quà đang trên đường gửi gắm
            </h1>
            <p className="text-sm text-[#6E555A] mt-2.5 leading-relaxed">
              Hộp quà và lời chúc đang được chuẩn bị để sẵn sàng trao tận tay bạn. Vui lòng quét lại
              mã QR khi bạn cầm hộp quà trên tay nhé.
            </p>
            {payload.envelope && (
              <div className="mt-4 text-[11px] font-mono text-[#8A6D73]">
                Mã hộp: {payload.envelope.boxReferenceCode}
              </div>
            )}
          </div>
        ) : (
          /* READY_UNOPENED or ACTIVE envelope gate */
          <div
            className={`relative bg-white/95 backdrop-blur-md rounded-[2rem] border border-[#ECC9D3] p-6 sm:p-8 shadow-2xl transition-all duration-500 ${
              sealBurst ? "scale-[0.97] opacity-85" : "scale-100 opacity-100"
            }`}
          >
            {/* Wax / ribbon preview cover */}
            <div className="relative mx-auto w-36 h-44 rounded-2xl overflow-hidden border-2 border-[#F0D5DC] shadow-md mb-5 ddg-float-gentle bg-[#FFF6F8]">
              {payload.envelope?.previewImageUrl ? (
                <img
                  src={payload.envelope.previewImageUrl}
                  alt="Thiệp dành riêng cho bạn"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MailOpen className="w-10 h-10 text-[#C85A77]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#3E2A2D]/40 via-transparent to-transparent" />
            </div>

            {sealBurst && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center gap-4">
                <span className="ddg-heart-particle text-[#D46C88]" style={{ ["--tx" as string]: "-28px" }}>
                  ♡
                </span>
                <span className="ddg-heart-particle text-[#C85A77]" style={{ ["--tx" as string]: "0px" }}>
                  ♥
                </span>
                <span className="ddg-heart-particle text-[#D46C88]" style={{ ["--tx" as string]: "28px" }}>
                  ♡
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F3] text-[#B94A67] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {payload.state === "ACTIVE"
                  ? "Thiệp kỷ niệm của bạn"
                  : "Thiệp riêng dành cho hộp quà của bạn"}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E2A2D] leading-snug">
              Có một lời thương đang đợi bạn mở.
            </h1>

            <p className="text-sm text-[#6E555A] mt-2.5 leading-relaxed">
              Chạm vào dấu sáp bên dưới để mở phong bì thiệp có nhạc và chuyển động dành riêng cho
              món quà này.
            </p>

            {payload.envelope && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#7D6368]">
                <span className="px-2.5 py-1 rounded-full bg-[#FFF7F9] border border-[#F2DCE2]">
                  {payload.envelope.templateTitle}
                </span>
                {payload.envelope.hasMusic && (
                  <span className="px-2.5 py-1 rounded-full bg-[#FFF7F9] border border-[#F2DCE2]">
                    Có nhạc nền nhẹ nhàng
                  </span>
                )}
              </div>
            )}

            {errorMsg && (
              <p className="mt-4 text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}

            <button
              type="button"
              data-ready={hydrated ? "1" : "0"}
              disabled={opening}
              onClick={handleOpenEnvelope}
              className="mt-6 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D46C88] to-[#B94A67] hover:from-[#C85A77] hover:to-[#A83E5A] text-white font-semibold text-base shadow-lg shadow-[#C85A77]/30 inline-flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-60 ddg-seal-pulse"
            >
              <Heart className="w-5 h-5 fill-current" />
              <span>{opening ? "Đang mở phong bì..." : "Mở thiệp ♡"}</span>
            </button>

            {payload.envelope && (
              <p className="mt-4 text-[11px] font-mono text-[#9A7E84]">
                Mã hộp quà: {payload.envelope.boxReferenceCode}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
