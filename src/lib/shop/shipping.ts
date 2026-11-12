import { ShippingZone, ShopSettings, normalizeViText } from "./types";

export interface ProvinceEntry {
  code: string;
  name: string;
  zone: Exclude<ShippingZone, "CUSTOM_QUOTE">;
  popularDistricts?: string[];
}

export const VIETNAM_PROVINCES: ProvinceEntry[] = [
  {
    code: "SG",
    name: "TP. Hồ Chí Minh",
    zone: "INNER_CITY",
    popularDistricts: [
      "Quận 1",
      "Quận 3",
      "Quận 4",
      "Quận 5",
      "Quận 7",
      "Quận 10",
      "Bình Thạnh",
      "Phú Nhuận",
      "Tân Bình",
      "Gò Vấp",
      "TP. Thủ Đức",
    ],
  },
  {
    code: "HN",
    name: "Hà Nội",
    zone: "INNER_CITY",
    popularDistricts: [
      "Ba Đình",
      "Hoàn Kiếm",
      "Đống Đa",
      "Hai Bà Trưng",
      "Cầu Giấy",
      "Thanh Xuân",
      "Tây Hồ",
      "Long Biên",
      "Nam Từ Liêm",
      "Hà Đông",
    ],
  },
  { code: "DN", name: "Đà Nẵng", zone: "REGIONAL" },
  { code: "HP", name: "Hải Phòng", zone: "REGIONAL" },
  { code: "CT", name: "Cần Thơ", zone: "REGIONAL" },
  { code: "BD", name: "Bình Dương", zone: "REGIONAL" },
  { code: "DNA", name: "Đồng Nai", zone: "REGIONAL" },
  { code: "BRVT", name: "Bà Rịa - Vũng Tàu", zone: "REGIONAL" },
  { code: "LA", name: "Long An", zone: "REGIONAL" },
  { code: "TG", name: "Tiền Giang", zone: "REGIONAL" },
  { code: "BN", name: "Bắc Ninh", zone: "REGIONAL" },
  { code: "HY", name: "Hưng Yên", zone: "REGIONAL" },
  { code: "HD", name: "Hải Dương", zone: "REGIONAL" },
  { code: "VP", name: "Vĩnh Phúc", zone: "REGIONAL" },
  { code: "QN", name: "Quảng Ninh", zone: "REGIONAL" },
  { code: "TTH", name: "Thừa Thiên Huế", zone: "REGIONAL" },
  { code: "KH", name: "Khánh Hòa", zone: "REGIONAL" },
  { code: "NA", name: "Nghệ An", zone: "REGIONAL" },
  { code: "TH", name: "Thanh Hóa", zone: "REGIONAL" },
  { code: "LD", name: "Lâm Đồng", zone: "REGIONAL" },
  { code: "AG", name: "An Giang", zone: "REGIONAL" },
  { code: "BDI", name: "Bình Định", zone: "REGIONAL" },
  { code: "BT", name: "Bình Thuận", zone: "REGIONAL" },
  { code: "TN", name: "Tây Ninh", zone: "REGIONAL" },
  { code: "BP", name: "Bình Phước", zone: "REGIONAL" },
  { code: "BTE", name: "Bến Tre", zone: "REGIONAL" },
  { code: "VL", name: "Vĩnh Long", zone: "REGIONAL" },
  { code: "DT", name: "Đồng Tháp", zone: "REGIONAL" },
  { code: "NB", name: "Ninh Bình", zone: "REGIONAL" },
  { code: "ND", name: "Nam Định", zone: "REGIONAL" },
  { code: "TB", name: "Thái Bình", zone: "REGIONAL" },
  { code: "HNA", name: "Hà Nam", zone: "REGIONAL" },
  { code: "BG", name: "Bắc Giang", zone: "REGIONAL" },
  { code: "PT", name: "Phú Thọ", zone: "REGIONAL" },
  { code: "TNG", name: "Thái Nguyên", zone: "REGIONAL" },
  { code: "QNA", name: "Quảng Nam", zone: "REGIONAL" },
  { code: "QNG", name: "Quảng Ngãi", zone: "REGIONAL" },
  { code: "NT", name: "Ninh Thuận", zone: "REGIONAL" },
  { code: "DL", name: "Đắk Lắk", zone: "REMOTE" },
  { code: "GL", name: "Gia Lai", zone: "REMOTE" },
  { code: "KT", name: "Kon Tum", zone: "REMOTE" },
  { code: "DNO", name: "Đắk Nông", zone: "REMOTE" },
  { code: "PY", name: "Phú Yên", zone: "REMOTE" },
  { code: "QB", name: "Quảng Bình", zone: "REMOTE" },
  { code: "QT", name: "Quảng Trị", zone: "REMOTE" },
  { code: "HT", name: "Hà Tĩnh", zone: "REMOTE" },
  { code: "TV", name: "Trà Vinh", zone: "REMOTE" },
  { code: "ST", name: "Sóc Trăng", zone: "REMOTE" },
  { code: "BL", name: "Bạc Liêu", zone: "REMOTE" },
  { code: "CM", name: "Cà Mau", zone: "REMOTE" },
  { code: "KG", name: "Kiên Giang", zone: "REMOTE" },
  { code: "HG", name: "Hậu Giang", zone: "REMOTE" },
  { code: "HB", name: "Hòa Bình", zone: "REMOTE" },
  { code: "SL", name: "Sơn La", zone: "REMOTE" },
  { code: "DB", name: "Điện Biên", zone: "REMOTE" },
  { code: "LC", name: "Lai Châu", zone: "REMOTE" },
  { code: "LCA", name: "Lào Cai", zone: "REMOTE" },
  { code: "YB", name: "Yên Bái", zone: "REMOTE" },
  { code: "TQ", name: "Tuyên Quang", zone: "REMOTE" },
  { code: "HGI", name: "Hà Giang", zone: "REMOTE" },
  { code: "CB", name: "Cao Bằng", zone: "REMOTE" },
  { code: "BK", name: "Bắc Kạn", zone: "REMOTE" },
  { code: "LS", name: "Lạng Sơn", zone: "REMOTE" },
];

