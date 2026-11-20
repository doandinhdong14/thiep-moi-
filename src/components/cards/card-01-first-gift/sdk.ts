"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

export interface MotionClock {
  deltaSeconds: number;
  elapsedSeconds: number;
}

export interface EffectRuntime {
  instanceId: string;
  runId: string;
  quality: "low" | "medium" | "high";
  reducedMotion: boolean;
  isPaused: boolean;
  isVisible: boolean;
  viewport: { width: number; height: number };
  clock: MotionClock;
  speed: number;
}

export type EffectEvent =
  | { type: "complete"; runId: string; payload?: unknown }
  | { type: "reveal"; runId: string; payload?: unknown }
  | { type: "interaction"; name: string; payload?: unknown }
  | { type: "error"; message: string; error?: unknown };

export interface EffectProps<C> {
  config: C;
  runtime: EffectRuntime;
  media?: Record<string, string>;
  emit: (event: EffectEvent) => void;
}

export interface EffectFrameCallbackInfo {
  deltaSeconds: number;
  elapsedSeconds: number;
  runId: string;
  isPaused: boolean;
  speed: number;
}

export function useEffectFrame(
  runtime: EffectRuntime,
  callback: (info: EffectFrameCallbackInfo) => void
) {
  const accumulatedTimeRef = useRef<number>(0);
  const lastRunIdRef = useRef<string>(runtime.runId);

  useEffect(() => {
    if (runtime.runId !== lastRunIdRef.current) {
      accumulatedTimeRef.current = 0;
      lastRunIdRef.current = runtime.runId;
    }
  }, [runtime.runId]);

  useFrame((_, delta) => {
    if (runtime.isPaused || !runtime.isVisible) return;
    const clampedDelta = Math.min(delta, 0.1);
    const speed =
      typeof runtime.speed === "number" && Number.isFinite(runtime.speed)
        ? runtime.speed
        : 1.0;
    const effectiveDelta = clampedDelta * speed;
    accumulatedTimeRef.current += effectiveDelta;

    callback({
      deltaSeconds: effectiveDelta,
      elapsedSeconds: accumulatedTimeRef.current,
      runId: runtime.runId,
      isPaused: runtime.isPaused,
      speed,
    });
  });
}

export function wrapRange(val: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return min;
  let normalized = (val - min) % span;
  if (normalized < 0) normalized += span;
  return min + normalized;
}

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}
