export interface UniverseDecorationGroup {
  id: string;
  type: "heart" | "star3d" | "giftbox";
  name: string;
  count: number;
  color: string;
  scale: number;
  spinSpeed: number;
  roughness?: number;
  enabled: boolean;
  driftEnabled?: boolean;
  driftSpeed?: number;
}

export interface UniverseConfig {
  wishes: string[];
  textCount: number;
  photoCount: number;
  heartCount: number;
  cloudWidth: number;
  cloudHeight: number;
  cloudDepth: number;
  rotationSpeed: number;
  textColor: string;
  glowIntensity: number;
  heartColor: string;
  seed: number;
  showIntro: boolean;
  glowEnabled?: boolean;
  glowSpread?: number;
  glowColor?: string;
  textScaleFactor?: number;
  photoScaleFactor?: number;
  heartScaleFactor?: number;
  heartRoughness?: number;
  heartSpinSpeed?: number;
  heartFloatAmp?: number;
  driftEnabled?: boolean;
  driftSpeed?: number;
  globalSpeedMultiplier?: number;
  textDriftEnabled?: boolean;
  textDriftSpeed?: number;
  photoDriftEnabled?: boolean;
  photoDriftSpeed?: number;
  heartDriftEnabled?: boolean;
  heartDriftSpeed?: number;
  decorations?: UniverseDecorationGroup[];
}

export interface AssetConfig {
  schemaVersion: 1;
  assetId: string;
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
  universe?: UniverseConfig;
}

export interface UniverseElementLayout {
  id: string;
  type: "text" | "photo" | "heart" | "star3d" | "giftbox";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  layer: "near" | "mid" | "far";
  phase: number;
  floatSpeed: number;
  content: string;
  groupId?: string;
  color?: string;
  roughness?: number;
}

export interface UniverseLayoutResult {
  textItems: UniverseElementLayout[];
  photoItems: UniverseElementLayout[];
  heartItems: UniverseElementLayout[];
}
