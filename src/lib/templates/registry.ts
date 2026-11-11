import { InvitationContent } from "./schema";

export interface TemplateTheme {
  name: string;
  style: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  cardBg: string;
  fontFamily: "serif" | "sans";
}

export interface TemplateMeta {
  slug: string;
  title: string;
  occasionKey: "wedding" | "graduation" | "birthday" | "love";
  occasionTitle: string;
  description: string;
  isPremium: boolean;
  theme: TemplateTheme;
  blocks: string[];
  interactiveUrl?: string;
  badge?: string;
  icon?: string;
  displayOrder?: number;
  numberCode?: string;
  defaultHidden?: boolean;
  sourceFile?: string;
}

export const TEMPLATES_REGISTRY: Record<string, TemplateMeta> = {
  "wedding-classic": {
    slug: "wedding-classic",
    title: "Ivory Ceremony",
    occasionKey: "wedding",
    occasionTitle: "Lễ cưới & Hôn nhân",
    description: "Tông kem - vàng champagne trang nhã, phong bì ảo sang trọng, đếm ngược và RSVP tinh tế.",
    isPremium: false,
    theme: {
      name: "Ivory Ceremony",
      style: "Kem - vàng champagne",
      background: "#faf8f5",
      foreground: "#2d241e",
      accent: "#d4af37",
      muted: "#8c7e75",
      cardBg: "#ffffff",
      fontFamily: "serif",
    },
    blocks: ["cover", "envelope_reveal", "intro_message", "event_details", "countdown", "gallery", "rsvp", "guestbook", "footer_cta"],
  },
  "wedding-floral": {
    slug: "wedding-floral",
    title: "Bloom & Vows",
    occasionKey: "wedding",
    occasionTitle: "Lễ cưới & Hôn nhân",
    description: "Hoa pastel thanh lịch, lãng mạn nhẹ nhàng, bố cục tạp chí hiện đại cho ngày chung đôi.",
    isPremium: true,
    theme: {
      name: "Bloom & Vows",
      style: "Hoa pastel thanh lịch",
      background: "#fdf8f7",
      foreground: "#3a2d2e",
      accent: "#e28787",
      muted: "#998082",
      cardBg: "#ffffff",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "gallery", "event_details", "rsvp", "footer_cta"],
  },
  "graduation-classic": {
    slug: "graduation-classic",
    title: "The Next Chapter",
    occasionKey: "graduation",
    occasionTitle: "Lễ tốt nghiệp",
    description: "Xanh navy & vàng gold trang trọng, học thuật, tôn vinh cột mốc tốt nghiệp đáng nhớ.",
    isPremium: false,
    theme: {
      name: "The Next Chapter",
      style: "Xanh navy & vàng gold",
      background: "#0f172a",
      foreground: "#f8fafc",
      accent: "#f59e0b",
      muted: "#94a3b8",
      cardBg: "#1e293b",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "event_details", "countdown", "gallery", "rsvp", "footer_cta"],
  },
  "graduation-playful": {
    slug: "graduation-playful",
    title: "Grad Party!",
    occasionKey: "graduation",
    occasionTitle: "Tiệc tốt nghiệp",
    description: "Tươi trẻ năng động, confetti rực rỡ, kỷ niệm thanh xuân cùng bạn bè và thầy cô.",
    isPremium: false,
    theme: {
      name: "Grad Party!",
      style: "Confetti tươi trẻ",
      background: "#f0fdf4",
      foreground: "#14532d",
      accent: "#16a34a",
      muted: "#4ade80",
      cardBg: "#ffffff",
      fontFamily: "sans",
    },
    blocks: ["cover", "event_details", "gallery", "response_question", "guestbook", "footer_cta"],
  },
  "birthday-fun": {
    slug: "birthday-fun",
    title: "Confetti Pop",
    occasionKey: "birthday",
    occasionTitle: "Sinh nhật",
    description: "Đáng yêu, pháo hoa giấy và niềm vui rộn rã đón tuổi mới cùng gia đình và bạn bè.",
    isPremium: false,
    theme: {
      name: "Confetti Pop",
      style: "Hồng đào & Confetti",
      background: "#fff1f2",
      foreground: "#881337",
      accent: "#f43f5e",
      muted: "#fb7185",
      cardBg: "#ffffff",
      fontFamily: "sans",
    },
    blocks: ["envelope_reveal", "cover", "countdown", "event_details", "rsvp", "footer_cta"],
  },
  "birthday-minimal": {
    slug: "birthday-minimal",
    title: "Candlelight",
    occasionKey: "birthday",
    occasionTitle: "Sinh nhật",
    description: "Ánh nến ấm áp, tông trầm tối giản, không gian riêng tư cho buổi tiệc sinh nhật ấm cúng.",
    isPremium: true,
    theme: {
      name: "Candlelight",
      style: "Ánh nến tối giản",
      background: "#18181b",
      foreground: "#fafafa",
      accent: "#fbbf24",
      muted: "#a1a1aa",
      cardBg: "#27272a",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "event_details", "gallery", "guestbook", "footer_cta"],
  },
  "love-letter": {
    slug: "love-letter",
    title: "Secret Letter",
    occasionKey: "love",
    occasionTitle: "Tình yêu & Tỏ tình",
    description: "Phong thư cổ điển, nét mực viết tay, gửi gắm những lời yêu thương chưa từng thổ lộ.",
    isPremium: false,
    theme: {
      name: "Secret Letter",
      style: "Giấy thư phong bì cổ điển",
      background: "#fefae0",
      foreground: "#283618",
      accent: "#bc6c25",
      muted: "#dda15e",
      cardBg: "#ffffff",
      fontFamily: "serif",
    },
    blocks: ["envelope_reveal", "intro_message", "gallery", "response_question", "footer_cta"],
  },
  "love-galaxy": {
    slug: "love-galaxy",
    title: "Vũ trụ yêu thương - Mưa Lời Yêu Thương",
    occasionKey: "love",
    occasionTitle: "Kỷ niệm tình yêu",
    description: "Bầu trời đêm ngàn vì sao lấp lánh, hiệu ứng mưa lời yêu thương và thông điệp tình cảm ngọt ngào.",
    isPremium: false,
    theme: {
      name: "Vũ trụ yêu thương",
      style: "Đêm sao kỳ ảo & Mưa lời yêu thương",
      background: "#09090b",
      foreground: "#f4f4f5",
      accent: "#a855f7",
      muted: "#71717a",
      cardBg: "#18181b",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "gallery", "music_control", "response_question", "footer_cta"],
  },
  "thiep-3": {
    slug: "thiep-3",
    title: "Thiệp 03: Một Tấm Vé Hẹn Hò ♡",
    occasionKey: "love",
    occasionTitle: "Hẹn hò & Tình yêu",
    description: "Phong cách vintage cổ điển ấm áp. Cho phép người thương tự tay chọn ngày giờ, địa điểm, món ngon và hoạt động yêu thích, xuất chiếc vé tình yêu độc bản với mã vạch và dấu mộc lưu niệm.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-3.html",
    badge: "Vé Hẹn Hò",
    icon: "🎟️",
    theme: {
      name: "Vintage Ticket",
      style: "Giấy Cũ Vintage & Vé Tình Yêu",
      background: "#FAF4E2",
      foreground: "#504735",
      accent: "#AA713D",
      muted: "#A18C70",
      cardBg: "#F3ECE2",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "event_details", "response_question", "footer_cta"],
  },
  "thiep-4": {
    slug: "thiep-4",
    title: "Thiệp 04: Gửi Em Một Vũ Trụ ✨",
    occasionKey: "love",
    occasionTitle: "Kỷ niệm tình yêu & Tỏ tình",
    description: "Hành trình không gian 7 cảnh ma mị: bắt đầu từ ngôi sao phát tín hiệu, câu hỏi với nút né tinh nghịch cực gắt, xuyên cổng sao warp, gom sao trái tim, mở bì thư sáp 3D và nhận tọa độ vũ trụ riêng.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-4.html",
    badge: "Vũ Trụ 7 Cảnh",
    icon: "🪐",
    theme: {
      name: "Cosmic Journey",
      style: "Vũ Trụ Huyền Ảo & Warp Cổng Sao",
      background: "#080c16",
      foreground: "#f0f4fc",
      accent: "#9d7cf7",
      muted: "#8892b0",
      cardBg: "#121828",
      fontFamily: "sans",
    },
    blocks: ["cover", "intro_message", "response_question", "footer_cta"],
  },
  "thiep-5": {
    slug: "thiep-5",
    title: "Thiệp 05: Khu Vườn Kỷ Niệm – Phong Thư Tình Yêu 🌸",
    occasionKey: "love",
    occasionTitle: "Kỷ niệm ngày yêu",
    description: "Mở lá thư, ngắm hoa bay và những kỷ niệm ngọt ngào. Khóa trái tim mã PIN, rút thiệp 3D lật gáy sách sang trọng, đọc tâm thư gõ chữ và ngắm ảnh kỷ niệm bay vào vòng hoa trái tim.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-5.html",
    badge: "Khóa PIN & 3D",
    icon: "🌸",
    theme: {
      name: "Memory Garden",
      style: "Khu Vườn Hoa & Lật Gáy Sách 3D",
      background: "#1a0f18",
      foreground: "#fff0f5",
      accent: "#bc1948",
      muted: "#c9ac9d",
      cardBg: "#2d1b28",
      fontFamily: "serif",
    },
    blocks: ["envelope_reveal", "cover", "intro_message", "gallery", "footer_cta"],
  },
  "thiep-6": {
    slug: "thiep-6",
    title: "Thiệp 06: Mùa Thu Kỷ Niệm – Bức Thư Giữa Mùa Lá Rụng 🍁",
    occasionKey: "love",
    occasionTitle: "Kỷ niệm & Hoài niệm",
    description: "Biến thể từ Thiệp 5 mang tone màu thu vàng ấm áp hoài niệm. Mưa lá phong đỏ và lá bạch quả chao nghiêng theo gió, sáp niêm phong lá phong, mở phong thư giấy Kraft và vòng lá phong kết tụ ảnh kỷ niệm.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-6.html",
    badge: "Mùa Thu Lá Phong",
    icon: "🍁",
    theme: {
      name: "Autumn Leaves",
      style: "Mùa Thu Lá Phong & Giấy Kraft",
      background: "#1b120c",
      foreground: "#fef5e7",
      accent: "#e67e22",
      muted: "#d35400",
      cardBg: "#2c1b10",
      fontFamily: "serif",
    },
    blocks: ["envelope_reveal", "cover", "intro_message", "gallery", "footer_cta"],
  },
  "thiep-7": {
    slug: "thiep-7",
    title: "Thiệp 07: Đại Dương Tình Yêu & Ánh Sáng Biển Sâu 🌊",
    occasionKey: "love",
    occasionTitle: "Lời ngỏ & Tình yêu",
    description: "Biến thể từ Thiệp 4 đưa người thương lặn sâu vào đại dương xanh thẳm: viên ngọc phát quang sinh học, nút bơi né cá heo tinh nghịch, gom 5 viên ngọc trái tim, mở thư trong chai và xuất hải đồ kỷ niệm.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-7.html",
    badge: "Thư Trong Chai",
    icon: "🌊",
    theme: {
      name: "Deep Ocean",
      style: "Đại Dương Xanh & Dạ Quang Biển Sâu",
      background: "#031021",
      foreground: "#e0f7fa",
      accent: "#00f2fe",
      muted: "#4facfe",
      cardBg: "#051833",
      fontFamily: "sans",
    },
    blocks: ["cover", "intro_message", "response_question", "footer_cta"],
  },
  "thiep-8": {
    slug: "thiep-8",
    title: "Thiệp 08: Vũ Trụ Trái Tim & Bì Thư 3D 💖",
    occasionKey: "love",
    occasionTitle: "Kỷ niệm tình yêu",
    description: "Vũ trụ sao hạt lung linh, trái tim particle 3D có độ sâu, vòng chữ và ảnh quay quỹ đạo. Xuyên tim flash hồng đón phong thư mở nắp, rút thiệp lật gáy 3D lộ ảnh kỷ niệm và tâm thư gõ chữ mượt mà.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-8.html",
    badge: "Tim Particle 3D",
    icon: "💖",
    theme: {
      name: "Cosmic Heart 3D",
      style: "Particle Trái Tim 3D & Bì Thư Mở Nắp",
      background: "#090514",
      foreground: "#ffe6f0",
      accent: "#d50065",
      muted: "#ff82ab",
      cardBg: "#1a0c24",
      fontFamily: "sans",
    },
    blocks: ["cover", "intro_message", "gallery", "footer_cta"],
  },
  "thiep-9": {
    slug: "thiep-9",
    title: "Thiệp 09: Vũ Điệu Cực Quang & Trái Tim Pha Lê 3D 🌌",
    occasionKey: "love",
    occasionTitle: "Tình yêu mùa đông",
    description: "Biến thể từ Thiệp 8 đưa bạn vào bầu trời đêm Bắc Cực ngập tràn ánh sáng Aurora Borealis đa sắc. Trái tim 3D kết tinh từ ngàn hạt pha lê băng tuyết lấp lánh và bức thư ấm áp xua tan giá lạnh.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-9.html",
    badge: "Cực Quang & Pha Lê",
    icon: "🌌",
    theme: {
      name: "Aurora Crystal",
      style: "Cực Quang Bắc Cực & Pha Lê Băng Tuyết",
      background: "#051329",
      foreground: "#e8fdf8",
      accent: "#64ffda",
      muted: "#00b894",
      cardBg: "#0b2246",
      fontFamily: "sans",
    },
    blocks: ["cover", "intro_message", "gallery", "footer_cta"],
  },
  "thiep-10": {
    slug: "thiep-10",
    title: "Thiệp 10: Boarding Pass – Chuyến Bay Hạnh Phúc ✈️",
    occasionKey: "love",
    occasionTitle: "Hẹn hò & Trải nghiệm",
    description: "Biến thể từ Thiệp 3 theo phong cách thẻ lên máy bay hạng nhất (First Class Boarding Pass). Chọn lịch trình bay, điểm đến lãng mạn, nút né tránh va chạm radar và xuất thẻ Boarding Pass PNG cao cấp.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-10.html",
    badge: "Boarding Pass",
    icon: "✈️",
    theme: {
      name: "Boarding Pass",
      style: "Vé Máy Bay First Class & Radar Tình Yêu",
      background: "#0a1128",
      foreground: "#fff8e7",
      accent: "#d4af37",
      muted: "#1e90ff",
      cardBg: "#121d40",
      fontFamily: "sans",
    },
    blocks: ["cover", "intro_message", "event_details", "response_question", "footer_cta"],
  },
  "thiep-giang-sinh": {
    slug: "thiep-giang-sinh",
    title: "Thiệp Giáng Sinh – Đêm Noel Diệu Kỳ 🎄",
    occasionKey: "love",
    occasionTitle: "Giáng sinh & Năm mới",
    description: "Không gian đêm Giáng Sinh tuyết rơi đa tầng ấm áp với dây đèn Fairy Lights lung linh tương tác đổi nhịp sáng. Hộp quà 3D thắt nơ vàng kim lắc lư mời gọi chạm để mở nơ, bung nắp hộp quà bắn pháo tuyết, hé lộ bức thiệp Noel, chọn điều ước đêm đông và xuất bưu thiếp Bắc Cực độc bản.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-giang-sinh.html",
    badge: "Đêm Noel 3D",
    icon: "🎄",
    theme: {
      name: "Christmas Magic",
      style: "Đêm Noel Tuyết Rơi 3D & Hộp Quà Mở Nơ",
      background: "#0c1829",
      foreground: "#fff9f0",
      accent: "#e74c3c",
      muted: "#f1c40f",
      cardBg: "#192d47",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "response_question", "footer_cta"],
  },
  "thiep-xmas": {
    slug: "thiep-xmas",
    title: "Christmas Special – Hộp Quà Giáng Sinh Lung Linh 🎅",
    occasionKey: "love",
    occasionTitle: "Giáng sinh & Năm mới",
    description: "Phiên bản hộp quà Giáng Sinh 3D lộng lẫy, tương tác mở nơ bung nắp quà, hiệu ứng tuyết rơi rơi và âm nhạc rộn rã mang lại cảm xúc mùa lễ hội ấm áp tuyệt vời.",
    isPremium: false,
    interactiveUrl: "/templates/thiep-xmas.html",
    badge: "Christmas Special",
    icon: "🎅",
    theme: {
      name: "Christmas Special",
      style: "Hộp Quà 3D & Bưu Thiếp Bắc Cực",
      background: "#14070a",
      foreground: "#fff5f5",
      accent: "#c0392b",
      muted: "#27ae60",
      cardBg: "#2d0f14",
      fontFamily: "serif",
    },
    blocks: ["cover", "intro_message", "response_question", "footer_cta"],
  },
};

