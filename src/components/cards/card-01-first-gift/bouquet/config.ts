export interface BouquetPhotoItem {
  id: string;
  url: string;
  cropX?: number;
  cropY?: number;
  customRotation?: number;
  customScale?: number;
}

export interface BouquetConfig {
  photos: BouquetPhotoItem[];
  bouquetScale: number;
  holdDuration: number;
  burstSpeed: number;
  burstSpread: number;
  burstRotation: number;
  ringColor: string;
  enableStars: boolean;
  starDensity: number;
  starSpeed: number;
  glowIntensity: number;
  guideTextIdle: string;
  guideTextReady: string;
}
