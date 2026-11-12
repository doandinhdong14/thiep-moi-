import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import {
  escapeCsvCell,
  normalizeViText,
  sanitizeImageUrl,
  sanitizeTrackingUrl,
  slugifyVi,
} from "@/lib/shop/types";
import { calculateShippingQuote } from "@/lib/shop/shipping";
import {
  DEFAULT_CARD_PLANS,
  DEFAULT_GIFT_WRAPS,
  DEFAULT_SHIPPING_ZONES,
  DEFAULT_SHOP_SETTINGS,
  SHOP_SETTINGS_KEY,
  getShopSettings,
  isBankTransferConfigured,
  isPayOSGatewayAvailable,
  saveShopSettings,
} from "@/lib/shop/settings";
import {
  adjustVariantInventory,
  releaseExpiredReservations,
} from "@/lib/shop/inventory";
import {
  executeShopCheckout,
  serializeOrderSafeForCustomer,
} from "@/lib/shop/checkout";
import {
  confirmStoreOrderPaid,
  requestBankTransferReview,
  tryConfirmShopPayOSOrderByOrderCode,
} from "@/lib/shop/payment";
import {
  getRecipientGiftLanding,
  openRecipientGiftCard,
  revealGiftUnitRawToken,
} from "@/lib/shop/gift-card";
import {
  maskEmail,
  maskName,
  maskPhone,
  maskStreetAddress,
} from "@/lib/shop/auth";
import { processPayOSWebhookPayload } from "@/lib/payments/payos";

const TEST_PREFIX = `TEST_SHOP_${Date.now()}`;

const createdIds: {
  categoryIds: string[];
  productIds: string[];
  variantIds: string[];
  cartIds: string[];
  orderIds: string[];
  customizationIds: string[];
} = {
  categoryIds: [],
  productIds: [],
  variantIds: [],
  cartIds: [],
  orderIds: [],
  customizationIds: [],
};

afterAll(async () => {
  if (createdIds.orderIds.length > 0) {
    await prisma.storeAuditLog.deleteMany({
      where: { orderId: { in: createdIds.orderIds } },
    });
    await prisma.storePaymentEvent.deleteMany({
      where: { payment: { orderId: { in: createdIds.orderIds } } },
    });
    await prisma.storePayment.deleteMany({
      where: { orderId: { in: createdIds.orderIds } },
    });
    await prisma.storeStockReservation.deleteMany({
      where: { orderId: { in: createdIds.orderIds } },
    });
    await prisma.storeShipment.deleteMany({
      where: { orderId: { in: createdIds.orderIds } },
    });
    await prisma.storeOrderGiftUnit.deleteMany({
      where: { orderId: { in: createdIds.orderIds } },
    });
    await prisma.storeOrderItem.deleteMany({
      where: { orderId: { in: createdIds.orderIds } },
    });
    await prisma.storeOrder.deleteMany({
      where: { id: { in: createdIds.orderIds } },
    });
  }

  if (createdIds.cartIds.length > 0) {
    await prisma.storeCartItemUnit.deleteMany({
      where: { cartItem: { cartId: { in: createdIds.cartIds } } },
    });
    await prisma.storeCartItem.deleteMany({
      where: { cartId: { in: createdIds.cartIds } },
    });
    await prisma.storeCart.deleteMany({
      where: { id: { in: createdIds.cartIds } },
    });
  }

  if (createdIds.customizationIds.length > 0) {
    await prisma.storeGiftCustomization.deleteMany({
      where: { id: { in: createdIds.customizationIds } },
    });
  }

  if (createdIds.variantIds.length > 0) {
    await prisma.storeInventoryMovement.deleteMany({
      where: { variantId: { in: createdIds.variantIds } },
    });
    await prisma.storeInventory.deleteMany({
      where: { variantId: { in: createdIds.variantIds } },
    });
    await prisma.storeVariant.deleteMany({
      where: { id: { in: createdIds.variantIds } },
    });
  }

  if (createdIds.productIds.length > 0) {
    await prisma.storeProduct.deleteMany({
      where: { id: { in: createdIds.productIds } },
    });
  }

  if (createdIds.categoryIds.length > 0) {
    await prisma.storeCategory.deleteMany({
      where: { id: { in: createdIds.categoryIds } },
    });
  }
});

