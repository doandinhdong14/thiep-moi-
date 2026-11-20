"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { RotateCcw, Volume2, VolumeX, Sparkles, Play, Pause } from "lucide-react";
import type { InvitationContent } from "@/lib/templates/schema";
import { RoseReveal01 } from "./rose/RoseReveal01";
import type { RoseRevealState } from "./rose/types";
import { JourneyOverlay } from "../card-01-first-gift/journey/Overlay";
import { LanternOverlay } from "./lantern/Overlay";
import type { SkyLantern3DFireworksConfig } from "./lantern/config";
import { ViewerErrorBoundary } from "../card-01-first-gift/ViewerErrorBoundary";
import { buildCard02StageConfigs } from "./card02Mapper";
import type { EffectEvent, EffectRuntime } from "../card-01-first-gift/sdk";
import "./styles.css";

export type Card02Stage = "rose" | "journey" | "lantern";

export interface Card02PlayerProps {
  content: InvitationContent;
  /** When true (demo page / demo modal), automatically plays through all 3 stages in a loop */
  autoDemo?: boolean;
  /** When true (editor/demo preview), shows subtle stage switcher pills */
  isPreview?: boolean;
  /** Optional external stage jump from editor */
  forcedStage?: Card02Stage;
}

type TransitionKind = "none" | "rose-to-cosmic" | "cosmic-to-lantern";

const ResponsiveRoseCamera: React.FC = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!size.width || !size.height) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const aspect = size.width / size.height;
    const targetFov = aspect < 0.62 ? 58 : aspect < 0.85 ? 52 : aspect < 1.05 ? 48 : 45;
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);

  return null;
};

