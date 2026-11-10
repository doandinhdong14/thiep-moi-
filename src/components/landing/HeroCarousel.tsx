"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { heroSlides } from "@/data/landingData";

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = heroSlides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto advance every 6 seconds if not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "ArrowRight") nextSlide();
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide = heroSlides[currentIndex];

  return (
    <section
      aria-label="Hero Carousel"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[520px] sm:h-[580px] lg:h-[630px] overflow-hidden bg-slate-950 select-none focus:outline-none"
    >
      {/* Background Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out scale-105"
            style={{ backgroundImage: `url('${slide.imageUrl}')` }}
          />
          {/* Dark Overlay for optimal text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/70" />
        </div>
      ))}

      {/* Hero Content Overlay (Centered Horizontally & Vertically) */}
      <div className="relative z-20 h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-[760px] mx-auto px-4">
          {/* Main H1 Uppercase */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-white uppercase tracking-tight leading-tight sm:leading-none mb-3">
            {currentSlide.title}
          </h1>

          {/* Tagline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-rose-200 via-white to-pink-200 bg-clip-text text-transparent mb-4">
            {currentSlide.tagline}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-[17px] text-white/90 max-w-[660px] mx-auto leading-relaxed mb-8">
            {currentSlide.description}
          </p>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <Link
              href={currentSlide.ctaHref}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white font-bold text-sm tracking-wider uppercase rounded-full shadow-[0_10px_25px_rgba(250,65,106,0.35)] transition-all hover:scale-105 active:scale-95 group min-w-[180px]"
            >
              <span>{currentSlide.ctaLabel}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next Controls */}
      <button
        onClick={prevSlide}
        aria-label="Slide trước"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all hover:scale-110 focus:outline-none"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Slide tiếp theo"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all hover:scale-110 focus:outline-none"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Dots (4 Dots at the bottom) */}
      <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Chuyển tới slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-7 h-2.5 bg-white shadow-md"
                : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

