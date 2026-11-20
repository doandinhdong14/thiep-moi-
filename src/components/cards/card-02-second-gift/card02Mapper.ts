import type { InvitationContent } from "@/lib/templates/schema";
import type { CosmicBirthdayJourneyConfig, CardPhotoItem } from "../card-01-first-gift/journey/config";
import { roseReveal01DefaultConfig } from "./rose/presets";
import type { RoseAssetConfig } from "./rose/types";
import {
  DEFAULT_SEQUENCE_ITEMS,
  defaults as lanternDefaults,
  type SkyLantern3DFireworksConfig,
  type SequenceLanternItem,
} from "./lantern/config";

export const CARD02_DEFAULT_BGM_URL = "/cards/card-02-second-gift/audio/gift-bgm.mp3";

export const CARD02_DEFAULT_PHOTOS = [
  "/cards/card-02-second-gift/photos/photo-1-b83de51b.jpg",
  "/cards/card-02-second-gift/photos/photo-2-bbe4be38.jpg",
  "/cards/card-02-second-gift/photos/photo-3-d366c1fd.jpg",
  "/cards/card-02-second-gift/photos/photo-4-b95b64fd.jpg",
  "/cards/card-02-second-gift/photos/photo-5-bcf7eb58.jpg",
  "/cards/card-02-second-gift/photos/photo-6-ba62211a.jpg",
];

export const CARD02_DEFAULT_CAPTIONS = [
  "Khoảnh khắc tớ nhận ra mình thích cậu mất rồi",
  "Nụ cười làm tớ đứng hình mất mấy giây",
  "Mùa hè năm ấy dịu dàng vì có cậu",
  "Những lần tớ lén nhìn cậu mà cậu chẳng hay",
  "Cứ ở cạnh cậu là thấy bình yên lạ",
  "Giữ trọn khoảnh khắc này cho riêng tụi mình ✨",
];

export const CARD02_DEFAULT_WISHES = [
  "Mong cậu lúc nào cũng bình an, vui vẻ",
  "Mỗi ngày trôi qua đều rạng rỡ như nụ cười của cậu",
  "Mọi điều ước của cậu đều sớm thành hiện thực",
  "Mong năm nào tụi mình cũng có nhau",
  "Và điều ước lớn nhất của tớ chính là cậu ✨",
];

export const CARD02_DEFAULT_TEXTS = {
  recipientName: "Minh Anh",
  titleSubtitle: "BÍ MẬT DÀNH RIÊNG CHO",
  roseMessageText: "Có một bí mật nhỏ tớ giấu riêng cho cậu",
  roseButtonText: "Chạm nhẹ để mở quà nha ♡",
  introLinesText:
    "Hôm nay|Giữa bầu trời đầy sao này|Tớ có một điều giấu kín bấy lâu|Chỉ muốn nói cho mình cậu nghe thôi",
  candleLinesText:
    "Cậu nhắm mắt lại một chút nhé|Nghĩ về điều cậu mong ước nhất lúc này|Và rồi...",
  candleHintText: "Chạm nhẹ vào ngọn nến để tớ gửi nó lên trời sao",
  giftHintText: "Chạm để mở hộp quà nhỏ của tớ",
  giftLetter:
    "Cảm ơn cậu vì đã xuất hiện thật dịu dàng trong những ngày qua của tớ||Có những người giống như những vì sao|Lặng lẽ tỏa sáng ở đó thôi cũng đủ làm cả bầu trời của tớ rực rỡ hơn rồi||Thực ra tớ đã thích cậu từ lâu lắm rồi|Giờ mới dám mượn mấy dòng này để nói ra||Mong rằng những ngày sắp tới|Cậu sẽ luôn bình an|Giữ trọn nụ cười rạng rỡ như thế|Và cho phép tớ được ở cạnh thương cậu thật nhiều nhé||Thích cậu rất nhiều ✨",
  upliftLinesText: "Phía trước|Vẫn còn thật nhiều điều đẹp đẽ|Tớ mong mình có thể cùng cậu đi qua",
  endingLinesText: "Thế giới nhỏ này|Tớ làm riêng cho cậu",
  portalCtaText: "Cùng tớ thả đèn trời ước nguyện nhé ✨",
  lanternHintText: "✦ Chạm vào bầu trời đêm để thả một chiếc đèn lồng ✦",
};

/**
 * Maps user-editable content (text, photos, captions, wishes, music) from InvitationContent
 * into Card 02's 3-stage configs while keeping ALL 3D, particle, color, and motion effect
 * parameters strictly locked to `saved-card.json`.
 */
