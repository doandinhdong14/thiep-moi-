import prisma from "@/lib/prisma";
import { findPromoRule, getShopSettings } from "./settings";
import { resolveTemplateMetaWithFallback } from "./gift-card";
import { safeJsonParse, ShopSettings } from "./types";

export interface CartUnitView {
  id: string;
  unitIndex: number;
  giftWrapCode: string;
  giftWrapLabel: string;
  giftWrapFeeVnd: number;
  customizationId: string | null;
  customization: {
    id: string;
    templateSlug: string;
    templateTitle: string;
    previewImageUrl: string;
    cardPlanCode: string;
    cardPlanLabel: string;
    cardUpgradeFeeVnd: number;
    recipientName: string;
    senderName: string;
    title: string;
    message: string;
    occasion: string | null;
    musicTrackId: string | null;
    photoUrls: string[];
  } | null;
}

export interface CartItemView {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productType: string;
  cardIncluded: boolean;
  eligibleTemplateIds: string[];
  defaultTemplateId: string | null;
  sku: string;
  variantName: string;
  colorName: string | null;
  colorHex: string | null;
  imageUrl: string;
  unitPriceVnd: number;
  compareAtVnd: number | null;
  quantity: number;
  lineSubtotalVnd: number;
  availableStock: number;
  isStockEnough: boolean;
  isProductAvailable: boolean;
  giftWrapCode: string;
  units: CartUnitView[];
}

export interface CartSummaryView {
  cartId: string;
  promoCode: string | null;
  promoValid: boolean;
  promoMessage: string | null;
  itemCount: number;
  boxCount: number;
  subtotalVnd: number;
  giftWrapFeeVnd: number;
  giftCardFeeVnd: number;
  discountVnd: number;
  totalBeforeShippingVnd: number;
  freeshipThresholdVnd: number | null;
  missingForFreeshipVnd: number | null;
  hasStockIssues: boolean;
  items: CartItemView[];
}

async function ensureCartItemUnitsSynced(cartItem: {
  id: string;
  quantity: number;
  customizationId: string | null;
  giftWrapCode: string;
}) {
  const existingUnits = await prisma.storeCartItemUnit.findMany({
    where: { cartItemId: cartItem.id },
    orderBy: { unitIndex: "asc" },
  });

  if (existingUnits.length === cartItem.quantity) {
    return;
  }

  if (existingUnits.length > cartItem.quantity) {
    await prisma.storeCartItemUnit.deleteMany({
      where: {
        cartItemId: cartItem.id,
        unitIndex: { gt: cartItem.quantity },
      },
    });
    return;
  }

  const existingIndices = new Set(existingUnits.map((u) => u.unitIndex));
  const seedCustomizationId = existingUnits[0]?.customizationId || cartItem.customizationId || null;
  const seedWrapCode = existingUnits[0]?.giftWrapCode || cartItem.giftWrapCode || "NONE";

  for (let i = 1; i <= cartItem.quantity; i += 1) {
    if (!existingIndices.has(i)) {
      await prisma.storeCartItemUnit.create({
        data: {
          cartItemId: cartItem.id,
          unitIndex: i,
          customizationId: seedCustomizationId,
          giftWrapCode: seedWrapCode,
        },
      });
    }
  }
}

export async function findOrCreateShopCart(identity: {
  userId?: string | null;
  guestToken?: string | null;
}) {
  const { userId, guestToken } = identity;
  if (userId) {
    const existing = await prisma.storeCart.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    if (existing) return existing;
    return prisma.storeCart.create({
      data: { userId },
    });
  }
  if (!guestToken) {
    throw new Error("MISSING_GUEST_TOKEN");
  }
  const existing = await prisma.storeCart.findUnique({
    where: { guestToken },
  });
  if (existing) return existing;
  return prisma.storeCart.create({
    data: { guestToken },
  });
}

export async function findShopCartReadonly(identity: {
  userId?: string | null;
  guestToken?: string | null;
}) {
  if (identity.userId) {
    return prisma.storeCart.findFirst({
      where: { userId: identity.userId },
      orderBy: { updatedAt: "desc" },
    });
  }
  if (identity.guestToken) {
    return prisma.storeCart.findUnique({
      where: { guestToken: identity.guestToken },
    });
  }
  return null;
}

