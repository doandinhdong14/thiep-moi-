"use client";

import { useEffect, useState } from "react";
import { Headphones, ChevronUp } from "lucide-react";

export default function FloatingWidgets() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      setIsIframe(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isIframe) return null;

  return (
    <>
      {/* 1. Floating Support Button */}
      <aside aria-label="Kênh hỗ trợ trực tuyến">
        <a
          href="mailto:hotro@dingdonggift.vn?subject=Yêu%20cầu%20hỗ%20trợ%20Ding%20Dong%20Gift"
          aria-label="Liên hệ hỗ trợ 24/7"
          title="Liên hệ hỗ trợ khách hàng"
          className="fixed right-5 bottom-20 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-[#ff6b61] to-[#fa416a] text-white flex items-center justify-center shadow-[0_4px_18px_rgba(250,65,106,0.35)] transition-all hover:scale-110 active:scale-95 group"
        >
          <Headphones className="w-5 h-5 transition-transform group-hover:rotate-12" />
        </a>
      </aside>

      {/* 2. Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          title="Lên đầu trang"
          className="fixed right-5 bottom-6 z-40 w-11 h-11 rounded-full bg-white border border-rose-200 text-[#fa416a] flex items-center justify-center shadow-lg transition-all hover:bg-rose-50 hover:scale-110 active:scale-95 animate-fadeIn"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </>
  );
}

