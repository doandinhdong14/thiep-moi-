import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { DEFAULT_SHOP_SETTINGS, SHOP_SETTINGS_KEY } from "./settings";

const SHOP_CATEGORIES_SEED = [
  {
    slug: "khan-quang",
    name: "Khăn quàng cổ",
    description: "Khăn len mềm mịn, dệt ấm áp dành tặng người thương trong những ngày gió.",
    iconName: "sparkles",
    coverImage: "/assets/shop/scarf-suong-mai.svg",
    sortOrder: 1,
  },
  {
    slug: "gang-tay",
    name: "Găng tay giữ ấm",
    description: "Găng tay len mịn êm tay, tiện chạm cảm ứng, gói hộp xinh kèm thiệp QR.",
    iconName: "heart",
    coverImage: "/assets/shop/gloves-cozy.svg",
    sortOrder: 2,
  },
  {
    slug: "moc-khoa",
    name: "Móc khóa kỷ niệm",
    description: "Móc khóa lưu niệm tinh xảo mang theo bên mình mỗi ngày như một lời nhắc thương.",
    iconName: "key",
    coverImage: "/assets/shop/keychain-heart.svg",
    sortOrder: 3,
  },
  {
    slug: "hop-qua",
    name: "Hộp quà đôi / Combo",
    description: "Set quà phối sẵn khăn, găng tay, móc khóa đồng điệu sắc màu kèm thiệp 3D.",
    iconName: "gift",
    coverImage: "/assets/shop/combo-dong-am.svg",
    sortOrder: 4,
  },
];

interface DraftProductSeed {
  categorySlug: string;
  slug: string;
  name: string;
  subtitle: string;
  shortDesc: string;
  description: string;
  materialCare: string;
  giftNote: string;
  productType: "SINGLE" | "COMBO" | "ADDON";
  isFeatured: boolean;
  sortOrder: number;
  tags: string[];
  occasionTags: string[];
  images: string[];
  boxSpecs: Record<string, string>;
  comboItems: string[];
  defaultTemplateId: string;
  variants: {
    sku: string;
    name: string;
    colorName: string;
    colorHex: string;
    sizeLabel: string;
    materialLabel: string;
    priceVnd: number;
    compareAtVnd: number | null;
    imageUrl: string;
    isDefault: boolean;
  }[];
}

