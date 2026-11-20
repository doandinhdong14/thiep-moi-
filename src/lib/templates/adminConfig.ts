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
  "card-01-first-gift":
    "Mẫu #01 (card-01-first-gift) — Thiệp Đầu Tiên 3 Chặng (Bó hoa 3D → Hành trình sao băng 8 màn → Vũ trụ yêu thương 3D): người dùng chỉ chỉnh sửa chữ, thêm/đồng bộ ảnh & chú thích, chọn/tải nhạc nền; giữ nguyên hiệu ứng 3D có sẵn; demo tự chạy.",
  "card-02-second-gift":
    "Mẫu #02 (card-02-second-gift) — Thiệp Thứ Hai 3 Chặng (Hoa hồng nở 3D → Hành trình sao băng 8 màn → Đèn trời 3D & Pháo hoa): người dùng chỉ chỉnh sửa chữ, thêm/đồng bộ ảnh & chú thích, lời chúc đèn trời, chọn/tải nhạc nền; giữ nguyên hiệu ứng 3D có sẵn; demo tự chạy.",
  "card-03-third-gift":
    "Mẫu #03 (card-03-third-gift) — Thiệp Thứ Ba (Chuyện Tình 55 Trang & Toàn Cảnh Trái Tim Flowtime): người dùng chỉnh sửa chữ, tên đôi lứa, thêm/đồng bộ tối đa 12 ảnh kỷ niệm, chọn/tải nhạc nền; giữ nguyên hiệu ứng không gian 2D Flowtime & Trái Tim có sẵn; demo tự chạy.",
  "thiep-3":
    "Mẫu #04 (file gốc thiep-3.html) — Vé Hẹn Hò: nhập tên người gửi/nhận, ngày & địa điểm hẹn, lời nhắn, hỗ trợ dải ảnh & nhạc nền.",
  "thiep-4":
    "Mẫu #05 (file gốc thiep-4.html — ĐANG KHÓA, ra mắt 24/11) — Gửi Em Một Vũ Trụ (7 cảnh): hỗ trợ văn bản lời chúc 3D, câu hỏi phản hồi, ảnh kỷ niệm nổi & nhạc nền.",
  "thiep-5":
    "Mẫu #06 (file gốc thiep-5.html) — Khu Vườn Kỷ Niệm 3D: hỗ trợ khóa PIN bảo vệ bí mật, ngày kỷ niệm, phong thư 3D, album ảnh & nhạc nền.",
  "thiep-6":
    "Mẫu #07 (file gốc thiep-6.html) — Mùa Thu Kỷ Niệm: hỗ trợ khóa PIN, chữ thư tay trên nền lá phong rơi, ảnh kỷ niệm & nhạc nền.",
  "thiep-7":
    "Mẫu #08 (file gốc thiep-7.html) — Đại Dương Tình Yêu: chai thủy tinh đại dương, tùy biến tên/lời chúc, dải ảnh & nhạc nền.",
  "thiep-8":
    "Mẫu #09 (file gốc thiep-8.html) — Vũ Trụ Trái Tim Particle & Bì Thư 3D: hiệu ứng tim 3D hạt sáng, ảnh nổi, lời chúc cá nhân hóa & nhạc nền.",
  "thiep-9":
    "Mẫu #10 (file gốc thiep-9.html) — Vũ Điệu Cực Quang & Trái Tim Pha Lê 3D: tên người gửi/nhận, thông điệp cực quang, ảnh & nhạc nền.",
  "thiep-10":
    "Mẫu #11 (file gốc thiep-10.html) — Boarding Pass Chuyến Bay Hạnh Phúc: hỗ trợ tên hành khách, ngày bay, điểm đi/đến, lời nhắn & ảnh kỷ niệm.",
  "thiep-giang-sinh":
    "Mẫu #12 (file gốc thiep-giang-sinh.html) — Thiệp Giáng Sinh Đêm Noel Diệu Kỳ: tuyết rơi 3D, hộp quà mở thư Noel, ảnh & nhạc nền.",
  "thiep-xmas":
    "Mẫu #13 (file gốc thiep-xmas.html) — Christmas Special Hộp Quà 3D: pháo tuyết Giáng Sinh, bưu thiếp Bắc Cực, ảnh & nhạc nền.",
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
  "1. DANH SÁCH 13 MẪU CHÍNH THỨC (ĐÁNH SỐ #01 → #13):",
  "   - #01 | card-01-first-gift  | Card01Player.tsx                       | Thiệp Đầu Tiên – Bó Hoa & Vũ Trụ 3D (Mặc định)",
  "   - #02 | card-02-second-gift | Card02Player.tsx                       | Thiệp Thứ Hai – Hoa Hồng, Sao Băng & Đèn Trời 3D",
  "   - #03 | card-03-third-gift  | Card03Player.tsx                       | Thiệp Thứ Ba – Chuyện Tình 55 Trang & Trái Tim Flowtime",
  "   - #04 | thiep-3             | public/templates/thiep-3.html          | Một Tấm Vé Hẹn Hò",
  "   - #05 | thiep-4             | public/templates/thiep-4.html          | Gửi Em Một Vũ Trụ (7 cảnh — ĐANG KHÓA)",
  "   - #06 | thiep-5             | public/templates/thiep-5.html          | Khu Vườn Kỷ Niệm (Khóa PIN & 3D)",
  "   - #07 | thiep-6             | public/templates/thiep-6.html          | Mùa Thu Kỷ Niệm (Khóa PIN & Lá Phong)",
  "   - #08 | thiep-7             | public/templates/thiep-7.html          | Đại Dương Tình Yêu (Thư Trong Chai)",
  "   - #09 | thiep-8             | public/templates/thiep-8.html          | Vũ Trụ Trái Tim & Bì Thư 3D",
  "   - #10 | thiep-9             | public/templates/thiep-9.html          | Vũ Điệu Cực Quang & Pha Lê 3D",
  "   - #11 | thiep-10            | public/templates/thiep-10.html         | Boarding Pass – Chuyến Bay Hạnh Phúc",
  "   - #12 | thiep-giang-sinh    | public/templates/thiep-giang-sinh.html | Thiệp Giáng Sinh – Đêm Noel Diệu Kỳ",
  "   - #13 | thiep-xmas          | public/templates/thiep-xmas.html       | Christmas Special – Hộp Quà 3D",
  "",
  "2. TRẠNG THÁI MẪU GỐC / MẪU MẪU CŨ:",
  "   - Toàn bộ 8 mẫu React mặc định (wedding-classic, wedding-floral, graduation-classic, graduation-playful, birthday-fun, birthday-minimal, love-letter, love-galaxy) và các thẻ mẫu phụ đã được ẨN khỏi Trang chủ, /products, /templates, /collections và /create.",
  "   - Các mẫu ẩn vẫn được giữ nguyên trong Registry để không làm gãy link/đơn hàng cũ và có thể bật lại bất kỳ lúc nào trong bảng bên dưới.",
  "",
  "3. CÁ NHÂN HÓA ẢNH, NHẠC & TRẢ THIỆP SAU THANH TOÁN:",
  "   - Ảnh upload & nhạc người dùng tự tải lên được lưu bền vững trong CSDL (SystemSetting key asset_blob:*) và phát nhạc chuẩn HTTP Range streaming.",
  "   - 4 mẫu đang mở (#01–#04) được giảm giá từ 50.000đ xuống Miễn phí (0đ) để dùng trực tiếp không cần thanh toán; các mẫu còn lại có giá từ 30.000đ–50.000đ.",
  "   - Khách nhận ngay Link chia sẻ (/i/[slug] kèm nút Sao chép), Bộ tạo Mã QR đủ 16 khung trang trí, và toàn quyền chỉnh sửa chữ, ảnh, nhạc nền (không chỉnh sửa/thêm hiệu ứng có sẵn).",
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
