import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { getPublicShopSettings } from "@/lib/shop/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPublicShopSettings();
    return apiSuccess(settings);
  } catch (err) {
    return handleShopApiError(err);
  }
}

