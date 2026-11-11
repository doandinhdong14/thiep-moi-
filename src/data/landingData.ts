import {
  CATALOG_PRODUCTS,
  CatalogProduct,
  resolveTemplatePreviewImage,
  TEST_PRODUCT_PRICE_VND,
} from "./catalogData";
import type { TemplateMeta } from "@/lib/templates/registry";

export interface SiteConfig {
  brandName: string;
  tagline: string;
  supportEmail: string;
  hotline: string;
  ownerLegalName: string;
  socialLinks: {
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  posterUrl?: string;
  title: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface ProductItem {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  previewImage?: string;
  previewVideo?: string;
  priceVnd: number;
  compareAtPriceVnd?: number;
  demoUrl?: string;
  guideUrl?: string;
  videoGuideUrl?: string;
  category?: string;
  badge?: string;
  numberCode?: string;
  displayOrder?: number;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
  avatarUrl: string;
  tag: string;
}

export interface TrustBenefitItem {
  id: string;
  title: string;
  description: string;
}

export interface CommunityIdeaItem {
  id: string;
  title: string;
  author: string;
  votes: number;
  category: string;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const siteConfig: SiteConfig = {
  brandName: "Ding Dong Gift",
  tagline: "Nền tảng thiệp mời tương tác & Mini Website tinh tế",
  supportEmail: "hotro@dingdonggift.vn",
  hotline: "1900 8888",
  ownerLegalName: "Ding Dong Gift Interactive Media Ltd.",
  socialLinks: {
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
    youtube: "https://youtube.com",
  },
};

export const heroSlides: HeroSlide[] = [
  {
    id: "slide-1",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1920&q=80",
    posterUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1920&q=80",
    title: "TẠO THIỆP MỜI & MINI WEBSITE",
    tagline: "Cho Mọi Khoảnh Khắc Hạnh Phúc & Ý Nghĩa",
    description: "Tạo thiệp cưới, sinh nhật, kỷ niệm và tỏ tình với hiệu ứng mở phong bì tương tác, bản đồ chỉ đường, đếm ngược và RSVP trực tuyến.",
    ctaLabel: "TẠO NGAY",
    ctaHref: "/create",
  },
  {
    id: "slide-2",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    posterUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    title: "BỘ SƯU TẬP THIỆP CƯỚI 2026",
    tagline: "Trang Trọng - Tinh Tế - Hiện Đại",
    description: "Lưu giữ câu chuyện tình yêu, nhận lời chúc phúc và theo dõi khách mời thông minh ngay trên điện thoại.",
    ctaLabel: "XEM MẪU THIỆP",
    ctaHref: "/templates",
  },
  {
    id: "slide-3",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1920&q=80",
    posterUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1920&q=80",
    title: "SINH NHẬT & TIỆC KỶ NIỆM",
    tagline: "Pháo Hoa Rực Rỡ & Bất Ngờ Ngọt Ngào",
    description: "Tạo bất ngờ cho người thân với thiệp mời sinh nhật sinh động, âm nhạc tự chọn và mã QR in thiệp vật lý.",
    ctaLabel: "KHÁM PHÁ NGAY",
    ctaHref: "/products",
  },
  {
    id: "slide-4",
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1920&q=80",
    posterUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1920&q=80",
    title: "TỎ TÌNH & MÃ QR TÌNH YÊU 3D",
    tagline: "Trao Gửi Lời Yêu Chân Thành Nhất",
    description: "Trang tỏ tình bí mật kèm phong thư cảm xúc, trái tim 3D và lời hứa cho ngày kỷ niệm.",
    ctaLabel: "TẠO THIỆP TỎ TÌNH",
    ctaHref: "/products?category=hen-ho",
  },
];

export function catalogProductToProductItem(item: CatalogProduct): ProductItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    coverUrl: item.coverImage,
    previewImage: item.previewImage || resolveTemplatePreviewImage(item.slug, item.demoUrl),
    previewVideo: item.previewVideo,
    priceVnd: item.price,
    compareAtPriceVnd: item.compareAtPrice,
    demoUrl: item.demoUrl,
    guideUrl: item.guideUrl,
    videoGuideUrl: item.videoGuideUrl,
    category: item.category,
    badge: item.badge,
    numberCode: item.numberCode,
    displayOrder: item.displayOrder,
  };
}

export function templateMetaToProductItem(tpl: TemplateMeta): ProductItem {
  return {
    id: `tpl-${tpl.slug}`,
    slug: tpl.slug,
    title: tpl.title,
    coverUrl: "",
    previewImage: resolveTemplatePreviewImage(tpl.slug),
    priceVnd: TEST_PRODUCT_PRICE_VND,
    demoUrl: `/templates/${tpl.slug}`,
    category: tpl.occasionTitle,
    badge: tpl.isPremium ? "PREMIUM" : tpl.badge,
    numberCode: tpl.numberCode,
    displayOrder: tpl.displayOrder,
  };
}

const CORE_LANDING_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    slug: "wedding-classic",
    title: "Thiệp Cưới Hoàng Gia Ivory Gold",
    coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/wedding-classic.webp",
    priceVnd: 49000,
    compareAtPriceVnd: 99000,
    demoUrl: "/templates/wedding-classic",
    guideUrl: "/occasions/wedding-ceremony",
    videoGuideUrl: "https://youtube.com",
    category: "Cưới & Đính hôn",
  },
  {
    id: "prod-2",
    slug: "wedding-floral",
    title: "Bloom & Vows — Lãng Mạn Hoa Pastel",
    coverUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/wedding-floral.webp",
    priceVnd: 49000,
    compareAtPriceVnd: 89000,
    demoUrl: "/templates/wedding-floral",
    guideUrl: "/occasions/wedding-ceremony",
    videoGuideUrl: "https://youtube.com",
    category: "Cưới & Đính hôn",
  },
  {
    id: "prod-3",
    slug: "love-letter",
    title: "Secret Letter — Thư Tay Phong Bì Ảo",
    coverUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/love-letter.webp",
    priceVnd: 39000,
    compareAtPriceVnd: 69000,
    demoUrl: "/templates/love-letter",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    category: "Tình yêu & Tỏ tình",
  },
  {
    id: "prod-4",
    slug: "love-galaxy",
    title: "Vũ trụ yêu thương - Mưa Lời Yêu Thương",
    coverUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/love-galaxy.webp",
    priceVnd: 0,
    compareAtPriceVnd: 49000,
    demoUrl: "/templates/love-galaxy",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    category: "Tình yêu & Tỏ tình",
  },
  {
    id: "prod-5",
    slug: "birthday-fun",
    title: "Confetti Pop — Sinh Nhật Rộn Rã Niềm Vui",
    coverUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/birthday-fun.webp",
    priceVnd: 39000,
    compareAtPriceVnd: 79000,
    demoUrl: "/templates/birthday-fun",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    category: "Sinh nhật",
  },
  {
    id: "prod-6",
    slug: "birthday-minimal",
    title: "Candlelight — Ấm Cúng & Tối Giản",
    coverUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/birthday-minimal.webp",
    priceVnd: 49000,
    compareAtPriceVnd: 89000,
    demoUrl: "/templates/birthday-minimal",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    category: "Sinh nhật",
  },
  {
    id: "prod-7",
    slug: "graduation-classic",
    title: "The Next Chapter — Lễ Tốt Nghiệp Trang Trọng",
    coverUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/graduation-classic.webp",
    priceVnd: 39000,
    compareAtPriceVnd: 69000,
    demoUrl: "/templates/graduation-classic",
    guideUrl: "/occasions/university-graduation",
    videoGuideUrl: "https://youtube.com",
    category: "Tốt nghiệp",
  },
  {
    id: "prod-8",
    slug: "graduation-playful",
    title: "Grad Party! — Tươi Trẻ & Pháo Giấy Rực Rỡ",
    coverUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80",
    previewImage: "/previews/graduation-playful.webp",
    priceVnd: 39000,
    compareAtPriceVnd: 69000,
    demoUrl: "/templates/graduation-playful",
    guideUrl: "/occasions/university-graduation",
    videoGuideUrl: "https://youtube.com",
    category: "Tốt nghiệp",
  },
];

