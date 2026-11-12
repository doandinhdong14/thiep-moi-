import { z } from "zod";
import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { getShopSettings } from "@/lib/shop/settings";
import { calculateShippingQuote, VIETNAM_PROVINCES } from "@/lib/shop/shipping";

const QuoteSchema = z.object({
  provinceCode: z.string().min(1).max(40),
  provinceName: z.string().max(80).optional(),
  subtotalVnd: z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
  try {
    const body = QuoteSchema.parse(await req.json());
    const settings = await getShopSettings();
    const quote = calculateShippingQuote(settings, body);
    return apiSuccess(quote);
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function GET() {
  return apiSuccess({ provinces: VIETNAM_PROVINCES });
}

