import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TEMPLATES_REGISTRY, getTemplateDemoContent } from "@/lib/templates/registry";
import { CATALOG_PRODUCTS } from "@/data/catalogData";
import { buildCard01StageConfigs, CARD01_DEFAULT_BGM_URL } from "@/components/cards/card-01-first-gift/card01Mapper";
import { buildCard02StageConfigs, CARD02_DEFAULT_BGM_URL } from "@/components/cards/card-02-second-gift/card02Mapper";
import { buildCard03Config, CARD03_DEFAULT_BGM_URL } from "@/components/cards/card-03-third-gift/card03Mapper";
import prisma from "@/lib/prisma";

const NEW_CARD_SLUGS = [
  "thiep-3",
  "thiep-4",
  "thiep-5",
  "thiep-6",
  "thiep-7",
  "thiep-8",
  "thiep-9",
  "thiep-10",
  "thiep-giang-sinh",
  "thiep-xmas",
];

describe("10 Interactive Card Templates Integration Tests", () => {
  it("should have all 10 cards registered in TEMPLATES_REGISTRY with valid interactiveUrl", () => {
    for (const slug of NEW_CARD_SLUGS) {
      const meta = TEMPLATES_REGISTRY[slug];
      expect(meta).toBeDefined();
      expect(meta.slug).toBe(slug);
      expect(meta.title).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.interactiveUrl).toBe(`/templates/${slug}.html`);
      expect(meta.theme).toBeDefined();
    }
  });

  it("should have all 10 HTML template files existing in public/templates directory", () => {
    const publicTemplatesDir = path.join(process.cwd(), "public", "templates");
    expect(fs.existsSync(publicTemplatesDir)).toBe(true);

    for (const slug of NEW_CARD_SLUGS) {
      const filePath = path.join(publicTemplatesDir, `${slug}.html`);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(1000); // Check that files are not empty
    }
  });

  it("should return valid demo content for all 10 templates from getTemplateDemoContent", () => {
    for (const slug of NEW_CARD_SLUGS) {
      const demo = getTemplateDemoContent(slug);
      expect(demo).toBeDefined();
      expect(demo.title).toBeTruthy();
      expect(demo.message).toBeTruthy();
      expect(demo.people.length).toBeGreaterThan(0);
    }
  });

  it("should have all 10 cards in CATALOG_PRODUCTS catalog with complete metadata and specs", () => {
    for (const slug of NEW_CARD_SLUGS) {
      const product = CATALOG_PRODUCTS.find((p) => p.slug === slug);
      expect(product).toBeDefined();
      expect(product?.title).toBeTruthy();
      expect(product?.category).toBeTruthy();
      expect(product?.demoUrl).toBe(`/templates/${slug}`);
      expect(product?.specs.design).toBeTruthy();
      expect(product?.specs.interaction).toBeTruthy();
      expect(product?.specs.sharing).toBeTruthy();
      expect(product?.specs.compatibility).toBeTruthy();
    }
  });

  it("should verify all 10 templates exist in SQLite database via Prisma", async () => {
    for (const slug of NEW_CARD_SLUGS) {
      const dbTemplate = await prisma.template.findUnique({
        where: { slug },
        include: { versions: true },
      });
      expect(dbTemplate).toBeDefined();
      expect(dbTemplate?.slug).toBe(slug);
      expect(dbTemplate?.versions.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Card #01 (card-01-first-gift) 3-Stage 3D Integration Tests", () => {
  it("should be registered as #01 in TEMPLATES_REGISTRY, CATALOG_PRODUCTS, and SQLite DB", async () => {
    const meta = TEMPLATES_REGISTRY["card-01-first-gift"];
    expect(meta).toBeDefined();
    expect(meta.numberCode).toBe("#01");
    expect(meta.displayOrder).toBe(1);

    const product = CATALOG_PRODUCTS[0];
    expect(product.slug).toBe("card-01-first-gift");
    expect(product.numberCode).toBe("#01");
    expect(product.demoUrl).toBe("/templates/card-01-first-gift");

    const dbTemplate = await prisma.template.findUnique({
      where: { slug: "card-01-first-gift" },
      include: { versions: true },
    });
    expect(dbTemplate).toBeDefined();
    expect(dbTemplate?.slug).toBe("card-01-first-gift");
    expect(dbTemplate?.versions.length).toBeGreaterThanOrEqual(1);
  });

  it("should have required static assets and 480x2304 preview image on disk", () => {
    const root = process.cwd();
    expect(fs.existsSync(path.join(root, "public", "previews", "card-01-first-gift.webp"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-01-first-gift", "audio", "gift-bgm.mp3"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-01-first-gift", "bouquet", "bouquet_back.png"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-01-first-gift", "bouquet", "bouquet_front.png"))).toBe(true);
  });

  it("should map customizable text, photos, and music while keeping built-in 3D effects locked", () => {
    const demo = getTemplateDemoContent("card-01-first-gift");
    const custom = {
      ...demo,
      subtitle: "DÀNH RIÊNG CHO EM",
      message: "Mãi yêu thương em!",
      coverImageUrl: "/uploads/custom-1.jpg",
      galleryUrls: ["/uploads/custom-2.jpg"],
      loveMessages: ["Yêu em nhất", "Mãi bên nhau"],
      features: {
        ...demo.features,
        backgroundMusicUrl: "/uploads/custom-song.mp3",
      },
      card01: {
        ...demo.card01,
        guideTextIdle: "Chạm bó hoa riêng tặng Lan Anh",
        portalCtaText: "Mở Vũ Trụ Riêng",
        photoCaptions: ["Khoảnh khắc 1", "Khoảnh khắc 2"],
      },
    };

    const mapped = buildCard01StageConfigs(custom);
    expect(mapped.bouquetConfig.guideTextIdle).toBe("Chạm bó hoa riêng tặng Lan Anh");
    expect(mapped.journeyConfig.titleSubtitle).toBe("DÀNH RIÊNG CHO EM");
    expect(mapped.journeyConfig.giftLetter).toBe("Mãi yêu thương em!");
    expect(mapped.portalCtaText).toBe("Mở Vũ Trụ Riêng");
    expect(mapped.musicUrl).toBe("/uploads/custom-song.mp3");
    expect(mapped.photoUrls).toEqual(["/uploads/custom-1.jpg", "/uploads/custom-2.jpg"]);
    expect(mapped.bouquetConfig.photos).toHaveLength(2);
    expect(mapped.bouquetConfig.photos[0].url).toBe("/uploads/custom-1.jpg");
    expect(mapped.journeyConfig.cardPhotos[0].caption).toBe("Khoảnh khắc 1");
    expect(mapped.universeConfig.universe?.wishes).toEqual(["Yêu em nhất", "Mãi bên nhau"]);

    // Locked built-in effect defaults from saved-card.json
    expect(mapped.bouquetConfig.ringColor).toBe("#f472b6");
    expect(mapped.bouquetConfig.starDensity).toBe(170);
    expect(mapped.journeyConfig.starCount).toBe(340);
    expect(mapped.universeConfig.universe?.heartCount).toBe(31);
    expect(mapped.universeConfig.universe?.globalSpeedMultiplier).toBe(1.3);

    // Fallback default BGM when undefined, null when explicitly removed
    const defaultBgmMapped = buildCard01StageConfigs({
      ...demo,
      features: { ...demo.features, backgroundMusicUrl: undefined },
    });
    expect(defaultBgmMapped.musicUrl).toBe(CARD01_DEFAULT_BGM_URL);

    const mutedMapped = buildCard01StageConfigs({
      ...demo,
      features: { ...demo.features, backgroundMusicUrl: null },
    });
    expect(mutedMapped.musicUrl).toBeNull();
  });
});

describe("Card #02 (card-02-second-gift) 3-Stage 3D Integration Tests", () => {
  it("should be registered as #02 in TEMPLATES_REGISTRY, CATALOG_PRODUCTS, and SQLite DB", async () => {
    const meta = TEMPLATES_REGISTRY["card-02-second-gift"];
    expect(meta).toBeDefined();
    expect(meta.numberCode).toBe("#02");
    expect(meta.displayOrder).toBe(2);

    const product = CATALOG_PRODUCTS[1];
    expect(product.slug).toBe("card-02-second-gift");
    expect(product.numberCode).toBe("#02");
    expect(product.demoUrl).toBe("/templates/card-02-second-gift");

    const dbTemplate = await prisma.template.findUnique({
      where: { slug: "card-02-second-gift" },
      include: { versions: true },
    });
    expect(dbTemplate).toBeDefined();
    expect(dbTemplate?.slug).toBe("card-02-second-gift");
    expect(dbTemplate?.versions.length).toBeGreaterThanOrEqual(1);
  });

  it("should have required static assets and 480x2304 preview image on disk", () => {
    const root = process.cwd();
    expect(fs.existsSync(path.join(root, "public", "previews", "card-02-second-gift.webp"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-02-second-gift", "audio", "gift-bgm.mp3"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-02-second-gift", "photos", "photo-1-b83de51b.jpg"))).toBe(true);
  });

  it("should map customizable text, photos, lantern wishes, and music while keeping built-in 3D effects locked", () => {
    const demo = getTemplateDemoContent("card-02-second-gift");
    const custom = {
      ...demo,
      subtitle: "DÀNH RIÊNG CHO EM",
      message: "Chúc em mãi luôn hạnh phúc!",
      coverImageUrl: "/uploads/rose-1.jpg",
      galleryUrls: ["/uploads/rose-2.jpg"],
      loveMessages: ["Bình an mỗi ngày", "Cười thật nhiều nha"],
      features: {
        ...demo.features,
        backgroundMusicUrl: "/uploads/rose-song.mp3",
      },
      card02: {
        ...demo.card02,
        roseMessageText: "Bông hồng nhỏ tặng riêng Lan Anh",
        portalCtaText: "Thả đèn ước nguyện nào",
        photoCaptions: ["Kỷ niệm 1", "Kỷ niệm 2"],
      },
    };

    const mapped = buildCard02StageConfigs(custom);
    expect(mapped.roseAssetConfig.roseReveal.messageText).toBe("Bông hồng nhỏ tặng riêng Lan Anh");
    expect(mapped.journeyConfig.titleSubtitle).toBe("DÀNH RIÊNG CHO EM");
    expect(mapped.journeyConfig.giftLetter).toBe("Chúc em mãi luôn hạnh phúc!");
    expect(mapped.portalCtaText).toBe("Thả đèn ước nguyện nào");
    expect(mapped.musicUrl).toBe("/uploads/rose-song.mp3");
    expect(mapped.journeyConfig.cardPhotos).toHaveLength(2);
    expect(mapped.journeyConfig.cardPhotos[0].imageUrl).toBe("/uploads/rose-1.jpg");
    expect(mapped.journeyConfig.cardPhotos[0].caption).toBe("Kỷ niệm 1");
    expect(mapped.lanternConfig.sequenceItems[0].wishText).toBe("Bình an mỗi ngày");
    expect(mapped.lanternConfig.sequenceItems[1].wishText).toBe("Cười thật nhiều nha");

    // Locked built-in effect defaults from saved-card.json
    expect(mapped.roseAssetConfig.roseReveal.petalColor).toBe("#F48FB1");
    expect(mapped.roseAssetConfig.roseReveal.flyingPetalsCount).toBe(75);
    expect(mapped.journeyConfig.starCount).toBe(340);
    expect(mapped.lanternConfig.starCount).toBe(1400);
    expect(mapped.lanternConfig.mode).toBe("sequence");

    // Fallback default BGM when undefined, null when explicitly removed
    const defaultBgmMapped = buildCard02StageConfigs({
      ...demo,
      features: { ...demo.features, backgroundMusicUrl: undefined },
    });
    expect(defaultBgmMapped.musicUrl).toBe(CARD02_DEFAULT_BGM_URL);

    const mutedMapped = buildCard02StageConfigs({
      ...demo,
      features: { ...demo.features, backgroundMusicUrl: null },
    });
    expect(mutedMapped.musicUrl).toBeNull();
  });
});

describe("Card #03 (card-03-third-gift) Flowtime 55-Page Integration Tests", () => {
  it("should be registered as #03 (unlocked) and lock thiep-4 as #05 in TEMPLATES_REGISTRY, CATALOG_PRODUCTS, and SQLite DB", async () => {
    const meta = TEMPLATES_REGISTRY["card-03-third-gift"];
    expect(meta).toBeDefined();
    expect(meta.numberCode).toBe("#03");
    expect(meta.displayOrder).toBe(3);
    expect(meta.isLocked).toBe(false);

    const universeMeta = TEMPLATES_REGISTRY["thiep-4"];
    expect(universeMeta.numberCode).toBe("#05");
    expect(universeMeta.isLocked).toBe(true);

    const product = CATALOG_PRODUCTS[2];
    expect(product.slug).toBe("card-03-third-gift");
    expect(product.numberCode).toBe("#03");
    expect(product.isLocked).toBe(false);
    expect(product.demoUrl).toBe("/templates/card-03-third-gift");

    const dbTemplate = await prisma.template.findUnique({
      where: { slug: "card-03-third-gift" },
      include: { versions: true },
    });
    expect(dbTemplate).toBeDefined();
    expect(dbTemplate?.slug).toBe("card-03-third-gift");
    expect(dbTemplate?.versions.length).toBeGreaterThanOrEqual(1);
  });

  it("should have required static assets and preview image on disk", () => {
    const root = process.cwd();
    expect(fs.existsSync(path.join(root, "public", "previews", "card-03-third-gift.webp"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-03-third-gift", "audio", "gift-bgm.mp3"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-03-third-gift", "img", "iali53.jpg"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public", "cards", "card-03-third-gift", "img", "14915.jpg"))).toBe(true);
  });

  it("should map customizable text, names, uploaded photos, and music while keeping built-in Flowtime effects locked", () => {
    const demo = getTemplateDemoContent("card-03-third-gift");
    const custom = {
      ...demo,
      people: [
        { role: "sender", displayName: "Hoàng" },
        { role: "recipient", displayName: "Lan Anh" },
      ],
      coverImageUrl: "/uploads/c03-1.jpg",
      galleryUrls: ["/uploads/c03-2.jpg"],
      features: {
        ...demo.features,
        backgroundMusicUrl: "/uploads/c03-song.mp3",
      },
      card03: {
        ...demo.card03,
        page1Title: "Bí Mật Riêng Tặng Lan Anh",
        page53Title: "Hoàng Thương Lan Anh",
        page54CenterText: "Mãi bên nhau nhé ✨",
        customPageTexts: "p2:Ngày đầu tiên gặp nhau",
        photoCaptions: ["Kỷ niệm 1", "Kỷ niệm 2"],
      },
    };

    const mapped = buildCard03Config(custom);
    expect(mapped.flowtimeConfig.boyName).toBe("Hoàng");
    expect(mapped.flowtimeConfig.girlName).toBe("Lan Anh");
    expect(mapped.flowtimeConfig.page1Title).toBe("Bí Mật Riêng Tặng Lan Anh");
    expect(mapped.flowtimeConfig.page53Title).toBe("Hoàng Thương Lan Anh");
    expect(mapped.flowtimeConfig.page54CenterText).toBe("Mãi bên nhau nhé ✨");
    expect(mapped.flowtimeConfig.customPageTexts).toBe("p2:Ngày đầu tiên gặp nhau");
    expect(mapped.photos).toHaveLength(2);
    expect(mapped.photos[0].url).toBe("/uploads/c03-1.jpg");
    expect(mapped.photos[0].caption).toBe("Kỷ niệm 1");
    expect(mapped.musicUrl).toBe("/uploads/c03-song.mp3");

    // Built-in Flowtime 2D spatial effects remain strictly locked
    expect(mapped.flowtimeConfig.backgroundColor).toBe("#fed1ea");
    expect(mapped.flowtimeConfig.primaryTextColor).toBe("#613b3b");
    expect(mapped.flowtimeConfig.accentHeartColor).toBe("#FA4A4A");
    expect(mapped.flowtimeConfig.transitionDurationMs).toBe(600);
    expect(mapped.flowtimeConfig.spaceTiltXDeg).toBe(0);
    expect(mapped.flowtimeConfig.spaceTiltYDeg).toBe(0);

    // Default BGM fallback vs explicit removal
    const defaultBgmMapped = buildCard03Config({
      ...demo,
      features: { ...demo.features, backgroundMusicUrl: undefined },
    });
    expect(defaultBgmMapped.musicUrl).toBe(CARD03_DEFAULT_BGM_URL);

    const mutedMapped = buildCard03Config({
      ...demo,
      features: { ...demo.features, backgroundMusicUrl: null },
    });
    expect(mutedMapped.musicUrl).toBeNull();
  });
});

