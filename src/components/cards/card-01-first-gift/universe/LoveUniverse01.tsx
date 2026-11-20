"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AssetConfig } from "./types";
import { StarsBackground } from "./StarsBackground";
import { TextCardMesh } from "./TextCardMesh";
import { PhotoCardMesh } from "./PhotoCardMesh";
import { HeartsField } from "./HeartsField";
import { generateUniverseLayout } from "./universeLayout";
import { DEFAULT_CARD01_PHOTOS } from "./placeholders";
import { degreesToRadians } from "../sdk";

export interface LoveUniverse01Props {
  config: AssetConfig;
  photoUrls?: string[];
  isOpened?: boolean;
  paused?: boolean;
  quality?: "low" | "high";
}

export const LoveUniverse01: React.FC<LoveUniverse01Props> = ({
  config,
  photoUrls: propPhotoUrls,
  isOpened = true,
  paused = false,
  quality = "high",
}) => {
  const uCfg = config.universe;

  const wishes = useMemo(() => {
    return uCfg?.wishes && uCfg.wishes.length > 0
      ? uCfg.wishes
      : [
          "Thích cậu, từ ngày đầu tiên đến tận sau này.",
          "Mong là năm nào tụi mình cũng có nhau.",
          "Ở cạnh tớ thật lâu nhé.",
          "Thương cậu nhiều lắm.",
          "Có cậu là đủ.",
          "love u",
        ];
  }, [uCfg?.wishes]);

  const photoUrls = useMemo(() => {
    return propPhotoUrls && propPhotoUrls.length > 0 ? propPhotoUrls : DEFAULT_CARD01_PHOTOS;
  }, [propPhotoUrls]);

  const textCount = uCfg?.textCount ?? 35;
  const photoCount = uCfg?.photoCount ?? 10;
  const heartCount = uCfg?.heartCount ?? 31;
  const cloudWidth = uCfg?.cloudWidth ?? 8.6;
  const cloudHeight = uCfg?.cloudHeight ?? 7.2;
  const cloudDepth = uCfg?.cloudDepth ?? 6.3;
  const rotationSpeed = uCfg?.rotationSpeed ?? config.motion?.spin?.speedDegPerSecond ?? 1.5;
  const textColor = uCfg?.textColor ?? config.appearance?.color ?? "#fafafa";
  const glowIntensity = uCfg?.glowIntensity ?? 1.75;
  const heartColor = uCfg?.heartColor ?? "#f01d0a";
  const seed = uCfg?.seed ?? 42;
  const glowEnabled = uCfg?.glowEnabled ?? true;
  const glowSpread = uCfg?.glowSpread ?? 0.3;
  const glowColor = uCfg?.glowColor ?? "#b46ac8";
  const textScaleFactor = uCfg?.textScaleFactor ?? 2;
  const photoScaleFactor = uCfg?.photoScaleFactor ?? 1.3;
  const heartScaleFactor = uCfg?.heartScaleFactor ?? 1.35;
  const heartRoughness = uCfg?.heartRoughness ?? 0.35;
  const heartSpinSpeed = uCfg?.heartSpinSpeed ?? 0.2;
  const heartFloatAmp = uCfg?.heartFloatAmp ?? 0.14;
  const driftEnabled = uCfg?.driftEnabled ?? true;
  const globalSpeedMultiplier = uCfg?.globalSpeedMultiplier ?? 1.3;

  const textDriftEnabled = uCfg?.textDriftEnabled ?? true;
  const textDriftSpeed = uCfg?.textDriftSpeed ?? (uCfg?.driftSpeed ?? 0.4);
  const photoDriftEnabled = uCfg?.photoDriftEnabled ?? true;
  const photoDriftSpeed = uCfg?.photoDriftSpeed ?? (uCfg?.driftSpeed ?? 0.5);
  const heartDriftEnabled = uCfg?.heartDriftEnabled ?? true;
  const heartDriftSpeed = uCfg?.heartDriftSpeed ?? (uCfg?.driftSpeed ?? 0.65);

  const effectiveTextSpeed =
    driftEnabled && textDriftEnabled ? textDriftSpeed * globalSpeedMultiplier : 0;
  const effectivePhotoSpeed =
    driftEnabled && photoDriftEnabled ? photoDriftSpeed * globalSpeedMultiplier : 0;
  const effectiveHeartSpeed =
    driftEnabled && heartDriftEnabled ? heartDriftSpeed * globalSpeedMultiplier : 0;

  const spinGroupRef = useRef<THREE.Group>(null);
  const prefersReducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReducedMotionRef.current = mql.matches;
      const listener = (e: MediaQueryListEvent) => {
        prefersReducedMotionRef.current = e.matches;
      };
      mql.addEventListener("change", listener);
      return () => mql.removeEventListener("change", listener);
    }
  }, []);

  const layout = useMemo(() => {
    return generateUniverseLayout({
      wishes,
      photoUrls,
      textCount,
      photoCount,
      heartCount,
      cloudWidth,
      cloudHeight,
      cloudDepth,
      seed,
    });
  }, [wishes, photoUrls, textCount, photoCount, heartCount, cloudWidth, cloudHeight, cloudDepth, seed]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    if (!paused && spinGroupRef.current && !prefersReducedMotionRef.current) {
      spinGroupRef.current.rotation.y += degreesToRadians(rotationSpeed) * safeDelta;
    }
  });

  return (
    <group>
      <StarsBackground quality={quality} paused={paused} />
      <ambientLight intensity={0.9} color="#eef3ff" />
      <directionalLight position={[5, 12, 10]} intensity={1.1} color="#FFF5EA" />
      <directionalLight position={[-5, -8, -6]} intensity={0.5} color="#FFD1DC" />

      <group ref={spinGroupRef}>
        {layout.textItems.map((item) => (
          <TextCardMesh
            key={item.id}
            item={item}
            textColor={textColor}
            glowEnabled={glowEnabled}
            glowIntensity={glowIntensity}
            glowSpread={glowSpread}
            glowColor={glowColor}
            textScaleFactor={textScaleFactor}
            driftEnabled={driftEnabled && textDriftEnabled && effectiveTextSpeed > 0}
            driftSpeed={effectiveTextSpeed}
            cloudHeight={cloudHeight}
            isOpened={isOpened}
            paused={paused}
          />
        ))}

        {layout.photoItems.map((item) => (
          <PhotoCardMesh
            key={item.id}
            item={item}
            photoScaleFactor={photoScaleFactor}
            driftEnabled={driftEnabled && photoDriftEnabled && effectivePhotoSpeed > 0}
            driftSpeed={effectivePhotoSpeed}
            cloudHeight={cloudHeight}
            isOpened={isOpened}
            paused={paused}
          />
        ))}

        <HeartsField
          items={layout.heartItems}
          heartColor={heartColor}
          scaleFactor={heartScaleFactor}
          roughness={heartRoughness}
          spinSpeed={heartSpinSpeed}
          floatAmplitude={heartFloatAmp}
          driftEnabled={driftEnabled && heartDriftEnabled && effectiveHeartSpeed > 0}
          driftSpeed={effectiveHeartSpeed}
          cloudHeight={cloudHeight}
          isOpened={isOpened}
          paused={paused}
        />
      </group>
    </group>
  );
};
