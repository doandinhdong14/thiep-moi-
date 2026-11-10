"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If running inside iframe (e.g. product demo mockup preview), don't show consent banner
    if (typeof window !== "undefined" && window.self !== window.top) {
      return;
    }

    // Check if user already made a decision
    const consent = localStorage.getItem("dingdong_cookie_consent");
    if (!consent) {
      // Delay slightly for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Listen for re-opening settings from footer
    const handleReopen = () => setIsVisible(true);
    window.addEventListener("open-cookie-settings", handleReopen);
    return () => window.removeEventListener("open-cookie-settings", handleReopen);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("dingdong_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("dingdong_cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Thông báo cài đặt cookie"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[650px] bg-white rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] border border-rose-100 p-4 sm:p-5 transition-all duration-300 animate-slideUp"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 text-[#fa416a] flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
            Chúng tôi sử dụng cookie để mang lại trải nghiệm tạo thiệp mượt mà và bảo mật nhất cho bạn.{" "}
            <Link href="/legal/privacy" className="text-[#fa416a] underline hover:opacity-80">
              Tìm hiểu thêm
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={handleDecline}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Từ chối
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}