export interface UserTemplateSequenceEntry {
  slug: string;
  number: number;
  code: string;
  cleanTitle: string;
  badge: string;
  sourceFile: string;
}

/**
 * Canonical 1..10 sequential numbering for the user-provided interactive templates.
 * Note: filenames start at thiep-3.html (thiep-1/2 were not provided), followed by
 * thiep-4..thiep-10, thiep-giang-sinh, and thiep-xmas.
 */
export const USER_TEMPLATE_SEQUENCE: readonly UserTemplateSequenceEntry[] = [
  {
    slug: "thiep-3",
    number: 1,
    code: "#01",
    cleanTitle: "Một Tấm Vé Hẹn Hò ♡",
    badge: "Mẫu #01 · Vé Hẹn Hò",
    sourceFile: "public/templates/thiep-3.html",
  },
  {
    slug: "thiep-4",
    number: 2,
    code: "#02",
    cleanTitle: "Gửi Em Một Vũ Trụ ✨",
    badge: "Mẫu #02 · Vũ Trụ 7 Cảnh",
    sourceFile: "public/templates/thiep-4.html",
  },
  {
    slug: "thiep-5",
    number: 3,
    code: "#03",
    cleanTitle: "Khu Vườn Kỷ Niệm – Phong Thư Tình Yêu 🌸",
    badge: "Mẫu #03 · Khóa PIN & 3D",
    sourceFile: "public/templates/thiep-5.html",
  },
  {
    slug: "thiep-6",
    number: 4,
    code: "#04",
    cleanTitle: "Mùa Thu Kỷ Niệm – Bức Thư Giữa Mùa Lá Rụng 🍁",
    badge: "Mẫu #04 · Mùa Thu Lá Phong",
    sourceFile: "public/templates/thiep-6.html",
  },
  {
    slug: "thiep-7",
    number: 5,
    code: "#05",
    cleanTitle: "Đại Dương Tình Yêu & Ánh Sáng Biển Sâu 🌊",
    badge: "Mẫu #05 · Thư Trong Chai",
    sourceFile: "public/templates/thiep-7.html",
  },
  {
    slug: "thiep-8",
    number: 6,
    code: "#06",
    cleanTitle: "Vũ Trụ Trái Tim & Bì Thư 3D 💖",
    badge: "Mẫu #06 · Tim Particle 3D",
    sourceFile: "public/templates/thiep-8.html",
  },
  {
    slug: "thiep-9",
    number: 7,
    code: "#07",
    cleanTitle: "Vũ Điệu Cực Quang & Trái Tim Pha Lê 3D 🌌",
    badge: "Mẫu #07 · Cực Quang 3D",
    sourceFile: "public/templates/thiep-9.html",
  },
  {
    slug: "thiep-10",
    number: 8,
    code: "#08",
    cleanTitle: "Boarding Pass – Chuyến Bay Hạnh Phúc ✈️",
    badge: "Mẫu #08 · Boarding Pass",
    sourceFile: "public/templates/thiep-10.html",
  },
  {
    slug: "thiep-giang-sinh",
    number: 9,
    code: "#09",
    cleanTitle: "Thiệp Giáng Sinh – Đêm Noel Diệu Kỳ 🎄",
    badge: "Mẫu #09 · Noel Lung Linh",
    sourceFile: "public/templates/thiep-giang-sinh.html",
  },
  {
    slug: "thiep-xmas",
    number: 10,
    code: "#10",
    cleanTitle: "Christmas Special – Hộp Quà Giáng Sinh Lung Linh 🎅",
    badge: "Mẫu #10 · Christmas 3D",
    sourceFile: "public/templates/thiep-xmas.html",
  },
];

