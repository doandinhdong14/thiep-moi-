"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RosePetalMesh } from "./RosePetalMesh";
import { RoseStemAssembly } from "./RoseStemAssembly";
import { FlyingPetals } from "./FlyingPetals";
import { AmbientDustParticles } from "./AmbientDustParticles";
import type { RoseRevealConfig, RoseRevealState } from "./types";

export interface RoseRevealSceneProps {
  config: RoseRevealConfig;
  state: RoseRevealState;
  bloomProgress: number;
  flightProgress: number;
  paused?: boolean;
  onTriggerBloom: () => void;
  reducedMotion?: boolean;
}

export const RoseRevealScene: React.FC<RoseRevealSceneProps> = ({
  config,
  state,
  bloomProgress,
  flightProgress,
  paused = false,
  onTriggerBloom,
  reducedMotion = false,
}) => {
  const { camera } = useThree();
  const flowerGroupRef = useRef<THREE.Group>(null);
  const isInteractive = state === "idle";

  const effectiveBloomProgress =
    config.manualBloomProgress !== undefined && config.manualBloomProgress >= 0
      ? config.manualBloomProgress
      : bloomProgress;

  const baseCamPos = useMemo(() => new THREE.Vector3(0, 1.85, 7.2), []);
  const targetCamPos = useMemo(() => new THREE.Vector3(0, 2.1, 5.6), []);

  useFrame((r3fState, delta) => {
    if (paused) return;
    const time = r3fState.clock.getElapsedTime();
    const flower = flowerGroupRef.current;

    if (flower) {
      const baseTiltX = 0.28;
      if (state === "idle") {
        flower.rotation.z = Math.sin(time * 0.85) * 0.012;
        flower.rotation.x = baseTiltX + Math.cos(time * 0.65) * 0.008;
        flower.position.y = 0.2 + Math.sin(time * 1.1) * 0.015;
      } else {
        flower.rotation.z = THREE.MathUtils.lerp(flower.rotation.z, 0, delta * 3);
        flower.rotation.x = THREE.MathUtils.lerp(flower.rotation.x, baseTiltX, delta * 3);
        flower.position.y = THREE.MathUtils.lerp(flower.position.y, 0.2, delta * 3);
      }
    }

    if (!reducedMotion) {
      if (state === "blooming" || state === "revealing" || state === "completed") {
        const tDolly = Math.min(1, Math.max(0, flightProgress * 1.25));
        const eased = tDolly * tDolly * (3 - 2 * tDolly);
        camera.position.lerpVectors(baseCamPos, targetCamPos, eased);
      } else {
        const mouseX = r3fState.pointer.x * 0.12;
        const mouseY = r3fState.pointer.y * 0.08;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, baseCamPos.x + mouseX, delta * 2.5);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, baseCamPos.y + mouseY, delta * 2.5);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseCamPos.z, delta * 2.5);
      }
      camera.lookAt(0, -0.45, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={config.ambientLightIntensity * 0.85} color="#FFE4E8" />
      <directionalLight
        position={[2.5, 5.0, 4.0]}
        intensity={1.35}
        color="#FFF5F5"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3.0, -0.5, 2.5]} intensity={0.45} color="#DDA0DD" />
      <directionalLight position={[0, 3.2, -4.2]} intensity={0.92} color="#FFE4E8" />

      <AmbientDustParticles count={36} color="#FFE4E8" speed={0.32} />

      <FlyingPetals
        active={flightProgress > 0}
        flightProgress={flightProgress}
        count={config.flyingPetalsCount}
        burstSpeed={config.burstSpeed}
        fallSpeed={config.fallSpeed}
        spinSpeed={config.spinSpeed}
        petalColor={config.petalColor}
        petalInnerColor={config.petalInnerColor}
        petalEdgeColor={config.petalEdgeColor}
        flowerScale={config.flowerScale}
      />

      <group
        ref={flowerGroupRef}
        position={[0, 0.2, 0]}
        scale={[config.flowerScale, config.flowerScale, config.flowerScale]}
      >
        {isInteractive && (
          <mesh
            position={[0, 0.65, 0]}
            onPointerDown={(e) => {
              e.stopPropagation();
              onTriggerBloom();
            }}
            onPointerOver={() => {
              if (typeof document !== "undefined") document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              if (typeof document !== "undefined") document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        )}

        <RoseStemAssembly stemColor={config.stemColor} />

        <group position={[0, 0, 0]}>
          <RosePetalMesh
            bloomProgress={effectiveBloomProgress}
            petalColor={config.petalColor}
            petalInnerColor={config.petalInnerColor}
            petalEdgeColor={config.petalEdgeColor}
          />
        </group>
      </group>
    </>
  );
};
