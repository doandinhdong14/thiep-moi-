import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed Occasion Categories
  const categoriesData = [
    { slug: "love", title: "Tình yêu & Lãng mạn", icon: "Heart", sortOrder: 1 },
    { slug: "wedding", title: "Cưới hỏi & Hôn nhân", icon: "Sparkles", sortOrder: 2 },
    { slug: "birthday", title: "Sinh nhật & Trưởng thành", icon: "Cake", sortOrder: 3 },
    { slug: "graduation", title: "Học tập & Tốt nghiệp", icon: "GraduationCap", sortOrder: 4 },
    { slug: "family", title: "Gia đình & Nhà cửa", icon: "Home", sortOrder: 5 },
    { slug: "friendship", title: "Bạn bè & Cộng đồng", icon: "Users", sortOrder: 6 },
    { slug: "business", title: "Công việc & Doanh nghiệp", icon: "Briefcase", sortOrder: 7 },
    { slug: "festivals", title: "Lễ hội & Ngày đặc biệt", icon: "PartyPopper", sortOrder: 8 },
    { slug: "personal", title: "Cảm xúc & Lời nhắn", icon: "MessageSquareHeart", sortOrder: 9 },
    { slug: "gifts", title: "Quà tặng & Trải nghiệm", icon: "Gift", sortOrder: 10 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const record = await prisma.occasionCategory.upsert({
      where: { slug: cat.slug },
      update: { title: cat.title, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { slug: cat.slug, title: cat.title, icon: cat.icon, sortOrder: cat.sortOrder },
    });
    categoryMap.set(cat.slug, record.id);
  }

  // 2. Seed Occasions (Deep 4 verticals enabled + others discoverable/coming soon)
  const occasionsData = [
    // Wedding vertical
    { categorySlug: "wedding", slug: "wedding-ceremony", title: "Lễ cưới & Tiệc cưới", formPresetKey: "wedding", active: true, sortOrder: 1 },
    { categorySlug: "wedding", slug: "save-the-date", title: "Save the Date", formPresetKey: "wedding", active: true, sortOrder: 2 },
    { categorySlug: "wedding", slug: "engagement-ceremony", title: "Lễ ăn hỏi / Đính hôn", formPresetKey: "wedding", active: true, sortOrder: 3 },
    { categorySlug: "wedding", slug: "wedding-anniversary", title: "Kỷ niệm ngày cưới", formPresetKey: "wedding", active: true, sortOrder: 4 },

    // Graduation vertical
    { categorySlug: "graduation", slug: "university-graduation", title: "Lễ tốt nghiệp đại học", formPresetKey: "graduation", active: true, sortOrder: 1 },
    { categorySlug: "graduation", slug: "highschool-graduation", title: "Lễ tốt nghiệp THPT", formPresetKey: "graduation", active: true, sortOrder: 2 },
    { categorySlug: "graduation", slug: "graduation-party", title: "Tiệc chia tay / Tiệc tốt nghiệp", formPresetKey: "graduation", active: true, sortOrder: 3 },

    // Birthday vertical
    { categorySlug: "birthday", slug: "personal-birthday", title: "Sinh nhật cá nhân", formPresetKey: "birthday", active: true, sortOrder: 1 },
    { categorySlug: "birthday", slug: "surprise-birthday", title: "Sinh nhật bất ngờ", formPresetKey: "birthday", active: true, sortOrder: 2 },
    { categorySlug: "birthday", slug: "first-birthday", title: "Tiệc thôi nôi / 1 tuổi", formPresetKey: "birthday", active: true, sortOrder: 3 },

    // Love vertical
    { categorySlug: "love", slug: "love-confession", title: "Tỏ tình lãng mạn", formPresetKey: "love", active: true, sortOrder: 1 },
    { categorySlug: "love", slug: "love-anniversary", title: "Kỷ niệm tình yêu (100 ngày/1 năm)", formPresetKey: "love", active: true, sortOrder: 2 },
    { categorySlug: "love", slug: "secret-love", title: "Thư tình bí mật", formPresetKey: "love", active: true, sortOrder: 3 },
    { categorySlug: "love", slug: "date-invitation", title: "Mời đi date / Cà phê", formPresetKey: "love", active: true, sortOrder: 4 },

    // Other categories (Discoverable taxonomy)
    { categorySlug: "family", slug: "housewarming", title: "Tân gia nhà mới", formPresetKey: "generic", active: true, sortOrder: 1 },
    { categorySlug: "business", slug: "grand-opening", title: "Khai trương cửa hàng", formPresetKey: "generic", active: true, sortOrder: 1 },
    { categorySlug: "festivals", slug: "christmas-party", title: "Giáng sinh / Năm mới", formPresetKey: "generic", active: true, sortOrder: 1 },
  ];

  const occasionMap = new Map<string, string>();
  for (const occ of occasionsData) {
    const categoryId = categoryMap.get(occ.categorySlug);
    if (!categoryId) continue;
    const record = await prisma.occasion.upsert({
      where: { slug: occ.slug },
      update: { title: occ.title, formPresetKey: occ.formPresetKey, active: occ.active, sortOrder: occ.sortOrder },
      create: {
        categoryId,
        slug: occ.slug,
        title: occ.title,
        formPresetKey: occ.formPresetKey,
        active: occ.active,
        sortOrder: occ.sortOrder,
      },
    });
    occasionMap.set(occ.slug, record.id);
  }

  // 3. Seed 8 P0 Templates with TemplateVersions
  const templatesData = [
    {
      slug: "wedding-classic",
      title: "Ivory Ceremony",
      occasionSlug: "wedding-ceremony",
      isPremium: false,
      definition: {
        name: "Ivory Ceremony",
        style: "Kem - vàng champagne, trang nhã, tối giản",
        palette: { background: "#faf8f5", foreground: "#2d241e", accent: "#d4af37", muted: "#8c7e75" },
        blocks: ["cover", "envelope_reveal", "event_details", "countdown", "gallery", "rsvp", "guestbook", "footer_cta"],
      },
    },
    {
      slug: "wedding-floral",
      title: "Bloom & Vows",
      occasionSlug: "wedding-ceremony",
      isPremium: true,
      definition: {
        name: "Bloom & Vows",
        style: "Hoa pastel thanh lịch, lãng mạn nhẹ nhàng",
        palette: { background: "#fdf8f7", foreground: "#3a2d2e", accent: "#e28787", muted: "#998082" },
        blocks: ["cover", "intro_message", "gallery", "event_details", "rsvp", "footer_cta"],
      },
    },
    {
      slug: "graduation-classic",
      title: "The Next Chapter",
      occasionSlug: "university-graduation",
      isPremium: false,
      definition: {
        name: "The Next Chapter",
        style: "Xanh navy & vàng gold, học thuật trang trọng",
        palette: { background: "#0f172a", foreground: "#f8fafc", accent: "#f59e0b", muted: "#94a3b8" },
        blocks: ["cover", "intro_message", "event_details", "countdown", "gallery", "rsvp", "footer_cta"],
      },
    },
    {
      slug: "graduation-playful",
      title: "Grad Party!",
      occasionSlug: "graduation-party",
      isPremium: false,
      definition: {
        name: "Grad Party!",
        style: "Tươi trẻ năng động, confetti, kỷ niệm thanh xuân",
        palette: { background: "#f0fdf4", foreground: "#14532d", accent: "#16a34a", muted: "#4ade80" },
        blocks: ["cover", "event_details", "gallery", "response_question", "guestbook", "footer_cta"],
      },
    },
    {
      slug: "birthday-fun",
      title: "Confetti Pop",
      occasionSlug: "personal-birthday",
      isPremium: false,
      definition: {
        name: "Confetti Pop",
        style: "Đáng yêu, rực rỡ, pháo hoa giấy và niềm vui",
        palette: { background: "#fff1f2", foreground: "#881337", accent: "#f43f5e", muted: "#fb7185" },
        blocks: ["envelope_reveal", "cover", "countdown", "event_details", "rsvp", "footer_cta"],
      },
    },
    {
      slug: "birthday-minimal",
      title: "Candlelight",
      occasionSlug: "surprise-birthday",
      isPremium: true,
      definition: {
        name: "Candlelight",
        style: "Ấm áp, ánh nến, tối giản và tình cảm",
        palette: { background: "#18181b", foreground: "#fafafa", accent: "#fbbf24", muted: "#a1a1aa" },
        blocks: ["cover", "intro_message", "event_details", "gallery", "guestbook", "footer_cta"],
      },
    },
    {
      slug: "love-letter",
      title: "Secret Letter",
      occasionSlug: "secret-love",
      isPremium: false,
      definition: {
        name: "Secret Letter",
        style: "Giấy thư phong bì cổ điển, mực viết tay, lãng mạn",
        palette: { background: "#fefae0", foreground: "#283618", accent: "#bc6c25", muted: "#dda15e" },
        blocks: ["envelope_reveal", "intro_message", "gallery", "response_question", "footer_cta"],
      },
    },
    {
      slug: "love-galaxy",
      title: "Written in the Stars",
      occasionSlug: "love-confession",
      isPremium: true,
      definition: {
        name: "Written in the Stars",
        style: "Bầu trời đêm đầy sao lấp lánh, kỳ ảo và sâu lắng",
        palette: { background: "#09090b", foreground: "#f4f4f5", accent: "#a855f7", muted: "#71717a" },
        blocks: ["cover", "intro_message", "gallery", "music_control", "response_question", "footer_cta"],
      },
    },
    {
      slug: "thiep-3",
      title: "Thiệp 03: Một Tấm Vé Hẹn Hò ♡",
      occasionSlug: "date-invitation",
      isPremium: false,
      definition: {
        name: "Vintage Ticket",
        style: "Giấy Cũ Vintage & Vé Tình Yêu",
        palette: { background: "#FAF4E2", foreground: "#504735", accent: "#AA713D", muted: "#A18C70" },
        blocks: ["cover", "intro_message", "event_details", "response_question", "footer_cta"],
      },
    },
    {
      slug: "thiep-4",
      title: "Thiệp 04: Gửi Em Một Vũ Trụ ✨",
      occasionSlug: "love-confession",
      isPremium: false,
      definition: {
        name: "Cosmic Journey",
        style: "Vũ Trụ Huyền Ảo & Warp Cổng Sao",
        palette: { background: "#080c16", foreground: "#f0f4fc", accent: "#9d7cf7", muted: "#8892b0" },
        blocks: ["cover", "intro_message", "response_question", "footer_cta"],
      },
    },
    {
      slug: "thiep-5",
      title: "Thiệp 05: Khu Vườn Kỷ Niệm (Phong Thư Tình Yêu)",
      occasionSlug: "love-anniversary",
      isPremium: false,
      definition: {
        name: "Memory Garden",
        style: "Khu Vườn Hoa & Lật Gáy Sách 3D",
        palette: { background: "#1a0f18", foreground: "#fff0f5", accent: "#bc1948", muted: "#c9ac9d" },
        blocks: ["envelope_reveal", "cover", "intro_message", "gallery", "footer_cta"],
      },
    },
    {
      slug: "thiep-6",
      title: "Thiệp 06: Mùa Thu Kỷ Niệm (Bức Thư Giữa Mùa Lá Rụng)",
      occasionSlug: "love-anniversary",
      isPremium: false,
      definition: {
        name: "Autumn Leaves",
        style: "Mùa Thu Lá Phong & Giấy Kraft",
        palette: { background: "#1b120c", foreground: "#fef5e7", accent: "#e67e22", muted: "#d35400" },
        blocks: ["envelope_reveal", "cover", "intro_message", "gallery", "footer_cta"],
      },
    },
    {
      slug: "thiep-7",
      title: "Thiệp 07: Đại Dương Tình Yêu & Ánh Sáng Biển Sâu",
      occasionSlug: "date-invitation",
      isPremium: false,
      definition: {
        name: "Deep Ocean",
        style: "Đại Dương Xanh & Dạ Quang Biển Sâu",
        palette: { background: "#031021", foreground: "#e0f7fa", accent: "#00f2fe", muted: "#4facfe" },
        blocks: ["cover", "intro_message", "response_question", "footer_cta"],
      },
    },
    {
      slug: "thiep-8",
      title: "Thiệp 08: Vũ Trụ Trái Tim & Bì Thư 3D",
      occasionSlug: "love-anniversary",
      isPremium: false,
      definition: {
        name: "Cosmic Heart 3D",
        style: "Particle Trái Tim 3D & Bì Thư Mở Nắp",
        palette: { background: "#090514", foreground: "#ffe6f0", accent: "#d50065", muted: "#ff82ab" },
        blocks: ["cover", "intro_message", "gallery", "footer_cta"],
      },
    },
    {
      slug: "thiep-9",
      title: "Thiệp 09: Vũ Điệu Cực Quang & Trái Tim Pha Lê 3D",
      occasionSlug: "love-confession",
      isPremium: false,
      definition: {
        name: "Aurora Crystal",
        style: "Cực Quang Bắc Cực & Pha Lê Băng Tuyết",
        palette: { background: "#051329", foreground: "#e8fdf8", accent: "#64ffda", muted: "#00b894" },
        blocks: ["cover", "intro_message", "gallery", "footer_cta"],
      },
    },
    {
      slug: "thiep-10",
      title: "Thiệp 10: Boarding Pass – Chuyến Bay Hạnh Phúc",
      occasionSlug: "date-invitation",
      isPremium: false,
      definition: {
        name: "Boarding Pass",
        style: "Vé Máy Bay First Class & Radar Tình Yêu",
        palette: { background: "#0a1128", foreground: "#fff8e7", accent: "#d4af37", muted: "#1e90ff" },
        blocks: ["cover", "intro_message", "event_details", "response_question", "footer_cta"],
      },
    },
    {
      slug: "thiep-giang-sinh",
      title: "Thiệp Giáng Sinh – Đêm Noel Diệu Kỳ",
      occasionSlug: "christmas-party",
      isPremium: false,
      definition: {
        name: "Christmas Magic",
        style: "Đêm Noel Tuyết Rơi 3D & Hộp Quà Mở Nơ",
        palette: { background: "#0c1829", foreground: "#fff9f0", accent: "#e74c3c", muted: "#f1c40f" },
        blocks: ["cover", "intro_message", "response_question", "footer_cta"],
      },
    },
    {
      slug: "thiep-xmas",
      title: "Christmas Special – Hộp Quà Giáng Sinh Lung Linh",
      occasionSlug: "christmas-party",
      isPremium: false,
      definition: {
        name: "Christmas Special",
        style: "Hộp Quà 3D & Bưu Thiếp Bắc Cực",
        palette: { background: "#14070a", foreground: "#fff5f5", accent: "#c0392b", muted: "#27ae60" },
        blocks: ["cover", "intro_message", "response_question", "footer_cta"],
      },
    },
  ];

  for (const tpl of templatesData) {
    const occId = occasionMap.get(tpl.occasionSlug) ?? null;
    const template = await prisma.template.upsert({
      where: { slug: tpl.slug },
      update: { title: tpl.title, isPremium: tpl.isPremium, occasionId: occId },
      create: {
        slug: tpl.slug,
        title: tpl.title,
        isPremium: tpl.isPremium,
        occasionId: occId,
        status: "PUBLISHED",
      },
    });

    await prisma.templateVersion.upsert({
      where: {
        templateId_version: {
          templateId: template.id,
          version: 1,
        },
      },
      update: {
        definitionJson: JSON.stringify(tpl.definition),
        rendererVersion: "v1",
      },
      create: {
        templateId: template.id,
        version: 1,
        definitionJson: JSON.stringify(tpl.definition),
        rendererVersion: "v1",
      },
    });
  }

  // 4. Seed Plans & Features (§12.1)
  const plans = [
    {
      code: "FREE",
      name: "Gói Miễn Phí",
      basePriceVnd: 0,
      defaultDurationDays: 30,
      sortOrder: 1,
      features: {
        maxActiveInvitations: 1,
        watermark: true,
        premiumTemplates: false,
        musicUpload: false,
        analytics: "basic",
        exportFormats: ["PNG_PREVIEW"],
        maxGuestRsvp: 30,
      },
    },
    {
      code: "BASIC",
      name: "Gói Cơ Bản",
      basePriceVnd: 49000,
      defaultDurationDays: 90,
      sortOrder: 2,
      features: {
        maxActiveInvitations: 3,
        watermark: false,
        premiumTemplates: true,
        musicUpload: false,
        analytics: "standard",
        exportFormats: ["PNG", "JPG"],
        maxGuestRsvp: 100,
      },
    },
    {
      code: "PREMIUM",
      name: "Gói Cao Cấp",
      basePriceVnd: 99000,
      defaultDurationDays: 180,
      sortOrder: 3,
      features: {
        maxActiveInvitations: 10,
        watermark: false,
        premiumTemplates: true,
        musicUpload: true,
        analytics: "advanced",
        exportFormats: ["PNG", "JPG", "PDF"],
        maxGuestRsvp: 500,
      },
    },
    {
      code: "EVENT_PRO",
      name: "Gói Sự Kiện / Cưới Pro",
      basePriceVnd: 199000,
      defaultDurationDays: 365,
      sortOrder: 4,
      features: {
        maxActiveInvitations: 50,
        watermark: false,
        premiumTemplates: true,
        musicUpload: true,
        analytics: "pro",
        exportFormats: ["PNG", "JPG", "PDF", "PRINT_READY"],
        maxGuestRsvp: 2000,
      },
    },
  ];

  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { code: p.code },
      update: { name: p.name, basePriceVnd: p.basePriceVnd, defaultDurationDays: p.defaultDurationDays, sortOrder: p.sortOrder },
      create: { code: p.code, name: p.name, basePriceVnd: p.basePriceVnd, defaultDurationDays: p.defaultDurationDays, sortOrder: p.sortOrder },
    });

    for (const [key, val] of Object.entries(p.features)) {
      await prisma.planFeature.upsert({
        where: { planId_featureKey: { planId: plan.id, featureKey: key } },
        update: { valueJson: JSON.stringify(val) },
        create: { planId: plan.id, featureKey: key, valueJson: JSON.stringify(val) },
      });
    }
  }

  // 5. Seed Affiliate Program
  await prisma.affiliateProgram.upsert({
    where: { code: "DEFAULT_10" },
    update: {
      name: "Chương trình CTV Tiêu Chuẩn 10%",
      rateBps: 1000, // 10.00%
      attributionDays: 30,
      holdDays: 14,
      minPayoutVnd: 100000,
      active: true,
    },
    create: {
      code: "DEFAULT_10",
      name: "Chương trình CTV Tiêu Chuẩn 10%",
      rateBps: 1000,
      attributionDays: 30,
      holdDays: 14,
      minPayoutVnd: 100000,
      active: true,
    },
  });

  // 6. Bootstrap Admin User
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@momentlink.vn";
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Admin@MomentLink2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Quản Trị Viên Hệ Thống", passwordHash, status: "ACTIVE" },
    create: {
      email: adminEmail,
      name: "Quản Trị Viên Hệ Thống",
      passwordHash,
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // Assign ADMIN role
  await prisma.roleAssignment.upsert({
    where: {
      userId_role: {
        userId: adminUser.id,
        role: "ADMIN",
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      role: "ADMIN",
      grantedBy: "SYSTEM_BOOTSTRAP",
    },
  });

  // 7. Seed Sample Partner Shop & Products
  const shopOwner = await prisma.user.upsert({
    where: { email: "shop.partner@momentlink.vn" },
    update: {},
    create: {
      email: "shop.partner@momentlink.vn",
      name: "Florist Saigon Partner",
      passwordHash: await bcrypt.hash("ShopPartner@2026", 10),
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  await prisma.roleAssignment.upsert({
    where: { userId_role: { userId: shopOwner.id, role: "SHOP_OWNER" } },
    update: {},
    create: { userId: shopOwner.id, role: "SHOP_OWNER", grantedBy: "SYSTEM_BOOTSTRAP" },
  });

  const sampleShop = await prisma.shop.upsert({
    where: { slug: "florist-saigon" },
    update: {
      name: "Florist Sài Gòn",
      description: "Hoa tươi chúc mừng tốt nghiệp, đám cưới, sinh nhật giao nhanh TP.HCM",
      status: "APPROVED",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      address: "123 Lê Lợi, Phường Bến Nghé",
      phone: "0901234567",
    },
    create: {
      ownerId: shopOwner.id,
      slug: "florist-saigon",
      name: "Florist Sài Gòn",
      description: "Hoa tươi chúc mừng tốt nghiệp, đám cưới, sinh nhật giao nhanh TP.HCM",
      status: "APPROVED",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      address: "123 Lê Lợi, Phường Bến Nghé",
      phone: "0901234567",
    },
  });

  await prisma.shopMembership.upsert({
    where: { shopId_userId: { shopId: sampleShop.id, userId: shopOwner.id } },
    update: { role: "OWNER" },
    create: { shopId: sampleShop.id, userId: shopOwner.id, role: "OWNER" },
  });

  const shopProducts = [
    {
      slug: "bo-hoa-tot-nghiep-huong-duong",
      title: "Bó Hoa Hướng Dương Tốt Nghiệp Vươn Xa",
      category: "hoa tươi",
      description: "Bó hoa 5 bông hướng dương rực rỡ kết hợp hoa baby trắng, gắn kèm thẻ QR lời chúc.",
      minPriceVnd: 250000,
      maxPriceVnd: 350000,
      leadTimeHours: 6,
      qrCompatible: true,
      imageUrl: "/images/sample-flowers-1.jpg",
    },
    {
      slug: "hop-qua-socola-gau-bong",
      title: "Hộp Quà Chocolate & Gấu Bông Kỷ Niệm",
      category: "quà tặng",
      description: "Hộp quà trái tim gồm 12 viên chocolate nghệ thuật và gấu bông mini xinh xắn.",
      minPriceVnd: 320000,
      maxPriceVnd: 450000,
      leadTimeHours: 12,
      qrCompatible: true,
      imageUrl: "/images/sample-gift-1.jpg",
    },
  ];

  for (const prod of shopProducts) {
    await prisma.shopProduct.upsert({
      where: { shopId_slug: { shopId: sampleShop.id, slug: prod.slug } },
      update: {
        title: prod.title,
        category: prod.category,
        description: prod.description,
        minPriceVnd: prod.minPriceVnd,
        maxPriceVnd: prod.maxPriceVnd,
        leadTimeHours: prod.leadTimeHours,
        qrCompatible: prod.qrCompatible,
        imageUrl: prod.imageUrl,
        active: true,
      },
      create: {
        shopId: sampleShop.id,
        slug: prod.slug,
        title: prod.title,
        category: prod.category,
        description: prod.description,
        minPriceVnd: prod.minPriceVnd,
        maxPriceVnd: prod.maxPriceVnd,
        leadTimeHours: prod.leadTimeHours,
        qrCompatible: prod.qrCompatible,
        imageUrl: prod.imageUrl,
        active: true,
      },
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

