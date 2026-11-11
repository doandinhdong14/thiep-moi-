import { PayOS } from "@payos/node";
import { env } from "@/lib/config/env";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { fulfillOrder } from "./fulfillment";
import { generateQrDataUrl } from "@/lib/qr";
import { buildSafeVietQrDescription, resolveVietQRBank } from "./vietqr";

export interface InAppPayOSQrPayload {
  orderCode: number;
  paymentLinkId: string;
  qrCode: string;
  qrDataUrl: string;
  bin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  expiredAt?: number;
}

let payosInstance: PayOS | null = null;

export function getPayOSClient(): PayOS | null {
  const clientId = process.env.PAYOS_CLIENT_ID || env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY || env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    return null;
  }

  if (!payosInstance) {
    payosInstance = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }
  return payosInstance;
}

export function generatePayOSOrderCode(): number {
  // Generate a safe unique 10 to 12 digit integer
  const nowSec = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 900) + 100;
  return Number(`${nowSec}${rand}`);
}

export async function parseStoredPayOSQrAttempt(attempt: {
  status: string;
  amountVnd: number;
  providerRef: string | null;
  rawSafeMetadata: string | null;
}): Promise<InAppPayOSQrPayload | null> {
  if (attempt.status !== "PENDING" || !attempt.rawSafeMetadata) return null;
  try {
    const parsed = JSON.parse(attempt.rawSafeMetadata);
    if (!parsed?.qrCode || !parsed?.orderCode) return null;
    if (
      typeof parsed.expiredAt === "number" &&
      parsed.expiredAt * 1000 <= Date.now() + 30_000
    ) {
      return null;
    }
    const bank = resolveVietQRBank(parsed.bin);
    const qrDataUrl = await generateQrDataUrl(parsed.qrCode, { width: 320, margin: 2 });
    return {
      orderCode: Number(parsed.orderCode),
      paymentLinkId: String(parsed.paymentLinkId || ""),
      qrCode: String(parsed.qrCode),
      qrDataUrl,
      bin: bank.bin,
      bankName: parsed.bankName || bank.name,
      accountNumber: String(parsed.accountNumber || ""),
      accountName: String(parsed.accountName || ""),
      amount: Number(parsed.amount || attempt.amountVnd),
      description: String(parsed.description || ""),
      expiredAt: typeof parsed.expiredAt === "number" ? parsed.expiredAt : undefined,
    };
  } catch {
    return null;
  }
}

