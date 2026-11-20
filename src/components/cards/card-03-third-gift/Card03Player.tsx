"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import type { InvitationContent } from "@/lib/templates/schema";
import { ViewerErrorBoundary } from "@/components/cards/card-01-first-gift/ViewerErrorBoundary";
import type { EffectEvent, EffectRuntime } from "@/components/cards/card-01-first-gift/sdk";
import { buildCard03Config } from "./card03Mapper";
import {
  FlowtimeOverlay,
  type FlowtimeJumpTarget,
} from "./flowtime/FlowtimeOverlay";
import "./styles.css";

export type Card03Stage = "cover" | "story" | "confession" | "heart";

export interface Card03PlayerProps {
  content: InvitationContent;
  /** When true (demo page / demo modal), automatically advances through all 55 pages & heart panorama */
  autoDemo?: boolean;
  /** When true (editor/demo preview), shows quick stage jump pills */
  isPreview?: boolean;
  /** Optional external stage jump from editor */
  forcedStage?: Card03Stage;
}

const STAGE_TO_TARGET: Record<Card03Stage, { sectionIdx: number; pageIdx: number; overview?: boolean }> = {
  cover: { sectionIdx: 0, pageIdx: 0, overview: false },
  story: { sectionIdx: 2, pageIdx: 6, overview: false }, // Page 17: "Cho đến một ngày, tớ gặp được cậu"
  confession: { sectionIdx: 8, pageIdx: 1, overview: false }, // Page 53: "Tớ Thích Cậu"
  heart: { sectionIdx: 8, pageIdx: 3, overview: true }, // Page 55 + Heart Panorama
};

