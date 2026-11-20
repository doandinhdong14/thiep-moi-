"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { EffectProps } from "@/components/cards/card-01-first-gift/sdk";
import type { Card03PhotoItem } from "../card03Mapper";
import {
  FLOWTIME_PPT_ASSETS,
  SECTION_PAGE_COUNTS,
  DEFAULT_TEXT_MAP,
  type LoveStyle14FlowtimePptConfig,
} from "./config";

const PAGE_SINGLE_TEXT_KEY: Record<number, string> = {
  2: "text-1",
  3: "text-2",
  4: "text-3",
  5: "text-4",
  6: "text-5",
  7: "text-6",
  8: "text-7",
  9: "text-8",
  10: "text-9",
  11: "text-10",
  13: "text-13",
  14: "text-14",
  17: "text-19",
  18: "text-20",
  19: "text-21",
  20: "text-22",
  21: "text-23",
  22: "text-24",
  23: "text-25",
  24: "text-26",
  26: "text-29",
  27: "text-30",
  28: "text-31",
  29: "text-32",
  30: "text-33",
  31: "text-34",
  32: "text-35",
  33: "text-36",
  34: "text-37",
  36: "text-41",
  37: "text-42",
  38: "text-43",
  39: "text-44",
  40: "text-45",
  41: "text-46",
  43: "text-49",
  50: "text-66",
  52: "text-71",
  53: "text-72",
};

// 12 milestone story pages (1-based global page numbers) where user-uploaded photos appear
const PHOTO_MILESTONE_PAGES = [17, 19, 21, 23, 25, 28, 30, 33, 39, 46, 53, 55] as const;
const PHOTO_SLOT_BY_PAGE = new Map<number, number>(
  PHOTO_MILESTONE_PAGES.map((pageNum, idx) => [pageNum, idx])
);

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Substitute sender (boyName) & recipient (girlName) across all 55 pages of the
 * "số 1 minh anh" Vietnamese story, then apply any customPageTexts overrides.
 */
function buildTextLookup(config: LoveStyle14FlowtimePptConfig): {
  texts: Record<string, string>;
  pageOverrides: Record<number, string>;
} {
  const result: Record<string, string> = { ...DEFAULT_TEXT_MAP };
  const pageOverrides: Record<number, string> = {};

  const boy = (config.boyName || "").trim() || "Tớ";
  const girl = (config.girlName || "").trim() || "Minh Anh";
  const boyCap = capitalizeFirst(boy);

  if (boy !== "Tớ" || girl !== "Minh Anh") {
    for (const [key, value] of Object.entries(result)) {
      if (key === "text-75" || key === "text-76" || key === "text-77") continue;
      let next = value;
      if (girl !== "Minh Anh") {
        next = next.replace(/Minh Anh/g, girl);
        next = next.replace(/(?<![\p{L}])Cậu(?![\p{L}])/gu, capitalizeFirst(girl));
        next = next.replace(/(?<![\p{L}])cậu(?![\p{L}])/gu, girl);
      }
      if (boy !== "Tớ") {
        next = next.replace(/(?<![\p{L}])Tớ(?![\p{L}])/gu, boyCap);
        next = next.replace(/(?<![\p{L}])tớ(?![\p{L}])/gu, boy);
      }
      result[key] = next;
    }
  }

  result["text-75"] = boy;
  result["text-76"] = girl;
  result["text-77"] =
    config.foreverText !== undefined ? config.foreverText : DEFAULT_TEXT_MAP["text-77"];
  result["text-78"] =
    config.subtitleText !== undefined ? config.subtitleText : DEFAULT_TEXT_MAP["text-78"];
  result["text-72"] =
    config.page53Title !== undefined && config.page53Title.length > 0
      ? config.page53Title
      : DEFAULT_TEXT_MAP["text-72"];

  const rawCustom = (config.customPageTexts || "").trim();
  if (rawCustom.length > 0) {
    const parts = rawCustom
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    parts.forEach((part, idx) => {
      const colonIdx = part.indexOf(":");
      if (colonIdx > 0) {
        const rawKey = part.slice(0, colonIdx).trim();
        const val = part.slice(colonIdx + 1).trim();
        const pageMatch = rawKey.match(/^(?:p|page|trang)\s*(\d{1,2})$/i);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1], 10);
          if (pageNum >= 1 && pageNum <= 55) {
            const singleKey = PAGE_SINGLE_TEXT_KEY[pageNum];
            if (singleKey) {
              result[singleKey] = val;
            } else {
              pageOverrides[pageNum] = val;
            }
          }
          return;
        }
        const normKey = rawKey.startsWith("text-") ? rawKey : `text-${rawKey}`;
        result[normKey] = val;
      } else {
        result[`text-${idx + 1}`] = part;
      }
    });
  }

  return { texts: result, pageOverrides };
}

export function getGlobalPageNumber(sectionIdx: number, pageIdx: number): number {
  let count = 0;
  for (let s = 0; s < sectionIdx; s++) {
    count += SECTION_PAGE_COUNTS[s];
  }
  return count + pageIdx + 1;
}

export interface FlowtimeJumpTarget {
  sectionIdx: number;
  pageIdx: number;
  overview?: boolean;
  seq: number;
}

export interface FlowtimeOverlayProps extends EffectProps<LoveStyle14FlowtimePptConfig> {
  photos?: Card03PhotoItem[];
  onSelectPhoto?: (photoIndex: number) => void;
  onUserInteract?: () => void;
  onPageStateChange?: (info: {
    sectionIdx: number;
    pageIdx: number;
    globalPage: number;
    isOverview: boolean;
    hasReachedEnd: boolean;
  }) => void;
  forcedJump?: FlowtimeJumpTarget | null;
}

