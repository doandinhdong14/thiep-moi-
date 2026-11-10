import { PayOS } from "@payos/node";
import { env } from "@/lib/config/env";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { fulfillOrder } from "./fulfillment";

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
}) {
  const payos = getPayOSClient();
  if (!payos) {
    throw new Error("PayOS chưa được cấu hình Client ID, API Key hoặc Checksum Key.");
  }

  const orderCode = generatePayOSOrderCode();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || origin || "https://dingdonggift.com").replace(/\/$/, "");
  const returnUrl = `${baseUrl}/checkout/${order.id}?status=success`;
  const cancelUrl = `${baseUrl}/checkout/${order.id}?status=cancelled`;

  // PayOS description max 25 chars alphanumeric
  const cleanOrderNum = order.orderNumber.replace(/[^a-zA-Z0-9]/g, "");
  const description = `DDG ${cleanOrderNum}`.slice(0, 25);

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

  // Store payment attempt
  await prisma.paymentAttempt.create({
    data: {
      orderId: order.id,
      provider: "payos",
      providerRef: String(orderCode),
      status: "PENDING",
      amountVnd: order.totalVnd,
      rawSafeMetadata: JSON.stringify({
        orderCode,
        checkoutUrl: response.checkoutUrl,
        qrCode: response.qrCode,
        paymentLinkId: response.paymentLinkId,
      }),
    },
  });

  return {
    orderCode,
    checkoutUrl: response.checkoutUrl,
    qrCode: response.qrCode,
    paymentLinkId: response.paymentLinkId,
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
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Update Order
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paidAt: now,
      },
    });

    // Update PaymentAttempt
    await tx.paymentAttempt.update({
      where: { id: paymentAttempt.id },
      data: {
        status: "PAID",
        paidAt: now,
        rawSafeMetadata: JSON.stringify(verifiedData),
      },
    });

    // Fulfill based on order purpose (media credits, gift unlock, renewal, etc.)
    await fulfillOrder(order.id, tx);

    // Create Entitlements
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

    // Commission 10% for referred affiliate
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

    // Mark webhook event processed
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
  });

  return { success: true, message: `Đơn hàng #${order.orderNumber} đã thanh toán thành công qua PayOS.` };
}