export function resolveProvince(codeOrName: string): ProvinceEntry | null {
  const input = (codeOrName || "").trim();
  if (!input) return null;
  const byCode = VIETNAM_PROVINCES.find(
    (p) => p.code.toLowerCase() === input.toLowerCase(),
  );
  if (byCode) return byCode;
  const norm = normalizeViText(input);
  return (
    VIETNAM_PROVINCES.find((p) => normalizeViText(p.name) === norm) ||
    VIETNAM_PROVINCES.find((p) => normalizeViText(p.name).includes(norm)) ||
    null
  );
}

export interface ShippingQuoteResult {
  configured: boolean;
  zone: ShippingZone;
  zoneLabel: string;
  provinceCode: string;
  provinceName: string;
  feeVnd: number;
  baseFeeVnd: number;
  estimatedDays: string;
  quoteRequired: boolean;
  freeshipApplied: boolean;
  freeshipThresholdVnd: number | null;
  missingForFreeshipVnd: number | null;
  note: string;
}

export function calculateShippingQuote(
  settings: ShopSettings,
  input: {
    provinceCode: string;
    provinceName?: string;
    subtotalVnd: number;
  },
): ShippingQuoteResult {
  const matched = resolveProvince(input.provinceCode || input.provinceName || "");
  const provinceCode = matched?.code || (input.provinceCode || "OTHER").trim();
  const provinceName = matched?.name || (input.provinceName || "Khu vực khác").trim();

  if (!settings.shipping.configured || !matched) {
    return {
      configured: settings.shipping.configured,
      zone: "CUSTOM_QUOTE",
      zoneLabel: matched ? "Cần xác nhận phí vận chuyển" : "Khu vực chưa có bảng phí cố định",
      provinceCode,
      provinceName,
      feeVnd: 0,
      baseFeeVnd: 0,
      estimatedDays: "Xác nhận sau khi đặt đơn",
      quoteRequired: true,
      freeshipApplied: false,
      freeshipThresholdVnd: settings.shipping.freeshipThresholdVnd,
      missingForFreeshipVnd: null,
      note: settings.shipping.customQuoteMessage,
    };
  }

  const rule = settings.shipping.zones.find((z) => z.zone === matched.zone && z.isActive);
  if (!rule) {
    return {
      configured: true,
      zone: "CUSTOM_QUOTE",
      zoneLabel: "Cần xác nhận phí vận chuyển",
      provinceCode,
      provinceName,
      feeVnd: 0,
      baseFeeVnd: 0,
      estimatedDays: "Xác nhận sau khi đặt đơn",
      quoteRequired: true,
      freeshipApplied: false,
      freeshipThresholdVnd: settings.shipping.freeshipThresholdVnd,
      missingForFreeshipVnd: null,
      note: settings.shipping.customQuoteMessage,
    };
  }

  const threshold = settings.shipping.freeshipThresholdVnd;
  const subtotal = Math.max(0, Math.round(input.subtotalVnd));
  const freeshipApplied = threshold !== null && threshold > 0 && subtotal >= threshold;
  const feeVnd = freeshipApplied ? 0 : rule.feeVnd;
  const missingForFreeshipVnd =
    threshold !== null && threshold > 0 && !freeshipApplied
      ? Math.max(0, threshold - subtotal)
      : null;

  return {
    configured: true,
    zone: matched.zone,
    zoneLabel: rule.label,
    provinceCode,
    provinceName,
    feeVnd,
    baseFeeVnd: rule.feeVnd,
    estimatedDays: rule.estimatedDays,
    quoteRequired: false,
    freeshipApplied,
    freeshipThresholdVnd: threshold,
    missingForFreeshipVnd,
    note: freeshipApplied
      ? "Đã đạt ngưỡng miễn phí vận chuyển."
      : `Dự kiến giao ${rule.estimatedDays} từ ${settings.shipping.originCity}.`,
  };
}

