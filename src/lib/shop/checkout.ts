import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  generateOrderAccessToken,
  hashOrderAccessToken,
} from "./auth";
import { buildCartSummaryView, findShopCartReadonly } from "./cart";
import {
  buildGiftInvitationContent,
  createGiftUnitTokenPair,
  getEligibleShopTemplates,
  resolveTemplateMetaWithFallback,
} from "./gift-card";
import { OutOfStockError, releaseExpiredReservations, reserveVariantStockInTx } from "./inventory";
import { createPaymentForOrder, InitializedPaymentOutput } from "./payment";
import {
  findPromoRule,
  getShopSettings,
  isBankTransferConfigured,
  isPayOSGatewayAvailable,
} from "./settings";
import { calculateShippingQuote, resolveProvince } from "./shipping";
import { safeJsonParse, StorePaymentMethod } from "./types";

export const CheckoutInputSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  customerName: z.string().trim().min(2, "Vui lòng nhập họ tên người đặt").max(100),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{8,11}$/, "Số điện thoại Việt Nam chưa hợp lệ"),
  customerEmail: z
    .string()
    .trim()
    .email("Email chưa hợp lệ")
    .optional()
    .or(z.literal("")),
  recipientName: z.string().trim().min(2, "Vui lòng nhập tên người nhận").max(100),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{8,11}$/, "Số điện thoại người nhận chưa hợp lệ"),
  provinceCode: z.string().trim().min(1, "Vui lòng chọn Tỉnh/Thành phố").max(40),
  provinceName: z.string().trim().max(80).optional(),
  districtName: z.string().trim().min(1, "Vui lòng nhập Quận/Huyện").max(80),
  wardName: z.string().trim().min(1, "Vui lòng nhập Phường/Xã").max(80),
  streetAddress: z.string().trim().min(4, "Vui lòng nhập địa chỉ chi tiết").max(200),
  addressNote: z.string().trim().max(240).optional(),
  deliveryNote: z.string().trim().max(300).optional(),
  promoCode: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(["bank_transfer", "payos", "cod"]),
  acceptTerms: z.boolean().refine((v) => v === true, "Vui lòng đồng ý điều khoản đặt hàng"),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

function generateOrderCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `DDG-${yy}${mm}${dd}-${suffix}`;
}

function buildBoxReferenceCode(orderCode: string, index: number): string {
  const shortOrder = orderCode.replace(/^DDG-/, "");
  return `BOX-${shortOrder}-${String(index).padStart(2, "0")}`;
}

export class CheckoutBusinessError extends Error {
  code: string;
  httpStatus: number;
  details?: unknown;

