import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError, serializeStoreProduct } from "@/lib/shop/api-helpers";

export const dynamic = "force-dynamic";

const UpdateVariantSchema = z.object({
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
  initialStock: z.number().int().min(0).max(100_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(1000).optional(),
});

const UpdateProductSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(140).optional(),
  subtitle: z.string().trim().max(200).nullable().optional(),
  shortDesc: z.string().trim().max(400).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  materialCare: z.string().trim().max(1000).nullable().optional(),
  giftNote: z.string().trim().max(500).nullable().optional(),
  productType: z.enum(["SINGLE", "COMBO", "ADDON"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  occasionTags: z.array(z.string().max(50)).max(20).optional(),
  images: z.array(z.string().max(500)).max(12).optional(),
  boxSpecs: z.record(z.string()).optional(),
  comboItems: z.array(z.string().max(120)).max(20).optional(),
  cardIncluded: z.boolean().optional(),
  cardPriceVnd: z.number().int().min(0).max(5_000_000).optional(),
  eligibleTemplateIds: z.array(z.string().max(60)).max(30).optional(),
  defaultTemplateId: z.string().max(60).nullable().optional(),
  variants: z.array(UpdateVariantSchema).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireShopStaff();
    const product = await prisma.storeProduct.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) {
      return apiError("Không tìm thấy sản phẩm.", "NOT_FOUND", 404);
    }
    return apiSuccess(serializeStoreProduct(product, { includeAdminFields: true }));
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireShopStaff();
    const existing = await prisma.storeProduct.findUnique({
      where: { id: params.id },
      include: { variants: { include: { inventory: true } } },
    });
    if (!existing) {
      return apiError("Không tìm thấy sản phẩm.", "NOT_FOUND", 404);
    }

    const body = UpdateProductSchema.parse(await req.json());

    const updated = await prisma.$transaction(async (tx) => {
      await tx.storeProduct.update({
        where: { id: params.id },
        data: {
          ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}),
          ...(body.shortDesc !== undefined ? { shortDesc: body.shortDesc } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.materialCare !== undefined ? { materialCare: body.materialCare } : {}),
          ...(body.giftNote !== undefined ? { giftNote: body.giftNote } : {}),
          ...(body.productType !== undefined ? { productType: body.productType } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.tags !== undefined ? { tagsJson: JSON.stringify(body.tags) } : {}),
          ...(body.occasionTags !== undefined
            ? { occasionTagsJson: JSON.stringify(body.occasionTags) }
            : {}),
          ...(body.images !== undefined ? { imagesJson: JSON.stringify(body.images) } : {}),
          ...(body.boxSpecs !== undefined
            ? { boxSpecsJson: JSON.stringify(body.boxSpecs) }
            : {}),
          ...(body.comboItems !== undefined
            ? { comboItemsJson: JSON.stringify(body.comboItems) }
            : {}),
          ...(body.cardIncluded !== undefined ? { cardIncluded: body.cardIncluded } : {}),
          ...(body.cardPriceVnd !== undefined ? { cardPriceVnd: body.cardPriceVnd } : {}),
          ...(body.eligibleTemplateIds !== undefined
            ? { eligibleTemplateIdsJson: JSON.stringify(body.eligibleTemplateIds) }
            : {}),
          ...(body.defaultTemplateId !== undefined
            ? { defaultTemplateId: body.defaultTemplateId }
            : {}),
        },
      });

      if (body.variants) {
        for (let idx = 0; idx < body.variants.length; idx += 1) {
          const v = body.variants[idx];
          if (v.id && existing.variants.some((ev) => ev.id === v.id)) {
            await tx.storeVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                name: v.name,
                colorName: v.colorName ?? null,
                colorHex: v.colorHex ?? null,
                sizeLabel: v.sizeLabel ?? null,
                materialLabel: v.materialLabel ?? null,
                priceVnd: v.priceVnd,
                compareAtVnd: v.compareAtVnd ?? null,
                imageUrl: v.imageUrl ?? null,
                isActive: v.isActive,
                isDefault: v.isDefault,
                sortOrder: idx,
              },
            });
            if (typeof v.lowStockThreshold === "number") {
              await tx.storeInventory.updateMany({
                where: { variantId: v.id },
                data: { lowStockThreshold: v.lowStockThreshold },
              });
            }
          } else {
            const createdVar = await tx.storeVariant.create({
              data: {
                productId: params.id,
                sku: v.sku,
                name: v.name,
                colorName: v.colorName ?? null,
                colorHex: v.colorHex ?? null,
                sizeLabel: v.sizeLabel ?? null,
                materialLabel: v.materialLabel ?? null,
                priceVnd: v.priceVnd,
                compareAtVnd: v.compareAtVnd ?? null,
                imageUrl: v.imageUrl ?? null,
                isActive: v.isActive,
                isDefault: v.isDefault,
                sortOrder: idx,
              },
            });
            const initQty = v.initialStock ?? 0;
            await tx.storeInventory.create({
              data: {
                variantId: createdVar.id,
                onHand: initQty,
                reserved: 0,
                lowStockThreshold: v.lowStockThreshold ?? 5,
              },
            });
            if (initQty > 0) {
              await tx.storeInventoryMovement.create({
                data: {
                  variantId: createdVar.id,
                  type: "IMPORT",
                  deltaOnHand: initQty,
                  deltaReserved: 0,
                  onHandAfter: initQty,
                  reservedAfter: 0,
                  reason: "Thêm biến thể mới",
                  actorId: user.id,
                },
              });
            }
          }
        }
      }

      await tx.storeAuditLog.create({
        data: {
          actorId: user.id,
          action: "PRODUCT_UPDATED",
          targetType: "StoreProduct",
          targetId: params.id,
          summary: `Cập nhật sản phẩm "${body.name || existing.name}" (${body.status || existing.status}).`,
        },
      });

      return tx.storeProduct.findUniqueOrThrow({
        where: { id: params.id },
        include: {
          category: { select: { id: true, slug: true, name: true } },
          variants: { include: { inventory: true }, orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return apiSuccess(serializeStoreProduct(updated, { includeAdminFields: true }));
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireShopStaff();
    const existing = await prisma.storeProduct.findUnique({ where: { id: params.id } });
    if (!existing) {
      return apiError("Không tìm thấy sản phẩm.", "NOT_FOUND", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.storeProduct.update({
        where: { id: params.id },
        data: { status: "ARCHIVED" },
      });
      await tx.storeAuditLog.create({
        data: {
          actorId: user.id,
          action: "PRODUCT_ARCHIVED",
          targetType: "StoreProduct",
          targetId: params.id,
          summary: `Lưu trữ sản phẩm "${existing.name}".`,
        },
      });
    });

    return apiSuccess({ archived: true, id: params.id });
  } catch (err) {
    return handleShopApiError(err);
  }
}

