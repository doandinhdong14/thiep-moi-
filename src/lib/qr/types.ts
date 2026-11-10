export interface QrText {
  id: string;
  text: string;
  x: number; // in artboard coordinate (0 to 1000)
  y: number; // in artboard coordinate (0 to 1000)
  width?: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  hasBackground?: boolean;
  backgroundColor?: string;
  align: "left" | "center" | "right";
  styleId?: string;
  zIndex: number;
}

export interface QrIcon {
  id: string;
  emoji: string;
  assetId?: string;
  x: number; // in artboard coordinate (0 to 1000)
  y: number; // in artboard coordinate (0 to 1000)
  size: number;
  rotation: number;
  zIndex: number;
}

export interface QrDesign {
  giftId: string;
  presetId: string;
  moduleColor: string;
  backgroundUrl?: string;
  backgroundFit?: "cover" | "contain";
  texts: QrText[];
  icons: QrIcon[];
  revision: number;
}

