"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import type { CardPhotoItem } from "./config";
import { getCosmicPlaceholderUrl } from "./placeholders";

const BALLOON_EMOJI_URL = "/cards/card-01-first-gift/emoji/balloon.png";
const CONFETTI_EMOJI_URL = "/cards/card-01-first-gift/emoji/confetti_ball.png";
const GIFT_EMOJI_URL = "/cards/card-01-first-gift/emoji/gift.png";
const TADA_EMOJI_URL = "/cards/card-01-first-gift/emoji/tada.png";

export const CUTE_BODY_FONT =
  "'Mali', 'Quicksand', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif";
export const ROMANTIC_DISPLAY_FONT =
  "'Dancing Script', 'Mali', 'Quicksand', cursive, sans-serif";

export function splitPipes(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseLetterParagraphs(raw: string): string[][] {
  const normalized =
    raw.includes("||") || raw.includes("|")
      ? raw.replaceAll("||", "\n\n").replaceAll("|", "\n")
      : raw;

  return normalized
    .split("\n\n")
    .map((para) =>
      para
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    )
    .filter((para) => para.length > 0);
}

function useInScrollView(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.35,
  onEnter?: () => void,
  onLeave?: () => void
): boolean {
  const [visible, setVisible] = useState(false);
  const onEnterRef = useRef(onEnter);
  const onLeaveRef = useRef(onLeave);
  onEnterRef.current = onEnter;
  onLeaveRef.current = onLeave;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      onEnterRef.current?.();
      return;
    }

    const scrollRoot = el.closest(".cbj-scroll-snap-y");
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.boundingClientRect && entry.boundingClientRect.height < 20) return;
        if (entry.isIntersecting) {
          setVisible(true);
          onEnterRef.current?.();
        } else {
          setVisible(false);
          onLeaveRef.current?.();
        }
      },
      {
        root: scrollRoot instanceof Element ? scrollRoot : null,
        threshold: [threshold],
      }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);

  return visible;
}

