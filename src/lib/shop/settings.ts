import { z } from "zod";
import prisma from "@/lib/prisma";
import { getPayOSClient } from "@/lib/payments/payos";
import { resolveVietQRBank } from "@/lib/payments/vietqr";
import {
  CardPlanOption,
  GiftWrapOption,
  PromoCodeRule,
  PublicShopSettings,
  ShippingZoneRule,
  ShopSettings,
  safeJsonParse,
} from "./types";

export const SHOP_SETTINGS_KEY = "shop_store_settings_v1";

const ShippingZoneRuleSchema = z.object({
  zone: z.enum(["INNER_CITY", "REGIONAL", "REMOTE"]),
  label: z.string().min(1).max(80),
  feeVnd: z.number().int().min(0).max(5_000_000),
  estimatedDays: z.string().min(1).max(60),
  isActive: z.boolean(),
});

const CardPlanOptionSchema = z.object({
  code: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  durationDays: z.number().int().min(1).max(36500).nullable(),
  priceVnd: z.number().int().min(0).max(5_000_000),
  description: z.string().max(300),
  isDefault: z.boolean().optional(),
  isActive: z.boolean(),
});

const GiftWrapOptionSchema = z.object({
  code: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  description: z.string().max(300),
  priceVnd: z.number().int().min(0).max(2_000_000),
  isActive: z.boolean(),
});

const PromoCodeRuleSchema = z.object({
  code: z.string().min(2).max(40),
  label: z.string().min(1).max(120),
  discountType: z.enum(["PERCENT", "FIXED_VND"]),
  discountValue: z.number().int().min(1).max(10_000_000),
  minSubtotalVnd: z.number().int().min(0).max(50_000_000),
  maxDiscountVnd: z.number().int().min(0).max(10_000_000).nullable().optional(),
  isActive: z.boolean(),
});

export const ShopSettingsSchema = z.object({
  storeOpen: z.boolean(),
  pauseMessage: z.string().max(300),
  shopName: z.string().min(1).max(120),
  announcementBar: z.object({
    enabled: z.boolean(),
    text: z.string().max(180),
    href: z.string().max(200),
  }),
  support: z.object({
    hotline: z.string().max(40),
    zaloUrl: z.string().max(200),
    email: z.string().max(120),
    workingHours: z.string().max(120),
  }),
  policies: z.object({
    shippingPolicyUrl: z.string().max(200),
    returnPolicySummary: z.string().max(400),
    shippingPolicySummary: z.string().max(400),
  }),
  bankTransfer: z.object({
    enabled: z.boolean(),
    bankCode: z.string().max(30),
    bankName: z.string().max(120),
    accountNo: z.string().max(40),
    accountName: z.string().max(120),
    branch: z.string().max(120),
    instructions: z.string().max(500),
  }),
  payosEnabled: z.boolean(),
  cod: z.object({
    enabled: z.boolean(),
    maxOrderTotalVnd: z.number().int().min(0).max(50_000_000),
    feeVnd: z.number().int().min(0).max(1_000_000),
  }),
  shipping: z.object({
    configured: z.boolean(),
    originCity: z.string().max(80),
    freeshipThresholdVnd: z.number().int().min(0).max(50_000_000).nullable(),
    customQuoteMessage: z.string().max(240),
    zones: z.array(ShippingZoneRuleSchema).min(1).max(10),
  }),
  inventory: z.object({
    reservationTtlMinutes: z.number().int().min(5).max(1440),
    defaultLowStockThreshold: z.number().int().min(0).max(1000),
  }),
  cardPlans: z.array(CardPlanOptionSchema).min(1).max(10),
  giftWrapOptions: z.array(GiftWrapOptionSchema).min(1).max(10),
  promoCodes: z.array(PromoCodeRuleSchema).max(50),
  allowShopManagerPaymentReview: z.boolean(),
  demoSeedPublished: z.boolean(),
});

export const DEFAULT_SHIPPING_ZONES: ShippingZoneRule[] = [
  {
    zone: "INNER_CITY",
    label: "Nội thành Hà Nội & TP.HCM",
    feeVnd: 22000,
    estimatedDays: "1–2 ngày",
    isActive: true,
  },
  {
    zone: "REGIONAL",
    label: "Tỉnh thành lân cận & Trung tâm",
    feeVnd: 32000,
    estimatedDays: "2–4 ngày",
    isActive: true,
  },
  {
    zone: "REMOTE",
    label: "Vùng xa / Hải đảo",
    feeVnd: 45000,
    estimatedDays: "3–6 ngày",
    isActive: true,
  },
];

