import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError } from "@/lib/api/response";
import { safeJsonParse } from "./types";

export function handleShopApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "_root";
      fields[path] = issue.message;
    }
    return apiError(
      err.issues[0]?.message || "Dữ liệu không hợp lệ",
      "VALIDATION_ERROR",
      400,
      fields,
    );
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return apiError("Vui lòng đăng nhập để tiếp tục.", "UNAUTHORIZED", 401);
    }
    if (err.message === "FORBIDDEN") {
      return apiError("Bạn không có quyền thực hiện thao tác này.", "FORBIDDEN", 403);
    }
    if (err.message === "NOT_FOUND" || err.message === "ORDER_NOT_FOUND") {
      return apiError("Không tìm thấy dữ liệu yêu cầu.", "NOT_FOUND", 404);
    }
  }
  const anyErr = err as { code?: string; httpStatus?: number; message?: string; details?: unknown };
  if (anyErr?.httpStatus && anyErr?.code) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: anyErr.code,
          message: anyErr.message || "Lỗi nghiệp vụ",
          details: anyErr.details ?? null,
        },
      },
      { status: anyErr.httpStatus },
    );
  }
  console.error("[Shop API Error]:", err);
  return apiError("Có lỗi hệ thống xảy ra, vui lòng thử lại.", "INTERNAL_ERROR", 500);
}

export function getRequestBaseUrl(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function serializeStoreProduct(
  product: {
    id: string;
    categoryId: string;
    slug: string;
    name: string;
    subtitle: string | null;
    shortDesc: string | null;
    description: string | null;
    materialCare: string | null;
    giftNote: string | null;
    productType: string;
    status: string;
    isFeatured: boolean;
    sortOrder: number;
    tagsJson: string;
    occasionTagsJson: string;
    imagesJson: string;
    boxSpecsJson: string;
    comboItemsJson: string;
    cardIncluded: boolean;
    cardPriceVnd: number;
    eligibleTemplateIdsJson: string;
    defaultTemplateId: string | null;
    createdAt: Date;
    updatedAt: Date;
    category: {
      id: string;
      slug: string;
      name: string;
    };
    variants: {
      id: string;
      sku: string;
      name: string;
      colorName: string | null;
      colorHex: string | null;
      sizeLabel: string | null;
      materialLabel: string | null;
      priceVnd: number;
      compareAtVnd: number | null;
      imageUrl: string | null;
      isActive: boolean;
      isDefault: boolean;
      sortOrder: number;
      inventory: {
        onHand: number;
        reserved: number;
        lowStockThreshold: number;
      } | null;
    }[];
  },
  options?: { includeAdminFields?: boolean },
) {
  const activeVariants = options?.includeAdminFields
    ? product.variants
    : product.variants.filter((v) => v.isActive);

  const variants = activeVariants
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => {
      const onHand = v.inventory?.onHand ?? 0;
      const reserved = v.inventory?.reserved ?? 0;
      const available = Math.max(0, onHand - reserved);
      const lowThreshold = v.inventory?.lowStockThreshold ?? 5;
      return {
        id: v.id,
        sku: v.sku,
        name: v.name,
        colorName: v.colorName,
        colorHex: v.colorHex,
        sizeLabel: v.sizeLabel,
        materialLabel: v.materialLabel,
        priceVnd: v.priceVnd,
        compareAtVnd: v.compareAtVnd,
        imageUrl: v.imageUrl,
        isActive: v.isActive,
        isDefault: v.isDefault,
        sortOrder: v.sortOrder,
        availableStock: available,
        inStock: available > 0,
        lowStock: available > 0 && available <= lowThreshold,
        ...(options?.includeAdminFields
          ? {
              onHand,
              reserved,
              lowStockThreshold: lowThreshold,
            }
          : {}),
      };
    });

  const prices = variants.map((v) => v.priceVnd);
  const minPriceVnd = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPriceVnd = prices.length > 0 ? Math.max(...prices) : 0;
  const totalAvailableStock = variants.reduce((acc, v) => acc + v.availableStock, 0);

  return {
    id: product.id,
    categoryId: product.categoryId,
    category: product.category,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    shortDesc: product.shortDesc,
    description: product.description,
    materialCare: product.materialCare,
    giftNote: product.giftNote,
    productType: product.productType,
    status: product.status,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    tags: safeJsonParse<string[]>(product.tagsJson, []),
    occasionTags: safeJsonParse<string[]>(product.occasionTagsJson, []),
    images: safeJsonParse<string[]>(product.imagesJson, []),
    boxSpecs: safeJsonParse<Record<string, string>>(product.boxSpecsJson, {}),
    comboItems: safeJsonParse<string[]>(product.comboItemsJson, []),
    cardIncluded: product.cardIncluded,
    cardPriceVnd: product.cardPriceVnd,
    eligibleTemplateIds: safeJsonParse<string[]>(product.eligibleTemplateIdsJson, []),
    defaultTemplateId: product.defaultTemplateId,
    minPriceVnd,
    maxPriceVnd,
    totalAvailableStock,
    inStock: totalAvailableStock > 0,
    variants,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