export function buildCard02StageConfigs(content: InvitationContent): {
  roseAssetConfig: RoseAssetConfig;
  journeyConfig: CosmicBirthdayJourneyConfig;
  lanternConfig: SkyLantern3DFireworksConfig;
  portalCtaText: string;
  musicUrl: string | null;
} {
  const c02 = content.card02 || {};

  // Recipient name resolution from people[]
  const people = Array.isArray(content.people) ? content.people : [];
  const recipientPerson =
    people.find((p) => ["recipient", "bride", "guest"].includes((p.role || "").toLowerCase())) ||
    (people.length > 1 ? people[1] : people[0]);
  const recipientName = (recipientPerson?.displayName || "").trim() || CARD02_DEFAULT_TEXTS.recipientName;

  // Synced memory photos (cover + galleryUrls, up to 12) or fallback to Card 02's 6 saved photos
  const collectedPhotos: string[] = [];
  const pushUnique = (u?: string) => {
    const clean = (u || "").trim();
    if (clean && !collectedPhotos.includes(clean)) {
      collectedPhotos.push(clean);
    }
  };
  pushUnique(content.coverImageUrl);
  if (Array.isArray(content.galleryUrls)) {
    for (const u of content.galleryUrls) pushUnique(u);
  }
  const effectivePhotos =
    collectedPhotos.length > 0 ? collectedPhotos.slice(0, 12) : CARD02_DEFAULT_PHOTOS;
  const customCaptions = Array.isArray(c02.photoCaptions) ? c02.photoCaptions : [];

  // Stage 1: Card 3 (Rose Reveal 3D) — All visual/bloom/petal physics locked to saved-card.json
  const roseAssetConfig: RoseAssetConfig = {
    ...roseReveal01DefaultConfig,
    roseReveal: {
      ...roseReveal01DefaultConfig.roseReveal,
      petalColor: "#F48FB1",
      petalInnerColor: "#C2185B",
      petalEdgeColor: "#FFE4E8",
      stemColor: "#4A7C59",
      backgroundColor: "#190B17",
      flowerScale: 1,
      bloomDuration: 1.8,
      flyingPetalsCount: 75,
      burstSpeed: 1.8,
      fallSpeed: 0.85,
      spinSpeed: 1.8,
      ambientLightIntensity: 0.85,
      messageText: (c02.roseMessageText || "").trim() || CARD02_DEFAULT_TEXTS.roseMessageText,
      buttonText: (c02.roseButtonText || "").trim() || CARD02_DEFAULT_TEXTS.roseButtonText,
      destinationTarget: "demo-card",
      manualBloomProgress: -1,
      inspectionMode: false,
    },
  };

  // Stage 2: Card 30 (Cosmic Birthday Journey) — Visual/star/meteor params locked to saved-card.json
  const cardPhotos: CardPhotoItem[] = effectivePhotos.slice(0, 8).map((url, idx) => ({
    id: `c02-j-${idx}`,
    imageUrl: url,
    caption:
      (customCaptions[idx] || "").trim() ||
      CARD02_DEFAULT_CAPTIONS[idx % CARD02_DEFAULT_CAPTIONS.length],
    captionPosition: "bottom",
    captionAlign: "center",
    captionColor: "#ffffff",
  }));

  const journeyConfig: CosmicBirthdayJourneyConfig = {
    recipientName,
    titleSubtitle: (content.subtitle || "").trim() || CARD02_DEFAULT_TEXTS.titleSubtitle,
    introLinesText: (c02.introLinesText || "").trim() || CARD02_DEFAULT_TEXTS.introLinesText,
    cardHintIdle: "Chạm để mở khóa những lần tớ rung động",
    cardHintExpanded: "Nhấn vào từng tấm để xem rõ hơn nha",
    cardPhotos,
    candleLinesText: (c02.candleLinesText || "").trim() || CARD02_DEFAULT_TEXTS.candleLinesText,
    candleHintText: (c02.candleHintText || "").trim() || CARD02_DEFAULT_TEXTS.candleHintText,
    enableMicBlow: false,
    giftHintText: (c02.giftHintText || "").trim() || CARD02_DEFAULT_TEXTS.giftHintText,
    giftLetter: (content.message || "").trim() || CARD02_DEFAULT_TEXTS.giftLetter,
    letterAlign: "center",
    letterLineIntervalMs: 960,
    giftImages: [],
    upliftLinesText: (c02.upliftLinesText || "").trim() || CARD02_DEFAULT_TEXTS.upliftLinesText,
    endingLinesText: (c02.endingLinesText || "").trim() || CARD02_DEFAULT_TEXTS.endingLinesText,
    showCurtain: false,
    curtainLinesText: "",
    startScene: 1,
    showSceneNavDots: true,
    backgroundColor: "#080d1a",
    textColor: "#ffffff",
    accentColor: "#a08cff",
    starCount: 340,
    meteorFrequency: 0.8,
    enableAudio: false,
    customBirthdayAudioUrl: "",
    customGiftAudioUrl: "",
    spaceTiltXDeg: 0,
    spaceTiltYDeg: 0,
  };

  // Stage 3: Card 31 (Sky Lantern 3D & Fireworks) — Colors, starCount, sizes, speed locked to saved-card.json
  const userWishes = Array.isArray(content.loveMessages)
    ? content.loveMessages.map((w) => w.trim()).filter(Boolean)
    : [];

  const sequenceItems: SequenceLanternItem[] = DEFAULT_SEQUENCE_ITEMS.map((defItem, idx) => ({
    ...defItem,
    wishText:
      userWishes[idx] ||
      (userWishes.length > 0 ? userWishes[idx % userWishes.length] : defItem.wishText),
  }));

  const lanternConfig: SkyLantern3DFireworksConfig = {
    ...lanternDefaults,
    mode: "sequence",
    wishText: userWishes[0] || lanternDefaults.wishText,
    colorPreset: "#ff9c38",
    lanternColor: "#ff9c38",
    sizeMultiplier: 1,
    starCount: 1400,
    speedMultiplier: 1,
    soundEnabled: true,
    sequenceStartIndex: 1,
    sequenceItems,
    autoLaunchIntervalSec: 0,
    autoLaunchStarters: false,
    showHud: true,
    hintText: (c02.lanternHintText || "").trim() || CARD02_DEFAULT_TEXTS.lanternHintText,
  };

  const portalCtaText = (c02.portalCtaText || "").trim() || CARD02_DEFAULT_TEXTS.portalCtaText;

  const rawMusic = content.features?.backgroundMusicUrl;
  const musicUrl =
    rawMusic === null
      ? null
      : typeof rawMusic === "string" && rawMusic.trim().length > 0
      ? rawMusic.trim()
      : CARD02_DEFAULT_BGM_URL;

  return {
    roseAssetConfig,
    journeyConfig,
    lanternConfig,
    portalCtaText,
    musicUrl,
  };
}
