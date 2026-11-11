import prisma from "@/lib/prisma";
import {
  TEMPLATES_REGISTRY,
  USER_TEMPLATE_SEQUENCE,
  getVisibleTemplates,
  type TemplateMeta,
} from "@/lib/templates/registry";
import {
  getVisibleCatalogProducts,
  type CatalogProduct,
} from "@/data/catalogData";

export const ADMIN_TEMPLATES_CONFIG_KEY = "admin_templates_config_v1";

export interface AdminTemplatesConfig {
  visibilityOverrides: Record<string, boolean>;
  templateNotes: Record<string, string>;
  generalNotes: string;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_TEMPLATE_NOTES: Record<string, string> = {
  "thiep-3":
    "Mẫu #01 (file gốc thiep-3.html) — Vé Hẹn Hò: nhập tên người gửi/nhận, ngày & địa điểm hẹn, lời nhắn, hỗ trợ dải ảnh & nhạc nền.",
  "thiep-4":
    "Mẫu #02 (file gốc thiep-4.html) — Gửi Em Một Vũ Trụ (7 cảnh): hỗ trợ văn bản lời chúc 3D, câu hỏi phản hồi, ảnh kỷ niệm nổi & nhạc nền.",
  "thiep-5":
    "Mẫu #03 (file gốc thiep-5.html) — Khu Vườn Kỷ Niệm 3D: hỗ trợ khóa PIN bảo vệ bí mật, ngày kỷ niệm, phong thư 3D, album ảnh & nhạc nền.",
  "thiep-6":
    "Mẫu #04 (file gốc thiep-6.html) — Mùa Thu Kỷ Niệm: hỗ trợ khóa PIN, chữ thư tay trên nền lá phong rơi, ảnh kỷ niệm & nhạc nền.",
  "thiep-7":
    "Mẫu #05 (file gốc thiep-7.html) — Đại Dương Tình Yêu: chai thủy tinh đại dương, tùy biến tên/lời chúc, dải ảnh & nhạc nền.",
  "thiep-8":
    "Mẫu #06 (file gốc thiep-8.html) — Vũ Trụ Trái Tim Particle & Bì Thư 3D: hiệu ứng tim 3D hạt sáng, ảnh nổi, lời chúc cá nhân hóa & nhạc nền.",
  "thiep-9":
    "Mẫu #07 (file gốc thiep-9.html) — Vũ Điệu Cực Quang & Trái Tim Pha Lê 3D: tên người gửi/nhận, thông điệp cực quang, ảnh & nhạc nền.",
  "thiep-10":
    "Mẫu #08 (file gốc thiep-10.html) — Boarding Pass Chuyến Bay Hạnh Phúc: hỗ trợ tên hành khách, ngày bay, điểm đi/đến, lời nhắn & ảnh kỷ niệm.",
  "thiep-giang-sinh":
    "Mẫu #09 (file gốc thiep-giang-sinh.html) — Thiệp Giáng Sinh Đêm Noel Diệu Kỳ: tuyết rơi 3D, hộp quà mở thư Noel, ảnh & nhạc nền.",
  "thiep-xmas":
    "Mẫu #10 (file gốc thiep-xmas.html) — Christmas Special Hộp Quà 3D: pháo tuyết Giáng Sinh, bưu thiếp Bắc Cực, ảnh & nhạc nền.",
  "wedding-classic": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai; giữ trong hệ thống để tương thích link cũ).",
  "wedding-floral": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
  "graduation-classic": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
  "graduation-playful": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
  "birthday-fun": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
  "birthday-minimal": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
  "love-letter": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
  "love-galaxy": "Mẫu gốc nền tảng (đã ẩn khỏi trang bán hàng công khai).",
};

