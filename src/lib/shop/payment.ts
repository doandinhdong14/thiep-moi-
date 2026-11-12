import prisma from "@/lib/prisma";
import { getPayOSClient } from "@/lib/payments/payos";
import {
  buildSafeVietQrDescription,
  buildVietQrPayload,
  resolveVietQRBank,
} from "@/lib/payments/vietqr";
import { generateQrDataUrl } from "@/lib/qr";
import {
  commitOrderStockOnPaymentInTx,
  releaseOrderReservationsInTx,
  restockCommittedOrderInTx,
} from "./inventory";
import {
  getShopSettings,
  isBankTransferConfigured,
  isPayOSGatewayAvailable,
} from "./settings";
import type { ShopSettings, StorePaymentMethod } from "./types";

export interface InitializedPaymentOutput {
  paymentId: string;
  provider: StorePaymentMethod;
  status: string;
  amountVnd: number;
  qrPayload?: string | null;
  qrDataUrl?: string | null;
  transferContent?: string | null;
  checkoutUrl?: string | null;
  bankDetails?: {
    bankCode: string;
    bankName: string;
    accountNo: string;
    accountName: string;
    branch: string;
    instructions: string;
  } | null;
}

export async function createPaymentForOrder(params: {
  order: {
    id: string;
    orderCode: string;
    totalVnd: number;
    paymentMethod: StorePaymentMethod;
  };
  settings: ShopSettings;
  baseUrl: string;
}): Promise<InitializedPaymentOutput> {
  const { order, settings, baseUrl } = params;

  if (order.paymentMethod === "bank_transfer") {
    if (!isBankTransferConfigured(settings)) {
      throw new Error("BANK_TRANSFER_NOT_CONFIGURED");
    }
    const bankMeta = resolveVietQRBank(settings.bankTransfer.bankCode)!;
    const transferContent = buildSafeVietQrDescription(`DDG ${order.orderCode}`, 50);
    const qrPayload = buildVietQrPayload({
      bankBin: bankMeta.bin,
      accountNumber: settings.bankTransfer.accountNo.trim(),
      amount: order.totalVnd,
      description: transferContent,
    });
    const qrDataUrl = await generateQrDataUrl(qrPayload);

    const payment = await prisma.storePayment.create({
      data: {
        orderId: order.id,
        provider: "bank_transfer",
        providerRef: order.orderCode,
        amountVnd: order.totalVnd,
        status: "PENDING",
        qrPayload,
        transferContent,
      },
    });

    return {
      paymentId: payment.id,
      provider: "bank_transfer",
      status: payment.status,
      amountVnd: payment.amountVnd,
      qrPayload,
      qrDataUrl,
      transferContent,
      bankDetails: {
        bankCode: settings.bankTransfer.bankCode,
        bankName: settings.bankTransfer.bankName || bankMeta.name || bankMeta.code,
        accountNo: settings.bankTransfer.accountNo.trim(),
        accountName: settings.bankTransfer.accountName.trim(),
        branch: settings.bankTransfer.branch.trim(),
        instructions: settings.bankTransfer.instructions.trim(),
      },
    };
  }

  if (order.paymentMethod === "payos") {
    if (!isPayOSGatewayAvailable(settings)) {
      throw new Error("PAYOS_NOT_CONFIGURED");
    }
    const payos = getPayOSClient()!;
    const payosOrderCode = Number(
      `${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 89)}`,
    );
    const description = buildSafeVietQrDescription(`DDG ${order.orderCode}`, 25);

    const response = await payos.paymentRequests.create({
      orderCode: payosOrderCode,
      amount: order.totalVnd,
      description,
      returnUrl: `${baseUrl}/qua-tang/thanh-toan/${order.orderCode}?payos=return`,
      cancelUrl: `${baseUrl}/qua-tang/thanh-toan/${order.orderCode}?payos=cancel`,
    });

    const qrDataUrl = response.qrCode ? await generateQrDataUrl(response.qrCode) : null;
    const payment = await prisma.storePayment.create({
      data: {
        orderId: order.id,
        provider: "payos",
        providerRef: String(payosOrderCode),
        amountVnd: order.totalVnd,
        status: "PENDING",
        qrPayload: response.qrCode || null,
        checkoutUrl: response.checkoutUrl || null,
        transferContent: description,
        rawMetaJson: JSON.stringify({
          paymentLinkId: response.paymentLinkId || null,
          bin: response.bin || null,
          accountNumber: response.accountNumber || null,
          accountName: response.accountName || null,
        }),
      },
    });

    return {
      paymentId: payment.id,
      provider: "payos",
      status: payment.status,
      amountVnd: payment.amountVnd,
      qrPayload: response.qrCode || null,
      qrDataUrl,
      checkoutUrl: response.checkoutUrl || null,
      transferContent: description,
    };
  }

  // COD
  if (!settings.cod.enabled) {
    throw new Error("COD_DISABLED");
  }
  if (order.totalVnd > settings.cod.maxOrderTotalVnd) {
    throw new Error("COD_MAX_LIMIT_EXCEEDED");
  }

  const payment = await prisma.storePayment.create({
    data: {
      orderId: order.id,
      provider: "cod",
      providerRef: order.orderCode,
      amountVnd: order.totalVnd,
      status: "PENDING",
    },
  });

  return {
    paymentId: payment.id,
    provider: "cod",
    status: payment.status,
    amountVnd: payment.amountVnd,
  };
}

