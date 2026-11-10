import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { fulfillOrder } from "@/lib/payments/fulfillment";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireRole(["ADMIN"]);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
        buyer: true,
      },
    });

    if (!order) {
      return apiError("Không tìm thấy đơn hàng.", "NOT_FOUND", 404);
    }

    // Idempotent check
    if (order.status === "PAID") {
      return apiSuccess({
        message: "Đơn hàng đã được ghi nhận thanh toán trước đó.",
        order: { id: order.id, status: order.status, paidAt: order.paidAt },
      });
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return apiError(`Không thể duyệt đơn hàng có trạng thái: ${order.status}`, "INVALID_STATUS", 400);
    }

    // Atomic transaction for Order, PaymentAttempt, Entitlement, and Commission
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Update Order to PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paidAt: now,
        },
      });

      // 2. Update or create PaymentAttempt
      const pendingAttempt = await tx.paymentAttempt.findFirst({
        where: { orderId: order.id, status: "PENDING" },
      });

      if (pendingAttempt) {
        await tx.paymentAttempt.update({
          where: { id: pendingAttempt.id },
          data: {
            status: "PAID",
            paidAt: now,
          },
        });
      } else {
        await tx.paymentAttempt.create({
          data: {
            orderId: order.id,
            provider: "manual_review",
            status: "PAID",
            amountVnd: order.totalVnd,
            paidAt: now,
          },
        });
      }

      // Fulfill based on order purpose (media credits, gift unlock, renewal, etc.)
      await fulfillOrder(order.id, tx);

      // 3. Create Entitlements for digital plans
      let purchaseInvitationId: string | null = null;
      if (order.purchaseContext) {
        try {
          const parsed = JSON.parse(order.purchaseContext);
          purchaseInvitationId = parsed.invitationId || null;
        } catch {}
      }

      for (const line of order.lines) {
        if (line.productType === "DIGITAL_PLAN" && line.referenceId) {
          const plan = await tx.plan.findUnique({ where: { id: line.referenceId } });
          const durationDays = plan?.defaultDurationDays || 30;
          const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          await tx.entitlement.create({
            data: {
              ownerId: order.buyerId,
              planId: line.referenceId,
              invitationId: purchaseInvitationId,
              sourceOrderLineId: line.id,
              beginsAt: now,
              expiresAt,
              status: "ACTIVE",
            },
          });
        }
      }

      // 4. Commission ledger 10% for referred affiliate
      let commissionCreated = null;
      if (order.referredAffiliateId) {
        const affiliate = await tx.affiliateProfile.findUnique({
          where: { id: order.referredAffiliateId },
        });

        // Self-referral safety guard
        if (affiliate && affiliate.userId !== order.buyerId && affiliate.status === "APPROVED") {
          const defaultProgram = await tx.affiliateProgram.findFirst({
            where: { code: "DEFAULT_10", active: true },
          });

          if (defaultProgram) {
            // Eligible revenue = sum of commissionEligible lines
            const eligibleBaseVnd = order.lines
              .filter((l) => l.commissionEligible)
              .reduce((sum, l) => sum + l.totalVnd, 0);

            // integer 10% (1000 bps)
            const commissionAmountVnd = Math.floor((eligibleBaseVnd * defaultProgram.rateBps) / 10000);

            if (commissionAmountVnd > 0) {
              const holdDays = defaultProgram.holdDays || 14;
              const holdUntil = new Date(now.getTime() + holdDays * 24 * 60 * 60 * 1000);

              const comm = await tx.commission.create({
                data: {
                  orderId: order.id,
                  affiliateId: affiliate.id,
                  programId: defaultProgram.id,
                  programRateBpsSnapshot: defaultProgram.rateBps,
                  eligibleBaseVnd,
                  amountVnd: commissionAmountVnd,
                  status: "PENDING",
                  holdUntil,
                  approvedAt: now,
                },
              });

              await tx.commissionLedgerEntry.create({
                data: {
                  commissionId: comm.id,
                  affiliateId: affiliate.id,
                  type: "EARNED",
                  amountVnd: commissionAmountVnd,
                  idempotencyKey: `comm_earned_${order.id}`,
                  effectiveAt: now,
                },
              });

              commissionCreated = comm;
            }
          }
        }
      }

      return { updatedOrder, commission: commissionCreated };
    });

    await logAudit({
      actorId: admin.id,
      actorRole: "ADMIN",
      action: "ORDER_CONFIRMED_PAID",
      resourceType: "Order",
      resourceId: order.id,
      afterSummary: {
        orderNumber: order.orderNumber,
        totalVnd: order.totalVnd,
        commissionCreated: !!result.commission,
      },
    });

    return apiSuccess({
      message: "Đã xác nhận thanh toán thành công và cấp quyền dịch vụ.",
      order: {
        id: result.updatedOrder.id,
        orderNumber: result.updatedOrder.orderNumber,
        status: result.updatedOrder.status,
        paymentStatus: result.updatedOrder.paymentStatus,
        paidAt: result.updatedOrder.paidAt,
      },
      commission: result.commission
        ? {
            id: result.commission.id,
            amountVnd: result.commission.amountVnd,
            status: result.commission.status,
            holdUntil: result.commission.holdUntil,
          }
        : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