const DRAFT_PRODUCTS_SEED: DraftProductSeed[] = [
  {
    categorySlug: "khan-quang",
    slug: "khan-len-suong-mai",
    name: "Khăn len Sương Mai",
    subtitle: "Dáng khăn dài mềm nhẹ • Kèm thiệp QR độc bản",
    shortDesc: "Khăn len kem sữa mềm mịn kèm túi quà và thiệp QR cá nhân hóa.",
    description:
      "Khăn len bề mặt mịn mượt, tông màu kem sữa thanh lịch dễ phối đồ mùa thu đông. Mỗi hộp quà đi kèm 1 thiệp online cá nhân hóa bằng mã QR riêng.",
    materialCare: "Giặt tay nước lạnh dưới 30°C với dầu gội dịu nhẹ, vắt nhẹ và phơi ngang.",
    giftNote: "Có thể chọn thiệp Sẵn có hoặc tùy biến lời chúc & nhạc nền theo từng hộp.",
    productType: "SINGLE",
    isFeatured: true,
    sortOrder: 1,
    tags: ["Mùa đông", "Khăn len", "Tặng người thương"],
    occasionTags: ["Sinh nhật", "Kỷ niệm", "Giáng sinh", "Tặng người yêu"],
    images: ["/assets/shop/samples/set-1.jpg", "/assets/shop/samples/set-2.jpg"],
    boxSpecs: { size: "26 × 20 × 7 cm", scarfDimensions: "180 × 35 cm" },
    comboItems: [],
    defaultTemplateId: "thiep-8",
    variants: [
      {
        sku: "DDG-KSM-KEM",
        name: "Kem Sữa • 180×35cm",
        colorName: "Kem Sữa",
        colorHex: "#F5EDE4",
        sizeLabel: "180×35cm",
        materialLabel: "Len Cashmere pha",
        priceVnd: 249000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-1.jpg",
        isDefault: true,
      },
      {
        sku: "DDG-KSM-HONG",
        name: "Hồng Phấn • 180×35cm",
        colorName: "Hồng Phấn",
        colorHex: "#F4C2D2",
        sizeLabel: "180×35cm",
        materialLabel: "Len Cashmere pha",
        priceVnd: 249000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-2.jpg",
        isDefault: false,
      },
    ],
  },
  {
    categorySlug: "khan-quang",
    slug: "khan-len-may-hong",
    name: "Khăn len Mây Hồng",
    subtitle: "Dệt gân nổi êm ấm • Tông hồng phấn lãng mạn",
    shortDesc: "Khăn quàng Mây Hồng tông pastel kèm hộp quà & thiệp QR.",
    description:
      "Thiết kế tua rua tinh tế cùng sắc hồng phấn dịu mắt. Phù hợp làm quà sinh nhật, kỷ niệm hoặc tặng ngày lạnh bất chợt.",
    materialCare: "Không sấy nhiệt cao, tránh móc khóa sắc nhọn kéo sợi.",
    giftNote: "Gợi ý kết hợp thiệp Vũ Trụ Trái Tim (#08) hoặc Mùa Thu Kỷ Niệm (#06).",
    productType: "SINGLE",
    isFeatured: true,
    sortOrder: 2,
    tags: ["Khăn len", "Lãng mạn"],
    occasionTags: ["Sinh nhật", "8/3 & 20/10", "Tỏ tình"],
    images: ["/assets/shop/samples/set-2.jpg"],
    boxSpecs: { size: "26 × 20 × 7 cm", scarfDimensions: "190 × 38 cm" },
    comboItems: [],
    defaultTemplateId: "thiep-6",
    variants: [
      {
        sku: "DDG-KMH-ROSE",
        name: "Hồng Mây • Free size",
        colorName: "Hồng Mây",
        colorHex: "#EEB7C7",
        sizeLabel: "190×38cm",
        materialLabel: "Len lông thỏ nhân tạo",
        priceVnd: 269000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-2.jpg",
        isDefault: true,
      },
    ],
  },
  {
    categorySlug: "gang-tay",
    slug: "gang-tay-cozy-day",
    name: "Găng tay Cozy Day",
    subtitle: "Găng len mịn cảm ứng • Giữ ấm lòng bàn tay",
    shortDesc: "Găng tay len giữ ấm mềm mại kèm hộp quà và thiệp QR.",
    description:
      "Đôi găng tay len dệt dày dặn vừa phải, ôm gọn bàn tay khi đi xe máy hoặc dạo phố buổi tối, đi kèm thiệp QR trong hộp quà.",
    materialCare: "Giặt tay nhẹ nhàng, giữ phom khi phơi.",
    giftNote: "Mỗi hộp đều được gắn QR thiệp online riêng biệt.",
    productType: "SINGLE",
    isFeatured: true,
    sortOrder: 3,
    tags: ["Găng tay", "Giữ ấm"],
    occasionTags: ["Giáng sinh", "Sinh nhật", "Mùa đông"],
    images: ["/assets/shop/samples/set-3.jpg"],
    boxSpecs: { size: "22 × 16 × 5 cm", weight: "140g" },
    comboItems: [],
    defaultTemplateId: "thiep-giang-sinh",
    variants: [
      {
        sku: "DDG-GT-HONG",
        name: "Hồng Phấn • Freesize",
        colorName: "Hồng Phấn",
        colorHex: "#F4DCE3",
        sizeLabel: "Freesize",
        materialLabel: "Len pha Cotton",
        priceVnd: 159000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-3.jpg",
        isDefault: true,
      },
      {
        sku: "DDG-GT-OAT",
        name: "Yến Mạch • Freesize",
        colorName: "Yến Mạch",
        colorHex: "#EBD7CB",
        sizeLabel: "Freesize",
        materialLabel: "Len pha Cotton",
        priceVnd: 159000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-3.jpg",
        isDefault: false,
      },
    ],
  },
  {
    categorySlug: "moc-khoa",
    slug: "moc-khoa-trai-tim-nhung",
    name: "Móc khóa Trái Tim Nhung",
    subtitle: "Nhỏ xinh lưu niệm • Gửi gắm thông điệp mỗi ngày",
    shortDesc: "Móc khóa trái tim nhung kèm hộp quà nơ và thiệp QR.",
    description:
      "Chiếc móc khóa bọc nhung mịn cùng khoen vàng champagne, dễ gắn chìa khóa xe, túi tote hoặc balo. Đính kèm hộp mini và thiệp QR.",
    materialCare: "Lau khô nhẹ bằng khăn mềm, hạn chế ngâm nước.",
    giftNote: "Phù hợp làm quà bất ngờ nhỏ xinh cho người thương hoặc bạn thân.",
    productType: "SINGLE",
    isFeatured: true,
    sortOrder: 4,
    tags: ["Móc khóa", "Quà nhỏ xinh"],
    occasionTags: ["Kỷ niệm", "Cảm ơn", "Sinh nhật"],
    images: ["/assets/shop/samples/set-4.jpg"],
    boxSpecs: { size: "12 × 12 × 4 cm" },
    comboItems: [],
    defaultTemplateId: "thiep-7",
    variants: [
      {
        sku: "DDG-MK-TIM",
        name: "Đỏ Hồng Nhung • 6cm",
        colorName: "Đỏ Hồng",
        colorHex: "#FF5C8D",
        sizeLabel: "6cm",
        materialLabel: "Nhung mịn + Hợp kim mạ",
        priceVnd: 89000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-4.jpg",
        isDefault: true,
      },
    ],
  },
  {
    categorySlug: "moc-khoa",
    slug: "moc-khoa-chu-cai-champagne",
    name: "Móc khóa Chữ Cái Champagne",
    subtitle: "Mặt đồng ánh champagne • Kỷ vật cá nhân hóa",
    shortDesc: "Móc khóa chữ cái ánh vàng kèm túi quà và thiệp QR.",
    description:
      "Mặt tròn khắc chữ thanh lịch trên nền men kem, kết hợp cùng chiếc thiệp điện tử giữ lại kỷ niệm lâu dài.",
    materialCare: "Tránh tiếp xúc hóa chất mạnh để giữ lớp mạ bền màu.",
    giftNote: "Chọn mẫu thiệp Vé Hẹn Hò (#03) để mời một buổi cà phê bất ngờ.",
    productType: "SINGLE",
    isFeatured: true,
    sortOrder: 5,
    tags: ["Móc khóa", "Kỷ niệm"],
    occasionTags: ["Tốt nghiệp", "Cảm ơn", "Hẹn hò"],
    images: ["/assets/shop/samples/set-5.jpg"],
    boxSpecs: { size: "12 × 12 × 4 cm" },
    comboItems: [],
    defaultTemplateId: "thiep-3",
    variants: [
      {
        sku: "DDG-MK-CHU",
        name: "Vàng Champagne • Mặt 3.5cm",
        colorName: "Champagne",
        colorHex: "#C9A25B",
        sizeLabel: "3.5cm",
        materialLabel: "Kim loại phủ men",
        priceVnd: 99000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-5.jpg",
        isDefault: true,
      },
    ],
  },
  {
    categorySlug: "hop-qua",
    slug: "set-dong-am",
    name: "Set Đông Ấm (Khăn + Găng tay + Thiệp QR)",
    subtitle: "Combo trọn vẹn cho mùa lạnh • Hộp nơ cao cấp",
    shortDesc: "Combo Khăn len + Găng tay Cozy Day + Thiệp QR độc bản.",
    description:
      "Bộ đôi giữ ấm đồng điệu màu sắc được xếp gọn trong hộp cứng lót giấy nến, kèm sẵn 1 thiệp QR mở ra bản nhạc và lời chúc cá nhân.",
    materialCare: "Bảo quản nơi thoáng mát, giặt tay nhẹ với khăn & găng.",
    giftNote: "Có thể cá nhân hóa nội dung thiệp ngay trước khi thêm vào giỏ.",
    productType: "COMBO",
    isFeatured: true,
    sortOrder: 6,
    tags: ["Combo", "Mùa đông"],
    occasionTags: ["Giáng sinh", "Sinh nhật", "Kỷ niệm"],
    images: ["/assets/shop/samples/set-6.jpg", "/assets/shop/samples/set-1.jpg"],
    boxSpecs: { size: "28 × 24 × 9 cm" },
    comboItems: [
      "01 Khăn len Sương Mai",
      "01 Đôi găng tay Cozy Day",
      "01 Hộp quà giấy nến & Thiệp QR độc bản",
    ],
    defaultTemplateId: "thiep-xmas",
    variants: [
      {
        sku: "DDG-CB-DONGAM-KEM",
        name: "Tông Xám Kem • Full Set",
        colorName: "Xám Kem",
        colorHex: "#6D6E71",
        sizeLabel: "Hộp Set 28×24cm",
        materialLabel: "Len mềm + Hộp cứng",
        priceVnd: 379000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-6.jpg",
        isDefault: true,
      },
    ],
  },
  {
    categorySlug: "hop-qua",
    slug: "set-yeu-xa",
    name: "Set Yêu Xa (Khăn + Móc khóa + Thiệp 3D)",
    subtitle: "Gửi hơi ấm xuyên khoảng cách • Kèm thiệp QR riêng tư",
    shortDesc: "Combo Khăn len kem sữa + Móc khóa Trái Tim + Thiệp 3D.",
    description:
      "Món quà tinh tế dành cho những cặp đôi hoặc bạn thân ở xa nhau: chiếc khăn ấm cho những tối se lạnh và móc khóa để nhớ về nhau mỗi ngày.",
    materialCare: "Giặt tay nhẹ với khăn, lau khô móc khóa.",
    giftNote: "Người nhận chỉ cần quét QR in trên thẻ thiệp bên trong hộp để mở lời chúc.",
    productType: "COMBO",
    isFeatured: true,
    sortOrder: 7,
    tags: ["Combo", "Yêu xa"],
    occasionTags: ["Yêu xa", "Kỷ niệm", "Sinh nhật"],
    images: ["/assets/shop/samples/set-7.jpg"],
    boxSpecs: { size: "28 × 22 × 8 cm" },
    comboItems: [
      "01 Khăn len Sương Mai",
      "01 Móc khóa Trái Tim Nhung",
      "01 Hộp quà cao cấp & Thiệp QR 3D",
    ],
    defaultTemplateId: "thiep-5",
    variants: [
      {
        sku: "DDG-CB-YEUXA",
        name: "Kem Trái Tim • Full Set",
        colorName: "Kem Đỏ Hồng",
        colorHex: "#F5D7DE",
        sizeLabel: "Hộp Set 28×22cm",
        materialLabel: "Len + Nhung mịn",
        priceVnd: 319000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-7.jpg",
        isDefault: true,
      },
    ],
  },
  {
    categorySlug: "hop-qua",
    slug: "set-qua-tri-an",
    name: "Set Quà Tri Ân (Ly thủy tinh + Hoa khô + Thiệp QR)",
    subtitle: "Hộp quà pastel tinh tế • Kèm thiệp cảm ơn QR",
    shortDesc: "Set hộp quà hoa pastel gồm ly thủy tinh nắp tre, bó hoa khô và thiệp QR.",
    description:
      "Hộp quà xinh xắn phù hợp tặng bạn bè, thầy cô, đồng nghiệp hoặc sinh nhật. Mỗi hộp đi kèm thẻ QR dẫn tới thiệp chúc mừng riêng tư.",
    materialCare: "Rửa nhẹ ly thủy tinh bằng tay, giữ hoa khô nơi khô ráo.",
    giftNote: "Có thể viết lời chúc và chọn nhạc nền riêng trước khi đặt hàng.",
    productType: "COMBO",
    isFeatured: true,
    sortOrder: 8,
    tags: ["Combo", "Tri ân"],
    occasionTags: ["Cảm ơn", "Sinh nhật", "20/11", "8/3 & 20/10"],
    images: ["/assets/shop/samples/set-8.jpg"],
    boxSpecs: { size: "24 × 20 × 10 cm" },
    comboItems: [
      "01 Ly thủy tinh nắp tre",
      "01 Bó hoa khô mini",
      "01 Hộp quà hoa pastel & Thiệp QR",
    ],
    defaultTemplateId: "thiep-8",
    variants: [
      {
        sku: "DDG-CB-TRIAN",
        name: "Hộp Pastel • Full Set",
        colorName: "Hồng Pastel",
        colorHex: "#F6D5DE",
        sizeLabel: "Hộp Set 24×20cm",
        materialLabel: "Hộp cứng + Thủy tinh",
        priceVnd: 199000,
        compareAtVnd: null,
        imageUrl: "/assets/shop/samples/set-8.jpg",
        isDefault: true,
      },
    ],
  },
];