export async function requestBankTransferReview(params: {
  orderId: string;
  note?: string;
  actorId?: string | null;
}) {
  const { orderId, note, actorId } = params;
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }
    if (order.paymentMethod !== "bank_transfer") {
      throw new Error("INVALID_PAYMENT_METHOD");
    }
    if (order.paymentStatus === "PAID") {
      return { ok: true, alreadyPaid: true, status: order.status };
    }
    if (
      !["PENDING_PAYMENT", "PAYMENT_REVIEW_REQUESTED"].includes(order.status)
    ) {
      throw new Error("ORDER_NOT_PENDING_PAYMENT");
    }

    // Never mark PAID from buyer click! Only request Admin review.
    await tx.storeOrder.update({
      where: { id: order.id },
      data: {
        status: "PAYMENT_REVIEW_REQUESTED",
        paymentStatus: "REVIEW_REQUESTED",
      },
    });

    if (order.payments[0]) {
      await tx.storePayment.update({
        where: { id: order.payments[0].id },
        data: {
          status: "REVIEW_REQUESTED",
          paymentNote: note?.trim().slice(0, 400) || order.payments[0].paymentNote,
          requestedReviewAt: now,
        },
      });
    }

    await tx.storeAuditLog.create({
      data: {
        orderId: order.id,
        actorId: actorId ?? null,
        action: "BUYER_REQUESTED_PAYMENT_REVIEW",
        targetType: "StoreOrder",
        targetId: order.id,
        summary: "Khách đã nhấn 'Tôi đã chuyển khoản', chuyển sang chờ Admin đối soát.",
        metaJson: JSON.stringify({ note: note || null }),
      },
    });

    return {
      ok: true,
      alreadyPaid: false,
      status: "PAYMENT_REVIEW_REQUESTED",
    };
  });
}

