"use client";

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  createCorePetalGeometry,
  createMidPetalGeometry,
  createOuterPetalGeometry,
} from "./roseGeometry";
import type { PetalLayerDefinition } from "./types";

export interface RosePetalMeshProps {
  bloomProgress: number;
  petalColor: string;
  petalInnerColor: string;
  petalEdgeColor: string;
  roughness?: number;
  metalness?: number;
}

interface DetailedLayerDefinition extends PetalLayerDefinition {
  yBase: number;
  family: "core" | "mid" | "outer";
  layerPhase: number;
}

const DETAILED_LAYERS: DetailedLayerDefinition[] = [
  {
    layerIndex: 0,
    count: 3,
    radius: 0.022,
    yBase: 0.07,
    length: 0.94,
    width: 0.48,
    cupDepth: 0.28,
    archDepth: 0.12,
    curlEdge: 0.03,
    ruffleAmp: 0.015,
    baseTiltDeg: -22,
    openTiltDeg: 12,
    bloomStart: 0.45,
    bloomEnd: 1.0,
    family: "core",
    layerPhase: 0.0,
  },
  {
    layerIndex: 1,
    count: 4,
    radius: 0.046,
    yBase: 0.04,
    length: 1.08,
    width: 0.62,
    cupDepth: 0.32,
    archDepth: 0.16,
    curlEdge: 0.05,
    ruffleAmp: 0.02,
    baseTiltDeg: -16,
    openTiltDeg: 26,
    bloomStart: 0.32,
    bloomEnd: 0.9,
    family: "core",
    layerPhase: 0.45,
  },
  {
    layerIndex: 2,
    count: 5,
    radius: 0.075,
    yBase: 0.015,
    length: 1.22,
    width: 0.78,
    cupDepth: 0.36,
    archDepth: 0.22,
    curlEdge: 0.1,
    ruffleAmp: 0.028,
    baseTiltDeg: -10,
    openTiltDeg: 40,
    bloomStart: 0.2,
    bloomEnd: 0.8,
    family: "mid",
    layerPhase: 0.9,
  },
  {
    layerIndex: 3,
    count: 6,
    radius: 0.105,
    yBase: -0.01,
    length: 1.35,
    width: 0.94,
    cupDepth: 0.38,
    archDepth: 0.24,
    curlEdge: 0.15,
    ruffleAmp: 0.035,
    baseTiltDeg: -5,
    openTiltDeg: 54,
    bloomStart: 0.08,
    bloomEnd: 0.7,
    family: "mid",
    layerPhase: 1.4,
  },
  {
    layerIndex: 4,
    count: 7,
    radius: 0.135,
    yBase: -0.035,
    length: 1.48,
    width: 1.08,
    cupDepth: 0.4,
    archDepth: 0.26,
    curlEdge: 0.22,
    ruffleAmp: 0.045,
    baseTiltDeg: 0,
    openTiltDeg: 68,
    bloomStart: 0.0,
    bloomEnd: 0.6,
    family: "outer",
    layerPhase: 2.1,
  },
];

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export const RosePetalMesh: React.FC<RosePetalMeshProps> = ({
  bloomProgress,
  petalColor,
  petalInnerColor,
  petalEdgeColor,
  roughness = 0.44,
  metalness = 0.04,
}) => {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness,
        metalness,
        side: THREE.DoubleSide,
        shadowSide: THREE.DoubleSide,
      }),
    [roughness, metalness]
  );

  const layerGeometries = useMemo(
    () =>
      DETAILED_LAYERS.map((def) => {
        const commonOpts = {
          width: def.width,
          length: def.length,
          cupDepth: def.cupDepth,
          archDepth: def.archDepth,
          curlEdge: def.curlEdge,
          ruffleAmp: def.ruffleAmp,
          innerColor: petalInnerColor,
          mainColor: petalColor,
          edgeColor: petalEdgeColor,
        };
        if (def.family === "core") {
          return createCorePetalGeometry({
            ...commonOpts,
            wrapAngleRad: 1.95 - def.layerIndex * 0.15,
          });
        }
        if (def.family === "mid") {
          return createMidPetalGeometry({
            ...commonOpts,
            wrapAngleRad: 1.45 - (def.layerIndex - 2) * 0.12,
          });
        }
        return createOuterPetalGeometry({
          ...commonOpts,
          wrapAngleRad: 1.18,
        });
      }),
    [petalColor, petalInnerColor, petalEdgeColor]
  );

  useEffect(() => {
    return () => {
      layerGeometries.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [layerGeometries, material]);

  const petalRefs = useRef<(THREE.Group | null)[][]>(
    DETAILED_LAYERS.map((def) => new Array(def.count).fill(null))
  );

  useFrame(() => {
    const P = Math.max(0, Math.min(1, bloomProgress));

    DETAILED_LAYERS.forEach((layerDef, lIdx) => {
      const tLayer = smoothstep(layerDef.bloomStart, layerDef.bloomEnd, P);
      const currentTiltDeg = THREE.MathUtils.lerp(layerDef.baseTiltDeg, layerDef.openTiltDeg, tLayer);
      const tiltRad = THREE.MathUtils.degToRad(currentTiltDeg);

      const petals = petalRefs.current[lIdx];
      if (!petals) return;

      petals.forEach((pGroup, pIdx) => {
        if (!pGroup) return;
        const seedWobble = Math.sin(pIdx * 2.1 + lIdx * 1.7) * 0.015 * (1 - tLayer * 0.5);
        pGroup.rotation.x = tiltRad + seedWobble;
        pGroup.rotation.z = Math.sin(pIdx * 1.9 + lIdx) * 0.02 * tLayer;
      });
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {DETAILED_LAYERS.map((layerDef, lIdx) => {
        const geom = layerGeometries[lIdx];
        const staggerAngle = (lIdx * 137.5 * Math.PI) / 180 + layerDef.layerPhase;

        return (
          <group key={`layer-${lIdx}`}>
            {Array.from({ length: layerDef.count }).map((_, pIdx) => {
              const theta = (pIdx / layerDef.count) * Math.PI * 2 + staggerAngle;
              const xPos = Math.sin(theta) * layerDef.radius;
              const zPos = Math.cos(theta) * layerDef.radius;

              return (
                <group
                  key={`petal-${lIdx}-${pIdx}`}
                  position={[xPos, layerDef.yBase, zPos]}
                  rotation={[0, theta, 0]}
                >
                  <group
                    ref={(el) => {
                      if (!petalRefs.current[lIdx]) petalRefs.current[lIdx] = [];
                      petalRefs.current[lIdx][pIdx] = el;
                    }}
                  >
                    <mesh geometry={geom} material={material} castShadow receiveShadow />
                  </group>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};