export async function createPayOSPaymentLink({
  order,
  origin,
}: {
  order: {
    id: string;
    orderNumber: string;
    totalVnd: number;
    lines: Array<{ titleSnapshot: string; quantity: number; unitPriceVnd: number }>;
  };
  origin: string;
}): Promise<InAppPayOSQrPayload> {
  // Reuse active PENDING PayOS VietQR attempt for this order when amount matches
  const existingAttempts = await prisma.paymentAttempt.findMany({
    where: {
      orderId: order.id,
      provider: "payos",
      status: "PENDING",
      amountVnd: order.totalVnd,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  for (const attempt of existingAttempts) {
    const cached = await parseStoredPayOSQrAttempt(attempt);
    if (cached) {
      return cached;
    }
  }

  const payos = getPayOSClient();
  if (!payos) {
    throw new Error("PayOS chưa được cấu hình Client ID, API Key hoặc Checksum Key.");
  }

  const orderCode = generatePayOSOrderCode();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || origin || "https://dingdonggift.com").replace(/\/$/, "");
  const returnUrl = `${baseUrl}/checkout/${order.id}?status=success`;
  const cancelUrl = `${baseUrl}/checkout/${order.id}?status=cancelled`;

  // PayOS description max 25 chars alphanumeric
  const description = buildSafeVietQrDescription(`DDG ${order.orderNumber}`, 25);

  const items = order.lines.map((l) => ({
    name: l.titleSnapshot.slice(0, 50),
    quantity: l.quantity,
    price: l.unitPriceVnd,
  }));

  const paymentData = {
    orderCode,
    amount: order.totalVnd,
    description,
    returnUrl,
    cancelUrl,
    items,
  };

  const response = await payos.paymentRequests.create(paymentData);
  const bank = resolveVietQRBank(response.bin);
  const qrDataUrl = await generateQrDataUrl(response.qrCode, { width: 320, margin: 2 });

  const storedPayload = {
    orderCode,
    paymentLinkId: response.paymentLinkId,
    qrCode: response.qrCode,
    bin: bank.bin,
    bankName: bank.name,
    accountNumber: response.accountNumber,
    accountName: response.accountName,
    amount: response.amount,
    description: response.description,
    expiredAt: response.expiredAt,
  };

  // Store payment attempt without exposing external PayOS redirect URL to client
  await prisma.paymentAttempt.create({
    data: {
      orderId: order.id,
      provider: "payos",
      providerRef: String(orderCode),
      status: "PENDING",
      amountVnd: order.totalVnd,
      rawSafeMetadata: JSON.stringify(storedPayload),
    },
  });

  return {
    ...storedPayload,
    qrDataUrl,
  };
}

export async function processPayOSWebhookPayload(webhookBody: any) {
  const payos = getPayOSClient();
  if (!payos) {
    throw new Error("PayOS client is not configured.");
  }

  // 1. Verify webhook signature
  let verifiedData: any;
  try {
    verifiedData = await payos.webhooks.verify(webhookBody);
  } catch (err: any) {
    // If webhook is a test ping from PayOS console (e.g. orderCode 123 or sample), allow gracefully
    if (webhookBody?.data?.orderCode === 123 || webhookBody?.data?.description === "test") {
      return { success: true, message: "PayOS test webhook ping verified successfully." };
    }
    throw new Error(`Xác thực chữ ký Webhook PayOS thất bại: ${err.message}`);
  }

  const { orderCode, code, reference, paymentLinkId } = verifiedData;

  // 2. Idempotency Check in PaymentWebhookEvent
  const providerEventId = `${orderCode}_${reference || paymentLinkId || Date.now()}`;
  const payloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(webhookBody))
    .digest("hex");

  const existingEvent = await prisma.paymentWebhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: "payos",
        providerEventId,
      },
    },
  });

  if (existingEvent && existingEvent.status === "PROCESSED") {
    return { success: true, message: "Webhook đã được xử lý trước đó (idempotent)." };
  }

  // Upsert received event
  await prisma.paymentWebhookEvent.upsert({
    where: {
      provider_providerEventId: {
        provider: "payos",
        providerEventId,
      },
    },
    create: {
      provider: "payos",
      providerEventId,
      signatureVerified: true,
      status: "RECEIVED",
      payloadHash,
    },
    update: {
      signatureVerified: true,
      payloadHash,
    },
  });

  // Only proceed if payment code is "00" (successful)
  if (code !== "00") {
    return { success: true, message: `Bỏ qua trạng thái không thành công: ${code}` };
  }

  // 3. Find matching PaymentAttempt or Order
  const paymentAttempt = await prisma.paymentAttempt.findFirst({
    where: {
      provider: "payos",
      providerRef: String(orderCode),
    },
    include: {
      order: {
        include: {
          lines: true,
        },
      },
    },
  });

  if (!paymentAttempt) {
    return { success: true, message: `Không tìm thấy đơn hàng tương ứng với PayOS orderCode: ${orderCode}` };
  }

  const order = paymentAttempt.order;

  // Idempotent check on Order
  if (order.status === "PAID") {
    await prisma.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "payos",
          providerEventId,
        },
      },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return { success: true, message: "Đơn hàng đã được đánh dấu thanh toán trước đó." };
  }

  // 4. Atomic transaction to mark Order PAID, create Entitlements and Commissions
  await finalizePaidOrderFromPayOS({
    orderId: order.id,
    paymentAttemptId: paymentAttempt.id,
    rawMetadata: verifiedData,
    providerEventId,
  });

  return { success: true, message: `Đơn hàng #${order.orderNumber} đã thanh toán thành công qua PayOS.` };
}

