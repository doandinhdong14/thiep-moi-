import { describe, it, expect } from "vitest";
import QRCode from "qrcode";
import sharp from "sharp";
import jsQR from "jsqr";
import { QR_PRESETS } from "@/lib/qr/presets";
import { TEMPLATES_REGISTRY, getTemplateDemoContent } from "@/lib/templates/registry";
import prisma from "@/lib/prisma";
import { fulfillOrder } from "@/lib/payments/fulfillment";

describe("Luồng Mua Hàng & QR Code Verification Tests", () => {
  const testUrl = "https://momentlink.vn/i/vu-tru-yeu-thuong-sample";

  it("should have all 16 valid QR presets defined according to spec", () => {
    expect(QR_PRESETS.length).toBe(16);
    const expectedPresetIds = [
      "gift-for-you",
      "trai-tim-hoa-hong",
      "trai-tim-20-10",
      "hoa",
      "cupid",
      "mui-ten",
      "trai-tim",
      "trai-tim-khung",
      "sinh-nhat",
      "sinh-nhat-2",
      "socola",
      "socola-2",
      "vuong",
      "trung-thu-2",
      "trung-thu-3",
      "noel",
    ];

    for (const expectedId of expectedPresetIds) {
      const preset = QR_PRESETS.find((p) => p.id === expectedId);
      expect(preset, `Preset ${expectedId} must exist`).toBeDefined();
      expect(preset?.canvasWidth).toBe(1000);
      expect(preset?.canvasHeight).toBe(1000);
      expect(preset?.qrSlot.size).toBeGreaterThanOrEqual(300);
      expect(preset?.qrSlot.x).toBeGreaterThan(0);
      expect(preset?.qrSlot.y).toBeGreaterThan(0);
      expect(preset?.defaultModuleColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("should generate scannable QR codes across presets and decode them with jsQR", async () => {
    // Test sample presets across different color schemes and shapes
    const testPresets = [
      "gift-for-you", // dark background
      "trai-tim", // red/pink heart
      "trai-tim-hoa-hong", // rose heart
      "vuong", // clean minimal square
      "cupid", // cupid theme
      "noel", // festive green/red
    ];

    for (const presetId of testPresets) {
      const preset = QR_PRESETS.find((p) => p.id === presetId)!;
      const isDark = preset.backgroundType === "dark";
      const lightColor = isDark ? "#0c0d12" : "#ffffff";
      const darkColor = preset.defaultModuleColor;

      // 1. Generate QR buffer with high error correction
      const qrBuffer = await QRCode.toBuffer(testUrl, {
        errorCorrectionLevel: "H",
        margin: 3,
        width: preset.qrSlot.size,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      // 2. Convert to raw RGBA with sharp
      const { data, info } = await sharp(qrBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 3. Scan with jsQR
      const clampedData = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
      const decoded = jsQR(clampedData, info.width, info.height, {
        inversionAttempts: "attemptBoth",
      });

      expect(decoded, `QR code for preset ${presetId} must be decoded by jsQR`).not.toBeNull();
      expect(decoded?.data).toBe(testUrl);
    }
  });

  it("should decode QR code successfully even with center badge (Level H error correction)", async () => {
    // Generate QR code at 400x400
    const qrBuffer = await QRCode.toBuffer(testUrl, {
      errorCorrectionLevel: "H",
      margin: 3,
      width: 400,
      color: {
        dark: "#e11d48",
        light: "#ffffff",
      },
    });

    // Composite a 44x44 center heart badge in the middle (size 44/400 = 11% area, well within 30% H capacity)
    const centerBadgeSvg = `
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="#ffffff" stroke="#e11d48" stroke-width="2"/>
        <text x="22" y="26" font-size="20" text-anchor="middle" fill="#e11d48">❤</text>
      </svg>
    `;

    const compositeBuffer = await sharp(qrBuffer)
      .composite([
        {
          input: Buffer.from(centerBadgeSvg),
          top: 178,
          left: 178,
        },
      ])
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const clampedData = new Uint8ClampedArray(
      compositeBuffer.data.buffer,
      compositeBuffer.data.byteOffset,
      compositeBuffer.data.length
    );

    const decoded = jsQR(clampedData, compositeBuffer.info.width, compositeBuffer.info.height, {
      inversionAttempts: "attemptBoth",
    });

    expect(decoded).not.toBeNull();
    expect(decoded?.data).toBe(testUrl);
  });

  it("should verify template registry contains love-galaxy with loveMessages seeded", () => {
    const galaxyMeta = TEMPLATES_REGISTRY["love-galaxy"];
    expect(galaxyMeta).toBeDefined();
    expect(galaxyMeta.isPremium).toBe(false); // Free template

    const galaxyContent = getTemplateDemoContent("love-galaxy");
    expect(galaxyContent.loveMessages).toBeDefined();
    expect(galaxyContent.loveMessages?.length).toBeGreaterThanOrEqual(4);
    expect(galaxyContent.loveMessages).toContain("Em là điều tuyệt vời nhất");
  });

  it("should fulfill order correctly for all distinct payment purposes", async () => {
    // 1. Create a test user
    const testUser = await prisma.user.create({
      data: {
        name: "Người Mua Hàng Test",
        email: `buyer_${Date.now()}@test.vn`,
        passwordHash: "hash123",
        imageCredits: 0,
        audioCredits: 0,
      },
    });

    const occasion = await prisma.occasion.findFirst();
    const templateVersion = await prisma.templateVersion.findFirst();

    // 2. Create test invitation
    const testInvitation = await prisma.invitation.create({
      data: {
        ownerId: testUser.id,
        occasionId: occasion?.id || "default_occ",
        templateVersionId: templateVersion?.id || "default_ver",
        slug: `test-slug-${Date.now()}`,
        title: "Vũ trụ yêu thương của Anh và Em",
        status: "DRAFT",
      },
    });

    // Test Purpose 1: image_credits fulfillment
    const imgOrder = await prisma.order.create({
      data: {
        buyerId: testUser.id,
        orderNumber: `ORD_IMG_${Date.now()}`,
        totalVnd: 20000,
        currency: "VND",
        status: "PAID",
        purpose: "image_credits",
        purchaseContext: JSON.stringify({ quantity: 10 }),
      },
    });
    await fulfillOrder(imgOrder.id);
    const updatedUserImg = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(updatedUserImg?.imageCredits).toBe(10);

    // Test Purpose 2: audio_credits fulfillment
    const audioOrder = await prisma.order.create({
      data: {
        buyerId: testUser.id,
        orderNumber: `ORD_AUD_${Date.now()}`,
        totalVnd: 15000,
        currency: "VND",
        status: "PAID",
        purpose: "audio_credits",
        purchaseContext: JSON.stringify({ quantity: 3 }),
      },
    });
    await fulfillOrder(audioOrder.id);
    const updatedUserAudio = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(updatedUserAudio?.audioCredits).toBe(3);

    // Test Purpose 3: gift_unlock fulfillment
    const unlockOrder = await prisma.order.create({
      data: {
        buyerId: testUser.id,
        orderNumber: `ORD_UNL_${Date.now()}`,
        totalVnd: 50000,
        currency: "VND",
        status: "PAID",
        purpose: "gift_unlock",
        purchaseContext: JSON.stringify({ giftId: testInvitation.id }),
      },
    });
    await fulfillOrder(unlockOrder.id);
    const publishedInv = await prisma.invitation.findUnique({ where: { id: testInvitation.id } });
    expect(publishedInv?.status).toBe("PUBLISHED");
    expect(publishedInv?.publishedAt).not.toBeNull();
    expect(publishedInv?.expiresAt).not.toBeNull();

    // Clean up test data
    await prisma.order.deleteMany({ where: { buyerId: testUser.id } });
    await prisma.invitation.deleteMany({ where: { ownerId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });
});


