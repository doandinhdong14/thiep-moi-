"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { EffectProps } from "../sdk";
import type { CosmicBirthdayJourneyConfig } from "./config";
import { CosmicBackground } from "./CosmicBackground";
import {
  CUTE_BODY_FONT,
  Scene1Intro,
  Scene2Title,
  Scene3Cards,
  Scene4Candle,
  Scene4Gift,
  Scene5Letter,
  Scene6Uplift,
  Scene7Ending,
  splitPipes,
  type GiftBurstPhoto,
} from "./BirthdayScenes";
import { getCosmicPlaceholderUrl } from "./placeholders";

const CBJ_KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Quicksand:wght@400;500;600&family=Mali:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Dancing+Script:wght@500;600;700&display=swap');
.cbj-root, .cbj-root button { font-family: ${CUTE_BODY_FONT}; }
.cbj-root p, .cbj-root h1, .cbj-root span, .cbj-root button { word-break: keep-all; overflow-wrap: break-word; }
.cbj-word-token { display: inline-block; white-space: nowrap; word-break: keep-all; }
@keyframes cbjLineReveal { 0% { opacity: 0; transform: translateY(22px); filter: blur(10px); } 100% { opacity: var(--cbj-line-op, 0.9); transform: translateY(0); filter: blur(0px); } }
@keyframes cbjFloatBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
@keyframes cbjArrowBounce { 0%, 100% { transform: translateY(0px); opacity: 0.6; } 50% { transform: translateY(5px); opacity: 1; } }
@keyframes cbjHaloPulse { 0%, 100% { transform: scale(1.15); opacity: 0.5; } 50% { transform: scale(1.7); opacity: 0.12; } }
@keyframes cbjPulseSoft { 0%, 100% { opacity: 0.48; } 50% { opacity: 0.98; } }
@keyframes cbjFlameFlicker {
  0%, 100% { transform: translate(90px, 51px) scaleX(1) scaleY(1) skewX(0deg); }
  25% { transform: translate(90px, 51px) scaleX(0.95) scaleY(1.06) skewX(-2.5deg); }
  50% { transform: translate(90px, 51px) scaleX(1.04) scaleY(0.96) skewX(2deg); }
  75% { transform: translate(90px, 51px) scaleX(0.97) scaleY(1.04) skewX(-1.5deg); }
}
@keyframes cbjSmokeRise { 0% { opacity: 0.75; transform: translateY(0) scale(0.6); } 100% { opacity: 0; transform: translateY(-34px) scale(1.6); } }
.cbj-smoke-puff { animation: cbjSmokeRise 1.4s ease-out forwards; }
@keyframes cbjWishSpark { 0% { opacity: 0; transform: translate(0, 0) scale(0.4); } 25% { opacity: 0.95; } 100% { opacity: 0; transform: translate(var(--cbj-wx, 0px), var(--cbj-wy, -110px)) scale(1.15); } }
@keyframes cbjBurstOut { 0% { opacity: 1; transform: translate(0, 0) scale(0) rotate(0deg); } 100% { opacity: 0; transform: translate(var(--cbj-tx, 0px), var(--cbj-ty, -120px)) scale(var(--cbj-sc, 1)) rotate(var(--cbj-rot, 120deg)); } }
@keyframes cbjRingExpand { 0% { opacity: 0.85; transform: translate(-50%, -50%) scale(0.3); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(2.8); } }
@keyframes cbjGiftPhotoPop {
  0% { opacity: 0; transform: translate(-50%, -20%) scale(0.18) rotate(0deg); }
  65% { opacity: 1; transform: translate(calc(-50% + var(--cbj-px, 0px) * 1.06), calc(-50% + var(--cbj-py, -120px) * 1.06)) scale(1.04) rotate(var(--cbj-pr, 0deg)); }
  100% { opacity: 1; transform: translate(calc(-50% + var(--cbj-px, 0px)), calc(-50% + var(--cbj-py, -120px))) scale(1) rotate(var(--cbj-pr, 0deg)); }
}
@keyframes cbjZoomIn { 0% { opacity: 0; transform: scale(0.84); } 100% { opacity: 1; transform: scale(1); } }
@keyframes cbjShakeHint { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
.cbj-scroll-snap-y { position: relative; overflow-y: auto; overflow-x: hidden; width: 100%; height: 100%; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; scrollbar-width: none; }
.cbj-scroll-snap-y::-webkit-scrollbar { display: none; }
.cbj-scroll-snap-start { width: 100%; height: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center; position: relative; box-sizing: border-box; }
`;

const AUTO_DEMO_SCENE_DWELL_MS: Record<number, number> = {
  1: 3100,
  2: 2400,
  3: 3900,
  4: 3300,
  5: 2900,
  6: 4600,
  7: 2500,
};

export interface JourneyOverlayProps extends EffectProps<CosmicBirthdayJourneyConfig> {
  autoDemo?: boolean;
}

export const JourneyOverlay: React.FC<JourneyOverlayProps> = ({
  config,
  runtime,
  emit,
  autoDemo = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);
  const [giftOpened, setGiftOpened] = useState<boolean>(false);
  const [activeScene, setActiveScene] = useState<number>(1);
  const [allCardsViewed, setAllCardsViewed] = useState<boolean>(
    () => autoDemo || config.cardPhotos.length === 0
  );
  const [lockNoticeTick, setLockNoticeTick] = useState<number>(0);
  const [showLockBanner, setShowLockBanner] = useState<boolean>(false);

  const completionEmittedRef = useRef<boolean>(false);
  const scrollAnimRafRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const wheelLockUntilRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null);
  const lockBannerTimerRef = useRef<number>(0);

  const introLines = useMemo(() => splitPipes(config.introLinesText), [config.introLinesText]);
  const candleLines = useMemo(() => splitPipes(config.candleLinesText), [config.candleLinesText]);
  const upliftLines = useMemo(() => splitPipes(config.upliftLinesText), [config.upliftLinesText]);
  const endingLines = useMemo(() => splitPipes(config.endingLinesText), [config.endingLinesText]);

  const giftBurstPhotos = useMemo<GiftBurstPhoto[]>(() => {
    const result: GiftBurstPhoto[] = [];
    for (let i = 0; i < 3; i++) {
      const card = config.cardPhotos[i];
      const url =
        card?.imageUrl && card.imageUrl.trim().length > 0
          ? card.imageUrl
          : getCosmicPlaceholderUrl(i);
      result.push({
        id: card?.id || `burst-${i}`,
        imageUrl: url,
        caption: card?.caption || `Kỷ niệm ${i + 1}`,
      });
    }
    return result;
  }, [config.cardPhotos]);

  const sceneIds = useMemo(
    () => [
      { idx: 1, label: "Mở đầu" },
      { idx: 2, label: "Tên" },
      { idx: 3, label: "Thẻ ảnh" },
      { idx: 4, label: "Ước nguyện" },
      { idx: 5, label: "Hộp quà" },
      { idx: 6, label: "Lá thư" },
      { idx: 7, label: "Tương lai" },
      { idx: 8, label: "Kết" },
    ],
    []
  );

  const triggerCardLockNotice = useCallback(() => {
    setLockNoticeTick((t) => t + 1);
    setShowLockBanner(true);
    window.clearTimeout(lockBannerTimerRef.current);
    lockBannerTimerRef.current = window.setTimeout(() => setShowLockBanner(false), 2400);
  }, []);

  useEffect(() => {
    setGiftOpened(false);
    setAllCardsViewed(autoDemo || config.cardPhotos.length === 0);
    setShowLockBanner(false);
    completionEmittedRef.current = false;
    cancelAnimationFrame(scrollAnimRafRef.current);
    isProgrammaticScrollRef.current = false;
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    setActiveScene(1);
  }, [config.cardPhotos.length, runtime.runId, autoDemo]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(scrollAnimRafRef.current);
      window.clearTimeout(lockBannerTimerRef.current);
    };
  }, []);

  const scrollToSceneNumber = useCallback(
    (sceneNum: number, instant = false, bypassLock = false) => {
      if (!bypassLock && !autoDemo && !allCardsViewed && sceneNum > 3) {
        triggerCardLockNotice();
        const scene3Pos = sceneIds.findIndex((s) => s.idx === 3);
        const scene3El = sceneRefs.current[scene3Pos];
        const container = scrollContainerRef.current;
        if (container && scene3El && container.scrollTop > scene3El.offsetTop + 2) {
          container.scrollTop = scene3El.offsetTop;
        }
        return;
      }

      const targetPosition = sceneIds.findIndex((s) => s.idx === sceneNum);
      const safePos = targetPosition >= 0 ? targetPosition : 0;
      const targetEl = sceneRefs.current[safePos];
      const container = scrollContainerRef.current;
      if (!targetEl || !container) return;

      const targetTop = targetEl.offsetTop || safePos * container.clientHeight;
      setActiveScene(sceneIds[safePos].idx);
      cancelAnimationFrame(scrollAnimRafRef.current);

      if (instant || container.clientHeight === 0 || typeof requestAnimationFrame === "undefined") {
        isProgrammaticScrollRef.current = false;
        container.scrollTop = targetTop;
        return;
      }

      const startTop = container.scrollTop;
      const diff = targetTop - startTop;
      if (Math.abs(diff) < 2) {
        container.scrollTop = targetTop;
        return;
      }

      isProgrammaticScrollRef.current = true;
      const duration = 560;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        container.scrollTop = startTop + diff * eased;

        if (progress < 1) {
          scrollAnimRafRef.current = requestAnimationFrame(step);
        } else {
          container.scrollTop = targetTop;
          isProgrammaticScrollRef.current = false;
        }
      };

      scrollAnimRafRef.current = requestAnimationFrame(step);
    },
    [sceneIds, allCardsViewed, autoDemo, triggerCardLockNotice]
  );

  // Auto-demo progression across all 8 scenes of Stage 2
  useEffect(() => {
    if (!autoDemo) return;
    if (activeScene >= 8) return;
    const dwell = AUTO_DEMO_SCENE_DWELL_MS[activeScene] || 2800;
    const t = window.setTimeout(() => {
      scrollToSceneNumber(activeScene + 1, false, true);
    }, dwell);
    return () => window.clearTimeout(t);
  }, [autoDemo, activeScene, scrollToSceneNumber]);

  const canInnerScroll = (target: EventTarget | null, dir: 1 | -1): boolean => {
    if (!(target instanceof Element)) return false;
    const letterBox = target.closest(".cbj-letter-scroll");
    if (!letterBox) return false;
    if (letterBox.scrollHeight <= letterBox.clientHeight + 2) return false;
    if (dir > 0) return letterBox.scrollTop + letterBox.clientHeight < letterBox.scrollHeight - 2;
    return letterBox.scrollTop > 2;
  };

  const stepScene = useCallback(
    (dir: 1 | -1) => {
      const currentPos = sceneIds.findIndex((s) => s.idx === activeScene);
      const safePos = currentPos >= 0 ? currentPos : 0;
      const nextPos = Math.max(0, Math.min(sceneIds.length - 1, safePos + dir));
      if (nextPos === safePos) return;
      scrollToSceneNumber(sceneIds[nextPos].idx);
    },
    [sceneIds, activeScene, scrollToSceneNumber]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 6) return;
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (canInnerScroll(e.target, dir)) return;
      e.preventDefault();
      const now = Date.now();
      if (now < wheelLockUntilRef.current) return;
      wheelLockUntilRef.current = now + 460;
      stepScene(dir);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [stepScene]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, target: e.target };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const dy = start.y - t.clientY;
      const dx = start.x - t.clientX;
      if (Math.abs(dy) < 32 || Math.abs(dy) <= Math.abs(dx) * 1.1) return;
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      if (canInnerScroll(start.target, dir)) return;
      stepScene(dir);
    },
    [stepScene]
  );

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isProgrammaticScrollRef.current) return;

    if (!allCardsViewed && !autoDemo) {
      const scene3Pos = sceneIds.findIndex((s) => s.idx === 3);
      const scene3El = sceneRefs.current[scene3Pos];
      const scene3Top = scene3El ? scene3El.offsetTop : scene3Pos * (container.clientHeight || 1);
      if (container.scrollTop > scene3Top + 4) {
        container.scrollTop = scene3Top;
        setActiveScene(3);
        triggerCardLockNotice();
        return;
      }
    }

    const h = container.clientHeight || 1;
    const pos = Math.round(container.scrollTop / h);
    const matched = sceneIds[Math.max(0, Math.min(sceneIds.length - 1, pos))];
    if (matched) setActiveScene(matched.idx);
  }, [sceneIds, allCardsViewed, autoDemo, triggerCardLockNotice]);

  const activeScenePos = sceneIds.findIndex((s) => s.idx === activeScene);
  const nextScene =
    activeScenePos >= 0 && activeScenePos < sceneIds.length - 1
      ? sceneIds[activeScenePos + 1]
      : null;

  const isLockedOnCards = activeScene === 3 && !allCardsViewed && !autoDemo;

  return (
    <div
      className="cbj-root"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "PageDown") {
          e.preventDefault();
          stepScene(1);
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
          e.preventDefault();
          stepScene(-1);
        }
      }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "400px",
        overflow: "hidden",
        outline: "none",
        backgroundColor: config.backgroundColor || "#080d1a",
        color: config.textColor || "#ffffff",
        fontFamily: CUTE_BODY_FONT,
      }}
    >
      <style>{CBJ_KEYFRAMES}</style>

      <CosmicBackground
        backgroundColor={config.backgroundColor}
        accentColor={config.accentColor}
        starCount={config.starCount}
        meteorFrequency={config.meteorFrequency}
        runtime={runtime}
      />

      <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 5 }}>
        <div
          ref={scrollContainerRef}
          className="cbj-scroll-snap-y"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Scene1Intro
            sectionRef={(el) => {
              sceneRefs.current[0] = el;
            }}
            lines={introLines}
            textColor={config.textColor}
            started={true}
            runId={runtime.runId}
          />

          <Scene2Title
            sectionRef={(el) => {
              sceneRefs.current[1] = el;
            }}
            subtitle={config.titleSubtitle}
            name={config.recipientName}
            textColor={config.textColor}
            isActive={activeScene === 2}
          />

          <Scene3Cards
            sectionRef={(el) => {
              sceneRefs.current[2] = el;
            }}
            cardPhotos={config.cardPhotos}
            hintIdle={config.cardHintIdle}
            hintExpanded={config.cardHintExpanded}
            runId={runtime.runId}
            lockNoticeTick={lockNoticeTick}
            isActive={activeScene === 3}
            autoDemo={autoDemo}
            onAllViewedChange={setAllCardsViewed}
            onCardOpen={(idx) => emit({ type: "interaction", name: "card-expand", payload: { index: idx } })}
          />

          <Scene4Candle
            sectionRef={(el) => {
              sceneRefs.current[3] = el;
            }}
            lines={candleLines}
            hintText={config.candleHintText}
            textColor={config.textColor}
            isActive={activeScene === 4}
            autoDemo={autoDemo}
            onBlown={() => emit({ type: "interaction", name: "candle-blown" })}
          />

          <Scene4Gift
            sectionRef={(el) => {
              sceneRefs.current[4] = el;
            }}
            hintText={config.giftHintText}
            accentColor={config.accentColor}
            opened={giftOpened}
            giftPhotos={giftBurstPhotos}
            isActive={activeScene === 5}
            autoDemo={autoDemo}
            onOpen={() => {
              if (!giftOpened) {
                setGiftOpened(true);
                emit({ type: "reveal", runId: runtime.runId, payload: { giftOpened: true } });
              }
            }}
          />

          <Scene5Letter
            sectionRef={(el) => {
              sceneRefs.current[5] = el;
            }}
            giftLetter={config.giftLetter}
            letterAlign={config.letterAlign}
            lineIntervalMs={autoDemo ? 380 : config.letterLineIntervalMs}
            textColor={config.textColor}
            isActive={activeScene === 6}
          />

          <Scene6Uplift
            sectionRef={(el) => {
              sceneRefs.current[6] = el;
            }}
            lines={upliftLines}
            textColor={config.textColor}
            isActive={activeScene === 7}
          />

          <Scene7Ending
            sectionRef={(el) => {
              sceneRefs.current[7] = el;
            }}
            lines={endingLines}
            name={config.recipientName}
            textColor={config.textColor}
            isActive={activeScene === 8}
            onVisible={() => {
              if (!completionEmittedRef.current) {
                completionEmittedRef.current = true;
                emit({
                  type: "complete",
                  runId: runtime.runId,
                  payload: { recipientName: config.recipientName },
                });
              }
            }}
          />
        </div>
      </div>

      {config.showSceneNavDots && (
        <nav
          aria-label="Điều hướng cảnh"
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 55,
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            padding: "8px 5px",
            borderRadius: "999px",
            background: "rgba(8, 13, 26, 0.48)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(6px)",
          }}
        >
          {sceneIds.map((scene) => {
            const isActiveDot = activeScene === scene.idx;
            const dotLocked = !allCardsViewed && !autoDemo && scene.idx > 3;
            return (
              <button
                key={scene.idx}
                type="button"
                title={dotLocked ? `${scene.label} (Xem hết ảnh ở Màn 3 trước)` : scene.label}
                aria-label={scene.label}
                onClick={() => scrollToSceneNumber(scene.idx)}
                style={{
                  width: isActiveDot ? "7px" : "5px",
                  height: isActiveDot ? "16px" : "5px",
                  borderRadius: "999px",
                  border: "none",
                  padding: 0,
                  cursor: dotLocked ? "not-allowed" : "pointer",
                  opacity: dotLocked ? 0.45 : 1,
                  background: isActiveDot ? config.accentColor || "#a08cff" : "rgba(255,255,255,0.32)",
                  transition: "all 0.25s ease",
                }}
              />
            );
          })}
        </nav>
      )}

      {showLockBanner && !allCardsViewed && (
        <div
          key={lockNoticeTick}
          style={{
            position: "absolute",
            bottom: "70px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            padding: "7px 14px",
            borderRadius: "999px",
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(196, 181, 253, 0.42)",
            color: "#f1f5f9",
            fontSize: "0.72rem",
            whiteSpace: "nowrap",
            maxWidth: "calc(100% - 28px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
            pointerEvents: "none",
          }}
        >
          Hãy xòe và xem hết tất cả ảnh kỷ niệm để đi tiếp nhé ✨
        </div>
      )}

      {nextScene && (
        <button
          type="button"
          onClick={() => scrollToSceneNumber(nextScene.idx)}
          aria-label="Lướt xuống cảnh tiếp theo"
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 55,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            minHeight: "44px",
            padding: "6px 18px",
            background: "transparent",
            border: "none",
            cursor: isLockedOnCards ? "not-allowed" : "pointer",
            color: isLockedOnCards ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.82)",
            userSelect: "none",
            touchAction: "manipulation",
          }}
        >
          <span style={{ fontFamily: CUTE_BODY_FONT, fontSize: "0.68rem", letterSpacing: "0.04em" }}>
            {isLockedOnCards ? "Xem hết ảnh để đi tiếp" : activeScene === 1 ? "Lướt xuống để xem" : "Lướt xuống"}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "cbjArrowBounce 1.8s ease-in-out infinite" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
};