export const productList: ProductItem[] = CATALOG_PRODUCTS.map((item) => ({
  ...catalogProductToProductItem(item),
  priceVnd: TEST_PRODUCT_PRICE_VND,
}));

export const topicChips: { label: string; href: string }[] = [
  { label: "#01 Vé hẹn hò", href: "/templates/thiep-3" },
  { label: "#02 Gửi em vũ trụ", href: "/templates/thiep-4" },
  { label: "#03 Khu vườn khóa PIN", href: "/templates/thiep-5" },
  { label: "#05 Đại dương tình yêu", href: "/templates/thiep-7" },
  { label: "#06 Trái tim 3D", href: "/templates/thiep-8" },
  { label: "#07 Cực quang pha lê", href: "/templates/thiep-9" },
  { label: "#08 Vé máy bay", href: "/templates/thiep-10" },
  { label: "#09 & #10 Giáng sinh", href: "/templates/thiep-xmas" },
];

export const testimonialsList: TestimonialItem[] = [
  {
    id: "test-1",
    quote: "Mẫu vé hẹn hò #01 và trái tim 3D #06 giúp mình tạo món quà kỷ niệm cực ấn tượng — người nhận mở link quét QR bất ngờ vô cùng!",
    author: "Hoàng Long & Minh Thư",
    role: "Cặp đôi kỷ niệm 1 năm",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    tag: "#01 · Một Tấm Vé Hẹn Hò",
  },
  {
    id: "test-2",
    quote: "Mình dùng mẫu #03 Khu Vườn Kỷ Niệm có khóa PIN bí mật để gửi lời chúc, thêm ảnh và nhạc nền rất cảm xúc!",
    author: "Quốc Bảo & Thu Hà",
    role: "Cặp đôi kỷ niệm 100 ngày",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    tag: "#03 · Khu Vườn Khóa PIN",
  },
  {
    id: "test-3",
    quote: "Sau khi chuyển khoản nhận ngay link copy và mã QR trang trí hoa cực xinh, quét ra thiệp sạch đẹp không hề có quảng cáo.",
    author: "Chị Ngọc Mai",
    role: "Khách hàng thân thiết",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    tag: "#06 · Vũ Trụ Trái Tim 3D",
  },
  {
    id: "test-4",
    quote: "Mẫu Boarding Pass #08 ghi tên hai đứa và chặng bay kỷ niệm nhìn cực kỳ xịn, thao tác chỉ 3 phút là xong!",
    author: "Thanh Tùng",
    role: "Tạo thiệp tặng bạn gái",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    tag: "#08 · Boarding Pass Hạnh Phúc",
  },
];

