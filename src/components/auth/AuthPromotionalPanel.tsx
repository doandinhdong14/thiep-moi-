"use client";

import { BrandMark } from "@/components/common/BrandLogo";

export default function AuthPromotionalPanel() {
  return (
    <div className="relative hidden md:flex md:w-1/2 flex-col justify-between p-8 sm:p-10 overflow-hidden bg-slate-900 select-none min-h-[540px]">
      {/* Background Image: Emotional authentic photo of hands touching & holding peony bouquet */}
      <img
        src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=85"
        alt="Ding Dong Gift Moments"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle Gradient Overlays for readability matching Image 2 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />

      {/* Top Left: Ding Dong Gift Pill Badge with Logo */}
      <div className="relative z-10 self-start">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 shadow-md">
          <BrandMark size="xs" alt="" />
          <span className="text-xs font-bold tracking-tight text-slate-900">
            Ding Dong Gift
          </span>
        </div>
      </div>

      {/* Bottom: Slogan & Description matching Image 2 */}
      <div className="relative z-10 space-y-2 text-white">
        <h2 className="text-2xl sm:text-[25px] font-bold leading-tight drop-shadow-md text-white">
          Gửi yêu thương theo cách thật riêng
        </h2>
        <p className="text-white/90 text-xs sm:text-[13px] leading-relaxed max-w-sm drop-shadow-xs">
          Tự tay viết lời chúc, thêm ảnh và nhạc — gửi tặng bằng link hoặc mã QR chỉ trong vài phút.
        </p>
      </div>
    </div>
  );
}
