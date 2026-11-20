"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { EffectProps } from "../../card-01-first-gift/sdk";
import { MAX_STARS, MAX_WISH_LENGTH, type SkyLantern3DFireworksConfig } from "./config";

const SL3D_STYLES = `
.sl3d-root {
  --text-primary: #f1f5ff;
  --text-secondary: #98a4c7;
  --accent-gold: #ffaa44;

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #040712;
  color: var(--text-primary);
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
  user-select: none;
  -webkit-user-select: none;
}

.sl3d-root *,
.sl3d-root *::before,
.sl3d-root *::after {
  box-sizing: border-box;
}

.sl3d-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  touch-action: none;
}

.sl3d-sky-hint {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  font-size: clamp(11px, 1.8vw, 14px);
  font-weight: 500;
  letter-spacing: 0.35px;
  color: rgba(215, 224, 255, 0.72);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
  white-space: nowrap;
  max-width: 92%;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 5;
}

.sl3d-sky-hud {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: none;
  z-index: 5;
}

.sl3d-sky-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(12, 17, 34, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 11px;
  color: var(--text-secondary);
}

.sl3d-sky-stats strong {
  color: var(--accent-gold);
  font-weight: 600;
}

.sl3d-sky-stats .sl3d-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
}

.sl3d-hud-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
}

.sl3d-hud-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 20, 38, 0.74);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #e6ecff;
  border-radius: 999px;
  padding: 6px 11px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease;
}

.sl3d-hud-btn:hover {
  background: rgba(36, 48, 86, 0.85);
}

.sl3d-hud-btn:active {
  transform: scale(0.96);
}

.sl3d-hud-btn.primary {
  background: linear-gradient(135deg, rgba(91, 140, 255, 0.85), rgba(138, 123, 255, 0.85));
  border-color: rgba(160, 184, 255, 0.4);
  color: #ffffff;
}

.sl3d-fallback-banner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 45%, #111b3a 0%, #040712 85%);
  color: #d7e0ff;
  z-index: 4;
}

@media (max-width: 640px) {
  .sl3d-sky-hud {
    justify-content: center;
    bottom: 10px;
    left: 10px;
    right: 10px;
  }
  .sl3d-sky-stats {
    font-size: 10.5px;
    padding: 5px 9px;
    gap: 6px;
  }
}
`;

const BASE_LANTERN_SCALE = 3.25;

function normalizeWishText(raw: string): string {
  return (raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_WISH_LENGTH);
}

function fitTextInBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxH: number,
  fontFamily: string
): { lines: string[]; fontSize: number; lineHeight: number } {
  if (!text) return { lines: [], fontSize: 28, lineHeight: 34 };
  const paragraphs = text.split("\n");

  const wrapAtFontSize = (size: number): string[] => {
    ctx.font = `700 ${size}px ${fontFamily}`;
    const lines: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      const words = trimmed.split(" ");
      let currentLine = "";

      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxW) {
          currentLine = candidate;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = "";
          }
          if (ctx.measureText(word).width > maxW) {
            let chunk = "";
            for (const ch of word) {
              if (ctx.measureText(chunk + ch).width <= maxW) {
                chunk += ch;
              } else {
                if (chunk) lines.push(chunk);
                chunk = ch;
              }
            }
            currentLine = chunk;
          } else {
            currentLine = word;
          }
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  for (let fontSize = 104; fontSize >= 28; fontSize -= 2) {
    const lines = wrapAtFontSize(fontSize);
    const lineHeight = fontSize * 1.24;
    const totalHeight = lines.length * lineHeight;
    let widest = 0;
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    for (const line of lines) {
      widest = Math.max(widest, ctx.measureText(line).width);
    }
    if (totalHeight <= maxH && widest <= maxW && lines.length <= 5) {
      return { lines, fontSize, lineHeight };
    }
  }

  const fallbackSize = 22;
  return {
    lines: wrapAtFontSize(fallbackSize).slice(0, 6),
    fontSize: fallbackSize,
    lineHeight: fallbackSize * 1.22,
  };
}