export const trustBenefits: TrustBenefitItem[] = [
  {
    id: "trust-1",
    title: "Thanh toán an toàn & Nhanh chóng",
    description: "Hỗ trợ quét mã VietQR tự động kích hoạt ngay lập tức, bảo mật chuẩn SSL và bảo vệ dữ liệu người dùng tuyệt đối.",
  },
  {
    id: "trust-2",
    title: "Hơn 10.000+ Khách hàng tin tưởng",
    description: "Được các cặp đôi, gia đình và trường lớp tin chọn tạo nên những cột mốc thiệp mời trọn vẹn và đáng nhớ nhất.",
  },
  {
    id: "trust-3",
    title: "Hỗ trợ khách hàng tận tâm 24/7",
    description: "Đội ngũ kỹ thuật và thiết kế luôn đồng hành, hỗ trợ chỉnh sửa bố cục, âm nhạc và giải đáp mọi yêu cầu của bạn.",
  },
];

export const trustCollageImages = [
  {
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    alt: "Cặp đôi hạnh phúc trong ngày cưới",
    className: "w-[260px] h-[340px] sm:w-[280px] sm:h-[370px] rounded-[16px] shadow-2xl object-cover -rotate-3 border-4 border-white transition-transform hover:rotate-0 duration-300",
  },
  {
    url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
    alt: "Lời hẹn ước chân thành",
    className: "w-[240px] h-[300px] sm:w-[260px] sm:h-[330px] rounded-[16px] shadow-2xl object-cover rotate-4 border-4 border-white -mt-16 sm:-mt-20 ml-auto transition-transform hover:rotate-0 duration-300",
  },
  {
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    alt: "Khoảnh khắc trao nhẫn ngọt ngào",
    className: "w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] rounded-[16px] shadow-2xl object-cover -rotate-6 border-4 border-white -mt-24 sm:-mt-28 ml-10 transition-transform hover:rotate-0 duration-300",
  },
];