  constructor(code: string, message: string, httpStatus = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export interface CheckoutResult {
  orderCode: string;
  orderId: string;
  status: string;
  paymentMethod: StorePaymentMethod;
  paymentStatus: string;
  totalVnd: number;
  reservationExpiresAt: string;
  guestAccessToken?: string;
  idempotentReplay: boolean;
  payment: InitializedPaymentOutput | null;
}

export async function executeShopCheckout(params: {
  input: CheckoutInput;
  userId?: string | null;
  guestToken?: string | null;
  baseUrl: string;
}): Promise<CheckoutResult> {
  const { input, userId, guestToken, baseUrl } = params;

  const settings = await getShopSettings();
  if (!settings.storeOpen) {
    throw new CheckoutBusinessError(
      "STORE_PAUSED",
      settings.pauseMessage || "Cửa hàng đang tạm ngưng nhận đơn.",
      409,
    );
  }

  // Reclaim any stale unpaid reservations first so real stock is up-to-date
  await releaseExpiredReservations().catch(() => 0);

  // Idempotency replay check
  const existingByKey = await prisma.storeOrder.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (existingByKey) {
    const existingPay = existingByKey.payments[0];
    return {
      orderCode: existingByKey.orderCode,
      orderId: existingByKey.id,
      status: existingByKey.status,
      paymentMethod: existingByKey.paymentMethod as StorePaymentMethod,
      paymentStatus: existingByKey.paymentStatus,
      totalVnd: existingByKey.totalVnd,
      reservationExpiresAt: existingByKey.reservationExpiresAt
        ? existingByKey.reservationExpiresAt.toISOString()
        : new Date().toISOString(),
      idempotentReplay: true,
      payment: existingPay
        ? {
            paymentId: existingPay.id,
            provider: existingPay.provider as StorePaymentMethod,
            status: existingPay.status,
            amountVnd: existingPay.amountVnd,
            qrPayload: existingPay.qrPayload,
            transferContent: existingPay.transferContent,
            checkoutUrl: existingPay.checkoutUrl,
          }
        : null,
    };
  }

  // Locate cart
  const cartRow = await findShopCartReadonly({ userId, guestToken });
  if (!cartRow) {
    throw new CheckoutBusinessError(
      "EMPTY_CART",
      "Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.",
      400,
    );
  }

  // Apply explicit promo code if submitted at checkout
  if (typeof input.promoCode === "string" && input.promoCode.trim() !== (cartRow.promoCode || "")) {
    await prisma.storeCart.update({
      where: { id: cartRow.id },
      data: { promoCode: input.promoCode.trim().toUpperCase() || null },
    });
  }

  const cartSummary = await buildCartSummaryView(cartRow.id, settings);
  if (cartSummary.items.length === 0) {
    throw new CheckoutBusinessError("EMPTY_CART", "Giỏ hàng đang trống.", 400);
  }

  for (const item of cartSummary.items) {
    if (!item.isProductAvailable) {
      throw new CheckoutBusinessError(
        "PRODUCT_UNAVAILABLE",
        `Sản phẩm "${item.productName}" hiện đã ngừng bán hoặc chưa mở bán.`,
        409,
      );
    }
    if (!item.isStockEnough) {
      throw new CheckoutBusinessError(
        "OUT_OF_STOCK",
        `Sản phẩm "${item.productName} (${item.variantName})" chỉ còn ${item.availableStock} hộp khả dụng.`,
        409,
        { variantId: item.variantId, available: item.availableStock },
      );
    }
  }

  // Verify shipping & totals strictly on server
  const province = resolveProvince(input.provinceCode || input.provinceName || "");
  const quote = calculateShippingQuote(settings, {
    provinceCode: input.provinceCode,
    provinceName: input.provinceName || province?.name,
    subtotalVnd: cartSummary.subtotalVnd,
  });

  const promoRule = findPromoRule(settings, cartSummary.promoCode);
  let discountVnd = 0;
  if (promoRule && cartSummary.subtotalVnd >= promoRule.minSubtotalVnd) {
    if (promoRule.discountType === "PERCENT") {
      const raw = Math.round((cartSummary.subtotalVnd * promoRule.discountValue) / 100);
      discountVnd =
        promoRule.maxDiscountVnd && promoRule.maxDiscountVnd > 0
          ? Math.min(raw, promoRule.maxDiscountVnd)
          : raw;
    } else {
      discountVnd = Math.min(cartSummary.subtotalVnd, promoRule.discountValue);
    }
  }

  const codFeeVnd = input.paymentMethod === "cod" ? settings.cod.feeVnd : 0;
  const totalVnd = Math.max(
    0,
    cartSummary.subtotalVnd +
      cartSummary.giftWrapFeeVnd +
      cartSummary.giftCardFeeVnd +
      quote.feeVnd +
      codFeeVnd -
      discountVnd,
  );

  // Payment method server validation
  if (input.paymentMethod === "bank_transfer" && !isBankTransferConfigured(settings)) {
    throw new CheckoutBusinessError(
      "BANK_TRANSFER_NOT_CONFIGURED",
      "Chuyển khoản ngân hàng chưa được Admin cấu hình thông tin tài khoản.",
      400,
    );
  }
  if (input.paymentMethod === "payos" && !isPayOSGatewayAvailable(settings)) {
    throw new CheckoutBusinessError(
      "PAYOS_NOT_CONFIGURED",
      "Cổng thanh toán PayOS chưa được cấu hình hoặc đang tắt.",
      400,
    );
  }
  if (input.paymentMethod === "cod") {
    if (!settings.cod.enabled) {
      throw new CheckoutBusinessError(
        "COD_DISABLED",
        "Thanh toán khi nhận hàng (COD) hiện không được bật.",
        400,
      );
    }
    if (totalVnd > settings.cod.maxOrderTotalVnd) {
      throw new CheckoutBusinessError(
        "COD_LIMIT_EXCEEDED",
        `COD chỉ áp dụng cho đơn tối đa ${settings.cod.maxOrderTotalVnd.toLocaleString("vi-VN")}đ.`,
        400,
      );
    }
  }

  const { fallbackSlug, templates: activeTemplates } = await getEligibleShopTemplates();
  const activeSlugSet = new Set(activeTemplates.map((t) => t.slug));

  const orderCode = generateOrderCode();
  const guestAccessToken = generateOrderAccessToken();
  const guestAccessTokenHash = hashOrderAccessToken(guestAccessToken);
  const now = new Date();
  const reservationExpiresAt = new Date(
    now.getTime() + settings.inventory.reservationTtlMinutes * 60_000,
  );

  // Aggregate total requested quantity per variant in case same variant appears in multiple lines
  const qtyByVariant = new Map<string, number>();
  for (const item of cartSummary.items) {
    qtyByVariant.set(item.variantId, (qtyByVariant.get(item.variantId) || 0) + item.quantity);
  }

  let createdOrder: { id: string; orderCode: string; status: string; paymentStatus: string; totalVnd: number };
  try {
    createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.storeOrder.create({
        data: {
          orderCode,
          idempotencyKey: input.idempotencyKey,
          userId: userId ?? null,
          guestAccessTokenHash,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          provinceCode: quote.provinceCode,
          provinceName: quote.provinceName,
          districtName: input.districtName,
          wardName: input.wardName,
          streetAddress: input.streetAddress,
          addressNote: input.addressNote || null,
          shippingZone: quote.zone,
          shippingMethodCode: quote.quoteRequired ? "CUSTOM_QUOTE" : "STANDARD",
          deliveryNote: input.deliveryNote || null,
          status: "PENDING_PAYMENT",
          paymentMethod: input.paymentMethod,
          paymentStatus: "UNPAID",
          subtotalVnd: cartSummary.subtotalVnd,
          giftWrapFeeVnd: cartSummary.giftWrapFeeVnd,
          giftCardFeeVnd: cartSummary.giftCardFeeVnd,
          shippingFeeVnd: quote.feeVnd + codFeeVnd,
          shippingQuoteRequired: quote.quoteRequired,
          discountVnd,
          totalVnd,
          promoCode: promoRule ? promoRule.code : null,
          reservationExpiresAt,
        },
      });

      // Atomic stock reservation per distinct variant
      for (const [variantId, totalQty] of Array.from(qtyByVariant.entries())) {
        await reserveVariantStockInTx(tx, {
          variantId,
          quantity: totalQty,
          orderId: order.id,
          expiresAt: reservationExpiresAt,
          reason: `Giữ hàng cho đơn ${orderCode}`,
          actorId: userId ?? null,
        });
      }

      // Create OrderItems & unique per-box StoreOrderGiftUnits
      let globalUnitNumber = 0;
      const defaultPlan =
        settings.cardPlans.find((p) => p.isDefault && p.isActive) || settings.cardPlans[0];

      for (const item of cartSummary.items) {
        const orderItem = await tx.storeOrderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            productId: item.productId,
            skuSnapshot: item.sku,
            productNameSnapshot: item.productName,
            variantNameSnapshot: item.variantName,
            imageSnapshot: item.imageUrl,
            unitPriceVnd: item.unitPriceVnd,
            quantity: item.quantity,
            lineTotalVnd: item.lineSubtotalVnd,
          },
        });

        for (let uIdx = 0; uIdx < item.units.length; uIdx += 1) {
          globalUnitNumber += 1;
          const cartUnit = item.units[uIdx];
          const cust = cartUnit.customization;

          // Resolve eligible template or clean fallback
          const candidateSlug =
            cust?.templateSlug ||
            item.defaultTemplateId ||
            fallbackSlug;
          const finalSlug = activeSlugSet.has(candidateSlug)
            ? candidateSlug
            : resolveTemplateMetaWithFallback(fallbackSlug).slug;

          const plan =
            settings.cardPlans.find((p) => p.code === (cust?.cardPlanCode || defaultPlan.code)) ||
            defaultPlan;

          const { content } = buildGiftInvitationContent({
            templateSlug: finalSlug,
            recipientName: cust?.recipientName || input.recipientName,
            senderName: cust?.senderName || input.customerName,
            title: cust?.title || `Gửi ${input.recipientName} món quà từ ${input.customerName}`,
            message:
              cust?.message ||
              "Gửi bạn chút ấm áp và lời chúc bình an trong hộp quà nhỏ này.",
            occasion: cust?.occasion || undefined,
            musicTrackId: cust?.musicTrackId || undefined,
            photoUrls: cust?.photoUrls || [],
          });

          const tokenPair = createGiftUnitTokenPair();
          const boxRef = buildBoxReferenceCode(orderCode, globalUnitNumber);

          await tx.storeOrderGiftUnit.create({
            data: {
              orderId: order.id,
              orderItemId: orderItem.id,
              unitIndex: globalUnitNumber,
              unitLabel: `Hộp #${globalUnitNumber} — ${item.productName}`,
              boxReferenceCode: boxRef,
              customizationId: cust?.id ?? null,
              templateSlug: finalSlug,
              cardSnapshotJson: JSON.stringify(content),
              cardPlanCode: plan.code,
              durationDays: plan.durationDays,
              cardUpgradeFeeVnd: cust ? plan.priceVnd : 0,
              giftWrapCode: cartUnit.giftWrapCode,
              giftWrapFeeVnd: cartUnit.giftWrapFeeVnd,
              giftTokenHash: tokenPair.giftTokenHash,
              giftTokenEncrypted: tokenPair.giftTokenEncrypted,
              cardState: "PREPARING",
              packingStatus: "PENDING",
            },
          });

          if (cust?.id) {
            await tx.storeGiftCustomization.update({
              where: { id: cust.id },
              data: { status: "ATTACHED" },
            });
          }
        }
      }