export async function confirmStoreOrderPaid(params: {
  orderId: string;
  provider: string;
  providerRef?: string | null;
  verifiedBy?: string | null;
  eventId?: string;
  eventType?: string;
  amountVnd?: number | null;
  rawPayload?: unknown;
  reason?: string;
}) {
  const {
    orderId,
    provider,
    providerRef,
    verifiedBy,
    eventId,
    eventType,
    amountVnd,
    rawPayload,
    reason,
  } = params;

  if (eventId) {
    const existingEvent = await prisma.storePaymentEvent.findUnique({
      where: { eventId },
    });
    if (existingEvent) {
      return { ok: true, alreadyProcessed: true, stockConflict: false };
    }
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findUnique({
      where: { id: orderId },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.paymentStatus === "PAID") {
      if (eventId && order.payments[0]) {
        await tx.storePaymentEvent.upsert({
          where: { eventId },
          create: {
            paymentId: order.payments[0].id,
            provider,
            eventId,
            eventType: eventType || "CONFIRM_PAID",
            payloadJson: JSON.stringify(rawPayload ?? {}),
            status: "IDEMPOTENT_SKIPPED",
          },
          update: {},
        });
      }
      return { ok: true, alreadyProcessed: true, stockConflict: false };
    }

    if (
      typeof amountVnd === "number" &&
      order.totalVnd > 0 &&
      amountVnd < order.totalVnd
    ) {
      throw new Error("PAYMENT_AMOUNT_MISMATCH");
    }

    const now = new Date();
    const stockCommit = await commitOrderStockOnPaymentInTx(
      tx,
      order.id,
      verifiedBy,
    );

    const paymentRecord =
      order.payments[0] ||
      (await tx.storePayment.create({
        data: {
          orderId: order.id,
          provider,
          providerRef: providerRef || order.orderCode,
          amountVnd: order.totalVnd,
          status: "PENDING",
        },
      }));

    if (eventId) {
      await tx.storePaymentEvent.create({
        data: {
          paymentId: paymentRecord.id,
          provider,
          eventId,
          eventType: eventType || "CONFIRM_PAID",
          payloadJson: JSON.stringify(rawPayload ?? {}),
          status: stockCommit.ok ? "PROCESSED" : "STOCK_CONFLICT",
        },
      });
    }

    await tx.storePayment.update({
      where: { id: paymentRecord.id },
      data: {
        status: "PAID",
        verifiedBy: verifiedBy ?? "WEBHOOK",
        verifiedAt: now,
        ...(providerRef ? { providerRef } : {}),
      },
    });

    if (!stockCommit.ok) {
      await tx.storeOrder.update({
        where: { id: order.id },
        data: {
          status: "STOCK_CONFLICT_REFUND_NEEDED",
          paymentStatus: "PAID",
          paidAt: now,
          needsStockResolution: true,
        },
      });

      await tx.storeAuditLog.create({
        data: {
          orderId: order.id,
          actorId: verifiedBy ?? null,
          action: "PAYMENT_PAID_BUT_STOCK_CONFLICT",
          targetType: "StoreOrder",
          targetId: order.id,
          summary:
            "Tiền đã vào sau khi hết giữ hàng và tồn kho không đủ. Cần Admin xử lý hoàn tiền hoặc nhập bổ sung.",
          metaJson: JSON.stringify({ provider, providerRef, reason }),
        },
      });

      return { ok: true, alreadyProcessed: false, stockConflict: true };
    }

    await tx.storeOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        paidAt: now,
        needsStockResolution: false,
      },
    });

    // Unlock per-box gift cards to READY_UNOPENED (still NOT counting expiry until recipient opens!)
    await tx.storeOrderGiftUnit.updateMany({
      where: { orderId: order.id, cardState: "PREPARING" },
      data: {
        cardState: "READY_UNOPENED",
        readyAt: now,
      },
    });

    await tx.storeAuditLog.create({
      data: {
        orderId: order.id,
        actorId: verifiedBy ?? null,
        action: "ORDER_PAYMENT_CONFIRMED",
        targetType: "StoreOrder",
        targetId: order.id,
        summary: reason || `Xác nhận đã thu tiền (${provider}).`,
        metaJson: JSON.stringify({
          provider,
          providerRef,
          amountVnd: amountVnd ?? order.totalVnd,
        }),
      },
    });

    return { ok: true, alreadyProcessed: false, stockConflict: false };
  });
}

