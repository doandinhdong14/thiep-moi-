import type { InvitationContent } from "@/lib/templates/schema";
import type { BouquetConfig } from "./bouquet/config";
import type { CosmicBirthdayJourneyConfig, CardPhotoItem } from "./journey/config";
import type { AssetConfig } from "./universe/types";
import { DEFAULT_CARD01_PHOTOS } from "./universe/placeholders";

export const CARD01_DEFAULT_BGM_URL = "/cards/card-01-first-gift/audio/gift-bgm.mp3";

export const CARD01_DEFAULT_CAPTIONS = [
  "Yêu cậu, từ những ngày đầu đến tận sau này",
  "Nụ cười làm tớ đứng hình mất mấy giây",
  "Mùa hè năm ấy dịu dàng vì có cậu",
  "Mong là năm nào mình cũng có nhau",
  "Với tớ, có cậu là đủ",
  "Mãi bên nhau nhé, thương cậu nhiều lắm ✨",
];

export const CARD01_DEFAULT_WISHES = [
  "Thích cậu, từ ngày đầu tiên đến tận sau này.",
  "Mong là năm nào tụi mình cũng có nhau.",
  "Ở cạnh tớ thật lâu nhé.",
  "Thương cậu nhiều lắm.",
  "Có cậu là đủ.",
  "love u",
];

export const CARD01_DEFAULT_TEXTS = {
  recipientName: "Minh Anh",
  titleSubtitle: "BÍ MẬT DÀNH RIÊNG CHO",
  guideTextIdle: "Chạm nhẹ vào bó hoa tớ lén chuẩn bị cho cậu nha",
  guideTextReady: "Giữ tay ở bó hoa để mở bí mật của tớ nhé",
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
  portalCtaText: "Bước vào Vũ trụ yêu thương ✨",
};

const BOUQUET_SLOT_ROTATIONS = [-8, 2, 8, -13, 0, 11];
const BOUQUET_SLOT_SCALES = [1.0, 1.05, 1.0, 0.98, 1.08, 0.98];

/**
 * Maps user-editable content (text, photos, music) from InvitationContent into
 * the 3-stage Card 01 configuration while keeping ALL visual & motion effects
 * strictly locked to the curated `saved-card.json` presets.
 */