export async function mergeGuestCartIntoUser(guestToken: string, userId: string): Promise<void> {
  if (!guestToken || !userId) return;
  const guestCart = await prisma.storeCart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await findOrCreateShopCart({ userId });
  if (userCart.id === guestCart.id) return;

  for (const gItem of guestCart.items) {
    const existingUserItem = await prisma.storeCartItem.findFirst({
      where: {
        cartId: userCart.id,
        variantId: gItem.variantId,
        customizationId: gItem.customizationId ?? null,
      },
    });
    if (existingUserItem) {
      await prisma.storeCartItem.update({
        where: { id: existingUserItem.id },
        data: { quantity: existingUserItem.quantity + gItem.quantity },
      });
      await prisma.storeCartItem.delete({ where: { id: gItem.id } });
    } else {
      await prisma.storeCartItem.update({
        where: { id: gItem.id },
        data: { cartId: userCart.id },
      });
    }
  }
  await prisma.storeCart.delete({ where: { id: guestCart.id } }).catch(() => {});
}

export async function buildCartSummaryView(
  cartId: string | null,
  providedSettings?: ShopSettings,
): Promise<CartSummaryView> {
  const settings = providedSettings || (await getShopSettings());
  if (!cartId) {
    return {
      cartId: "",
      promoCode: null,
      promoValid: false,
      promoMessage: null,
      itemCount: 0,
      boxCount: 0,
      subtotalVnd: 0,
      giftWrapFeeVnd: 0,
      giftCardFeeVnd: 0,
      discountVnd: 0,
      totalBeforeShippingVnd: 0,
      freeshipThresholdVnd: settings.shipping.freeshipThresholdVnd,
      missingForFreeshipVnd: settings.shipping.freeshipThresholdVnd,
      hasStockIssues: false,
      items: [],
    };
  }

  const cart = await prisma.storeCart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              inventory: true,
              product: true,
            },
          },
          customization: true,
          units: {
            orderBy: { unitIndex: "asc" },
            include: { customization: true },
          },
        },
      },
    },
  });

  if (!cart) {
    return buildCartSummaryView(null, settings);
  }

  // Ensure unit counts match item quantities
  let resynced = false;
  for (const item of cart.items) {
    if (item.units.length !== item.quantity) {
      await ensureCartItemUnitsSynced(item);
      resynced = true;
    }
  }

  const freshCart = resynced
    ? await prisma.storeCart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: {
              variant: { include: { inventory: true, product: true } },
              customization: true,
              units: { orderBy: { unitIndex: "asc" }, include: { customization: true } },
            },
          },
        },
      })
    : cart;

  const finalCart = freshCart || cart;

  let subtotalVnd = 0;
  let giftWrapFeeVnd = 0;
  let giftCardFeeVnd = 0;
  let itemCount = 0;
  let boxCount = 0;
  let hasStockIssues = false;

  const itemsView: CartItemView[] = finalCart.items.map((item) => {
    const product = item.variant.product;
    const inv = item.variant.inventory;
    const availableStock = inv ? Math.max(0, inv.onHand - inv.reserved) : 0;
    const isProductAvailable = product.status === "ACTIVE" && item.variant.isActive;
    const isStockEnough = isProductAvailable && availableStock >= item.quantity;
    if (!isStockEnough) hasStockIssues = true;

    const lineSubtotalVnd = item.variant.priceVnd * item.quantity;
    subtotalVnd += lineSubtotalVnd;
    itemCount += item.quantity;
    if (product.cardIncluded) {
      boxCount += item.quantity;
    }

    const images = safeJsonParse<string[]>(product.imagesJson, []);
    const primaryImage =
      item.variant.imageUrl || images[0] || "/assets/shop/scarf-suong-mai.svg";

    const unitsView: CartUnitView[] = item.units.map((u) => {
      const cust = u.customization || item.customization;
      const wrapCode = cust?.giftWrapCode && cust.giftWrapCode !== "NONE" ? cust.giftWrapCode : u.giftWrapCode;
      const wrapOption =
        settings.giftWrapOptions.find((w) => w.code === wrapCode && w.isActive) ||
        settings.giftWrapOptions[0];
      const wrapFee = wrapOption?.priceVnd ?? 0;
      giftWrapFeeVnd += wrapFee;

      const planOption =
        settings.cardPlans.find((p) => p.code === (cust?.cardPlanCode || "DEFAULT") && p.isActive) ||
        settings.cardPlans.find((p) => p.isDefault) ||
        settings.cardPlans[0];
      const cardUpgradeFee = cust ? (planOption?.priceVnd ?? 0) : 0;
      giftCardFeeVnd += cardUpgradeFee;

      const tplMeta = cust ? resolveTemplateMetaWithFallback(cust.templateSlug) : null;

      return {
        id: u.id,
        unitIndex: u.unitIndex,
        giftWrapCode: wrapOption?.code || "NONE",
        giftWrapLabel: wrapOption?.label || "Hộp quà tiêu chuẩn",
        giftWrapFeeVnd: wrapFee,
        customizationId: cust?.id || null,
        customization: cust && tplMeta
          ? {
              id: cust.id,
              templateSlug: tplMeta.slug,
              templateTitle: tplMeta.title,
              previewImageUrl: `/previews/${tplMeta.slug}.webp`,
              cardPlanCode: planOption?.code || "DEFAULT",
              cardPlanLabel: planOption?.label || "Gói chuẩn",
              cardUpgradeFeeVnd: cardUpgradeFee,
              recipientName: cust.recipientName,
              senderName: cust.senderName,
              title: cust.title,
              message: cust.message,
              occasion: cust.occasion,
              musicTrackId: cust.musicTrackId,
              photoUrls: safeJsonParse<string[]>(cust.photoUrlsJson, []),
            }
          : null,
      };
    });

    return {
      id: item.id,
      variantId: item.variantId,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productType: product.productType,
      cardIncluded: product.cardIncluded,
      eligibleTemplateIds: safeJsonParse<string[]>(product.eligibleTemplateIdsJson, []),
      defaultTemplateId: product.defaultTemplateId,
      sku: item.variant.sku,
      variantName: item.variant.name,
      colorName: item.variant.colorName,
      colorHex: item.variant.colorHex,
      imageUrl: primaryImage,
      unitPriceVnd: item.variant.priceVnd,
      compareAtVnd: item.variant.compareAtVnd,
      quantity: item.quantity,
      lineSubtotalVnd,
      availableStock,
      isStockEnough,
      isProductAvailable,
      giftWrapCode: item.giftWrapCode,
      units: unitsView,
    };
  });

  const promoRule = findPromoRule(settings, finalCart.promoCode);
  let discountVnd = 0;
  let promoValid = false;
  let promoMessage: string | null = null;

  if (finalCart.promoCode) {
    if (!promoRule) {
      promoMessage = "Mã ưu đãi không tồn tại hoặc đã hết hạn.";
    } else if (subtotalVnd < promoRule.minSubtotalVnd) {
      promoMessage = `Mã ${promoRule.code} áp dụng cho đơn từ ${promoRule.minSubtotalVnd.toLocaleString("vi-VN")}đ.`;
    } else {
      promoValid = true;
      if (promoRule.discountType === "PERCENT") {
        const raw = Math.round((subtotalVnd * promoRule.discountValue) / 100);
        discountVnd =
          promoRule.maxDiscountVnd && promoRule.maxDiscountVnd > 0
            ? Math.min(raw, promoRule.maxDiscountVnd)
            : raw;
      } else {
        discountVnd = Math.min(subtotalVnd, promoRule.discountValue);
      }
      promoMessage = `Đã áp dụng ưu đãi ${promoRule.label}.`;
    }
  }

  const totalBeforeShippingVnd = Math.max(
    0,
    subtotalVnd + giftWrapFeeVnd + giftCardFeeVnd - discountVnd,
  );
  const threshold = settings.shipping.freeshipThresholdVnd;
  const missingForFreeshipVnd =
    threshold !== null && threshold > 0 && subtotalVnd < threshold
      ? threshold - subtotalVnd
      : null;

  return {
    cartId: finalCart.id,
    promoCode: finalCart.promoCode,
    promoValid,
    promoMessage,
    itemCount,
    boxCount,
    subtotalVnd,
    giftWrapFeeVnd,
    giftCardFeeVnd,
    discountVnd,
    totalBeforeShippingVnd,
    freeshipThresholdVnd: threshold,
    missingForFreeshipVnd,
    hasStockIssues,
    items: itemsView,
  };
}

