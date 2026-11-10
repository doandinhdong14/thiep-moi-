import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

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
  } else if (purpose === "gift_unlock") {
    const giftId = context.giftId || order.lines[0]?.referenceId;
    if (giftId) {
      await tx.invitation.update({
        where: { id: giftId },
        data: {
          status: "PUBLISHED",
          publishedAt: now,
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  } else if (purpose === "gift_renewal") {
    const giftId = context.giftId || order.lines[0]?.referenceId;
    if (giftId) {
      const inv = await tx.invitation.findUnique({ where: { id: giftId } });
      const currentExpiry = inv?.expiresAt && inv.expiresAt > now ? inv.expiresAt : now;
      const newExpiry = new Date(currentExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
      await tx.invitation.update({
        where: { id: giftId },
        data: { expiresAt: newExpiry },
      });
    }
  }
}
