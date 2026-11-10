export interface CatalogProduct {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  categorySlug: string;
  demoUrl: string;
  guideUrl?: string;
  videoGuideUrl?: string;
  available?: boolean;
  description: string;
  specs: {
    design: string;
    interaction: string;
    sharing: string;
    compatibility: string;
  };
}

export interface CatalogCategory {
  id: string;
  slug: string;
  title: string;
  iconName: string;
  count?: number;
}

export interface CollectionItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  iconName: string;
  productCount: number;
  categorySlug: string;
}

export interface VoucherCampaign {
  campaignId: string;
  title: string;
  code: string;
  discountDisplay: string;
  discountPercent: number;
  validUntil: string;
  task1: {
    title: string;
    requirements: string[];
  };
  task2: {
    title: string;
    requirements: string[];
  };
  videoCaption: string;
  hashtags: string[];
  redemptionSteps: string[];
  tiktokUrl: string;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: "all", slug: "all", title: "Tất cả", iconName: "LayoutGrid" },
  { id: "birthday", slug: "sinh-nhat", title: "Sinh nhật", iconName: "Cake" },
  { id: "mid-autumn", slug: "trung-thu", title: "Trung thu", iconName: "Moon" },
  { id: "dating", slug: "hen-ho", title: "Hẹn hò", iconName: "HeartHandshake" },
  { id: "anniversary", slug: "ky-niem", title: "Kỷ niệm", iconName: "Sparkles" },
  { id: "valentine", slug: "valentine", title: "Valentine", iconName: "Heart" },
  { id: "women-march", slug: "qua-8-3", title: "Quà 8/3", iconName: "Gift" },
  { id: "women-oct", slug: "qua-20-10", title: "Quà 20/10", iconName: "Flower2" },
  { id: "wedding", slug: "cuoi-dinh-hon", title: "Cưới & Đính hôn", iconName: "Crown" },
  { id: "graduation", slug: "tot-nghiep", title: "Tốt nghiệp", iconName: "GraduationCap" },
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  // Cưới & Đính hôn
  {
    id: "prod-1",
    slug: "wedding-classic",
    title: "Thiệp Cưới Hoàng Gia Ivory Gold",
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    price: 49000,
    compareAtPrice: 99000,
    category: "Cưới & Đính hôn",
    categorySlug: "cuoi-dinh-hon",
    demoUrl: "/templates/wedding-classic",
    guideUrl: "/occasions/wedding-ceremony",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Tông kem - vàng champagne trang nhã, phong bì ảo hoàng gia, đếm ngược ngày cưới và hệ thống RSVP trực tuyến.",
    specs: {
      design: "Tông kem - vàng champagne hoàng gia, viền vàng kim tuyến",
      interaction: "Mở phong bì 3D, âm nhạc du dương, đếm ngược ngày chung đôi",
      sharing: "Gửi link Zalo/Messenger & in mã QR lên thiệp cưới giấy",
      compatibility: "Tối ưu 100% trên iPhone, Android và máy tính",
    },
  },
  {
    id: "prod-2",
    slug: "wedding-floral",
    title: "Bloom & Vows — Lãng Mạn Hoa Pastel",
    coverImage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
    price: 49000,
    compareAtPrice: 89000,
    category: "Cưới & Đính hôn",
    categorySlug: "cuoi-dinh-hon",
    demoUrl: "/templates/wedding-floral",
    guideUrl: "/occasions/wedding-ceremony",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Hoa pastel thanh lịch, lãng mạn nhẹ nhàng, bố cục dạng tạp chí hiện đại cho ngày cưới hạnh phúc.",
    specs: {
      design: "Bố cục tạp chí phong cách Châu Âu kết hợp hoa hồng pastel",
      interaction: "Album ảnh cưới tương tác, bản đồ chỉ đường lễ thành hôn",
      sharing: "Chia sẻ tức thì qua link ngắn hoặc quét mã QR",
      compatibility: "Hiển thị sắc nét trên mọi kích thước màn hình",
    },
  },

  // Sinh nhật
  {
    id: "prod-5",
    slug: "birthday-fun",
    title: "Confetti Pop — Sinh Nhật Rộn Rã Niềm Vui",
    coverImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 79000,
    category: "Sinh nhật",
    categorySlug: "sinh-nhat",
    demoUrl: "/templates/birthday-fun",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Pháo giấy rực rỡ, hiệu ứng thổi nến sinh nhật và nền nhạc sôi động tạo không khí bữa tiệc khó quên.",
    specs: {
      design: "Màu sắc rực rỡ, confetti động và hình ảnh bánh sinh nhật 3D",
      interaction: "Hiệu ứng mở quà sinh nhật, câu hỏi vui và sổ lời chúc số",
      sharing: "Mã QR in thiệp mời hoặc chia sẻ nhóm bạn bè",
      compatibility: "Hỗ trợ âm thanh tự động trên iOS và Android",
    },
  },
  {
    id: "prod-6",
    slug: "birthday-minimal",
    title: "Candlelight — Ấm Cúng & Tối Giản",
    coverImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    price: 49000,
    compareAtPrice: 89000,
    category: "Sinh nhật",
    categorySlug: "sinh-nhat",
    demoUrl: "/templates/birthday-minimal",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Không gian sinh nhật ấm áp dưới ánh nến, phong cách tối giản Bắc Âu sang trọng và tinh tế.",
    specs: {
      design: "Phong cách Scandinavian ấm áp, font chữ nghệ thuật thanh lịch",
      interaction: "Thổi nến ảo ước nguyện, trình chiếu khoảnh khắc trưởng thành",
      sharing: "Gửi thiệp qua tin nhắn cá nhân hóa cho từng khách",
      compatibility: "Mượt mà trên Safari, Chrome và Edge",
    },
  },
  {
    id: "prod-9",
    slug: "birthday-sweet18",
    title: "Sweet 18 — Hồng Pastel Ngọt Ngào",
    coverImage: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Sinh nhật",
    categorySlug: "sinh-nhat",
    demoUrl: "/templates/birthday-fun",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Kỷ niệm tuổi 18 rực rỡ với gam hồng phấn ngọt ngào, pháo hoa lung linh và lời chúc tuổi mới.",
    specs: {
      design: "Tông hồng phấn pastel, họa tiết vương miện & ruy băng nhẹ nhàng",
      interaction: "Hộp quà bí mật mở ra lời chúc của bạn bè thân thiết",
      sharing: "Link mời nhóm lớp và in thẻ QR để bàn tiệc",
      compatibility: "Tương thích hoàn hảo trên mọi điện thoại thông minh",
    },
  },

  // Trung thu
  {
    id: "prod-10",
    slug: "midautumn-moonlight",
    title: "Đêm Trăng Đoàn Viên — Đèn Lồng & Trăng Rằm",
    coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Trung thu",
    categorySlug: "trung-thu",
    demoUrl: "/templates/love-galaxy",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Ánh trăng rằm tháng Tám, đèn lồng ông sao và thiệp chúc đoàn viên ấm áp gửi tới gia đình, đối tác bè bạn.",
    specs: {
      design: "Trăng tròn lung linh, đèn lồng đỏ truyền thống kết hợp đồ họa hiện đại",
      interaction: "Thả đèn hoa đăng số, phát nhạc trung thu dân ca êm dịu",
      sharing: "Thiệp kèm lời chúc công ty/cá nhân qua Zalo và email",
      compatibility: "Tối ưu hiển thị cho cả máy tính và smartphone",
    },
  },
  {
    id: "prod-11",
    slug: "midautumn-nostalgia",
    title: "Trung Thu Tuổi Thơ — Ký Ức Đèn Kéo Quân",
    coverImage: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 79000,
    category: "Trung thu",
    categorySlug: "trung-thu",
    demoUrl: "/templates/birthday-fun",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Mang không khí rộn rã trống lân và tuổi thơ trở lại trong chiếc thiệp mời phá cỗ trung thu ấm áp.",
    specs: {
      design: "Hình ảnh lân sư rồng dân gian, đèn kéo quân xoay nhẹ nhàng",
      interaction: "Tương tác rước đèn và xem thực đơn tiệc trông trăng",
      sharing: "Chia sẻ trong cộng đồng cư dân hoặc gia đình",
      compatibility: "Tương thích với mọi trình duyệt hiện đại",
    },
  },

  // Hẹn hò
  {
    id: "prod-12",
    slug: "dating-firstdate",
    title: "First Date — Cuộc Hẹn Đầu Tiên Lãng Mạn",
    coverImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Hẹn hò",
    categorySlug: "hen-ho",
    demoUrl: "/templates/love-letter",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Lời ngỏ lời hẹn hò tinh tế và độc đáo, tích hợp địa điểm hẹn, thời gian và bài hát yêu thích của đối phương.",
    specs: {
      design: "Tông màu ấm áp, phong cách lá thư ngọt ngào và bí ẩn",
      interaction: "Mở phong thư bí mật kèm câu hỏi phản hồi Yes/No",
      sharing: "Gửi link riêng tư được bảo mật mã số hoặc mã QR",
      compatibility: "Xem tuyệt đẹp trên màn hình smartphone",
    },
  },
  {
    id: "prod-13",
    slug: "dating-sunset",
    title: "Sunset Dinner — Bữa Tối Hoàng Hôn",
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    price: 49000,
    compareAtPrice: 89000,
    category: "Hẹn hò",
    categorySlug: "hen-ho",
    demoUrl: "/templates/wedding-floral",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Thiệp mời bữa tối kỷ niệm hoặc buổi hẹn đặc biệt với không gian nến, hoa và ánh hoàng hôn rực rỡ.",
    specs: {
      design: "Gam màu hoàng hôn lãng mạn, menu ẩm thực tương tác",
      interaction: "Bản đồ vị trí nhà hàng, xác nhận thời gian đến tiệc",
      sharing: "Gửi thiệp riêng cho người thương qua link bí mật",
      compatibility: "Tối ưu 100% trải nghiệm chạm lướt trên di động",
    },
  },

  // Kỷ niệm
  {
    id: "prod-3",
    slug: "love-letter",
    title: "Secret Letter — Thư Tay Phong Bì Ảo",
    coverImage: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Kỷ niệm",
    categorySlug: "ky-niem",
    demoUrl: "/templates/love-letter",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Bức thư tay phong bì ảo kèm mã QR mở thiệp cảm xúc, ghi dấu kỷ niệm tình yêu chân thành.",
    specs: {
      design: "Con dấu sáp đỏ Vintage, giấy da phong thư hoài niệm",
      interaction: "Kéo mở phong bì thư ảo, phát bài hát kỷ niệm riêng",
      sharing: "Tạo mã QR in vào quà tặng, thiệp tay hoặc hoa tươi",
      compatibility: "Tương thích cao với toàn bộ hệ điều hành di động",
    },
  },
  {
    id: "prod-14",
    slug: "anniversary-timeline",
    title: "Our Journey — 1000 Ngày Bên Nhau",
    coverImage: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80",
    price: 49000,
    compareAtPrice: 99000,
    category: "Kỷ niệm",
    categorySlug: "ky-niem",
    demoUrl: "/templates/wedding-classic",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Dòng thời gian tương tác lưu giữ mọi bức ảnh, kỷ niệm từ ngày đầu tiên yêu nhau đến hiện tại.",
    specs: {
      design: "Timeline dòng thời gian lãng mạn, album ảnh kỷ niệm trượt mượt mà",
      interaction: "Đếm số ngày yêu nhau tự động cập nhật theo thời gian thực",
      sharing: "Mã QR in lên kỷ niệm chương hoặc khung ảnh để bàn",
      compatibility: "Xem sắc nét trên mọi thiết bị",
    },
  },

  // Valentine / Tình yêu
  {
    id: "prod-4",
    slug: "love-galaxy",
    title: "Vũ trụ yêu thương - Mưa Lời Yêu Thương",
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    price: 0,
    compareAtPrice: 49000,
    category: "Valentine",
    categorySlug: "valentine",
    demoUrl: "/templates/love-galaxy",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Bầu trời sao đêm lấp lánh kết hợp trái tim QR 3D, hiệu ứng mưa lời yêu thương và thông điệp tình cảm ngọt ngào.",
    specs: {
      design: "Mẫu thiết kế đẹp mắt, sang trọng, tùy chỉnh nhanh chóng theo nhu cầu của bạn.",
      interaction: "Chỉnh sửa nội dung, hình ảnh, màu sắc và âm nhạc dễ dàng chỉ với vài thao tác.",
      sharing: "Gửi link hoặc QR code cho người thương qua Zalo, Facebook, Messenger nhanh chóng.",
      compatibility: "Chạy mượt trên mọi thiết bị: điện thoại, máy tính bảng, laptop và máy tính.",
    },
  },
  {
    id: "prod-15",
    slug: "valentine-chocolat",
    title: "Sweet Valentine — Hộp Quà Trái Tim & Chocolate",
    coverImage: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 79000,
    category: "Valentine",
    categorySlug: "valentine",
    demoUrl: "/templates/love-letter",
    guideUrl: "/occasions/love-confession",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Thiệp mở hộp quà tình yêu ảo kèm những lời chúc ngọt ngào nhất dành tặng nửa kia trong ngày 14/2.",
    specs: {
      design: "Tông đỏ nhung quý phái, hộp quà thắt nơ đỏ 3D",
      interaction: "Mở nơ ruy băng để xem album ảnh và thư tình",
      sharing: "In mã QR dán lên hộp chocolate hoặc bó hoa tươi",
      compatibility: "Tối ưu hóa tốc độ tải trên mạng 4G/5G",
    },
  },

  // Quà 8/3
  {
    id: "prod-16",
    slug: "women-march-blossom",
    title: "Dành Tặng Nàng — Hoa & Lời Yêu Thương 8/3",
    coverImage: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Quà 8/3",
    categorySlug: "qua-8-3",
    demoUrl: "/templates/wedding-floral",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Bộ thiệp hoa tulip và mẫu đơn tôn vinh những người phụ nữ tuyệt vời nhất trong ngày Quốc tế Phụ nữ 8/3.",
    specs: {
      design: "Vườn hoa tulip nở rộ với cánh hoa rơi nhẹ nhàng",
      interaction: "Thẻ chúc mừng có thể tùy biến danh xưng và lời nhắn riêng",
      sharing: "Gửi tặng mẹ, vợ, bạn gái, cô giáo hoặc đồng nghiệp nữ",
      compatibility: "Xem mượt mà trên tất cả thiết bị di động",
    },
  },

  // Quà 20/10
  {
    id: "prod-17",
    slug: "women-october-grace",
    title: "Nét Đẹp Việt — Tri Ân Phụ Nữ 20/10",
    coverImage: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Quà 20/10",
    categorySlug: "qua-20-10",
    demoUrl: "/templates/wedding-floral",
    guideUrl: "/occasions/personal-birthday",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Thiệp chúc mừng ngày Phụ nữ Việt Nam 20/10 trang trọng, ý nghĩa gửi gắm lòng biết ơn sâu sắc.",
    specs: {
      design: "Họa tiết hoa sen thanh thoát, sắc hồng phấn quý phái",
      interaction: "Album ảnh kỷ niệm gia đình kèm lời chúc cảm động",
      sharing: "Gửi qua Zalo nhóm gia đình hoặc thiệp in mã QR",
      compatibility: "Tương thích 100% với màn hình điện thoại",
    },
  },

  // Tốt nghiệp
  {
    id: "prod-7",
    slug: "graduation-classic",
    title: "The Next Chapter — Lễ Tốt Nghiệp Trang Trọng",
    coverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Tốt nghiệp",
    categorySlug: "tot-nghiep",
    demoUrl: "/templates/graduation-classic",
    guideUrl: "/occasions/university-graduation",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Xanh navy & vàng gold trang trọng, học thuật, tôn vinh cột mốc tốt nghiệp đại học đáng nhớ.",
    specs: {
      design: "Xanh navy kết hợp viền vàng gold học thuật trang trọng",
      interaction: "Bản đồ hội trường lễ tốt nghiệp, RSVP khách mời tham dự",
      sharing: "Gửi lời mời trân trọng tới thầy cô, gia đình và bạn bè",
      compatibility: "Hiển thị tối ưu trên cả điện thoại và máy tính bảng",
    },
  },
  {
    id: "prod-8",
    slug: "graduation-playful",
    title: "Grad Party! — Tươi Trẻ & Pháo Giấy Rực Rỡ",
    coverImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80",
    price: 39000,
    compareAtPrice: 69000,
    category: "Tốt nghiệp",
    categorySlug: "tot-nghiep",
    demoUrl: "/templates/graduation-playful",
    guideUrl: "/occasions/university-graduation",
    videoGuideUrl: "https://youtube.com",
    available: true,
    description: "Tươi trẻ năng động, confetti pháo giấy rực rỡ, ghi dấu thanh xuân cùng bạn bè và thầy cô.",
    specs: {
      design: "Màu sắc tươi trẻ, phong cách retro thanh xuân học đường",
      interaction: "Khảo sát tham gia tiệc ăn mừng, lưu bút số kỷ yếu",
      sharing: "Mã QR in lên nón tốt nghiệp hoặc thiệp mời tiệc chia tay",
      compatibility: "Tốc độ tải nhanh, mượt mà trên mạng 4G/Wifi",
    },
  },
];