export const DEFAULT_CARD_PLANS: CardPlanOption[] = [
  {
    code: "DEFAULT",
    label: "Thiệp online kèm hộp quà (90 ngày kể từ lúc mở)",
    durationDays: 90,
    priceVnd: 0,
    description:
      "Kèm sẵn theo mỗi hộp quà. Thời hạn 90 ngày chỉ bắt đầu tính khi người nhận nhấn Mở thiệp.",
    isDefault: true,
    isActive: true,
  },
  {
    code: "YEAR_1",
    label: "Lưu giữ thiệp 1 năm (365 ngày)",
    durationDays: 365,
    priceVnd: 19000,
    description: "Gia hạn thời gian lưu giữ kỷ niệm trên link QR trọn 1 năm kể từ khi mở.",
    isDefault: false,
    isActive: true,
  },
  {
    code: "FOREVER",
    label: "Lưu giữ trọn đời",
    durationDays: null,
    priceVnd: 39000,
    description: "Giữ lời chúc và hình ảnh kỷ niệm không giới hạn thời gian.",
    isDefault: false,
    isActive: true,
  },
];

export const DEFAULT_GIFT_WRAPS: GiftWrapOption[] = [
  {
    code: "NONE",
    label: "Hộp quà DingDong tiêu chuẩn",
    description: "Hộp giấy kraft kem nơ tag cảm ơn & túi chống sốc (đã bao gồm).",
    priceVnd: 0,
    isActive: true,
  },
  {
    code: "RIBBON_BLUSH",
    label: "Gói lụa Blush & Giấy nến thơm",
    description: "Bọc giấy lụa hồng phấn, ruy băng satin thắt nơ và túi thơm khô dịu nhẹ.",
    priceVnd: 15000,
    isActive: true,
  },
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeOpen: true,
  pauseMessage: "Cửa hàng quà đang tạm nghỉ để chuẩn bị lô hàng mới. Bạn vẫn có thể xem sản phẩm.",
  shopName: "Cửa hàng quà DingDongGift",
  announcementBar: {
    enabled: false,
    text: "",
    href: "/qua-tang/tat-ca",
  },
  support: {
    hotline: "",
    zaloUrl: "",
    email: "",
    workingHours: "09:00 – 21:00 hằng ngày",
  },
  policies: {
    shippingPolicyUrl: "/qua-tang#faq",
    returnPolicySummary:
      "Hỗ trợ đổi lỗi sản xuất hoặc sai mẫu trong 7 ngày khi còn tem mác và hộp quà nguyên vẹn.",
    shippingPolicySummary:
      "Phí vận chuyển hiển thị theo khu vực đã cấu hình hoặc báo giá minh bạch trước khi gửi.",
  },
  bankTransfer: {
    enabled: false,
    bankCode: "",
    bankName: "",
    accountNo: "",
    accountName: "",
    branch: "",
    instructions:
      "Vui lòng chuyển khoản đúng số tiền và nội dung đơn hàng. Admin sẽ đối soát và xác nhận trong giờ làm việc.",
  },
  payosEnabled: false,
  cod: {
    enabled: false,
    maxOrderTotalVnd: 1_500_000,
    feeVnd: 0,
  },
  shipping: {
    configured: false,
    originCity: "TP.HCM",
    freeshipThresholdVnd: null,
    customQuoteMessage:
      "Shop chưa bật bảng phí tự động; phí vận chuyển sẽ được xác nhận trực tiếp theo khu vực.",
    zones: DEFAULT_SHIPPING_ZONES,
  },
  inventory: {
    reservationTtlMinutes: 30,
    defaultLowStockThreshold: 5,
  },
  cardPlans: DEFAULT_CARD_PLANS,
  giftWrapOptions: DEFAULT_GIFT_WRAPS,
  promoCodes: [],
  allowShopManagerPaymentReview: true,
  demoSeedPublished: false,
};

function mergeShopSettings(partial: Partial<ShopSettings> | null | undefined): ShopSettings {
  const input = partial || {};
  return {
    ...DEFAULT_SHOP_SETTINGS,
    ...input,
    announcementBar: {
      ...DEFAULT_SHOP_SETTINGS.announcementBar,
      ...(input.announcementBar || {}),
    },
    support: {
      ...DEFAULT_SHOP_SETTINGS.support,
      ...(input.support || {}),
    },
    policies: {
      ...DEFAULT_SHOP_SETTINGS.policies,
      ...(input.policies || {}),
    },
    bankTransfer: {
      ...DEFAULT_SHOP_SETTINGS.bankTransfer,
      ...(input.bankTransfer || {}),
    },
    cod: {
      ...DEFAULT_SHOP_SETTINGS.cod,
      ...(input.cod || {}),
    },
    shipping: {
      ...DEFAULT_SHOP_SETTINGS.shipping,
      ...(input.shipping || {}),
      zones:
        Array.isArray(input.shipping?.zones) && input.shipping.zones.length > 0
          ? input.shipping.zones
          : DEFAULT_SHOP_SETTINGS.shipping.zones,
    },
    inventory: {
      ...DEFAULT_SHOP_SETTINGS.inventory,
      ...(input.inventory || {}),
    },
    cardPlans:
      Array.isArray(input.cardPlans) && input.cardPlans.length > 0
        ? input.cardPlans
        : DEFAULT_SHOP_SETTINGS.cardPlans,
    giftWrapOptions:
      Array.isArray(input.giftWrapOptions) && input.giftWrapOptions.length > 0
        ? input.giftWrapOptions
        : DEFAULT_SHOP_SETTINGS.giftWrapOptions,
    promoCodes: Array.isArray(input.promoCodes) ? input.promoCodes : [],
  };
}