const USER_SEQUENCE_BY_SLUG = new Map(
  USER_TEMPLATE_SEQUENCE.map((item) => [item.slug, item])
);

// Enrich registry entries uniformly from the canonical sequence table.
for (const [slug, meta] of Object.entries(TEMPLATES_REGISTRY)) {
  const userEntry = USER_SEQUENCE_BY_SLUG.get(slug);
  if (userEntry) {
    meta.displayOrder = userEntry.number;
    meta.numberCode = userEntry.code;
    meta.defaultHidden = false;
    meta.sourceFile = userEntry.sourceFile;
    meta.title = `${userEntry.code} · ${userEntry.cleanTitle}`;
    meta.badge = userEntry.badge;
  } else {
    meta.defaultHidden = true;
    meta.sourceFile = "React Built-in Component";
  }
}

export const DEFAULT_TEMPLATE_SLUG = "thiep-8";

export function isTemplateVisible(
  tpl: TemplateMeta,
  visibilityOverrides?: Record<string, boolean>
): boolean {
  if (visibilityOverrides && Object.prototype.hasOwnProperty.call(visibilityOverrides, tpl.slug)) {
    return Boolean(visibilityOverrides[tpl.slug]);
  }
  return !tpl.defaultHidden;
}

export function getVisibleTemplates(
  visibilityOverrides?: Record<string, boolean>
): TemplateMeta[] {
  return Object.values(TEMPLATES_REGISTRY)
    .filter((tpl) => isTemplateVisible(tpl, visibilityOverrides))
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
}

