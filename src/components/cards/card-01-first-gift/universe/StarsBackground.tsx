"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface StarsBackgroundProps {
  quality?: "low" | "high";
  paused?: boolean;
}

function createStarSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 245, 210, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 230, 160, 0.35)");
    gradient.addColorStop(0.8, "rgba(200, 220, 255, 0.08)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    float twinkle = 0.7 + 0.3 * sin(uTime * 0.9 + aPhase);
    vTwinkle = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pointSize = aSize * twinkle * (220.0 / -mvPosition.z);
    gl_PointSize = clamp(pointSize, 0.8, 14.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = /* glsl */ `
  uniform sampler2D uStarTexture;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec4 tex = texture2D(uStarTexture, gl_PointCoord);
    if (tex.a < 0.02) discard;
    gl_FragColor = vec4(vColor, tex.a * vTwinkle);
  }
`;

export const StarsBackground: React.FC<StarsBackgroundProps> = ({
  quality = "high",
  paused = false,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef<number>(0);

  const starTexture = useMemo(() => createStarSpriteTexture(), []);

  const { geometry } = useMemo(() => {
    const starCount = quality === "low" ? 850 : 2200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);

    const warmPalette = [
      new THREE.Color("#FFFFFF"),
      new THREE.Color("#FFFDF0"),
      new THREE.Color("#FFF8E0"),
      new THREE.Color("#FFE8A3"),
      new THREE.Color("#FFDF85"),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 18 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.95;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const col = warmPalette[Math.floor(Math.random() * warmPalette.length)];
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      const isHeroStar = Math.random() < 0.08;
      sizes[i] = isHeroStar ? 2.6 + Math.random() * 1.6 : 0.8 + Math.random() * 1.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    return { geometry: geo };
  }, [quality]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStarTexture: { value: starTexture },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [starTexture]);

  useFrame((_, delta) => {
    if (!paused && materialRef.current) {
      timeRef.current += Math.min(delta, 0.1);
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[52, 24, 24]} />
        <meshBasicMaterial color="#061525" side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <points ref={pointsRef} geometry={geometry} material={shaderMaterial}>
        <primitive object={shaderMaterial} ref={materialRef} attach="material" />
      </points>
    </group>
  );
};
