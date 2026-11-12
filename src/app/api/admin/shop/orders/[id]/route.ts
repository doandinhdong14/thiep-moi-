import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { resolveTemplateMetaWithFallback } from "@/lib/shop/gift-card";
import { commitOrderStockOnPaymentInTx } from "@/lib/shop/inventory";
import { safeJsonParse, sanitizeTrackingUrl } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

const UpdateOrderSchema = z.object({
  status: z
    .enum([
      "PACKING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "PAID",
    ])
    .optional(),
  shippingFeeVnd: z.number().int().min(0).max(5_000_000).optional(),
  carrierName: z.string().trim().max(80).nullable().optional(),
  trackingCode: z.string().trim().max(80).nullable().optional(),
  trackingUrl: z.string().trim().max(400).nullable().optional(),
  shipmentNote: z.string().trim().max(400).nullable().optional(),
  internalNotes: z.string().trim().max(2000).nullable().optional(),
  unitPackingUpdate: z
    .object({
      unitId: z.string().min(1),
      packingStatus: z.enum(["PENDING", "SCANNED_VERIFIED", "PACKED"]),
    })
    .optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireShopStaff();
    const order = await prisma.storeOrder.findFirst({
      where: { OR: [{ id: params.id }, { orderCode: params.id.toUpperCase() }] },
      include: {
        items: true,
        giftUnits: {
          orderBy: { unitIndex: "asc" },
          include: { customization: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          include: { events: { orderBy: { createdAt: "desc" } } },
        },
        shipments: { orderBy: { createdAt: "desc" } },
        reservations: true,
        auditLogs: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    return apiSuccess({
      ...order,
      giftUnits: order.giftUnits.map((u) => {
        const tpl = resolveTemplateMetaWithFallback(u.templateSlug);
        return {
          id: u.id,
          unitIndex: u.unitIndex,
          unitLabel: u.unitLabel,
          boxReferenceCode: u.boxReferenceCode,
          templateSlug: u.templateSlug,
          templateTitle: tpl.title,
          previewImageUrl: `/previews/${tpl.slug}.webp`,
          cardPlanCode: u.cardPlanCode,
          durationDays: u.durationDays,
          cardUpgradeFeeVnd: u.cardUpgradeFeeVnd,
          giftWrapCode: u.giftWrapCode,
          giftWrapFeeVnd: u.giftWrapFeeVnd,
          cardState: u.cardState,
          packingStatus: u.packingStatus,
          isCardLocked: u.isCardLocked,
          readyAt: u.readyAt?.toISOString() ?? null,
          firstOpenedAt: u.firstOpenedAt?.toISOString() ?? null,
          expiresAt: u.expiresAt?.toISOString() ?? null,
          openCount: u.openCount,
          qrVersion: u.qrVersion,
          qrPrintedAt: u.qrPrintedAt?.toISOString() ?? null,
          qrVerifyCount: u.qrVerifyCount,
          cardSnapshot: safeJsonParse<Record<string, unknown>>(u.cardSnapshotJson, {}),
        };
      }),
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireShopStaff();
    const order = await prisma.storeOrder.findFirst({
      where: { OR: [{ id: params.id }, { orderCode: params.id.toUpperCase() }] },
      include: { shipments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    const body = UpdateOrderSchema.parse(await req.json());
    const now = new Date();

    if (body.trackingUrl && !sanitizeTrackingUrl(body.trackingUrl)) {
      return apiError(
        "Link tra cứu vận đơn phải dùng HTTPS và thuộc danh sách đơn vị vận chuyển hợp lệ.",
        "INVALID_TRACKING_URL",
        400,
      );
    }

    await prisma.$transaction(async (tx) => {
      if (body.unitPackingUpdate) {
        await tx.storeOrderGiftUnit.updateMany({
          where: { id: body.unitPackingUpdate.unitId, orderId: order.id },
          data: { packingStatus: body.unitPackingUpdate.packingStatus },
        });
      }

      if (typeof body.shippingFeeVnd === "number" && order.shippingQuoteRequired && order.paymentStatus !== "PAID") {
        const nextTotal = Math.max(
          0,
          order.subtotalVnd +
            order.giftWrapFeeVnd +
            order.giftCardFeeVnd +
            body.shippingFeeVnd -
            order.discountVnd,
        );
        await tx.storeOrder.update({
          where: { id: order.id },
          data: {
            shippingFeeVnd: body.shippingFeeVnd,
            shippingQuoteRequired: false,
            totalVnd: nextTotal,
          },
        });
        await tx.storePayment.updateMany({
          where: { orderId: order.id, status: "PENDING" },
          data: { amountVnd: nextTotal },
        });
      }

      if (body.status) {
        const isPrepaidUnpaid =
          order.paymentMethod !== "cod" &&
          order.paymentStatus !== "PAID" &&
          body.status !== "PAID";
        if (isPrepaidUnpaid) {
          throw new Error("ORDER_NOT_PAID_YET");
        }

        // If resolving STOCK_CONFLICT_REFUND_NEEDED after restocking
        if (order.status === "STOCK_CONFLICT_REFUND_NEEDED" && body.status === "PAID") {
          const commitRes = await commitOrderStockOnPaymentInTx(tx, order.id, user.id);
          if (!commitRes.ok) {
            throw new Error("STILL_OUT_OF_STOCK");
          }
          await tx.storeOrder.update({
            where: { id: order.id },
            data: { status: "PAID", needsStockResolution: false },
          });
          await tx.storeOrderGiftUnit.updateMany({
            where: { orderId: order.id, cardState: "PREPARING" },
            data: { cardState: "READY_UNOPENED", readyAt: now },
          });
        } else {
          // For COD entering PACKING/READY_TO_SHIP, commit reservation and unlock gift QR cards cleanly
          if (
            order.paymentMethod === "cod" &&
            ["PACKING", "READY_TO_SHIP", "SHIPPED"].includes(body.status)
          ) {
            const activeRes = await tx.storeStockReservation.count({
              where: { orderId: order.id, status: "ACTIVE" },
            });
            if (activeRes > 0) {
              const commitRes = await commitOrderStockOnPaymentInTx(tx, order.id, user.id);
              if (!commitRes.ok) throw new Error("STILL_OUT_OF_STOCK");
            }
            await tx.storeOrderGiftUnit.updateMany({
              where: { orderId: order.id, cardState: "PREPARING" },
              data: { cardState: "READY_UNOPENED", readyAt: now },
            });
          }

          await tx.storeOrder.update({
            where: { id: order.id },
            data: {
              status: body.status,
              ...(body.status === "PACKING" && !order.packingStartedAt
                ? { packingStartedAt: now }
                : {}),
              ...(body.status === "SHIPPED" && !order.shippedAt ? { shippedAt: now } : {}),
              ...(body.status === "DELIVERED" && !order.deliveredAt
                ? { deliveredAt: now }
                : {}),
              ...(body.status === "COMPLETED" && order.paymentMethod === "cod"
                ? { paymentStatus: "PAID", paidAt: order.paidAt ?? now }
                : {}),
            },
          });

          // Lock all cards once packing / shipping starts
          if (["PACKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "COMPLETED"].includes(body.status)) {
            await tx.storeOrderGiftUnit.updateMany({
              where: { orderId: order.id },
              data: { isCardLocked: true },
            });
            await tx.storeGiftCustomization.updateMany({
              where: { giftUnits: { some: { orderId: order.id } } },
              data: { status: "LOCKED", lockedAt: now },
            });
          }
        }
      }

      if (body.internalNotes !== undefined) {
        await tx.storeOrder.update({
          where: { id: order.id },
          data: { internalNotes: body.internalNotes },
        });
      }

      if (
        body.carrierName !== undefined ||
        body.trackingCode !== undefined ||
        body.trackingUrl !== undefined ||
        body.shipmentNote !== undefined ||
        (body.status && ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(body.status))
      ) {
        const nextShipStatus =
          body.status === "DELIVERED"
            ? "DELIVERED"
            : body.status === "SHIPPED"
              ? "IN_TRANSIT"
              : body.status === "READY_TO_SHIP"
                ? "READY_TO_SHIP"
                : order.shipments[0]?.status || "PENDING_PACK";

        const cleanUrl =
          body.trackingUrl !== undefined
            ? sanitizeTrackingUrl(body.trackingUrl)
            : order.shipments[0]?.trackingUrl || null;

        if (order.shipments[0]) {
          await tx.storeShipment.update({
            where: { id: order.shipments[0].id },
            data: {
              ...(body.carrierName !== undefined ? { carrierName: body.carrierName } : {}),
              ...(body.trackingCode !== undefined ? { trackingCode: body.trackingCode } : {}),
              ...(body.trackingUrl !== undefined ? { trackingUrl: cleanUrl } : {}),
              ...(body.shipmentNote !== undefined ? { note: body.shipmentNote } : {}),
              status: nextShipStatus,
              ...(nextShipStatus === "IN_TRANSIT" && !order.shipments[0].shippedAt
                ? { shippedAt: now }
                : {}),
              ...(nextShipStatus === "DELIVERED" && !order.shipments[0].deliveredAt
                ? { deliveredAt: now }
                : {}),
              updatedBy: user.id,
            },
          });
        } else {
          await tx.storeShipment.create({
            data: {
              orderId: order.id,
              carrierName: body.carrierName || null,
              trackingCode: body.trackingCode || null,
              trackingUrl: cleanUrl,
              note: body.shipmentNote || null,
              status: nextShipStatus,
              updatedBy: user.id,
            },
          });
        }
      }

      await tx.storeAuditLog.create({
        data: {
          orderId: order.id,
          actorId: user.id,
          action: "ORDER_ADMIN_UPDATED",
          targetType: "StoreOrder",
          targetId: order.id,
          summary: `Cập nhật vận hành đơn ${order.orderCode}${body.status ? ` → ${body.status}` : ""}.`,
          metaJson: JSON.stringify(body),
        },
      });
    });

    return apiSuccess({ updated: true, orderId: order.id });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "ORDER_NOT_PAID_YET") {
        return apiError(
          "Đơn thanh toán trước chưa được xác nhận thanh toán, chưa thể chuyển sang đóng gói/gửi hàng.",
          "UNPAID_ORDER_LOCKED",
          409,
        );
      }
      if (err.message === "STILL_OUT_OF_STOCK") {
        return apiError(
          "Tồn kho khả dụng vẫn chưa đủ cho đơn hàng này. Vui lòng nhập thêm hàng hoặc hoàn tiền.",
          "INSUFFICIENT_STOCK",
          409,
        );
      }
    }
    return handleShopApiError(err);
  }
}