      // Create initial shipment tracking record
      await tx.storeShipment.create({
        data: {
          orderId: order.id,
          status: "PENDING_PACK",
        },
      });

      // Clear customer's cart
      await tx.storeCartItem.deleteMany({
        where: { cartId: cartRow.id },
      });
      await tx.storeCart.update({
        where: { id: cartRow.id },
        data: { promoCode: null },
      });

      await tx.storeAuditLog.create({
        data: {
          orderId: order.id,
          actorId: userId ?? null,
          action: "ORDER_CREATED",
          targetType: "StoreOrder",
          targetId: order.id,
          summary: `Khách tạo đơn ${orderCode} (${globalUnitNumber} hộp quà) qua ${input.paymentMethod}.`,
          metaJson: JSON.stringify({
            totalVnd,
            boxCount: globalUnitNumber,
            paymentMethod: input.paymentMethod,
          }),
        },
      });

      return {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalVnd: order.totalVnd,
      };
    });
  } catch (err) {
    if (err instanceof OutOfStockError) {
      throw new CheckoutBusinessError(
        "OUT_OF_STOCK",
        `Sản phẩm đã hết hàng hoặc không đủ tồn khả dụng (còn ${err.available}).`,
        409,
        { variantId: err.variantId, available: err.available },
      );
    }
    throw err;
  }

  let payment: InitializedPaymentOutput | null = null;
  try {
    payment = await createPaymentForOrder({
      order: {
        id: createdOrder.id,
        orderCode: createdOrder.orderCode,
        totalVnd: createdOrder.totalVnd,
        paymentMethod: input.paymentMethod,
      },
      settings,
      baseUrl,
    });
  } catch (err) {
    // If gateway call fails immediately after order creation, cancel & release reservation cleanly
    await prisma.$transaction(async (tx) => {
      await releaseVariantFallbackCancel(tx, createdOrder.id);
    });
    const msg =
      err instanceof Error ? err.message : "Không khởi tạo được phiên thanh toán.";
    throw new CheckoutBusinessError("PAYMENT_INIT_FAILED", msg, 502);
  }

  return {
    orderCode: createdOrder.orderCode,
    orderId: createdOrder.id,
    status: createdOrder.status,
    paymentMethod: input.paymentMethod,
    paymentStatus: createdOrder.paymentStatus,
    totalVnd: createdOrder.totalVnd,
    reservationExpiresAt: reservationExpiresAt.toISOString(),
    guestAccessToken,
    idempotentReplay: false,
    payment,
  };
}

