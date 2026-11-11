import { PayOS } from "@payos/node";
import { env } from "@/lib/config/env";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { createAffiliateCommissionForOrder, fulfillOrder } from "./fulfillment";
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
let payosConfigSignature = "";
const confirmedWebhookUrls = new Set<string>();

export function getPayOSClient(): PayOS | null {
  const clientId = (process.env.PAYOS_CLIENT_ID || env.PAYOS_CLIENT_ID || "").trim();
  const apiKey = (process.env.PAYOS_API_KEY || env.PAYOS_API_KEY || "").trim();
  const checksumKey = (process.env.PAYOS_CHECKSUM_KEY || env.PAYOS_CHECKSUM_KEY || "").trim();

  if (!clientId || !apiKey || !checksumKey) {
    return null;
  }

  const nextSignature = `${clientId}:${apiKey}:${checksumKey}`;
  if (!payosInstance || payosConfigSignature !== nextSignature) {
    payosInstance = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
    payosConfigSignature = nextSignature;
  }
  return payosInstance;
}

async function ensurePayOSWebhookRegistered(
  payos: PayOS,
  webhookUrl: string,
  baseUrl: string
): Promise<void> {
  if (!webhookUrl || confirmedWebhookUrls.has(webhookUrl)) return;
  try {
    const webhookHost = new URL(webhookUrl).host;
    const appHost = new URL(baseUrl).host;
    if (!webhookHost || webhookHost !== appHost || webhookHost.includes("localhost")) {
      return;
    }
    confirmedWebhookUrls.add(webhookUrl);
    await payos.webhooks.confirm(webhookUrl);
  } catch {
    confirmedWebhookUrls.delete(webhookUrl);
  }
}

export function generatePayOSOrderCode(): number {
  // Generate a safe unique 10 to 13 digit integer
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

  const configuredWebhookUrl = (process.env.PAYOS_WEBHOOK_URL || env.PAYOS_WEBHOOK_URL || "").trim();
  if (configuredWebhookUrl.startsWith("https://")) {
    void ensurePayOSWebhookRegistered(payos, configuredWebhookUrl, baseUrl);
  }

  // PayOS description max 25 chars alphanumeric (some non-linked banks allow max 9 chars)
  const compactOrderNumber = order.orderNumber.replace(/^DDG-?/i, "");
  const primaryDescription =
    buildSafeVietQrDescription(`DDG ${compactOrderNumber}`, 25) ||
    `DDG${String(orderCode).slice(-8)}`;

  const rawItems = order.lines.map((l) => ({
    name: l.titleSnapshot.slice(0, 50),
    quantity: Math.max(1, l.quantity),
    price: Math.max(0, l.unitPriceVnd),
  }));
  const itemsSum = rawItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const items =
    rawItems.length > 0 && itemsSum === order.totalVnd && rawItems.every((i) => i.price > 0)
      ? rawItems
      : [
          {
            name: (order.lines[0]?.titleSnapshot || `Don hang ${order.orderNumber}`).slice(0, 50),
            quantity: 1,
            price: order.totalVnd,
          },
        ];

  let response;
  try {
    response = await payos.paymentRequests.create({
      orderCode,
      amount: order.totalVnd,
      description: primaryDescription,
      returnUrl,
      cancelUrl,
      items,
    });
  } catch (err: any) {
    const shortDescription =
      buildSafeVietQrDescription(compactOrderNumber, 9) ||
      `DDG${String(orderCode).slice(-6)}`;
    const errMessage = String(err?.message || "");
    if (shortDescription !== primaryDescription && /mô tả|description|9|ký tự/i.test(errMessage)) {
      response = await payos.paymentRequests.create({
        orderCode,
        amount: order.totalVnd,
        description: shortDescription,
        returnUrl,
        cancelUrl,
        items,
      });
    } else {
      throw err;
    }
  }

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
    if (
      webhookBody?.data?.orderCode === 123 ||
      webhookBody?.data?.description === "test" ||
      webhookBody?.data?.description === "VQRIO123"
    ) {
      return { success: true, message: "PayOS test webhook ping verified successfully." };
    }
    throw new Error(`Xác thực chữ ký Webhook PayOS thất bại: ${err.message}`);
  }

  if (Number(verifiedData?.orderCode) === 123) {
    return { success: true, message: "PayOS test webhook ping verified successfully." };
  }

  const { orderCode, code, reference, paymentLinkId, amount } = verifiedData;

  // 2. Idempotency Check in PaymentWebhookEvent
  const payloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(webhookBody))
    .digest("hex");
  const providerEventId = `${orderCode}_${reference || paymentLinkId || payloadHash.slice(0, 16)}`;

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
  const isSuccessCode =
    code === "00" || (!code && webhookBody?.code === "00" && webhookBody?.success === true);
  if (!isSuccessCode) {
    await prisma.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "payos",
          providerEventId,
        },
      },
      data: { status: "IGNORED", processedAt: new Date() },
    });
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
    await prisma.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "payos",
          providerEventId,
        },
      },
      data: { status: "IGNORED", processedAt: new Date() },
    });
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

  // Verify full amount has been paid before unlocking (supports split transfers via PayOS API check)
  if (typeof amount === "number" && order.totalVnd > 0 && amount < order.totalVnd) {
    const link = await payos.paymentRequests.get(Number(orderCode)).catch(() => null);
    const totalPaid = link?.amountPaid ?? amount;
    if (link?.status !== "PAID" && totalPaid < order.totalVnd) {
      await prisma.paymentWebhookEvent.update({
        where: {
          provider_providerEventId: {
            provider: "payos",
            providerEventId,
          },
        },
        data: { status: "PARTIAL", processedAt: new Date() },
      });
      return {
        success: true,
        message: `Đã nhận ${totalPaid.toLocaleString("vi-VN")}đ / ${order.totalVnd.toLocaleString("vi-VN")}đ, chờ đủ số tiền.`,
      };
    }
  }

  // 4. Atomic transaction to mark Order PAID, fulfill perks, create Entitlements and Commissions
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
      await tx.paymentAttempt.update({
        where: { id: paymentAttemptId },
        data: {
          status: "PAID",
          paidAt: now,
          rawSafeMetadata: JSON.stringify(rawMetadata),
        },
      });

      await fulfillOrder(orderId, tx);
      await createAffiliateCommissionForOrder(orderId, now, tx);
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
 * immediately even if webhook delivery lags or is unreachable (e.g., local development).
 */
