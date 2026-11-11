import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { env } from "@/lib/config/env";
import { generateQrDataUrl } from "@/lib/qr";
import {
  getPayOSClient,
  InAppPayOSQrPayload,
  parseStoredPayOSQrAttempt,
  syncPayOSOrderStatus,
} from "@/lib/payments/payos";
import {
  buildSafeVietQrDescription,
  buildVietQrPayload,
  resolveVietQRBank,
} from "@/lib/payments/vietqr";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    let order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
        paymentAttempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    if (order.buyerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền truy cập đơn hàng này.", "FORBIDDEN", 403);
    }

    // Proactively sync PayOS payment status during polling so confirmation stays 100% inside Ding Dong Gift
    if (order.status !== "PAID" && getPayOSClient()) {
      const syncResult = await syncPayOSOrderStatus(order.id);
      if (syncResult.synced) {
        const refreshed = await prisma.order.findUnique({
          where: { id: params.id },
          include: {
            lines: true,
            paymentAttempts: {
              orderBy: { createdAt: "desc" },
            },
          },
        });
        if (refreshed) {
          order = refreshed;
        }
      }
    }

    let payosQr: InAppPayOSQrPayload | null = null;
    if (order.status !== "PAID") {
      for (const attempt of order.paymentAttempts) {
        if (attempt.provider === "payos" && attempt.status === "PENDING") {
          payosQr = await parseStoredPayOSQrAttempt(attempt);
          if (payosQr) break;
        }
      }
    }

    const bankCodeOrBin = process.env.BANK_TRANSFER_BANK_CODE || env.BANK_TRANSFER_BANK_CODE;
    const bank = resolveVietQRBank(bankCodeOrBin);
    const accountNumber =
      process.env.BANK_TRANSFER_ACCOUNT_NUMBER || env.BANK_TRANSFER_ACCOUNT_NUMBER;
    const accountHolder =
      process.env.BANK_TRANSFER_DISPLAY_NAME || env.BANK_TRANSFER_DISPLAY_NAME;
    const transferSyntax = buildSafeVietQrDescription(order.orderNumber, 25);

    const manualQrPayload = buildVietQrPayload({
      bankBin: bank.bin,
      accountNumber,
      amount: order.totalVnd,
      description: transferSyntax,
    });
    const manualQrDataUrl = await generateQrDataUrl(manualQrPayload, {
      width: 320,
      margin: 2,
    });

    const allowSandboxSimulation =
      process.env.NODE_ENV !== "production" ||
      (process.env.PAYMENT_MODE || env.PAYMENT_MODE) === "sandbox";

    return apiSuccess({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        purpose: order.purpose,
        paymentStatus: order.paymentStatus,
        subtotalVnd: order.subtotalVnd,
        discountVnd: order.discountVnd,
        totalVnd: order.totalVnd,
        currency: order.currency,
        paidAt: order.paidAt,
        lines: order.lines,
        purchaseContext: order.purchaseContext ? JSON.parse(order.purchaseContext) : null,
        payosConfigured: Boolean(getPayOSClient()),
        payosQr,
        allowSandboxSimulation,
        paymentInstructions: {
          bankName: bank.name,
          bankBin: bank.bin,
          accountNumber,
          accountHolder,
          transferSyntax,
          amountVnd: order.totalVnd,
          qrDataUrl: manualQrDataUrl,
        },
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