export const COLLECTIONS_LIST: CollectionItem[] = [
  {
    id: "col-1",
    slug: "sinh-nhat",
    title: "Sinh Nhật Rực Rỡ",
    subtitle: "Pháo hoa, nến sinh nhật và thiệp mời tương tác cho mọi lứa tuổi",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
    iconName: "Cake",
    productCount: 3,
    categorySlug: "sinh-nhat",
  },
  {
    id: "col-2",
    slug: "trung-thu",
    title: "Tết Trung Thu Đoàn Viên",
    subtitle: "Đèn lồng lung linh, trăng rằm ấm áp và lời chúc sum vầy",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    iconName: "Moon",
    productCount: 2,
    categorySlug: "trung-thu",
  },
  {
    id: "col-3",
    slug: "hen-ho",
    title: "Hẹn Hò & Lời Ngỏ Ý",
    subtitle: "Tạo dấu ấn khó phai cho buổi hẹn đầu và bữa tối lãng mạn",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    iconName: "HeartHandshake",
    productCount: 2,
    categorySlug: "hen-ho",
  },
  {
    id: "col-4",
    slug: "ky-niem",
    title: "Kỷ Niệm Ngày Yêu",
    subtitle: "Dòng thời gian tình yêu, thư tay ảo và những cột mốc ngọt ngào",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80",
    iconName: "Sparkles",
    productCount: 2,
    categorySlug: "ky-niem",
  },
  {
    id: "col-5",
    slug: "valentine",
    title: "Valentine & Tình Yêu",
    subtitle: "Trái tim QR 3D, bầu trời sao và hộp quà tình cảm chân thành",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
    iconName: "Heart",
    productCount: 2,
    categorySlug: "valentine",
  },
  {
    id: "col-6",
    slug: "qua-8-3",
    title: "Quà Tặng 8/3",
    subtitle: "Thiệp hoa pastel tinh tế và thông điệp gửi trọn lòng trân quý",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    iconName: "Gift",
    productCount: 1,
    categorySlug: "qua-8-3",
  },
  {
    id: "col-7",
    slug: "qua-20-10",
    title: "Tri Ân 20/10",
    subtitle: "Nét đẹp truyền thống và lòng biết ơn tới người phụ nữ Việt Nam",
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
    iconName: "Flower2",
    productCount: 1,
    categorySlug: "qua-20-10",
  },
  {
    id: "col-8",
    slug: "cuoi-dinh-hon",
    title: "Cưới & Đính Hôn",
    subtitle: "Thiệp cưới hoàng gia, đếm ngược ngày chung đôi và RSVP thông minh",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    iconName: "Crown",
    productCount: 2,
    categorySlug: "cuoi-dinh-hon",
  },
  {
    id: "col-9",
    slug: "tot-nghiep",
    title: "Lễ Tốt Nghiệp",
    subtitle: "Đánh dấu cột mốc thanh xuân, gửi lời mời trang trọng tới thầy cô & bạn bè",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    iconName: "GraduationCap",
    productCount: 2,
    categorySlug: "tot-nghiep",
  },
];

