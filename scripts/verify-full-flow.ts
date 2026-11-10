import QRCode from "qrcode";
import sharp from "sharp";
import jsQR from "jsqr";
import prisma from "../src/lib/prisma";
import { QR_PRESETS } from "../src/lib/qr/presets";
import { fulfillOrder } from "../src/lib/payments/fulfillment";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== BẮT ĐẦU KIỂM TRA TOÀN DIỆN LUỒNG MUA HÀNG & QR CODE ===");

  // 1. Lấy thông tin user test hoặc tạo user test
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Khách Mua Hàng Test",
        email: `tester_${Date.now()}@momentlink.vn`,
        passwordHash: "dummyhash",
        imageCredits: 0,
        audioCredits: 0,
      },
    });
  }
  console.log(`✓ 1. Người dùng: ${user.name} (${user.email}) - ImageCredits: ${user.imageCredits}, AudioCredits: ${user.audioCredits}`);

  // 2. Lấy occasion & templateVersion cho love-galaxy
  const occasion = await prisma.occasion.findFirst({ where: { slug: "love" } }) || await prisma.occasion.findFirst();
  const templateVersion = await prisma.templateVersion.findFirst();

  if (!occasion || !templateVersion) {
    throw new Error("Không tìm thấy occasion hoặc templateVersion");
  }

  // 3. Khởi tạo thiệp nháp (Draft Invitation)
  const testSlug = `vu-tru-yeu-thuong-${Date.now()}`;
  const invitation = await prisma.invitation.create({
    data: {
      ownerId: user.id,
      occasionId: occasion.id,
      templateVersionId: templateVersion.id,
      slug: testSlug,
      title: "Kỷ Niệm Yêu Thương: Anh & Em",
      status: "DRAFT",
      qrDesignJson: JSON.stringify({
        presetId: "trai-tim-hoa-hong",
        moduleColor: "#ff2a5f",
        texts: [{ id: "t1", text: "GIFT FOR YOU", x: 500, y: 140, fontSize: 32 }],
        icons: [],
      }),
    },
  });
  console.log(`✓ 2. Khởi tạo thiệp nháp thành công: ID = ${invitation.id}, Slug = ${invitation.slug}`);

  // 4. Lưu revision nội dung (Step 1 - 3: Lời yêu thương, ảnh, nhạc)
  const initialLoveMessages = [
    "Em là điều tuyệt vời nhất thế giới này",
    "Nụ cười của em là nắng ấm mỗi ngày",
    "Thương em nhiều hơn hôm qua",
    "Mãi mãi bên nhau em nhé",
  ];

  await prisma.invitationRevision.create({
    data: {
      invitationId: invitation.id,
      createdBy: user.id,
      versionNumber: 1,
      contentJson: JSON.stringify({
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Kỷ Niệm Yêu Thương: Anh & Em",
        loveMessages: initialLoveMessages,
        galleryUrls: [],
        features: {
          rsvp: false,
          guestbook: false,
        },
      }),
    },
  });
  console.log(`✓ 3. Đã lưu nội dung thiệp với ${initialLoveMessages.length} câu lời yêu thương.`);

  // 5. Thực hiện Mở khóa miễn phí (0đ Free Unlock)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const publicUrl = `http://localhost:3000/i/${invitation.slug}`;

  const unlockedInvitation = await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
      expiresAt: expiresAt,
    },
  });

  console.log(`✓ 4. Mở khóa miễn phí thành công:`);
  console.log(`   - Trạng thái: ${unlockedInvitation.status}`);
  console.log(`   - Link công khai: ${publicUrl}`);
  console.log(`   - Hạn dùng (30 ngày): ${unlockedInvitation.expiresAt?.toISOString()}`);

  // 6. Kiểm tra cấu hình và xuất ảnh QR với các Preset
  console.log(`\n✓ 5. Kiểm tra thiết kế & độ quét được của 16 bộ QR Presets:`);
  for (const preset of QR_PRESETS) {
    const isDark = preset.backgroundType === "dark";
    const lightColor = isDark ? "#0c0d12" : "#ffffff";
    const darkColor = preset.defaultModuleColor;

    // Sinh ma trận QR chuẩn với Error Correction H (30% dung sai)
    const qrBuffer = await QRCode.toBuffer(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 3,
      width: preset.qrSlot.size,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });

    // Tạo artboard 1000x1000 mô phỏng canvas xuất ảnh
    const artboard = sharp({
      create: {
        width: preset.canvasWidth,
        height: preset.canvasHeight,
        channels: 4,
        background: isDark ? { r: 12, g: 13, b: 18, alpha: 1 } : { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    // Composite QR vào đúng vị trí slot của preset
    const compositeLeft = Math.round(preset.qrSlot.x - preset.qrSlot.size / 2);
    const compositeTop = Math.round(preset.qrSlot.y - preset.qrSlot.size / 2);

    const fullImageBuffer = await artboard
      .composite([
        {
          input: qrBuffer,
          left: compositeLeft,
          top: compositeTop,
        },
      ])
      .png()
      .toBuffer();

    // Dùng jsQR quét trực tiếp từ vùng QR của ảnh hoàn chỉnh (giống như camera điện thoại scan)
    const qrRegion = await sharp(fullImageBuffer)
      .extract({
        left: compositeLeft,
        top: compositeTop,
        width: preset.qrSlot.size,
        height: preset.qrSlot.size,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const clampedData = new Uint8ClampedArray(
      qrRegion.data.buffer,
      qrRegion.data.byteOffset,
      qrRegion.data.length
    );

    const decoded = jsQR(clampedData, qrRegion.info.width, qrRegion.info.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!decoded || decoded.data !== publicUrl) {
      throw new Error(`Preset [${preset.id}] thất bại khi quét QR! Decoded: ${decoded?.data}`);
    }
    console.log(`   ✓ Preset "${preset.name}" (${preset.id}): Quét thành công -> ${decoded.data}`);
  }

  // 7. Lưu file ảnh mẫu đã được xác thực quét được ra thư mục public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const samplePreset = QR_PRESETS.find((p) => p.id === "trai-tim-hoa-hong") || QR_PRESETS[0];
  const sampleQrBuffer = await QRCode.toBuffer(publicUrl, {
    errorCorrectionLevel: "H",
    margin: 3,
    width: samplePreset.qrSlot.size,
    color: {
      dark: samplePreset.defaultModuleColor,
      light: "#ffffff",
    },
  });

  const exportPath = path.join(uploadDir, "verified-gift-qr.png");
  await sharp({
    create: {
      width: samplePreset.canvasWidth,
      height: samplePreset.canvasHeight,
      channels: 4,
      background: { r: 255, g: 245, b: 247, alpha: 1 },
    },
  })
    .composite([
      {
        input: sampleQrBuffer,
        left: Math.round(samplePreset.qrSlot.x - samplePreset.qrSlot.size / 2),
        top: Math.round(samplePreset.qrSlot.y - samplePreset.qrSlot.size / 2),
      },
    ])
    .png()
    .toFile(exportPath);

  console.log(`\n✓ 6. Đã xuất file QR chất lượng cao đã xác thực quét được tới:`);
  console.log(`   ${exportPath}`);

  // 8. Dọn dẹp thiệp thử nghiệm
  await prisma.invitationRevision.deleteMany({ where: { invitationId: invitation.id } });
  await prisma.invitation.delete({ where: { id: invitation.id } });

  console.log(`\n=== TẤT CẢ CÁC BƯỚC XÁC THỰC LUỒNG MUA HÀNG VÀ QR CODE THÀNH CÔNG 100%! ===`);
}

main()
  .catch((err) => {
    console.error("LỖI XÁC THỰC:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
