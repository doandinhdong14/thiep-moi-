import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import { getShopActorFromRoles } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { getRecipientGiftLanding } from "@/lib/shop/gift-card";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { token: string } },
) {
  try {
    const url = new URL(req.url);
    const wantsPreview = url.searchParams.get("mode") === "preview";
    let isAdminPreview = false;

    if (wantsPreview) {
      const user = await getCurrentUser();
      if (user && getShopActorFromRoles(user.roles).canManageShop) {
        isAdminPreview = true;
      }
    }

    const payload = await getRecipientGiftLanding(params.token, {
      isAdminPreview,
    });

    if (!payload.found) {
      return NextResponse.json(
        { ok: false, data: payload, error: { code: "NOT_FOUND", message: "Liên kết quà không tồn tại." } },
        { status: 404 },
      );
    }

    return apiSuccess(payload);
  } catch (err) {
    return handleShopApiError(err);
  }
}