export const Card02Player: React.FC<Card02PlayerProps> = ({
  content,
  autoDemo = false,
  isPreview = false,
  forcedStage,
}) => {
  const { roseAssetConfig, journeyConfig, lanternConfig, portalCtaText, musicUrl } = useMemo(
    () => buildCard02StageConfigs(content),
    [content]
  );

  const [stage, setStage] = useState<Card02Stage>(forcedStage || "rose");
  const [runKey, setRunKey] = useState<number>(1);
  const [autoRunning, setAutoRunning] = useState<boolean>(autoDemo);

  const [transition, setTransition] = useState<TransitionKind>("none");
  const [veilMode, setVeilMode] = useState<"none" | "rose-to-cosmic" | "cosmic-to-lantern">("none");
  const [mountRose, setMountRose] = useState<boolean>(stage === "rose");
  const [mountJourney, setMountJourney] = useState<boolean>(stage === "journey");
  const [mountLantern, setMountLantern] = useState<boolean>(stage === "lantern");
  const [stagePhase, setStagePhase] = useState<Record<Card02Stage, "entering" | "active" | "exiting">>({
    rose: stage === "rose" ? "active" : "entering",
    journey: stage === "journey" ? "active" : "entering",
    lantern: stage === "lantern" ? "active" : "entering",
  });

  // Stage 1: Rose Reveal animation state
  const [roseState, setRoseState] = useState<RoseRevealState>("idle");
  const [roseBloomProgress, setRoseBloomProgress] = useState<number>(0);
  const [roseFlightProgress, setRoseFlightProgress] = useState<number>(0);
  const roseHasTriggeredRef = useRef<boolean>(false);
  const roseRafRef = useRef<number | null>(null);
  const roseStartTimeRef = useRef<number | null>(null);
  const isTabHiddenRef = useRef<boolean>(false);

  // Stage 2: Journey ending portal detection
  const [journeyReachedEnding, setJourneyReachedEnding] = useState<boolean>(false);
  const [isAtJourneyBottom, setIsAtJourneyBottom] = useState<boolean>(false);
  const [showPortalCta, setShowPortalCta] = useState<boolean>(false);
  const endingReadyTimestampRef = useRef<number>(0);

  // Continuous background music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(autoDemo);
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  const timersRef = useRef<number[]>([]);
  const journeyLayerRef = useRef<HTMLDivElement | null>(null);
  const roseTransitionTriggeredRef = useRef<boolean>(false);
  const lanternTransitionTriggeredRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const stopRoseAnimation = useCallback(() => {
    if (roseRafRef.current !== null) {
      cancelAnimationFrame(roseRafRef.current);
      roseRafRef.current = null;
    }
    roseStartTimeRef.current = null;
    roseHasTriggeredRef.current = false;
  }, []);

  const resetRoseToIdle = useCallback(() => {
    stopRoseAnimation();
    setRoseState("idle");
    setRoseBloomProgress(0);
    setRoseFlightProgress(0);
  }, [stopRoseAnimation]);

  useEffect(() => {
    const onVis = () => {
      isTabHiddenRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    setAutoRunning(autoDemo);
  }, [autoDemo]);

  // Setup continuous BGM across all 3 stages
  useEffect(() => {
    if (!musicUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudioStarted(false);
      return;
    }
    try {
      const audio = new Audio(musicUrl);
      audio.loop = true;
      audio.volume = 0.48;
      audioRef.current = audio;
      return () => {
        audio.pause();
        audioRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [musicUrl]);

  const ensureAudioPlaying = useCallback(() => {
    if (!musicUrl || audioMuted || !audioRef.current) return;
    if (!audioRef.current.paused) {
      setAudioStarted(true);
      return;
    }
    void audioRef.current
      .play()
      .then(() => setAudioStarted(true))
      .catch(() => {});
  }, [musicUrl, audioMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!musicUrl || audioMuted) {
      audio.pause();
    } else if (audioStarted) {
      void audio.play().catch(() => {});
    }
  }, [musicUrl, audioMuted, audioStarted]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopRoseAnimation();
    };
  }, [clearAllTimers, stopRoseAnimation]);

  const jumpToStage = useCallback(
    (target: Card02Stage, resetRun = false) => {
      clearAllTimers();
      resetRoseToIdle();
      roseTransitionTriggeredRef.current = false;
      lanternTransitionTriggeredRef.current = false;
      setTransition("none");
      setVeilMode("none");
      setJourneyReachedEnding(false);
      setIsAtJourneyBottom(false);
      setShowPortalCta(false);

      setStage(target);
      if (resetRun) setRunKey((k) => k + 1);
      setMountRose(target === "rose");
      setMountJourney(target === "journey");
      setMountLantern(target === "lantern");
      setStagePhase({
        rose: target === "rose" ? "active" : "entering",
        journey: target === "journey" ? "active" : "entering",
        lantern: target === "lantern" ? "active" : "entering",
      });
    },
    [clearAllTimers, resetRoseToIdle]
  );

  // Sync external stage switches from Editor
  const prevForcedStageRef = useRef<Card02Stage | undefined>(forcedStage);
  useEffect(() => {
    if (!forcedStage || forcedStage === prevForcedStageRef.current) return;
    prevForcedStageRef.current = forcedStage;
    jumpToStage(forcedStage);
  }, [forcedStage, jumpToStage]);

  const handleReplayAll = useCallback(() => {
    jumpToStage("rose", true);
  }, [jumpToStage]);

  // Stage 1 -> Stage 2 transition
  const startRoseToJourneyTransition = useCallback(() => {
    if (roseTransitionTriggeredRef.current) return;
    roseTransitionTriggeredRef.current = true;
    clearAllTimers();

    setTransition("rose-to-cosmic");
    setMountJourney(true);
    setStagePhase((prev) => ({ ...prev, journey: "entering" }));
    setVeilMode("rose-to-cosmic");

    scheduleTimer(() => {
      setStagePhase({ rose: "exiting", journey: "active", lantern: "entering" });
      setStage("journey");
    }, 90);

    scheduleTimer(() => setVeilMode("none"), 660);

    scheduleTimer(() => {
      setMountRose(false);
      stopRoseAnimation();
      setTransition("none");
    }, 1150);
  }, [clearAllTimers, scheduleTimer, stopRoseAnimation]);

  // Stage 2 -> Stage 3 transition
  const startJourneyToLanternTransition = useCallback(() => {
    if (lanternTransitionTriggeredRef.current) return;
    lanternTransitionTriggeredRef.current = true;
    clearAllTimers();

    setTransition("cosmic-to-lantern");
    setShowPortalCta(false);
    setMountLantern(true);
    setStagePhase((prev) => ({ ...prev, lantern: "entering" }));
    setVeilMode("cosmic-to-lantern");

    scheduleTimer(() => {
      setStagePhase({ rose: "entering", journey: "exiting", lantern: "active" });
      setStage("lantern");
    }, 110);

    scheduleTimer(() => setVeilMode("none"), 760);

    scheduleTimer(() => {
      setMountJourney(false);
      setTransition("none");
    }, 1250);
  }, [clearAllTimers, scheduleTimer]);

  const roseCfg = roseAssetConfig.roseReveal;

  const triggerRoseBloom = useCallback(
    (autoAdvanceToJourney = true) => {
      if (roseHasTriggeredRef.current || roseState !== "idle") return;
      ensureAudioPlaying();
      roseHasTriggeredRef.current = true;
      setRoseState("blooming");
      roseStartTimeRef.current = performance.now();

      const durationMs = Math.max(0.8, roseCfg.bloomDuration || 1.8) * 1000;
      const totalDurationMs = durationMs + 1800;
      const handoffTimeMs = durationMs + 950;
      let handoffScheduled = false;

      const tick = (now: number) => {
        if (!roseStartTimeRef.current) roseStartTimeRef.current = now;
        if (isTabHiddenRef.current) {
          roseRafRef.current = requestAnimationFrame(tick);
          return;
        }

        const elapsed = now - roseStartTimeRef.current;
        const bNorm = Math.min(1, Math.max(0, elapsed / durationMs));
        const bEased = bNorm * bNorm * (3 - 2 * bNorm);
        setRoseBloomProgress(bEased);

        const flightStart = durationMs * 0.7;
        if (elapsed >= flightStart) {
          const fNorm = Math.min(1, Math.max(0, (elapsed - flightStart) / (totalDurationMs - flightStart)));
          setRoseFlightProgress(fNorm);
        }

        if (elapsed >= durationMs + 400 && elapsed < totalDurationMs) {
          setRoseState("revealing");
        }

        if (autoAdvanceToJourney && !handoffScheduled && elapsed >= handoffTimeMs) {
          handoffScheduled = true;
          startRoseToJourneyTransition();
        }

        if (elapsed < totalDurationMs) {
          roseRafRef.current = requestAnimationFrame(tick);
        } else {
          setRoseState("completed");
          roseRafRef.current = null;
        }
      };

      roseRafRef.current = requestAnimationFrame(tick);
    },
    [ensureAudioPlaying, roseCfg.bloomDuration, roseState, startRoseToJourneyTransition]
  );

  // Auto-demo choreography for Stage 1 (Rose): admire bud -> auto bloom -> Stage 2
  useEffect(() => {
    if (!autoRunning || stage !== "rose" || transition !== "none" || roseState !== "idle") return;
    const t = window.setTimeout(() => {
      triggerRoseBloom(true);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [autoRunning, stage, transition, roseState, triggerRoseBloom]);

  // Auto-demo choreography for Stage 3 (Lanterns & Fireworks): watch ~12.5s then loop cleanly to Stage 1
  useEffect(() => {
    if (!autoRunning || stage !== "lantern" || transition !== "none") return;
    const t = window.setTimeout(() => {
      handleReplayAll();
    }, 12500);
    return () => window.clearTimeout(t);
  }, [autoRunning, stage, transition, handleReplayAll]);

  const baseRuntime: EffectRuntime = useMemo(
    () => ({
      instanceId: `card02-${runKey}`,
      runId: `run-${runKey}`,
      quality: "high",
      reducedMotion:
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
          ? true
          : false,
      isPaused: false,
      isVisible: true,
      viewport: {
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 720,
      },
      clock: { deltaSeconds: 0, elapsedSeconds: 0 },
      speed: 1,
    }),
    [runKey]
  );

  const handleJourneyEmit = useCallback(
    (event: EffectEvent) => {
      if (event.type === "interaction" || event.type === "reveal") ensureAudioPlaying();
      if (event.type === "complete") {
        setJourneyReachedEnding(true);
        setIsAtJourneyBottom(true);
        endingReadyTimestampRef.current = Date.now();
        scheduleTimer(() => setShowPortalCta(true), 850);
        if (autoRunning) {
          scheduleTimer(() => startJourneyToLanternTransition(), 2700);
        }
      }
    },
    [autoRunning, ensureAudioPlaying, scheduleTimer, startJourneyToLanternTransition]
  );

  const handleLanternEmit = useCallback(
    (event: EffectEvent) => {
      if (event.type === "interaction" || event.type === "reveal") ensureAudioPlaying();
    },
    [ensureAudioPlaying]
  );

  // Observe Stage 2 Scene 8 scroll/swipe for manual entry into Stage 3
  useEffect(() => {
    if (!mountJourney || !journeyReachedEnding) return;
    const layer = journeyLayerRef.current;
    if (!layer) return;
    const scroller = layer.querySelector(".cbj-scroll-snap-y") as HTMLElement | null;
    if (!scroller) return;

    const checkAtBottom = () => {
      const remaining = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
      setIsAtJourneyBottom(remaining <= 36);
    };
    checkAtBottom();

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 14) {
        const remaining = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
        if (remaining <= 36 && Date.now() - endingReadyTimestampRef.current > 1250) {
          e.preventDefault();
          startJourneyToLanternTransition();
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) touchStartYRef.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartYRef.current === null || e.changedTouches.length !== 1) return;
      const dy = touchStartYRef.current - e.changedTouches[0].clientY;
      touchStartYRef.current = null;
      const remaining = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
      if (dy > 42 && remaining <= 36 && Date.now() - endingReadyTimestampRef.current > 1250) {
        startJourneyToLanternTransition();
      }
    };

    scroller.addEventListener("scroll", checkAtBottom, { passive: true });
    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", checkAtBottom);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchend", onTouchEnd);
    };
  }, [mountJourney, journeyReachedEnding, startJourneyToLanternTransition]);

  const effectiveLanternConfig = useMemo<SkyLantern3DFireworksConfig>(
    () => ({
      ...lanternConfig,
      soundEnabled: audioMuted ? false : lanternConfig.soundEnabled,
    }),
    [lanternConfig, audioMuted]
  );

  return (
    <div
      className="sc2-player-root"
      onPointerDown={() => ensureAudioPlaying()}
      onContextMenu={(e) => e.preventDefault()}
      role="region"
      aria-label="Thiệp thứ 2"
    >
      {/* STAGE 1: Bông hồng mở quà 3D */}
      {mountRose && (
        <div
          className={`sc2-stage-layer sc2-rose-layer ${
            stagePhase.rose === "exiting"
              ? "exiting-to-journey"
              : stagePhase.rose === "entering"
              ? "entering"
              : "active"
          }`}
          style={{
            zIndex: stage === "rose" ? 20 : 15,
            background: `radial-gradient(ellipse at 50% 35%, ${roseCfg.backgroundColor || "#190B17"} 0%, #0d040c 100%)`,
          }}
        >
          <ViewerErrorBoundary>
            <Canvas
              camera={{ position: [0, 1.85, 7.2], fov: 45 }}
              dpr={[1, 2]}
              gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
              style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
            >
              <ResponsiveRoseCamera />
              <Suspense fallback={null}>
                <RoseReveal01
                  config={roseAssetConfig}
                  state={roseState}
                  bloomProgress={roseBloomProgress}
                  flightProgress={roseFlightProgress}
                  onTriggerBloom={() => {
                    setAutoRunning(false);
                    triggerRoseBloom(true);
                  }}
                  paused={false}
                  quality="high"
                />
              </Suspense>
            </Canvas>

            <div className={`sc2-rose-overlay ${roseState !== "idle" ? "fade-out" : ""}`}>
              <div className="sc2-rose-bottom-content">
                <p className="sc2-rose-message">{roseCfg.messageText}</p>
                <button
                  type="button"
                  className="sc2-rose-open-btn"
                  onClick={() => {
                    setAutoRunning(false);
                    triggerRoseBloom(true);
                  }}
                  tabIndex={roseState === "idle" ? 0 : -1}
                  aria-label={roseCfg.buttonText}
                >
                  <span className="sc2-rose-btn-pulse" aria-hidden="true" />
                  <Sparkles size={16} />
                  <span>{roseCfg.buttonText}</span>
                </button>
              </div>
            </div>
          </ViewerErrorBoundary>
        </div>
      )}

      {/* STAGE 2: Hành trình sao băng 8 màn */}
      {mountJourney && (
        <div
          ref={journeyLayerRef}
          className={`sc2-stage-layer ${
            stagePhase.journey === "exiting"
              ? "exiting-to-lantern"
              : stagePhase.journey === "entering"
              ? "entering"
              : "active"
          }`}
          style={{
            zIndex: stage === "journey" ? 25 : 18,
            background: journeyConfig.backgroundColor || "#080d1a",
          }}
        >
          <ViewerErrorBoundary>
            <JourneyOverlay
              key={`c02-journey-${runKey}`}
              config={journeyConfig}
              runtime={baseRuntime}
              emit={handleJourneyEmit}
              autoDemo={autoRunning}
            />
          </ViewerErrorBoundary>

          {showPortalCta && isAtJourneyBottom && transition === "none" && (
            <div className="sc2-portal-cta-wrap">
              <button
                type="button"
                className="sc2-portal-cta-btn"
                onClick={startJourneyToLanternTransition}
              >
                <Sparkles size={15} />
                <span>{portalCtaText || "Cùng tớ thả đèn trời ước nguyện nhé ✨"}</span>
              </button>
              <span className="sc2-portal-cta-sub">
                Chạm hoặc lướt xuống thêm lần nữa để thả đèn trời 3D
              </span>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: Đèn trời 3D & Pháo hoa */}
      {mountLantern && (
        <div
          className={`sc2-stage-layer sc2-lantern-layer ${
            stagePhase.lantern === "entering" ? "entering" : "active"
          }`}
          style={{ zIndex: stage === "lantern" ? 30 : 20, background: "#040712" }}
        >
          <ViewerErrorBoundary>
            <LanternOverlay
              key={`c02-lantern-${runKey}`}
              config={effectiveLanternConfig}
              runtime={baseRuntime}
              emit={handleLanternEmit}
              autoDemo={autoRunning}
            />
          </ViewerErrorBoundary>
        </div>
      )}

      {/* Seamless Transition Veil */}
      <div
        className={`sc2-transition-veil ${
          veilMode === "rose-to-cosmic"
            ? "rose-to-cosmic"
            : veilMode === "cosmic-to-lantern"
            ? "cosmic-to-lantern"
            : ""
        }`}
        aria-hidden="true"
      />

      {/* Floating Minimal Top HUD */}
      <div className="sc2-player-hud-top">
        <div className="sc2-hud-group">
          {isPreview && (
            <div className="sc2-preview-stage-pills">
              {(
                [
                  { id: "rose", label: "1" },
                  { id: "journey", label: "2" },
                  { id: "lantern", label: "3" },
                ] as { id: Card02Stage; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoRunning(false);
                    jumpToStage(item.id);
                  }}
                  className={`sc2-hud-stage-dot ${stage === item.id ? "active" : ""}`}
                  title={`Xem chặng ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
              {autoDemo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoRunning((v) => !v);
                  }}
                  className="sc2-hud-pill sc2-hud-compact"
                  title={autoRunning ? "Tạm dừng tự chạy demo" : "Bật tự chạy demo"}
                >
                  {autoRunning ? <Pause size={11} /> : <Play size={11} />}
                  <span>{autoRunning ? "Tự chạy" : "Thủ công"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="sc2-hud-group">
          {stage === "lantern" && (
            <button
              type="button"
              className="sc2-hud-pill"
              onClick={handleReplayAll}
              title="Xem lại toàn bộ thiệp từ đầu"
            >
              <RotateCcw size={13} />
              <span className="sc2-hud-text-optional">Xem lại</span>
            </button>
          )}

          {musicUrl && (
            <button
              type="button"
              className="sc2-hud-pill"
              onClick={(e) => {
                e.stopPropagation();
                setAudioMuted((prev) => {
                  const nextMuted = !prev;
                  if (!nextMuted && audioRef.current) {
                    setAudioStarted(true);
                    void audioRef.current.play().catch(() => {});
                  } else if (nextMuted && audioRef.current) {
                    audioRef.current.pause();
                  }
                  return nextMuted;
                });
              }}
              title={audioMuted ? "Bật nhạc nền" : "Tắt nhạc nền"}
            >
              {audioMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span className="sc2-hud-text-optional">{audioMuted ? "Bật nhạc" : "Nhạc nền"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card02Player;
