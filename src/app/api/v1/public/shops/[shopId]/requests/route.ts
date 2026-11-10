import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

const CreateRequestSchema = z.object({
  productId: z.string().optional(),
  requestedQty: z.number().int().min(1).default(1),
  note: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryAddress: z.string().optional(),
  contactPhone: z.string().min(8, "Vui lòng nhập số điện thoại liên hệ"),
  contactName: z.string().min(2, "Vui lòng nhập họ tên người liên hệ"),
  invitationId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: params.shopId },
    });

    if (!shop || shop.status !== "APPROVED") {
      return apiError("Cửa hàng không tồn tại hoặc chưa được kích hoạt.", "NOT_FOUND", 404);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Thông tin yêu cầu mua hàng không hợp lệ.", "VALIDATION_ERROR", 400);
    }

    const {
      productId,
      requestedQty,
      note,
      deliveryCity,
      deliveryAddress,
      contactPhone,
      contactName,
      invitationId,
    } = parsed.data;

    let buyerId: string;
    const currentUser = await getCurrentUser();
    if (currentUser) {
      buyerId = currentUser.id;
    } else {
      // Find or create guest user
      const guestEmail = `guest_${contactPhone.replace(/\D/g, "")}@dingdonggift.guest`;
      const guest = await prisma.user.upsert({
        where: { email: guestEmail },
        update: { name: contactName },
        create: {
          email: guestEmail,
          name: contactName,
        },
      });
      buyerId = guest.id;
    }

    const shopRequest = await prisma.shopRequest.create({
      data: {
        shopId: shop.id,
        buyerId,
        productId,
        invitationId,
        requestedQty,
        note,
        deliveryCity: deliveryCity || shop.city,
        deliveryAddress,
        recipientPhone: contactPhone,
        recipientName: contactName,
        status: "SUBMITTED",
      },
    });

    await logAudit({
      actorId: buyerId,
      actorRole: currentUser?.roles[0] || "GUEST",
      action: "SHOP_REQUEST_CREATED",
      resourceType: "ShopRequest",
      resourceId: shopRequest.id,
      afterSummary: {
        shopId: shop.id,
        productId,
        status: shopRequest.status,
      },
    });

    return apiSuccess({
      message: "Yêu cầu của bạn đã được gửi thành công tới cửa hàng.",
      request: {
        id: shopRequest.id,
        shopId: shopRequest.shopId,
        status: shopRequest.status,
        createdAt: shopRequest.createdAt,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
