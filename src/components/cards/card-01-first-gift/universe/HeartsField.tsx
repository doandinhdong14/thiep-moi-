"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { UniverseElementLayout } from "./types";
import { getHeartGeometry } from "./heartGeometry";
import { wrapY } from "./motionUtils";

export interface HeartsFieldProps {
  items: UniverseElementLayout[];
  heartColor?: string;
  isOpened: boolean;
  paused?: boolean;
  floatAmplitude?: number;
  scaleFactor?: number;
  roughness?: number;
  spinSpeed?: number;
  driftEnabled?: boolean;
  driftSpeed?: number;
  cloudHeight?: number;
}

export const HeartsField: React.FC<HeartsFieldProps> = ({
  items,
  heartColor = "#FF3824",
  isOpened,
  paused = false,
  floatAmplitude = 0.14,
  scaleFactor = 1.0,
  roughness = 0.35,
  spinSpeed = 1.0,
  driftEnabled = true,
  driftSpeed = 0.35,
  cloudHeight = 7.2,
}) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef<number>(0);
  const driftOffsetRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(isOpened ? 1 : 0);

  const geometry = useMemo(() => getHeartGeometry(), []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: heartColor,
      roughness: Math.max(0.05, Math.min(1.0, roughness)),
      metalness: 0.08,
      emissive: heartColor,
      emissiveIntensity: 0.12,
      side: THREE.FrontSide,
    });
  }, [heartColor, roughness]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const spinAxes = useMemo(() => {
    return items.map((_, i) => ({
      axisX: 0.6 + ((i * 37) % 10) * 0.06,
      axisY: 0.8 + ((i * 53) % 10) * 0.07,
      axisZ: 0.4 + ((i * 71) % 10) * 0.05,
    }));
  }, [items]);

  useFrame((_, delta) => {
    if (!instancedMeshRef.current || items.length === 0) return;

    const safeDelta = Math.min(delta, 0.1);
    if (!paused) timeRef.current += safeDelta;

    const target = isOpened ? 1 : 0;
    if (currentProgressRef.current < target) {
      currentProgressRef.current = Math.min(target, currentProgressRef.current + safeDelta * 1.2);
    } else if (currentProgressRef.current > target) {
      currentProgressRef.current = Math.max(target, currentProgressRef.current - safeDelta * 2.5);
    }

    const time = timeRef.current;
    const rawProgress = currentProgressRef.current;
    const mesh = instancedMeshRef.current;

    if (!paused && driftEnabled) driftOffsetRef.current += driftSpeed * safeDelta;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const axes = spinAxes[i] || { axisX: 0.7, axisY: 0.9, axisZ: 0.4 };

      const stagger = (item.phase / (Math.PI * 2)) * 0.25;
      const progress = Math.max(0, Math.min(1, (rawProgress - stagger) / (1 - stagger)));
      const ease = 1 - Math.pow(1 - progress, 3);

      const wrappedY = wrapY(item.position[1], driftOffsetRef.current, cloudHeight);
      const dy = Math.sin(time * item.floatSpeed + item.phase) * floatAmplitude;
      const dx = Math.cos(time * item.floatSpeed * 0.8 + item.phase) * (floatAmplitude * 0.4);

      dummy.position.set(item.position[0] + dx, wrappedY + dy, item.position[2]);

      const spin = spinSpeed * 0.8;
      dummy.rotation.set(
        item.rotation[0] + time * spin * axes.axisX,
        item.rotation[1] + time * spin * axes.axisY,
        item.rotation[2] + time * spin * axes.axisZ
      );

      const baseScale = item.scale[0] * 0.22 * scaleFactor * ease;
      dummy.scale.set(baseScale, baseScale, baseScale);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = rawProgress > 0.01;
  });

  return (
    <instancedMesh
      key={`hearts_${items.length}_${heartColor}_${scaleFactor}`}
      ref={instancedMeshRef}
      args={[geometry, material, items.length]}
      frustumCulled={false}
    />
  );
};
