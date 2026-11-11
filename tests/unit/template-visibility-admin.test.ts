import { describe, it, expect, beforeEach } from "vitest";
import {
  TEMPLATES_REGISTRY,
  USER_TEMPLATE_SEQUENCE,
  getVisibleTemplates,
  getAllTemplatesOrdered,
  isTemplateVisible,
} from "@/lib/templates/registry";
import {
  ALL_CATALOG_PRODUCTS,
  CATALOG_PRODUCTS,
  getVisibleCatalogProducts,
  getVisibleCatalogCategories,
  getVisibleCollections,
  findCatalogProductBySlug,
} from "@/data/catalogData";
import { productList } from "@/data/landingData";
import {
  DEFAULT_GENERAL_NOTES,
  DEFAULT_TEMPLATE_NOTES,
  createDefaultAdminTemplatesConfig,
} from "@/lib/templates/adminConfig";

describe("User Template Visibility, Sequential Numbering (#01-#10) & Admin Notes", () => {
  const expectedSlugs = [
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

  const legacyHiddenSlugs = [
    "wedding-classic",
    "wedding-floral",
    "graduation-classic",
    "graduation-playful",
    "birthday-fun",
    "birthday-minimal",
    "love-letter",
    "love-galaxy",
  ];

  it("should expose ONLY the 10 user-provided templates by default in exact #01-#10 order", () => {
    const visible = getVisibleTemplates();
    expect(visible).toHaveLength(10);
    expect(visible.map((t) => t.slug)).toEqual(expectedSlugs);
    expect(visible.map((t) => t.numberCode)).toEqual([
      "#01",
      "#02",
      "#03",
      "#04",
      "#05",
      "#06",
      "#07",
      "#08",
      "#09",
      "#10",
    ]);

    for (let i = 0; i < visible.length; i++) {
      expect(visible[i].displayOrder).toBe(i + 1);
      expect(visible[i].title.startsWith(`#${String(i + 1).padStart(2, "0")} · `)).toBe(true);
    }
  });

  it("should hide all 8 legacy platform templates by default while keeping them in TEMPLATES_REGISTRY", () => {
    const visibleSlugs = new Set(getVisibleTemplates().map((t) => t.slug));
    for (const slug of legacyHiddenSlugs) {
      expect(TEMPLATES_REGISTRY[slug]).toBeDefined();
      expect(TEMPLATES_REGISTRY[slug].defaultHidden).toBe(true);
      expect(visibleSlugs.has(slug)).toBe(false);
    }
  });

  it("should hide all placeholder products from CATALOG_PRODUCTS and landing productList", () => {
    expect(CATALOG_PRODUCTS.map((p) => p.slug)).toEqual(expectedSlugs);
    expect(productList.map((p) => p.slug)).toEqual(expectedSlugs);

    for (const item of CATALOG_PRODUCTS) {
      expect(item.numberCode).toMatch(/^#\d{2}$/);
    }

    // Internal lookup still preserves legacy items for orders/unlocks
    expect(ALL_CATALOG_PRODUCTS.length).toBeGreaterThan(CATALOG_PRODUCTS.length);
    for (const legacySlug of legacyHiddenSlugs) {
      expect(findCatalogProductBySlug(legacySlug)).toBeDefined();
      expect(CATALOG_PRODUCTS.find((p) => p.slug === legacySlug)).toBeUndefined();
    }
  });

  it("should dynamically filter categories and collections to active visible items only", () => {
    const categories = getVisibleCatalogCategories(CATALOG_PRODUCTS);
    expect(categories.map((c) => c.slug)).toEqual([
      "all",
      "hen-ho",
      "ky-niem",
      "valentine",
    ]);

    const collections = getVisibleCollections(CATALOG_PRODUCTS);
    expect(collections.map((c) => c.slug)).toEqual(["hen-ho", "ky-niem", "valentine"]);
    const sumCounts = collections.reduce((acc, c) => acc + c.productCount, 0);
    expect(sumCounts).toBe(10);
  });

  it("should respect Admin visibility overrides consistently across templates and catalog", () => {
    const customOverrides = {
      "wedding-classic": true,
      "thiep-4": false,
    };

    const visibleTpls = getVisibleTemplates(customOverrides);
    expect(visibleTpls.some((t) => t.slug === "wedding-classic")).toBe(true);
    expect(visibleTpls.some((t) => t.slug === "thiep-4")).toBe(false);

    const visibleCatalog = getVisibleCatalogProducts(customOverrides);
    expect(visibleCatalog.some((p) => p.slug === "wedding-classic")).toBe(true);
    expect(visibleCatalog.some((p) => p.slug === "thiep-4")).toBe(false);
    expect(isTemplateVisible(TEMPLATES_REGISTRY["wedding-classic"], customOverrides)).toBe(true);
  });

  it("should provide complete pre-seeded Admin notes & ordered inventory metadata", () => {
    const allOrdered = getAllTemplatesOrdered();
    expect(allOrdered.slice(0, 10).map((t) => t.slug)).toEqual(expectedSlugs);

    const defaultCfg = createDefaultAdminTemplatesConfig();
    expect(DEFAULT_GENERAL_NOTES).toContain("#01");
    expect(DEFAULT_GENERAL_NOTES).toContain("#10");
    expect(DEFAULT_GENERAL_NOTES).toContain("thiep-3.html");
    expect(DEFAULT_GENERAL_NOTES).toContain("thiep-xmas.html");

    for (const entry of USER_TEMPLATE_SEQUENCE) {
      expect(defaultCfg.visibilityOverrides[entry.slug]).toBe(true);
      expect(DEFAULT_TEMPLATE_NOTES[entry.slug]).toBeTruthy();
    }
    for (const legacySlug of legacyHiddenSlugs) {
      expect(defaultCfg.visibilityOverrides[legacySlug]).toBe(false);
      expect(DEFAULT_TEMPLATE_NOTES[legacySlug]).toBeTruthy();
    }
  });
});