async function withTemporaryShopSettings<T>(
  patch: Partial<typeof DEFAULT_SHOP_SETTINGS>,
  fn: () => Promise<T>,
): Promise<T> {
  const prevRow = await prisma.systemSetting.findUnique({
    where: { key: SHOP_SETTINGS_KEY },
  });
  const base = await getShopSettings();
  await saveShopSettings(
    {
      ...base,
      ...patch,
      bankTransfer: {
        ...base.bankTransfer,
        ...(patch.bankTransfer || {}),
      },
      cod: {
        ...base.cod,
        ...(patch.cod || {}),
      },
      shipping: {
        ...base.shipping,
        ...(patch.shipping || {}),
      },
    },
    "vitest",
  );
  try {
    return await fn();
  } finally {
    if (prevRow) {
      await prisma.systemSetting.update({
        where: { key: SHOP_SETTINGS_KEY },
        data: { valueJson: prevRow.valueJson },
      });
    } else {
      await prisma.systemSetting.deleteMany({
        where: { key: SHOP_SETTINGS_KEY },
      });
    }
  }
}

async function createTestCatalogVariant(stockOnHand: number, priceVnd = 210000) {
  const cat = await prisma.storeCategory.create({
    data: {
      slug: `${TEST_PREFIX.toLowerCase()}-cat-${Math.random().toString(36).slice(2, 6)}`,
      name: "Danh mục test",
      isActive: true,
    },
  });
  createdIds.categoryIds.push(cat.id);

  const product = await prisma.storeProduct.create({
    data: {
      categoryId: cat.id,
      slug: `${TEST_PREFIX.toLowerCase()}-prod-${Math.random().toString(36).slice(2, 7)}`,
      name: "Khăn len Test Automation",
      status: "ACTIVE",
      productType: "SINGLE",
      cardIncluded: true,
      defaultTemplateId: "thiep-8",
      eligibleTemplateIdsJson: JSON.stringify(["thiep-8", "thiep-10"]),
      imagesJson: JSON.stringify(["/assets/shop/scarf-suong-mai.svg"]),
    },
  });
  createdIds.productIds.push(product.id);

  const variant = await prisma.storeVariant.create({
    data: {
      productId: product.id,
      sku: `${TEST_PREFIX}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: "Kem sữa Test",
      priceVnd,
      isActive: true,
      isDefault: true,
    },
  });
  createdIds.variantIds.push(variant.id);

  await prisma.storeInventory.create({
    data: {
      variantId: variant.id,
      onHand: stockOnHand,
      reserved: 0,
      lowStockThreshold: 2,
    },
  });

  return { cat, product, variant };
}

async function createCartWithItem(params: {
  variantId: string;
  quantity: number;
  guestToken: string;
  customizationId?: string | null;
}) {
  const cart = await prisma.storeCart.create({
    data: { guestToken: params.guestToken },
  });
  createdIds.cartIds.push(cart.id);

  const item = await prisma.storeCartItem.create({
    data: {
      cartId: cart.id,
      variantId: params.variantId,
      quantity: params.quantity,
      customizationId: params.customizationId ?? null,
      giftWrapCode: "NONE",
    },
  });

  for (let idx = 1; idx <= params.quantity; idx += 1) {
    await prisma.storeCartItemUnit.create({
      data: {
        cartItemId: item.id,
        unitIndex: idx,
        customizationId: params.customizationId ?? null,
        giftWrapCode: "NONE",
      },
    });
  }

  return cart;
}

describe("Cửa hàng quà (Physical Gift Shop) Core Security & Operations", () => {
  it("should enforce draft-only safe defaults and reject placeholder bank accounts", async () => {
    const categories = await prisma.storeCategory.findMany();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    expect(categories.some((c) => c.slug === "khan-quang")).toBe(true);

    expect(isBankTransferConfigured(DEFAULT_SHOP_SETTINGS)).toBe(false);
    // Reject obvious placeholder STK "0123456789" / "NGUYEN VAN A"
    expect(
      isBankTransferConfigured({
        ...DEFAULT_SHOP_SETTINGS,
        bankTransfer: {
          ...DEFAULT_SHOP_SETTINGS.bankTransfer,
          enabled: true,
          bankCode: "MB",
          accountNo: "0123456789",
          accountName: "TEST USER",
        },
      }),
    ).toBe(false);
    expect(
      isBankTransferConfigured({
        ...DEFAULT_SHOP_SETTINGS,
        bankTransfer: {
          ...DEFAULT_SHOP_SETTINGS.bankTransfer,
          enabled: true,
          bankCode: "MB",
          accountNo: "19039999888877",
          accountName: "TRAN MINH TEST",
        },
      }),
    ).toBe(true);

    expect(DEFAULT_CARD_PLANS.some((p) => p.code === "DEFAULT" && p.priceVnd === 0)).toBe(true);
    expect(DEFAULT_GIFT_WRAPS.some((w) => w.code === "NONE")).toBe(true);
    expect(DEFAULT_SHIPPING_ZONES.length).toBe(3);

    const currentSettings = await getShopSettings();
    expect(typeof isPayOSGatewayAvailable(currentSettings)).toBe("boolean");
  });

  it("should sanitize tracking URLs, escape CSV formula cells, and normalize Vietnamese", () => {
    expect(escapeCsvCell("=cmd|'/C calc'!A0")).toBe(`"'=cmd|'/C calc'!A0"`);
    expect(escapeCsvCell("+SUM(A1:A2)")).toBe(`"'+SUM(A1:A2)"`);
    expect(escapeCsvCell("Đơn bình thường")).toBe(`"Đơn bình thường"`);

    expect(sanitizeTrackingUrl("http://ghn.vn/order")).toBeNull();
    expect(sanitizeTrackingUrl("https://evil.example/ghn.vn")).toBeNull();
    expect(sanitizeTrackingUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeTrackingUrl("https://donhang.ghn.vn/?order_code=XYZ")).toBe(
      "https://donhang.ghn.vn/?order_code=XYZ",
    );

    expect(sanitizeImageUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeImageUrl("/assets/shop/hero-gift-box.svg")).toBe(
      "/assets/shop/hero-gift-box.svg",
    );

    expect(normalizeViText("Khăn Len Đỏ")).toBe("khan len do");
    expect(slugifyVi("Hộp Quà Đông Ấm")).toBe("hop-qua-dong-am");
  });

  it("should calculate server-side shipping quotes by province tier and freeship threshold", () => {
    const configuredSettings = {
      ...DEFAULT_SHOP_SETTINGS,
      shipping: {
        ...DEFAULT_SHOP_SETTINGS.shipping,
        configured: true,
        freeshipThresholdVnd: 599000,
      },
    };

    const inner = calculateShippingQuote(configuredSettings, {
      provinceCode: "SG",
      subtotalVnd: 200000,
    });
    expect(inner.zone).toBe("INNER_CITY");
    expect(inner.freeshipApplied).toBe(false);
    expect(inner.feeVnd).toBe(22000);

    const freeshipInner = calculateShippingQuote(configuredSettings, {
      provinceCode: "HN",
      subtotalVnd: 800000,
    });
    expect(freeshipInner.freeshipApplied).toBe(true);
    expect(freeshipInner.feeVnd).toBe(0);

    const remote = calculateShippingQuote(configuredSettings, {
      provinceCode: "LC",
      subtotalVnd: 200000,
    });
    expect(remote.zone).toBe("REMOTE");
    expect(remote.feeVnd).toBeGreaterThan(inner.feeVnd);

    // Unconfigured shipping safely reports CUSTOM_QUOTE
    const customQuote = calculateShippingQuote(DEFAULT_SHOP_SETTINGS, {
      provinceCode: "SG",
      subtotalVnd: 200000,
    });
    expect(customQuote.zone).toBe("CUSTOM_QUOTE");
    expect(customQuote.quoteRequired).toBe(true);
  });

  it("should prevent oversell under concurrent checkout and guarantee idempotency", async () => {
    await withTemporaryShopSettings(
      {
        cod: { enabled: true, maxOrderTotalVnd: 2_000_000, feeVnd: 0 },
        shipping: {
          ...DEFAULT_SHOP_SETTINGS.shipping,
          configured: true,
          freeshipThresholdVnd: 599000,
        },
      },
      async () => {
        const { variant } = await createTestCatalogVariant(3, 250000);
        const g1 = `${TEST_PREFIX}-guest-a`;
        const g2 = `${TEST_PREFIX}-guest-b`;
        await createCartWithItem({ variantId: variant.id, quantity: 2, guestToken: g1 });
        await createCartWithItem({ variantId: variant.id, quantity: 2, guestToken: g2 });

        const baseInput = {
          customerName: "Nguyễn An",
          customerPhone: "0901112233",
          customerEmail: "an@example.com",
          recipientName: "Trần Bình",
          recipientPhone: "0904445566",
          provinceCode: "SG",
          districtName: "Quận 1",
          wardName: "Bến Nghé",
          streetAddress: "100 Lê Lợi",
          paymentMethod: "cod" as const,
          acceptTerms: true as const,
        };

        const idem1 = `${TEST_PREFIX}-idem-1`;
        const idem2 = `${TEST_PREFIX}-idem-2`;

        const [res1, res2] = await Promise.allSettled([
          executeShopCheckout({
            input: { ...baseInput, idempotencyKey: idem1 },
            guestToken: g1,
            baseUrl: "http://localhost:3000",
          }),
          executeShopCheckout({
            input: { ...baseInput, idempotencyKey: idem2 },
            guestToken: g2,
            baseUrl: "http://localhost:3000",
          }),
        ]);

        const fulfilled = [res1, res2].filter(
          (
            r,
          ): r is PromiseFulfilledResult<Awaited<ReturnType<typeof executeShopCheckout>>> =>
            r.status === "fulfilled",
        );
        const rejected = [res1, res2].filter((r) => r.status === "rejected");

        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);

        const winner = fulfilled[0].value;
        createdIds.orderIds.push(winner.orderId);
        const winningMeta =
          res1.status === "fulfilled"
            ? { idem: idem1, guest: g1 }
            : { idem: idem2, guest: g2 };

        const invAfter = await prisma.storeInventory.findUniqueOrThrow({
          where: { variantId: variant.id },
        });
        expect(invAfter.reserved).toBe(2);
        expect(invAfter.onHand - invAfter.reserved).toBe(1);

        // Replay whichever idempotencyKey won: must return exact same order without double reserving
        const replay = await executeShopCheckout({
          input: { ...baseInput, idempotencyKey: winningMeta.idem },
          guestToken: winningMeta.guest,
          baseUrl: "http://localhost:3000",
        });
        expect(replay.idempotentReplay).toBe(true);
        expect(replay.orderCode).toBe(winner.orderCode);

        const invAfterReplay = await prisma.storeInventory.findUniqueOrThrow({
          where: { variantId: variant.id },
        });
        expect(invAfterReplay.reserved).toBe(2);
      },
    );
  });

  it("should keep manual bank transfer un-paid until Admin verifies and handle TTL expiry + late conflict", async () => {
    await withTemporaryShopSettings(
      {
        bankTransfer: {
          enabled: true,
          bankCode: "MB",
          bankName: "MB Bank",
          accountNo: "19039999888877",
          accountName: "TRAN MINH SHOP",
          branch: "HCM",
          instructions: "Test VietQR",
        },
      },
      async () => {
        const { variant } = await createTestCatalogVariant(2, 300000);
        const guest = `${TEST_PREFIX}-guest-bank`;
        await createCartWithItem({ variantId: variant.id, quantity: 2, guestToken: guest });

        const checkoutRes = await executeShopCheckout({
          input: {
            idempotencyKey: `${TEST_PREFIX}-bank-idem`,
            customerName: "Lê Minh",
            customerPhone: "0988777666",
            recipientName: "Phạm Lan",
            recipientPhone: "0977666555",
            provinceCode: "SG",
            districtName: "Quận 3",
            wardName: "Phường 6",
            streetAddress: "45 Võ Văn Tần",
            paymentMethod: "bank_transfer",
            acceptTerms: true,
          },
          guestToken: guest,
          baseUrl: "http://localhost:3000",
        });
        createdIds.orderIds.push(checkoutRes.orderId);

        // Buyer clicks "Tôi đã chuyển khoản" -> MUST stay REVIEW_REQUESTED, NEVER auto-PAID!
        const reviewRes = await requestBankTransferReview({
          orderId: checkoutRes.orderId,
          note: "FT20261112TEST",
        });
        expect(reviewRes.status).toBe("PAYMENT_REVIEW_REQUESTED");

        const midOrder = await prisma.storeOrder.findUniqueOrThrow({
          where: { id: checkoutRes.orderId },
          include: { giftUnits: true },
        });
        expect(midOrder.paymentStatus).toBe("REVIEW_REQUESTED");
        expect(midOrder.giftUnits.every((u) => u.cardState === "PREPARING")).toBe(true);

        // Expire reservation -> stock releases back to 2 available
        await prisma.storeOrder.update({
          where: { id: checkoutRes.orderId },
          data: {
            status: "PENDING_PAYMENT",
            reservationExpiresAt: new Date(Date.now() - 60000),
          },
        });
        await prisma.storeStockReservation.updateMany({
          where: { orderId: checkoutRes.orderId },
          data: { expiresAt: new Date(Date.now() - 60000) },
        });

        const released = await releaseExpiredReservations();
        expect(released).toBeGreaterThanOrEqual(1);

        const expiredInv = await prisma.storeInventory.findUniqueOrThrow({
          where: { variantId: variant.id },
        });
        expect(expiredInv.reserved).toBe(0);

        const staff = await prisma.user.findFirst({ select: { id: true } });

        // Reduce physical stock to 0 before late payment confirms -> triggers STOCK_CONFLICT_REFUND_NEEDED!
        await adjustVariantInventory({
          variantId: variant.id,
          deltaOnHand: -2,
          type: "ADJUST",
          reason: "Bán hết cho đơn khác trước khi tiền muộn về",
          actorId: staff?.id ?? null,
        });

        const conflictConfirm = await confirmStoreOrderPaid({
          orderId: checkoutRes.orderId,
          provider: "bank_transfer",
          providerRef: "LATE_FT_999",
          verifiedBy: staff?.id ?? null,
          amountVnd: checkoutRes.totalVnd,
          reason: "Đối soát tiền về muộn sau TTL",
        });
        expect(conflictConfirm.stockConflict).toBe(true);

        const conflictOrder = await prisma.storeOrder.findUniqueOrThrow({
          where: { id: checkoutRes.orderId },
        });
        expect(conflictOrder.status).toBe("STOCK_CONFLICT_REFUND_NEEDED");
        expect(conflictOrder.needsStockResolution).toBe(true);
        expect(conflictOrder.paymentStatus).toBe("PAID");
      },
    );
  });

  it("should generate unique QR per box, mask unauthorized PII, never expire on GET landing, and atomically open once on POST", async () => {
    await withTemporaryShopSettings(
      {
        cod: { enabled: true, maxOrderTotalVnd: 2_000_000, feeVnd: 0 },
      },
      async () => {
        const { variant } = await createTestCatalogVariant(5, 180000);
        const customization = await prisma.storeGiftCustomization.create({
          data: {
            templateSlug: "thiep-8",
            cardPlanCode: "DEFAULT",
            giftWrapCode: "NONE",
            recipientName: "Em Bé Mùa Đông",
            senderName: "Anh",
            title: "Chút ấm áp",
            message: "Chúc em luôn vui vẻ!",
            occasion: "Mùa đông",
            photoUrlsJson: "[]",
            status: "DRAFT",
          },
        });
        createdIds.customizationIds.push(customization.id);

        const guest = `${TEST_PREFIX}-guest-qr`;
        await createCartWithItem({
          variantId: variant.id,
          quantity: 2,
          guestToken: guest,
          customizationId: customization.id,
        });

        const checkoutRes = await executeShopCheckout({
          input: {
            idempotencyKey: `${TEST_PREFIX}-qr-idem`,
            customerName: "Nguyễn Văn A",
            customerPhone: "0909888777",
            customerEmail: "nguyenvana@example.com",
            recipientName: "Trần Thị B",
            recipientPhone: "0911222333",
            provinceCode: "SG",
            districtName: "Quận 1",
            wardName: "Đa Kao",
            streetAddress: "88 Đinh Tiên Hoàng",
            paymentMethod: "cod",
            acceptTerms: true,
          },
          guestToken: guest,
          baseUrl: "http://localhost:3000",
        });
        createdIds.orderIds.push(checkoutRes.orderId);

        const staff = await prisma.user.findFirst({ select: { id: true } });
        const paidRes = await confirmStoreOrderPaid({
          orderId: checkoutRes.orderId,
          provider: "cod",
          providerRef: "COD_PACK",
          verifiedBy: staff?.id ?? null,
          amountVnd: checkoutRes.totalVnd,
        });
        expect(paidRes.ok).toBe(true);

        const fullOrder = await prisma.storeOrder.findUniqueOrThrow({
          where: { id: checkoutRes.orderId },
          include: {
            items: true,
            giftUnits: { orderBy: { unitIndex: "asc" } },
            shipments: true,
          },
        });

        expect(fullOrder.giftUnits.length).toBe(2);
        expect(fullOrder.giftUnits[0].giftTokenHash).not.toBe(
          fullOrder.giftUnits[1].giftTokenHash,
        );

        const token1 = revealGiftUnitRawToken(fullOrder.giftUnits[0].giftTokenEncrypted)!;
        const token2 = revealGiftUnitRawToken(fullOrder.giftUnits[1].giftTokenEncrypted)!;
        expect(token1).toBeTruthy();
        expect(token2).toBeTruthy();
        expect(token1).not.toBe(token2);

        const maskedOrder = serializeOrderSafeForCustomer(fullOrder, false, {
          maskName,
          maskPhone,
          maskEmail,
          maskStreetAddress,
        });
        expect(maskedOrder.customerPhone).not.toBe("0909888777");
        expect(JSON.stringify(maskedOrder)).not.toContain(token1);
        expect(JSON.stringify(maskedOrder)).not.toContain("88 Đinh Tiên Hoàng");

        const landingBefore = await getRecipientGiftLanding(token1);
        expect(landingBefore.found).toBe(true);
        expect(landingBefore.state).toBe("READY_UNOPENED");
        expect(landingBefore.envelope?.boxReferenceCode).toBe(
          fullOrder.giftUnits[0].boxReferenceCode,
        );

        const adminPreview = await getRecipientGiftLanding(token1, { isAdminPreview: true });
        expect(adminPreview.isAdminPreview).toBe(true);
        expect(adminPreview.card?.interactiveHtml).toContain("Chút ấm áp");

        const unitStillUnopened = await prisma.storeOrderGiftUnit.findUniqueOrThrow({
          where: { id: fullOrder.giftUnits[0].id },
        });
        expect(unitStillUnopened.firstOpenedAt).toBeNull();
        expect(unitStillUnopened.expiresAt).toBeNull();
        expect(unitStillUnopened.openCount).toBe(0);

        const [openA, openB] = await Promise.all([
          openRecipientGiftCard(token1),
          openRecipientGiftCard(token1),
        ]);
        expect(openA.ok).toBe(true);
        expect(openB.ok).toBe(true);
        const firstClaims = [openA.firstOpenedNow, openB.firstOpenedNow].filter(Boolean);
        expect(firstClaims.length).toBe(1);

        const unitOpened = await prisma.storeOrderGiftUnit.findUniqueOrThrow({
          where: { id: fullOrder.giftUnits[0].id },
        });
        expect(unitOpened.cardState).toBe("ACTIVE");
        expect(unitOpened.isCardLocked).toBe(true);
        expect(unitOpened.firstOpenedAt).not.toBeNull();
        expect(unitOpened.expiresAt).not.toBeNull();

        const unit2After = await prisma.storeOrderGiftUnit.findUniqueOrThrow({
          where: { id: fullOrder.giftUnits[1].id },
        });
        expect(unit2After.cardState).toBe("READY_UNOPENED");
        expect(unit2After.firstOpenedAt).toBeNull();

        // PayOS unknown webhook delegation & unconfigured signature guard
        const unknownShopPayos = await tryConfirmShopPayOSOrderByOrderCode({
          payosOrderCode: "9999999999",
          amountVnd: 1000,
          eventId: "test_evt_unknown",
          rawPayload: { orderCode: 9999999999, amount: 1000 },
        });
        expect(unknownShopPayos.handled).toBe(false);
        await expect(
          processPayOSWebhookPayload({ orderCode: 9999999999, amount: 1000 }),
        ).rejects.toThrow(/PayOS client is not configured/i);
      },
    );
  });
});
