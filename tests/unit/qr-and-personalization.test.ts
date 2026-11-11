import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  INTERACTIVE_TEMPLATE_URLS,
  hydrateInteractiveHtml,
} from "@/lib/templates/hydrateInteractiveHtml";
import { QR_PRESETS } from "@/lib/qr/presets";
import type { InvitationContent } from "@/lib/templates/schema";

const ROOT_DIR = process.cwd();

const SAMPLE_CONTENT: InvitationContent = {
  schemaVersion: 1,
  occasionKey: "love",
  locale: "vi-VN",
  title: "Thiệp Kỷ Niệm Minh & An",
  subtitle: "Gửi tặng người thương nhân ngày đặc biệt",
  message:
    "Cảm ơn em đã đồng hành cùng anh suốt những tháng ngày rực rỡ nhất.",
  people: [
    { displayName: "Minh Quân", role: "sender" },
    { displayName: "Thiên An", role: "recipient" },
  ],
  event: {
    venueName: "Đà Lạt",
    address: "Sài Gòn → Đà Lạt",
    startsAt: "2026-02-14",
  },
  loveMessages: [
    "Chúc em luôn rạng rỡ mỗi ngày",
    "Cảm ơn vì đã luôn ở bên cạnh",
    "Mãi mãi một tình yêu",
  ],
  coverImageUrl: "/uploads/sample-cover-photo.jpg",
  galleryUrls: [
    "/uploads/sample-cover-photo.jpg",
    "/uploads/sample-second-photo.jpg",
  ],
  privacy: {
    mode: "UNLISTED",
    allowIndexing: false,
  },
  features: {
    rsvp: true,
    guestbook: true,
    backgroundMusicUrl: "/audio/romantic-musicbox.wav",
    cardPin: "2468",
    showPinHint: true,
  },
  blocks: [],
};

describe("Interactive HTML Personalization & Zero-Branding", () => {
  it("hydrates all 10 interactive HTML templates cleanly with user data, photos, and music", () => {
    const slugs = Object.keys(INTERACTIVE_TEMPLATE_URLS);
    expect(slugs.length).toBe(10);

    for (const slug of slugs) {
      const relUrl = INTERACTIVE_TEMPLATE_URLS[slug].replace(/^\//, "");
      const htmlPath = path.join(ROOT_DIR, "public", relUrl);
      const rawHtml = fs.readFileSync(htmlPath, "utf8");
      const hydrated = hydrateInteractiveHtml(rawHtml, slug, SAMPLE_CONTENT, {
        invitationSlug: `test-${slug}`,
      });

      expect(hydrated, `${slug} should update page <title>`).toContain(
        "<title>Thiệp Kỷ Niệm Minh &amp; An</title>"
      );
      expect(hydrated, `${slug} should include injected music URL`).toContain(
        "/audio/romantic-musicbox.wav"
      );
      expect(hydrated, `${slug} should include uploaded photo URL`).toContain(
        "/uploads/sample-cover-photo.jpg"
      );
      expect(
        hydrated.toLowerCase(),
        `${slug} must never contain dingdonggift branding`
      ).not.toContain("dingdong");
      expect(
        hydrated,
        `${slug} must strip nav-back-list backlink`
      ).not.toContain('class="nav-back-list"');
    }
  });

  it("injects custom PIN into thiep-5 and thiep-6 lockable templates", () => {
    for (const slug of ["thiep-5", "thiep-6"]) {
      const relUrl = INTERACTIVE_TEMPLATE_URLS[slug].replace(/^\//, "");
      const rawHtml = fs.readFileSync(path.join(ROOT_DIR, "public", relUrl), "utf8");
      const hydrated = hydrateInteractiveHtml(rawHtml, slug, SAMPLE_CONTENT, {
        invitationSlug: `pin-${slug}`,
      });
      expect(hydrated).toContain("2468");
      expect(hydrated).toContain("Minh Quân");
      expect(hydrated).toContain("Thiên An");
    }
  });

  it("keeps recipient view components and export branding clean of Ding Dong Gift", () => {
    const recipientFiles = [
      "src/app/i/[slug]/page.tsx",
      "src/app/i/[slug]/PasswordUnlockForm.tsx",
      "src/components/template-renderer/blocks/FooterCtaBlock.tsx",
      "src/lib/exports/index.ts",
    ];

    for (const rel of recipientFiles) {
      const src = fs.readFileSync(path.join(ROOT_DIR, rel), "utf8");
      expect(src.toLowerCase(), `${rel} must not leak brand string`).not.toContain(
        "dingdong"
      );
      expect(src.toLowerCase(), `${rel} must not mention Ding Dong Gift`).not.toContain(
        "ding dong"
      );
    }
  });

  it("defines all 16 decorated QR presets matching visual themes", () => {
    expect(QR_PRESETS.length).toBe(16);
    const heartIds = QR_PRESETS.filter((p) => p.qrSlot.frameShape === "heart").map(
      (p) => p.id
    );
    expect(heartIds).toEqual(
      expect.arrayContaining([
        "trai-tim-hoa-hong",
        "trai-tim-20-10",
        "gift-for-you",
        "trai-tim",
        "trai-tim-khung",
        "socola",
        "socola-2",
      ])
    );
  });
});
