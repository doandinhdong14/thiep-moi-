import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { openRecipientGiftCard } from "@/lib/shop/gift-card";

export async function POST(
  _req: Request,
  { params }: { params: { token: string } },
) {
  try {
    const result = await openRecipientGiftCard(params.token);

    if (result.state === "NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Liên kết quà không tồn tại." } },
        { status: 404 },
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, data: result, error: { code: result.state, message: "Thiệp hiện chưa thể mở." } },
        { status: 409 },
      );
    }

    return apiSuccess(result);
  } catch (err) {
    return handleShopApiError(err);
  }
}

