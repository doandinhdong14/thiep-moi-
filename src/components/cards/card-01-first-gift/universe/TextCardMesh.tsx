"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { UniverseElementLayout } from "./types";
import { createFlipUvMaterial, createHaloGlowMaterial } from "./flipUvShader";
import { wrapY } from "./motionUtils";

export interface TextCardMeshProps {
  item: UniverseElementLayout;
  textColor?: string;
  glowEnabled?: boolean;
  glowIntensity?: number;
  glowSpread?: number;
  glowColor?: string;
  textScaleFactor?: number;
  driftEnabled?: boolean;
  driftSpeed?: number;
  cloudHeight?: number;
  isOpened: boolean;
  paused?: boolean;
  floatAmplitude?: number;
}

function createTextDualTextures(
  text: string,
  textColor: string,
  glowSpread: number
): {
  coreTexture: THREE.CanvasTexture;
  haloTexture: THREE.CanvasTexture;
  aspect: number;
} {
  const fontSpec =
    '400 36px "Comfortaa", "Quicksand", "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const testCanvas = document.createElement("canvas");
  const testCtx = testCanvas.getContext("2d");
  if (testCtx) testCtx.font = fontSpec;
  const textMetrics = testCtx ? testCtx.measureText(text) : { width: text.length * 20 };
  const textWidth = Math.ceil(textMetrics.width || text.length * 20);

  const paddingX = 96;
  const paddingY = 52;
  const baseWidth = textWidth + paddingX * 2;
  const baseHeight = 36 + paddingY * 2;
  const scale = 2;

  const centerX = baseWidth / 2;
  const centerY = baseHeight / 2;

  const coreCanvas = document.createElement("canvas");
  coreCanvas.width = baseWidth * scale;
  coreCanvas.height = baseHeight * scale;
  const coreCtx = coreCanvas.getContext("2d");
  if (coreCtx) {
    coreCtx.scale(scale, scale);
    coreCtx.clearRect(0, 0, baseWidth, baseHeight);
    coreCtx.font = fontSpec;
    coreCtx.textAlign = "center";
    coreCtx.textBaseline = "middle";
    coreCtx.shadowBlur = 0;
    coreCtx.shadowColor = "transparent";
    coreCtx.fillStyle = textColor || "#FFFDF0";
    coreCtx.fillText(text, centerX, centerY);
  }

  const coreTexture = new THREE.CanvasTexture(coreCanvas);
  coreTexture.generateMipmaps = true;
  coreTexture.minFilter = THREE.LinearMipmapLinearFilter;
  coreTexture.magFilter = THREE.LinearFilter;

  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = baseWidth * scale;
  haloCanvas.height = baseHeight * scale;
  const haloCtx = haloCanvas.getContext("2d");
  if (haloCtx) {
    haloCtx.scale(scale, scale);
    haloCtx.clearRect(0, 0, baseWidth, baseHeight);
    haloCtx.font = fontSpec;
    haloCtx.textAlign = "center";
    haloCtx.textBaseline = "middle";

    const spreadFactor = Math.max(0.1, Math.min(1.2, glowSpread));
    haloCtx.shadowOffsetX = 0;
    haloCtx.shadowOffsetY = 0;

    haloCtx.shadowColor = "#FFFFFF";
    haloCtx.shadowBlur = Math.round(28 + 36 * spreadFactor);
    haloCtx.lineWidth = Math.round(10 + 16 * spreadFactor);
    haloCtx.strokeStyle = "rgba(255, 255, 255, 0.40)";
    haloCtx.strokeText(text, centerX, centerY);

    haloCtx.shadowColor = "#FFFFFF";
    haloCtx.shadowBlur = Math.round(14 + 18 * spreadFactor);
    haloCtx.lineWidth = Math.round(4 + 8 * spreadFactor);
    haloCtx.strokeStyle = "rgba(255, 255, 255, 0.60)";
    haloCtx.strokeText(text, centerX, centerY);

    haloCtx.shadowColor = "#FFFFFF";
    haloCtx.shadowBlur = Math.round(6 + 8 * spreadFactor);
    haloCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
    haloCtx.fillText(text, centerX, centerY);
  }

  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  haloTexture.generateMipmaps = true;
  haloTexture.minFilter = THREE.LinearMipmapLinearFilter;
  haloTexture.magFilter = THREE.LinearFilter;

  return { coreTexture, haloTexture, aspect: baseWidth / baseHeight };
}

