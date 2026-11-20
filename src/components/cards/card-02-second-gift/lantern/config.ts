export interface SequenceLanternItem {
  id: string;
  wishText: string;
  color: string;
  sizeMultiplier: number;
}

export interface SkyLantern3DFireworksConfig {
  mode: "single" | "sequence";
  wishText: string;
  colorPreset: string;
  lanternColor: string;
  sizeMultiplier: number;
  starCount: number;
  speedMultiplier: number;
  soundEnabled: boolean;
  sequenceStartIndex: number;
  sequenceItems: SequenceLanternItem[];
  autoLaunchIntervalSec: number;
  autoLaunchStarters: boolean;
  showHud: boolean;
  hintText: string;
}

export const MAX_WISH_LENGTH = 64;
export const MAX_STARS = 4000;

export const DEFAULT_SEQUENCE_ITEMS: SequenceLanternItem[] = [
  { id: "seq-1", wishText: "Mong cậu lúc nào cũng bình an, vui vẻ", color: "#ff9c38", sizeMultiplier: 0.45 },
  {
    id: "seq-2",
    wishText: "Mỗi ngày trôi qua đều rạng rỡ như nụ cười của cậu",
    color: "#ff4d4d",
    sizeMultiplier: 0.45,
  },
  { id: "seq-3", wishText: "Mọi điều ước của cậu đều sớm thành hiện thực", color: "#ff6fa8", sizeMultiplier: 0.6 },
  { id: "seq-4", wishText: "Mong năm nào tụi mình cũng có nhau", color: "#2ce5b5", sizeMultiplier: 0.4 },
  { id: "seq-5", wishText: "Và điều ước lớn nhất của tớ chính là cậu ✨", color: "#a66bff", sizeMultiplier: 0.55 },
];

export const defaults: SkyLantern3DFireworksConfig = {
  mode: "sequence",
  wishText: "Gửi sao trời dẫn lối, mong cậu luôn bình yên",
  colorPreset: "#ff9c38",
  lanternColor: "#ff9c38",
  sizeMultiplier: 1.0,
  starCount: 1400,
  speedMultiplier: 1.0,
  soundEnabled: true,
  sequenceStartIndex: 1,
  sequenceItems: DEFAULT_SEQUENCE_ITEMS.map((item) => ({ ...item })),
  autoLaunchIntervalSec: 0,
  autoLaunchStarters: false,
  showHud: true,
  hintText: "✦ Chạm vào bầu trời đêm để thả một chiếc đèn lồng ✦",
};
