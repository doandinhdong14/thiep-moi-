import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  generateOrderAccessToken,
  hashOrderAccessToken,
  maskEmail,
  maskName,
  maskPhone,
  maskStreetAddress,
  saveOrderAccessToCookie,
} from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { serializeOrderSafeForCustomer } from "@/lib/shop/checkout";
import { releaseExpiredReservations } from "@/lib/shop/inventory";

const LookupSchema = z.object({
  orderCode: z.string().trim().min(4).max(40),
  contact: z.string().trim().min(4, "Nhập số điện thoại hoặc email đặt hàng").max(120),
});

function normalizeContactPhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "").replace(/^\+84/, "0");
}

export async function POST(req: Request) {
  try {
    await releaseExpiredReservations().catch(() => 0);
    const body = LookupSchema.parse(await req.json());
    const codeNormalized = body.orderCode.toUpperCase();

    const order = await prisma.storeOrder.findUnique({
      where: { orderCode: codeNormalized },
      include: {
        items: true,
        giftUnits: { orderBy: { unitIndex: "asc" } },
        shipments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return apiError(
        "Không tìm thấy đơn hàng hoặc thông tin xác nhận chưa khớp.",
        "ORDER_LOOKUP_FAILED",
        404,
      );
    }

    const inputContact = body.contact.trim();
    const phoneInput = normalizeContactPhone(inputContact);
    const customerPhoneNorm = normalizeContactPhone(order.customerPhone);
    const recipientPhoneNorm = normalizeContactPhone(order.recipientPhone);

    const matchedEmail =
      Boolean(order.customerEmail) &&
      order.customerEmail!.toLowerCase() === inputContact.toLowerCase();
    const matchedPhone =
      phoneInput.length >= 9 &&
      (phoneInput === customerPhoneNorm || phoneInput === recipientPhoneNorm);

    if (!matchedEmail && !matchedPhone) {
      return apiError(
        "Không tìm thấy đơn hàng hoặc thông tin xác nhận chưa khớp.",
        "ORDER_LOOKUP_FAILED",
        404,
      );
    }

    // Grant signed guest order cookie using fresh rotated or existing verified session?
    // Keep existing hash valid if present, otherwise issue a new session access token cleanly:
    const newAccessToken = generateOrderAccessToken();
    await prisma.storeOrder.update({
      where: { id: order.id },
      data: { guestAccessTokenHash: hashOrderAccessToken(newAccessToken) },
    });

    const serialized = serializeOrderSafeForCustomer(order, true, {
      maskName,
      maskPhone,
      maskEmail,
      maskStreetAddress,
    });

    const res = apiSuccess({
      order: serialized,
      accessToken: newAccessToken,
    });
    saveOrderAccessToCookie(res, order.orderCode, newAccessToken);
    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