export async function finalizePaidOrderFromPayOS({
  orderId,
  paymentAttemptId,
  rawMetadata,
  providerEventId,
}: {
  orderId: string;
  paymentAttemptId: string;
  rawMetadata: unknown;
  providerEventId?: string;
}) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Atomic claim prevents double fulfillment between simultaneous webhook and polling sync
    const claim = await tx.order.updateMany({
      where: {
        id: orderId,
        status: { not: "PAID" },
      },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paidAt: now,
      },
    });

    if (claim.count > 0) {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { lines: true },
      });

      if (order) {
        await tx.paymentAttempt.update({
          where: { id: paymentAttemptId },
          data: {
            status: "PAID",
            paidAt: now,
            rawSafeMetadata: JSON.stringify(rawMetadata),
          },
        });

        await fulfillOrder(order.id, tx);

        let purchaseInvitationId: string | null = null;
        if (order.purchaseContext) {
          try {
            const parsed = JSON.parse(order.purchaseContext);
            purchaseInvitationId = parsed.invitationId || null;
          } catch {}
        }

        for (const line of order.lines) {
          if (line.productType === "DIGITAL_PLAN" && line.referenceId) {
            const plan = await tx.plan.findUnique({ where: { id: line.referenceId } });
            const durationDays = plan?.defaultDurationDays || 30;
            const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            await tx.entitlement.create({
              data: {
                ownerId: order.buyerId,
                planId: line.referenceId,
                invitationId: purchaseInvitationId,
                sourceOrderLineId: line.id,
                beginsAt: now,
                expiresAt,
                status: "ACTIVE",
              },
            });
          }
        }

        if (order.referredAffiliateId) {
          const affiliate = await tx.affiliateProfile.findUnique({
            where: { id: order.referredAffiliateId },
          });

          if (affiliate && affiliate.userId !== order.buyerId && affiliate.status === "APPROVED") {
            const defaultProgram = await tx.affiliateProgram.findFirst({
              where: { code: "DEFAULT_10", active: true },
            });

            if (defaultProgram) {
              const eligibleBaseVnd = order.lines
                .filter((l) => l.commissionEligible)
                .reduce((sum, l) => sum + l.totalVnd, 0);

              const commissionAmountVnd = Math.floor((eligibleBaseVnd * defaultProgram.rateBps) / 10000);

              if (commissionAmountVnd > 0) {
                const holdDays = defaultProgram.holdDays || 14;
                const holdUntil = new Date(now.getTime() + holdDays * 24 * 60 * 60 * 1000);

                const comm = await tx.commission.create({
                  data: {
                    orderId: order.id,
                    affiliateId: affiliate.id,
                    programId: defaultProgram.id,
                    programRateBpsSnapshot: defaultProgram.rateBps,
                    eligibleBaseVnd,
                    amountVnd: commissionAmountVnd,
                    status: "PENDING",
                    holdUntil,
                    approvedAt: now,
                  },
                });

                await tx.commissionLedgerEntry.create({
                  data: {
                    commissionId: comm.id,
                    affiliateId: affiliate.id,
                    type: "EARNED",
                    amountVnd: commissionAmountVnd,
                    idempotencyKey: `comm_earned_${order.id}`,
                    effectiveAt: now,
                  },
                });
              }
            }
          }
        }
      }
    }

    if (providerEventId) {
      await tx.paymentWebhookEvent.update({
        where: {
          provider_providerEventId: {
            provider: "payos",
            providerEventId,
          },
        },
        data: {
          status: "PROCESSED",
          processedAt: now,
        },
      });
    }
  });
}

/**
 * Checks PayOS status directly for active pending payment attempts so in-app checkout confirms
 * immediately even if webhook delivery lags.
 */
export async function syncPayOSOrderStatus(orderId: string): Promise<{ synced: boolean; paid: boolean }> {
  const payos = getPayOSClient();
  if (!payos) return { synced: false, paid: false };

  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      orderId,
      provider: "payos",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!attempt?.providerRef) return { synced: false, paid: false };
  const orderCode = Number(attempt.providerRef);
  if (!Number.isFinite(orderCode) || orderCode <= 0) return { synced: false, paid: false };

  try {
    const link = await payos.paymentRequests.get(orderCode);
    if (link.status === "PAID" || (link.amount > 0 && link.amountPaid >= link.amount)) {
      await finalizePaidOrderFromPayOS({
        orderId,
        paymentAttemptId: attempt.id,
        rawMetadata: link,
      });
      return { synced: true, paid: true };
    }

    if (link.status === "CANCELLED" || link.status === "EXPIRED") {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: link.status === "CANCELLED" ? "CANCELLED" : "FAILED" },
      });
      return { synced: true, paid: false };
    }

    return { synced: true, paid: false };
  } catch {
    return { synced: false, paid: false };
  }
}

