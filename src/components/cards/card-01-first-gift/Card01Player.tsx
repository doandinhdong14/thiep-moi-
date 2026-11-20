"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RotateCcw, Volume2, VolumeX, Sparkles, Compass, Play, Pause } from "lucide-react";

type OrbitControlsImpl = React.ElementRef<typeof OrbitControls>;
import type { InvitationContent } from "@/lib/templates/schema";
import { BouquetScene } from "./bouquet/Scene";
import { BouquetOverlay } from "./bouquet/Overlay";
import { JourneyOverlay } from "./journey/Overlay";
import { LoveUniverse01 } from "./universe/LoveUniverse01";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";
import { buildCard01StageConfigs } from "./card01Mapper";
import type { EffectEvent, EffectRuntime } from "./sdk";
import "./styles.css";

export type Card01Stage = "bouquet" | "journey" | "universe";

export interface Card01PlayerProps {
  content: InvitationContent;
  /** When true (e.g. demo page / demo modal), automatically plays through all 3 stages in a loop */
  autoDemo?: boolean;
  /** When true (editor/demo preview), shows subtle stage switcher pills */
  isPreview?: boolean;
  /** Optional external stage jump from editor */
  forcedStage?: Card01Stage;
}

type TransitionKind = "none" | "bouquet-to-journey" | "journey-to-universe";

const ResponsiveUniverseCamera: React.FC<{
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
}> = ({ orbitRef }) => {
  const { camera, size } = useThree();
  const initializedRef = useRef<string>("");

  useEffect(() => {
    if (!size.width || !size.height) return;
    const aspect = size.width / size.height;
    const bucket =
      aspect < 0.65 ? "xs-portrait" : aspect < 0.85 ? "portrait" : aspect < 1.05 ? "square" : "wide";
    if (initializedRef.current === bucket) return;
    initializedRef.current = bucket;

    const targetZ =
      bucket === "xs-portrait"
        ? 12.8
        : bucket === "portrait"
        ? 11.4
        : bucket === "square"
        ? 10.2
        : 9.2;

    camera.position.set(0, 0, targetZ);
    camera.updateProjectionMatrix();
    if (orbitRef.current) {
      orbitRef.current.saveState();
      orbitRef.current.update();
    }
  }, [camera, size.width, size.height, orbitRef]);

  return null;
};

