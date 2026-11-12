import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { slugifyVi } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

const CreateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  iconName: z.string().trim().max(40).optional(),
  coverImage: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(999).default(10),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireShopStaff();
    const categories = await prisma.storeCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });
    return apiSuccess(categories);
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireShopStaff();
    const body = CreateCategorySchema.parse(await req.json());
    const slug = slugifyVi(body.slug || body.name);
    if (!slug) {
      return apiError("Slug danh mục không hợp lệ.", "INVALID_SLUG", 400);
    }
    const exists = await prisma.storeCategory.findUnique({ where: { slug } });
    if (exists) {
      return apiError("Slug danh mục đã tồn tại.", "DUPLICATE_SLUG", 409);
    }

    const created = await prisma.storeCategory.create({
      data: {
        slug,
        name: body.name,
        description: body.description || null,
        iconName: body.iconName || "gift",
        coverImage: body.coverImage || null,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });
    return apiSuccess(created, 201);
  } catch (err) {
    return handleShopApiError(err);
  }
}