export function buildCard01StageConfigs(content: InvitationContent): {
  bouquetConfig: BouquetConfig;
  journeyConfig: CosmicBirthdayJourneyConfig;
  universeConfig: AssetConfig;
  photoUrls: string[];
  portalCtaText: string;
  musicUrl: string | null;
} {
  const c01 = content.card01 || {};

  // Resolve recipient name cleanly from people[]
  const people = Array.isArray(content.people) ? content.people : [];
  const recipientPerson =
    people.find((p) => ["recipient", "bride", "guest"].includes((p.role || "").toLowerCase())) ||
    (people.length > 1 ? people[1] : people[0]);
  const recipientName =
    (recipientPerson?.displayName || "").trim() || CARD01_DEFAULT_TEXTS.recipientName;

  // Collect synced memory photos (cover + gallery) or fallback to Card 01's 6 saved photos
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
    collectedPhotos.length > 0 ? collectedPhotos.slice(0, 12) : DEFAULT_CARD01_PHOTOS;

  const customCaptions = Array.isArray(c01.photoCaptions) ? c01.photoCaptions : [];

  // Stage 1: Card 5 (Bouquet) — Locked visual/effect params from saved-card.json
  const bouquetConfig: BouquetConfig = {
    bouquetScale: 0.7,
    holdDuration: 1.9,
    burstSpeed: 0.9,
    burstSpread: 1.1,
    burstRotation: 1,
    ringColor: "#f472b6",
    enableStars: true,
    starDensity: 170,
    starSpeed: 0.6,
    glowIntensity: 1.15,
    guideTextIdle: (c01.guideTextIdle || "").trim() || CARD01_DEFAULT_TEXTS.guideTextIdle,
    guideTextReady: (c01.guideTextReady || "").trim() || CARD01_DEFAULT_TEXTS.guideTextReady,
    photos: effectivePhotos.slice(0, 6).map((url, idx) => ({
      id: `c01-b-${idx}`,
      url,
      cropX: 50,
      cropY: 45,
      customRotation: BOUQUET_SLOT_ROTATIONS[idx % BOUQUET_SLOT_ROTATIONS.length],
      customScale: BOUQUET_SLOT_SCALES[idx % BOUQUET_SLOT_SCALES.length],
    })),
  };

  // Stage 2: Card 30 (Cosmic Journey) — Locked visual/effect params from saved-card.json
  const cardPhotos: CardPhotoItem[] = effectivePhotos.slice(0, 8).map((url, idx) => ({
    id: `c01-j-${idx}`,
    imageUrl: url,
    caption:
      (customCaptions[idx] || "").trim() ||
      CARD01_DEFAULT_CAPTIONS[idx % CARD01_DEFAULT_CAPTIONS.length],
    captionPosition: "bottom",
    captionAlign: "center",
    captionColor: "#ffffff",
  }));

  const journeyConfig: CosmicBirthdayJourneyConfig = {
    recipientName,
    titleSubtitle: (content.subtitle || "").trim() || CARD01_DEFAULT_TEXTS.titleSubtitle,
    introLinesText: (c01.introLinesText || "").trim() || CARD01_DEFAULT_TEXTS.introLinesText,
    cardHintIdle: "Chạm để mở khóa những lần tớ rung động",
    cardHintExpanded: "Nhấn vào từng tấm để xem rõ hơn nha",
    cardPhotos,
    candleLinesText: (c01.candleLinesText || "").trim() || CARD01_DEFAULT_TEXTS.candleLinesText,
    candleHintText: (c01.candleHintText || "").trim() || CARD01_DEFAULT_TEXTS.candleHintText,
    enableMicBlow: false,
    giftHintText: (c01.giftHintText || "").trim() || CARD01_DEFAULT_TEXTS.giftHintText,
    giftLetter: (content.message || "").trim() || CARD01_DEFAULT_TEXTS.giftLetter,
    letterAlign: "center",
    letterLineIntervalMs: 780,
    giftImages: [],
    upliftLinesText: (c01.upliftLinesText || "").trim() || CARD01_DEFAULT_TEXTS.upliftLinesText,
    endingLinesText: (c01.endingLinesText || "").trim() || CARD01_DEFAULT_TEXTS.endingLinesText,
    showCurtain: false,
    curtainLinesText: "",
    startScene: 1,
    showSceneNavDots: true,
    backgroundColor: "#080d1a",
    textColor: "#ffffff",
    accentColor: "#a08cff",
    starCount: 340,
    meteorFrequency: 1.1,
    enableAudio: false,
    customBirthdayAudioUrl: "",
    customGiftAudioUrl: "",
    spaceTiltXDeg: 0,
    spaceTiltYDeg: 0,
  };

  // Stage 3: Card 2 (Love Universe 01 — Biến thể "số 1") — Locked visual/effect params from saved-card.json
  const wishes =
    Array.isArray(content.loveMessages) && content.loveMessages.map((w) => w.trim()).filter(Boolean).length > 0
      ? content.loveMessages.map((w) => w.trim()).filter(Boolean)
      : CARD01_DEFAULT_WISHES;

  const universeConfig: AssetConfig = {
    schemaVersion: 1,
    assetId: "love-universe-01",
    assetVersion: "0.1.0",
    appearance: {
      color: "#fafafa",
      roughness: 0.35,
      metalness: 0.05,
    },
    transform: {
      scale: 1,
      rotationDeg: [0, 0, 0],
    },
    motion: {
      float: { enabled: true, amplitude: 0.12, speed: 0.45 },
      heartbeat: { enabled: false, strength: 0.04, bpm: 72 },
      spin: { enabled: true, speedDegPerSecond: 1.5 },
    },
    universe: {
      wishes,
      textCount: 35,
      photoCount: 10,
      heartCount: 31,
      cloudWidth: 8.6,
      cloudHeight: 7.2,
      cloudDepth: 6.3,
      rotationSpeed: 1.5,
      textColor: "#fafafa",
      glowIntensity: 1.75,
      heartColor: "#f01d0a",
      seed: 42,
      showIntro: false,
      glowEnabled: true,
      glowSpread: 0.3,
      glowColor: "#b46ac8",
      textScaleFactor: 2,
      photoScaleFactor: 1.3,
      heartScaleFactor: 1.35,
      heartRoughness: 0.35,
      heartSpinSpeed: 0.2,
      heartFloatAmp: 0.14,
      driftEnabled: true,
      driftSpeed: 0.35,
      globalSpeedMultiplier: 1.3,
      textDriftEnabled: true,
      textDriftSpeed: 0.4,
      photoDriftEnabled: true,
      photoDriftSpeed: 0.5,
      heartDriftEnabled: true,
      heartDriftSpeed: 0.65,
      decorations: [],
    },
  };

  const portalCtaText =
    (c01.portalCtaText || "").trim() || CARD01_DEFAULT_TEXTS.portalCtaText;

  // Respect explicit null (user removed music); undefined defaults to built-in Card 01 BGM
  const rawMusic = content.features?.backgroundMusicUrl;
  const musicUrl =
    rawMusic === null
      ? null
      : typeof rawMusic === "string" && rawMusic.trim().length > 0
      ? rawMusic.trim()
      : CARD01_DEFAULT_BGM_URL;

  return {
    bouquetConfig,
    journeyConfig,
    universeConfig,
    photoUrls: effectivePhotos,
    portalCtaText,
    musicUrl,
  };
}