export const Card03Player: React.FC<Card03PlayerProps> = ({
  content,
  autoDemo = false,
  isPreview = false,
  forcedStage,
}) => {
  const { flowtimeConfig, photos, musicUrl } = useMemo(
    () => buildCard03Config(content),
    [content]
  );

  const [runKey, setRunKey] = useState<number>(1);
  const [autoRunning, setAutoRunning] = useState<boolean>(autoDemo);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [currentGlobalPage, setCurrentGlobalPage] = useState<number>(1);
  const [isOverview, setIsOverview] = useState<boolean>(false);
  const [forcedJump, setForcedJump] = useState<FlowtimeJumpTarget | null>(null);

  // User memory photo lightbox state
  const [albumOpen, setAlbumOpen] = useState<boolean>(false);
  const [albumIdx, setAlbumIdx] = useState<number>(0);

  // Continuous background music across all 55 pages
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(autoDemo);
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  useEffect(() => {
    setAutoRunning(autoDemo);
  }, [autoDemo]);

  // Sync external forcedStage from editor preview pills
  const prevForcedStageRef = useRef<Card03Stage | undefined>(forcedStage);
  useEffect(() => {
    if (!forcedStage || forcedStage === prevForcedStageRef.current) return;
    prevForcedStageRef.current = forcedStage;
    const target = STAGE_TO_TARGET[forcedStage];
    setForcedJump({ ...target, seq: Date.now() });
  }, [forcedStage]);

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
      audio.volume = 0.45;
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

  const handleReplayAll = useCallback(() => {
    setHasCompleted(false);
    setAlbumOpen(false);
    setRunKey((k) => k + 1);
    setForcedJump({ sectionIdx: 0, pageIdx: 0, overview: false, seq: Date.now() });
  }, []);

  const runtime = useMemo<EffectRuntime>(
    () => ({
      instanceId: `card03-${runKey}`,
      runId: `run-${runKey}`,
      quality: "high",
      reducedMotion:
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
          ? true
          : false,
      isPaused: albumOpen,
      isVisible: true,
      viewport: {
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 720,
      },
      clock: { deltaSeconds: 0.016, elapsedSeconds: 0 },
      speed: 1,
    }),
    [runKey, albumOpen]
  );

  const effectiveConfig = useMemo(
    () => ({
      ...flowtimeConfig,
      autoPlay: autoRunning,
      autoPlayIntervalSec: autoRunning ? 2.2 : flowtimeConfig.autoPlayIntervalSec,
    }),
    [flowtimeConfig, autoRunning]
  );

  const handleEmit = useCallback((event: EffectEvent) => {
    if (event.type === "complete") {
      setHasCompleted(true);
    }
  }, []);

  const handlePageStateChange = useCallback(
    (info: {
      sectionIdx: number;
      pageIdx: number;
      globalPage: number;
      isOverview: boolean;
      hasReachedEnd: boolean;
    }) => {
      setCurrentGlobalPage(info.globalPage);
      setIsOverview(info.isOverview);
      if (info.hasReachedEnd) setHasCompleted(true);
    },
    []
  );

  const handleUserInteract = useCallback(() => {
    ensureAudioPlaying();
    if (autoRunning) {
      setAutoRunning(false);
    }
  }, [ensureAudioPlaying, autoRunning]);

  const activeStageKey: Card03Stage = isOverview
    ? "heart"
    : currentGlobalPage >= 52
    ? "confession"
    : currentGlobalPage >= 17
    ? "story"
    : "cover";

  return (
    <div
      className="tc3-player-root"
      onPointerDown={ensureAudioPlaying}
      onContextMenu={(e) => e.preventDefault()}
      role="region"
      aria-label="Thiệp thứ 3 — Flowtime 55 trang"
    >
      <div className="tc3-stage-layer">
        <ViewerErrorBoundary>
          <FlowtimeOverlay
            key={`c03-flowtime-${runKey}`}
            config={effectiveConfig}
            runtime={runtime}
            emit={handleEmit}
            photos={photos}
            forcedJump={forcedJump}
            onPageStateChange={handlePageStateChange}
            onUserInteract={handleUserInteract}
            onSelectPhoto={(idx) => {
              setAlbumIdx(Math.max(0, Math.min(photos.length - 1, idx)));
              setAlbumOpen(true);
            }}
          />
        </ViewerErrorBoundary>
      </div>

      {/* Minimal Floating Top HUD */}
      <div className="tc3-player-hud-top">
        <div className="tc3-hud-group">
          {isPreview && (
            <>
              {(
                [
                  { id: "cover", label: "1" },
                  { id: "story", label: "2" },
                  { id: "confession", label: "3" },
                  { id: "heart", label: "❤" },
                ] as { id: Card03Stage; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoRunning(false);
                    setForcedJump({ ...STAGE_TO_TARGET[item.id], seq: Date.now() });
                  }}
                  className="tc3-hud-pill tc3-hud-compact"
                  style={
                    activeStageKey === item.id
                      ? { background: "#FA4A4A", borderColor: "rgba(255,255,255,0.65)" }
                      : undefined
                  }
                  title={`Xem đoạn ${item.label}`}
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
                  className="tc3-hud-pill tc3-hud-compact"
                  title={autoRunning ? "Tạm dừng tự chạy demo" : "Bật tự chạy demo"}
                >
                  {autoRunning ? <Pause size={11} /> : <Play size={11} />}
                  <span>{autoRunning ? "Tự chạy" : "Thủ công"}</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="tc3-hud-group">
          {photos.length > 0 && (
            <button
              type="button"
              className="tc3-hud-pill"
              onClick={(e) => {
                e.stopPropagation();
                ensureAudioPlaying();
                setAlbumIdx(0);
                setAlbumOpen(true);
              }}
              title="Xem album ảnh kỷ niệm"
            >
              <Images size={13} />
              <span className="tc3-hud-text-optional">Ảnh ({photos.length})</span>
            </button>
          )}

          {hasCompleted && (
            <>
              <button
                type="button"
                className="tc3-hud-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoRunning(false);
                  setForcedJump({
                    sectionIdx: 8,
                    pageIdx: 3,
                    overview: !isOverview,
                    seq: Date.now(),
                  });
                }}
                title="Xem toàn cảnh Trái Tim 55 trang"
              >
                <Heart size={13} />
                <span className="tc3-hud-text-optional">
                  {isOverview ? "Đóng trái tim" : "Trái tim"}
                </span>
              </button>

              <button
                type="button"
                className="tc3-hud-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplayAll();
                }}
                title="Xem lại từ đầu"
              >
                <RotateCcw size={13} />
                <span className="tc3-hud-text-optional">Xem lại</span>
              </button>
            </>
          )}

          {musicUrl && (
            <button
              type="button"
              className="tc3-hud-pill"
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
              <span className="tc3-hud-text-optional">{audioMuted ? "Bật nhạc" : "Nhạc nền"}</span>
            </button>
          )}
        </div>
      </div>

      {/* User Memory Photo Album Lightbox */}
      {albumOpen && photos.length > 0 && (
        <div
          className="tc3-album-modal-backdrop"
          onClick={() => setAlbumOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Album ảnh kỷ niệm"
        >
          <div className="tc3-album-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold">
                Kỷ niệm ({albumIdx + 1} / {photos.length})
              </span>
              <button
                type="button"
                onClick={() => setAlbumOpen(false)}
                className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-700"
                aria-label="Đóng album"
              >
                <X size={16} />
              </button>
            </div>

            <img
              src={photos[albumIdx]?.url}
              alt={photos[albumIdx]?.caption || `Ảnh ${albumIdx + 1}`}
              className="tc3-album-modal-img"
            />

            <p className="text-xs font-semibold text-center leading-relaxed px-2">
              {photos[albumIdx]?.caption}
            </p>

            {photos.length > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setAlbumIdx((i) => (i - 1 + photos.length) % photos.length)}
                  className="px-3 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold inline-flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumIdx((i) => (i + 1) % photos.length)}
                  className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <span>Tiếp</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Card03Player;
