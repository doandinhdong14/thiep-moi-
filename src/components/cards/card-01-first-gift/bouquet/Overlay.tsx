"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { EffectProps } from "../sdk";
import type { BouquetConfig, BouquetPhotoItem } from "./config";

const BOUQUET_BACK_IMG = "/cards/card-01-first-gift/bouquet/bouquet_back.png";
const BOUQUET_FRONT_IMG = "/cards/card-01-first-gift/bouquet/bouquet_front.png";

export type BouquetState = "idle" | "revealing" | "ready" | "charging" | "bursting" | "finished";

interface SlotDefinition {
  slotIndex: number;
  xPct: number;
  yPct: number;
  rotationDeg: number;
  baseScale: number;
  zIndex: number;
  burstDirX: number;
  burstSpeedMult: number;
}

const BOUQUET_SLOTS: SlotDefinition[] = [
  { slotIndex: 0, xPct: 23, yPct: 13, rotationDeg: -8, baseScale: 1.0, zIndex: 4, burstDirX: -0.95, burstSpeedMult: 0.95 },
  { slotIndex: 1, xPct: 50, yPct: 8, rotationDeg: 1, baseScale: 1.05, zIndex: 5, burstDirX: -0.05, burstSpeedMult: 1.15 },
  { slotIndex: 2, xPct: 77, yPct: 14, rotationDeg: 8, baseScale: 1.0, zIndex: 4, burstDirX: 0.95, burstSpeedMult: 0.95 },
  { slotIndex: 3, xPct: 24, yPct: 33, rotationDeg: -13, baseScale: 0.98, zIndex: 4, burstDirX: -0.75, burstSpeedMult: 0.9 },
  { slotIndex: 4, xPct: 50, yPct: 38, rotationDeg: 0, baseScale: 1.08, zIndex: 5, burstDirX: 0.08, burstSpeedMult: 1.05 },
  { slotIndex: 5, xPct: 76, yPct: 33, rotationDeg: 11, baseScale: 0.98, zIndex: 4, burstDirX: 0.75, burstSpeedMult: 0.9 },
];

function getSlotsForCount(count: number): SlotDefinition[] {
  switch (count) {
    case 1:
      return [BOUQUET_SLOTS[4]];
    case 2:
      return [BOUQUET_SLOTS[3], BOUQUET_SLOTS[5]];
    case 3:
      return [BOUQUET_SLOTS[3], BOUQUET_SLOTS[4], BOUQUET_SLOTS[5]];
    case 4:
      return [BOUQUET_SLOTS[0], BOUQUET_SLOTS[2], BOUQUET_SLOTS[3], BOUQUET_SLOTS[5]];
    case 5:
      return [BOUQUET_SLOTS[0], BOUQUET_SLOTS[1], BOUQUET_SLOTS[2], BOUQUET_SLOTS[3], BOUQUET_SLOTS[5]];
    case 6:
    default:
      return BOUQUET_SLOTS;
  }
}

export interface BouquetOverlayProps extends EffectProps<BouquetConfig> {
  autoDemo?: boolean;
}