export const VOUCHER_CAMPAIGN: VoucherCampaign = {
  campaignId: "CAMP-2026-DINGDONG",
  title: "Ưu đãi đặc biệt dành cho bạn",
  code: "DINGDONG2026",
  discountDisplay: "20%",
  discountPercent: 20,
  validUntil: "31/12/2026",
  task1: {
    title: "Nhiệm vụ 1 — Nhận voucher giảm 20%",
    requirements: [
      "Đăng ký tài khoản Ding Dong Gift miễn phí",
      "Chọn mẫu thiệp hoặc mini website yêu thích",
      "Áp dụng mã voucher DINGDONG2026 tại bước thanh toán để giảm ngay 20%",
    ],
  },
  task2: {
    title: "Nhiệm vụ 2 — FREE Mini Website khi sáng tạo nội dung",
    requirements: [
      "Quay video ngắn chia sẻ khoảnh khắc mở thiệp Ding Dong Gift lên TikTok hoặc Reels",
      "Gắn thẻ thương hiệu và hashtag chiến dịch bên dưới",
      "Gửi link bài viết về Fanpage/Zalo để nhận mã nâng cấp gói VIP miễn phí 100%",
    ],
  },
  videoCaption: "Thiệp mời online siêu xịn sò cho ngày trọng đại! Mở phong bì tương tác cực mượt tại Ding Dong Gift ✨",
  hashtags: ["#DingDongGift", "#ThiepMoiOnline", "#ThiepCuoi2026", "#MiniWebsite", "#QRCodeThiep"],
  redemptionSteps: [
    "Bước 1: Hoàn thành nhiệm vụ video hoặc đơn hàng đầu tiên.",
    "Bước 2: Gửi link bài viết hoặc hình ảnh chụp màn hình qua kênh hỗ trợ Zalo/Fanpage.",
    "Bước 3: Đội ngũ Ding Dong Gift xác thực và gửi mã kích hoạt/voucher trong vòng 24 giờ.",
  ],
  tiktokUrl: "https://www.tiktok.com",
};

