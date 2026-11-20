"use client";

import React, { useEffect, useRef } from "react";
import type { EffectRuntime } from "../sdk";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
  glow: boolean;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  opacity: number;
  life: number;
  maxLife: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 8,
      g: parseInt(clean[1] + clean[1], 16) || 13,
      b: parseInt(clean[2] + clean[2], 16) || 26,
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16) || 8,
      g: parseInt(clean.slice(2, 4), 16) || 13,
      b: parseInt(clean.slice(4, 6), 16) || 26,
    };
  }
  return { r: 8, g: 13, b: 26 };
}

export interface CosmicBackgroundProps {
  backgroundColor: string;
  accentColor: string;
  starCount: number;
  meteorFrequency: number;
  runtime: EffectRuntime;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  backgroundColor,
  accentColor,
  starCount,
  meteorFrequency,
  runtime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(runtime.isPaused);
  const speedRef = useRef(runtime.speed || 1);
  const reducedMotionRef = useRef(runtime.reducedMotion);
  const bgColorRef = useRef(backgroundColor);
  const accentColorRef = useRef(accentColor);
  const meteorFreqRef = useRef(meteorFrequency);

  pausedRef.current = runtime.isPaused;
  speedRef.current = runtime.speed || 1;
  reducedMotionRef.current = runtime.reducedMotion;
  bgColorRef.current = backgroundColor;
  accentColorRef.current = accentColor;
  meteorFreqRef.current = meteorFrequency;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    let animId = 0;
    let t = 0;
    const stars: Star[] = [];
    const meteors: Meteor[] = [];
    let nextMeteor = 180 + Math.random() * 240;

    const updateSize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || canvas.clientWidth || 800;
      const h = parent?.clientHeight || canvas.clientHeight || 600;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener("resize", updateSize);

