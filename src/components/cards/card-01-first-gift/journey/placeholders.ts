import { DEFAULT_CARD01_PHOTOS } from "../universe/placeholders";

export function getCosmicPlaceholderUrl(index: number): string {
  const len = DEFAULT_CARD01_PHOTOS.length;
  return DEFAULT_CARD01_PHOTOS[((index % len) + len) % len];
}
