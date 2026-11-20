import type { RoseAssetConfig, RoseRevealConfig } from "./types";

export const defaultRoseRevealConfig: RoseRevealConfig = {
  petalColor: "#F48FB1",
  petalInnerColor: "#C2185B",
  petalEdgeColor: "#FFE4E8",
  stemColor: "#4A7C59",
  backgroundColor: "#190B17",
  flowerScale: 1.0,
  bloomDuration: 1.8,
  flyingPetalsCount: 75,
  burstSpeed: 1.8,
  fallSpeed: 0.85,
  spinSpeed: 1.8,
  ambientLightIntensity: 0.85,
  messageText: "Có một bí mật nhỏ tớ giấu riêng cho cậu",
  buttonText: "Chạm nhẹ để mở quà nha ♡",
  destinationTarget: "demo-card",
  manualBloomProgress: -1,
  inspectionMode: false,
};

export const roseReveal01DefaultConfig: RoseAssetConfig = {
  schemaVersion: 1,
  assetId: "rose-reveal-01",
  assetVersion: "1.0.0",
  appearance: {
    color: "#F48FB1",
    roughness: 0.45,
    metalness: 0.05,
  },
  transform: {
    scale: 1.0,
    rotationDeg: [0, 0, 0],
  },
  motion: {
    float: { enabled: true, amplitude: 0.05, speed: 0.8 },
    heartbeat: { enabled: false, strength: 0, bpm: 60 },
    spin: { enabled: false, speedDegPerSecond: 0 },
  },
  roseReveal: defaultRoseRevealConfig,
};