function buildLanternGeometry(): THREE.BufferGeometry {
  const height = 2.75;
  const maxRadius = 0.96;
  const radialSegs = 44;
  const heightSegs = 28;

  function profileAt(t: number): { x: number; y: number } {
    let y: number;
    let r: number;
    if (t < 0.08) {
      const k = t / 0.08;
      const angle = (1 - k) * (Math.PI * 0.36);
      y = t * height;
      r = 0.72 + (0.87 - 0.72) * Math.cos(angle);
    } else if (t <= 0.64) {
      const k = (t - 0.08) / (0.64 - 0.08);
      y = t * height;
      r = 0.87 + (maxRadius - 0.87) * Math.sin(k * Math.PI * 0.5);
    } else {
      const k = (t - 0.64) / (1.0 - 0.64);
      const angle = k * (Math.PI * 0.5);
      y = (0.64 + 0.36 * Math.sin(angle)) * height;
      r = maxRadius * Math.cos(angle);
    }
    return { x: r, y: y - height * 0.45 };
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= heightSegs; row++) {
    const t = row / heightSegs;
    const pt = profileAt(t);
    for (let col = 0; col <= radialSegs; col++) {
      const u = col / radialSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      positions.push(pt.x * Math.sin(theta), pt.y, pt.x * Math.cos(theta));
      uvs.push(u, t);
    }
  }

  const stride = radialSegs + 1;
  for (let row = 0; row < heightSegs; row++) {
    for (let col = 0; col < radialSegs; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function createRadialGlowTexture(size: number, stops: Array<[number, string]>): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (g) {
    const half = size / 2;
    const grad = g.createRadialGradient(half, half, 0, half, half, half);
    for (const [offset, color] of stops) {
      grad.addColorStop(offset, color);
    }
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface ActiveLantern {
  group: THREE.Group;
  bodyMat: THREE.MeshBasicMaterial;
  flameSprite: THREE.Sprite;
  haloSprite: THREE.Sprite;
  hexColor: string;
  baseScale: number;
  age: number;
  peakY: number;
  vx: number;
  vz: number;
  baseSpeed: number;
  swayPhase: number;
  swaySpeed: number;
}

interface FireworkParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  history: THREE.Vector3[];
  color: THREE.Color;
  hotColor: THREE.Color;
  maxLife: number;
  life: number;
  twinklePhase: number;
  canCrackle: boolean;
}

interface ActiveFirework {
  origin: THREE.Vector3;
  pattern: string;
  particles: FireworkParticle[];
  trailSegments: number;
  flashSprite: THREE.Sprite;
  flashMat: THREE.SpriteMaterial;
  trailMesh: THREE.LineSegments;
  lineGeo: THREE.BufferGeometry;
  lineMat: THREE.LineBasicMaterial;
  linePositions: Float32Array;
  lineColors: Float32Array;
  headPoints: THREE.Points;
  headGeo: THREE.BufferGeometry;
  headMat: THREE.PointsMaterial;
  headPositions: Float32Array;
  headColors: Float32Array;
  age: number;
  drag: number;
  gravity: number;
}

export interface LanternOverlayProps extends EffectProps<SkyLantern3DFireworksConfig> {
  autoDemo?: boolean;
}

export const LanternOverlay: React.FC<LanternOverlayProps> = ({
  config,
  runtime,
  emit,
  autoDemo = false,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [sequenceIndex, setSequenceIndex] = useState<number>(
    Math.max(0, Math.min(4, (Number(config.sequenceStartIndex) || 1) - 1))
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [totalLaunched, setTotalLaunched] = useState<number>(0);
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(false);

  const effectiveColor =
    config.colorPreset && config.colorPreset !== "custom" ? config.colorPreset : config.lanternColor;

  useEffect(() => {
    const idx = Math.max(0, Math.min(4, (Number(config.sequenceStartIndex) || 1) - 1));
    setSequenceIndex(idx);
  }, [config.sequenceStartIndex]);

  const liveRef = useRef({
    mode: config.mode,
    wishText: config.wishText,
    lanternColor: effectiveColor,
    sizeMultiplier: config.sizeMultiplier,
    starCount: config.starCount,
    speedMultiplier: config.speedMultiplier,
    soundEnabled: config.soundEnabled,
    sequenceItems: config.sequenceItems,
    sequenceIndex,
    isPaused: runtime.isPaused,
    runtimeSpeed: runtime.speed,
    runId: runtime.runId,
  });

  liveRef.current.mode = config.mode;
  liveRef.current.wishText = config.wishText;
  liveRef.current.lanternColor = effectiveColor;
  liveRef.current.sizeMultiplier = config.sizeMultiplier;
  liveRef.current.starCount = config.starCount;
  liveRef.current.speedMultiplier = config.speedMultiplier;
  liveRef.current.soundEnabled = config.soundEnabled;
  liveRef.current.sequenceItems = config.sequenceItems;
  liveRef.current.sequenceIndex = sequenceIndex;
  liveRef.current.isPaused = runtime.isPaused;
  liveRef.current.runtimeSpeed = runtime.speed;
  liveRef.current.runId = runtime.runId;

  const actionsRef = useRef<{
    spawnRandomLantern: () => void;
    clearAll: () => void;
    updateStarDrawRange: (count: number) => void;
    updateActiveScale: (sz: number) => void;
    launchStarters: () => void;
  } | null>(null);

  const emitRef = useRef(emit);
  emitRef.current = emit;
  const completionEmittedRef = useRef<boolean>(false);

  useEffect(() => {
    actionsRef.current?.updateStarDrawRange(config.starCount);
  }, [config.starCount]);

  useEffect(() => {
    actionsRef.current?.updateActiveScale(config.sizeMultiplier);
  }, [config.sizeMultiplier]);

  // Auto-demo or optional periodic lantern release
  useEffect(() => {
    if (runtime.isPaused) return;
    const intervalSec = autoDemo ? 2.1 : Number(config.autoLaunchIntervalSec) || 0;
    if (intervalSec <= 0) return;

    let initialTimer: number | undefined;
    if (autoDemo) {
      initialTimer = window.setTimeout(() => {
        actionsRef.current?.spawnRandomLantern();
      }, 350);
    }

    const ms = Math.max(500, intervalSec * 1000);
    const timer = window.setInterval(() => {
      actionsRef.current?.spawnRandomLantern();
    }, ms);

    return () => {
      if (initialTimer !== undefined) window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [config.autoLaunchIntervalSec, runtime.isPaused, autoDemo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = rootRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: runtime.quality !== "low",
        powerPreference: runtime.quality === "low" ? "low-power" : "high-performance",
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    setWebglUnavailable(false);

    const getDims = () => {
      const w = container.clientWidth || window.innerWidth || 960;
      const h = container.clientHeight || window.innerHeight || 600;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    };

    const initDims = getDims();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initDims.w, initDims.h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050917, 0.0042);

    const camera = new THREE.PerspectiveCamera(52, initDims.w / initDims.h, 0.5, 400);
    const camControl = {
      yaw: 0,
      pitch: 0.08,
      targetYaw: 0,
      targetPitch: 0.08,
      distance: 28,
      targetDistance: 28,
    };

    const updateCameraTransform = () => {
      const targetY = 3.5;
      const cosP = Math.cos(camControl.pitch);
      camera.position.set(
        Math.sin(camControl.yaw) * cosP * camControl.distance,
        targetY - Math.sin(camControl.pitch) * camControl.distance,
        Math.cos(camControl.yaw) * cosP * camControl.distance
      );
      camera.lookAt(0, targetY + 2.2, -16);
    };
    updateCameraTransform();

    // Sky Dome Shader
    const skyGeo = new THREE.SphereGeometry(240, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x040712) },
        uMidColor: { value: new THREE.Color(0x0a1126) },
        uHorizonColor: { value: new THREE.Color(0x131e3d) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          float t1 = smoothstep(-0.35, 0.15, h);
          float t2 = smoothstep(0.08, 0.85, h);
          vec3 col = mix(uHorizonColor, uMidColor, t1);
          col = mix(col, uTopColor, t2);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Twinkling Starfield
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(MAX_STARS * 3);
    const starColors = new Float32Array(MAX_STARS * 3);
    const starSizes = new Float32Array(MAX_STARS);
    const starPhases = new Float32Array(MAX_STARS);

    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xdbe8ff),
      new THREE.Color(0xffe9c7),
      new THREE.Color(0xb9d2ff),
      new THREE.Color(0xfff4e0),
    ];

    for (let i = 0; i < MAX_STARS; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const radius = 55 + Math.random() * 145;

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi) + 8;
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 10;

      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      const brightness = 0.55 + Math.random() * 0.45;
      starColors[i * 3] = c.r * brightness;
      starColors[i * 3 + 1] = c.g * brightness;
      starColors[i * 3 + 2] = c.b * brightness;

      starSizes[i] = Math.random() < 0.86 ? 0.9 + Math.random() * 1.4 : 2.2 + Math.random() * 1.7;
      starPhases[i] = Math.random() * Math.PI * 2;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("aColor", new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute("aPhase", new THREE.BufferAttribute(starPhases, 1));
    starGeo.setDrawRange(0, liveRef.current.starCount);

    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = 0.55 + 0.45 * sin(uTime * (1.1 + fract(aPhase) * 2.2) + aPhase * 6.2831);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (110.0 / max(-mvPosition.z, 10.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, core * vAlpha);
        }
      `,
    });

    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const flameCoreTex = createRadialGlowTexture(128, [
      [0.0, "rgba(255, 255, 255, 1.0)"],
      [0.2, "rgba(255, 245, 200, 0.95)"],
      [0.48, "rgba(255, 175, 65, 0.45)"],
      [1.0, "rgba(255, 120, 20, 0.0)"],
    ]);
    const outerHaloTex = createRadialGlowTexture(256, [
      [0.0, "rgba(255, 255, 255, 0.48)"],
      [0.35, "rgba(255, 255, 255, 0.18)"],
      [0.7, "rgba(255, 255, 255, 0.05)"],
      [1.0, "rgba(255, 255, 255, 0.0)"],
    ]);
    const sparkPointTex = createRadialGlowTexture(64, [
      [0.0, "rgba(255, 255, 255, 1.0)"],
      [0.3, "rgba(255, 255, 255, 0.75)"],
      [0.7, "rgba(255, 255, 255, 0.15)"],
      [1.0, "rgba(255, 255, 255, 0.0)"],
    ]);

    const sharedLanternGeo = buildLanternGeometry();
    const lanternTextureCache = new Map<string, THREE.CanvasTexture>();

    const getLanternTexture = (wishRaw: string, hexColor: string): THREE.CanvasTexture => {
      const cleanWish = normalizeWishText(wishRaw);
      const cacheKey = `${hexColor}::${cleanWish}`;
      const existing = lanternTextureCache.get(cacheKey);
      if (existing) return existing;

      const W = 2048;
      const H = 1024;
      const offCanvas = document.createElement("canvas");
      offCanvas.width = W;
      offCanvas.height = H;
      const ctx = offCanvas.getContext("2d");

      if (ctx) {
        const baseCol = new THREE.Color(hexColor);
        const hsl = { h: 0, s: 0, l: 0 };
        baseCol.getHSL(hsl);

        const deepTone = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 0.95), Math.max(0.28, hsl.l * 0.62));
        const midTone = new THREE.Color().setHSL(
          hsl.h,
          Math.min(1, hsl.s),
          THREE.MathUtils.clamp(hsl.l * 0.96, 0.44, 0.72)
        );
        const warmBottomTone = new THREE.Color().setHSL(
          hsl.h,
          Math.min(1, hsl.s * 0.85),
          Math.min(0.86, hsl.l * 1.22 + 0.14)
        );

        const vGrad = ctx.createLinearGradient(0, 0, 0, H);
        vGrad.addColorStop(0.0, `#${deepTone.getHexString()}`);
        vGrad.addColorStop(0.3, `#${midTone.getHexString()}`);
        vGrad.addColorStop(0.76, `#${baseCol.getHexString()}`);
        vGrad.addColorStop(1.0, `#${warmBottomTone.getHexString()}`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, W, H);

        const frontBacklight = ctx.createRadialGradient(W * 0.5, H * 0.56, 40, W * 0.5, H * 0.56, H * 0.48);
        frontBacklight.addColorStop(0.0, "rgba(255, 248, 224, 0.36)");
        frontBacklight.addColorStop(0.55, "rgba(255, 236, 190, 0.14)");
        frontBacklight.addColorStop(1.0, "rgba(255, 210, 140, 0.0)");
        ctx.fillStyle = frontBacklight;
        ctx.fillRect(0, 0, W, H);

        const innerGlow = ctx.createRadialGradient(W * 0.5, H * 0.89, 20, W * 0.5, H * 0.78, H * 0.42);
        innerGlow.addColorStop(0.0, "rgba(255, 252, 232, 0.65)");
        innerGlow.addColorStop(0.5, "rgba(255, 232, 180, 0.22)");
        innerGlow.addColorStop(1.0, "rgba(255, 200, 120, 0.0)");
        ctx.fillStyle = innerGlow;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(55, 20, 5, 0.12)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const rx = (i / 8) * W;
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx, H);
          ctx.stroke();
        }

        const safeX = W * 0.365;
        const safeY = H * 0.285;
        const safeW = W * 0.27;
        const safeH = H * 0.465;

        if (cleanWish.length > 0) {
          const fontFamily = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";
          const fitted = fitTextInBox(ctx, cleanWish, safeW - 24, safeH - 20, fontFamily);

          const px = ctx.getImageData(Math.floor(W * 0.5), Math.floor(H * 0.52), 1, 1).data;
          const toLin = (c: number) => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          };
          const bgLum = 0.2126 * toLin(px[0]) + 0.7152 * toLin(px[1]) + 0.0722 * toLin(px[2]);
          const useLightInk = bgLum < 0.32;

          ctx.save();
          ctx.beginPath();
          ctx.rect(safeX, safeY, safeW, safeH);
          ctx.clip();

          ctx.font = `700 ${fitted.fontSize}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineJoin = "round";

          const fillCol = useLightInk ? "rgba(255, 253, 245, 0.99)" : "rgba(20, 6, 1, 0.98)";
          const haloCol = useLightInk ? "rgba(15, 4, 2, 0.72)" : "rgba(255, 244, 214, 0.55)";

          const totalBlockH = fitted.lines.length * fitted.lineHeight;
          const startY = safeY + (safeH - totalBlockH) / 2 + fitted.lineHeight / 2;
          const centerX = safeX + safeW / 2;

          fitted.lines.forEach((line, idx) => {
            const ly = startY + idx * fitted.lineHeight;
            ctx.strokeStyle = haloCol;
            ctx.lineWidth = Math.max(3, fitted.fontSize * 0.095);
            ctx.strokeText(line, centerX, ly);
            ctx.fillStyle = fillCol;
            ctx.fillText(line, centerX, ly);
          });

          ctx.restore();
        }
      }

      const texture = new THREE.CanvasTexture(offCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;

      if (lanternTextureCache.size > 60) {
        const oldestKey = lanternTextureCache.keys().next().value;
        if (oldestKey !== undefined) {
          lanternTextureCache.get(oldestKey)?.dispose();
          lanternTextureCache.delete(oldestKey);
        }
      }
      lanternTextureCache.set(cacheKey, texture);
      return texture;
    };

    let audioCtx: AudioContext | null = null;
    const ensureAudio = (): AudioContext | null => {
      if (!liveRef.current.soundEnabled) return null;
      if (!audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    };

    const playLaunchSound = () => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.22);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    };

    const playFireworkSound = (distanceFactor: number) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = THREE.MathUtils.clamp(0.18 * distanceFactor, 0.04, 0.22);

      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = "triangle";
      boomOsc.frequency.setValueAtTime(135, now);
      boomOsc.frequency.exponentialRampToValueAtTime(34, now + 0.35);
      boomGain.gain.setValueAtTime(vol, now);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start(now);
      boomOsc.stop(now + 0.45);

      const bufferSize = Math.floor(ctx.sampleRate * 0.9);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        const crackle = t > 0.22 && Math.random() < 0.045 ? 1.8 : 1.0;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.9) * crackle;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(520, now + 0.85);
      filter.Q.value = 0.7;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    };

    const activeLanterns: ActiveLantern[] = [];
    const activeFireworks: ActiveFirework[] = [];
    let launchedCounter = 0;
    const starterTimeouts: number[] = [];

    const getVisibleHeightAtZ = (worldZ: number) => {
      const dist = Math.max(4, camera.position.z - worldZ);
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      return 2 * Math.tan(vFov / 2) * dist;
    };

    const resolveNextLanternConfig = () => {
      const cur = liveRef.current;
      if (cur.mode === "sequence" && cur.sequenceItems.length > 0) {
        const idx = cur.sequenceIndex % cur.sequenceItems.length;
        const item = cur.sequenceItems[idx];
        const nextIdx = (idx + 1) % cur.sequenceItems.length;
        cur.sequenceIndex = nextIdx;
        setSequenceIndex(nextIdx);
        return {
          wishText: item.wishText,
          color: item.color,
          sizeMultiplier: item.sizeMultiplier,
        };
      }
      return {
        wishText: cur.wishText,
        color: cur.lanternColor,
        sizeMultiplier: cur.sizeMultiplier,
      };
    };

    const createLantern = (
      x: number,
      y: number,
      z: number,
      explicitConfig?: { wishText: string; color: string; sizeMultiplier: number }
    ) => {
      const cfg = explicitConfig || resolveNextLanternConfig();
      const hexColor = cfg.color;
      const tex = getLanternTexture(cfg.wishText, hexColor);

      const group = new THREE.Group();
      group.position.set(x, y, z);

      const bodyMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide });
      group.add(new THREE.Mesh(sharedLanternGeo, bodyMat));

      const flameMat = new THREE.SpriteMaterial({
        map: flameCoreTex,
        color: 0xfff2cf,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const flameSprite = new THREE.Sprite(flameMat);
      flameSprite.position.set(0, -1.16, 0.56);
      flameSprite.scale.set(1.05, 1.05, 1);
      group.add(flameSprite);

      const haloMat = new THREE.SpriteMaterial({
        map: outerHaloTex,
        color: new THREE.Color(hexColor),
        transparent: true,
        opacity: 0.44,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const haloSprite = new THREE.Sprite(haloMat);
      haloSprite.position.set(0, -0.05, -0.45);
      haloSprite.scale.set(5.4, 6.0, 1);
      group.add(haloSprite);

      const topRay = new THREE.Raycaster();
      topRay.setFromCamera(new THREE.Vector2(0, 0.76 - Math.random() * 0.12), camera);
      const distFromCam = camera.position.distanceTo(new THREE.Vector3(x, y, z));
      const topPoint = topRay.ray.origin.clone().addScaledVector(topRay.ray.direction, distFromCam);
      const peakY = Math.max(y + 4.5, topPoint.y);

      const targetBaseScale = BASE_LANTERN_SCALE * cfg.sizeMultiplier;
      group.scale.setScalar(0.25 * targetBaseScale);
      scene.add(group);

      activeLanterns.push({
        group,
        bodyMat,
        flameSprite,
        haloSprite,
        hexColor,
        baseScale: targetBaseScale,
        age: 0,
        peakY,
        vx: (Math.random() - 0.5) * 0.42,
        vz: (Math.random() - 0.5) * 0.3,
        baseSpeed: 2.1 + Math.random() * 0.7,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1.15 + Math.random() * 0.75,
      });

      launchedCounter += 1;
      setActiveCount(activeLanterns.length);
      setTotalLaunched(launchedCounter);
      playLaunchSound();

      if (!explicitConfig) {
        emitRef.current({
          type: "interaction",
          name: "lantern-launched",
          payload: { totalLaunched: launchedCounter, color: hexColor },
        });
      }
    };

    const spawnLanternAtScreen = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth || 1;
      const height = rect.height || window.innerHeight || 1;
      const ndcX = ((clientX - rect.left) / width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const distFromCam = THREE.MathUtils.lerp(24, 31, Math.random());
      const hitPoint = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, distFromCam);
      createLantern(hitPoint.x, hitPoint.y, hitPoint.z);
    };

    const spawnRandomLantern = () => {
      const targetZ = THREE.MathUtils.lerp(-1, -7, Math.random());
      const visH = getVisibleHeightAtZ(targetZ);
      const visW = visH * camera.aspect;
      const x = THREE.MathUtils.lerp(-visW * 0.24, visW * 0.24, Math.random());
      const y = THREE.MathUtils.lerp(-visH * 0.24, -visH * 0.04, Math.random());
      createLantern(x, y, targetZ);
    };

    const createFireworkExplosion = (origin: THREE.Vector3, hexColor: string) => {
      const baseColor = new THREE.Color(hexColor);
      const warmGold = new THREE.Color(0xffd27a);
      const hotWhite = new THREE.Color(0xffffff);
      const complementary = baseColor.clone().offsetHSL(0.08, 0.05, 0.08);

      const patterns = ["chrysanthemum", "peony", "willow", "doubleRing"];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];

      const particleCount = pattern === "doubleRing" ? 240 : 210;
      const trailSegments = 7;
      const totalLineVerts = particleCount * trailSegments * 2;

      const flashMat = new THREE.SpriteMaterial({
        map: outerHaloTex,
        color: 0xfff5de,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const flashSprite = new THREE.Sprite(flashMat);
      flashSprite.position.copy(origin);
      flashSprite.scale.set(2.5, 2.5, 1);
      scene.add(flashSprite);

      const linePositions = new Float32Array(totalLineVerts * 3);
      const lineColors = new Float32Array(totalLineVerts * 3);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trailMesh = new THREE.LineSegments(lineGeo, lineMat);
      trailMesh.frustumCulled = false;
      scene.add(trailMesh);

      const headPositions = new Float32Array(particleCount * 3);
      const headColors = new Float32Array(particleCount * 3);
      const headGeo = new THREE.BufferGeometry();
      headGeo.setAttribute("position", new THREE.BufferAttribute(headPositions, 3));
      headGeo.setAttribute("color", new THREE.BufferAttribute(headColors, 3));
      const headMat = new THREE.PointsMaterial({
        size: pattern === "willow" ? 0.52 : 0.62,
        map: sparkPointTex,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const headPoints = new THREE.Points(headGeo, headMat);
      headPoints.frustumCulled = false;
      scene.add(headPoints);

      const particles: FireworkParticle[] = [];
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const ringTiltX = (Math.random() - 0.5) * 0.9;
      const ringTiltZ = (Math.random() - 0.5) * 0.9;
      const ringQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(ringTiltX, 0, ringTiltZ));

      for (let i = 0; i < particleCount; i++) {
        const dir = new THREE.Vector3();
        let speed = 9.0;

        if (pattern === "doubleRing" && i < 90) {
          const angle = (i / 90) * Math.PI * 2;
          dir.set(Math.cos(angle), 0, Math.sin(angle)).applyQuaternion(ringQuat);
          speed = 7.4 + (Math.random() - 0.5) * 0.6;
        } else {
          const idx = pattern === "doubleRing" ? i - 90 : i;
          const total = pattern === "doubleRing" ? particleCount - 90 : particleCount;
          const y = 1 - (idx / Math.max(1, total - 1)) * 2;
          const r = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = goldenAngle * idx + (Math.random() - 0.5) * 0.28;
          dir.set(Math.cos(theta) * r, y + (Math.random() - 0.5) * 0.14, Math.sin(theta) * r).normalize();

          speed =
            pattern === "chrysanthemum"
              ? 11.2 + Math.random() * 2.4
              : pattern === "willow"
              ? 8.4 + Math.random() * 2.2
              : 9.5 + Math.random() * 2.6;
        }

        const roll = Math.random();
        const sparkColor =
          pattern === "willow"
            ? roll < 0.7
              ? warmGold.clone()
              : baseColor.clone()
            : roll < 0.65
            ? baseColor.clone()
            : roll < 0.88
            ? warmGold.clone()
            : complementary.clone();

        const history: THREE.Vector3[] = [];
        for (let h = 0; h <= trailSegments; h++) history.push(origin.clone());

        particles.push({
          pos: origin.clone(),
          vel: dir.multiplyScalar(speed),
          history,
          color: sparkColor,
          hotColor: hotWhite.clone().lerp(sparkColor, 0.3),
          maxLife: (pattern === "willow" ? 2.45 : 1.75) + Math.random() * 0.55,
          life: 0,
          twinklePhase: Math.random() * Math.PI * 2,
          canCrackle: Math.random() < 0.35,
        });
      }

      const dist = camera.position.distanceTo(origin);
      playFireworkSound(32 / Math.max(15, dist));

      activeFireworks.push({
        origin: origin.clone(),
        pattern,
        particles,
        trailSegments,
        flashSprite,
        flashMat,
        trailMesh,
        lineGeo,
        lineMat,
        linePositions,
        lineColors,
        headPoints,
        headGeo,
        headMat,
        headPositions,
        headColors,
        age: 0,
        drag: pattern === "willow" ? 0.965 : 0.955,
        gravity: pattern === "willow" ? 3.5 : 4.2,
      });

      if (!completionEmittedRef.current) {
        completionEmittedRef.current = true;
        emitRef.current({ type: "reveal", runId: liveRef.current.runId, payload: { pattern } });
        emitRef.current({ type: "complete", runId: liveRef.current.runId, payload: { pattern } });
      }
    };

    const _tempSparkColor = new THREE.Color();

    const updateFireworks = (dt: number) => {
      for (let f = activeFireworks.length - 1; f >= 0; f--) {
        const fw = activeFireworks[f];
        fw.age += dt;

        if (fw.age < 0.45) {
          const k = fw.age / 0.45;
          fw.flashSprite.scale.set(2.5 + k * 14.0, 2.5 + k * 14.0, 1);
          fw.flashMat.opacity = Math.pow(1 - k, 2.2) * 0.95;
        } else {
          fw.flashMat.opacity = 0;
          fw.flashSprite.visible = false;
        }

        let aliveCount = 0;
        const dragPow = Math.pow(fw.drag, dt * 60);

        for (let i = 0; i < fw.particles.length; i++) {
          const p = fw.particles[i];
          p.life += dt;
          const t = Math.min(1, p.life / p.maxLife);
          if (t < 1) aliveCount++;

          p.vel.multiplyScalar(dragPow);
          p.vel.y -= fw.gravity * dt;
          p.pos.addScaledVector(p.vel, dt);

          for (let h = fw.trailSegments; h > 0; h--) p.history[h].copy(p.history[h - 1]);
          p.history[0].copy(p.pos);

          let alpha = t < 0.12 ? 1.0 : Math.pow(1 - (t - 0.12) / 0.88, 1.55);
          if (p.canCrackle && t > 0.58 && t < 0.98) {
            alpha *= 0.4 + 0.6 * Math.abs(Math.sin(fw.age * 28 + p.twinklePhase));
          }
          if (t >= 1) alpha = 0;

          let curCol: THREE.Color;
          if (t < 0.2) {
            _tempSparkColor.copy(p.hotColor).lerp(p.color, t / 0.2);
            curCol = _tempSparkColor;
          } else {
            curCol = p.color;
          }

          fw.headPositions[i * 3] = p.pos.x;
          fw.headPositions[i * 3 + 1] = p.pos.y;
          fw.headPositions[i * 3 + 2] = p.pos.z;
          fw.headColors[i * 3] = curCol.r * alpha;
          fw.headColors[i * 3 + 1] = curCol.g * alpha;
          fw.headColors[i * 3 + 2] = curCol.b * alpha;

          const baseSegIdx = i * fw.trailSegments * 2;
          for (let s = 0; s < fw.trailSegments; s++) {
            const v0 = (baseSegIdx + s * 2) * 3;
            const v1 = (baseSegIdx + s * 2 + 1) * 3;
            const p0 = p.history[s];
            const p1 = p.history[s + 1];

            const tailFade0 = (1 - s / fw.trailSegments) * alpha * 0.92;
            const tailFade1 = (1 - (s + 1) / fw.trailSegments) * alpha * 0.92;

            fw.linePositions[v0] = p0.x;
            fw.linePositions[v0 + 1] = p0.y;
            fw.linePositions[v0 + 2] = p0.z;
            fw.linePositions[v1] = p1.x;
            fw.linePositions[v1 + 1] = p1.y;
            fw.linePositions[v1 + 2] = p1.z;

            fw.lineColors[v0] = curCol.r * tailFade0;
            fw.lineColors[v0 + 1] = curCol.g * tailFade0;
            fw.lineColors[v0 + 2] = curCol.b * tailFade0;
            fw.lineColors[v1] = curCol.r * tailFade1;
            fw.lineColors[v1 + 1] = curCol.g * tailFade1;
            fw.lineColors[v1 + 2] = curCol.b * tailFade1;
          }
        }

        (fw.headGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (fw.headGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        (fw.lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (fw.lineGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

        if (aliveCount === 0) {
          scene.remove(fw.flashSprite, fw.trailMesh, fw.headPoints);
          fw.flashMat.dispose();
          fw.lineGeo.dispose();
          fw.lineMat.dispose();
          fw.headGeo.dispose();
          fw.headMat.dispose();
          activeFireworks.splice(f, 1);
        }
      }
    };

    const updateLanterns = (dt: number, elapsed: number) => {
      let countChanged = false;
      const speedMult = liveRef.current.speedMultiplier;

      for (let i = activeLanterns.length - 1; i >= 0; i--) {
        const l = activeLanterns[i];
        l.age += dt;

        const enterT = Math.min(1, l.age / 0.35);
        const easeOutBack = 1 + 0.14 * Math.sin(enterT * Math.PI);
        let currentScale =
          l.baseScale * THREE.MathUtils.lerp(0.25, 1.0, enterT) * (enterT < 1 ? easeOutBack : 1);

        l.group.position.y += l.baseSpeed * speedMult * dt;
        l.group.position.x += (l.vx + Math.sin(elapsed * 0.7 + l.swayPhase) * 0.25) * dt;
        l.group.position.z += l.vz * dt;

        const faceCamYaw = Math.atan2(
          camera.position.x - l.group.position.x,
          camera.position.z - l.group.position.z
        );
        l.group.rotation.y = faceCamYaw + Math.sin(elapsed * l.swaySpeed * 0.55 + l.swayPhase) * 0.055;
        l.group.rotation.z = Math.sin(elapsed * l.swaySpeed + l.swayPhase) * 0.042;
        l.group.rotation.x = Math.cos(elapsed * l.swaySpeed * 0.8 + l.swayPhase) * 0.025;

        const flicker = 0.92 + 0.14 * Math.sin(elapsed * 14.0 + l.swayPhase * 3.0) + 0.06 * Math.cos(elapsed * 23.0);
        l.flameSprite.scale.set(1.05 * flicker, 1.05 * flicker, 1);
        l.haloSprite.material.opacity = 0.44 + 0.08 * flicker;

        const distToPeak = l.peakY - l.group.position.y;
        if (distToPeak < 1.3 && distToPeak > 0) {
          const surge = 1 - distToPeak / 1.3;
          currentScale *= 1 + surge * 0.18;
          l.haloSprite.material.opacity = 0.65 + surge * 0.35;
        }

        l.group.scale.setScalar(currentScale);

        if (l.group.position.y >= l.peakY) {
          const burstPos = l.group.position.clone();
          const burstColor = l.hexColor;
          scene.remove(l.group);
          l.bodyMat.dispose();
          l.flameSprite.material.dispose();
          l.haloSprite.material.dispose();
          activeLanterns.splice(i, 1);
          countChanged = true;
          createFireworkExplosion(burstPos, burstColor);
        }
      }

      if (countChanged) setActiveCount(activeLanterns.length);
    };

    const clearAll = () => {
      for (const l of activeLanterns) {
        scene.remove(l.group);
        l.bodyMat.dispose();
        l.flameSprite.material.dispose();
        l.haloSprite.material.dispose();
      }
      activeLanterns.length = 0;

      for (const fw of activeFireworks) {
        scene.remove(fw.flashSprite, fw.trailMesh, fw.headPoints);
        fw.flashMat.dispose();
        fw.lineGeo.dispose();
        fw.lineMat.dispose();
        fw.headGeo.dispose();
        fw.headMat.dispose();
      }
      activeFireworks.length = 0;
      setActiveCount(0);
    };

    const launchStarters = () => {
      for (const tid of starterTimeouts) window.clearTimeout(tid);
      starterTimeouts.length = 0;
      starterTimeouts.push(window.setTimeout(() => spawnRandomLantern(), 250));
      starterTimeouts.push(window.setTimeout(() => spawnRandomLantern(), 850));
    };

    actionsRef.current = {
      spawnRandomLantern,
      clearAll,
      updateStarDrawRange: (count: number) => starGeo.setDrawRange(0, count),
      updateActiveScale: (sz: number) => {
        for (const l of activeLanterns) l.baseScale = BASE_LANTERN_SCALE * sz;
      },
      launchStarters,
    };

    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const rawDt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      const dt = liveRef.current.isPaused ? 0 : rawDt * liveRef.current.runtimeSpeed;
      elapsed += dt;

      camControl.yaw = THREE.MathUtils.lerp(camControl.yaw, camControl.targetYaw, 0.08);
      camControl.pitch = THREE.MathUtils.lerp(camControl.pitch, camControl.targetPitch, 0.08);
      camControl.distance = THREE.MathUtils.lerp(camControl.distance, camControl.targetDistance, 0.08);
      updateCameraTransform();

      starMat.uniforms.uTime.value = elapsed;
      starField.rotation.y = elapsed * 0.004;

      if (dt > 0) {
        updateLanterns(dt, elapsed);
        updateFireworks(dt);
      }
      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    const pointer = { isDown: false, lastX: 0, lastY: 0, movedDist: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointer.isDown = true;
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;
      pointer.movedDist = 0;
      canvas.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointer.isDown) return;
      const dx = e.clientX - pointer.lastX;
      const dy = e.clientY - pointer.lastY;
      pointer.movedDist += Math.hypot(dx, dy);
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;

      if (pointer.movedDist > 6) {
        camControl.targetYaw = THREE.MathUtils.clamp(camControl.targetYaw - dx * 0.0045, -0.85, 0.85);
        camControl.targetPitch = THREE.MathUtils.clamp(camControl.targetPitch - dy * 0.0035, -0.25, 0.55);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointer.isDown) return;
      pointer.isDown = false;
      if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (pointer.movedDist < 7) spawnLanternAtScreen(e.clientX, e.clientY);
    };

    const onPointerCancel = () => {
      pointer.isDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camControl.targetDistance = THREE.MathUtils.clamp(camControl.targetDistance + e.deltaY * 0.015, 16, 46);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const handleResize = () => {
      const { w, h } = getDims();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      starMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };

    window.addEventListener("resize", handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    }

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      handleResize();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    if (config.autoLaunchStarters) {
      launchStarters();
    }

    return () => {
      cancelAnimationFrame(rafId);
      for (const tid of starterTimeouts) window.clearTimeout(tid);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      resizeObserver?.disconnect();

      clearAll();
      for (const tex of lanternTextureCache.values()) tex.dispose();
      lanternTextureCache.clear();
      sharedLanternGeo.dispose();
      skyGeo.dispose();
      skyMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      flameCoreTex.dispose();
      outerHaloTex.dispose();
      sparkPointTex.dispose();
      renderer.dispose();
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
      actionsRef.current = null;
    };
  }, [runtime.quality]);

  const prevRunIdRef = useRef(runtime.runId);
  useEffect(() => {
    if (prevRunIdRef.current === runtime.runId) return;
    prevRunIdRef.current = runtime.runId;
    completionEmittedRef.current = false;
    setTotalLaunched(0);
    setSequenceIndex(Math.max(0, Math.min(4, (Number(config.sequenceStartIndex) || 1) - 1)));
    actionsRef.current?.clearAll();
    if (config.autoLaunchStarters) {
      actionsRef.current?.launchStarters();
    }
  }, [runtime.runId, config.autoLaunchStarters, config.sequenceStartIndex]);

  const handleToggleFullscreen = useCallback(() => {
    const el = rootRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const nextNum = sequenceIndex + 1;

  return (
    <div ref={rootRef} className="sl3d-root">
      <style>{SL3D_STYLES}</style>
      <canvas ref={canvasRef} className="sl3d-canvas" />

      {webglUnavailable && (
        <div className="sl3d-fallback-banner">
          <div>
            <h2 style={{ marginBottom: 10 }}>Không thể khởi tạo WebGL 3D</h2>
            <p style={{ color: "#98a4c7" }}>
              Trình duyệt hoặc môi trường hiện tại chưa hỗ trợ WebGL để hiển thị bầu trời đêm 3D.
            </p>
          </div>
        </div>
      )}

      {config.showHud && (
        <>
          <div className="sl3d-sky-hint">{config.hintText}</div>
          <div className="sl3d-sky-hud">
            <div className="sl3d-sky-stats">
              <span>
                Đang bay: <strong>{activeCount}</strong>
              </span>
              <span className="sl3d-dot" />
              <span>
                Đã thả: <strong>{totalLaunched}</strong>
              </span>
              <span className="sl3d-dot" />
              <span>Kéo xoay 3D</span>
            </div>

            <div className="sl3d-hud-actions">
              <button
                type="button"
                className="sl3d-hud-btn primary"
                onClick={() => actionsRef.current?.spawnRandomLantern()}
              >
                {config.mode === "sequence" ? `Thả Đèn #${nextNum}` : "Thả 1 Đèn"}
              </button>
              <button type="button" className="sl3d-hud-btn" onClick={() => actionsRef.current?.clearAll()}>
                Xóa hết
              </button>
              <button type="button" className="sl3d-hud-btn" onClick={handleToggleFullscreen}>
                {isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
