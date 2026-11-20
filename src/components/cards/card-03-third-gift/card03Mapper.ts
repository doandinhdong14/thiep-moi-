import type { InvitationContent } from "@/lib/templates/schema";
import { defaults as flowtimeDefaults, type LoveStyle14FlowtimePptConfig } from "./flowtime/config";

export const CARD03_DEFAULT_BGM_URL = "/cards/card-03-third-gift/audio/gift-bgm.mp3";

export const CARD03_DEFAULT_COVER_URL = "/cards/card-03-third-gift/img/iali53.jpg";

export const CARD03_DEFAULT_CAPTIONS = [
  "Khoảnh khắc tớ nhận ra mình thương cậu mất rồi",
  "Nụ cười làm tớ ngẩn ngơ mất mấy giây",
  "Những ngày bình yên nhất là những ngày có cậu",
  "Mong rằng tụi mình sẽ còn đi qua thật nhiều mùa nắng đẹp",
  "Dù đi đến đâu, có cậu bên cạnh là đủ",
  "Giữ trọn kỷ niệm này cho riêng hai đứa mình ✨",
];

export const CARD03_DEFAULT_TEXTS = {
  senderName: "Tớ",
  recipientName: "Minh Anh",
  page1Title: "Một Bí Mật Nhỏ Dành Cho Cậu",
  foreverText: "Một Đời Bên Nhau",
  subtitleText: "Bắt đầu lắng nghe những điều tớ giấu kín bấy lâu nhé",
  page53Title: "Tớ Thích Cậu",
  page53Subtitle: "Từ những ngày đầu tiên cho đến tận sau này...",
  page54CenterText: "Tớ thương cậu nhiều lắm ✨",
  customPageTexts: "",
};

export interface Card03PhotoItem {
  id: string;
  url: string;
  caption: string;
}

/**
 * Maps user-editable content (text, sender/recipient names, uploaded photos, music)
 * from InvitationContent into Card 03 ("số 1 minh anh" Flowtime 55-page) config,
 * while strictly locking all visual, color, tilt, transition, and layout effects
 * to `saved-card.json`.
 */
export function buildCard03Config(content: InvitationContent): {
  flowtimeConfig: LoveStyle14FlowtimePptConfig;
  photos: Card03PhotoItem[];
  musicUrl: string | null;
} {
  const c03 = content.card03 || {};

  // Resolve sender & recipient names from people[]
  const people = Array.isArray(content.people) ? content.people : [];
  const senderPerson =
    people.find((p) => ["sender", "groom", "partner1"].includes((p.role || "").toLowerCase())) ||
    people[0];
  const recipientPerson =
    people.find((p) => ["recipient", "bride", "guest", "partner2"].includes((p.role || "").toLowerCase())) ||
    (people.length > 1 ? people[1] : undefined);

  const boyName = (senderPerson?.displayName || "").trim() || CARD03_DEFAULT_TEXTS.senderName;
  const girlName = (recipientPerson?.displayName || "").trim() || CARD03_DEFAULT_TEXTS.recipientName;

  // Collect user-uploaded memory photos (up to 12).
  // Ignore the default Card 03 cover illustration if the user has not uploaded a real photo.
  const collectedPhotos: string[] = [];
  const pushUnique = (u?: string) => {
    const clean = (u || "").trim();
    if (!clean || clean === CARD03_DEFAULT_COVER_URL) return;
    if (!collectedPhotos.includes(clean)) {
      collectedPhotos.push(clean);
    }
  };
  pushUnique(content.coverImageUrl);
  if (Array.isArray(content.galleryUrls)) {
    for (const u of content.galleryUrls) pushUnique(u);
  }

  const customCaptions = Array.isArray(c03.photoCaptions) ? c03.photoCaptions : [];
  const photos: Card03PhotoItem[] = collectedPhotos.slice(0, 12).map((url, idx) => ({
    id: `c03-photo-${idx}`,
    url,
    caption:
      (customCaptions[idx] || "").trim() ||
      CARD03_DEFAULT_CAPTIONS[idx % CARD03_DEFAULT_CAPTIONS.length],
  }));

  const subtitleCandidate =
    (c03.subtitleText || "").trim() ||
    (content.subtitle || "").trim() ||
    CARD03_DEFAULT_TEXTS.subtitleText;

  // Build Flowtime config with all built-in effect parameters strictly locked to saved-card.json
  const flowtimeConfig: LoveStyle14FlowtimePptConfig = {
    ...flowtimeDefaults,
    page1Title: (c03.page1Title || "").trim() || CARD03_DEFAULT_TEXTS.page1Title,
    boyName,
    girlName,
    foreverText: (c03.foreverText || "").trim() || CARD03_DEFAULT_TEXTS.foreverText,
    subtitleText: subtitleCandidate,
    page53Title: (c03.page53Title || "").trim() || CARD03_DEFAULT_TEXTS.page53Title,
    page53Subtitle:
      c03.page53Subtitle !== undefined
        ? c03.page53Subtitle.trim()
        : (content.message || "").trim() || CARD03_DEFAULT_TEXTS.page53Subtitle,
    page54CenterText:
      (c03.page54CenterText || "").trim() || CARD03_DEFAULT_TEXTS.page54CenterText,
    customPageTexts: (c03.customPageTexts || "").trim(),

    // Locked built-in Flowtime 2D spatial effect parameters (from saved-card.json)
    startSection: 1,
    startPage: 1,
    overviewMode: false,
    autoPlay: false,
    autoPlayIntervalSec: 3.5,
    transitionDurationMs: 600,
    showProgressMap: true,
    showNavButtons: true,
    imageScale: 1,
    imageBorderRadius: 0,
    backgroundColor: "#fed1ea",
    primaryTextColor: "#613b3b",
    accentHeartColor: "#FA4A4A",
    spaceTiltXDeg: 0,
    spaceTiltYDeg: 0,
  };

  const rawMusic = content.features?.backgroundMusicUrl;
  const musicUrl =
    rawMusic === null
      ? null
      : typeof rawMusic === "string" && rawMusic.trim().length > 0
      ? rawMusic.trim()
      : CARD03_DEFAULT_BGM_URL;

  return {
    flowtimeConfig,
    photos,
    musicUrl,
  };
}
