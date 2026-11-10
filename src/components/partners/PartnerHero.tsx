"use client";

import { MessageCircle, Facebook, ArrowRight } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/data/landingData";

export default function PartnerHero() {
  return (
    <div className="relative w-full min-h-[420px] bg-gradient-to-r from-[#ff8060] via-[#ff4d68] to-[#d51c53] flex flex-col items-center justify-center text-center px-4 sm:px-6 py-14 overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Translucent Pink Badge */}
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-semibold mb-6 shadow-xs border border-white/25">
        <span>🤝 Chương trình đối tác</span>
      </div>

      {/* 2. Main Title: ~42px bold */}
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-tight max-w-3xl drop-shadow-sm">
        Trở thành đối tác {siteConfig.brandName}
      </h1>

      {/* 3. Subtitle: 16px, max ~680px, 2 lines */}
      <p className="text-white/90 text-sm sm:text-[16px] leading-relaxed max-w-[680px] mt-4 drop-shadow-xs">
        Cùng Ding Dong Gift lan tỏa những khoảnh khắc hạnh phúc, chia sẻ trải nghiệm thiệp cưới số độc đáo và nhận mức hoa hồng 10% bền vững trên mỗi đơn hàng.
      </p>

      {/* 4. Two Pill CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8 z-10">
        {/* Primary CTA: White pill with pink text & chat icon */}
        <a
          href="https://zalo.me"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 h-11 px-6 rounded-full bg-white hover:bg-rose-50 text-[#fa416a] text-xs sm:text-sm font-bold shadow-lg transition-transform duration-200 hover:scale-105"
        >
          <MessageCircle className="w-4 h-4 fill-[#fa416a]" />
          <span>Liên hệ Zalo</span>
        </a>

        {/* Secondary CTA: Transparent pill with white border */}
        <a
          href={siteConfig.socialLinks.facebook || "https://facebook.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 h-11 px-6 rounded-full bg-transparent hover:bg-white/15 text-white border-2 border-white text-xs sm:text-sm font-bold transition-all duration-200"
        >
          <Facebook className="w-4 h-4" />
          <span>Nhắn Facebook</span>
        </a>

        {/* Direct Register Link */}
        <Link
          href="/affiliate/apply"
          className="flex items-center gap-2 h-11 px-6 rounded-full bg-black/25 hover:bg-black/35 text-white border border-white/30 text-xs sm:text-sm font-semibold transition-all duration-200"
        >
          <span>Đăng ký CTV</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