export function getAllTemplatesOrdered(): TemplateMeta[] {
  return Object.values(TEMPLATES_REGISTRY).sort(
    (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  );
}

export function getTemplateDemoContent(slug: string): InvitationContent {
  const meta = TEMPLATES_REGISTRY[slug] || TEMPLATES_REGISTRY[DEFAULT_TEMPLATE_SLUG];

  switch (slug) {
    case "wedding-classic":
      return {
        schemaVersion: 1,
        occasionKey: "wedding",
        locale: "vi-VN",
        title: "Lễ Thành Hôn: Hoàng Long & Minh Thư",
        subtitle: "Hành trình yêu thương bước sang trang mới",
        people: [
          { role: "groom", displayName: "Hoàng Long" },
          { role: "bride", displayName: "Minh Thư" },
        ],
        event: {
          startsAt: "2027-10-18T10:30:00+07:00",
          endsAt: "2027-10-18T14:00:00+07:00",
          timezone: "Asia/Ho_Chi_Minh",
          venueName: "Trung tâm Hội nghị The Adora Center",
          address: "431 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP.HCM",
          mapsUrl: "https://maps.google.com",
        },
        message: "Hạnh phúc lớn nhất là khi tình yêu tìm được bến đỗ bình yên. Trân trọng kính mời bạn và người thương đến chung vui cùng gia đình chúng mình!",
        coverImageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: {
          rsvp: true,
          guestbook: true,
          backgroundMusicUrl: null,
          giftTransferInfo: {
            enabled: true,
            bankName: "Techcombank",
            accountNumber: "1903686868888",
            accountHolder: "HOANG LONG & MINH THU",
          },
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "wedding-floral":
      return {
        schemaVersion: 1,
        occasionKey: "wedding",
        locale: "vi-VN",
        title: "Save our Date: Quốc Bảo & Thanh Hương",
        subtitle: "Gặp gỡ là duyên, ở bên nhau là định mệnh",
        people: [
          { role: "groom", displayName: "Quốc Bảo" },
          { role: "bride", displayName: "Thanh Hương" },
        ],
        event: {
          startsAt: "2027-11-20T17:30:00+07:00",
          endsAt: "2027-11-20T21:30:00+07:00",
          timezone: "Asia/Ho_Chi_Minh",
          venueName: "Gem Center — Grand Ballroom",
          address: "8 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP.HCM",
          mapsUrl: "https://maps.google.com",
        },
        message: "Chúng mình sắp về chung một nhà. Hãy cùng lưu giữ khoảnh khắc ngọt ngào này bên hoa tươi và những lời chúc tốt lành nhất.",
        coverImageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: true, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "graduation-classic":
      return {
        schemaVersion: 1,
        occasionKey: "graduation",
        locale: "vi-VN",
        title: "Lễ Tốt Nghiệp Bác Sĩ: Minh Khang",
        subtitle: "Khép lại 6 năm giảng đường — Khởi đầu hành trình cứu người",
        people: [{ role: "graduate", displayName: "Lê Minh Khang" }],
        event: {
          startsAt: "2027-06-28T08:00:00+07:00",
          endsAt: "2027-06-28T11:30:00+07:00",
          timezone: "Asia/Ho_Chi_Minh",
          venueName: "Hội trường Lớn — ĐH Y Dược TP.HCM",
          address: "217 Hồng Bàng, Phường 11, Quận 5, TP.HCM",
          mapsUrl: "https://maps.google.com",
        },
        message: "Chặng đường đại học đầy thử thách đã đi đến ngày hái quả ngọt. Sự hiện diện và lời chúc của bạn sẽ là món quà vô giá tiếp sức cho Khang!",
        coverImageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: true, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "graduation-playful":
      return {
        schemaVersion: 1,
        occasionKey: "graduation",
        locale: "vi-VN",
        title: "Graduation Party: Chúng Ta Tốt Nghiệp Rồi!",
        subtitle: "Tạm biệt áo trắng, tạm biệt những buổi trốn học cùng nhau",
        people: [{ role: "graduate", displayName: "Tập thể 12A1 K65" }],
        event: {
          startsAt: "2027-07-05T18:00:00+07:00",
          endsAt: "2027-07-05T22:00:00+07:00",
          timezone: "Asia/Ho_Chi_Minh",
          venueName: "Vườn Bia Kỷ Niệm Rooftop",
          address: "99 Điện Biên Phủ, Bình Thạnh, TP.HCM",
          mapsUrl: "https://maps.google.com",
        },
        message: "Tiệc quẩy chia tay thanh xuân, có đồ ăn ngon, bia lạnh và một bầu trời kỷ niệm không bao giờ phai. Đừng vắng mặt nhé!",
        coverImageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: true },
        responseQuestion: {
          question: "Bạn sẽ đến đúng giờ chứ?",
          options: ["Chắc chắn có mặt!", "Đang bận nhưng sẽ cố gắng", "Bận việc gia đình mất rồi"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "birthday-fun":
      return {
        schemaVersion: 1,
        occasionKey: "birthday",
        locale: "vi-VN",
        title: "Tiệc Sinh Nhật Tuổi 20 Của Bảo Ngọc",
        subtitle: "Chào tuổi 20 rực rỡ và tràn đầy ước mơ",
        people: [{ role: "celebrant", displayName: "Bảo Ngọc" }],
        event: {
          startsAt: "2027-09-15T18:30:00+07:00",
          endsAt: "2027-09-15T22:00:00+07:00",
          timezone: "Asia/Ho_Chi_Minh",
          venueName: "The Pink Cafe & Bistro",
          address: "52 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM",
          mapsUrl: "https://maps.google.com",
        },
        message: "Cùng Ngọc thổi nến, cắt bánh sinh nhật và chụp những bức hình thật dễ thương nhé! Dress code: Hồng hoặc Trắng nha.",
        coverImageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: true, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "birthday-minimal":
      return {
        schemaVersion: 1,
        occasionKey: "birthday",
        locale: "vi-VN",
        title: "Dinner & Wine: Mừng Sinh Nhật Tuấn Anh",
        subtitle: "Một buổi tối nhẹ nhàng bên những người bạn tri kỷ",
        people: [{ role: "celebrant", displayName: "Tuấn Anh" }],
        event: {
          startsAt: "2027-08-10T19:00:00+07:00",
          endsAt: "2027-08-10T22:30:00+07:00",
          timezone: "Asia/Ho_Chi_Minh",
          venueName: "Le Corto Restaurant",
          address: "5D Nguyễn Siêu, Bến Nghé, Quận 1, TP.HCM",
          mapsUrl: "https://maps.google.com",
        },
        message: "Thêm một tuổi mới bình an và trưởng thành. Mời bạn ghé dùng bữa tối ấm cúng và thưởng thức ly vang ngon cùng Tuấn Anh.",
        coverImageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: true },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "love-letter":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Gửi Đến Em — Điều Anh Chưa Từng Nói",
        subtitle: "Mở phong thư bí mật dành riêng cho người đặc biệt",
        people: [
          { role: "sender", displayName: "Một người thương thầm" },
          { role: "recipient", displayName: "Thuỳ Dương" },
        ],
        message: "Có những cảm xúc giấu kín bấy lâu nay. Cảm ơn em đã xuất hiện và làm thế giới của anh trở nên rạng ngời. Liệu cuối tuần này, anh có thể mời em một tách trà chiều không?",
        coverImageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [
          "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Em có muốn đi cà phê cùng anh không?",
          options: ["Anh qua đón em nhé! ✨", "Để em suy nghĩ thêm một chút nha", "Chúng mình làm bạn thôi nhé"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "love-galaxy":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Kỷ Niệm 365 Ngày Bên Nhau: Nam & Hà",
        subtitle: "Giữa hàng tỷ vì sao, anh may mắn nhất vì đã tìm thấy em",
        people: [
          { role: "partner1", displayName: "Hải Nam" },
          { role: "partner2", displayName: "Ngọc Hà" },
        ],
        message: "Một năm trôi qua với biết bao tiếng cười và cả những lúc giận hờn. Cảm ơn vì em luôn ở đó, cùng anh viết nên câu chuyện đẹp nhất đời mình.",
        loveMessages: [
          "Em là điều tuyệt vời nhất",
          "Nụ cười của em là nắng",
          "Anh nhớ em",
          "Thương em hơn hôm qua",
        ],
        coverImageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [
          "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
        ],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false, backgroundMusicUrl: "/audio/sample-love.mp3" },
        responseQuestion: {
          question: "Năm sau vẫn nắm tay anh đi khắp thế gian chứ?",
          options: ["Mãi mãi bên anh! 💖", "Tất nhiên rồi chàng trai ngốc!"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-3":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Một Tấm Vé Hẹn Hò ♡",
        subtitle: "Một chiếc hẹn dành riêng cho em",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Vì nụ cười của em luôn làm cả ngày của anh bừng sáng, và anh mong chúng mình sẽ cùng có thêm thật nhiều kỷ niệm ngọt ngào bên nhau 🥰 📷",
        coverImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Em đi hẹn hò với anh nhé?",
          options: ["Dạ đồng ý nè! ♡", "Để em suy nghĩ xíu..."],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-4":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Gửi Em Một Vũ Trụ ✨",
        subtitle: "Giữa hàng triệu vì sao, anh có điều muốn gửi em",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Anh muốn cùng em đi qua những ngày rực rỡ, và cả những ngày bình dị chẳng có gì đặc biệt. Cùng thưởng thức món ngon, kể nhau nghe những chuyện vụn vặt, rồi thấy một ngày trôi qua thật dịu dàng.",
        coverImageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Cho anh được ở trong vũ trụ của em nhé?",
          options: ["Đồng ý, cho anh một chỗ ❤️", "Hổng cho đâu 😜"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-5":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Khu Vườn Kỷ Niệm – Phong Thư Tình Yêu",
        subtitle: "Mỗi bông hoa trong khu vườn nhỏ này đều nở rộ vì em",
        people: [
          { role: "sender", displayName: "Anh iu" },
          { role: "recipient", displayName: "Bé ngốc" },
        ],
        message: "Mỗi bông hoa trong khu vườn nhỏ này đều nở rộ vì em — vì sự dịu dàng, vì ánh mắt nụ cười, và vì từng khoảnh khắc bình yên tuyệt vời nhất mà mình đã cùng nhau đi qua.",
        coverImageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-6":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Mùa Thu Kỷ Niệm – Bức Thư Giữa Mùa Lá Rụng",
        subtitle: "Lá phong đỏ vàng, sáp niêm phong & Hoài niệm ấm áp",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Gió heo may thổi về mang theo hương thu dịu mát, và hình bóng của em luôn ngập tràn trong tâm trí anh. Cảm ơn em vì đã đến bên anh trong mùa thu này.",
        coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-7":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Đại Dương Tình Yêu & Ánh Sáng Biển Sâu",
        subtitle: "Lặn sâu vào đại dương xanh thẳm cùng bức thư trong chai",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Đại dương ngoài kia mênh mông sâu thẳm, nhưng nơi bình yên nhất luôn là bên cạnh em. Gom đủ 5 viên ngọc trái tim để mở ra hải trình tình yêu vĩnh cửu.",
        coverImageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Cùng anh đi tới tận cùng đại dương nhé?",
          options: ["Em đồng ý! 🌊", "Bơi né dolphin 🐬"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-8":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Vũ Trụ Trái Tim & Bì Thư 3D",
        subtitle: "Trái tim particle 3D có chiều sâu & Phong thư mở nắp",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Vũ trụ sao hạt lung linh, trái tim particle 3D có độ sâu, vòng chữ và ảnh quay quỹ đạo. Xuyên tim flash hồng đón phong thư mở nắp, hé lộ bức tâm thư dành riêng cho em.",
        coverImageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-9":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Vũ Điệu Cực Quang & Trái Tim Pha Lê 3D",
        subtitle: "Bầu trời đêm Bắc Cực ngập tràn ánh sáng Aurora Borealis",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Người ta thường bảo ai may mắn nhìn thấy dải cực quang sẽ có được hạnh phúc trọn đời. Nhưng với anh, khoảnh khắc kỳ diệu nhất là khi được gặp em và cùng em nắm tay đi qua những ngày tháng bình yên.",
        coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-10":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Boarding Pass: Chuyến Bay Hạnh Phúc",
        subtitle: "First Class Boarding Pass LV-520 đến trái tim em",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Vậy là đã chốt lịch trình bay rồi nha! Anh sẽ đón em đúng giờ, em chỉ cần chuẩn bị một nụ cười thật xinh là được ❤️",
        coverImageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Sẵn sàng lên chuyến bay hạnh phúc cùng anh chưa?",
          options: ["Em sẵn sàng rồi! ✈️", "Để em suy nghĩ xíu..."],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-giang-sinh":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Thiệp Giáng Sinh – Đêm Noel Diệu Kỳ",
        subtitle: "Tuyết rơi 3D, dây đèn lung linh & Hộp quà nơ vàng",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Giáng Sinh này thật trọn vẹn và diệu kỳ vì có em bên cạnh. Chúc cho cô gái của anh luôn nở nụ cười thật tươi, luôn bình yên và rạng rỡ. Dù ngoài trời có lạnh giá, anh hứa sẽ luôn là chiếc khăn len ấm áp bên em.",
        coverImageUrl: "https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Giáng sinh này cùng anh đi dạo phố nhé?",
          options: ["Chắc chắn rồi anh yêu! 🎄", "Chờ em chọn đồ xinh nha!"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    case "thiep-xmas":
      return {
        schemaVersion: 1,
        occasionKey: "love",
        locale: "vi-VN",
        title: "Christmas Special – Hộp Quà Giáng Sinh Lung Linh",
        subtitle: "Món quà Giáng Sinh 3D ngọt ngào dành riêng cho người thương",
        people: [
          { role: "sender", displayName: "Anh" },
          { role: "recipient", displayName: "Em" },
        ],
        message: "Phiên bản hộp quà Giáng Sinh 3D lộng lẫy, mở nơ quà bung nắp bất ngờ với pháo tuyết rực rỡ và bưu thiếp Bắc Cực độc bản trao gửi yêu thương.",
        coverImageUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1200&q=80",
        galleryUrls: [],
        privacy: { mode: "UNLISTED", allowIndexing: false },
        features: { rsvp: false, guestbook: false },
        responseQuestion: {
          question: "Mở nơ hộp quà bí mật đêm Noel chưa nè?",
          options: ["Mở ngay thôi! 🎁", "Hồi hộp quá đi à!"],
        },
        blocks: meta.blocks.map((type, i) => ({ id: `blk_${i}`, type: type as any, enabled: true })),
      };

    default:
      return getTemplateDemoContent(DEFAULT_TEMPLATE_SLUG);
  }
}