export const SafeMotionTitle: React.FC<{
  text: string;
  visible: boolean;
  textColor: string;
  baseFontSize: string;
  baseDelay?: number;
  fontFamily?: string;
  as?: "h1" | "p";
}> = ({
  text,
  visible,
  textColor,
  baseFontSize,
  baseDelay = 0.45,
  fontFamily = ROMANTIC_DISPLAY_FONT,
  as = "h1",
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fitScale, setFitScale] = useState<number>(1);

  const normalized = text.normalize("NFC").trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const keepSingleLine = words.length <= 4 && normalized.length <= 24;

  const recomputeScale = useCallback(() => {
    const outer = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure) return;

    const availW = outer.clientWidth;
    const naturalW = measure.scrollWidth;
    if (availW <= 0 || naturalW <= 0) return;

    const safeBudget = Math.max(120, availW - 18);
    if (naturalW > safeBudget) {
      const next = Math.max(0.45, Math.min(1, safeBudget / naturalW));
      setFitScale(Number(next.toFixed(3)));
    } else {
      setFitScale(1);
    }
  }, []);

  useLayoutEffect(() => {
    recomputeScale();
  }, [normalized, baseFontSize, recomputeScale]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(recomputeScale);
      ro.observe(outer);
    }
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => recomputeScale());
    }
    window.addEventListener("resize", recomputeScale);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", recomputeScale);
    };
  }, [recomputeScale]);

  const computedFontSize = fitScale < 0.995 ? `calc(${baseFontSize} * ${fitScale})` : baseFontSize;
  let runningCharIdx = 0;

  const sharedHeadingStyle: React.CSSProperties = {
    margin: 0,
    fontFamily,
    fontWeight: 600,
    letterSpacing: "0.015em",
    color: textColor,
    fontSize: computedFontSize,
    lineHeight: 1.25,
    padding: "0.08em 0.25em",
    userSelect: "none",
    display: "inline-flex",
    flexWrap: keepSingleLine ? "nowrap" : "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    columnGap: "0.28em",
    rowGap: "0.1em",
    maxWidth: "100%",
    whiteSpace: keepSingleLine ? "nowrap" : "normal",
    wordBreak: "keep-all",
    overflowWrap: "normal",
    textShadow: "0 0 22px rgba(255, 255, 255, 0.16)",
  };

  const renderedWords = words.map((word, wIdx) => {
    const chars = Array.from(word);
    return (
      <span
        key={`${wIdx}-${word}`}
        className="cbj-word-token"
        style={{ display: "inline-block", whiteSpace: "nowrap", wordBreak: "keep-all" }}
      >
        {chars.map((char, cIdx) => {
          const delay = baseDelay + runningCharIdx * 0.075;
          runningCharIdx += 1;
          return (
            <span
              key={`${cIdx}-${char}`}
              style={{
                display: "inline-block",
                opacity: visible ? 1 : 0,
                filter: visible ? "blur(0px)" : "blur(12px)",
                transform: visible ? "scale(1) translateY(0)" : "scale(1.12) translateY(8px)",
                transition: `opacity 0.95s ease ${delay}s, filter 0.95s ease ${delay}s, transform 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    );
  });

  const Tag = as;

  return (
    <div
      ref={outerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontFamily,
          fontWeight: 600,
          letterSpacing: "0.015em",
          fontSize: baseFontSize,
          padding: "0.08em 0.25em",
        }}
      >
        {normalized}
      </span>
      <Tag className="cbj-safe-heading" style={sharedHeadingStyle}>
        {renderedWords}
      </Tag>
    </div>
  );
};

export const Scene1Intro: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  lines: string[];
  textColor: string;
  started: boolean;
  runId?: string;
}> = ({ sectionRef, lines, textColor, started, runId }) => {
  return (
    <section
      ref={sectionRef}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, paddingBottom: "3.2rem", fontFamily: CUTE_BODY_FONT }}
    >
      <div
        key={`${runId || "init"}-${started ? "on" : "off"}`}
        style={{
          textAlign: "center",
          padding: "0 1.75rem",
          maxWidth: "min(520px, 92%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.88rem",
        }}
      >
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          const targetOp = isLast ? 0.96 : 0.76;
          return (
            <p
              key={`${i}-${line}`}
              style={{
                margin: 0,
                fontFamily: CUTE_BODY_FONT,
                fontWeight: isLast ? 500 : 400,
                lineHeight: 1.55,
                userSelect: "none",
                fontSize:
                  i === 0 ? "clamp(0.86rem, 2vw, 1.12rem)" : "clamp(0.95rem, 2.3vw, 1.24rem)",
                letterSpacing: "0.02em",
                color: textColor,
                marginTop: isLast && lines.length > 1 ? "clamp(0.4rem, 1.8vh, 1rem)" : 0,
                wordBreak: "keep-all",
                overflowWrap: "break-word",
                ["--cbj-line-op" as string]: targetOp,
                opacity: 0,
                animation: started
                  ? `cbjLineReveal 1.2s cubic-bezier(0.22,1,0.36,1) ${0.22 + i * 0.56}s both`
                  : "none",
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    </section>
  );
};

export const Scene2Title: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  subtitle: string;
  name: string;
  textColor: string;
  isActive?: boolean;
}> = ({ sectionRef, subtitle, name, textColor, isActive }) => {
  const localRef = useRef<HTMLElement | null>(null);
  const inView = useInScrollView(localRef, 0.35);
  const visible = inView || Boolean(isActive);
  const charLen = Array.from(name.normalize("NFC").trim()).length;

  return (
    <section
      ref={(node) => {
        localRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, paddingBottom: "3.2rem", fontFamily: CUTE_BODY_FONT }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "min(680px, 94%)",
          textAlign: "center",
          padding: "0 1rem",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(0.65rem, 2.2vh, 1.25rem)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: CUTE_BODY_FONT,
            fontSize: "clamp(0.74rem, 1.7vw, 0.96rem)",
            letterSpacing: "0.12em",
            color: textColor,
            fontWeight: 500,
            lineHeight: 1.4,
            userSelect: "none",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
            opacity: visible ? 0.68 : 0,
            filter: visible ? "blur(0px)" : "blur(12px)",
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition:
              "opacity 1s ease 0.15s, filter 1s ease 0.15s, transform 1s cubic-bezier(0.22,1,0.36,1) 0.15s",
          }}
        >
          {subtitle}
        </p>

        <SafeMotionTitle
          text={name}
          visible={visible}
          textColor={textColor}
          baseFontSize="clamp(1.75rem, 5.4vw, 2.95rem)"
          baseDelay={0.45}
          fontFamily={ROMANTIC_DISPLAY_FONT}
          as="h1"
        />

        <div
          style={{
            width: "44px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)",
            transform: visible ? "scaleX(1)" : "scaleX(0)",
            opacity: visible ? 1 : 0,
            transition: `transform 0.85s ease ${0.55 + charLen * 0.075}s, opacity 0.85s ease ${0.55 + charLen * 0.075}s`,
          }}
        />
      </div>
    </section>
  );
};

export const Scene3Cards: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  cardPhotos: CardPhotoItem[];
  hintIdle: string;
  hintExpanded: string;
  runId?: string;
  lockNoticeTick?: number;
  isActive?: boolean;
  autoDemo?: boolean;
  onAllViewedChange?: (allViewed: boolean) => void;
  onCardOpen?: (index: number) => void;
}> = ({
  sectionRef,
  cardPhotos,
  hintIdle,
  hintExpanded,
  runId,
  lockNoticeTick = 0,
  isActive,
  autoDemo = false,
  onAllViewedChange,
  onCardOpen,
}) => {
  const localSectionRef = useRef<HTMLElement | null>(null);
  const inView = useInScrollView(localSectionRef, 0.35);
  const visible = inView || Boolean(isActive);

  const [isFanned, setIsFanned] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [viewedIndices, setViewedIndices] = useState<Set<number>>(() => new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<{ w: number; h: number }>({ w: 340, h: 520 });

  useEffect(() => {
    setIsFanned(false);
    setExpandedIndex(null);
    setViewedIndices(new Set());
  }, [runId, cardPhotos.length]);

  useEffect(() => {
    if (lockNoticeTick > 0) setIsFanned(true);
  }, [lockNoticeTick]);

  // Auto-demo sequence on Scene 3: fan cards -> showcase first card -> close & unlock
  useEffect(() => {
    if (!autoDemo || !isActive) return;
    const t1 = window.setTimeout(() => setIsFanned(true), 600);
    const t2 = window.setTimeout(() => {
      if (cardPhotos.length > 0) {
        setExpandedIndex(0);
        setViewedIndices(new Set(cardPhotos.map((_, idx) => idx)));
      }
    }, 1750);
    const t3 = window.setTimeout(() => {
      setExpandedIndex(null);
    }, 3150);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [autoDemo, isActive, cardPhotos.length]);

  const totalCards = cardPhotos.length;
  const viewedCount = viewedIndices.size;
  const allViewed = autoDemo || totalCards === 0 || viewedCount >= totalCards;

  useEffect(() => {
    onAllViewedChange?.(allViewed);
  }, [allViewed, onAllViewedChange]);

  useEffect(() => {
    const el = containerRef.current;
    const sec = localSectionRef.current;
    if (!el && !sec) return;

    const measure = () => {
      const w = el?.getBoundingClientRect().width || 0;
      const h = sec?.getBoundingClientRect().height || 0;
      setBounds((prev) => ({
        w: w > 40 ? w : prev.w,
        h: h > 160 ? h : prev.h,
      }));
    };
    measure();

    if (typeof ResizeObserver !== "undefined") {
      const obs = new ResizeObserver(measure);
      if (el) obs.observe(el);
      if (sec) obs.observe(sec);
      return () => obs.disconnect();
    }
    return undefined;
  }, []);

  const containerW = bounds.w;
  const sectionH = bounds.h;
  const isCompact = containerW < 520;

  const rows = totalCards <= 3 ? 1 : 2;
  const topRowCount = rows === 1 ? totalCards : Math.ceil(totalCards / 2);
  const maxCols = Math.max(1, topRowCount);
  const gapX = isCompact ? 10 : 18;
  const gapY = isCompact ? 12 : 18;

  const usableW = Math.max(220, containerW - 12);
  const usableH = Math.max(220, sectionH - (isCompact ? 132 : 150));

  const maxWFromWidth = (usableW - (maxCols - 1) * gapX) / maxCols;
  const maxWFromHeight = ((usableH - (rows - 1) * gapY) / rows) * (4 / 5);

  const fannedCardWidth = Math.max(66, Math.min(isCompact ? 120 : 162, maxWFromWidth, maxWFromHeight));
  const collapsedCardWidth = isCompact ? Math.min(132, containerW * 0.36) : Math.min(176, containerW * 0.28);
  const cardWidth = isFanned ? fannedCardWidth : collapsedCardWidth;
  const cardHeight = cardWidth * 1.25;

  const stageHeight = isFanned
    ? Math.max(isCompact ? 220 : 290, rows * cardHeight + (rows - 1) * gapY + 26)
    : isCompact
    ? 210
    : 270;

  const getExpandedProps = (i: number, total: number) => {
    if (total <= 3) {
      const offset = i - (total - 1) / 2;
      return {
        expandedX: offset * (cardWidth + gapX),
        expandedY: Math.abs(offset) * (isCompact ? 6 : 10),
        expandedRotate: offset * (isCompact ? 5 : 6.5),
      };
    }

    const row = i < topRowCount ? 0 : 1;
    const colInRow = row === 0 ? i : i - topRowCount;
    const colsInThisRow = row === 0 ? topRowCount : total - topRowCount;
    const colOffset = colInRow - (colsInThisRow - 1) / 2;
    const rowOffset = row === 0 ? -0.5 : 0.5;
    const arcLift = Math.abs(colOffset) * (isCompact ? 4 : 6);
    return {
      expandedX: colOffset * (cardWidth + gapX),
      expandedY: rowOffset * (cardHeight + gapY) + arcLift,
      expandedRotate: colOffset * (isCompact ? 4.2 : 5.5),
    };
  };

  const openCardModal = (idx: number) => {
    setExpandedIndex(idx);
    setViewedIndices((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    onCardOpen?.(idx);
  };

  const expandedPhoto = expandedIndex !== null ? cardPhotos[expandedIndex] : null;
  const remainingCount = Math.max(0, totalCards - viewedCount);

  const statusText =
    viewedCount >= totalCards
      ? `✨ Đã xem hết ${totalCards} ảnh — lướt xuống để tiếp tục`
      : isFanned
      ? `${hintExpanded} · Còn ${remainingCount} ảnh chưa xem (${viewedCount}/${totalCards})`
      : `${hintIdle} (${viewedCount}/${totalCards} ảnh)`;

  return (
    <section
      ref={(node) => {
        localSectionRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{
        zIndex: 10,
        flexDirection: "column",
        gap: "clamp(0.55rem, 1.8vh, 1rem)",
        overflow: "hidden",
        paddingBottom: "3.2rem",
        fontFamily: CUTE_BODY_FONT,
      }}
    >
      <p
        key={lockNoticeTick}
        style={{
          margin: 0,
          fontFamily: CUTE_BODY_FONT,
          fontSize: "clamp(0.72rem, 1.5vw, 0.88rem)",
          letterSpacing: "0.03em",
          color: viewedCount >= totalCards ? "rgba(196, 181, 253, 0.96)" : "rgba(255,255,255,0.74)",
          fontWeight: 500,
          userSelect: "none",
          textAlign: "center",
          padding: "0 1rem",
          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(8px)",
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition:
            "opacity 0.9s ease 0.15s, filter 0.9s ease 0.15s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s",
          animation: lockNoticeTick > 0 && !allViewed ? "cbjShakeHint 0.45s ease" : undefined,
        }}
      >
        {statusText}
      </p>

      <div
        ref={containerRef}
        onClick={() => {
          if (!isFanned) setIsFanned(true);
          else if (allViewed) setIsFanned((v) => !v);
        }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "min(860px, 95%)",
          height: `${stageHeight}px`,
          cursor: "pointer",
          touchAction: "manipulation",
          transition: "height 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {cardPhotos.map((photo, i) => {
          const total = cardPhotos.length;
          const baseRotate = (i - (total - 1) / 2) * 4.5;
          const { expandedX, expandedY, expandedRotate } = getExpandedProps(i, total);
          const activeFan = isFanned && expandedIndex === null;
          const imgSrc = photo.imageUrl || getCosmicPlaceholderUrl(i);
          const isViewed = viewedIndices.has(i);
          const isBright = isViewed || isFanned;
          const isThisHovered = hoveredCard === i;

          const posStyle: React.CSSProperties =
            photo.captionPosition === "top"
              ? { top: 0, bottom: "auto", paddingTop: "0.65rem" }
              : photo.captionPosition === "center"
              ? { top: "50%", bottom: "auto", transform: "translateY(-50%)" }
              : { bottom: 0, paddingBottom: "0.65rem" };

          const zIdx = activeFan
            ? (isViewed ? 15 : 40) + i + (isThisHovered ? 25 : 0)
            : 20 + i + (isThisHovered ? 10 : 0);

          return (
            <div
              key={photo.id || i}
              className="cbj-card-item"
              onMouseEnter={() => setHoveredCard(i)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / rect.width - 0.5;
                const ny = (e.clientY - rect.top) / rect.height - 0.5;
                setTilt({ rx: -ny * 9, ry: nx * 11 });
              }}
              onMouseLeave={() => {
                setTilt({ rx: 0, ry: 0 });
                setHoveredCard(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isFanned) {
                  setIsFanned(true);
                  return;
                }
                openCardModal(i);
              }}
              style={{
                position: "absolute",
                width: `${cardWidth}px`,
                aspectRatio: "4 / 5",
                zIndex: zIdx,
                transform: activeFan
                  ? `translate(${expandedX}px, ${expandedY}px) rotate(${expandedRotate}deg) scale(${isThisHovered ? 1.05 : isViewed ? 0.96 : 1})`
                  : `translate(0px, 0px) rotate(${baseRotate}deg) scale(1)`,
                opacity: activeFan && isViewed ? 0.65 : 1,
                filter: activeFan && isViewed ? "saturate(0.8) brightness(0.9)" : "none",
                transition:
                  "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease, filter 0.35s ease, width 0.35s ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: isCompact ? "12px" : "15px",
                  overflow: "hidden",
                  position: "relative",
                  background: "rgba(255,255,255,0.04)",
                  border: isViewed
                    ? "1px solid rgba(167, 243, 208, 0.42)"
                    : activeFan
                    ? "1.5px solid rgba(216, 180, 254, 0.72)"
                    : "1px solid rgba(255,255,255,0.16)",
                  boxShadow:
                    activeFan && !isViewed
                      ? "0 10px 28px rgba(0,0,0,0.6), 0 0 16px rgba(168, 85, 247, 0.25)"
                      : "0 10px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
                  transform: isThisHovered
                    ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
                    : "perspective(900px) rotateX(0deg) rotateY(0deg)",
                  transition: "transform 0.25s ease-out, border-color 0.35s ease",
                }}
              >
                <img
                  src={imgSrc}
                  alt={photo.caption || `Card ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />

                {isFanned && (
                  <span
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 600,
                      background: isViewed ? "rgba(16, 185, 129, 0.9)" : "rgba(109, 40, 217, 0.82)",
                      border: isViewed
                        ? "1px solid rgba(167,243,208,0.85)"
                        : "1px solid rgba(233,213,255,0.65)",
                      color: "#ffffff",
                      pointerEvents: "none",
                    }}
                  >
                    {isViewed ? "✓" : i + 1}
                  </span>
                )}

                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "46%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
                {photo.caption && (
                  <p
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      margin: 0,
                      paddingLeft: "0.5rem",
                      paddingRight: "0.5rem",
                      fontSize: isCompact ? "9px" : "10.5px",
                      fontFamily: CUTE_BODY_FONT,
                      color: isBright
                        ? photo.captionColor || "rgba(255,255,255,0.92)"
                        : "rgba(255,255,255,0.36)",
                      textAlign: photo.captionAlign || "center",
                      lineHeight: 1.35,
                      userSelect: "none",
                      pointerEvents: "none",
                      opacity: isFanned ? 1 : 0.65,
                      ...posStyle,
                    }}
                  >
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {expandedIndex !== null && expandedPhoto && (
        <div
          className="cbj-card-modal-backdrop"
          onClick={() => setExpandedIndex(null)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,8,0.86)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.85rem",
            padding: "1.25rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(270px, 76%, 340px)",
              aspectRatio: "4 / 5",
              borderRadius: "18px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
              animation: "cbjZoomIn 0.35s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <img
              src={expandedPhoto.imageUrl || getCosmicPlaceholderUrl(expandedIndex)}
              alt={expandedPhoto.caption || ""}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "45%",
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
              }}
            />
            {expandedPhoto.caption && (
              <p
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: 0,
                  padding: "0.9rem",
                  fontSize: "12.5px",
                  fontFamily: CUTE_BODY_FONT,
                  color: expandedPhoto.captionColor || "rgba(255,255,255,0.95)",
                  textAlign: expandedPhoto.captionAlign || "center",
                  lineHeight: 1.5,
                }}
              >
                {expandedPhoto.caption}
              </p>
            )}
            <button
              type="button"
              onClick={() => setExpandedIndex(null)}
              aria-label="Đóng thẻ"
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                width: "30px",
                height: "30px",
                borderRadius: "999px",
                background: "rgba(0,0,0,0.62)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.92)",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          {totalCards > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}
            >
              <button
                type="button"
                onClick={() => openCardModal((expandedIndex - 1 + totalCards) % totalCards)}
                style={{
                  fontFamily: CUTE_BODY_FONT,
                  padding: "6px 13px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                ‹ Ảnh trước
              </button>
              <span style={{ fontFamily: CUTE_BODY_FONT, fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>
                {expandedIndex + 1} / {totalCards}
              </span>
              <button
                type="button"
                onClick={() => openCardModal((expandedIndex + 1) % totalCards)}
                style={{
                  fontFamily: CUTE_BODY_FONT,
                  padding: "6px 13px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Ảnh tiếp ›
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export const Scene4Candle: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  lines: string[];
  hintText: string;
  textColor: string;
  isActive?: boolean;
  autoDemo?: boolean;
  onBlown?: () => void;
}> = ({ sectionRef, lines, hintText, textColor, isActive, autoDemo = false, onBlown }) => {
  const localRef = useRef<HTMLElement | null>(null);
  const [blown, setBlown] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const inView = useInScrollView(localRef, 0.35);
  const visible = inView || Boolean(isActive);

  useEffect(() => {
    if (!visible) {
      setVisibleLines(0);
      setHintVisible(false);
      return;
    }
    let idx = 0;
    setVisibleLines(0);
    setHintVisible(false);
    const timers: number[] = [];
    const tick = () => {
      idx += 1;
      setVisibleLines(idx);
      if (idx < lines.length) {
        timers.push(window.setTimeout(tick, 520));
      } else {
        timers.push(window.setTimeout(() => setHintVisible(true), 360));
      }
    };
    timers.push(window.setTimeout(tick, 220));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [visible, lines.length]);

  const handleBlow = useCallback(() => {
    if (blown) return;
    setBlown(true);
    setShowSmoke(true);
    setHintVisible(true);
    onBlown?.();
    window.setTimeout(() => setShowSmoke(false), 1600);
  }, [blown, onBlown]);

  useEffect(() => {
    if (!autoDemo || !isActive || blown) return;
    const t = window.setTimeout(() => handleBlow(), 1800);
    return () => window.clearTimeout(t);
  }, [autoDemo, isActive, blown, handleBlow]);

  return (
    <section
      ref={(node) => {
        localRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, paddingBottom: "3.2rem", fontFamily: CUTE_BODY_FONT }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(0.9rem, 2.8vw, 1.65rem)",
          padding: "0 1.4rem",
          maxWidth: "min(520px, 92%)",
        }}
      >
        <button
          type="button"
          onClick={handleBlow}
          aria-label="Thổi nến ước nguyện"
          style={{
            position: "relative",
            width: "clamp(124px, 30vw, 162px)",
            aspectRatio: "180 / 175",
            background: "none",
            border: "none",
            padding: 0,
            cursor: blown ? "default" : "pointer",
            animation: !blown ? "cbjFloatBob 3.2s ease-in-out infinite" : undefined,
          }}
        >
          {!blown && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,210,80,0.14) 0%, transparent 70%)",
                animation: "cbjHaloPulse 2.8s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
          <svg width="100%" height="100%" viewBox="0 0 180 175" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cbj-candleGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8e2d8" />
                <stop offset="38%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#c7bfb3" />
              </linearGradient>
              <linearGradient id="cbj-holderGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b89658" />
                <stop offset="45%" stopColor="#f3dfa9" />
                <stop offset="100%" stopColor="#9c7a3e" />
              </linearGradient>
              <radialGradient id="cbj-holderTop" cx="45%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#fff6dc" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#d7b87a" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#8d6e39" stopOpacity="0.95" />
              </radialGradient>
              <radialGradient id="cbj-flameOuter" cx="50%" cy="90%" r="55%">
                <stop offset="0%" stopColor="#fff7a0" />
                <stop offset="35%" stopColor="#ffcc30" />
                <stop offset="70%" stopColor="#ff7a10" />
                <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cbj-flameInner" cx="50%" cy="90%" r="45%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#fff5c0" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#ffe060" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="90" cy="144" rx="52" ry="11" fill="rgba(0,0,0,0.35)" />
            <path d="M40 132 Q90 150 140 132 L134 141 Q90 155 46 141 Z" fill="url(#cbj-holderGrad)" />
            <ellipse cx="90" cy="132" rx="50" ry="11" fill="url(#cbj-holderTop)" />
            <ellipse cx="90" cy="132" rx="34" ry="6.5" fill="rgba(255,255,255,0.22)" />
            <circle cx="48" cy="108" r="1.4" fill="#fff7cc" opacity="0.65" />
            <circle cx="132" cy="102" r="1.6" fill="#e0e7ff" opacity="0.6" />
            <circle cx="62" cy="84" r="1.1" fill="#ffffff" opacity="0.5" />
            <circle cx="120" cy="78" r="1.2" fill="#ffe699" opacity="0.55" />
            <rect x="78" y="62" width="24" height="69" rx="6" fill="url(#cbj-candleGrad)" />
            <rect x="93" y="62" width="9" height="69" rx="4" fill="rgba(145,130,115,0.22)" />
            <ellipse cx="90" cy="64" rx="12" ry="4.5" fill="#ffffff" opacity="0.95" />
            <ellipse cx="90" cy="64.5" rx="7" ry="2.2" fill="rgba(255,215,130,0.45)" />
            <line x1="90" y1="51" x2="90" y2="63" stroke="#555" strokeWidth="1.4" strokeLinecap="round" />

            {!blown && (
              <g
                transform="translate(90,51)"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "50% 90%",
                  animation: "cbjFlameFlicker 2.2s ease-in-out infinite",
                }}
              >
                <ellipse cx="0" cy="-4" rx="22" ry="13" fill="rgba(255,205,75,0.24)" />
                <path
                  d="M0,0 C9,-9 13,-23 0,-42 C-13,-23 -9,-9 0,0 Z"
                  fill="url(#cbj-flameOuter)"
                  style={{ filter: "drop-shadow(0 0 6px rgba(255,165,35,0.85))" }}
                />
                <path d="M0,-4 C4.5,-11 6.5,-22 0,-35 C-6.5,-22 -4.5,-11 0,-4 Z" fill="url(#cbj-flameInner)" />
              </g>
            )}

            {showSmoke && (
              <g transform="translate(90,51)">
                {[0, 1, 2, 3].map((i) => (
                  <circle
                    key={i}
                    cx={(i % 2 === 0 ? 1 : -1) * (2 + i * 2)}
                    cy={-(10 + i * 9)}
                    r={3 + i}
                    fill="rgba(220,220,220,0.45)"
                    className="cbj-smoke-puff"
                  />
                ))}
                {[-28, -12, 14, 30, 0].map((wx, idx) => (
                  <circle
                    key={`sp-${idx}`}
                    cx={0}
                    cy={-6}
                    r={1.8}
                    fill="#fde68a"
                    style={{
                      ["--cbj-wx" as string]: `${wx}px`,
                      ["--cbj-wy" as string]: `${-75 - idx * 14}px`,
                      animation: `cbjWishSpark 1.4s ease-out ${idx * 0.08}s forwards`,
                    }}
                  />
                ))}
              </g>
            )}
          </svg>
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            minHeight: "4.5rem",
            textAlign: "center",
          }}
        >
          {lines.map((line, i) => (
            <p
              key={`${i}-${line}`}
              style={{
                margin: 0,
                fontFamily: CUTE_BODY_FONT,
                fontSize: "clamp(0.84rem, 1.9vw, 1.04rem)",
                letterSpacing: "0.02em",
                color: textColor,
                fontWeight: i === lines.length - 1 ? 500 : 400,
                lineHeight: 1.55,
                opacity: visibleLines > i ? (i === lines.length - 1 ? 0.95 : 0.76) : 0,
                filter: visibleLines > i ? "blur(0px)" : "blur(8px)",
                transform: visibleLines > i ? "translateY(0)" : "translateY(12px)",
                transition:
                  "opacity 0.95s ease, filter 0.95s ease, transform 0.95s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {line}
            </p>
          ))}
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: CUTE_BODY_FONT,
            fontSize: "clamp(0.72rem, 1.4vw, 0.84rem)",
            letterSpacing: "0.04em",
            color: blown ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.68)",
            userSelect: "none",
            textAlign: "center",
            opacity: hintVisible || blown ? 1 : 0,
            transition: "opacity 0.9s ease",
            animation: hintVisible || blown ? "cbjPulseSoft 2.4s ease-in-out infinite" : undefined,
          }}
        >
          {blown ? "✨ Điều ước đã được gửi lên trời sao" : hintText}
        </p>
      </div>
    </section>
  );
};

export interface GiftBurstPhoto {
  id: string;
  imageUrl: string;
  caption?: string;
}

interface GiftParticle {
  id: number;
  x: number;
  y: number;
  emojiUrl: string;
  rotation: number;
  scale: number;
}

export const Scene4Gift: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  hintText: string;
  accentColor: string;
  opened: boolean;
  giftPhotos: GiftBurstPhoto[];
  isActive?: boolean;
  autoDemo?: boolean;
  onOpen: () => void;
}> = ({ sectionRef, hintText, accentColor, opened, giftPhotos, isActive, autoDemo = false, onOpen }) => {
  const localRef = useRef<HTMLElement | null>(null);
  const inView = useInScrollView(localRef, 0.35);
  const visible = inView || Boolean(isActive);

  const [particles, setParticles] = useState<GiftParticle[]>([]);
  const [zoomedPhoto, setZoomedPhoto] = useState<GiftBurstPhoto | null>(null);

  const triggerBurst = useCallback(() => {
    const urls = [BALLOON_EMOJI_URL, CONFETTI_EMOJI_URL, TADA_EMOJI_URL];
    const burst: GiftParticle[] = Array.from({ length: 28 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 320,
      y: -(Math.random() * 240 + 55),
      emojiUrl: urls[i % urls.length],
      rotation: (Math.random() - 0.5) * 420,
      scale: Math.random() * 0.7 + 0.6,
    }));
    setParticles(burst);
  }, []);

  const handleClick = useCallback(() => {
    triggerBurst();
    onOpen();
  }, [onOpen, triggerBurst]);

  useEffect(() => {
    if (!autoDemo || !isActive || opened) return;
    const t = window.setTimeout(() => handleClick(), 1050);
    return () => window.clearTimeout(t);
  }, [autoDemo, isActive, opened, handleClick]);

  const burstCards = giftPhotos.slice(0, 3);
  const popLayout = [
    { x: "-84px", y: "-114px", rot: "-14deg" },
    { x: "0px", y: "-138px", rot: "0deg" },
    { x: "84px", y: "-114px", rot: "14deg" },
  ];

  return (
    <section
      ref={(node) => {
        localRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, paddingBottom: "3.2rem", fontFamily: CUTE_BODY_FONT }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          position: "relative",
          paddingTop: opened ? "6.5rem" : "0",
          transition: "padding-top 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: CUTE_BODY_FONT,
            fontSize: "clamp(0.76rem, 1.5vw, 0.88rem)",
            letterSpacing: "0.04em",
            color: opened ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.68)",
            userSelect: "none",
            textAlign: "center",
            padding: "0 1.4rem",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.95s ease 0.18s",
          }}
        >
          {opened ? "✨ Quà đã mở — lướt xuống đọc thư nhắn gửi nhé" : hintText}
        </p>

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {opened && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "120px",
                height: "120px",
                borderRadius: "999px",
                border: `2px solid ${accentColor || "#a08cff"}`,
                pointerEvents: "none",
                animation: "cbjRingExpand 0.9s ease-out forwards",
              }}
            />
          )}

          {opened &&
            burstCards.map((photo, idx) => {
              const pos = popLayout[idx] || popLayout[1];
              return (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => setZoomedPhoto(photo)}
                  aria-label={photo.caption || `Ảnh quà ${idx + 1}`}
                  style={{
                    position: "absolute",
                    top: "42%",
                    left: "50%",
                    width: "clamp(70px, 20vw, 94px)",
                    aspectRatio: "4 / 5",
                    padding: "4px 4px 10px",
                    borderRadius: "10px",
                    background: "rgba(18, 25, 48, 0.92)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    boxShadow: "0 14px 34px rgba(0,0,0,0.65)",
                    cursor: "pointer",
                    zIndex: 25 + idx,
                    ["--cbj-px" as string]: pos.x,
                    ["--cbj-py" as string]: pos.y,
                    ["--cbj-pr" as string]: pos.rot,
                    animation: `cbjGiftPhotoPop 0.78s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.12}s both`,
                  }}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || `Gift photo ${idx + 1}`}
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", display: "block" }}
                  />
                </button>
              );
            })}

          <button
            type="button"
            onClick={handleClick}
            aria-label="Mở hộp quà"
            style={{
              position: "relative",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              userSelect: "none",
              zIndex: 20,
              transform: opened ? "scale(0.9) translateY(14px)" : "scale(1)",
              transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {!opened && (
              <div
                style={{
                  position: "absolute",
                  inset: "-28px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${accentColor}26 0%, transparent 70%)`,
                  animation: "cbjHaloPulse 2.8s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
            )}

            {particles.map((p) => (
              <img
                key={p.id}
                src={p.emojiUrl}
                alt=""
                width={30}
                height={30}
                draggable={false}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  pointerEvents: "none",
                  zIndex: 35,
                  ["--cbj-tx" as string]: `${p.x}px`,
                  ["--cbj-ty" as string]: `${p.y}px`,
                  ["--cbj-rot" as string]: `${p.rotation}deg`,
                  ["--cbj-sc" as string]: `${p.scale}`,
                  animation: "cbjBurstOut 1.15s ease-out forwards",
                }}
              />
            ))}

            <img
              src={GIFT_EMOJI_URL}
              alt="Gift"
              width={110}
              height={110}
              draggable={false}
              style={{
                display: "block",
                animation: !opened ? "cbjFloatBob 3.4s ease-in-out infinite" : undefined,
              }}
            />
          </button>
        </div>
      </div>

      {zoomedPhoto && (
        <div
          onClick={() => setZoomedPhoto(null)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,8,0.86)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(270px, 76%, 340px)",
              aspectRatio: "4 / 5",
              borderRadius: "18px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
            }}
          >
            <img
              src={zoomedPhoto.imageUrl}
              alt={zoomedPhoto.caption || ""}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {zoomedPhoto.caption && (
              <p
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: 0,
                  padding: "0.9rem",
                  background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
                  color: "#fff",
                  fontFamily: CUTE_BODY_FONT,
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                {zoomedPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export const Scene5Letter: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  giftLetter: string;
  letterAlign: "left" | "center" | "right";
  lineIntervalMs: number;
  textColor: string;
  isActive?: boolean;
}> = ({ sectionRef, giftLetter, letterAlign, lineIntervalMs, textColor, isActive }) => {
  const localRef = useRef<HTMLElement | null>(null);
  const inView = useInScrollView(localRef, 0.35);
  const shouldStart = Boolean(isActive) || inView;

  const paragraphs = parseLetterParagraphs(giftLetter);
  const totalLines = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    let count = 0;
    const timers: number[] = [];
    for (let i = 0; i < totalLines; i++) {
      timers.push(
        window.setTimeout(() => {
          count += 1;
          setVisibleCount(count);
        }, 180 + i * lineIntervalMs)
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [shouldStart, totalLines, lineIntervalMs, giftLetter]);

  let rowIdx = 0;

  return (
    <section
      ref={(node) => {
        localRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, fontFamily: CUTE_BODY_FONT }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "min(420px, 88%)",
          height: "100%",
          padding: "1.75rem 0.5rem 4rem",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "1px",
            height: "28px",
            background: "rgba(255,255,255,0.14)",
            marginBottom: "1rem",
            flexShrink: 0,
            alignSelf: "center",
            opacity: shouldStart ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        />
        <div className="cbj-letter-scroll" style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.15rem",
              alignItems:
                letterAlign === "left" ? "flex-start" : letterAlign === "right" ? "flex-end" : "center",
              textAlign: letterAlign,
              paddingBottom: "1rem",
            }}
          >
            {paragraphs.map((para, pIdx) => (
              <div
                key={pIdx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  width: "100%",
                  alignItems:
                    letterAlign === "left"
                      ? "flex-start"
                      : letterAlign === "right"
                      ? "flex-end"
                      : "center",
                }}
              >
                {para.map((line, lIdx) => {
                  const idx = rowIdx++;
                  const isVis = idx < visibleCount;
                  return (
                    <p
                      key={`${pIdx}-${lIdx}`}
                      style={{
                        margin: 0,
                        fontFamily: CUTE_BODY_FONT,
                        fontSize: "clamp(0.84rem, 1.9vw, 1.02rem)",
                        letterSpacing: "0.015em",
                        color: textColor,
                        lineHeight: 1.75,
                        userSelect: "none",
                        opacity: isVis ? 0.9 : 0,
                        filter: isVis ? "blur(0px)" : "blur(7px)",
                        transform: isVis ? "translateY(0)" : "translateY(12px)",
                        transition:
                          "opacity 0.95s ease, filter 0.95s ease, transform 0.95s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.12)",
            marginTop: "0.85rem",
            flexShrink: 0,
            alignSelf: "center",
            opacity: shouldStart ? 1 : 0,
            transition: "opacity 0.8s ease 0.4s",
          }}
        />
      </div>
    </section>
  );
};

export const Scene6Uplift: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  lines: string[];
  textColor: string;
  isActive?: boolean;
}> = ({ sectionRef, lines, textColor, isActive }) => {
  const localRef = useRef<HTMLElement | null>(null);
  const inView = useInScrollView(localRef, 0.35);
  const visible = inView || Boolean(isActive);

  return (
    <section
      ref={(node) => {
        localRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, paddingBottom: "2.8rem", fontFamily: CUTE_BODY_FONT }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "0 1.6rem",
          maxWidth: "min(520px, 92%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(0.7rem, 2.2vh, 1.15rem)",
        }}
      >
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          const delay = 0.2 + i * 0.48;
          return (
            <p
              key={`${i}-${line}`}
              style={{
                margin: 0,
                fontFamily: CUTE_BODY_FONT,
                fontWeight: isLast ? 500 : 400,
                userSelect: "none",
                fontSize: i === 0 ? "clamp(0.86rem, 2vw, 1.12rem)" : "clamp(0.94rem, 2.3vw, 1.24rem)",
                letterSpacing: "0.02em",
                lineHeight: 1.55,
                color: textColor,
                opacity: visible ? (isLast ? 0.95 : 0.74) : 0,
                filter: visible ? "blur(0px)" : "blur(8px)",
                transform: visible ? "translateY(0)" : "translateY(14px)",
                transition: `opacity 1.05s ease ${delay}s, filter 1.05s ease ${delay}s, transform 1.05s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    </section>
  );
};

export const Scene7Ending: React.FC<{
  sectionRef?: React.Ref<HTMLElement>;
  lines: string[];
  name: string;
  textColor: string;
  isActive?: boolean;
  onVisible?: () => void;
}> = ({ sectionRef, lines, name, textColor, isActive, onVisible }) => {
  const localRef = useRef<HTMLElement | null>(null);
  const inView = useInScrollView(localRef, 0.4, onVisible);
  const visible = inView || Boolean(isActive);

  useEffect(() => {
    if (isActive) onVisible?.();
  }, [isActive, onVisible]);

  return (
    <section
      ref={(node) => {
        localRef.current = node;
        if (typeof sectionRef === "function") sectionRef(node);
        else if (sectionRef && "current" in sectionRef) {
          (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      }}
      className="cbj-scroll-snap-start"
      style={{ zIndex: 10, paddingBottom: "4.8rem", fontFamily: CUTE_BODY_FONT }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "min(640px, 94%)",
          textAlign: "center",
          padding: "0 1rem",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(0.75rem, 2.4vh, 1.35rem)",
        }}
      >
        {lines.map((text, i) => {
          const delay = 0.2 + i * 0.45;
          return (
            <p
              key={`${i}-${text}`}
              style={{
                margin: 0,
                fontFamily: CUTE_BODY_FONT,
                userSelect: "none",
                fontSize: "clamp(0.86rem, 2vw, 1.12rem)",
                letterSpacing: "0.025em",
                lineHeight: 1.5,
                color: textColor,
                opacity: visible ? 0.82 : 0,
                filter: visible ? "blur(0px)" : "blur(8px)",
                transform: visible ? "translateY(0)" : "translateY(14px)",
                transition: `opacity 1s ease ${delay}s, filter 1s ease ${delay}s, transform 1s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
              }}
            >
              {text}
            </p>
          );
        })}

        <div
          style={{
            margin: "0.25rem 0",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.8)",
            filter: visible ? "blur(0px)" : "blur(8px)",
            transition:
              "opacity 1.05s ease 0.75s, transform 1.05s cubic-bezier(0.22,1,0.36,1) 0.75s, filter 1.05s ease 0.75s",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Ngôi sao ước nguyện"
            style={{
              display: "block",
              animation: "cbjFloatBob 4s ease-in-out infinite",
              filter: "drop-shadow(0 0 14px rgba(196, 181, 253, 0.45))",
            }}
          >
            <defs>
              <radialGradient id="cbj-endStarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#e9d5ff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#a08cff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="cbj-endStarFill" x1="15" y1="15" x2="65" y2="65" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fffdf0" />
                <stop offset="55%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="34" fill="url(#cbj-endStarGlow)" />
            <path d="M40 12 L45.8 31.2 L65 37 L45.8 42.8 L40 62 L34.2 42.8 L15 37 L34.2 31.2 Z" fill="url(#cbj-endStarFill)" />
            <circle cx="60" cy="20" r="2.2" fill="#fef3c7" opacity="0.85" />
            <circle cx="20" cy="56" r="1.7" fill="#e9d5ff" opacity="0.75" />
          </svg>
        </div>

        <SafeMotionTitle
          text={name}
          visible={visible}
          textColor={textColor}
          baseFontSize="clamp(1.5rem, 4.6vw, 2.45rem)"
          baseDelay={1.05}
          fontFamily={ROMANTIC_DISPLAY_FONT}
          as="p"
        />
      </div>
    </section>
  );
};