async function releaseVariantFallbackCancel(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string,
) {
  const { releaseOrderReservationsInTx } = await import("./inventory");
  await releaseOrderReservationsInTx(
    tx,
    orderId,
    "Hoàn giữ kho do khởi tạo cổng thanh toán thất bại",
  );
  await tx.storeOrder.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: "Lỗi khởi tạo thanh toán",
    },
  });
  await tx.storeOrderGiftUnit.updateMany({
    where: { orderId },
    data: { cardState: "DISABLED" },
  });
}

export function serializeOrderSafeForCustomer(
  order: {
    id: string;
    orderCode: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    recipientName: string;
    recipientPhone: string;
    provinceCode: string;
    provinceName: string;
    districtName: string;
    wardName: string;
    streetAddress: string;
    addressNote: string | null;
    shippingZone: string;
    deliveryNote: string | null;
    subtotalVnd: number;
    giftWrapFeeVnd: number;
    giftCardFeeVnd: number;
    shippingFeeVnd: number;
    shippingQuoteRequired: boolean;
    discountVnd: number;
    totalVnd: number;
    promoCode: string | null;
    reservationExpiresAt: Date | null;
    paidAt: Date | null;
    packingStartedAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    cancelReason: string | null;
    createdAt: Date;
    items: {
      id: string;
      skuSnapshot: string;
      productNameSnapshot: string;
      variantNameSnapshot: string;
      imageSnapshot: string | null;
      unitPriceVnd: number;
      quantity: number;
      lineTotalVnd: number;
    }[];
    giftUnits: {
      id: string;
      unitIndex: number;
      unitLabel: string;
      boxReferenceCode: string;
      templateSlug: string;
      cardPlanCode: string;
      durationDays: number | null;
      cardUpgradeFeeVnd: number;
      giftWrapCode: string;
      giftWrapFeeVnd: number;
      cardState: string;
      isCardLocked: boolean;
      firstOpenedAt: Date | null;
      expiresAt: Date | null;
      customizationId: string | null;
    }[];
    shipments: {
      carrierName: string | null;
      trackingCode: string | null;
      trackingUrl: string | null;
      status: string;
      shippedAt: Date | null;
      deliveredAt: Date | null;
      note: string | null;
    }[];
  },
  isFullAuthorized: boolean,
  maskers: {
    maskName: (s?: string | null) => string;
    maskPhone: (s?: string | null) => string;
    maskEmail: (s?: string | null) => string;
    maskStreetAddress: (s?: string | null) => string;
  },
) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    authorizedFullView: isFullAuthorized,
    customerName: isFullAuthorized ? order.customerName : maskers.maskName(order.customerName),
    customerPhone: isFullAuthorized ? order.customerPhone : maskers.maskPhone(order.customerPhone),
    customerEmail: isFullAuthorized ? order.customerEmail : maskers.maskEmail(order.customerEmail),
    recipientName: isFullAuthorized ? order.recipientName : maskers.maskName(order.recipientName),
    recipientPhone: isFullAuthorized
      ? order.recipientPhone
      : maskers.maskPhone(order.recipientPhone),
    provinceCode: order.provinceCode,
    provinceName: order.provinceName,
    districtName: order.districtName,
    wardName: isFullAuthorized ? order.wardName : "***",
    streetAddress: isFullAuthorized
      ? order.streetAddress
      : maskers.maskStreetAddress(order.streetAddress),
    addressNote: isFullAuthorized ? order.addressNote : null,
    deliveryNote: isFullAuthorized ? order.deliveryNote : null,
    shippingZone: order.shippingZone,
    subtotalVnd: order.subtotalVnd,
    giftWrapFeeVnd: order.giftWrapFeeVnd,
    giftCardFeeVnd: order.giftCardFeeVnd,
    shippingFeeVnd: order.shippingFeeVnd,
    shippingQuoteRequired: order.shippingQuoteRequired,
    discountVnd: order.discountVnd,
    totalVnd: order.totalVnd,
    promoCode: order.promoCode,
    reservationExpiresAt: order.reservationExpiresAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    packingStartedAt: order.packingStartedAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt.toISOString(),
    items: order.items,
    giftUnits: order.giftUnits.map((u) => {
      const tpl = resolveTemplateMetaWithFallback(u.templateSlug);
      // Never leak raw giftToken or giftTokenEncrypted in customer order responses!
      return {
        id: u.id,
        unitIndex: u.unitIndex,
        unitLabel: u.unitLabel,
        boxReferenceCode: u.boxReferenceCode,
        templateSlug: u.templateSlug,
        templateTitle: tpl.title,
        previewImageUrl: `/previews/${tpl.slug}.webp`,
        cardPlanCode: u.cardPlanCode,
        durationDays: u.durationDays,
        cardUpgradeFeeVnd: u.cardUpgradeFeeVnd,
        giftWrapCode: u.giftWrapCode,
        giftWrapFeeVnd: u.giftWrapFeeVnd,
        cardState: u.cardState,
        isCardLocked: u.isCardLocked,
        canEditCard:
          isFullAuthorized &&
          !u.isCardLocked &&
          !["PACKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "EXPIRED", "REFUNDED", "REFUND_PENDING_MANUAL"].includes(order.status),
        firstOpenedAt: u.firstOpenedAt?.toISOString() ?? null,
        expiresAt: u.expiresAt?.toISOString() ?? null,
        customizationId: isFullAuthorized ? u.customizationId : null,
      };
    }),
    shipments: order.shipments.map((s) => ({
      carrierName: s.carrierName,
      trackingCode: s.trackingCode,
      trackingUrl: s.trackingUrl,
      status: s.status,
      shippedAt: s.shippedAt?.toISOString() ?? null,
      deliveredAt: s.deliveredAt?.toISOString() ?? null,
      note: isFullAuthorized ? s.note : null,
    })),
  };
}