export async function seedShopCatalog(db: PrismaClient = prisma) {
  // 1. Seed default shop settings only if missing
  await db.systemSetting.upsert({
    where: { key: SHOP_SETTINGS_KEY },
    update: {},
    create: {
      key: SHOP_SETTINGS_KEY,
      valueJson: JSON.stringify(DEFAULT_SHOP_SETTINGS),
      updatedBy: "system-seed",
    },
  });

  // 2. Seed 4 standard shop categories
  const categoryMap = new Map<string, string>();
  for (const cat of SHOP_CATEGORIES_SEED) {
    const row = await db.storeCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        iconName: cat.iconName,
        coverImage: cat.coverImage,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, row.id);
  }

  // 3. Seed 7 realistic products STRICTLY AS DRAFT + onHand = 0 (admin enters real info/stock to publish)
  for (const prod of DRAFT_PRODUCTS_SEED) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) continue;

    const existing = await db.storeProduct.findUnique({
      where: { slug: prod.slug },
    });
    if (existing) continue;

    const createdProd = await db.storeProduct.create({
      data: {
        categoryId,
        slug: prod.slug,
        name: prod.name,
        subtitle: prod.subtitle,
        shortDesc: prod.shortDesc,
        description: prod.description,
        materialCare: prod.materialCare,
        giftNote: prod.giftNote,
        productType: prod.productType,
        status: "DRAFT",
        isFeatured: prod.isFeatured,
        sortOrder: prod.sortOrder,
        tagsJson: JSON.stringify(prod.tags),
        occasionTagsJson: JSON.stringify(prod.occasionTags),
        imagesJson: JSON.stringify(prod.images),
        boxSpecsJson: JSON.stringify(prod.boxSpecs),
        comboItemsJson: JSON.stringify(prod.comboItems),
        cardIncluded: true,
        cardPriceVnd: 0,
        eligibleTemplateIdsJson: JSON.stringify([]),
        defaultTemplateId: prod.defaultTemplateId,
      },
    });

    for (let idx = 0; idx < prod.variants.length; idx += 1) {
      const v = prod.variants[idx];
      const existingVariant = await db.storeVariant.findUnique({
        where: { sku: v.sku },
      });
      if (existingVariant) continue;

      const createdVariant = await db.storeVariant.create({
        data: {
          productId: createdProd.id,
          sku: v.sku,
          name: v.name,
          colorName: v.colorName,
          colorHex: v.colorHex,
          sizeLabel: v.sizeLabel,
          materialLabel: v.materialLabel,
          priceVnd: v.priceVnd,
          compareAtVnd: v.compareAtVnd,
          imageUrl: v.imageUrl,
          isActive: true,
          isDefault: v.isDefault,
          sortOrder: idx,
        },
      });

      await db.storeInventory.create({
        data: {
          variantId: createdVariant.id,
          onHand: 0,
          reserved: 0,
          lowStockThreshold: 5,
        },
      });
    }
  }
}