export const DEFAULT_GENERAL_NOTES = [
  "=== TỔNG HỢP CẤU HÌNH MẪU THIỆP & VẬN HÀNH ===",
  "",
  "1. DANH SÁCH 10 MẪU CHÍNH THỨC ĐANG MỞ (ĐÁNH SỐ #01 → #10):",
  "   - #01 | thiep-3          | public/templates/thiep-3.html          | Một Tấm Vé Hẹn Hò",
  "   - #02 | thiep-4          | public/templates/thiep-4.html          | Gửi Em Một Vũ Trụ (7 cảnh)",
  "   - #03 | thiep-5          | public/templates/thiep-5.html          | Khu Vườn Kỷ Niệm (Khóa PIN & 3D)",
  "   - #04 | thiep-6          | public/templates/thiep-6.html          | Mùa Thu Kỷ Niệm (Khóa PIN & Lá Phong)",
  "   - #05 | thiep-7          | public/templates/thiep-7.html          | Đại Dương Tình Yêu (Thư Trong Chai)",
  "   - #06 | thiep-8          | public/templates/thiep-8.html          | Vũ Trụ Trái Tim & Bì Thư 3D (Mặc định)",
  "   - #07 | thiep-9          | public/templates/thiep-9.html          | Vũ Điệu Cực Quang & Pha Lê 3D",
  "   - #08 | thiep-10         | public/templates/thiep-10.html         | Boarding Pass – Chuyến Bay Hạnh Phúc",
  "   - #09 | thiep-giang-sinh | public/templates/thiep-giang-sinh.html | Thiệp Giáng Sinh – Đêm Noel Diệu Kỳ",
  "   - #10 | thiep-xmas       | public/templates/thiep-xmas.html       | Christmas Special – Hộp Quà 3D",
  "   * Lưu ý đánh số: Bộ HTML đưa vào bắt đầu từ file thiep-3.html đến thiep-xmas.html (không có thiep-1/thiep-2), hệ thống đã chuẩn hóa đánh số hiển thị công khai liên tục #01 → #10.",
  "",
  "2. TRẠNG THÁI MẪU GỐC / MẪU MẪU CŨ:",
  "   - Toàn bộ 8 mẫu React mặc định (wedding-classic, wedding-floral, graduation-classic, graduation-playful, birthday-fun, birthday-minimal, love-letter, love-galaxy) và các thẻ mẫu phụ đã được ẨN khỏi Trang chủ, /products, /templates, /collections và /create.",
  "   - Các mẫu ẩn vẫn được giữ nguyên trong Registry để không làm gãy link/đơn hàng cũ và có thể bật lại bất kỳ lúc nào trong bảng bên dưới.",
  "",
  "3. CÁ NHÂN HÓA ẢNH, NHẠC & TRẢ THIỆP SAU THANH TOÁN:",
  "   - Ảnh upload & nhạc người dùng tự tải lên được lưu bền vững trong CSDL (SystemSetting key asset_blob:*) và phát nhạc chuẩn HTTP Range streaming.",
  "   - Sau khi thanh toán chuyển khoản (2.000đ): khách nhận ngay Link chia sẻ (/i/[slug] kèm nút Sao chép) và Bộ tạo Mã QR với đủ 16 khung trang trí (Hoa Hồng, 20/10, Gift For You, Hoa, Cupid, Mũi Tên, Trái Tim, Trái Tim Khung/Snoopy, Sinh Nhật 1 & 2, Socola 1 & 2, Giáng Sinh 1-3, Pháo Hoa).",
  "   - Trang thiệp người nhận (/i/[slug]) sạch 100%: KHÔNG quảng cáo, KHÔNG hiển thị bất kỳ logo, liên kết hay thương hiệu Ding Dong Gift nào.",
].join("\n");

export function createDefaultAdminTemplatesConfig(): AdminTemplatesConfig {
  const defaultVisibility: Record<string, boolean> = {};
  const visibleSlugs = new Set(USER_TEMPLATE_SEQUENCE.map((u) => u.slug));
  for (const slug of Object.keys(TEMPLATES_REGISTRY)) {
    defaultVisibility[slug] = visibleSlugs.has(slug);
  }
  return {
    visibilityOverrides: defaultVisibility,
    templateNotes: { ...DEFAULT_TEMPLATE_NOTES },
    generalNotes: DEFAULT_GENERAL_NOTES,
    updatedAt: new Date(0).toISOString(),
    updatedBy: "system-default",
  };
}

function mergeWithDefaults(raw?: Partial<AdminTemplatesConfig> | null): AdminTemplatesConfig {
  const base = createDefaultAdminTemplatesConfig();
  if (!raw || typeof raw !== "object") return base;

  return {
    visibilityOverrides: {
      ...base.visibilityOverrides,
      ...(raw.visibilityOverrides && typeof raw.visibilityOverrides === "object"
        ? raw.visibilityOverrides
        : {}),
    },
    templateNotes: {
      ...base.templateNotes,
      ...(raw.templateNotes && typeof raw.templateNotes === "object"
        ? raw.templateNotes
        : {}),
    },
    generalNotes:
      typeof raw.generalNotes === "string" && raw.generalNotes.trim().length > 0
        ? raw.generalNotes
        : base.generalNotes,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : base.updatedBy,
  };
}

export async function getAdminTemplatesConfig(): Promise<AdminTemplatesConfig> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: ADMIN_TEMPLATES_CONFIG_KEY },
    });
    if (!setting?.valueJson) {
      return createDefaultAdminTemplatesConfig();
    }
    const parsed = JSON.parse(setting.valueJson) as Partial<AdminTemplatesConfig>;
    return mergeWithDefaults(parsed);
  } catch {
    return createDefaultAdminTemplatesConfig();
  }
}

export async function saveAdminTemplatesConfig(
  patch: {
    visibilityOverrides?: Record<string, boolean>;
    templateNotes?: Record<string, string>;
    generalNotes?: string;
    resetDefaults?: boolean;
  },
  updatedBy: string
): Promise<AdminTemplatesConfig> {
  const current = patch.resetDefaults
    ? createDefaultAdminTemplatesConfig()
    : await getAdminTemplatesConfig();

  const next: AdminTemplatesConfig = {
    visibilityOverrides: {
      ...current.visibilityOverrides,
      ...(patch.visibilityOverrides || {}),
    },
    templateNotes: {
      ...current.templateNotes,
      ...(patch.templateNotes || {}),
    },
    generalNotes:
      typeof patch.generalNotes === "string" ? patch.generalNotes : current.generalNotes,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await prisma.systemSetting.upsert({
    where: { key: ADMIN_TEMPLATES_CONFIG_KEY },
    update: {
      valueJson: JSON.stringify(next),
      updatedBy,
    },
    create: {
      key: ADMIN_TEMPLATES_CONFIG_KEY,
      valueJson: JSON.stringify(next),
      updatedBy,
    },
  });

  return next;
}

export async function getEffectiveVisibleTemplates(): Promise<TemplateMeta[]> {
  const config = await getAdminTemplatesConfig();
  return getVisibleTemplates(config.visibilityOverrides);
}

export async function getEffectiveVisibleCatalogProducts(): Promise<CatalogProduct[]> {
  const config = await getAdminTemplatesConfig();
  return getVisibleCatalogProducts(config.visibilityOverrides);
}
