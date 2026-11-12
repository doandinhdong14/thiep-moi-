export const STORE_ORDER_STATUSES = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW_REQUESTED",
  "PAID",
  "PACKING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUND_PENDING_MANUAL",
  "REFUNDED",
  "EXPIRED",
  "STOCK_CONFLICT_REFUND_NEEDED",
] as const;

export type StoreOrderStatus = (typeof STORE_ORDER_STATUSES)[number];

export const STORE_PAYMENT_STATUSES = [
  "UNPAID",
  "REVIEW_REQUESTED",
  "PAID",
  "REFUND_PENDING_MANUAL",
  "REFUNDED",
  "FAILED",
] as const;

export type StorePaymentStatus = (typeof STORE_PAYMENT_STATUSES)[number];

export const STORE_PAYMENT_METHODS = ["bank_transfer", "payos", "cod"] as const;
export type StorePaymentMethod = (typeof STORE_PAYMENT_METHODS)[number];

export const STORE_CARD_STATES = [
  "PREPARING",
  "READY_UNOPENED",
  "ACTIVE",
  "EXPIRED",
  "DISABLED",
] as const;

export type StoreCardState = (typeof STORE_CARD_STATES)[number];

export const SHIPPING_ZONES = [
  "INNER_CITY",
  "REGIONAL",
  "REMOTE",
  "CUSTOM_QUOTE",
] as const;

export type ShippingZone = (typeof SHIPPING_ZONES)[number];

export const PRODUCT_TYPES = ["SINGLE", "COMBO", "ADDON"] as const;
export type StoreProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type StoreProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface GiftWrapOption {
  code: string;
  label: string;
  description: string;
  priceVnd: number;
  isActive: boolean;
}

export interface CardPlanOption {
  code: string;
  label: string;
  durationDays: number | null; // null = perpetual
  priceVnd: number;
  description: string;
  isDefault?: boolean;
  isActive: boolean;
}

export interface ShippingZoneRule {
  zone: Exclude<ShippingZone, "CUSTOM_QUOTE">;
  label: string;
  feeVnd: number;
  estimatedDays: string;
  isActive: boolean;
}

export interface PromoCodeRule {
  code: string;
  label: string;
  discountType: "PERCENT" | "FIXED_VND";
  discountValue: number;
  minSubtotalVnd: number;
  maxDiscountVnd?: number | null;
  isActive: boolean;
}

export interface ShopSettings {
  storeOpen: boolean;
  pauseMessage: string;
  shopName: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    href: string;
  };
  support: {
    hotline: string;
    zaloUrl: string;
    email: string;
    workingHours: string;
  };
  policies: {
    shippingPolicyUrl: string;
    returnPolicySummary: string;
    shippingPolicySummary: string;
  };
  bankTransfer: {
    enabled: boolean;
    bankCode: string;
    bankName: string;
    accountNo: string;
    accountName: string;
    branch: string;
    instructions: string;
  };
  payosEnabled: boolean;
  cod: {
    enabled: boolean;
    maxOrderTotalVnd: number;
    feeVnd: number;
  };
  shipping: {
    configured: boolean;
    originCity: string;
    freeshipThresholdVnd: number | null;
    customQuoteMessage: string;
    zones: ShippingZoneRule[];
  };
  inventory: {
    reservationTtlMinutes: number;
    defaultLowStockThreshold: number;
  };
  cardPlans: CardPlanOption[];
  giftWrapOptions: GiftWrapOption[];
  promoCodes: PromoCodeRule[];
  allowShopManagerPaymentReview: boolean;
  demoSeedPublished: boolean;
}

export interface PublicShopSettings {
  storeOpen: boolean;
  pauseMessage: string;
  shopName: string;
  announcementBar: ShopSettings["announcementBar"];
  support: ShopSettings["support"];
  policies: ShopSettings["policies"];
  paymentCapabilities: {
    bankTransferAvailable: boolean;
    bankSummary: {
      bankName: string;
      accountNoMasked: string;
      accountName: string;
    } | null;
    payosAvailable: boolean;
    codAvailable: boolean;
    codMaxOrderTotalVnd: number;
    codFeeVnd: number;
    anyOnlineMethodAvailable: boolean;
  };
  shipping: {
    configured: boolean;
    originCity: string;
    freeshipThresholdVnd: number | null;
    customQuoteMessage: string;
    zones: ShippingZoneRule[];
  };
  inventory: {
    reservationTtlMinutes: number;
  };
  cardPlans: CardPlanOption[];
  giftWrapOptions: GiftWrapOption[];
}

export function formatVnd(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${safe.toLocaleString("vi-VN")}đ`;
}

export function normalizeViText(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function slugifyVi(input: string): string {
  return normalizeViText(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/assets/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

const ALLOWED_TRACKING_HOSTS = [
  "ghtk.vn",
  "ghn.vn",
  "viettelpost.com.vn",
  "jtexpress.vn",
  "ninjavan.co",
  "vnpost.vn",
  "spx.vn",
  "lalamove.com",
  "ahamove.com",
];

export function sanitizeTrackingUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    const allowed = ALLOWED_TRACKING_HOSTS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
    return allowed ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? "");
  const needsFormulaPrefix = /^[=+\-@\t\r]/.test(str);
  const safe = needsFormulaPrefix ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function isShopApiSuccess(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as { success?: unknown; ok?: unknown };
  return obj.success === true || obj.ok === true;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING_PAYMENT: "Chờ thanh toán",
  PAYMENT_REVIEW_REQUESTED: "Chờ đối soát chuyển khoản",
  PAID: "Đã thanh toán",
  PACKING: "Đang gói quà & gắn QR",
  READY_TO_SHIP: "Sẵn sàng bàn giao",
  SHIPPED: "Đang giao hàng",
  DELIVERED: "Đã giao thành công",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  REFUND_PENDING_MANUAL: "Chờ hoàn tiền thủ công",
  REFUNDED: "Đã hoàn tiền",
  EXPIRED: "Hết hạn giữ hàng",
  STOCK_CONFLICT_REFUND_NEEDED: "Cần xử lý trùng tồn kho",
};