export async function getShopSettings(): Promise<ShopSettings> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: SHOP_SETTINGS_KEY },
  });
  if (!row) {
    return mergeShopSettings(null);
  }
  const parsed = safeJsonParse<Partial<ShopSettings>>(row.valueJson, {});
  return mergeShopSettings(parsed);
}

export async function saveShopSettings(
  nextSettings: ShopSettings,
  actorId?: string | null,
): Promise<ShopSettings> {
  const validated = ShopSettingsSchema.parse(nextSettings);
  await prisma.systemSetting.upsert({
    where: { key: SHOP_SETTINGS_KEY },
    update: {
      valueJson: JSON.stringify(validated),
      updatedBy: actorId ?? null,
    },
    create: {
      key: SHOP_SETTINGS_KEY,
      valueJson: JSON.stringify(validated),
      updatedBy: actorId ?? null,
    },
  });
  return validated;
}

export function isBankTransferConfigured(settings: ShopSettings): boolean {
  const b = settings.bankTransfer;
  if (!b.enabled) return false;
  const accountNo = b.accountNo.trim();
  const accountName = b.accountName.trim();
  const bankCode = b.bankCode.trim();
  if (!accountNo || !accountName || !bankCode) return false;
  if (accountNo === "0123456789" || accountName.toUpperCase() === "NGUYEN VAN A") {
    return false;
  }
  const resolved = resolveVietQRBank(bankCode);
  return Boolean(resolved);
}

export function isPayOSGatewayAvailable(settings: ShopSettings): boolean {
  return Boolean(settings.payosEnabled && getPayOSClient() !== null);
}

function maskAccountNo(accountNo: string): string {
  const clean = accountNo.trim();
  if (clean.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
}

export function toPublicShopSettings(settings: ShopSettings): PublicShopSettings {
  const bankAvailable = isBankTransferConfigured(settings);
  const payosAvailable = isPayOSGatewayAvailable(settings);
  const codAvailable = Boolean(settings.cod.enabled);

  return {
    storeOpen: settings.storeOpen,
    pauseMessage: settings.pauseMessage,
    shopName: settings.shopName,
    announcementBar: {
      ...settings.announcementBar,
      enabled: Boolean(settings.announcementBar.enabled && settings.announcementBar.text.trim()),
    },
    support: settings.support,
    policies: settings.policies,
    paymentCapabilities: {
      bankTransferAvailable: bankAvailable,
      bankSummary: bankAvailable
        ? {
            bankName:
            settings.bankTransfer.bankName.trim() ||
            resolveVietQRBank(settings.bankTransfer.bankCode).name ||
            settings.bankTransfer.bankCode,
            accountNoMasked: maskAccountNo(settings.bankTransfer.accountNo),
            accountName: settings.bankTransfer.accountName.trim(),
          }
        : null,
      payosAvailable,
      codAvailable,
      codMaxOrderTotalVnd: settings.cod.maxOrderTotalVnd,
      codFeeVnd: settings.cod.feeVnd,
      anyOnlineMethodAvailable: bankAvailable || payosAvailable || codAvailable,
    },
    shipping: settings.shipping,
    inventory: {
      reservationTtlMinutes: settings.inventory.reservationTtlMinutes,
    },
    cardPlans: settings.cardPlans.filter((p) => p.isActive),
    giftWrapOptions: settings.giftWrapOptions.filter((w) => w.isActive),
  };
}

export async function getPublicShopSettings(): Promise<PublicShopSettings> {
  const settings = await getShopSettings();
  return toPublicShopSettings(settings);
}

export function findPromoRule(settings: ShopSettings, code?: string | null): PromoCodeRule | null {
  if (!code || !code.trim()) return null;
  const normalized = code.trim().toUpperCase();
  return (
    settings.promoCodes.find((p) => p.isActive && p.code.trim().toUpperCase() === normalized) || null
  );
}
