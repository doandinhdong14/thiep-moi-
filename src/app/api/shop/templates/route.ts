import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  getEligibleShopTemplates,
  MESSAGE_SUGGESTIONS,
  SHOP_MUSIC_TRACKS,
} from "@/lib/shop/gift-card";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filterParam = url.searchParams.get("eligible") || "";
    const eligible = filterParam
      ? filterParam.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const { templates, fallbackSlug } = await getEligibleShopTemplates(eligible);
    return apiSuccess({
      templates,
      fallbackSlug,
      musicTracks: SHOP_MUSIC_TRACKS,
      messageSuggestions: MESSAGE_SUGGESTIONS,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