/**
 * Idempotently seeds all sample gift products, syncs their studio sample photos/copy,
 * activates them (`status: "ACTIVE"`), and ensures zero-stock sample variants start with `stockPerVariant`.
 */
export async function syncAndActivateSampleShopCatalog(
  db: PrismaClient = prisma,
  stockPerVariant = 15
) {
  await seedShopCatalog(db);

  for (const prod of DRAFT_PRODUCTS_SEED) {
    const existing = await db.storeProduct.findUnique({
      where: { slug: prod.slug },
      include: { variants: { include: { inventory: true } } },
    });
    if (!existing) continue;

    await db.storeProduct.update({
      where: { id: existing.id },
      data: {
        shortDesc: prod.shortDesc,
        tagsJson: JSON.stringify(prod.tags),
        imagesJson: JSON.stringify(prod.images),
        isFeatured: prod.isFeatured,
        sortOrder: prod.sortOrder,
        status: "ACTIVE",
      },
    });

    for (const seedVar of prod.variants) {
      const matched = existing.variants.find((v) => v.sku === seedVar.sku);
      if (!matched) continue;

      await db.storeVariant.update({
        where: { id: matched.id },
        data: {
          name: seedVar.name,
          colorName: seedVar.colorName,
          imageUrl: seedVar.imageUrl,
          isActive: true,
        },
      });

      if (!matched.inventory) {
        await db.storeInventory.create({
          data: {
            variantId: matched.id,
            onHand: stockPerVariant,
            reserved: 0,
            lowStockThreshold: 5,
          },
        });
      } else if (matched.inventory.onHand <= 0) {
        await db.storeInventory.update({
          where: { variantId: matched.id },
          data: { onHand: stockPerVariant },
        });
      }
    }
  }
}
