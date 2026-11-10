import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TEMPLATES_REGISTRY, getTemplateDemoContent } from "@/lib/templates/registry";
import { CATALOG_PRODUCTS } from "@/data/catalogData";
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