export const Card01Player: React.FC<Card01PlayerProps> = ({
  content,
  autoDemo = false,
  isPreview = false,
  forcedStage,
}) => {
  const { bouquetConfig, journeyConfig, universeConfig, photoUrls, portalCtaText, musicUrl } =
    useMemo(() => buildCard01StageConfigs(content), [content]);

  const [stage, setStage] = useState<Card01Stage>(forcedStage || "bouquet");
  const [runKey, setRunKey] = useState<number>(1);
  const [autoRunning, setAutoRunning] = useState<boolean>(autoDemo);

  const [transition, setTransition] = useState<TransitionKind>("none");
  const [veilMode, setVeilMode] = useState<"none" | "rose-to-cosmic" | "cosmic-to-universe">("none");
  const [mountBouquet, setMountBouquet] = useState<boolean>(stage === "bouquet");
  const [mountJourney, setMountJourney] = useState<boolean>(stage === "journey");
  const [mountUniverse, setMountUniverse] = useState<boolean>(stage === "universe");
  const [stagePhase, setStagePhase] = useState<Record<Card01Stage, "entering" | "active" | "exiting">>({
    bouquet: stage === "bouquet" ? "active" : "entering",
    journey: stage === "journey" ? "active" : "entering",
    universe: stage === "universe" ? "active" : "entering",
  });

  const [journeyReachedEnding, setJourneyReachedEnding] = useState<boolean>(false);
  const [isAtJourneyBottom, setIsAtJourneyBottom] = useState<boolean>(false);
  const [showPortalCta, setShowPortalCta] = useState<boolean>(false);
  const endingReadyTimestampRef = useRef<number>(0);

  const [universeOpened, setUniverseOpened] = useState<boolean>(stage === "universe");
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const [showUniverseHint, setShowUniverseHint] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(autoDemo); // Mute by default in autoDemo iframe; unmuted for recipient
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  const timersRef = useRef<number[]>([]);
  const journeyLayerRef = useRef<HTMLDivElement | null>(null);
  const bouquetTransitionTriggeredRef = useRef<boolean>(false);
  const universeTransitionTriggeredRef = useRef<boolean>(false);
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

  // Sync autoRunning with external autoDemo prop (e.g. editor "Tự chạy" toggle)
  useEffect(() => {
    setAutoRunning(autoDemo);
  }, [autoDemo]);

  // Sync forcedStage from parent (e.g. editor stage switcher)
  const prevForcedStageRef = useRef<Card01Stage | undefined>(forcedStage);
  useEffect(() => {
    if (!forcedStage || forcedStage === prevForcedStageRef.current) return;
    prevForcedStageRef.current = forcedStage;
    jumpToStage(forcedStage);
  }, [forcedStage]);

  // Setup continuous background music across all 3 stages
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
      audio.volume = 0.5;
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
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const jumpToStage = useCallback(
    (target: Card01Stage, resetRun = false) => {
      clearAllTimers();
      bouquetTransitionTriggeredRef.current = false;
      universeTransitionTriggeredRef.current = false;
      setTransition("none");
      setVeilMode("none");
      setJourneyReachedEnding(false);
      setIsAtJourneyBottom(false);
      setShowPortalCta(false);

      setStage(target);
      if (resetRun) setRunKey((k) => k + 1);
      setMountBouquet(target === "bouquet");
      setMountJourney(target === "journey");
      setMountUniverse(target === "universe");
      setStagePhase({
        bouquet: target === "bouquet" ? "active" : "entering",
        journey: target === "journey" ? "active" : "entering",
        universe: target === "universe" ? "active" : "entering",
      });

      if (target === "universe") {
        setUniverseOpened(false);
        setShowUniverseHint(true);
        scheduleTimer(() => setUniverseOpened(true), 90);
        scheduleTimer(() => setShowUniverseHint(false), 7500);
      } else {
        setUniverseOpened(false);
      }
    },
    [clearAllTimers, scheduleTimer]
  );

  const handleReplayAll = useCallback(() => {
    jumpToStage("bouquet", true);
  }, [jumpToStage]);

  // Stage 1 -> Stage 2 transition
  const startBouquetToJourneyTransition = useCallback(() => {
    if (bouquetTransitionTriggeredRef.current) return;
    bouquetTransitionTriggeredRef.current = true;
    clearAllTimers();

    setTransition("bouquet-to-journey");
    setMountJourney(true);
    setStagePhase((prev) => ({ ...prev, journey: "entering" }));
    setVeilMode("rose-to-cosmic");

    scheduleTimer(() => {
      setStagePhase({ bouquet: "exiting", journey: "active", universe: "entering" });
      setStage("journey");
    }, 80);

    scheduleTimer(() => setVeilMode("none"), 620);

    scheduleTimer(() => {
      setMountBouquet(false);
      setTransition("none");
    }, 1100);
  }, [clearAllTimers, scheduleTimer]);

  // Stage 2 -> Stage 3 transition
  const startJourneyToUniverseTransition = useCallback(() => {
    if (universeTransitionTriggeredRef.current) return;
    universeTransitionTriggeredRef.current = true;
    clearAllTimers();

    setTransition("journey-to-universe");
    setShowPortalCta(false);
    setMountUniverse(true);
    setUniverseOpened(false);
    setShowUniverseHint(true);
    setStagePhase((prev) => ({ ...prev, universe: "entering" }));
    setVeilMode("cosmic-to-universe");

    scheduleTimer(() => {
      setStagePhase({ bouquet: "entering", journey: "exiting", universe: "active" });
      setStage("universe");
    }, 110);

    scheduleTimer(() => setUniverseOpened(true), 240);
    scheduleTimer(() => setVeilMode("none"), 740);
    scheduleTimer(() => {
      setMountJourney(false);
      setTransition("none");
    }, 1250);
    scheduleTimer(() => setShowUniverseHint(false), 8500);
  }, [clearAllTimers, scheduleTimer]);

  // Auto-demo: when Stage 3 (Universe) runs, hold for ~9.5s then loop seamlessly back to Stage 1
  useEffect(() => {
    if (!autoRunning || stage !== "universe" || transition !== "none") return;
    const t = window.setTimeout(() => {
      handleReplayAll();
    }, 9500);
    return () => window.clearTimeout(t);
  }, [autoRunning, stage, transition, handleReplayAll]);

  const baseRuntime: EffectRuntime = useMemo(
    () => ({
      instanceId: `card01-${runKey}`,
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

  const handleBouquetEmit = useCallback(
    (event: EffectEvent) => {
      if (event.type === "reveal" || event.type === "interaction") ensureAudioPlaying();
      if (event.type === "interaction" && event.name === "bouquet-burst-start") {
        scheduleTimer(() => startBouquetToJourneyTransition(), 1320);
      } else if (event.type === "complete") {
        startBouquetToJourneyTransition();
      }
    },
    [ensureAudioPlaying, scheduleTimer, startBouquetToJourneyTransition]
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
          scheduleTimer(() => startJourneyToUniverseTransition(), 2700);
        }
      }
    },
    [autoRunning, ensureAudioPlaying, scheduleTimer, startJourneyToUniverseTransition]
  );

  // Observe Stage 2 Scene 8 scroll/swipe to trigger Stage 3 manually
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
        if (remaining <= 36 && Date.now() - endingReadyTimestampRef.current > 1200) {
          e.preventDefault();
          startJourneyToUniverseTransition();
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
      if (dy > 42 && remaining <= 36 && Date.now() - endingReadyTimestampRef.current > 1200) {
        startJourneyToUniverseTransition();
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
  }, [mountJourney, journeyReachedEnding, startJourneyToUniverseTransition]);

  const bouquetScaleValue = Number.isFinite(bouquetConfig.bouquetScale)
    ? Math.max(0.65, Math.min(1.4, bouquetConfig.bouquetScale))
    : 0.7;

  return (
    <div
      className="fc-player-root"
      onPointerDown={() => {
        ensureAudioPlaying();
      }}
      onContextMenu={(e) => e.preventDefault()}
      role="region"
      aria-label="Thiệp đầu tiên"
    >
      {/* STAGE 1: Bó hoa kỷ niệm */}
      {mountBouquet && (
        <div
          className={`fc-stage-layer fc-bouquet-layer ${
            stagePhase.bouquet === "exiting"
              ? "exiting-to-journey"
              : stagePhase.bouquet === "entering"
              ? "entering"
              : "active"
          }`}
          style={{ zIndex: stage === "bouquet" ? 20 : 15, background: "#020204" }}
        >
          <ViewerErrorBoundary>
            <Canvas
              camera={{ fov: 45, position: [0, 0, 5] }}
              dpr={[1, 2]}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.8} />
                <BouquetScene
                  config={bouquetConfig}
                  runtime={baseRuntime}
                  emit={handleBouquetEmit}
                />
              </Suspense>
            </Canvas>

            <div
              className="fc-bouquet-scale-wrap"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                ["--fc-bouquet-scale" as string]: bouquetScaleValue,
              }}
            >
              <BouquetOverlay
                key={`bouquet-${runKey}-${autoRunning ? "auto" : "manual"}`}
                config={bouquetConfig}
                runtime={baseRuntime}
                emit={handleBouquetEmit}
                autoDemo={autoRunning}
              />
            </div>
          </ViewerErrorBoundary>
        </div>
      )}

      {/* STAGE 2: Hành trình sao băng 8 màn */}
      {mountJourney && (
        <div
          ref={journeyLayerRef}
          className={`fc-stage-layer ${
            stagePhase.journey === "exiting"
              ? "exiting-to-universe"
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
              key={`journey-${runKey}`}
              config={journeyConfig}
              runtime={baseRuntime}
              emit={handleJourneyEmit}
              autoDemo={autoRunning}
            />
          </ViewerErrorBoundary>

          {showPortalCta && isAtJourneyBottom && transition === "none" && (
            <div className="fc-portal-cta-wrap">
              <button
                type="button"
                className="fc-portal-cta-btn"
                onClick={startJourneyToUniverseTransition}
              >
                <Sparkles size={15} />
                <span>{portalCtaText || "Bước vào Vũ trụ yêu thương ✨"}</span>
              </button>
              <span className="fc-portal-cta-sub">
                Chạm hoặc lướt xuống thêm lần nữa để mở Vũ trụ 3D
              </span>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: Vũ trụ yêu thương 3D */}
      {mountUniverse && (
        <div
          className={`fc-stage-layer fc-universe-layer ${
            stagePhase.universe === "entering" ? "entering" : "active"
          }`}
          style={{ zIndex: stage === "universe" ? 30 : 20, background: "#061525" }}
        >
          <ViewerErrorBoundary>
            <Canvas
              camera={{ position: [0, 0, 9.2], fov: 45 }}
              dpr={[1, 2]}
              gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
              style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
            >
              <ResponsiveUniverseCamera orbitRef={orbitRef} />
              <Suspense fallback={null}>
                <LoveUniverse01
                  config={universeConfig}
                  photoUrls={photoUrls}
                  isOpened={universeOpened}
                  paused={false}
                  quality="high"
                />
              </Suspense>

              <OrbitControls
                ref={orbitRef}
                enablePan={false}
                enableDamping={true}
                dampingFactor={0.05}
                minDistance={3.5}
                maxDistance={26.0}
                makeDefault
              />
            </Canvas>
          </ViewerErrorBoundary>

          <div className="fc-universe-footer-bar">
            {showUniverseHint && (
              <span className="fc-universe-hint-pill">
                ✨ Kéo xoay 360° • Chụm / cuộn để thu phóng
              </span>
            )}
            <div className="fc-universe-footer-actions">
              <button
                type="button"
                className="fc-hud-pill"
                onClick={() => orbitRef.current?.reset()}
                title="Đặt lại góc nhìn 3D chuẩn"
              >
                <Compass size={13} />
                <span>Góc chuẩn</span>
              </button>
              <button
                type="button"
                className="fc-hud-pill"
                onClick={handleReplayAll}
                title="Xem lại từ đầu"
              >
                <RotateCcw size={13} />
                <span>Xem lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seamless Transition Veil */}
      <div
        className={`fc-transition-veil ${
          veilMode === "rose-to-cosmic"
            ? "rose-to-cosmic"
            : veilMode === "cosmic-to-universe"
            ? "cosmic-to-universe"
            : ""
        }`}
        aria-hidden="true"
      />

      {/* Floating Minimal Top HUD */}
      <div className="fc-player-hud-top">
        <div className="fc-hud-group">
          {isPreview && (
            <div className="fc-preview-stage-pills">
              {(
                [
                  { id: "bouquet", label: "1" },
                  { id: "journey", label: "2" },
                  { id: "universe", label: "3" },
                ] as { id: Card01Stage; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoRunning(false);
                    jumpToStage(item.id);
                  }}
                  className={`fc-hud-stage-dot ${stage === item.id ? "active" : ""}`}
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
                  className="fc-hud-pill fc-hud-compact"
                  title={autoRunning ? "Tạm dừng tự chạy demo" : "Bật tự chạy demo"}
                >
                  {autoRunning ? <Pause size={11} /> : <Play size={11} />}
                  <span>{autoRunning ? "Tự chạy" : "Thủ công"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="fc-hud-group">
          {musicUrl && (
            <button
              type="button"
              className="fc-hud-pill"
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
              <span className="fc-hud-text-optional">{audioMuted ? "Bật nhạc" : "Nhạc nền"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card01Player;