export async function syncPayOSOrderStatus(orderId: string): Promise<{ synced: boolean; paid: boolean }> {
  const payos = getPayOSClient();
  if (!payos) return { synced: false, paid: false };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, totalVnd: true },
  });
  if (!order) return { synced: false, paid: false };
  if (order.status === "PAID") return { synced: true, paid: true };

  const attempts = await prisma.paymentAttempt.findMany({
    where: {
      orderId,
      provider: "payos",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (attempts.length === 0) return { synced: false, paid: false };

  let anySynced = false;
  for (const attempt of attempts) {
    if (!attempt.providerRef) continue;
    const orderCode = Number(attempt.providerRef);
    if (!Number.isFinite(orderCode) || orderCode <= 0) continue;

    try {
      const link = await payos.paymentRequests.get(orderCode);
      anySynced = true;

      const isPaid =
        link.status === "PAID" ||
        (link.amount > 0 && link.amountPaid >= link.amount) ||
        (order.totalVnd > 0 && link.amountPaid >= order.totalVnd);

      if (isPaid) {
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
      }
    } catch {
      // Try remaining pending attempts before returning
    }
  }

  return { synced: anySynced, paid: false };
}

/**
 * Syncs recent pending PayOS orders for a user so returning to the editor or dashboard
 * immediately reflects completed transfers even if the user left the checkout page early.
 */
export async function syncPendingPayOSOrdersForUser(
  userId: string,
  options?: { giftId?: string }
): Promise<number> {
  const payos = getPayOSClient();
  if (!payos) return 0;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pendingOrders = await prisma.order.findMany({
    where: {
      buyerId: userId,
      status: { in: ["PENDING", "TRANSFER_SUBMITTED"] },
      createdAt: { gte: since },
      paymentAttempts: {
        some: {
          provider: "payos",
          status: "PENDING",
        },
      },
    },
    select: {
      id: true,
      purchaseContext: true,
      lines: { select: { referenceId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (pendingOrders.length === 0) return 0;

  const prioritized = options?.giftId
    ? [...pendingOrders].sort((a, b) => {
        const aMatch =
          a.purchaseContext?.includes(options.giftId!) ||
          a.lines.some((l) => l.referenceId === options.giftId);
        const bMatch =
          b.purchaseContext?.includes(options.giftId!) ||
          b.lines.some((l) => l.referenceId === options.giftId);
        return Number(bMatch) - Number(aMatch);
      })
    : pendingOrders;

  let paidCount = 0;
  for (const ord of prioritized.slice(0, 3)) {
    const res = await syncPayOSOrderStatus(ord.id);
    if (res.paid) paidCount += 1;
  }
  return paidCount;
}

