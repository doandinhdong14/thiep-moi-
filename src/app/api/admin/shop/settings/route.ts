import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { requireShopAdminOnly, requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  getShopSettings,
  saveShopSettings,
  ShopSettingsSchema,
} from "@/lib/shop/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireShopStaff();
    const settings = await getShopSettings();
    return apiSuccess(settings);
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireShopAdminOnly();
    const parsed = ShopSettingsSchema.parse(await req.json());
    const saved = await saveShopSettings(parsed, user.id);

    await prisma.storeAuditLog.create({
      data: {
        actorId: user.id,
        action: "SHOP_SETTINGS_UPDATED",
        targetType: "SystemSetting",
        targetId: "shop_store_settings_v1",
        summary: "Admin cập nhật cấu hình Cửa hàng quà (thanh toán, vận chuyển, chính sách).",
      },
    });

    return apiSuccess(saved);
  } catch (err) {
    return handleShopApiError(err);
  }
}