export async function tryConfirmShopPayOSOrderByOrderCode(params: {
  payosOrderCode: string;
  amountVnd?: number;
  eventId: string;
  rawPayload: unknown;
}): Promise<{ handled: boolean; message?: string }> {
  const payment = await prisma.storePayment.findFirst({
    where: {
      provider: "payos",
      providerRef: params.payosOrderCode,
    },
    include: {
      order: true,
    },
  });

  if (!payment) {
    return { handled: false };
  }

  const res = await confirmStoreOrderPaid({
    orderId: payment.orderId,
    provider: "payos",
    providerRef: params.payosOrderCode,
    verifiedBy: null,
    eventId: params.eventId,
    eventType: "PAYOS_WEBHOOK",
    amountVnd: params.amountVnd ?? payment.amountVnd,
    rawPayload: params.rawPayload,
    reason: "Webhook PayOS tự động xác nhận thanh toán.",
  });

  return {
    handled: true,
    message: res.stockConflict
      ? `Đơn ${payment.order.orderCode} đã nhận tiền nhưng cần Admin xử lý thiếu tồn kho.`
      : `Đơn ${payment.order.orderCode} đã thanh toán thành công qua PayOS.`,
  };
}

export async function handleShopPayOSWebhook(webhookBody: unknown) {
  const payos = getPayOSClient();
  if (!payos) {
    throw new Error("PAYOS_NOT_CONFIGURED");
  }
  const verified = await payos.webhooks.verify(webhookBody as never);
  if (Number(verified?.orderCode) === 123) {
    return { ok: true, message: "PayOS test ping verified." };
  }
  if (verified?.code && verified.code !== "00") {
    return { ok: true, message: `Ignored non-success PayOS code ${verified.code}` };
  }
  const eventId = `payos_${verified.orderCode}_${verified.reference || verified.paymentLinkId || "00"}`;
  const result = await tryConfirmShopPayOSOrderByOrderCode({
    payosOrderCode: String(verified.orderCode),
    amountVnd: verified.amount,
    eventId,
    rawPayload: verified,
  });
  return {
    ok: true,
    handled: result.handled,
    message: result.message || "Không tìm thấy đơn shop khớp orderCode.",
  };
}