export const FlowtimeOverlay: React.FC<FlowtimeOverlayProps> = ({
  config,
  runtime,
  emit,
  photos = [],
  onSelectPhoto,
  onUserInteract,
  onPageStateChange,
  forcedJump,
}) => {
  const initSection = Math.max(0, Math.min(8, (config.startSection || 1) - 1));
  const initPage = Math.max(
    0,
    Math.min((SECTION_PAGE_COUNTS[initSection] || 4) - 1, (config.startPage || 1) - 1)
  );

  const [sectionIdx, setSectionIdx] = useState<number>(initSection);
  const [pageIdx, setPageIdx] = useState<number>(initPage);
  const isInitAtEnd =
    initSection === SECTION_PAGE_COUNTS.length - 1 &&
    initPage === SECTION_PAGE_COUNTS[SECTION_PAGE_COUNTS.length - 1] - 1;
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(isInitAtEnd);
  const [isOverview, setIsOverview] = useState<boolean>(
    isInitAtEnd && Boolean(config.overviewMode)
  );

  const wheelLockRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: runtime.viewport?.width || 1280,
    h: runtime.viewport?.height || 720,
  });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isAtEnd =
    sectionIdx === SECTION_PAGE_COUNTS.length - 1 &&
    pageIdx === SECTION_PAGE_COUNTS[SECTION_PAGE_COUNTS.length - 1] - 1;

  useEffect(() => {
    if (isAtEnd) {
      setHasReachedEnd(true);
    }
  }, [isAtEnd]);

  useEffect(() => {
    const s = Math.max(0, Math.min(8, (config.startSection || 1) - 1));
    const p = Math.max(0, Math.min((SECTION_PAGE_COUNTS[s] || 4) - 1, (config.startPage || 1) - 1));
    const startedAtEnd =
      s === SECTION_PAGE_COUNTS.length - 1 &&
      p === SECTION_PAGE_COUNTS[SECTION_PAGE_COUNTS.length - 1] - 1;
    setSectionIdx(s);
    setPageIdx(p);
    setHasReachedEnd(startedAtEnd);
    if (!startedAtEnd) {
      setIsOverview(false);
    }
  }, [config.startSection, config.startPage, runtime.runId]);

  useEffect(() => {
    if (forcedJump) {
      const clampedS = Math.max(0, Math.min(SECTION_PAGE_COUNTS.length - 1, forcedJump.sectionIdx));
      const clampedP = Math.max(0, Math.min(SECTION_PAGE_COUNTS[clampedS] - 1, forcedJump.pageIdx));
      setSectionIdx(clampedS);
      setPageIdx(clampedP);
      if (clampedS === 8 && clampedP === 3) {
        setHasReachedEnd(true);
      }
      setIsOverview(Boolean(forcedJump.overview));
    }
  }, [forcedJump]);

  const currentGlobalPage = getGlobalPageNumber(sectionIdx, pageIdx);

  useEffect(() => {
    onPageStateChange?.({
      sectionIdx,
      pageIdx,
      globalPage: currentGlobalPage,
      isOverview,
      hasReachedEnd,
    });
  }, [sectionIdx, pageIdx, currentGlobalPage, isOverview, hasReachedEnd, onPageStateChange]);

  const { texts: textMap, pageOverrides } = useMemo(() => buildTextLookup(config), [config]);

  const gotoPage = useCallback(
    (targetSection: number, targetPage: number, exitOverview = false) => {
      const clampedS = Math.max(0, Math.min(SECTION_PAGE_COUNTS.length - 1, targetSection));
      const maxP = SECTION_PAGE_COUNTS[clampedS] - 1;
      const clampedP = Math.max(0, Math.min(maxP, targetPage));
      setSectionIdx(clampedS);
      setPageIdx(clampedP);
      if (exitOverview) {
        setIsOverview(false);
      }
      if (clampedS === 8 && clampedP === 3) {
        emit?.({ type: "complete", runId: runtime.runId });
      }
    },
    [emit, runtime.runId]
  );

  const nextPage = useCallback(() => {
    setSectionIdx((curS) => {
      const maxP = SECTION_PAGE_COUNTS[curS] - 1;
      if (pageIdx < maxP) {
        setPageIdx(pageIdx + 1);
        if (curS === 8 && pageIdx + 1 === 3) {
          emit?.({ type: "complete", runId: runtime.runId });
        }
        return curS;
      }
      if (curS < SECTION_PAGE_COUNTS.length - 1) {
        setPageIdx(0);
        return curS + 1;
      }
      return curS;
    });
  }, [pageIdx, emit, runtime.runId]);

  const prevPage = useCallback(() => {
    setSectionIdx((curS) => {
      if (pageIdx > 0) {
        setPageIdx(pageIdx - 1);
        return curS;
      }
      if (curS > 0) {
        const prevS = curS - 1;
        setPageIdx(SECTION_PAGE_COUNTS[prevS] - 1);
        return prevS;
      }
      return curS;
    });
  }, [pageIdx]);

  const nextSection = useCallback(() => {
    setSectionIdx((curS) => {
      if (curS < SECTION_PAGE_COUNTS.length - 1) {
        const nextS = curS + 1;
        const nextP =
          nextS < SECTION_PAGE_COUNTS.length - 1
            ? 0
            : Math.min(pageIdx, SECTION_PAGE_COUNTS[nextS] - 1);
        setPageIdx(nextP);
        return nextS;
      }
      return curS;
    });
  }, [pageIdx]);

  const prevSection = useCallback(() => {
    setSectionIdx((curS) => {
      if (curS > 0) {
        setPageIdx(0);
        return curS - 1;
      }
      return curS;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onUserInteract?.();
          if (hasReachedEnd) {
            setIsOverview((prev) => !prev);
          } else if (isOverview) {
            setIsOverview(false);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          onUserInteract?.();
          if (isOverview) setIsOverview(false);
          else nextPage();
          break;
        case "ArrowUp":
          e.preventDefault();
          onUserInteract?.();
          if (isOverview) setIsOverview(false);
          else prevPage();
          break;
        case "ArrowRight":
          e.preventDefault();
          onUserInteract?.();
          if (isOverview) setIsOverview(false);
          else nextSection();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onUserInteract?.();
          if (isOverview) setIsOverview(false);
          else prevSection();
          break;
        case "Home":
          e.preventDefault();
          onUserInteract?.();
          gotoPage(0, 0, true);
          break;
        case "End":
          e.preventDefault();
          onUserInteract?.();
          gotoPage(8, SECTION_PAGE_COUNTS[8] - 1, true);
          break;
        case "Enter":
          if (isOverview) {
            e.preventDefault();
            setIsOverview(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOverview,
    hasReachedEnd,
    nextPage,
    prevPage,
    nextSection,
    prevSection,
    gotoPage,
    onUserInteract,
  ]);

  // AutoPlay / AutoDemo choreography: smoothly walks slides, opens Heart Overview at page 55, then loops
  useEffect(() => {
    if (!config.autoPlay || runtime.isPaused) return;
    const speed = Math.max(0.2, runtime.speed || 1.0);
    const intervalMs = Math.max(700, ((config.autoPlayIntervalSec || 2.2) * 1000) / speed);

    if (isOverview) {
      const loopTimer = window.setTimeout(() => {
        setIsOverview(false);
        setSectionIdx(0);
        setPageIdx(0);
      }, 4200);
      return () => window.clearTimeout(loopTimer);
    }

    if (isAtEnd) {
      const overviewTimer = window.setTimeout(() => {
        setHasReachedEnd(true);
        setIsOverview(true);
      }, Math.max(1800, intervalMs));
      return () => window.clearTimeout(overviewTimer);
    }

    const timer = window.setTimeout(() => {
      nextPage();
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [
    config.autoPlay,
    config.autoPlayIntervalSec,
    runtime.isPaused,
    runtime.speed,
    isOverview,
    isAtEnd,
    nextPage,
  ]);

  // Mouse wheel navigation
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (isOverview) return;
      const now = Date.now();
      if (now - wheelLockRef.current < 320) return;
      if (Math.abs(e.deltaY) > 18) {
        wheelLockRef.current = now;
        onUserInteract?.();
        if (e.deltaY > 0) nextPage();
        else prevPage();
      } else if (Math.abs(e.deltaX) > 25) {
        wheelLockRef.current = now;
        onUserInteract?.();
        if (e.deltaX > 0) nextSection();
        else prevSection();
      }
    },
    [isOverview, nextPage, prevPage, nextSection, prevSection, onUserInteract]
  );

  // Touch swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      if (Math.abs(dx) < 44 && Math.abs(dy) < 44) return;
      onUserInteract?.();
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) prevSection();
        else nextSection();
      } else {
        if (dy > 0) prevPage();
        else nextPage();
      }
    },
    [prevSection, nextSection, prevPage, nextPage, onUserInteract]
  );

  const getPageClasses = (sIdx: number, pIdx: number, baseClasses: string) => {
    const classes = ["ft-page", baseClasses];
    if (sIdx === sectionIdx && pIdx === pageIdx) {
      classes.push("hilite", "actual");
    } else {
      if (sIdx < sectionIdx) classes.push("past-section");
      else if (sIdx > sectionIdx) classes.push("future-section");
      if (pIdx < pageIdx) classes.push("past-page");
      else if (pIdx > pageIdx) classes.push("future-page");
    }
    return classes.join(" ");
  };

  const handlePageClick = (sIdx: number, pIdx: number, e: React.MouseEvent) => {
    if (isOverview) {
      e.preventDefault();
      e.stopPropagation();
      onUserInteract?.();
      gotoPage(sIdx, pIdx, true);
    }
  };

  const renderSlidePhoto = (globalPageNum: number) => {
    if (!photos.length) return null;
    const slotIdx = PHOTO_SLOT_BY_PAGE.get(globalPageNum);
    if (slotIdx === undefined) return null;
    const photo = photos[slotIdx];
    if (!photo) return null;

    return (
      <button
        type="button"
        className="tc3-memory-polaroid-btn"
        onClick={(e) => {
          e.stopPropagation();
          onUserInteract?.();
          onSelectPhoto?.(slotIdx);
        }}
        title="Nhấn để phóng to ảnh kỷ niệm"
      >
        <img src={photo.url} alt={photo.caption || `Kỷ niệm ${slotIdx + 1}`} />
        <span className="tc3-memory-polaroid-cap">{photo.caption}</span>
      </button>
    );
  };

  const OVERVIEW_TILE_W = 1120;
  const OVERVIEW_TILE_H = 700;
  const OVERVIEW_HEART_W = OVERVIEW_TILE_W * 9;
  const OVERVIEW_TOP_OFFSET = OVERVIEW_TILE_W * 0.4;
  const OVERVIEW_BOTTOM_OFFSET = OVERVIEW_TILE_W * 0.6;
  const OVERVIEW_HEART_H = OVERVIEW_TOP_OFFSET + OVERVIEW_TILE_H * 7 + OVERVIEW_BOTTOM_OFFSET;

  const safeW = containerSize.w > 0 ? containerSize.w : 1280;
  const safeH = containerSize.h > 0 ? containerSize.h : 720;
  const overviewScale = Math.min((safeW * 0.9) / OVERVIEW_HEART_W, (safeH * 0.8) / OVERVIEW_HEART_H);
  const overviewTx = (safeW - OVERVIEW_HEART_W * overviewScale) / 2;
  const overviewTy =
    (safeH - OVERVIEW_HEART_H * overviewScale) / 2 + OVERVIEW_TOP_OFFSET * overviewScale;

  const flowtimeTransform = isOverview
    ? `translate3d(${overviewTx}px, ${overviewTy}px, 0) scale(${overviewScale})`
    : `translate3d(-${sectionIdx * 100}%, -${pageIdx * 100}%, 0)`;

  const durationMs = Math.max(0, config.transitionDurationMs ?? 600);
  const has3DTilt = (config.spaceTiltXDeg ?? 0) !== 0 || (config.spaceTiltYDeg ?? 0) !== 0;

  return (
    <div
      ref={rootRef}
      className={`ft-ppt-root ft-absolute-nav${isOverview ? " ft-overview" : ""}`}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "360px",
        overflow: "hidden",
        containerType: "inline-size",
        containerName: "ft-card",
        backgroundColor: isOverview ? "#aaaaaa" : config.backgroundColor || "#fed1ea",
        color: config.primaryTextColor || "#613b3b",
        textShadow: "1px 1px 0 rgba(255,255,255,0.4)",
        fontFamily:
          '"Segoe UI", Roboto, "Noto Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        whiteSpace: "nowrap",
        userSelect: "none",
        perspective: has3DTilt ? "1200px" : undefined,
      }}
    >
      <style>{`
        .ft-ppt-root * {
          box-sizing: border-box;
        }
        .ft-ppt-root .flowtime {
          font-size: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          transform-origin: 0 0;
          backface-visibility: hidden;
          white-space: nowrap;
        }
        .ft-ppt-root .flowtime.no-transition {
          transition: transform 0s !important;
        }
        .ft-ppt-root.ft-overview .flowtime {
          width: ${OVERVIEW_TILE_W}px;
          height: ${OVERVIEW_TILE_H}px;
        }
        .ft-ppt-root .ft-section {
          width: 100%;
          height: 100%;
          position: relative;
          transform: translateZ(0);
          font-size: 16px;
          white-space: normal;
          display: inline-block;
          vertical-align: top;
        }
        .ft-ppt-root .ft-section-thumb {
          font-size: 16px;
          white-space: normal;
          display: inline-block;
          vertical-align: top;
        }
        .ft-ppt-root .ft-page {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: auto;
          transform: translateZ(0);
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
          background-color: ${config.backgroundColor || "#fed1ea"};
          text-align: center;
          overflow: hidden;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
        }
        .ft-ppt-root .ft-page.actual {
          z-index: 100;
        }
        .ft-ppt-root.ft-overview .ft-page {
          cursor: pointer;
          transition: all 0.5s cubic-bezier(.77,.10,.22,1);
          transform: scale(0.95);
          transform-origin: 50% 50%;
          box-shadow: 0 6px 24px rgba(0,0,0,0.22);
        }
        .ft-ppt-root.ft-overview .ft-page * {
          pointer-events: none;
        }
        .ft-ppt-root .flowtime h1,
        .ft-ppt-root .flowtime h2,
        .ft-ppt-root .flowtime h3,
        .ft-ppt-root .flowtime h4,
        .ft-ppt-root .flowtime h5,
        .ft-ppt-root .flowtime h6,
        .ft-ppt-root .flowtime p {
          display: block;
          margin: 0;
          max-width: 100%;
          font-family: inherit;
          white-space: normal;
          overflow-wrap: break-word;
          transition: all 0.3s cubic-bezier(.77,.10,.22,1);
        }
        .ft-ppt-root .flowtime h1,
        .ft-ppt-root .flowtime h2,
        .ft-ppt-root .flowtime h3,
        .ft-ppt-root .flowtime h4,
        .ft-ppt-root .flowtime h5,
        .ft-ppt-root .flowtime h6,
        .ft-ppt-root .ft-page:not(.page-1) p {
          font-weight: 700;
          color: ${config.primaryTextColor || "#613b3b"};
          padding-top: 0.4em;
        }
        .ft-ppt-root .flowtime h1 { font-size: clamp(1.7rem, 4.2cqw, 3.6rem); line-height: 1.2; }
        .ft-ppt-root .flowtime h2,
        .ft-ppt-root .flowtime h3,
        .ft-ppt-root .ft-page:not(.page-1) p {
          font-size: clamp(1.05rem, 2.25cqw, 1.85rem);
          line-height: 1.4;
        }
        .ft-ppt-root .flowtime h4,
        .ft-ppt-root .flowtime h5,
        .ft-ppt-root .flowtime h6 {
          font-size: clamp(0.95rem, 1.8cqw, 1.45rem);
          line-height: 1.35;
        }
        .ft-ppt-root .ft-page:not(.page-1) p {
          margin: 0;
        }
        .ft-ppt-root .flowtime img {
          max-width: 100%;
          max-height: 100%;
          display: block;
          margin: 0 auto;
          transform: translate3d(0,0,0) scale(${config.imageScale ?? 1});
          border-radius: ${config.imageBorderRadius ?? 0}px;
          backface-visibility: hidden;
        }

        /* Overview Heart-Shaped Section Offsets */
        .ft-ppt-root.ft-overview .section-1 { margin-top: 0; }
        .ft-ppt-root.ft-overview .section-2 { margin-top: -40%; }
        .ft-ppt-root.ft-overview .section-3 { margin-top: -40%; }
        .ft-ppt-root.ft-overview .section-4 { margin-top: 0; }
        .ft-ppt-root.ft-overview .section-5 { margin-top: 60%; }
        .ft-ppt-root.ft-overview .section-6 { margin-top: 0; }
        .ft-ppt-root.ft-overview .section-7 { margin-top: -40%; }
        .ft-ppt-root.ft-overview .section-8 { margin-top: -40%; }
        .ft-ppt-root.ft-overview .section-9 { margin-top: 0; }

        /* Progress Thumbnail Heart Map */
        .ft-ppt-root .ft-default-progress {
          position: absolute;
          bottom: 2rem;
          right: 1.5rem;
          z-index: 1000;
          opacity: 0.45;
          transition: all 0.5s cubic-bezier(.77,.10,.22,1);
        }
        .ft-ppt-root .ft-default-progress:hover {
          opacity: 1;
        }
        .ft-ppt-root.ft-overview .ft-default-progress {
          opacity: 0;
          pointer-events: none;
        }
        .ft-ppt-root .ft-page-thumb {
          box-sizing: border-box;
          width: 18px;
          height: 12px;
          margin-right: 1px;
          margin-bottom: 1px;
          background-color: #a54479;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(.77,.10,.22,1);
        }
        .ft-ppt-root .ft-page-thumb:hover {
          background-color: rgba(255,255,255,0.8);
        }
        .ft-ppt-root .ft-page-thumb.actual {
          background-color: #44a54a;
          border: 0;
        }
        .ft-ppt-root .thumb-section-0 { position: relative; top: 13px; }
        .ft-ppt-root .thumb-section-3 { position: relative; top: 13px; }
        .ft-ppt-root .thumb-section-4 { position: relative; top: 26px; }
        .ft-ppt-root .thumb-section-5 { position: relative; top: 13px; }
        .ft-ppt-root .thumb-section-8 { position: relative; top: 13px; }

        /* Layout utility classes */
        .ft-ppt-root .left-img { padding: 0; text-align: left; }
        .ft-ppt-root .left-img img {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 100%;
          width: auto;
          max-width: 64%;
          object-fit: contain;
          object-position: left bottom;
          z-index: 1;
        }
        .ft-ppt-root .left-img p,
        .ft-ppt-root .left-img h2,
        .ft-ppt-root .left-img h3,
        .ft-ppt-root .left-img .text {
          position: absolute;
          top: 3.25rem;
          right: 1.5rem;
          max-width: 48%;
          max-height: calc(100% - 7.5rem);
          overflow-y: auto;
          z-index: 2;
          text-align: right;
          padding: 0.25em 0.4em;
          margin: 0;
          text-shadow: 0 1px 8px rgba(255,255,255,0.9), 0 0 3px rgba(255,255,255,0.9);
        }
        .ft-ppt-root .full-img { padding: 0; }
        .ft-ppt-root .full-img img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .ft-ppt-root .full-img > h2,
        .ft-ppt-root .full-img > h3,
        .ft-ppt-root .full-img > p.text,
        .ft-ppt-root .full-img > .center-text {
          position: absolute;
          top: 2.5rem;
          left: 0;
          right: 0;
          width: 100%;
          margin: 0;
          padding: 0.9rem 1.5rem;
          text-align: center;
          z-index: 2;
          text-shadow: 0 1px 10px rgba(255,255,255,0.92), 0 0 4px rgba(255,255,255,0.95);
        }
        .ft-ppt-root .right-img { padding: 0; text-align: left; }
        .ft-ppt-root .right-img img,
        .ft-ppt-root .right-img .text { position: absolute; }
        .ft-ppt-root .right-img img {
          margin: 0;
          height: 100%;
          width: auto;
          max-width: 54%;
          right: 0;
          bottom: 0;
          object-fit: contain;
          object-position: right bottom;
          z-index: 1;
        }
        .ft-ppt-root .right-img .text {
          left: 0;
          top: 2.5rem;
          max-width: 52%;
          z-index: 2;
          margin: 0;
          padding: 1.5rem 1.5rem 4.5rem 1.5rem;
          text-align: left;
          text-shadow: 0 1px 8px rgba(255,255,255,0.9);
        }
        .ft-ppt-root .center-img {
          width: 100%;
          height: 100%;
          background-position: center center;
          background-repeat: no-repeat;
          background-size: contain;
        }

        /* Flex column layout for standard caption + centered image slides */
        .ft-ppt-root .page-2,
        .ft-ppt-root .page-7,
        .ft-ppt-root .page-9,
        .ft-ppt-root .page-10,
        .ft-ppt-root .page-13,
        .ft-ppt-root .page-17,
        .ft-ppt-root .page-19,
        .ft-ppt-root .page-21,
        .ft-ppt-root .page-26,
        .ft-ppt-root .page-27,
        .ft-ppt-root .page-29,
        .ft-ppt-root .page-30,
        .ft-ppt-root .page-31,
        .ft-ppt-root .page-32,
        .ft-ppt-root .page-33,
        .ft-ppt-root .page-38,
        .ft-ppt-root .page-43,
        .ft-ppt-root .page-53 {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
        }
        .ft-ppt-root .page-2 p,
        .ft-ppt-root .page-7 h3,
        .ft-ppt-root .page-9 h3,
        .ft-ppt-root .page-10 h3,
        .ft-ppt-root .page-13 h3,
        .ft-ppt-root .page-17 h3,
        .ft-ppt-root .page-19 h3,
        .ft-ppt-root .page-21 h3,
        .ft-ppt-root .page-26 h3,
        .ft-ppt-root .page-27 h3,
        .ft-ppt-root .page-29 h3,
        .ft-ppt-root .page-30 h3,
        .ft-ppt-root .page-31 h3,
        .ft-ppt-root .page-32 h3,
        .ft-ppt-root .page-33 h3,
        .ft-ppt-root .page-38 h3,
        .ft-ppt-root .page-43 h3,
        .ft-ppt-root .page-53 h3,
        .ft-ppt-root .page-53 h6 {
          position: relative;
          top: auto;
          left: auto;
          right: auto;
          z-index: 2;
          flex-shrink: 0;
          width: 100%;
          max-width: min(92%, 960px);
          height: auto;
          margin: 0;
          padding: 0.15em 0;
          text-align: center;
        }
        .ft-ppt-root .page-2 img,
        .ft-ppt-root .page-7 img,
        .ft-ppt-root .page-9 img,
        .ft-ppt-root .page-10 img,
        .ft-ppt-root .page-13 img,
        .ft-ppt-root .page-17 img,
        .ft-ppt-root .page-19 img,
        .ft-ppt-root .page-21 img,
        .ft-ppt-root .page-26 img,
        .ft-ppt-root .page-27 img,
        .ft-ppt-root .page-29 img,
        .ft-ppt-root .page-30 img,
        .ft-ppt-root .page-31 img,
        .ft-ppt-root .page-32 img,
        .ft-ppt-root .page-33 img,
        .ft-ppt-root .page-38 img,
        .ft-ppt-root .page-43 img,
        .ft-ppt-root .page-53 img {
          position: relative;
          bottom: auto;
          left: auto;
          z-index: 1;
          flex: 0 1 auto;
          min-height: 0;
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 68%;
          object-fit: contain;
          margin: 0 auto;
        }

        /* Per-page styles */
        .ft-ppt-root .page-1 {
          background: #fff url(${FLOWTIME_PPT_ASSETS.iali53}) bottom right no-repeat;
          background-size: min(58%, 520px) auto;
          text-align: left;
          padding: 3.5rem 1.5rem 4.25rem 1.5rem;
        }
        .ft-ppt-root .page-1 p { font-size: 1em; position: relative; z-index: 2; }
        .ft-ppt-root .page-1 .text1 {
          font-size: clamp(1.45rem, 3.6cqw, 2.85rem);
          color: ${config.accentHeartColor || "#FA4A4A"};
          line-height: 1.35;
          margin: 0.4em 0 0 0.3em;
          max-width: 92%;
          font-weight: 700;
          text-shadow: 0 1px 8px rgba(255,255,255,0.92);
        }
        .ft-ppt-root .page-1 .text2 {
          font-size: clamp(1rem, 2.05cqw, 1.4rem);
          font-weight: 700;
          color: ${config.primaryTextColor || "#613b3b"};
          line-height: 1.45;
          margin: 0.9em 0 0 0.3em;
          max-width: 88%;
          text-shadow: 0 1px 8px rgba(255,255,255,0.92);
        }
        .ft-ppt-root .page-2 { background-color: #fefff1; }
        .ft-ppt-root .page-3 { background-color: #c1b287; }
        .ft-ppt-root .page-6 {
          background-color: #ecfafb;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 3.25rem 1.5rem 4.25rem 0;
        }
        .ft-ppt-root .page-6 img {
          position: relative;
          align-self: flex-start;
          margin: 0;
          max-width: 85%;
          max-height: 62%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-6 h2,
        .ft-ppt-root .page-6 h3 {
          position: relative;
          z-index: 2;
          align-self: flex-end;
          text-align: right;
          color: #bc195b;
          padding: 0 1.5rem;
          max-width: 78%;
        }
        .ft-ppt-root .page-7 { background-color: #e6fbec; }
        .ft-ppt-root .page-8 { background: #66cbff; }
        .ft-ppt-root .page-8 h3 {
          color: #eef;
          text-shadow: 0 2px 10px rgba(0,0,0,0.6);
          left: 8%;
          right: auto;
          width: auto;
          max-width: min(55%, 420px);
          text-align: left;
          padding: 1.25rem 0;
        }
        .ft-ppt-root .page-9 { background-color: #c9f4fb; }
        .ft-ppt-root .page-10 { background: url(${FLOWTIME_PPT_ASSETS.iali22_bg}); }
        .ft-ppt-root .page-12 {
          background-color: #aff1ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
          gap: 0.75rem;
        }
        .ft-ppt-root .page-12 h3 {
          position: relative;
          z-index: 2;
          margin: 0;
          padding: 0;
          flex-shrink: 0;
          max-width: 92%;
        }
        .ft-ppt-root .page-12 img {
          position: relative;
          align-self: flex-start;
          z-index: 1;
          flex: 1 1 0;
          min-height: 0;
          max-height: 48%;
          max-width: 85%;
          object-fit: contain;
          margin: 0;
        }
        .ft-ppt-root .page-13 { background-color: #feeff4; }
        .ft-ppt-root .page-14 { background-color: #fbf7d1; }
        .ft-ppt-root .page-15 { background: #dcf2fa url(${FLOWTIME_PPT_ASSETS.iali45_bg}); }
        .ft-ppt-root .page-16 { background-color: #7db6df; }
        .ft-ppt-root .page-17 { background-color: #e5f0f2; }
        .ft-ppt-root .page-18 .text { margin: 0; }
        .ft-ppt-root .page-19 { background-image: url(${FLOWTIME_PPT_ASSETS.iali75_bg}); }
        .ft-ppt-root .page-20 {
          background-color: #fcd0ca;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
        }
        .ft-ppt-root .page-20 h3 {
          position: relative;
          z-index: 3;
          flex-shrink: 0;
          margin: 0;
          padding: 0.25em 0;
        }
        .ft-ppt-root .page-20 img {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%) scale(${config.imageScale ?? 1});
          max-height: 68%;
          max-width: 90%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-21 { background: #fbf2a3 url(${FLOWTIME_PPT_ASSETS.iali59_bg}); }
        .ft-ppt-root .page-22 { background-color: #f5d484; }
        .ft-ppt-root .page-23 { background-color: #fff; }
        .ft-ppt-root .page-25 { background-color: #fcc1b1; }
        .ft-ppt-root .page-26 { background-color: #fdeacf; }
        .ft-ppt-root .page-27 { background-color: #ffc8c5; }
        .ft-ppt-root .page-28 {
          background: #b7e7f3 url(${FLOWTIME_PPT_ASSETS.iali40_bg}) bottom repeat-x;
          padding: 0;
        }
        .ft-ppt-root .page-28 img {
          position: absolute;
          bottom: 0;
          left: 2rem;
          max-width: 48%;
          max-height: 75%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-28 h3 {
          position: absolute;
          right: 1.5rem;
          bottom: 45%;
          max-width: 50%;
          text-align: right;
          color: #127184;
          z-index: 2;
          margin: 0;
          text-shadow: 0 1px 8px rgba(255,255,255,0.85);
        }
        .ft-ppt-root .page-29 { background: #0d85d1; }
        .ft-ppt-root .page-29 h3 {
          color: #eef;
          text-shadow: 0 2px 8px rgba(0,0,0,0.45);
        }
        .ft-ppt-root .page-30 {
          background: #fff url(${FLOWTIME_PPT_ASSETS.iali76_bg}) center bottom repeat-x;
        }
        .ft-ppt-root .page-31 { background-color: #fbf5e9; }
        .ft-ppt-root .page-32 { background-color: #faf2e5; }
        .ft-ppt-root .page-33 { background-color: #fef0d5; }
        .ft-ppt-root .page-33 h3 { color: #a58545; }
        .ft-ppt-root .page-34 {
          background: #94c2e3 url(${FLOWTIME_PPT_ASSETS.iali57_jpg}) left bottom no-repeat;
          background-size: auto 85%;
        }
        .ft-ppt-root .page-34 h3 {
          color: #fff;
          text-shadow: 0 2px 10px rgba(10, 45, 90, 0.75);
        }
        .ft-ppt-root .page-35 {
          background: #fff url(${FLOWTIME_PPT_ASSETS.iali8_bg}) left bottom repeat-x;
          padding: 0;
        }
        .ft-ppt-root .page-35 img {
          position: absolute;
          bottom: 0;
          left: 0;
          max-width: 55%;
          max-height: 78%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-35 h3 {
          position: absolute;
          right: 6%;
          top: 12%;
          max-width: 48%;
          text-align: right;
          color: green;
          z-index: 2;
          margin: 0;
          text-shadow: 0 1px 8px rgba(255,255,255,0.9);
        }
        .ft-ppt-root .page-36 h3 {
          text-align: right;
          left: 0;
          right: 0;
          padding: 1.25rem 1.5rem;
          color: #eee;
          text-shadow: 0 2px 10px rgba(0,0,0,0.65);
        }
        .ft-ppt-root .page-37 { background-color: #fff; }
        .ft-ppt-root .page-38 { background-color: #fff8f2; }
        .ft-ppt-root .page-39 { background: #e8ccc1 url(${FLOWTIME_PPT_ASSETS.iali2_bg}) repeat; }
        .ft-ppt-root .page-40 { background-color: #cde7f4; }
        .ft-ppt-root .page-40 img {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          max-width: 42%;
          max-height: 55%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-40 h3 {
          position: absolute;
          top: 3.25rem;
          right: 1.5rem;
          max-width: 65%;
          text-align: right;
          z-index: 2;
          margin: 0;
        }
        .ft-ppt-root .page-41 {
          background-color: #5aaadc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
        }
        .ft-ppt-root .page-41 .img1,
        .ft-ppt-root .page-41 .img2 {
          position: absolute;
          z-index: 1;
          object-fit: contain;
        }
        .ft-ppt-root .page-41 .img1 { left: 1rem; bottom: 3.5rem; max-width: 42%; max-height: 36%; }
        .ft-ppt-root .page-41 .img2 { right: 1rem; top: 3rem; max-width: 42%; max-height: 32%; }
        .ft-ppt-root .page-41 h3 {
          position: relative;
          z-index: 2;
          padding: 0.4em 0.8em;
          max-width: min(88%, 760px);
          text-align: center;
          text-shadow: 0 1px 8px rgba(255,255,255,0.75);
        }
        .ft-ppt-root .page-42 {
          background-color: #c1c567;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
          gap: 0.75rem;
        }
        .ft-ppt-root .page-42 h3 {
          position: relative;
          z-index: 2;
          max-width: 92%;
          flex-shrink: 0;
          margin: 0;
          padding: 0;
        }
        .ft-ppt-root .page-42 img {
          position: relative;
          align-self: flex-start;
          z-index: 1;
          flex: 1 1 0;
          min-height: 0;
          max-height: 45%;
          max-width: 85%;
          object-fit: contain;
          margin: 0;
        }
        .ft-ppt-root .page-43 { background-color: #6b79ad; }
        .ft-ppt-root .page-43 h3 {
          color: #fff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.35);
        }
        .ft-ppt-root .page-44 { background-color: #f3e7ab; }
        .ft-ppt-root .page-45 { background-color: #b1dceb; }
        .ft-ppt-root .page-46 { background: #66cbff; }
        .ft-ppt-root .page-47 { background-color: #fdcbca; }
        .ft-ppt-root .page-46,
        .ft-ppt-root .page-47 {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 3.25rem 1.5rem 4.25rem 1.5rem;
        }
        .ft-ppt-root .page-46 h3,
        .ft-ppt-root .page-47 h3 {
          position: relative;
          top: auto;
          left: auto;
          margin: 0;
          padding: 0;
          width: auto;
          max-width: 48%;
          flex: 1 1 auto;
          text-align: left;
          z-index: 2;
        }
        .ft-ppt-root .page-46 h3 span,
        .ft-ppt-root .page-47 h3 span {
          display: block;
          width: auto;
          margin-right: 0;
          margin-bottom: 0.35em;
        }
        .ft-ppt-root .page-46 img,
        .ft-ppt-root .page-47 img {
          position: relative;
          flex: 0 1 50%;
          min-height: 0;
          max-width: 50%;
          max-height: 82%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-48 { background-color: #e3e2e7; }
        .ft-ppt-root .page-49 { background-color: #fce6b6; text-align: left; }
        .ft-ppt-root .page-49 img { margin: 0; }
        .ft-ppt-root .page-49 p.text {
          text-align: left;
          padding: 1.25rem 1.5rem;
        }
        .ft-ppt-root .page-50 { background-color: #aae1f6; padding: 0; }
        .ft-ppt-root .page-50 .img1 {
          position: absolute;
          right: 0;
          top: 2.5rem;
          max-width: 45%;
          max-height: 55%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-50 .img2 {
          position: absolute;
          left: 1.5rem;
          bottom: 3.5rem;
          max-width: 45%;
          max-height: 45%;
          object-fit: contain;
          z-index: 1;
        }
        .ft-ppt-root .page-50 p {
          position: absolute;
          top: 3.25rem;
          left: 1.5rem;
          width: 52%;
          margin: 0;
          z-index: 3;
          text-align: left;
          text-shadow: 0 1px 8px rgba(255,255,255,0.85);
        }
        .ft-ppt-root .page-51 {
          background-image: url(${FLOWTIME_PPT_ASSETS.iali52});
          background-size: cover;
          background-position: center;
          background-color: #fff;
          text-align: left;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 3.5rem 1.5rem 4.5rem 1.5rem;
        }
        .ft-ppt-root .page-51 p {
          margin: 0;
          max-width: min(92%, 720px);
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(4px);
          padding: 1rem 1.25rem;
          border-radius: 14px;
          text-align: left;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .ft-ppt-root .page-52 { background-color: #fff2fb; padding: 0; }
        .ft-ppt-root .page-52 h3 {
          padding: 1rem 1.5rem;
          color: #4e0f3d;
        }
        .ft-ppt-root .page-53 { background-color: #febebe; }
        .ft-ppt-root .page-54 { background: #d3d2d0; }
        .ft-ppt-root .page-54 .center-img {
          background-image: url(${FLOWTIME_PPT_ASSETS.img319280});
          background-size: contain;
          text-indent: ${(pageOverrides[54] || config.page54CenterText || "I love you") === "I love you" ? "-99999px" : "0"};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-size: clamp(1.4rem, 4.2cqw, 3rem);
          font-weight: bold;
          color: ${config.accentHeartColor || "#FA4A4A"};
          text-shadow: 0 2px 12px rgba(255,255,255,0.92), 0 0 6px rgba(255,255,255,0.95);
        }
        .ft-ppt-root .page-55 { background-color: #fff; }

        /* Mobile & Narrow-Container Responsive Rules */
        @container ft-card (max-width: 768px) {
          .ft-ppt-root:not(.ft-overview) .ft-page {
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .flowtime h1 { font-size: clamp(1.3rem, 5.4cqw, 2rem); }
          .ft-ppt-root:not(.ft-overview) .flowtime h2,
          .ft-ppt-root:not(.ft-overview) .flowtime h3,
          .ft-ppt-root:not(.ft-overview) .ft-page:not(.page-1) p {
            font-size: clamp(0.95rem, 3.8cqw, 1.24rem);
            line-height: 1.42;
          }
          .ft-ppt-root:not(.ft-overview) .flowtime img {
            transform: translate3d(0,0,0) scale(${Math.min(config.imageScale ?? 1, 1.04)});
          }

          .ft-ppt-root:not(.ft-overview) .page-2 img,
          .ft-ppt-root:not(.ft-overview) .page-7 img,
          .ft-ppt-root:not(.ft-overview) .page-9 img,
          .ft-ppt-root:not(.ft-overview) .page-10 img,
          .ft-ppt-root:not(.ft-overview) .page-13 img,
          .ft-ppt-root:not(.ft-overview) .page-17 img,
          .ft-ppt-root:not(.ft-overview) .page-19 img,
          .ft-ppt-root:not(.ft-overview) .page-21 img,
          .ft-ppt-root:not(.ft-overview) .page-26 img,
          .ft-ppt-root:not(.ft-overview) .page-27 img,
          .ft-ppt-root:not(.ft-overview) .page-29 img,
          .ft-ppt-root:not(.ft-overview) .page-30 img,
          .ft-ppt-root:not(.ft-overview) .page-31 img,
          .ft-ppt-root:not(.ft-overview) .page-32 img,
          .ft-ppt-root:not(.ft-overview) .page-33 img,
          .ft-ppt-root:not(.ft-overview) .page-38 img,
          .ft-ppt-root:not(.ft-overview) .page-43 img,
          .ft-ppt-root:not(.ft-overview) .page-53 img {
            max-height: 52%;
          }

          .ft-ppt-root:not(.ft-overview) .full-img {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.9rem;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root .page-4 { background-color: #c7e6f5; }
          .ft-ppt-root .page-5 { background-color: #e8f4fb; }
          .ft-ppt-root .page-8 { background-color: #4fa6dc; }
          .ft-ppt-root .page-11 { background-color: #d9eef8; }
          .ft-ppt-root .page-18 { background-color: #fdecf2; }
          .ft-ppt-root .page-24 { background-color: #d6eaf8; }
          .ft-ppt-root .page-36 { background-color: #5c8ec4; }
          .ft-ppt-root .page-49 { background-color: #fce6b6; }
          .ft-ppt-root .page-52 { background-color: #fff2fb; }
          .ft-ppt-root:not(.ft-overview) .full-img > h2,
          .ft-ppt-root:not(.ft-overview) .full-img > h3,
          .ft-ppt-root:not(.ft-overview) .full-img > p.text,
          .ft-ppt-root:not(.ft-overview) .full-img > .center-text {
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            width: 100%;
            max-width: 100%;
            max-height: 44%;
            overflow-y: auto;
            margin: 0;
            padding: 0 0.25rem;
            text-align: center;
            flex-shrink: 0;
          }
          .ft-ppt-root:not(.ft-overview) .full-img img {
            position: relative;
            inset: auto;
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 54%;
            flex: 0 1 auto;
            min-height: 0;
            object-fit: contain;
            border-radius: 10px;
            margin: 0 auto;
          }

          .ft-ppt-root:not(.ft-overview) .left-img:not(.page-34) {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
            gap: 0.9rem;
            text-align: center;
          }
          .ft-ppt-root:not(.ft-overview) .left-img:not(.page-34) p,
          .ft-ppt-root:not(.ft-overview) .left-img:not(.page-34) h2,
          .ft-ppt-root:not(.ft-overview) .left-img:not(.page-34) h3,
          .ft-ppt-root:not(.ft-overview) .left-img:not(.page-34) .text {
            position: relative;
            top: auto;
            right: auto;
            width: 100%;
            max-width: 100%;
            max-height: 38%;
            text-align: center;
            padding: 0;
            flex-shrink: 0;
          }
          .ft-ppt-root:not(.ft-overview) .left-img:not(.page-34) img {
            position: relative;
            left: auto;
            bottom: auto;
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 54%;
            flex: 0 1 auto;
            min-height: 0;
            object-fit: contain;
            margin: 0 auto;
          }

          .ft-ppt-root:not(.ft-overview) .page-34 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            background-size: contain;
            background-position: center calc(100% - 4.25rem);
            padding: max(4rem, calc(env(safe-area-inset-top, 0px) + 3.5rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-34 h3 {
            position: relative;
            top: auto;
            right: auto;
            max-width: 100%;
            text-align: center;
          }

          .ft-ppt-root:not(.ft-overview) .right-img {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
            gap: 0.9rem;
            text-align: center;
          }
          .ft-ppt-root:not(.ft-overview) .right-img .text {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            max-width: 100%;
            max-height: 44%;
            overflow-y: auto;
            padding: 0;
            text-align: center;
            flex-shrink: 0;
          }
          .ft-ppt-root:not(.ft-overview) .right-img img {
            position: relative;
            right: auto;
            bottom: auto;
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 48%;
            flex: 0 1 auto;
            min-height: 0;
            object-fit: contain;
            margin: 0 auto;
          }

          .ft-ppt-root:not(.ft-overview) .page-1 {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            background-position: center calc(100% - 3.6rem);
            background-size: min(74%, 280px) auto;
            padding: max(4.2rem, calc(env(safe-area-inset-top, 0px) + 3.6rem)) 1.1rem 44% 1.1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-1 .text1 { margin-left: 0; max-width: 100%; }
          .ft-ppt-root:not(.ft-overview) .page-1 .text2 { margin-left: 0; max-width: 100%; }

          .ft-ppt-root:not(.ft-overview) .page-6,
          .ft-ppt-root:not(.ft-overview) .page-12,
          .ft-ppt-root:not(.ft-overview) .page-42 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.9rem;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-6 h2,
          .ft-ppt-root:not(.ft-overview) .page-6 h3 {
            align-self: center;
            text-align: center;
            max-width: 100%;
            padding: 0;
          }
          .ft-ppt-root:not(.ft-overview) .page-6 img,
          .ft-ppt-root:not(.ft-overview) .page-12 img,
          .ft-ppt-root:not(.ft-overview) .page-42 img {
            align-self: center;
            max-width: 100%;
            max-height: 52%;
            flex: 0 1 auto;
          }

          .ft-ppt-root:not(.ft-overview) .page-8 h3 {
            left: auto;
            right: auto;
            max-width: 100%;
            padding: 0 0.25rem;
            text-align: center;
          }

          .ft-ppt-root:not(.ft-overview) .page-20 {
            justify-content: center;
            gap: 0.75rem;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-20 img {
            position: relative;
            bottom: auto;
            left: auto;
            transform: scale(${Math.min(config.imageScale ?? 1, 1.04)});
            max-height: 26%;
            max-width: 82%;
          }

          .ft-ppt-root:not(.ft-overview) .page-28,
          .ft-ppt-root:not(.ft-overview) .page-35,
          .ft-ppt-root:not(.ft-overview) .page-40 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
            gap: 0.9rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-28 h3,
          .ft-ppt-root:not(.ft-overview) .page-35 h3,
          .ft-ppt-root:not(.ft-overview) .page-40 h3 {
            position: relative;
            top: auto;
            right: auto;
            bottom: auto;
            max-width: 100%;
            text-align: center;
            flex-shrink: 0;
          }
          .ft-ppt-root:not(.ft-overview) .page-28 img,
          .ft-ppt-root:not(.ft-overview) .page-35 img,
          .ft-ppt-root:not(.ft-overview) .page-40 img {
            position: relative;
            left: auto;
            bottom: auto;
            max-width: 100%;
            max-height: 52%;
            flex: 0 1 auto;
            min-height: 0;
            margin: 0 auto;
          }

          .ft-ppt-root:not(.ft-overview) .page-41 {
            flex-direction: column;
            justify-content: center;
            gap: 0.75rem;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-41 .img1,
          .ft-ppt-root:not(.ft-overview) .page-41 .img2 {
            position: relative;
            left: auto;
            right: auto;
            top: auto;
            bottom: auto;
            max-width: 72%;
            max-height: 24%;
          }

          .ft-ppt-root:not(.ft-overview) .page-46,
          .ft-ppt-root:not(.ft-overview) .page-47 {
            flex-direction: column;
            justify-content: center;
            gap: 0.85rem;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-46 h3,
          .ft-ppt-root:not(.ft-overview) .page-47 h3 {
            max-width: 100%;
            max-height: 46%;
            overflow-y: auto;
            flex: 0 0 auto;
            text-align: center;
          }
          .ft-ppt-root:not(.ft-overview) .page-46 img,
          .ft-ppt-root:not(.ft-overview) .page-47 img {
            flex: 0 1 auto;
            max-width: 100%;
            max-height: 48%;
          }

          .ft-ppt-root:not(.ft-overview) .page-50 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: max(3.6rem, calc(env(safe-area-inset-top, 0px) + 3.1rem)) 1rem max(4.25rem, calc(env(safe-area-inset-bottom, 0px) + 3.8rem)) 1rem;
          }
          .ft-ppt-root:not(.ft-overview) .page-50 p {
            position: relative;
            top: auto;
            left: auto;
            width: 100%;
            text-align: center;
          }
          .ft-ppt-root:not(.ft-overview) .page-50 .img1,
          .ft-ppt-root:not(.ft-overview) .page-50 .img2 {
            position: relative;
            top: auto;
            right: auto;
            left: auto;
            bottom: auto;
            max-width: 72%;
            max-height: 26%;
          }

          .ft-ppt-root:not(.ft-overview) .page-51 {
            background-color: #f6efe9;
            background-size: contain;
            background-position: center calc(100% - 4.25rem);
            background-repeat: no-repeat;
            padding: max(4rem, calc(env(safe-area-inset-top, 0px) + 3.4rem)) 1rem 46% 1rem;
            align-items: flex-start;
            justify-content: center;
          }
          .ft-ppt-root:not(.ft-overview) .page-51 p {
            max-width: 100%;
            padding: 0.85rem 1rem;
          }

          .ft-ppt-root .ft-default-progress {
            display: none;
          }
          .ft-ppt-root .ft-nav-controls {
            left: 50% !important;
            bottom: max(10px, env(safe-area-inset-bottom, 10px)) !important;
            transform: translateX(-50%);
            max-width: calc(100% - 16px);
            padding: 5px 8px !important;
            gap: 4px !important;
            font-size: 11.5px !important;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .ft-ppt-root .ft-nav-controls button,
          .ft-ppt-root .ft-nav-controls span {
            flex-shrink: 0;
          }
        }
      `}</style>

      <div
        className="ft-ppt-tilt-wrapper"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transform: has3DTilt
            ? `rotateX(${config.spaceTiltXDeg || 0}deg) rotateY(${config.spaceTiltYDeg || 0}deg)`
            : undefined,
          transformStyle: has3DTilt ? "preserve-3d" : undefined,
        }}
      >
        <div
          className={`flowtime${durationMs === 0 ? " no-transition" : ""}`}
          style={{
            transform: flowtimeTransform,
            transition:
              durationMs > 0
                ? `transform ${durationMs}ms cubic-bezier(.77, .10, .22, 1)`
                : "transform 0s",
          }}
        >
          {/* SECTION 1 (Pages 1 - 4) */}
          <div className="ft-section section-1" data-id="section-1">
            <div
              id="/section-1/page-1"
              className={getPageClasses(0, 0, "page-1")}
              data-id="page-1"
              onClick={(e) => handlePageClick(0, 0, e)}
            >
              {(pageOverrides[1] ||
                (config.page1Title && config.page1Title.trim().length > 0) ||
                (textMap["text-77"] && textMap["text-77"].trim().length > 0)) && (
                <p className="text1">
                  <span id="text-77">
                    {pageOverrides[1] ||
                      (config.page1Title && config.page1Title.trim().length > 0
                        ? config.page1Title
                        : textMap["text-77"])}
                  </span>
                </p>
              )}
              {textMap["text-78"] && textMap["text-78"].trim().length > 0 && (
                <p className="text2">
                  ↓ <span id="text-78">{textMap["text-78"]}</span>
                </p>
              )}
            </div>

            <div
              id="/section-1/page-2"
              className={getPageClasses(0, 1, "page-2")}
              data-id="page-2"
              onClick={(e) => handlePageClick(0, 1, e)}
            >
              <p className="top-text" id="text-1">
                {textMap["text-1"]}
              </p>
              <img src={FLOWTIME_PPT_ASSETS.iali63} alt={textMap["text-1"]} />
            </div>

            <div
              id="/section-1/page-3"
              className={getPageClasses(0, 2, "page-3 left-img")}
              data-id="page-3"
              onClick={(e) => handlePageClick(0, 2, e)}
            >
              <h2 className="text" id="text-2">
                {textMap["text-2"]}
              </h2>
              <img src={FLOWTIME_PPT_ASSETS.iali35} alt={textMap["text-2"]} />
            </div>

            <div
              id="/section-1/page-4"
              className={getPageClasses(0, 3, "page-4 full-img")}
              data-id="page-4"
              onClick={(e) => handlePageClick(0, 3, e)}
            >
              <h2 className="center-text" id="text-3">
                {textMap["text-3"]}
              </h2>
              <img src={FLOWTIME_PPT_ASSETS.iali6} alt={textMap["text-3"]} />
            </div>
          </div>

          {/* SECTION 2 (Pages 5 - 10) */}
          <div className="ft-section section-2" data-id="section-2">
            <div
              id="/section-2/page-1"
              className={getPageClasses(1, 0, "page-5 full-img")}
              data-id="page-1"
              onClick={(e) => handlePageClick(1, 0, e)}
            >
              <h2 className="center-text" id="text-4">
                {textMap["text-4"]}
              </h2>
              <img src={FLOWTIME_PPT_ASSETS.iali19} alt={textMap["text-4"]} />
            </div>

            <div
              id="/section-2/page-2"
              className={getPageClasses(1, 1, "page-6")}
              data-id="page-2"
              onClick={(e) => handlePageClick(1, 1, e)}
            >
              <h2 className="center-text" id="text-5">
                {textMap["text-5"]}
              </h2>
              <img src={FLOWTIME_PPT_ASSETS.iali29} alt={textMap["text-5"]} />
            </div>

            <div
              id="/section-2/page-3"
              className={getPageClasses(1, 2, "page-7")}
              data-id="page-3"
              onClick={(e) => handlePageClick(1, 2, e)}
            >
              <h3 id="text-6">{textMap["text-6"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali60} alt={textMap["text-6"]} />
            </div>

            <div
              id="/section-2/page-4"
              className={getPageClasses(1, 3, "page-8 full-img")}
              data-id="page-4"
              onClick={(e) => handlePageClick(1, 3, e)}
            >
              <h3 id="text-7">{textMap["text-7"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali51} alt={textMap["text-7"]} />
            </div>

            <div
              id="/section-2/page-5"
              className={getPageClasses(1, 4, "page-9")}
              data-id="page-5"
              onClick={(e) => handlePageClick(1, 4, e)}
            >
              <h3 id="text-8">{textMap["text-8"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali5} alt="" />
            </div>

            <div
              id="/section-2/page-6"
              className={getPageClasses(1, 5, "page-10")}
              data-id="page-6"
              onClick={(e) => handlePageClick(1, 5, e)}
            >
              <h3 id="text-9">{textMap["text-9"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali22} alt="" />
            </div>
          </div>

          {/* SECTION 3 (Pages 11 - 17) */}
          <div className="ft-section section-3" data-id="section-3">
            <div
              id="/section-3/page-1"
              className={getPageClasses(2, 0, "page-11 full-img")}
              data-id="page-1"
              onClick={(e) => handlePageClick(2, 0, e)}
            >
              <h3 id="text-10">{textMap["text-10"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali24} alt="" />
            </div>

            <div
              id="/section-3/page-2"
              className={getPageClasses(2, 1, "page-12")}
              data-id="page-2"
              onClick={(e) => handlePageClick(2, 1, e)}
            >
              <h3>
                {pageOverrides[12] !== undefined ? (
                  <span id="text-11">{pageOverrides[12]}</span>
                ) : (
                  <>
                    <span id="text-11">{textMap["text-11"]}</span>
                    <br />
                    <span id="text-12">{textMap["text-12"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali25} alt="" />
            </div>

            <div
              id="/section-3/page-3"
              className={getPageClasses(2, 2, "page-13")}
              data-id="page-3"
              onClick={(e) => handlePageClick(2, 2, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali64} alt={textMap["text-13"]} />
              <h3 id="text-13">{textMap["text-13"]}</h3>
            </div>

            <div
              id="/section-3/page-4"
              className={getPageClasses(2, 3, "page-14 left-img")}
              data-id="page-4"
              onClick={(e) => handlePageClick(2, 3, e)}
            >
              <h3 id="text-14">{textMap["text-14"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali46} alt="" />
            </div>

            <div
              id="/section-3/page-5"
              className={getPageClasses(2, 4, "page-15 left-img")}
              data-id="page-5"
              onClick={(e) => handlePageClick(2, 4, e)}
            >
              <h3>
                {pageOverrides[15] !== undefined ? (
                  <span id="text-15">{pageOverrides[15]}</span>
                ) : (
                  <>
                    <span id="text-15">{textMap["text-15"]}</span>
                    <br />
                    <span id="text-16">{textMap["text-16"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali45} alt="" />
            </div>

            <div
              id="/section-3/page-6"
              className={getPageClasses(2, 5, "page-16 left-img")}
              data-id="page-6"
              onClick={(e) => handlePageClick(2, 5, e)}
            >
              <h3>
                {pageOverrides[16] !== undefined ? (
                  <span id="text-17">{pageOverrides[16]}</span>
                ) : (
                  <>
                    <span id="text-17">{textMap["text-17"]}</span>
                    <br />
                    <span id="text-18">{textMap["text-18"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali66} alt="" />
            </div>

            <div
              id="/section-3/page-7"
              className={getPageClasses(2, 6, "page-17 top-text")}
              data-id="page-7"
              onClick={(e) => handlePageClick(2, 6, e)}
            >
              <h3 id="text-19">{textMap["text-19"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali16} alt="" />
              {renderSlidePhoto(17)}
            </div>
          </div>

          {/* SECTION 4 (Pages 18 - 24) */}
          <div className="ft-section section-4" data-id="section-4">
            <div
              id="/section-4/page-1"
              className={getPageClasses(3, 0, "page-18 full-img")}
              data-id="page-1"
              onClick={(e) => handlePageClick(3, 0, e)}
            >
              <p className="text" id="text-20">
                {textMap["text-20"]}
              </p>
              <img src={FLOWTIME_PPT_ASSETS.iali11} alt="" />
            </div>

            <div
              id="/section-4/page-2"
              className={getPageClasses(3, 1, "page-19")}
              data-id="page-2"
              onClick={(e) => handlePageClick(3, 1, e)}
            >
              <h3 id="text-21">{textMap["text-21"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali75} alt="" />
              {renderSlidePhoto(19)}
            </div>

            <div
              id="/section-4/page-3"
              className={getPageClasses(3, 2, "page-20")}
              data-id="page-3"
              onClick={(e) => handlePageClick(3, 2, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali59} alt="" />
              <h3 id="text-22">{textMap["text-22"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali9} alt="" />
            </div>

            <div
              id="/section-4/page-4"
              className={getPageClasses(3, 3, "page-21")}
              data-id="page-4"
              onClick={(e) => handlePageClick(3, 3, e)}
            >
              <h3 id="text-23">{textMap["text-23"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali59} alt="" />
              {renderSlidePhoto(21)}
            </div>

            <div
              id="/section-4/page-5"
              className={getPageClasses(3, 4, "page-22 left-img")}
              data-id="page-5"
              onClick={(e) => handlePageClick(3, 4, e)}
            >
              <h3 id="text-24">{textMap["text-24"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali4} alt="" />
            </div>

            <div
              id="/section-4/page-6"
              className={getPageClasses(3, 5, "page-23 left-img")}
              data-id="page-6"
              onClick={(e) => handlePageClick(3, 5, e)}
            >
              <h3 id="text-25">{textMap["text-25"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali44} alt="" />
              {renderSlidePhoto(23)}
            </div>

            <div
              id="/section-4/page-7"
              className={getPageClasses(3, 6, "page-24 full-img")}
              data-id="page-7"
              onClick={(e) => handlePageClick(3, 6, e)}
            >
              <h3 id="text-26">{textMap["text-26"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali32} alt="" />
            </div>
          </div>

          {/* SECTION 5 (Pages 25 - 31) */}
          <div className="ft-section section-5" data-id="section-5">
            <div
              id="/section-5/page-1"
              className={getPageClasses(4, 0, "page-25 left-img")}
              data-id="page-1"
              onClick={(e) => handlePageClick(4, 0, e)}
            >
              <h3>
                {pageOverrides[25] !== undefined ? (
                  <span id="text-27">{pageOverrides[25]}</span>
                ) : (
                  <>
                    <span id="text-27">{textMap["text-27"]}</span>
                    <br />
                    <span id="text-28">{textMap["text-28"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali37} alt="" />
              {renderSlidePhoto(25)}
            </div>

            <div
              id="/section-5/page-2"
              className={getPageClasses(4, 1, "page-26 top-text")}
              data-id="page-2"
              onClick={(e) => handlePageClick(4, 1, e)}
            >
              <h3 id="text-29">{textMap["text-29"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali10} alt="" />
            </div>

            <div
              id="/section-5/page-3"
              className={getPageClasses(4, 2, "page-27")}
              data-id="page-3"
              onClick={(e) => handlePageClick(4, 2, e)}
            >
              <h3 id="text-30">{textMap["text-30"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali67} alt="" />
            </div>

            <div
              id="/section-5/page-4"
              className={getPageClasses(4, 3, "page-28")}
              data-id="page-4"
              onClick={(e) => handlePageClick(4, 3, e)}
            >
              <h3 id="text-31">{textMap["text-31"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali40} alt="" />
              {renderSlidePhoto(28)}
            </div>

            <div
              id="/section-5/page-5"
              className={getPageClasses(4, 4, "page-29")}
              data-id="page-5"
              onClick={(e) => handlePageClick(4, 4, e)}
            >
              <h3 id="text-32">{textMap["text-32"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali12} alt="" />
            </div>

            <div
              id="/section-5/page-6"
              className={getPageClasses(4, 5, "page-30")}
              data-id="page-6"
              onClick={(e) => handlePageClick(4, 5, e)}
            >
              <h3 id="text-33">{textMap["text-33"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali76} alt="" />
              {renderSlidePhoto(30)}
            </div>

            <div
              id="/section-5/page-7"
              className={getPageClasses(4, 6, "page-31")}
              data-id="page-7"
              onClick={(e) => handlePageClick(4, 6, e)}
            >
              <h3 id="text-34">{textMap["text-34"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali77} alt="" />
            </div>
          </div>

          {/* SECTION 6 (Pages 32 - 38) */}
          <div className="ft-section section-6" data-id="section-6">
            <div
              id="/section-6/page-1"
              className={getPageClasses(5, 0, "page-32")}
              data-id="page-1"
              onClick={(e) => handlePageClick(5, 0, e)}
            >
              <h3 id="text-35">{textMap["text-35"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali62} alt="" />
            </div>

            <div
              id="/section-6/page-2"
              className={getPageClasses(5, 1, "page-33 top-text")}
              data-id="page-2"
              onClick={(e) => handlePageClick(5, 1, e)}
            >
              <h3 id="text-36">{textMap["text-36"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali3} alt="" />
              {renderSlidePhoto(33)}
            </div>

            <div
              id="/section-6/page-3"
              className={getPageClasses(5, 2, "page-34 left-img")}
              data-id="page-3"
              onClick={(e) => handlePageClick(5, 2, e)}
            >
              <h3 id="text-37">{textMap["text-37"]}</h3>
            </div>

            <div
              id="/section-6/page-4"
              className={getPageClasses(5, 3, "page-35")}
              data-id="page-4"
              onClick={(e) => handlePageClick(5, 3, e)}
            >
              <h3>
                {pageOverrides[35] !== undefined ? (
                  <span id="text-38">{pageOverrides[35]}</span>
                ) : (
                  <>
                    <span id="text-38">{textMap["text-38"]}</span>
                    <br />
                    <span id="text-39">{textMap["text-39"]}</span>
                    <br />
                    <span id="text-40">{textMap["text-40"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali8} alt="" />
            </div>

            <div
              id="/section-6/page-5"
              className={getPageClasses(5, 4, "page-36 full-img")}
              data-id="page-5"
              onClick={(e) => handlePageClick(5, 4, e)}
            >
              <h3 id="text-41">{textMap["text-41"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali31} alt="" />
            </div>

            <div
              id="/section-6/page-6"
              className={getPageClasses(5, 5, "page-37 left-img")}
              data-id="page-6"
              onClick={(e) => handlePageClick(5, 5, e)}
            >
              <h3 id="text-42">{textMap["text-42"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali49} alt="" />
            </div>

            <div
              id="/section-6/page-7"
              className={getPageClasses(5, 6, "page-38 bottom-text")}
              data-id="page-7"
              onClick={(e) => handlePageClick(5, 6, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali21} alt="" />
              <h3 id="text-43">{textMap["text-43"]}</h3>
            </div>
          </div>

          {/* SECTION 7 (Pages 39 - 45) */}
          <div className="ft-section section-7" data-id="section-7">
            <div
              id="/section-7/page-1"
              className={getPageClasses(6, 0, "page-39 left-img")}
              data-id="page-1"
              onClick={(e) => handlePageClick(6, 0, e)}
            >
              <h3 id="text-44">{textMap["text-44"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali2} alt="" />
              {renderSlidePhoto(39)}
            </div>

            <div
              id="/section-7/page-2"
              className={getPageClasses(6, 1, "page-40")}
              data-id="page-2"
              onClick={(e) => handlePageClick(6, 1, e)}
            >
              <h3 id="text-45">{textMap["text-45"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali14} alt="" />
            </div>

            <div
              id="/section-7/page-3"
              className={getPageClasses(6, 2, "page-41")}
              data-id="page-3"
              onClick={(e) => handlePageClick(6, 2, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali30_1} className="img1" alt="" />
              <img src={FLOWTIME_PPT_ASSETS.iali30_2} className="img2" alt="" />
              <h3 id="text-46">{textMap["text-46"]}</h3>
            </div>

            <div
              id="/section-7/page-4"
              className={getPageClasses(6, 3, "page-42")}
              data-id="page-4"
              onClick={(e) => handlePageClick(6, 3, e)}
            >
              <h3>
                {pageOverrides[42] !== undefined ? (
                  <span id="text-47">{pageOverrides[42]}</span>
                ) : (
                  <>
                    <span id="text-47">{textMap["text-47"]}</span>
                    <br />
                    <span id="text-48">{textMap["text-48"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali69} alt="" />
            </div>

            <div
              id="/section-7/page-5"
              className={getPageClasses(6, 4, "page-43")}
              data-id="page-5"
              onClick={(e) => handlePageClick(6, 4, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali42} alt="" />
              <h3 id="text-49">{textMap["text-49"]}</h3>
            </div>

            <div
              id="/section-7/page-6"
              className={getPageClasses(6, 5, "page-44 left-img")}
              data-id="page-6"
              onClick={(e) => handlePageClick(6, 5, e)}
            >
              <h3>
                {pageOverrides[44] !== undefined ? (
                  <span id="text-50">{pageOverrides[44]}</span>
                ) : (
                  <>
                    <span id="text-50">{textMap["text-50"]}</span>
                    <br />
                    <span id="text-51">{textMap["text-51"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali0} alt="" />
            </div>

            <div
              id="/section-7/page-7"
              className={getPageClasses(6, 6, "page-45 left-img")}
              data-id="page-7"
              onClick={(e) => handlePageClick(6, 6, e)}
            >
              <h3>
                {pageOverrides[45] !== undefined ? (
                  <span id="text-52">{pageOverrides[45]}</span>
                ) : (
                  <>
                    <span id="text-52">{textMap["text-52"]}</span>
                    <br />
                    <span id="text-53">{textMap["text-53"]}</span>
                  </>
                )}
              </h3>
              <img src={FLOWTIME_PPT_ASSETS.iali18} alt="" />
            </div>
          </div>

          {/* SECTION 8 (Pages 46 - 51) */}
          <div className="ft-section section-8" data-id="section-8">
            <div
              id="/section-8/page-1"
              className={getPageClasses(7, 0, "page-46")}
              data-id="page-1"
              onClick={(e) => handlePageClick(7, 0, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali57} alt="" />
              <h3>
                {pageOverrides[46] !== undefined ? (
                  <span id="text-54">{pageOverrides[46]}</span>
                ) : (
                  <>
                    <span id="text-54">{textMap["text-54"]}</span>
                    <span id="text-55">{textMap["text-55"]}</span>
                    <span id="text-56">{textMap["text-56"]}</span>
                    <span id="text-57">{textMap["text-57"]}</span>
                  </>
                )}
              </h3>
              {renderSlidePhoto(46)}
            </div>

            <div
              id="/section-8/page-2"
              className={getPageClasses(7, 1, "page-47 top-text")}
              data-id="page-2"
              onClick={(e) => handlePageClick(7, 1, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali58} alt="" />
              <h3>
                {pageOverrides[47] !== undefined ? (
                  <span id="text-58">{pageOverrides[47]}</span>
                ) : (
                  <>
                    <span id="text-58">{textMap["text-58"]}</span>
                    <span id="text-59-a">{textMap["text-59-a"]}</span>
                    <span id="text-59">{textMap["text-59"]}</span>
                    <span id="text-60">{textMap["text-60"]}</span>
                    <span id="text-61">{textMap["text-61"]}</span>
                  </>
                )}
              </h3>
            </div>

            <div
              id="/section-8/page-3"
              className={getPageClasses(7, 2, "page-48 left-img")}
              data-id="page-3"
              onClick={(e) => handlePageClick(7, 2, e)}
            >
              <p>
                {pageOverrides[48] !== undefined ? (
                  <span id="text-62">{pageOverrides[48]}</span>
                ) : (
                  <>
                    <span id="text-62">{textMap["text-62"]}</span>
                    <br />
                    <span id="text-63">{textMap["text-63"]}</span>
                  </>
                )}
              </p>
              <img src={FLOWTIME_PPT_ASSETS.iali65} alt="" />
            </div>

            <div
              id="/section-8/page-4"
              className={getPageClasses(7, 3, "page-49 full-img")}
              data-id="page-4"
              onClick={(e) => handlePageClick(7, 3, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali71} alt="" />
              <p className="text">
                {pageOverrides[49] !== undefined ? (
                  <span id="text-64">{pageOverrides[49]}</span>
                ) : (
                  <>
                    <span id="text-64">{textMap["text-64"]}</span>
                    <br />
                    <span id="text-65">{textMap["text-65"]}</span>
                  </>
                )}
              </p>
            </div>

            <div
              id="/section-8/page-5"
              className={getPageClasses(7, 4, "page-50")}
              data-id="page-5"
              onClick={(e) => handlePageClick(7, 4, e)}
            >
              <p className="text" id="text-66">
                {textMap["text-66"]}
              </p>
              <img src={FLOWTIME_PPT_ASSETS.iali50_1} className="img1" alt="" />
              <img src={FLOWTIME_PPT_ASSETS.iali50_2} className="img2" alt="" />
            </div>

            <div
              id="/section-8/page-6"
              className={getPageClasses(7, 5, "page-51")}
              data-id="page-6"
              onClick={(e) => handlePageClick(7, 5, e)}
            >
              <p>
                {pageOverrides[51] !== undefined ? (
                  <span id="text-67">{pageOverrides[51]}</span>
                ) : (
                  <>
                    <span id="text-67">{textMap["text-67"]}</span>
                    <br />
                    <span id="text-68">{textMap["text-68"]}</span>
                    <br />
                    <span id="text-69">{textMap["text-69"]}</span>
                    <br />
                    <span id="text-70">{textMap["text-70"]}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* SECTION 9 (Pages 52 - 55) */}
          <div className="ft-section section-9" data-id="section-9">
            <div
              id="/section-9/page-1"
              className={getPageClasses(8, 0, "page-52 full-img")}
              data-id="page-1"
              onClick={(e) => handlePageClick(8, 0, e)}
            >
              <h3 id="text-71">{textMap["text-71"]}</h3>
              <img src={FLOWTIME_PPT_ASSETS.iali20} alt="" />
            </div>

            <div
              id="/section-9/page-2"
              className={getPageClasses(8, 1, "page-53")}
              data-id="page-2"
              onClick={(e) => handlePageClick(8, 1, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.iali68} alt="tớ thích cậu" />
              {config.page53Subtitle && config.page53Subtitle.trim().length > 0 && (
                <h6 id="text-72-sub">{config.page53Subtitle}</h6>
              )}
              <h3 id="text-72">{textMap["text-72"]}</h3>
              {renderSlidePhoto(53)}
            </div>

            <div
              id="/section-9/page-3"
              className={getPageClasses(8, 2, "page-54 center-img")}
              data-id="page-3"
              onClick={(e) => handlePageClick(8, 2, e)}
            >
              <div className="center-img">
                {pageOverrides[54] || config.page54CenterText || "I love you"}
              </div>
            </div>

            <div
              id="/section-9/page-4"
              className={getPageClasses(8, 3, "page-55 right-img")}
              data-id="page-4"
              onClick={(e) => handlePageClick(8, 3, e)}
            >
              <img src={FLOWTIME_PPT_ASSETS.img14915} alt="" />
              <p className="text">
                {pageOverrides[55] !== undefined ? (
                  <span id="text-73">{pageOverrides[55]}</span>
                ) : (
                  <>
                    <span id="text-73">{textMap["text-73"]}</span>
                    <br />
                    <span id="text-74">{textMap["text-74"]}</span>
                    <br />
                    <span id="text-74-love">{textMap["text-74-love"]}</span>
                  </>
                )}
                <span
                  style={{
                    display: "block",
                    marginTop: "0.85em",
                    fontSize: "0.78em",
                    fontWeight: 500,
                    opacity: 0.85,
                  }}
                >
                  -- Nhấn &quot;Esc&quot; hoặc bấm Toàn Cảnh để xem điều bất ngờ
                </span>
              </p>
              {renderSlidePhoto(55)}
            </div>
          </div>
        </div>

        {/* Bottom-Right Heart-Shaped Progress Thumbnail Map */}
        {config.showProgressMap && (
          <div
            className="ft-default-progress"
            style={!hasReachedEnd ? { opacity: 0, pointerEvents: "none" } : undefined}
          >
            {SECTION_PAGE_COUNTS.map((pageCount, sIdx) => (
              <div
                key={sIdx}
                className={`ft-section-thumb thumb-section-${sIdx}`}
                data-section={`__${sIdx}`}
              >
                {Array.from({ length: pageCount }, (_, pIdx) => {
                  const isActual = sIdx === sectionIdx && pIdx === pageIdx;
                  return (
                    <div
                      key={pIdx}
                      data-page={`__${pIdx}`}
                      data-section={`__${sIdx}`}
                      className={`ft-page-thumb thumb-page-${pIdx}${isActual ? " actual" : ""}`}
                      onClick={() => {
                        onUserInteract?.();
                        gotoPage(sIdx, pIdx, true);
                      }}
                      title={`Chương ${sIdx + 1} - Trang ${pIdx + 1}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* On-Screen Directional Navigation Controls */}
        {config.showNavButtons && (
          <div
            className="ft-nav-controls"
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              zIndex: 1001,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.88)",
              padding: "6px 10px",
              borderRadius: "20px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
              fontSize: "13px",
              color: "#613b3b",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onUserInteract?.();
                prevSection();
              }}
              title="Chương trước (←)"
              style={{
                border: "none",
                background: "#fed1ea",
                color: "#613b3b",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                onUserInteract?.();
                prevPage();
              }}
              title="Trang trước (↑)"
              style={{
                border: "none",
                background: "#fed1ea",
                color: "#613b3b",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ↑
            </button>
            <span style={{ padding: "0 6px", fontWeight: 700 }}>{currentGlobalPage} / 55</span>
            <button
              type="button"
              onClick={() => {
                onUserInteract?.();
                nextPage();
              }}
              title="Trang tiếp (↓)"
              style={{
                border: "none",
                background: "#FA4A4A",
                color: "#fff",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => {
                onUserInteract?.();
                nextSection();
              }}
              title="Chương tiếp (→)"
              style={{
                border: "none",
                background: "#fed1ea",
                color: "#613b3b",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              →
            </button>
            {hasReachedEnd && (
              <button
                type="button"
                onClick={() => {
                  onUserInteract?.();
                  setIsOverview((prev) => !prev);
                }}
                title="Toàn cảnh 55 trang trái tim (Esc)"
                style={{
                  border: "none",
                  background: isOverview ? "#44a54a" : "#a54479",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {isOverview ? "Xem Trang" : "❤ Toàn Cảnh"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
