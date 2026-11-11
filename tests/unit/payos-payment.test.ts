import { describe, it, expect } from "vitest";
import {
  generatePayOSOrderCode,
  getPayOSClient,
  parseStoredPayOSQrAttempt,
  processPayOSWebhookPayload,
} from "@/lib/payments/payos";
import { buildVietQrPayload, resolveVietQRBank } from "@/lib/payments/vietqr";
import { TEST_MEDIA_CREDIT_PRICE_VND, TEST_PRODUCT_PRICE_VND } from "@/data/catalogData";
import prisma from "@/lib/prisma";
import { fulfillOrder } from "@/lib/payments/fulfillment";

describe("PayOS Payment Integration Unit Tests", () => {
  it("should generate a valid numeric orderCode within safe integer range", () => {
    const code1 = generatePayOSOrderCode();
    const code2 = generatePayOSOrderCode();

    expect(typeof code1).toBe("number");
    expect(code1).toBeGreaterThan(0);
    expect(Number.isSafeInteger(code1)).toBe(true);
    expect(code1.toString().length).toBeGreaterThanOrEqual(10);
    expect(code1).not.toBe(code2);
  });

  it("should return null for empty/whitespace credentials and initialize client when valid", () => {
    const prevId = process.env.PAYOS_CLIENT_ID;
    const prevKey = process.env.PAYOS_API_KEY;
    const prevChecksum = process.env.PAYOS_CHECKSUM_KEY;

    try {
      process.env.PAYOS_CLIENT_ID = "   ";
      process.env.PAYOS_API_KEY = "";
      process.env.PAYOS_CHECKSUM_KEY = "";
      expect(getPayOSClient()).toBeNull();

      process.env.PAYOS_CLIENT_ID = prevId || "test-client-id";
      process.env.PAYOS_API_KEY = prevKey || "test-api-key";
      process.env.PAYOS_CHECKSUM_KEY = prevChecksum || "test-checksum-key";
      const client = getPayOSClient();
      expect(client).not.toBeNull();
      expect(client?.paymentRequests).toBeDefined();
      expect(client?.webhooks).toBeDefined();
    } finally {
      if (prevId === undefined) delete process.env.PAYOS_CLIENT_ID;
      else process.env.PAYOS_CLIENT_ID = prevId;
      if (prevKey === undefined) delete process.env.PAYOS_API_KEY;
      else process.env.PAYOS_API_KEY = prevKey;
      if (prevChecksum === undefined) delete process.env.PAYOS_CHECKSUM_KEY;
      else process.env.PAYOS_CHECKSUM_KEY = prevChecksum;
    }
  });

  it("should enforce 1.000đ price for products and both media upload credits", () => {
    expect(TEST_PRODUCT_PRICE_VND).toBe(1000);
    expect(TEST_MEDIA_CREDIT_PRICE_VND).toBe(1000);
  });

  it("should generate valid in-app NAPAS VietQR EMVCo payload without external URLs", () => {
    const tcb = resolveVietQRBank("TCB");
    expect(tcb.bin).toBe("970407");

    const mb = resolveVietQRBank("970422");
    expect(mb.code).toBe("MB");

    const payload = buildVietQrPayload({
      bankBin: tcb.bin,
      accountNumber: "19036789123456",
      amount: 1000,
      description: "DDG TEST 001",
    });

    expect(payload.startsWith("000201010212")).toBe(true);
    expect(payload).toContain("A000000727");
    expect(payload).toContain("54041000");
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("should parse stored PENDING PayOS QR metadata cleanly with inline PNG data URL and no checkoutUrl", async () => {
    const sampleQr = buildVietQrPayload({
      bankBin: "970422",
      accountNumber: "0123456789",
      amount: 1000,
      description: "DDG ORDER1",
    });

    const parsed = await parseStoredPayOSQrAttempt({
      status: "PENDING",
      amountVnd: 1000,
      providerRef: "1762900000123",
      rawSafeMetadata: JSON.stringify({
        orderCode: 1762900000123,
        paymentLinkId: "pl_test_123",
        qrCode: sampleQr,
        bin: "970422",
        accountNumber: "0123456789",
        accountName: "CONG TY CP DING DONG GIFT VN",
        amount: 1000,
        description: "DDG ORDER1",
      }),
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(parsed?.bankName).toContain("MB Bank");
    expect((parsed as any)?.checkoutUrl).toBeUndefined();
  });

  it("should fulfill gift_unlock (creating ShareLink), gift_renewal (30d vs 365d), and idempotent DIGITAL_PLAN entitlements", async () => {
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const user = await prisma.user.create({
      data: {
        email: `test_fulfill_${suffix}@example.com`,
        name: "Test Fulfill",
        passwordHash: "hash",
      },
    });
    const occasion = await prisma.occasion.findFirst();
    const templateVersion = await prisma.templateVersion.findFirst();
    const existingPlan = await prisma.plan.findFirst();
    const createdPlan = existingPlan
      ? null
      : await prisma.plan.create({
          data: {
            code: `TEST_PLAN_${suffix}`,
            name: "Test Plan",
            basePriceVnd: 19000,
            defaultDurationDays: 30,
          },
        });
    const plan = existingPlan || createdPlan!;

    const inv1 = await prisma.invitation.create({
      data: {
        ownerId: user.id,
        occasionId: occasion!.id,
        templateVersionId: templateVersion!.id,
        slug: `slug-unlock-${suffix}`,
        title: "Gift Unlock Test",
        status: "DRAFT",
      },
    });

    const inv2 = await prisma.invitation.create({
      data: {
        ownerId: user.id,
        occasionId: occasion!.id,
        templateVersionId: templateVersion!.id,
        slug: `slug-plan-${suffix}`,
        title: "Digital Plan Test",
        status: "DRAFT",
      },
    });

    try {
      // 1. gift_unlock -> PUBLISHED + ShareLink
      const unlockOrder = await prisma.order.create({
        data: {
          buyerId: user.id,
          orderNumber: `ORD_UNL_${suffix}`,
          totalVnd: 1000,
          currency: "VND",
          status: "PAID",
          purpose: "gift_unlock",
          purchaseContext: JSON.stringify({ giftId: inv1.id, durationDays: 30 }),
        },
      });
      await fulfillOrder(unlockOrder.id);

      const unlockedInv = await prisma.invitation.findUnique({ where: { id: inv1.id } });
      expect(unlockedInv?.status).toBe("PUBLISHED");
      const shareLinks = await prisma.shareLink.findMany({
        where: { invitationId: inv1.id, status: "ACTIVE" },
      });
      expect(shareLinks.length).toBe(1);

      // 2. gift_renewal: 19,000 -> +30d, 39,000 -> +365d
      const initialExpiryMs = unlockedInv!.expiresAt!.getTime();
      const renew30Order = await prisma.order.create({
        data: {
          buyerId: user.id,
          orderNumber: `ORD_R30_${suffix}`,
          totalVnd: 19000,
          currency: "VND",
          status: "PAID",
          purpose: "gift_renewal",
          purchaseContext: JSON.stringify({ giftId: inv1.id }),
        },
      });
      await fulfillOrder(renew30Order.id);
      const after30 = await prisma.invitation.findUnique({ where: { id: inv1.id } });
      const diff30Days = Math.round(
        (after30!.expiresAt!.getTime() - initialExpiryMs) / (24 * 60 * 60 * 1000)
      );
      expect(diff30Days).toBe(30);

      const renew365Order = await prisma.order.create({
        data: {
          buyerId: user.id,
          orderNumber: `ORD_R365_${suffix}`,
          totalVnd: 39000,
          currency: "VND",
          status: "PAID",
          purpose: "gift_renewal",
          purchaseContext: JSON.stringify({ giftId: inv1.id }),
        },
      });
      await fulfillOrder(renew365Order.id);
      const after365 = await prisma.invitation.findUnique({ where: { id: inv1.id } });
      const diff365Days = Math.round(
        (after365!.expiresAt!.getTime() - after30!.expiresAt!.getTime()) / (24 * 60 * 60 * 1000)
      );
      expect(diff365Days).toBe(365);

      // 3. DIGITAL_PLAN order line -> Entitlement + invitation unlock (idempotent on repeat)
      const planOrder = await prisma.order.create({
        data: {
          buyerId: user.id,
          orderNumber: `ORD_PLN_${suffix}`,
          totalVnd: plan.basePriceVnd,
          currency: "VND",
          status: "PAID",
          purpose: "DIGITAL_PLAN",
          purchaseContext: JSON.stringify({ giftId: inv2.id }),
          lines: {
            create: {
              productType: "DIGITAL_PLAN",
              referenceId: plan.id,
              titleSnapshot: plan.name,
              quantity: 1,
              unitPriceVnd: plan.basePriceVnd,
              totalVnd: plan.basePriceVnd,
            },
          },
        },
      });
      await fulfillOrder(planOrder.id);
      await fulfillOrder(planOrder.id);

      const ents = await prisma.entitlement.findMany({ where: { ownerId: user.id } });
      expect(ents.length).toBe(1);
      expect(ents[0].invitationId).toBe(inv2.id);

      const unlockedInv2 = await prisma.invitation.findUnique({ where: { id: inv2.id } });
      expect(unlockedInv2?.status).toBe("PUBLISHED");
      const inv2Links = await prisma.shareLink.findMany({
        where: { invitationId: inv2.id, status: "ACTIVE" },
      });
      expect(inv2Links.length).toBe(1);
    } finally {
      await prisma.entitlement.deleteMany({ where: { ownerId: user.id } });
      await prisma.shareLink.deleteMany({ where: { invitationId: { in: [inv1.id, inv2.id] } } });
      await prisma.orderLine.deleteMany({ where: { order: { buyerId: user.id } } });
      await prisma.order.deleteMany({ where: { buyerId: user.id } });
      await prisma.invitation.deleteMany({ where: { ownerId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      if (createdPlan) {
        await prisma.plan.delete({ where: { id: createdPlan.id } });
      }
    }
  });

  it("should process signed PayOS webhook atomically with replay idempotency and handle VQRIO123 ping", async () => {
    const prevId = process.env.PAYOS_CLIENT_ID;
    const prevKey = process.env.PAYOS_API_KEY;
    const prevChecksum = process.env.PAYOS_CHECKSUM_KEY;
    const testChecksum = "unit_test_checksum_key_32_bytes_abc";

    process.env.PAYOS_CLIENT_ID = "unit-test-client-id";
    process.env.PAYOS_API_KEY = "unit-test-api-key";
    process.env.PAYOS_CHECKSUM_KEY = testChecksum;

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const orderCode = generatePayOSOrderCode();
    const webhookRef = `REF_${suffix}`;
    const user = await prisma.user.create({
      data: {
        email: `test_webhook_${suffix}@example.com`,
        name: "Test Webhook",
        passwordHash: "hash",
      },
    });

    try {
      const pingRes = await processPayOSWebhookPayload({
        code: "00",
        desc: "success",
        success: true,
        data: { orderCode: 123, description: "VQRIO123", amount: 3000 },
        signature: "dummy",
      });
      expect(pingRes.success).toBe(true);

      const order = await prisma.order.create({
        data: {
          buyerId: user.id,
          orderNumber: `ORD_WH_${suffix}`,
          totalVnd: 1000,
          currency: "VND",
          status: "PENDING_PAYMENT",
          purpose: "image_credits",
          purchaseContext: JSON.stringify({ quantity: 5 }),
          paymentAttempts: {
            create: {
              provider: "payos",
              providerRef: String(orderCode),
              amountVnd: 1000,
              status: "PENDING",
            },
          },
        },
      });

      const payos = getPayOSClient()!;
      const webhookData = {
        orderCode,
        amount: 1000,
        description: `DDG ${order.orderNumber}`,
        accountNumber: "0123456789",
        reference: webhookRef,
        transactionDateTime: "2026-11-12 03:30:00",
        currency: "VND",
        paymentLinkId: `pl_${suffix}`,
        code: "00",
        desc: "Thành công",
        counterAccountBankId: "",
        counterAccountBankName: "",
        counterAccountName: "",
        counterAccountNumber: "",
        virtualAccountName: "",
        virtualAccountNumber: "",
      };
      const signature = await payos.crypto.createSignatureFromObj(webhookData, testChecksum);
      expect(signature).toBeTruthy();

      const badResPromise = processPayOSWebhookPayload({
        code: "00",
        desc: "success",
        success: true,
        data: webhookData,
        signature: "invalid_signature",
      });
      await expect(badResPromise).rejects.toThrow();

      const validRes = await processPayOSWebhookPayload({
        code: "00",
        desc: "success",
        success: true,
        data: webhookData,
        signature,
      });
      expect(validRes.success).toBe(true);

      const paidOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(paidOrder?.status).toBe("PAID");
      const creditedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(creditedUser?.imageCredits).toBe(5);

      // Replay same webhook -> idempotent, must NOT add another 5 credits
      const replayRes = await processPayOSWebhookPayload({
        code: "00",
        desc: "success",
        success: true,
        data: webhookData,
        signature,
      });
      expect(replayRes.success).toBe(true);
      const userAfterReplay = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userAfterReplay?.imageCredits).toBe(5);
    } finally {
      await prisma.paymentWebhookEvent.deleteMany({
        where: {
          provider: "payos",
          providerEventId: { startsWith: `${orderCode}_` },
        },
      });
      await prisma.paymentAttempt.deleteMany({ where: { order: { buyerId: user.id } } });
      await prisma.order.deleteMany({ where: { buyerId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });

      if (prevId === undefined) delete process.env.PAYOS_CLIENT_ID;
      else process.env.PAYOS_CLIENT_ID = prevId;
      if (prevKey === undefined) delete process.env.PAYOS_API_KEY;
      else process.env.PAYOS_API_KEY = prevKey;
      if (prevChecksum === undefined) delete process.env.PAYOS_CHECKSUM_KEY;
      else process.env.PAYOS_CHECKSUM_KEY = prevChecksum;
    }
  });
});


