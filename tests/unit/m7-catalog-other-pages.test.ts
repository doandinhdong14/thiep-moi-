import { describe, it, expect } from "vitest";
import {
  CATALOG_CATEGORIES,
  CATALOG_PRODUCTS,
  COLLECTIONS_LIST,
  VOUCHER_CAMPAIGN,
} from "../../src/data/catalogData";
import { generateQrDataUrl } from "../../src/lib/qr";

describe("Other Pages & Modals Data and Utility Tests", () => {
  it("should have all required categories with valid icons and slugs", () => {
    const requiredSlugs = [
      "all",
      "sinh-nhat",
      "trung-thu",
      "hen-ho",
      "ky-niem",
      "valentine",
      "qua-8-3",
      "qua-20-10",
      "cuoi-dinh-hon",
      "tot-nghiep",
    ];

    const categorySlugs = CATALOG_CATEGORIES.map((c) => c.slug);
    for (const slug of requiredSlugs) {
      expect(categorySlugs).toContain(slug);
    }
  });

  it("should have valid products with proper prices and non-empty specs", () => {
    expect(CATALOG_PRODUCTS.length).toBeGreaterThanOrEqual(10);

    for (const p of CATALOG_PRODUCTS) {
      expect(p.id).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.price).toBeGreaterThanOrEqual(0);
      if (p.compareAtPrice) {
        expect(p.compareAtPrice).toBeGreaterThan(p.price);
      }
      expect(p.demoUrl).toBeTruthy();
      expect(p.specs.design).toBeTruthy();
      expect(p.specs.interaction).toBeTruthy();
      expect(p.specs.sharing).toBeTruthy();
      expect(p.specs.compatibility).toBeTruthy();
    }
  });

  it("should have all required collections with valid cover images and categorySlugs", () => {
    expect(COLLECTIONS_LIST.length).toBe(9);

    for (const col of COLLECTIONS_LIST) {
      expect(col.id).toBeTruthy();
      expect(col.title).toBeTruthy();
      expect(col.subtitle).toBeTruthy();
      expect(col.image).toMatch(/^https?:\/\//);
      expect(col.categorySlug).toBeTruthy();
    }
  });

  it("should have complete voucher campaign configuration", () => {
    expect(VOUCHER_CAMPAIGN.campaignId).toBeTruthy();
    expect(VOUCHER_CAMPAIGN.code).toBe("DINGDONG2026");
    expect(VOUCHER_CAMPAIGN.discountPercent).toBe(20);
    expect(VOUCHER_CAMPAIGN.task1.requirements.length).toBeGreaterThan(0);
    expect(VOUCHER_CAMPAIGN.task2.requirements.length).toBeGreaterThan(0);
    expect(VOUCHER_CAMPAIGN.videoCaption).toBeTruthy();
    expect(VOUCHER_CAMPAIGN.hashtags.length).toBeGreaterThanOrEqual(3);
    expect(VOUCHER_CAMPAIGN.redemptionSteps.length).toBe(3);
  });

  it("should generate a valid QR code base64 Data URL for product demo", async () => {
    const demoUrl = "https://momentlink.vn/templates/wedding-classic";
    const dataUrl = await generateQrDataUrl(demoUrl, { width: 200 });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});

