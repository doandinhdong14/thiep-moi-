import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";

const UpdateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  coverImage: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireShopStaff();
    const existing = await prisma.storeCategory.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return apiError("Không tìm thấy danh mục.", "NOT_FOUND", 404);
    }
    const body = UpdateCategorySchema.parse(await req.json());
    const updated = await prisma.storeCategory.update({
      where: { id: params.id },
      data: body,
    });
    return apiSuccess(updated);
  } catch (err) {
    return handleShopApiError(err);
  }
}

