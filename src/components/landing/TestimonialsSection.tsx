"use client";

import { useRef } from "react";
import { Heart, Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonialsList } from "@/data/landingData";

export default function TestimonialsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-white overflow-hidden">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        {/* Main Card Container */}
        <div className="relative rounded-[28px] bg-gradient-to-b from-[#fff5f6] to-[#fff0f3] border border-rose-100 p-8 sm:p-12 lg:p-16 text-center shadow-[0_4px_25px_rgba(250,65,106,0.06)] overflow-hidden">
          {/* Subtle Decorative Hearts */}
          <Heart className="absolute -top-6 -left-6 w-28 h-28 text-rose-200/30 stroke-1 fill-rose-200/20 -rotate-12 pointer-events-none" />
          <Heart className="absolute -bottom-8 -right-8 w-36 h-36 text-rose-200/30 stroke-1 fill-rose-200/20 rotate-12 pointer-events-none" />

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white shadow-xs border border-rose-200 text-[#fa416a] text-xs font-semibold mb-5">
            <Heart className="w-3.5 h-3.5 fill-[#fa416a]" />
            <span>Cảm nhận thật từ khách hàng</span>
          </div>

          {/* Centered Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent leading-tight mb-4">
            Hàng nghìn khoảnh khắc hạnh phúc<br className="hidden sm:inline" /> đã bắt đầu từ Ding Dong Gift
          </h2>

          {/* Star Rating Line */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-800">5.0 / 5</span>
            <span className="text-xs text-[#73737d]">
              (từ hơn 10.000+ khách hàng đã tin tưởng trải nghiệm)
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#73737d] max-w-lg mx-auto mb-10 leading-relaxed">
            Mỗi lời chúc phúc, mỗi nụ cười ngày vui đều là động lực để chúng mình hoàn thiện sản phẩm mỗi ngày.
          </p>

          {/* Testimonial Cards Slider with Arrows */}
          <div className="relative">
            {/* Scroll Navigation Buttons */}
            <button
              onClick={scrollLeft}
              aria-label="Xem nhận xét trước"
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-rose-100 text-slate-700 hover:text-[#fa416a] flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={scrollRight}
              aria-label="Xem nhận xét tiếp theo"
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-rose-100 text-slate-700 hover:text-[#fa416a] flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Horizontal Scroll Track */}
            <div
              ref={scrollContainerRef}
              className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-2 py-4"
            >
              {testimonialsList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between shrink-0 w-[270px] sm:w-[290px] bg-white rounded-[16px] p-5 text-left border border-rose-100/80 shadow-[0_4px_16px_rgba(20,20,30,0.05)] transition-transform hover:-translate-y-1"
                >
                  <div>
                    <Quote className="w-6 h-6 text-rose-300 mb-2 stroke-[1.5]" />
                    <p className="text-[13px] text-slate-700 italic font-medium leading-relaxed mb-4">
                      "{item.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-rose-50">
                    <img
                      src={item.avatarUrl}
                      alt={item.author}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-200"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.author}</h4>
                      <p className="text-[11px] text-[#fa416a] font-medium truncate">{item.tag}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

