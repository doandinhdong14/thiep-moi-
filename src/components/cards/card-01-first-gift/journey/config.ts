export interface CardPhotoItem {
  id: string;
  imageUrl: string;
  caption: string;
  captionPosition: "top" | "center" | "bottom";
  captionAlign: "left" | "center" | "right";
  captionColor: string;
}

export interface GiftImageItem {
  id: string;
  imageUrl: string;
}

export interface CosmicBirthdayJourneyConfig {
  recipientName: string;
  titleSubtitle: string;
  introLinesText: string;
  cardHintIdle: string;
  cardHintExpanded: string;
  cardPhotos: CardPhotoItem[];
  candleLinesText: string;
  candleHintText: string;
  enableMicBlow: boolean;
  giftHintText: string;
  giftLetter: string;
  letterAlign: "left" | "center" | "right";
  letterLineIntervalMs: number;
  giftImages: GiftImageItem[];
  upliftLinesText: string;
  endingLinesText: string;
  showCurtain: boolean;
  curtainLinesText: string;
  startScene: number;
  showSceneNavDots: boolean;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  starCount: number;
  meteorFrequency: number;
  enableAudio: boolean;
  customBirthdayAudioUrl: string;
  customGiftAudioUrl: string;
  spaceTiltXDeg: number;
  spaceTiltYDeg: number;
}
