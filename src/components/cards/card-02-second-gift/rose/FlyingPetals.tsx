"use client";

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createFlyingPetalGeometry } from "./roseGeometry";
import type { FlyingPetalData } from "./types";

export interface FlyingPetalsProps {
  active: boolean;
  flightProgress: number;
  count?: number;
  burstSpeed?: number;
  fallSpeed?: number;
  spinSpeed?: number;
  petalColor: string;
  petalInnerColor: string;
  petalEdgeColor: string;
  flowerScale?: number;
}

function createPseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const FlyingPetals: React.FC<FlyingPetalsProps> = ({
  active,
  flightProgress,
  count = 55,
  burstSpeed = 1.6,
  fallSpeed = 0.75,
  spinSpeed = 1.6,
  petalColor,
  petalInnerColor,
  petalEdgeColor,
  flowerScale = 1.0,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(
    () => createFlyingPetalGeometry(0.28, 0.38, petalInnerColor, petalColor, petalEdgeColor),
    [petalInnerColor, petalColor, petalEdgeColor]
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.42,
        metalness: 0.04,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.96,
        depthWrite: true,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const particles = useMemo<FlyingPetalData[]>(() => {
    const rng = createPseudoRandom(2026);
    const list: FlyingPetalData[] = [];

    for (let i = 0; i < count; i++) {
      const spawnTime = rng() * 0.65;
      const spawnAngle = rng() * Math.PI * 2;
      const spawnRadius = 0.1 + rng() * 0.3;
      const x0 = Math.cos(spawnAngle) * spawnRadius * flowerScale;
      const y0 = (0.35 + rng() * 0.55) * flowerScale;
      const z0 = Math.sin(spawnAngle) * spawnRadius * flowerScale;

      const burstAngle = spawnAngle + (rng() - 0.5) * 0.4;
      const horizSpeed = (0.6 + rng() * 1.2) * burstSpeed;
      const vx = Math.cos(burstAngle) * horizSpeed;
      const vy = (1.2 + rng() * 1.5) * burstSpeed;
      const vzBias = rng() < 0.6 ? 0.8 : -0.2;
      const vz = (Math.sin(burstAngle) * 0.5 + vzBias * (0.6 + rng() * 0.9)) * burstSpeed;

      const tierRand = rng();
      const scale =
        tierRand < 0.25 ? 1.0 + rng() * 0.25 : tierRand < 0.75 ? 0.75 + rng() * 0.25 : 0.5 + rng() * 0.2;

      list.push({
        spawnTime,
        x0,
        y0,
        z0,
        vx,
        vy,
        vz,
        fallSpeed: (0.5 + rng() * 0.5) * fallSpeed,
        rotSpeedX: (rng() - 0.5) * 3.8 * spinSpeed,
        rotSpeedY: (rng() - 0.5) * 3.4 * spinSpeed,
        rotSpeedZ: (rng() - 0.5) * 2.8 * spinSpeed,
        initialRotX: rng() * Math.PI * 2,
        initialRotY: rng() * Math.PI * 2,
        initialRotZ: rng() * Math.PI * 2,
        scale: scale * flowerScale,
        phase: rng() * Math.PI * 2,
      });
    }
    return list;
  }, [count, burstSpeed, fallSpeed, spinSpeed, flowerScale]);

  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const dummyQuat = useMemo(() => new THREE.Quaternion(), []);
  const dummyEuler = useMemo(() => new THREE.Euler(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!active || flightProgress <= 0) {
      dummyMatrix.makeScale(0, 0, 0);
      for (let i = 0; i < count; i++) {
        mesh.setMatrixAt(i, dummyMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    const totalDuration = 3.6;
    const elapsed = flightProgress * totalDuration;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const localT = elapsed - p.spawnTime;

      if (localT <= 0) {
        dummyMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, dummyMatrix);
        continue;
      }

      const dragK = 1.7;
      const burstFactor = (1 - Math.exp(-dragK * localT)) / dragK;
      const windSwayX = Math.sin(localT * 2.0 + p.phase) * 0.3;
      const windSwayZ = Math.cos(localT * 1.6 + p.phase) * 0.2;
      const fallDistance = p.fallSpeed * Math.max(0, localT - 0.22);

      dummyPos.set(
        p.x0 + p.vx * burstFactor + windSwayX,
        p.y0 + p.vy * burstFactor - fallDistance,
        p.z0 + p.vz * burstFactor + windSwayZ
      );

      dummyEuler.set(
        p.initialRotX + p.rotSpeedX * localT,
        p.initialRotY + p.rotSpeedY * localT,
        p.initialRotZ + p.rotSpeedZ * localT
      );
      dummyQuat.setFromEuler(dummyEuler);

      let currentScale = p.scale;
      if (localT < 0.2) currentScale *= localT / 0.2;
      const timeLeft = totalDuration - elapsed;
      if (timeLeft < 0.8) currentScale *= Math.max(0, timeLeft / 0.8);

      dummyScale.set(currentScale, currentScale, currentScale);
      dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
      mesh.setMatrixAt(i, dummyMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} castShadow />;
};
