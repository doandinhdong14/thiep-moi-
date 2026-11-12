import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { generateQrDataUrl, generateQrPng, generateQrSvg } from "@/lib/qr";
import { requireShopStaff } from "@/lib/shop/auth";
import { getRequestBaseUrl, handleShopApiError } from "@/lib/shop/api-helpers";
import {
  createGiftUnitTokenPair,
  revealGiftUnitRawToken,
} from "@/lib/shop/gift-card";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { unitId: string } },
) {
  try {
    await requireShopStaff();
    const unit = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: params.unitId },
      include: {
        order: { select: { orderCode: true, status: true, paymentStatus: true } },
      },
    });
    if (!unit) {
      return apiError("Không tìm thấy hộp quà.", "NOT_FOUND", 404);
    }

    const rawToken = revealGiftUnitRawToken(unit.giftTokenEncrypted);
    if (!rawToken) {
      return apiError(
        "Không giải mã được QR token hộp này; vui lòng cấp lại mã QR mới.",
        "QR_TOKEN_UNREADABLE",
        500,
      );
    }

    const baseUrl = getRequestBaseUrl(req);
    const giftUrl = `${baseUrl}/mo-qua/${rawToken}`;
    const previewUrl = `${giftUrl}?mode=preview`;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    if (format === "png") {
      const pngBuffer = await generateQrPng(giftUrl, { width: 640, margin: 2 });
      return new NextResponse(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${unit.boxReferenceCode}-qr-v${unit.qrVersion}.png"`,
        },
      });
    }

    if (format === "svg") {
      const svg = await generateQrSvg(giftUrl, { width: 480, margin: 2 });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${unit.boxReferenceCode}-qr-v${unit.qrVersion}.svg"`,
        },
      });
    }

    const qrDataUrl = await generateQrDataUrl(giftUrl, { width: 420, margin: 2 });
    return apiSuccess({
      unitId: unit.id,
      orderCode: unit.order.orderCode,
      unitLabel: unit.unitLabel,
      boxReferenceCode: unit.boxReferenceCode,
      cardState: unit.cardState,
      packingStatus: unit.packingStatus,
      qrVersion: unit.qrVersion,
      qrDataUrl,
      giftPath: `/mo-qua/${rawToken}`,
      giftUrl,
      previewUrl,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

const QrActionSchema = z.object({
  action: z.enum(["MARK_PRINTED", "VERIFY_SCAN", "REISSUE_QR"]),
});

export async function POST(
  req: Request,
  { params }: { params: { unitId: string } },
) {
  try {
    const { user } = await requireShopStaff();
    const body = QrActionSchema.parse(await req.json());
    const unit = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: params.unitId },
      include: { order: true },
    });
    if (!unit) {
      return apiError("Không tìm thấy hộp quà.", "NOT_FOUND", 404);
    }

    const now = new Date();
    if (body.action === "MARK_PRINTED") {
      const updated = await prisma.storeOrderGiftUnit.update({
        where: { id: unit.id },
        data: { qrPrintedAt: now },
      });
      await prisma.storeAuditLog.create({
        data: {
          orderId: unit.orderId,
          actorId: user.id,
          action: "GIFT_QR_PRINTED",
          targetType: "StoreOrderGiftUnit",
          targetId: unit.id,
          summary: `Đã in phiếu QR cho ${unit.unitLabel} (${unit.boxReferenceCode}).`,
        },
      });
      return apiSuccess({ qrPrintedAt: updated.qrPrintedAt?.toISOString() ?? null });
    }

    if (body.action === "VERIFY_SCAN") {
      // Verifies without activating firstOpenedAt!
      const updated = await prisma.storeOrderGiftUnit.update({
        where: { id: unit.id },
        data: {
          qrVerifyCount: { increment: 1 },
          packingStatus: "SCANNED_VERIFIED",
        },
      });
      await prisma.storeAuditLog.create({
        data: {
          orderId: unit.orderId,
          actorId: user.id,
          action: "GIFT_QR_INTERNAL_VERIFIED",
          targetType: "StoreOrderGiftUnit",
          targetId: unit.id,
          summary: `Kiểm tra quét QR nội bộ thành công (${unit.boxReferenceCode}); chưa kích hoạt hạn sử dụng người nhận.`,
        },
      });
      return apiSuccess({
        verified: true,
        packingStatus: updated.packingStatus,
        firstOpenedAt: updated.firstOpenedAt?.toISOString() ?? null,
      });
    }

    // REISSUE_QR: rotate token hash & ciphertext, previous printed QR immediately fails!
    if (unit.firstOpenedAt) {
      return apiError(
        "Người nhận đã mở thiệp rồi; không khuyến nghị đổi mã QR làm hỏng liên kết cũ.",
        "ALREADY_OPENED",
        409,
      );
    }

    const pair = createGiftUnitTokenPair();
    const updated = await prisma.storeOrderGiftUnit.update({
      where: { id: unit.id },
      data: {
        giftTokenHash: pair.giftTokenHash,
        giftTokenEncrypted: pair.giftTokenEncrypted,
        qrVersion: { increment: 1 },
        packingStatus: "PENDING",
        qrPrintedAt: null,
      },
    });
    await prisma.storeAuditLog.create({
      data: {
        orderId: unit.orderId,
        actorId: user.id,
        action: "GIFT_QR_REISSUED",
        targetType: "StoreOrderGiftUnit",
        targetId: unit.id,
        summary: `Cấp lại mã QR mới (v${updated.qrVersion}) cho ${unit.boxReferenceCode}; mã cũ đã vô hiệu hóa.`,
      },
    });

    const baseUrl = getRequestBaseUrl(req);
    const giftUrl = `${baseUrl}/mo-qua/${pair.rawToken}`;
    const qrDataUrl = await generateQrDataUrl(giftUrl, { width: 420, margin: 2 });

    return apiSuccess({
      reissued: true,
      qrVersion: updated.qrVersion,
      giftPath: `/mo-qua/${pair.rawToken}`,
      giftUrl,
      previewUrl: `${giftUrl}?mode=preview`,
      qrDataUrl,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