export async function cancelOrRefundShopOrder(params: {
  orderId: string;
  action: "CANCEL" | "REQUEST_MANUAL_REFUND" | "MARK_REFUNDED";
  reason: string;
  restockReturned?: boolean;
  actorId: string;
}) {
  const { orderId, action, reason, restockReturned, actorId } = params;
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (action === "MARK_REFUNDED") {
      if (order.paymentStatus !== "REFUND_PENDING_MANUAL" && order.paymentStatus !== "PAID") {
        throw new Error("ORDER_NOT_ELIGIBLE_FOR_REFUND");
      }
      await tx.storeOrder.update({
        where: { id: order.id },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
          cancelledAt: order.cancelledAt ?? now,
          cancelReason: reason || order.cancelReason,
        },
      });
      if (order.payments[0]) {
        await tx.storePayment.update({
          where: { id: order.payments[0].id },
          data: { status: "REFUNDED" },
        });
      }
      await tx.storeOrderGiftUnit.updateMany({
        where: { orderId: order.id },
        data: { cardState: "DISABLED" },
      });
      if (restockReturned) {
        await restockCommittedOrderInTx(
          tx,
          order.id,
          `Hoàn kho khi xác nhận đã hoàn tiền: ${reason}`,
          actorId,
        );
      }
      await tx.storeAuditLog.create({
        data: {
          orderId: order.id,
          actorId,
          action: "ORDER_MARKED_REFUNDED",
          targetType: "StoreOrder",
          targetId: order.id,
          summary: `Admin xác nhận đã hoàn tiền thủ công${restockReturned ? " + hoàn kho" : ""}. Lý do: ${reason}`,
        },
      });
      return { ok: true, status: "REFUNDED" };
    }

    const isPaid = order.paymentStatus === "PAID";
    await releaseOrderReservationsInTx(tx, order.id, `Hủy đơn: ${reason}`, actorId);

    const nextStatus =
      isPaid || action === "REQUEST_MANUAL_REFUND"
        ? "REFUND_PENDING_MANUAL"
        : "CANCELLED";
    const nextPaymentStatus =
      isPaid || action === "REQUEST_MANUAL_REFUND"
        ? "REFUND_PENDING_MANUAL"
        : "FAILED";

    await tx.storeOrder.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        cancelledAt: now,
        cancelReason: reason,
      },
    });

    if (order.payments[0]) {
      await tx.storePayment.update({
        where: { id: order.payments[0].id },
        data: {
          status: nextPaymentStatus === "REFUND_PENDING_MANUAL" ? "REFUND_PENDING_MANUAL" : "FAILED",
        },
      });
    }

    // Disable all gift QR tokens linked to cancelled/refund-pending order
    await tx.storeOrderGiftUnit.updateMany({
      where: { orderId: order.id },
      data: { cardState: "DISABLED" },
    });

    if (isPaid && restockReturned) {
      await restockCommittedOrderInTx(
        tx,
        order.id,
        `Hoàn kho khi hủy đơn đã thanh toán: ${reason}`,
        actorId,
      );
    }

    await tx.storeAuditLog.create({
      data: {
        orderId: order.id,
        actorId,
        action: isPaid ? "ORDER_CANCELLED_REFUND_PENDING" : "ORDER_CANCELLED",
        targetType: "StoreOrder",
        targetId: order.id,
        summary: `${isPaid ? "Hủy đơn (chờ hoàn tiền thủ công)" : "Hủy đơn chưa thanh toán"}. Lý do: ${reason}`,
      },
    });

    return { ok: true, status: nextStatus };
  });
}

export async function refreshOrderBankQrIfNeeded(orderId: string): Promise<{
  qrDataUrl: string | null;
  transferContent: string | null;
  bankDetails: InitializedPaymentOutput["bankDetails"];
  checkoutUrl: string | null;
}> {
  const settings = await getShopSettings();
  const order = await prisma.storeOrder.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) {
    return { qrDataUrl: null, transferContent: null, bankDetails: null, checkoutUrl: null };
  }
  const payment = order.payments[0];
  if (order.paymentMethod === "payos") {
    const qrDataUrl = payment?.qrPayload ? await generateQrDataUrl(payment.qrPayload) : null;
    return {
      qrDataUrl,
      transferContent: payment?.transferContent || null,
      bankDetails: null,
      checkoutUrl: payment?.checkoutUrl || null,
    };
  }
  if (order.paymentMethod === "bank_transfer" && isBankTransferConfigured(settings)) {
    const bankMeta = resolveVietQRBank(settings.bankTransfer.bankCode)!;
    const transferContent =
      payment?.transferContent || buildSafeVietQrDescription(`DDG ${order.orderCode}`, 50);
    const qrPayload =
      payment?.qrPayload ||
      buildVietQrPayload({
        bankBin: bankMeta.bin,
        accountNumber: settings.bankTransfer.accountNo.trim(),
        amount: order.totalVnd,
        description: transferContent,
      });
    const qrDataUrl = await generateQrDataUrl(qrPayload);
    return {
      qrDataUrl,
      transferContent,
      checkoutUrl: null,
      bankDetails: {
        bankCode: settings.bankTransfer.bankCode,
        bankName: settings.bankTransfer.bankName || bankMeta.name || bankMeta.code,
        accountNo: settings.bankTransfer.accountNo.trim(),
        accountName: settings.bankTransfer.accountName.trim(),
        branch: settings.bankTransfer.branch.trim(),
        instructions: settings.bankTransfer.instructions.trim(),
      },
    };
  }
  return { qrDataUrl: null, transferContent: null, bankDetails: null, checkoutUrl: null };
}
