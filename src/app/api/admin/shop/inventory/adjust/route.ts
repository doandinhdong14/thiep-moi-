import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { adjustVariantInventory } from "@/lib/shop/inventory";

const AdjustSchema = z.object({
  variantId: z.string().min(1),
  deltaOnHand: z.number().int().min(-50000).max(50000),
  type: z.enum(["IMPORT", "ADJUST"]).default("ADJUST"),
  reason: z.string().trim().min(2, "Vui lòng ghi lý do nhập/điều chỉnh kho").max(240),
  lowStockThreshold: z.number().int().min(0).max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await requireShopStaff();
    const body = AdjustSchema.parse(await req.json());

    const updated = await adjustVariantInventory({
      variantId: body.variantId,
      deltaOnHand: body.deltaOnHand,
      type: body.type,
      reason: body.reason,
      actorId: user.id,
      lowStockThreshold: body.lowStockThreshold,
    });

    return apiSuccess({
      variantId: updated.variantId,
      onHand: updated.onHand,
      reserved: updated.reserved,
      available: Math.max(0, updated.onHand - updated.reserved),
      lowStockThreshold: updated.lowStockThreshold,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "CANNOT_REDUCE_BELOW_RESERVED") {
        return apiError(
          "Không thể giảm tồn thực thấp hơn số lượng đang được giữ cho đơn chờ thanh toán.",
          "BELOW_RESERVED",
          409,
        );
      }
      if (err.message === "CANNOT_ADJUST_BELOW_ZERO") {
        return apiError("Tồn kho không thể âm.", "NEGATIVE_STOCK", 400);
      }
    }
    return handleShopApiError(err);
  }
}

