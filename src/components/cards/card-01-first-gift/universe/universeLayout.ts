import { UniverseElementLayout, UniverseLayoutResult } from "./types";
import { generateStratifiedHeights } from "./motionUtils";

export function createRNG(seed: number) {
  let s = Math.floor(Math.abs(seed)) >>> 0;
  if (s === 0) s = 1337;

  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GenerateUniverseLayoutParams {
  wishes: string[];
  photoUrls: string[];
  textCount: number;
  photoCount: number;
  heartCount: number;
  cloudWidth: number;
  cloudHeight: number;
  cloudDepth: number;
  seed: number;
}

export function generateUniverseLayout({
  wishes,
  photoUrls,
  textCount,
  photoCount,
  heartCount,
  cloudWidth,
  cloudHeight,
  cloudDepth,
  seed,
}: GenerateUniverseLayoutParams): UniverseLayoutResult {
  const rng = createRNG(seed);
  const safeWishes = wishes.length > 0 ? wishes : ["Yêu cậu"];
  const safePhotos = photoUrls.length > 0 ? photoUrls : [];

  const textItems: UniverseElementLayout[] = [];
  const photoItems: UniverseElementLayout[] = [];
  const heartItems: UniverseElementLayout[] = [];

  const randRange = (min: number, max: number) => min + rng() * (max - min);
  const placedAnchors: Array<{ x: number; y: number; z: number; r: number }> = [];

  const isTooClose = (x: number, y: number, z: number, minDist: number, checkScreenProj = false) => {
    for (let i = 0; i < placedAnchors.length; i++) {
      const p = placedAnchors[i];
      const dx = x - p.x;
      const dy = y - p.y;
      const dz = (z - p.z) * 0.7;
      const distSq = dx * dx + dy * dy + dz * dz;
      const combined = minDist + p.r;
      if (distSq < combined * combined) return true;

      if (checkScreenProj) {
        const pCamDist = Math.max(0.1, 7.5 - p.z);
        const curCamDist = Math.max(0.1, 7.5 - z);
        const dProjX = Math.abs(x / curCamDist - p.x / pCamDist) * 7.0;
        const dProjY = Math.abs(y / curCamDist - p.y / pCamDist) * 7.0;
        if (dProjX < 0.65 && dProjY < 0.28) return true;
      }
    }
    return false;
  };

  const halfW = cloudWidth * 0.5;
  const halfD = cloudDepth * 0.5;

  const actualPhotoCount = Math.max(1, Math.min(photoCount, 40));
  const photoHeights = generateStratifiedHeights(actualPhotoCount, cloudHeight, rng, 2.0, 0.7);
  for (let i = 0; i < actualPhotoCount; i++) {
    const layerRand = rng();
    const layerType: "near" | "mid" | "far" =
      layerRand < 0.22 ? "near" : layerRand < 0.72 ? "mid" : "far";

    let bestX = 0;
    const bestY = photoHeights[i];
    let bestZ = 0;
    let attempts = 0;

    while (attempts < 12) {
      attempts++;
      let x = 0;
      let z = 0;
      if (layerType === "near") {
        const side = rng() > 0.5 ? 1 : -1;
        x = side * randRange(1.55, halfW * 0.98);
        z = randRange(halfD * 0.35, halfD * 0.85);
      } else if (layerType === "mid") {
        const rawX = randRange(-halfW * 0.8, halfW * 0.8);
        x = Math.abs(rawX) < 0.5 ? (rawX >= 0 ? rawX + 0.6 : rawX - 0.6) : rawX;
        z = randRange(-halfD * 0.2, halfD * 0.35);
      } else {
        x = randRange(-halfW * 0.85, halfW * 0.85);
        z = randRange(-halfD * 0.85, -halfD * 0.2);
      }
      bestX = x;
      bestZ = z;
      if (!isTooClose(x, bestY, z, 0.65)) break;
    }

    placedAnchors.push({ x: bestX, y: bestY, z: bestZ, r: 0.55 });
    const scaleVal =
      layerType === "near"
        ? randRange(1.1, 1.3)
        : layerType === "mid"
        ? randRange(0.85, 1.05)
        : randRange(0.58, 0.75);

    photoItems.push({
      id: `photo_${i}`,
      type: "photo",
      position: [bestX, bestY, bestZ],
      rotation: [randRange(-0.08, 0.08), randRange(-0.14, 0.14), randRange(-0.04, 0.04)],
      scale: [scaleVal, scaleVal, scaleVal],
      layer: layerType,
      phase: randRange(0, Math.PI * 2),
      floatSpeed: randRange(0.4, 0.8),
      content: safePhotos.length > 0 ? safePhotos[i % safePhotos.length] : "",
    });
  }

  const actualTextCount = Math.max(1, Math.min(textCount, 220));
  const textHeights = generateStratifiedHeights(actualTextCount, cloudHeight, rng, 2.0, 0.75);
  for (let i = 0; i < actualTextCount; i++) {
    const layerRand = rng();
    const layerType: "near" | "mid" | "far" =
      layerRand < 0.18 ? "near" : layerRand < 0.65 ? "mid" : "far";

    let bestX = 0;
    const bestY = textHeights[i];
    let bestZ = 0;
    let attempts = 0;

    while (attempts < 20) {
      attempts++;
      let x = 0;
      let z = 0;
      if (layerType === "near") {
        const side = rng() > 0.5 ? 1 : -1;
        x = side * randRange(1.25, halfW * 1.05);
        z = randRange(halfD * 0.35, halfD * 0.9);
      } else if (layerType === "mid") {
        x = randRange(-halfW * 0.85, halfW * 0.85);
        z = randRange(-halfD * 0.2, halfD * 0.35);
      } else {
        x = randRange(-halfW * 0.95, halfW * 0.95);
        z = randRange(-halfD * 0.9, -halfD * 0.2);
      }
      bestX = x;
      bestZ = z;
      if (!isTooClose(x, bestY, z, 0.42, true)) break;
    }

    placedAnchors.push({ x: bestX, y: bestY, z: bestZ, r: 0.32 });
    const scaleBase =
      layerType === "near"
        ? randRange(1.45, 1.85)
        : layerType === "mid"
        ? randRange(0.85, 1.15)
        : randRange(0.42, 0.65);

    textItems.push({
      id: `text_${i}`,
      type: "text",
      position: [bestX, bestY, bestZ],
      rotation: [randRange(-0.08, 0.08), randRange(-0.14, 0.14), randRange(-0.04, 0.04)],
      scale: [scaleBase, scaleBase, scaleBase],
      layer: layerType,
      phase: randRange(0, Math.PI * 2),
      floatSpeed: randRange(0.35, 0.85),
      content: safeWishes[i % safeWishes.length],
    });
  }

  const actualHeartCount = Math.max(1, Math.min(heartCount, 60));
  const heartHeights = generateStratifiedHeights(actualHeartCount, cloudHeight, rng, 2.0, 0.75);
  for (let i = 0; i < actualHeartCount; i++) {
    const layerRand = rng();
    const layerType: "near" | "mid" | "far" =
      layerRand < 0.25 ? "near" : layerRand < 0.75 ? "mid" : "far";

    const y = heartHeights[i];
    let x = 0;
    let z = 0;
    if (layerType === "near") {
      x = randRange(-halfW * 0.85, halfW * 0.85);
      z = randRange(halfD * 0.3, halfD * 0.85);
    } else if (layerType === "mid") {
      x = randRange(-halfW * 0.75, halfW * 0.75);
      z = randRange(-halfD * 0.2, halfD * 0.3);
    } else {
      x = randRange(-halfW * 0.85, halfW * 0.85);
      z = randRange(-halfD * 0.85, -halfD * 0.2);
    }

    const heartScale =
      layerType === "near"
        ? randRange(0.65, 0.88)
        : layerType === "mid"
        ? randRange(0.42, 0.6)
        : randRange(0.24, 0.35);

    heartItems.push({
      id: `heart_${i}`,
      type: "heart",
      position: [x, y, z],
      rotation: [randRange(-0.25, 0.25), randRange(-0.25, 0.25), randRange(-0.35, 0.35)],
      scale: [heartScale, heartScale, heartScale],
      layer: layerType,
      phase: randRange(0, Math.PI * 2),
      floatSpeed: randRange(0.45, 1.05),
      content: "",
    });
  }

  return { textItems, photoItems, heartItems };
}