export const TextCardMesh: React.FC<TextCardMeshProps> = ({
  item,
  textColor = "#FFFDF0",
  glowEnabled = true,
  glowIntensity = 1.0,
  glowSpread = 0.5,
  glowColor = "#FFBE28",
  textScaleFactor = 1.0,
  driftEnabled = true,
  driftSpeed = 0.35,
  cloudHeight = 7.2,
  isOpened,
  paused = false,
  floatAmplitude = 0.12,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const timeRef = useRef<number>(0);
  const driftOffsetRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(isOpened ? 1 : 0);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => setFontReady(true));
    }
  }, []);

  const { coreTexture, haloTexture, aspect } = useMemo(() => {
    return createTextDualTextures(item.content, textColor, glowSpread);
  }, [item.content, textColor, glowSpread, fontReady]);

  const coreMaterial = useMemo(() => {
    const mat = createFlipUvMaterial(coreTexture, "#FFFFFF", isOpened ? 1 : 0, THREE.NormalBlending);
    coreMatRef.current = mat;
    return mat;
  }, [coreTexture, isOpened]);

  const haloMaterial = useMemo(() => {
    const mat = createHaloGlowMaterial(haloTexture, glowColor, isOpened ? 1 : 0, glowIntensity);
    haloMatRef.current = mat;
    return mat;
  }, [haloTexture, glowColor, isOpened, glowIntensity]);

  useEffect(() => {
    return () => {
      coreTexture.dispose();
      haloTexture.dispose();
      coreMaterial.dispose();
      haloMaterial.dispose();
    };
  }, [coreTexture, haloTexture, coreMaterial, haloMaterial]);

  const basePlaneHeight = 0.3;
  const planeHeight = basePlaneHeight * Math.max(0.4, Math.min(2.5, textScaleFactor));
  const planeWidth = planeHeight * aspect;

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (!paused) timeRef.current += safeDelta;

    const target = isOpened ? 1 : 0;
    if (currentProgressRef.current < target) {
      currentProgressRef.current = Math.min(target, currentProgressRef.current + safeDelta * 1.2);
    } else if (currentProgressRef.current > target) {
      currentProgressRef.current = Math.max(target, currentProgressRef.current - safeDelta * 2.5);
    }

    if (groupRef.current && coreMatRef.current && haloMatRef.current) {
      const time = timeRef.current;
      if (!paused && driftEnabled) driftOffsetRef.current += driftSpeed * safeDelta;

      const wrappedY = wrapY(item.position[1], driftOffsetRef.current, cloudHeight);
      const dy = Math.sin(time * item.floatSpeed + item.phase) * floatAmplitude;
      const dx = Math.cos(time * item.floatSpeed * 0.7 + item.phase) * (floatAmplitude * 0.35);
      const dRotZ = Math.sin(time * item.floatSpeed * 0.5 + item.phase) * 0.025;

      groupRef.current.position.set(item.position[0] + dx, wrappedY + dy, item.position[2]);
      groupRef.current.rotation.z = item.rotation[2] + dRotZ;

      const stagger = (item.phase / (Math.PI * 2)) * 0.25;
      const progress = Math.max(0, Math.min(1, (currentProgressRef.current - stagger) / (1 - stagger)));
      const ease = 1 - Math.pow(1 - progress, 3);

      const targetScale = item.scale[0] * ease;
      groupRef.current.scale.set(targetScale, targetScale, targetScale);

      coreMatRef.current.uniforms.uOpacity.value = ease;
      const effectiveGlow = glowEnabled && glowIntensity > 0 ? glowIntensity : 0.0;
      haloMatRef.current.uniforms.uGlowIntensity.value = effectiveGlow;
      haloMatRef.current.uniforms.uOpacity.value = ease;
      haloMatRef.current.uniforms.uColor.value.set(glowColor || "#FFBE28");

      if (haloMeshRef.current) haloMeshRef.current.visible = effectiveGlow > 0;
      groupRef.current.visible = progress > 0.01;
    }
  });

  return (
    <group ref={groupRef} position={item.position} rotation={item.rotation}>
      <mesh
        ref={haloMeshRef}
        material={haloMaterial}
        position={[0, 0, -0.001]}
        visible={glowEnabled && glowIntensity > 0}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
      </mesh>
      <mesh material={coreMaterial} position={[0, 0, 0.001]}>
        <planeGeometry args={[planeWidth, planeHeight]} />
      </mesh>
    </group>
  );
};