    const count = Math.max(20, Math.min(600, starCount));
    for (let i = 0; i < count; i++) {
      const big = Math.random() < 0.18;
      const glow = big && Math.random() < 0.5;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: big ? Math.random() * 1.6 + 1.0 : Math.random() * 0.9 + 0.15,
        opacity: big ? Math.random() * 0.55 + 0.25 : Math.random() * 0.35 + 0.08,
        twinkleSpeed: Math.random() * 0.012 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.000035,
        driftY: (Math.random() - 0.5) * 0.000035,
        glow,
      });
    }

    const spawnMeteor = () => {
      const angle = (Math.random() * 30 + 15) * (Math.PI / 180);
      const speed = 8 + Math.random() * 6;
      meteors.push({
        x: Math.random() * 0.7 + 0.05,
        y: Math.random() * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 90 + Math.random() * 120,
        opacity: 0.65 + Math.random() * 0.3,
        life: 0,
        maxLife: 55 + Math.random() * 30,
      });
    };

    const draw = () => {
      if (!ctx) return;
      const spd = pausedRef.current ? 0 : reducedMotionRef.current ? 0.25 : speedRef.current;
      t += spd;

      const cw = canvas.width || 800;
      const ch = canvas.height || 600;
      ctx.clearRect(0, 0, cw, ch);

      const screenScale = Math.min(
        1.0,
        Math.max(
          0.55,
          cw <= 390 ? 0.55 : cw >= 1200 ? 1.0 : 0.55 + ((cw - 390) / (1200 - 390)) * 0.45
        )
      );
      const centerDimBase = 0.42 - (1 - screenScale) * 0.1;

      const bgRgb = hexToRgb(bgColorRef.current || "#080d1a");
      const acRgb = hexToRgb(accentColorRef.current || "#a08cff");

      const grad = ctx.createRadialGradient(cw * 0.5, ch * 0.3, 0, cw * 0.5, ch * 0.5, cw * 0.9);
      grad.addColorStop(
        0,
        `rgb(${Math.min(255, bgRgb.r + 12)}, ${Math.min(255, bgRgb.g + 15)}, ${Math.min(255, bgRgb.b + 40)})`
      );
      grad.addColorStop(0.5, `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`);
      grad.addColorStop(
        1,
        `rgb(${Math.max(0, bgRgb.r - 3)}, ${Math.max(0, bgRgb.g - 4)}, ${Math.max(0, bgRgb.b - 6)})`
      );
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      const breathe = (Math.sin(t * 0.006) * 0.015 + 0.04) * screenScale;
      const haloData = [
        { cx: 0.22, cy: 0.28, r: 0.32, c: `rgba(70,95,210,${breathe})` },
        { cx: 0.8, cy: 0.62, r: 0.28, c: `rgba(${acRgb.r},${acRgb.g},${acRgb.b},${breathe * 0.9})` },
        { cx: 0.55, cy: 0.75, r: 0.24, c: `rgba(40,130,195,${breathe * 0.75})` },
        { cx: 0.85, cy: 0.18, r: 0.22, c: `rgba(50,100,200,${breathe * 0.6})` },
      ];
      for (const h of haloData) {
        const halo = ctx.createRadialGradient(cw * h.cx, ch * h.cy, 0, cw * h.cx, ch * h.cy, cw * h.r);
        halo.addColorStop(0, h.c);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, cw, ch);
      }

      for (const s of stars) {
        s.x += s.driftX * spd;
        s.y += s.driftY * spd;
        if (s.x < 0) s.x = 1;
        if (s.x > 1) s.x = 0;
        if (s.y < 0) s.y = 1;
        if (s.y > 1) s.y = 0;

        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.18;
        const dx = Math.abs(s.x - 0.5) / 0.5;
        const dy = Math.abs(s.y - 0.5) / 0.5;
        const edgeFactor = Math.min(1, (dx * 0.6 + dy * 0.4) * 1.4);
        const centerDim = centerDimBase + edgeFactor * (1 - centerDimBase);
        const op = Math.max(0, Math.min(1, (s.opacity + twinkle) * centerDim * screenScale));
        const px = s.x * cw;
        const py = s.y * ch;
        const sr = s.r * (0.7 + screenScale * 0.3);

        if (s.glow) {
          const glowRadius = sr * (3.5 + screenScale * 1.0);
          const grd = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
          grd.addColorStop(0, `rgba(200,215,255,${op * 0.45 * screenScale})`);
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,230,255,${op})`;
        ctx.fill();
      }

      const freq = Math.max(0, meteorFreqRef.current);
      if (freq > 0 && spd > 0) {
        nextMeteor -= spd * freq;
        if (nextMeteor <= 0) {
          spawnMeteor();
          nextMeteor = (260 + Math.random() * 380) / screenScale;
        }
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += spd;
        const progress = m.life / m.maxLife;
        const fade =
          progress < 0.15 ? progress / 0.15 : progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
        const op = Math.max(0, m.opacity * fade * screenScale);
        const sx = m.x * cw;
        const sy = m.y * ch;
        m.x += (m.vx * spd) / cw;
        m.y += (m.vy * spd) / ch;
        const ex = m.x * cw;
        const ey = m.y * ch;
        const mLen = m.len * (0.6 + screenScale * 0.4);
        const tailX = sx - (m.vx / cw) * mLen;
        const tailY = sy - (m.vy / ch) * mLen;
        const mg = ctx.createLinearGradient(tailX, tailY, ex, ey);
        mg.addColorStop(0, "rgba(255,255,255,0)");
        mg.addColorStop(0.6, `rgba(200,215,255,${op * 0.45})`);
        mg.addColorStop(1, `rgba(255,255,255,${op})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = mg;
        ctx.lineWidth = 1.4 * (0.7 + screenScale * 0.3);
        ctx.stroke();
        if (m.life >= m.maxLife) meteors.splice(i, 1);
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      className="cbj-cosmic-canvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};
