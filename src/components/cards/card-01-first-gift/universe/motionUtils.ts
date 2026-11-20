export const DEFAULT_WRAP_BUFFER = 2.0;

export interface WrapBounds {
  yMin: number;
  yMax: number;
  span: number;
  buffer: number;
}

export function getWrapBounds(cloudHeight: number, buffer = DEFAULT_WRAP_BUFFER): WrapBounds {
  const halfH = cloudHeight * 0.5;
  const yMin = -halfH - buffer;
  const yMax = halfH + buffer;
  const span = yMax - yMin;
  return { yMin, yMax, span, buffer };
}

export function wrapY(
  baseY: number,
  driftOffset: number,
  cloudHeight: number,
  buffer = DEFAULT_WRAP_BUFFER
): number {
  const { yMin, span } = getWrapBounds(cloudHeight, buffer);
  const rawY = baseY - driftOffset;
  return ((((rawY - yMin) % span) + span) % span) + yMin;
}

export function generateStratifiedHeights(
  count: number,
  cloudHeight: number,
  rng: () => number,
  buffer = DEFAULT_WRAP_BUFFER,
  jitterFraction = 0.75
): number[] {
  if (count <= 0) return [];
  const { yMin, span } = getWrapBounds(cloudHeight, buffer);
  const binSize = span / count;

  const heights: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const jitter = (rng() - 0.5) * binSize * Math.max(0, Math.min(0.85, jitterFraction));
    heights[i] = yMin + (i + 0.5) * binSize + jitter;
  }

  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = heights[i];
    heights[i] = heights[j];
    heights[j] = temp;
  }

  return heights;
}
