import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, createSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { CATALOG_PRODUCTS, TEST_MEDIA_CREDIT_PRICE_VND, TEST_PRODUCT_PRICE_VND } from "@/data/catalogData";
import { syncPendingPayOSOrdersForUser } from "@/lib/payments/payos";

const CreateOrderSchema = z.object({
  purpose: z.enum([
    "gift_unlock",
    "image_credits",
    "audio_credits",
    "gift_renewal",
    "gift_upgrade",
    "tip",
  ]),
  giftId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  amountVnd: z.number().int().nonnegative().optional(),
  returnContext: z
    .object({
      giftId: z.string().optional(),
      step: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    let user = await getCurrentUser();

    // If no user session, bootstrap an active guest user
    if (!user) {
      const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@dingdonggift.vn`;
      const newUser = await prisma.user.create({
        data: {
          email: guestEmail,
          name: "Khách Mua Hàng",
          status: "ACTIVE",
        },
      });
      await createSession(newUser.id, req.headers.get("user-agent") || undefined);
      user = {
        ...newUser,
        roles: [],
      };
    }

    const body = await req.json();
    const data = CreateOrderSchema.parse(body);

    let unitPriceVnd = 0;
    let totalVnd = 0;
    let titleSnapshot = "Dịch vụ số";
    let productType = "DIGITAL_PLAN";
    let referenceId: string | null = null;

    if (data.purpose === "image_credits") {
      unitPriceVnd = TEST_MEDIA_CREDIT_PRICE_VND;
      totalVnd = data.quantity * unitPriceVnd;
      titleSnapshot = `Mua thêm ${data.quantity} lượt tải ảnh`;
      productType = "MEDIA_CREDIT";
    } else if (data.purpose === "audio_credits") {
      unitPriceVnd = TEST_MEDIA_CREDIT_PRICE_VND;
      totalVnd = data.quantity * unitPriceVnd;
      titleSnapshot = `Mua thêm ${data.quantity} lượt tải nhạc nền`;
      productType = "MEDIA_CREDIT";
    } else if (data.purpose === "tip") {
      unitPriceVnd = data.amountVnd || 20000;
      totalVnd = unitPriceVnd;
      titleSnapshot = `Ủng hộ shop Ding Dong Gift (${unitPriceVnd.toLocaleString("vi-VN")}đ)`;
      productType = "TIP";
    } else if (data.purpose === "gift_renewal") {
      const isOneMonth = data.amountVnd === 19000;
      unitPriceVnd = isOneMonth ? 19000 : 39000;
      totalVnd = unitPriceVnd;
      titleSnapshot = isOneMonth
        ? `Gia hạn thời hạn thiệp 1 tháng`
        : `Gia hạn thời hạn thiệp 1 năm`;
      productType = "RENEWAL";
      referenceId = data.giftId || null;
    } else if (data.purpose === "gift_unlock") {
      if (data.giftId) {
        const inv = await prisma.invitation.findUnique({
          where: { id: data.giftId },
          include: { templateVersion: { include: { template: true } } },
        });
        if (inv) {
          const catalogItem = CATALOG_PRODUCTS.find(
            (p) => p.slug === inv.templateVersion.template.slug
          );
          unitPriceVnd = catalogItem?.price ?? TEST_PRODUCT_PRICE_VND;
          titleSnapshot = `Mở khóa thiệp: ${inv.title}`;
          referenceId = inv.id;
        }
      }
      totalVnd = unitPriceVnd || TEST_PRODUCT_PRICE_VND;
      unitPriceVnd = totalVnd;
      productType = "GIFT_UNLOCK";
    } else {
      unitPriceVnd = TEST_PRODUCT_PRICE_VND;
      totalVnd = TEST_PRODUCT_PRICE_VND;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `DDG-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const durationDays =
      data.purpose === "gift_renewal"
        ? totalVnd <= 19000
          ? 30
          : 365
        : undefined;

    const purchaseContext = JSON.stringify({
      purpose: data.purpose,
      giftId: data.giftId,
      step: data.returnContext?.step,
      quantity: data.quantity,
      durationDays,
      returnContext: data.returnContext,
    });

    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        orderNumber,
        status: "PENDING",
        paymentStatus: "UNPAID",
        purpose: data.purpose,
        currency: "VND",
        subtotalVnd: totalVnd,
        discountVnd: 0,
        taxVnd: 0,
        totalVnd,
        purchaseContext,
        lines: {
          create: {
            productType,
            referenceId,
            titleSnapshot,
            quantity: data.quantity,
            unitPriceVnd,
            discountVnd: 0,
            taxVnd: 0,
            totalVnd,
            commissionEligible: true,
          },
        },
      },
      include: { lines: true },
    });

    await logAudit({
      actorId: user.id,
      action: "ORDER_CREATED",
      resourceType: "Order",
      resourceId: order.id,
      afterSummary: {
        orderNumber: order.orderNumber,
        purpose: data.purpose,
        totalVnd: order.totalVnd,
      },
    });

    return apiSuccess({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        purpose: data.purpose,
        totalVnd: order.totalVnd,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        returnContext: data.returnContext,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiSuccess({ orders: [] });
    }

    await syncPendingPayOSOrdersForUser(user.id);

    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}

