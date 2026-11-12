import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError, serializeStoreProduct } from "@/lib/shop/api-helpers";
import { slugifyVi } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

const VariantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2).max(60),
  name: z.string().trim().min(1).max(120),
  colorName: z.string().trim().max(60).nullable().optional(),
  colorHex: z.string().trim().max(20).nullable().optional(),
  sizeLabel: z.string().trim().max(60).nullable().optional(),
  materialLabel: z.string().trim().max(80).nullable().optional(),
  priceVnd: z.number().int().min(0).max(50_000_000),
  compareAtVnd: z.number().int().min(0).max(50_000_000).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  initialStock: z.number().int().min(0).max(100_000).default(0),
  lowStockThreshold: z.number().int().min(0).max(1000).default(5),
});

const CreateProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(200).nullable().optional(),
  shortDesc: z.string().trim().max(400).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  materialCare: z.string().trim().max(1000).nullable().optional(),
  giftNote: z.string().trim().max(500).nullable().optional(),
  productType: z.enum(["SINGLE", "COMBO", "ADDON"]).default("SINGLE"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).default(10),
  tags: z.array(z.string().max(50)).max(20).default([]),
  occasionTags: z.array(z.string().max(50)).max(20).default([]),
  images: z.array(z.string().max(500)).max(12).default([]),
  boxSpecs: z.record(z.string()).default({}),
  comboItems: z.array(z.string().max(120)).max(20).default([]),
  cardIncluded: z.boolean().default(true),
  cardPriceVnd: z.number().int().min(0).max(5_000_000).default(0),
  eligibleTemplateIds: z.array(z.string().max(60)).max(30).default([]),
  defaultTemplateId: z.string().max(60).nullable().optional(),
  variants: z.array(VariantInputSchema).min(1, "Cần ít nhất 1 phân loại sản phẩm").max(30),
});

export async function GET(req: Request) {
  try {
    await requireShopStaff();
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    const products = await prisma.storeProduct.findMany({
      where:
        statusFilter && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(statusFilter)
          ? { status: statusFilter }
          : undefined,
      include: {
        category: { select: { id: true, slug: true, name: true } },
        variants: {
          include: { inventory: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return apiSuccess(
      products.map((p) => serializeStoreProduct(p, { includeAdminFields: true })),
    );
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireShopStaff();
    const body = CreateProductSchema.parse(await req.json());
    const baseSlug = slugifyVi(body.slug || body.name);
    if (!baseSlug) {
      return apiError("Tên hoặc slug sản phẩm không hợp lệ.", "INVALID_SLUG", 400);
    }

    const duplicateSlug = await prisma.storeProduct.findUnique({
      where: { slug: baseSlug },
    });
    const finalSlug = duplicateSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    for (const v of body.variants) {
      const existingSku = await prisma.storeVariant.findUnique({ where: { sku: v.sku } });
      if (existingSku) {
        return apiError(`Mã SKU "${v.sku}" đã tồn tại.`, "DUPLICATE_SKU", 409);
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.storeProduct.create({
        data: {
          categoryId: body.categoryId,
          slug: finalSlug,
          name: body.name,
          subtitle: body.subtitle || null,
          shortDesc: body.shortDesc || null,
          description: body.description || null,
          materialCare: body.materialCare || null,
          giftNote: body.giftNote || null,
          productType: body.productType,
          status: body.status,
          isFeatured: body.isFeatured,
          sortOrder: body.sortOrder,
          tagsJson: JSON.stringify(body.tags),
          occasionTagsJson: JSON.stringify(body.occasionTags),
          imagesJson: JSON.stringify(body.images),
          boxSpecsJson: JSON.stringify(body.boxSpecs),
          comboItemsJson: JSON.stringify(body.comboItems),
          cardIncluded: body.cardIncluded,
          cardPriceVnd: body.cardPriceVnd,
          eligibleTemplateIdsJson: JSON.stringify(body.eligibleTemplateIds),
          defaultTemplateId: body.defaultTemplateId || null,
        },
      });

      for (let i = 0; i < body.variants.length; i += 1) {
        const v = body.variants[i];
        const variant = await tx.storeVariant.create({
          data: {
            productId: product.id,
            sku: v.sku,
            name: v.name,
            colorName: v.colorName || null,
            colorHex: v.colorHex || null,
            sizeLabel: v.sizeLabel || null,
            materialLabel: v.materialLabel || null,
            priceVnd: v.priceVnd,
            compareAtVnd: v.compareAtVnd ?? null,
            imageUrl: v.imageUrl || null,
            isActive: v.isActive,
            isDefault: i === 0 ? true : v.isDefault,
            sortOrder: i,
          },
        });
        await tx.storeInventory.create({
          data: {
            variantId: variant.id,
            onHand: v.initialStock,
            reserved: 0,
            lowStockThreshold: v.lowStockThreshold,
          },
        });
        if (v.initialStock > 0) {
          await tx.storeInventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "IMPORT",
              deltaOnHand: v.initialStock,
              deltaReserved: 0,
              onHandAfter: v.initialStock,
              reservedAfter: 0,
              reason: "Khởi tạo tồn kho ban đầu khi tạo sản phẩm",
              actorId: user.id,
            },
          });
        }
      }

      await tx.storeAuditLog.create({
        data: {
          actorId: user.id,
          action: "PRODUCT_CREATED",
          targetType: "StoreProduct",
          targetId: product.id,
          summary: `Tạo sản phẩm "${product.name}" (${product.status}).`,
        },
      });

      return tx.storeProduct.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          category: { select: { id: true, slug: true, name: true } },
          variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return apiSuccess(
      serializeStoreProduct(created, { includeAdminFields: true }),
      201,
    );
  } catch (err) {
    return handleShopApiError(err);
  }
}