export const communityIdeasSample: CommunityIdeaItem[] = [
  {
    id: "idea-1",
    title: "Hiệu ứng tuyết rơi & pháo hoa tương tác khi chạm màn hình",
    author: "minhchau***@gmail.com",
    votes: 142,
    category: "Hiệu ứng",
    createdAt: "Hôm qua",
  },
  {
    id: "idea-2",
    title: "Tích hợp danh sách phát nhạc Spotify/Apple Music tùy chọn",
    author: "ducviet***@yahoo.com",
    votes: 98,
    category: "Âm nhạc",
    createdAt: "2 ngày trước",
  },
  {
    id: "idea-3",
    title: "Mã QR mừng cưới thông minh hiển thị số tiền gợi ý và lời chúc tự động",
    author: "thanhnga***@gmail.com",
    votes: 215,
    category: "Thanh toán",
    createdAt: "3 ngày trước",
  },
  {
    id: "idea-4",
    title: "Xuất file video ngắn 15s Story / TikTok để đăng mạng xã hội",
    author: "hoangnam***@outlook.com",
    votes: 180,
    category: "Chia sẻ",
    createdAt: "5 ngày trước",
  },
];

export const faqList: FaqItem[] = [
  {
    id: "faq-1",
    question: "Ding Dong Gift là gì?",
    answer: "Ding Dong Gift là nền tảng trực tuyến giúp bạn tự tay thiết kế và xuất bản thiệp mời thông minh, mini website tương tác cho các dịp như đám cưới, sinh nhật, thôi nôi, lễ tốt nghiệp hoặc tỏ tình lãng mạn. Bạn có thể gửi thiệp qua đường dẫn cá nhân hóa, mã QR in thiệp, hoặc xuất ảnh/PDF chất lượng cao.",
  },
  {
    id: "faq-2",
    question: "Tôi phải trả bao nhiêu tiền để tạo một món quà / thiệp?",
    answer: "Bạn có thể bắt đầu tạo và trải nghiệm hoàn toàn miễn phí. Với các mẫu thiệp cơ bản, bạn có thể xuất bản với chi phí chỉ từ 39.000 – 49.000 VNĐ cho thời hạn lưu trữ lâu dài, không giới hạn lượt xem và lượt gửi.",
  },
  {
    id: "faq-3",
    question: "Làm thế nào để tùy chỉnh món quà / thiệp?",
    answer: "Rất đơn giản! Bạn chỉ cần chọn mẫu thiệp yêu thích, tải ảnh kỷ niệm của bạn lên, chỉnh sửa họ tên, thời gian, địa điểm sự kiện (kèm link Google Maps), chọn bản nhạc nền êm ái và nhấn Xem trước. Hệ thống hiển thị trực quan theo thời gian thực đúng như khi khách mở thiệp.",
  },
  {
    id: "faq-4",
    question: "Tôi có thể chia sẻ món quà / thiệp như thế nào?",
    answer: "Sau khi xuất bản, bạn nhận được: (1) Đường link trực tiếp ngắn gọn để gửi qua Zalo, Messenger, SMS; (2) Mã QR độ nét cao để in lên phong bì giấy hoặc đặt tại bàn tiệc; (3) File ảnh tóm tắt để đăng story/mạng xã hội.",
  },
  {
    id: "faq-5",
    question: "Món quà / thiệp có hoạt động trên mọi thiết bị không?",
    answer: "Có! Thiệp mời Ding Dong Gift được tối ưu hóa chuẩn hiển thị trên 100% thiết bị: điện thoại iPhone, Android, máy tính bảng iPad và máy tính để bàn. Tốc độ tải siêu nhanh và tự động căn chỉnh tỷ lệ màn hình mượt mà.",
  },
  {
    id: "faq-6",
    question: "Tôi có thể thanh toán bằng cách nào?",
    answer: "Ding Dong Gift hỗ trợ thanh toán tự động qua mã VietQR của tất cả các ngân hàng tại Việt Nam (Vietcombank, Techcombank, MB Bank, v.v.) và các ví điện tử phổ biến như MoMo, ZaloPay. Đơn hàng được kích hoạt ngay lập tức trong vòng 30 giây sau khi chuyển khoản thành công.",
  },
];

