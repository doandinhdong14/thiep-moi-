"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ProductShowcase.module.css";

const STAGGER_OFFSETS_MS = [0, 120, 240, 80];

export interface VerticalScrollPreviewProps {
  id: string;
  slug: string;
  index: number;
  previewImage?: string;
  previewVideo?: string;
  coverUrl?: string;
  fallbackBg?: string;
  renderTemplateFallback?: () => React.ReactNode;
  hasTemplateFallback?: boolean;
  topOverlay?: React.ReactNode;
  bottomOverlay: React.ReactNode;
  eagerThreshold?: number;
}

/**
 * Shared 4:7 vertical preview card with smooth WAAPI auto-scroll and continuous loop.
 * Used across landing product cards, /products, /collections, /templates, and /occasions.
 */
export default function VerticalScrollPreview({
  id,
  slug,
  index,
  previewImage,
  previewVideo,
  coverUrl,
  fallbackBg = "#18181b",
  renderTemplateFallback,
  hasTemplateFallback = false,
  topOverlay,
  bottomOverlay,
  eagerThreshold = 8,
}: VerticalScrollPreviewProps) {
  const cardRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const primaryImgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const animRef = useRef<Animation | null>(null);
  const totalDurationRef = useRef<number>(0);
  const hasStartedRef = useRef<boolean>(false);
  const staggerDelayRef = useRef<number>(STAGGER_OFFSETS_MS[index % STAGGER_OFFSETS_MS.length]);
  const lastSizeRef = useRef<{ vh: number; ch: number } | null>(null);
  const shouldPlayRef = useRef<boolean>(false);

  const [isNearView, setIsNearView] = useState(index < eagerThreshold);
  const [isInView, setIsInView] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [staticFallbackError, setStaticFallbackError] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  const hasVideo = Boolean(previewVideo);
  const hasVerticalPreview = Boolean(previewImage) && !imgError && !hasVideo;
  const activeTemplateFallback = !hasVideo && !hasVerticalPreview && hasTemplateFallback;
  const isScrollableMode = hasVerticalPreview || activeTemplateFallback;

  const shouldPlay = isInView && !isPageHidden;
  shouldPlayRef.current = shouldPlay;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionMql.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionMql.addEventListener("change", onMotionChange);

    setIsPageHidden(document.hidden);
    const onVisibilityChange = () => setIsPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      motionMql.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl || typeof IntersectionObserver === "undefined") {
      setIsNearView(true);
      setIsInView(true);
      return;
    }

    const initialRect = cardEl.getBoundingClientRect();
    const vpH = window.innerHeight || 900;
    if (initialRect.bottom >= -200 && initialRect.top <= vpH + 200) {
      setIsNearView(true);
    }
    if (initialRect.bottom >= -120 && initialRect.top <= vpH + 120) {
      setIsInView(true);
    }

    const nearObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsNearView(true);
            nearObserver.disconnect();
          }
        }
      },
      { rootMargin: "220px 0px", threshold: 0 }
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsInView(entry.isIntersecting);
        }
      },
      { rootMargin: "120px 0px", threshold: 0 }
    );

    nearObserver.observe(cardEl);
    activeObserver.observe(cardEl);

    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    staggerDelayRef.current = STAGGER_OFFSETS_MS[index % STAGGER_OFFSETS_MS.length];
    lastSizeRef.current = null;
    setImgReady(false);
    setImgError(false);
    hasStartedRef.current = false;
    totalDurationRef.current = 0;

    const img = primaryImgRef.current;
    if (hasVerticalPreview && img && img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === "function") {
        img.decode().catch(() => {}).finally(() => setImgReady(true));
      } else {
        setImgReady(true);
      }
    }
  }, [id, previewImage, hasVerticalPreview, index]);

  const handlePrimaryImageLoad = useCallback(() => {
    const img = primaryImgRef.current;
    if (!img) return;
    if (typeof img.decode === "function") {
      img.decode().catch(() => {}).finally(() => setImgReady(true));
    } else {
      setImgReady(true);
    }
  }, []);

  const syncScrollAnimation = useCallback(() => {
    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    if (!viewportEl || !trackEl || !isScrollableMode) return;
    if (hasVerticalPreview && !imgReady) return;

    const viewportHeight = viewportEl.getBoundingClientRect().height;
    const contentHeight = trackEl.getBoundingClientRect().height;
    if (viewportHeight <= 0 || contentHeight <= 0) return;

    lastSizeRef.current = { vh: viewportHeight, ch: contentHeight };

    const nextDistance = Math.max(0, Math.floor(contentHeight - Math.ceil(viewportHeight)));
    setScrollDistance(nextDistance);

    let progressRatio = 0;
    const prevAnim = animRef.current;
    const prevTotal = totalDurationRef.current;

    if (prevAnim && prevTotal > 0) {
      const curTime = Number(prevAnim.currentTime ?? 0);
      if (curTime > 0) {
        progressRatio = (curTime % prevTotal) / prevTotal;
      }
    }

    if (prevAnim) {
      prevAnim.cancel();
      animRef.current = null;
    }

    if (nextDistance < 8 || typeof trackEl.animate !== "function") {
      trackEl.style.transform = "translate3d(0, 0, 0)";
      trackEl.style.opacity = "1";
      totalDurationRef.current = 0;
      return;
    }

    const startPauseMs = 140;
    const baseSpeed = reducedMotion ? 36 : 48;
    const speedPxPerSec = baseSpeed + (index % 4) * 1.8;
    const scrollMs = Math.round((nextDistance / speedPxPerSec) * 1000);
    const endPauseMs = 800;
    const crossfadeMs = 550;
    const totalMs = startPauseMs + scrollMs + endPauseMs + crossfadeMs;

    totalDurationRef.current = totalMs;

    const o1 = startPauseMs / totalMs;
    const o2 = (startPauseMs + scrollMs) / totalMs;
    const o3 = (startPauseMs + scrollMs + endPauseMs) / totalMs;

    const initialDelay = progressRatio > 0 || hasStartedRef.current ? 0 : staggerDelayRef.current;

    const anim = trackEl.animate(
      [
        { transform: "translate3d(0, 0, 0)", opacity: 1, offset: 0, easing: "ease" },
        { transform: "translate3d(0, 0, 0)", opacity: 1, offset: o1, easing: "linear" },
        { transform: `translate3d(0, -${nextDistance}px, 0)`, opacity: 1, offset: o2, easing: "ease" },
        { transform: `translate3d(0, -${nextDistance}px, 0)`, opacity: 1, offset: o3, easing: "ease-in-out" },
        { transform: `translate3d(0, -${nextDistance}px, 0)`, opacity: 0, offset: 1 },
      ],
      {
        duration: totalMs,
        iterations: Infinity,
        delay: initialDelay,
        fill: "backwards",
      }
    );

    if (progressRatio > 0) {
      anim.currentTime = progressRatio * totalMs;
    }

    animRef.current = anim;

    if (shouldPlayRef.current) {
      anim.play();
      hasStartedRef.current = true;
    } else {
      anim.pause();
    }
  }, [hasVerticalPreview, imgReady, index, isScrollableMode, reducedMotion]);

  useEffect(() => {
    if (!isScrollableMode) return;
    if (hasVerticalPreview && !imgReady) return;

    syncScrollAnimation();

    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    if (!viewportEl || !trackEl || typeof ResizeObserver === "undefined") {
      return () => {
        animRef.current?.cancel();
        animRef.current = null;
      };
    }

    let rafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const vh = viewportEl.getBoundingClientRect().height;
        const ch = trackEl.getBoundingClientRect().height;
        const prev = lastSizeRef.current;
        if (prev && Math.abs(vh - prev.vh) < 1 && Math.abs(ch - prev.ch) < 1) {
          return;
        }
        syncScrollAnimation();
      });
    });

    resizeObserver.observe(viewportEl);
    resizeObserver.observe(trackEl);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      animRef.current?.cancel();
      animRef.current = null;
    };
  }, [hasVerticalPreview, imgReady, isScrollableMode, syncScrollAnimation]);

  useEffect(() => {
    const anim = animRef.current;
    if (anim) {
      if (shouldPlay) {
        hasStartedRef.current = true;
        anim.play();
      } else {
        anim.pause();
      }
    }

    const videoEl = videoRef.current;
    if (hasVideo && videoEl) {
      if (shouldPlay) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    }
  }, [hasVideo, shouldPlay]);

  const showCrossfadeUnderlay = hasVerticalPreview && scrollDistance >= 8;

  return (
    <article
      ref={cardRef}
      data-product-id={id}
      data-product-slug={slug}
      className={styles.card}
      style={{ backgroundColor: fallbackBg }}
    >
      <div
        ref={viewportRef}
        className={styles.previewViewport}
        aria-hidden="true"
      >
        {hasVideo ? (
          isNearView ? (
            <video
              ref={videoRef}
              src={previewVideo}
              poster={coverUrl}
              muted
              playsInline
              loop
              preload="metadata"
              className="w-full h-full object-cover block"
            />
          ) : (
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover block"
            />
          )
        ) : hasVerticalPreview ? (
          <>
            {!imgReady && (
              <div
                className="absolute inset-0 z-0 animate-pulse"
                style={{ backgroundColor: fallbackBg }}
              />
            )}

            {showCrossfadeUnderlay && (
              <div
                className={`${styles.previewTrack} z-0`}
                style={{ backgroundColor: fallbackBg }}
              >
                <img
                  src={previewImage}
                  alt=""
                  decoding="async"
                  className={styles.previewImage}
                />
              </div>
            )}

            <div
              ref={trackRef}
              className={`${styles.previewTrack} z-[1]`}
              style={{
                backgroundColor: fallbackBg,
                willChange:
                  shouldPlay && scrollDistance >= 8 ? "transform, opacity" : "auto",
              }}
            >
              <img
                ref={primaryImgRef}
                src={previewImage}
                alt=""
                loading="eager"
                decoding="async"
                onLoad={handlePrimaryImageLoad}
                onError={() => setImgError(true)}
                className={styles.previewImage}
              />
            </div>
          </>
        ) : activeTemplateFallback && renderTemplateFallback ? (
          <div
            ref={trackRef}
            className={`${styles.previewTrack} z-[1]`}
            style={{
              backgroundColor: fallbackBg,
              willChange:
                shouldPlay && scrollDistance >= 8 ? "transform, opacity" : "auto",
            }}
          >
            {renderTemplateFallback()}
          </div>
        ) : (
          <div className="w-full h-full relative" style={{ backgroundColor: fallbackBg }}>
            {!staticFallbackError && coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                loading="lazy"
                onError={() => setStaticFallbackError(true)}
                className="w-full h-full object-cover block"
              />
            ) : null}
          </div>
        )}
      </div>

      {topOverlay}

      <div className={styles.gradientScrim} aria-hidden="true" />

      {bottomOverlay}
    </article>
  );
}

