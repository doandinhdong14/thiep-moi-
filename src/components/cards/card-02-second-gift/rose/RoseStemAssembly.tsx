"use client";

import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import {
  createReceptacleGeometry,
  createSepalGeometry,
  createStemGeometry,
  createLeafGeometry,
} from "./roseGeometry";

export interface RoseStemAssemblyProps {
  stemColor: string;
}

export const RoseStemAssembly: React.FC<RoseStemAssemblyProps> = ({ stemColor }) => {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
    []
  );

  const receptacleGeom = useMemo(() => createReceptacleGeometry(0.14, 0.042, 0.28, stemColor), [stemColor]);
  const sepalGeom = useMemo(() => createSepalGeometry(0.46, 0.14, stemColor), [stemColor]);
  const stemGeom = useMemo(() => createStemGeometry(stemColor), [stemColor]);
  const upperLeafGeom = useMemo(() => createLeafGeometry(0.92, 0.4, stemColor), [stemColor]);
  const midLeafGeom = useMemo(() => createLeafGeometry(1.05, 0.45, stemColor), [stemColor]);
  const lowerLeafGeom = useMemo(() => createLeafGeometry(0.88, 0.38, stemColor), [stemColor]);

  useEffect(() => {
    return () => {
      material.dispose();
      receptacleGeom.dispose();
      sepalGeom.dispose();
      stemGeom.dispose();
      upperLeafGeom.dispose();
      midLeafGeom.dispose();
      lowerLeafGeom.dispose();
    };
  }, [material, receptacleGeom, sepalGeom, stemGeom, upperLeafGeom, midLeafGeom, lowerLeafGeom]);

  return (
    <group position={[0, 0, 0]}>
      <group position={[0, 0.01, 0]}>
        <mesh geometry={receptacleGeom} material={material} castShadow receiveShadow />
      </group>

      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 5 + 0.3;
        const radius = 0.11;
        return (
          <group
            key={`sepal-${i}`}
            position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
            rotation={[0, angle, 0]}
          >
            <mesh geometry={sepalGeom} material={material} castShadow receiveShadow />
          </group>
        );
      })}

      <mesh geometry={stemGeom} material={material} castShadow receiveShadow />

      <group position={[0.02, -1.15, 0.01]} rotation={[0.25, 0.85, -0.42]}>
        <mesh geometry={upperLeafGeom} material={material} castShadow receiveShadow />
      </group>
      <group position={[-0.02, -2.05, -0.01]} rotation={[-0.2, -2.2, -0.38]}>
        <mesh geometry={midLeafGeom} material={material} castShadow receiveShadow />
      </group>
      <group position={[0.01, -2.95, 0.01]} rotation={[0.35, 0.3, -0.45]}>
        <mesh geometry={lowerLeafGeom} material={material} castShadow receiveShadow />
      </group>
    </group>
  );
};
