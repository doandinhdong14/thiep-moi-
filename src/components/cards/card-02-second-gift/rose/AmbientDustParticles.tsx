"use client";

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface AmbientDustParticlesProps {
  count?: number;
  color?: string;
  speed?: number;
}

export const AmbientDustParticles: React.FC<AmbientDustParticlesProps> = ({
  count = 45,
  color = "#FFE4E8",
  speed = 0.4,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, initialData] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const data: { x0: number; y0: number; z0: number; vy: number; phase: number }[] = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 2.2;
      const x0 = Math.cos(theta) * radius;
      const y0 = -3.5 + Math.random() * 5.5;
      const z0 = Math.sin(theta) * radius + (Math.random() - 0.5) * 1.5;
      const vy = 0.15 + Math.random() * 0.35;
      const phase = Math.random() * Math.PI * 2;

      pos[i * 3] = x0;
      pos[i * 3 + 1] = y0;
      pos[i * 3 + 2] = z0;

      data.push({ x0, y0, z0, vy, phase });
    }
    return [pos, data];
  }, [count]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size: 0.045,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const time = state.clock.getElapsedTime() * speed;

    for (let i = 0; i < count; i++) {
      const d = initialData[i];
      let y = d.y0 + time * d.vy;
      const yMin = -3.5;
      const span = 6.0;
      y = ((y - yMin) % span) + yMin;

      posArray[i * 3] = d.x0 + Math.sin(time + d.phase) * 0.15;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = d.z0 + Math.cos(time * 0.8 + d.phase) * 0.12;
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};
