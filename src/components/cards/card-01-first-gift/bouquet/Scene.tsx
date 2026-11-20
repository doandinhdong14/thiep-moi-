"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useEffectFrame, wrapRange, type EffectProps } from "../sdk";
import type { BouquetConfig } from "./config";

function createStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.25, "rgba(255, 240, 220, 0.85)");
    grad.addColorStop(0.55, "rgba(255, 215, 225, 0.35)");
    grad.addColorStop(1, "rgba(255, 200, 220, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const BouquetScene: React.FC<EffectProps<BouquetConfig>> = ({ config, runtime }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const effectiveCount = useMemo(() => {
    let base = config.starDensity;
    if (runtime.quality === "low") base = Math.round(base * 0.4);
    else if (runtime.quality === "medium") base = Math.round(base * 0.7);
    return Math.max(20, Math.min(300, base));
  }, [config.starDensity, runtime.quality]);

  const starTexture = useMemo(() => createStarTexture(), []);

  const { positions, colors, initialData } = useMemo(() => {
    const pos = new Float32Array(effectiveCount * 3);
    const col = new Float32Array(effectiveCount * 3);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#fef3c7"),
      new THREE.Color("#fbcfe8"),
      new THREE.Color("#fef08a"),
      new THREE.Color("#fed7aa"),
    ];
    const initial = [];

    for (let i = 0; i < effectiveCount; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 9;
      const z = (Math.random() - 0.5) * 6 - 1;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      initial.push({
        x,
        y,
        z,
        baseAlpha: 0.4 + Math.random() * 0.6,
        driftSpeedY: 0.15 + Math.random() * 0.25,
        driftSpeedX: (Math.random() - 0.5) * 0.05,
        twinkleSpeed: 1.5 + Math.random() * 2.5,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    return { positions: pos, colors: col, initialData: initial };
  }, [effectiveCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useEffectFrame(runtime, ({ deltaSeconds, elapsedSeconds }) => {
    if (!pointsRef.current || !config.enableStars) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const colArray = colAttr.array as Float32Array;

    const driftMult = runtime.reducedMotion ? 0 : config.starSpeed;
    const twinkleMult = runtime.reducedMotion ? 0.3 : 1.0;

    for (let i = 0; i < effectiveCount; i++) {
      const p = initialData[i];
      if (driftMult > 0 && !runtime.isPaused) {
        p.y = wrapRange(p.y + deltaSeconds * p.driftSpeedY * driftMult, -4.5, 4.5);
        p.x = wrapRange(p.x + deltaSeconds * p.driftSpeedX * driftMult, -7.0, 7.0);
        array[i * 3] = p.x;
        array[i * 3 + 1] = p.y;
      }
      if (!runtime.isPaused) {
        const twinkle = Math.sin(elapsedSeconds * p.twinkleSpeed * twinkleMult + p.twinklePhase);
        const currentAlpha = THREE.MathUtils.clamp(p.baseAlpha + twinkle * 0.3, 0.2, 1.0);
        colArray[i * 3] = colors[i * 3] * currentAlpha;
        colArray[i * 3 + 1] = colors[i * 3 + 1] * currentAlpha;
        colArray[i * 3 + 2] = colors[i * 3 + 2] * currentAlpha;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (!config.enableStars) return null;

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={runtime.quality === "low" ? 0.22 : 0.28}
          map={starTexture}
          transparent
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