export const BouquetOverlay: React.FC<BouquetOverlayProps> = ({
  config,
  runtime,
  emit,
  autoDemo = false,
}) => {
  const [state, setState] = useState<BouquetState>("idle");
  const [chargeProgress, setChargeProgress] = useState<number>(0);

  const bouquetContainerRef = useRef<HTMLDivElement>(null);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef<BouquetState>("idle");
  stateRef.current = state;

  const chargeStartTimeRef = useRef<number | null>(null);
  const drainStartTimeRef = useRef<number | null>(null);
  const drainStartProgressRef = useRef<number>(0);
  const burstStartTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const activePhotos = useMemo(() => {
    return config.photos && config.photos.length > 0 ? config.photos.slice(0, 6) : [];
  }, [config.photos]);

  const slots = useMemo(() => getSlotsForCount(activePhotos.length), [activePhotos.length]);

  const applySlotTransform = useCallback(
    (el: HTMLDivElement, slot: SlotDefinition, photo: BouquetPhotoItem, liftPx = 0) => {
      const rot = slot.rotationDeg + (photo.customRotation ?? 0);
      const scale = slot.baseScale * (photo.customScale ?? 1.0);
      el.style.transform = `translate(-50%, -50%) translate(0px, ${liftPx}px) rotate(${rot}deg) scale(${scale})`;
      el.style.opacity = "1";
      el.style.zIndex = `${slot.zIndex}`;
    },
    []
  );

  const triggerReveal = useCallback(() => {
    if (stateRef.current !== "idle") return;
    stateRef.current = "revealing";
    setState("revealing");
    emit({
      type: "reveal",
      runId: runtime.runId,
      payload: { timestamp: Date.now() },
    });

    slots.forEach((slot, index) => {
      const el = photoRefs.current[index];
      const photo = activePhotos[index];
      if (!el || !photo) return;
      el.style.transition = `transform 0.75s cubic-bezier(0.2, 0.9, 0.3, 1) ${index * 0.065}s, opacity 0.5s ease-out ${index * 0.065}s`;
      applySlotTransform(el, slot, photo);
    });

    window.setTimeout(() => {
      if (stateRef.current === "revealing") {
        stateRef.current = "ready";
        setState("ready");
      }
    }, 900);
  }, [activePhotos, applySlotTransform, emit, runtime.runId, slots]);

  const triggerBurst = useCallback(() => {
    stateRef.current = "bursting";
    setState("bursting");
    burstStartTimeRef.current = performance.now();
    chargeStartTimeRef.current = null;
    drainStartTimeRef.current = null;

    emit({
      type: "interaction",
      name: "bouquet-burst-start",
      payload: { photoCount: activePhotos.length },
    });
  }, [activePhotos.length, emit]);

  // Auto-run demo choreography for Stage 1 (Bouquet reveal -> auto charge -> burst)
  useEffect(() => {
    if (!autoDemo) return;
    const t1 = window.setTimeout(() => {
      if (stateRef.current === "idle") {
        triggerReveal();
      }
    }, 950);

    const t2 = window.setTimeout(() => {
      if (stateRef.current === "ready") {
        drainStartTimeRef.current = null;
        chargeStartTimeRef.current = performance.now();
        stateRef.current = "charging";
        setState("charging");
      }
    }, 2650);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [autoDemo, runtime.runId, triggerReveal]);

  useEffect(() => {
    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const currentState = stateRef.current;

      if (currentState === "charging" && chargeStartTimeRef.current !== null) {
        if (!runtime.isPaused) {
          const elapsed = (now - chargeStartTimeRef.current) / 1000;
          const targetHold = autoDemo ? Math.min(1.4, Math.max(0.8, config.holdDuration)) : Math.max(0.6, config.holdDuration);
          const p = Math.min(1.0, elapsed / targetHold);
          setChargeProgress(p);

          const liftY = -2 - p * 4;
          slots.forEach((slot, index) => {
            const el = photoRefs.current[index];
            const photo = activePhotos[index];
            if (el && photo) applySlotTransform(el, slot, photo, liftY);
          });

          if (p >= 1.0) {
            triggerBurst();
            return;
          }
        }
      }

      if (drainStartTimeRef.current !== null && currentState === "ready") {
        const drainElapsed = (now - drainStartTimeRef.current) / 1000;
        const factor = Math.min(1.0, drainElapsed / 0.2);
        const remaining = drainStartProgressRef.current * (1 - factor);
        setChargeProgress(remaining);

        const liftY = -remaining * 4;
        slots.forEach((slot, index) => {
          const el = photoRefs.current[index];
          const photo = activePhotos[index];
          if (el && photo) applySlotTransform(el, slot, photo, liftY);
        });

        if (factor >= 1.0) {
          drainStartTimeRef.current = null;
          setChargeProgress(0);
        }
      }

      if (currentState === "bursting" && burstStartTimeRef.current !== null) {
        const t = (now - burstStartTimeRef.current) / 1000;
        const burstSpeed = config.burstSpeed ?? 1.0;
        const burstSpread = config.burstSpread ?? 1.0;
        const burstRot = config.burstRotation ?? 1.0;
        const isReducedMotion = runtime.reducedMotion;

        slots.forEach((slot, index) => {
          const el = photoRefs.current[index];
          const photo = activePhotos[index];
          if (!el || !photo) return;

          el.style.transition = "none";
          el.style.zIndex = "50";

          if (isReducedMotion) {
            const liftY = -Math.min(50, t * 30);
            const op = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.8) : 1.0;
            const rot = slot.rotationDeg + (photo.customRotation ?? 0);
            el.style.transform = `translate(-50%, -50%) translate(0px, ${liftY}px) rotate(${rot}deg) scale(${slot.baseScale})`;
            el.style.opacity = `${op}`;
            return;
          }

          const vy0 = -260 * burstSpeed * slot.burstSpeedMult;
          const currentY = vy0 * t + 0.5 * 70 * t * t;
          const vx0 = slot.burstDirX * 180 * burstSpread;
          const currentX = vx0 * t * (1 - Math.min(0.3, 0.1 * t));
          const rotSpeed = slot.burstDirX * 26 * burstRot;
          const currentRot = slot.rotationDeg + (photo.customRotation ?? 0) + rotSpeed * t;
          const popScale = 1.0 + 0.18 * Math.sin(Math.min(Math.PI, t * 1.5));
          const totalScale = popScale * slot.baseScale * (photo.customScale ?? 1.0);
          const currentOpacity = t > 1.2 ? Math.max(0, 1.0 - (t - 1.2) / 0.7) : 1.0;

          el.style.transform = `translate(-50%, -50%) translate(${currentX}px, ${currentY}px) rotate(${currentRot}deg) scale(${totalScale})`;
          el.style.opacity = `${currentOpacity}`;
        });

        if (t >= 1.9) {
          stateRef.current = "finished";
          setState("finished");
          burstStartTimeRef.current = null;
          slots.forEach((_, idx) => {
            if (photoRefs.current[idx]) photoRefs.current[idx]!.style.opacity = "0";
          });
          emit({
            type: "complete",
            runId: runtime.runId,
            payload: { timestamp: Date.now() },
          });
          return;
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    autoDemo,
    config.holdDuration,
    config.burstSpeed,
    config.burstSpread,
    config.burstRotation,
    runtime.isPaused,
    runtime.reducedMotion,
    runtime.runId,
    slots,
    activePhotos,
    applySlotTransform,
    triggerBurst,
    emit,
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (stateRef.current === "idle") {
      triggerReveal();
      return;
    }
    if (stateRef.current === "ready") {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
      drainStartTimeRef.current = null;
      chargeStartTimeRef.current = performance.now();
      stateRef.current = "charging";
      setState("charging");
      emit({ type: "interaction", name: "bouquet-charge-start" });
    }
  };

  const handlePointerUpOrCancel = () => {
    if (stateRef.current === "charging" && !autoDemo) {
      drainStartProgressRef.current = chargeProgress;
      drainStartTimeRef.current = performance.now();
      chargeStartTimeRef.current = null;
      stateRef.current = "ready";
      setState("ready");
      emit({
        type: "interaction",
        name: "bouquet-charge-cancelled",
        payload: { progress: chargeProgress },
      });
    }
  };

  const squashTransform = useMemo(() => {
    if (state === "charging") {
      const compression = Math.min(0.025, chargeProgress * 0.025);
      return `scale(${1 + compression * 0.5}, ${1 - compression})`;
    }
    return "scale(1, 1)";
  }, [state, chargeProgress]);

  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference * (1 - chargeProgress);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        overflow: "visible",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={bouquetContainerRef}
        style={{
          position: "relative",
          width: "clamp(220px, 60%, 340px)",
          maxWidth: "82%",
          maxHeight: "56%",
          aspectRatio: "470 / 550",
          cursor:
            state === "idle" || state === "ready"
              ? "pointer"
              : state === "charging"
              ? "grabbing"
              : "default",
          transform: squashTransform,
          transition:
            state === "charging"
              ? "transform 0.08s ease-out"
              : "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
      >
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "5%",
            width: "90%",
            height: "90%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(244, 114, 182, 0.24) 0%, rgba(244, 114, 182, 0.08) 50%, transparent 75%)",
            opacity: config.glowIntensity ?? 1.0,
            pointerEvents: "none",
            zIndex: 1,
            filter: "blur(16px)",
          }}
        />

        <img
          src={BOUQUET_BACK_IMG}
          alt="Bó hoa kỷ niệm"
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: state === "bursting" ? 50 : 3,
            overflow: "visible",
          }}
        >
          {activePhotos.map((photo, index) => {
            const slot = slots[index] || BOUQUET_SLOTS[0];
            return (
              <div
                key={photo.id || index}
                ref={(el) => {
                  photoRefs.current[index] = el;
                }}
                style={{
                  position: "absolute",
                  left: `${slot.xPct}%`,
                  top: `${slot.yPct}%`,
                  width: "24%",
                  height: "28%",
                  transform: `translate(-50%, -50%) translate(0px, 35px) rotate(${slot.rotationDeg}deg) scale(0.6)`,
                  opacity: 0,
                  zIndex: slot.zIndex,
                  transformOrigin: "bottom center",
                  borderRadius: "14px",
                  boxShadow:
                    "0 6px 18px rgba(0, 0, 0, 0.45), 0 0 10px rgba(251, 207, 232, 0.25)",
                  overflow: "hidden",
                  background: "#ffffff",
                  border: "1.5px solid rgba(255, 255, 255, 0.85)",
                  willChange: "transform, opacity",
                }}
              >
                <img
                  src={photo.url}
                  alt={`Kỷ niệm ${index + 1}`}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${photo.cropX ?? 50}% ${photo.cropY ?? 50}%`,
                    display: "block",
                  }}
                />
              </div>
            );
          })}
        </div>

        <img
          src={BOUQUET_FRONT_IMG}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        {(state === "charging" || (state === "ready" && chargeProgress > 0)) && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "73%",
              transform: "translate(-50%, -50%)",
              width: "88px",
              height: "88px",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              style={{ transform: "rotate(-90deg)", overflow: "visible" }}
            >
              <circle
                cx="44"
                cy="44"
                r={ringRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="3.5"
              />
              <circle
                cx="44"
                cy="44"
                r={ringRadius}
                fill="none"
                stroke={config.ringColor || "#f472b6"}
                strokeWidth="4"
                strokeDasharray={ringCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 6px ${config.ringColor || "#f472b6"}) drop-shadow(0 0 12px rgba(255,255,255,0.7))`,
                }}
              />
            </svg>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          minHeight: "44px",
          width: "max-content",
          maxWidth: "calc(100% - 28px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          pointerEvents: "auto",
        }}
      >
        {state === "idle" && (
          <div
            onClick={triggerReveal}
            style={{
              color: "rgba(255, 255, 255, 0.92)",
              fontSize: "clamp(0.76rem, 2.8vw, 0.92rem)",
              fontWeight: 500,
              letterSpacing: "0.03em",
              textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(244,114,182,0.4)",
              cursor: "pointer",
              padding: "7px 16px",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              textAlign: "center",
            }}
          >
            {config.guideTextIdle || "Chạm nhẹ vào bó hoa tớ lén chuẩn bị cho cậu nha"}
          </div>
        )}

        {(state === "ready" || state === "charging") && (
          <div
            style={{
              color: state === "charging" ? "#fbcfe8" : "rgba(255, 255, 255, 0.88)",
              fontSize: "clamp(0.76rem, 2.8vw, 0.9rem)",
              fontWeight: 500,
              letterSpacing: "0.03em",
              textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(244,114,182,0.4)",
              padding: "7px 16px",
              borderRadius: "20px",
              background:
                state === "charging"
                  ? "rgba(244, 114, 182, 0.18)"
                  : "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(8px)",
              border:
                state === "charging"
                  ? "1px solid rgba(244, 114, 182, 0.45)"
                  : "1px solid rgba(255, 255, 255, 0.15)",
              transition: "all 0.2s ease-out",
              textAlign: "center",
            }}
          >
            {config.guideTextReady || "Giữ tay ở bó hoa để mở bí mật của tớ nhé"}
          </div>
        )}
      </div>
    </div>
  );
};
