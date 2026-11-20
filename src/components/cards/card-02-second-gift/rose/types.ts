export type RoseRevealState = "loading" | "idle" | "blooming" | "revealing" | "completed" | "error";

export interface RoseRevealConfig {
  petalColor: string;
  petalInnerColor: string;
  petalEdgeColor: string;
  stemColor: string;
  backgroundColor: string;
  flowerScale: number;
  bloomDuration: number;
  flyingPetalsCount: number;
  burstSpeed: number;
  fallSpeed: number;
  spinSpeed: number;
  ambientLightIntensity: number;
  messageText: string;
  buttonText: string;
  destinationTarget: "demo-card" | "love-universe-01";
  manualBloomProgress?: number;
  inspectionMode?: boolean;
}

export interface RoseAssetConfig {
  schemaVersion: 1;
  assetId: "rose-reveal-01";
  assetVersion: string;
  appearance: {
    color: string;
    roughness: number;
    metalness: number;
  };
  transform: {
    scale: number;
    rotationDeg: [number, number, number];
  };
  motion: {
    float: { enabled: boolean; amplitude: number; speed: number };
    heartbeat: { enabled: boolean; strength: number; bpm: number };
    spin: { enabled: boolean; speedDegPerSecond: number };
  };
  roseReveal: RoseRevealConfig;
}

export interface PetalLayerDefinition {
  layerIndex: number;
  count: number;
  radius: number;
  length: number;
  width: number;
  cupDepth: number;
  archDepth: number;
  curlEdge: number;
  ruffleAmp: number;
  baseTiltDeg: number;
  openTiltDeg: number;
  bloomStart: number;
  bloomEnd: number;
}

export interface FlyingPetalData {
  spawnTime: number;
  x0: number;
  y0: number;
  z0: number;
  vx: number;
  vy: number;
  vz: number;
  fallSpeed: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  initialRotX: number;
  initialRotY: number;
  initialRotZ: number;
  scale: number;
  phase: number;
}
