import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils/slug";

async function ensureInvitationShareLink(
  invitationId: string,
  tx: Prisma.TransactionClient
) {
  const existing = await tx.shareLink.findFirst({
    where: { invitationId, status: "ACTIVE" },
  });
  if (!existing) {
    await tx.shareLink.create({
      data: {
        invitationId,
        shortCode: generateShortCode(),
        label: "DEFAULT_SHARE",
      },
    });
  }
}

export async function fulfillOrder(
  orderId: string,
  tx: Prisma.TransactionClient = prisma
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });

  if (!order) return;

  let context: any = {};
  if (order.purchaseContext) {
    try {
      context = JSON.parse(order.purchaseContext);
    } catch {}
  }

  const purpose = order.purpose || context.purpose;
  const now = new Date();
  const contextInvitationId: string | null =
    context.giftId || context.invitationId || null;

  if (purpose === "image_credits") {
    const qty = order.lines[0]?.quantity || context.quantity || 10;
    await tx.user.update({
      where: { id: order.buyerId },
      data: { imageCredits: { increment: qty } },
    });
  } else if (purpose === "audio_credits") {
    const qty = order.lines[0]?.quantity || context.quantity || 1;
    await tx.user.update({
      where: { id: order.buyerId },
      data: { audioCredits: { increment: qty } },
    });
  } else if (purpose === "gift_unlock" || purpose === "gift_upgrade") {
    const giftId = contextInvitationId || order.lines[0]?.referenceId;
    if (giftId) {
      const inv = await tx.invitation.findUnique({ where: { id: giftId } });
      if (inv) {
        const durationDays = Number(context.durationDays) || 30;
        const nextExpiry =
          inv.expiresAt && inv.expiresAt > now
            ? inv.expiresAt
            : new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        await tx.invitation.update({
          where: { id: giftId },
          data: {
            status: "PUBLISHED",
            publishedAt: inv.publishedAt || now,
            expiresAt: nextExpiry,
          },
        });
        await ensureInvitationShareLink(giftId, tx);
      }
    }
  } else if (purpose === "gift_renewal") {
    const giftId = contextInvitationId || order.lines[0]?.referenceId;
    if (giftId) {
      const inv = await tx.invitation.findUnique({ where: { id: giftId } });
      if (inv) {
        const durationDays =
          Number(context.durationDays) || (order.totalVnd <= 19000 ? 30 : 365);
        const currentExpiry =
          inv.expiresAt && inv.expiresAt > now ? inv.expiresAt : now;
        const newExpiry = new Date(
          currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000
        );
        await tx.invitation.update({
          where: { id: giftId },
          data: {
            status: inv.status === "ARCHIVED" ? "ARCHIVED" : "PUBLISHED",
            publishedAt: inv.publishedAt || now,
            expiresAt: newExpiry,
          },
        });
        await ensureInvitationShareLink(giftId, tx);
      }
    }
  }

  // Create active Entitlements idempotently for DIGITAL_PLAN order lines
  for (const line of order.lines) {
    if (line.productType === "DIGITAL_PLAN" && line.referenceId) {
      const existingEnt = await tx.entitlement.findFirst({
        where: { sourceOrderLineId: line.id },
      });
      if (existingEnt) continue;

      const plan = await tx.plan.findUnique({ where: { id: line.referenceId } });
      const durationDays = plan?.defaultDurationDays || 30;
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await tx.entitlement.create({
        data: {
          ownerId: order.buyerId,
          planId: line.referenceId,
          invitationId: contextInvitationId,
          sourceOrderLineId: line.id,
          beginsAt: now,
          expiresAt,
          status: "ACTIVE",
        },
      });

      if (contextInvitationId) {
        const inv = await tx.invitation.findUnique({
          where: { id: contextInvitationId },
        });
        if (inv && inv.status !== "PUBLISHED") {
          await tx.invitation.update({
            where: { id: contextInvitationId },
            data: {
              status: "PUBLISHED",
              publishedAt: inv.publishedAt || now,
              expiresAt: inv.expiresAt && inv.expiresAt > now ? inv.expiresAt : expiresAt,
            },
          });
          await ensureInvitationShareLink(contextInvitationId, tx);
        }
      }
    }
  }
}

export async function createAffiliateCommissionForOrder(
  orderId: string,
  now: Date,
  tx: Prisma.TransactionClient
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order || !order.referredAffiliateId) return null;

  const affiliate = await tx.affiliateProfile.findUnique({
    where: { id: order.referredAffiliateId },
  });
  if (!affiliate || affiliate.userId === order.buyerId || affiliate.status !== "APPROVED") {
    return null;
  }

  const defaultProgram = await tx.affiliateProgram.findFirst({
    where: { code: "DEFAULT_10", active: true },
  });
  if (!defaultProgram) return null;

  const existingCommission = await tx.commission.findUnique({
    where: {
      orderId_programId: {
        orderId: order.id,
        programId: defaultProgram.id,
      },
    },
  });
  if (existingCommission) return existingCommission;

  const eligibleBaseVnd = order.lines
    .filter((l) => l.commissionEligible)
    .reduce((sum, l) => sum + l.totalVnd, 0);

  const commissionAmountVnd = Math.floor(
    (eligibleBaseVnd * defaultProgram.rateBps) / 10000
  );
  if (commissionAmountVnd <= 0) return null;

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

  return comm;
}
