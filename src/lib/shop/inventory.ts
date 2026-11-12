import type { Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

export type PrismaTx = Prisma.TransactionClient | PrismaClient;

export class OutOfStockError extends Error {
  variantId: string;
  available: number;
  requested: number;

  constructor(variantId: string, requested: number, available = 0) {
    super("OUT_OF_STOCK");
    this.variantId = variantId;
    this.requested = requested;
    this.available = available;
  }
}

export async function releaseExpiredReservations(limit = 50): Promise<number> {
  const now = new Date();
  const expired = await prisma.storeStockReservation.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
      order: {
        status: "PENDING_PAYMENT",
      },
    },
    take: limit,
    orderBy: { expiresAt: "asc" },
  });

  if (expired.length === 0) return 0;

  let releasedCount = 0;
  const affectedOrderIds = new Set<string>();

  for (const res of expired) {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.storeStockReservation.updateMany({
        where: { id: res.id, status: "ACTIVE" },
        data: { status: "EXPIRED", releasedAt: now },
      });
      if (claim.count === 0) return;

      await tx.$executeRaw`
        UPDATE "StoreInventory"
        SET "reserved" = CASE WHEN "reserved" >= ${res.quantity} THEN "reserved" - ${res.quantity} ELSE 0 END
        WHERE "variantId" = ${res.variantId}
      `;

      const inv = await tx.storeInventory.findUnique({
        where: { variantId: res.variantId },
      });

      if (inv) {
        await tx.storeInventoryMovement.create({
          data: {
            variantId: res.variantId,
            type: "RELEASE",
            deltaOnHand: 0,
            deltaReserved: -res.quantity,
            onHandAfter: inv.onHand,
            reservedAfter: inv.reserved,
            orderId: res.orderId,
            reason: "Tự động nhả giữ kho do hết hạn thanh toán",
          },
        });
      }

      affectedOrderIds.add(res.orderId);
      releasedCount += 1;
    });
  }

  for (const orderId of Array.from(affectedOrderIds)) {
    const activeLeft = await prisma.storeStockReservation.count({
      where: { orderId, status: "ACTIVE" },
    });
    if (activeLeft === 0) {
      await prisma.$transaction(async (tx) => {
        const orderUpdate = await tx.storeOrder.updateMany({
          where: { id: orderId, status: "PENDING_PAYMENT" },
          data: { status: "EXPIRED" },
        });
        if (orderUpdate.count > 0) {
          await tx.storePayment.updateMany({
            where: { orderId, status: "PENDING" },
            data: { status: "EXPIRED" },
          });
          await tx.storeOrderGiftUnit.updateMany({
            where: { orderId, cardState: "PREPARING" },
            data: { cardState: "DISABLED" },
          });
          await tx.storeAuditLog.create({
            data: {
              orderId,
              action: "ORDER_RESERVATION_EXPIRED",
              targetType: "StoreOrder",
              targetId: orderId,
              summary: "Đơn hết hạn giữ hàng do quá thời gian thanh toán.",
            },
          });
        }
      });
    }
  }

  return releasedCount;
}

export async function reserveVariantStockInTx(
  tx: PrismaTx,
  params: {
    variantId: string;
    quantity: number;
    orderId: string;
    expiresAt: Date;
    reason?: string;
    actorId?: string | null;
  },
): Promise<void> {
  const { variantId, quantity, orderId, expiresAt, reason, actorId } = params;
  if (quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }

  const updatedRows = await tx.$executeRaw`
    UPDATE "StoreInventory"
    SET "reserved" = "reserved" + ${quantity}
    WHERE "variantId" = ${variantId}
      AND ("onHand" - "reserved") >= ${quantity}
  `;

  const inv = await tx.storeInventory.findUnique({ where: { variantId } });
  if (updatedRows === 0) {
    const available = inv ? Math.max(0, inv.onHand - inv.reserved) : 0;
    throw new OutOfStockError(variantId, quantity, available);
  }

  await tx.storeStockReservation.create({
    data: {
      orderId,
      variantId,
      quantity,
      status: "ACTIVE",
      expiresAt,
    },
  });

  if (inv) {
    await tx.storeInventoryMovement.create({
      data: {
        variantId,
        type: "RESERVE",
        deltaOnHand: 0,
        deltaReserved: quantity,
        onHandAfter: inv.onHand,
        reservedAfter: inv.reserved,
        orderId,
        reason: reason || "Giữ kho khi tạo đơn checkout",
        actorId: actorId ?? null,
      },
    });
  }
}

export async function commitOrderStockOnPaymentInTx(
  tx: PrismaTx,
  orderId: string,
  actorId?: string | null,
): Promise<{ ok: true } | { ok: false; reason: "STOCK_CONFLICT" }> {
  const now = new Date();
  const activeReservations = await tx.storeStockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
  });

  if (activeReservations.length > 0) {
    for (const res of activeReservations) {
      const claim = await tx.storeStockReservation.updateMany({
        where: { id: res.id, status: "ACTIVE" },
        data: { status: "COMMITTED", committedAt: now },
      });
      if (claim.count === 0) continue;

      const updated = await tx.$executeRaw`
        UPDATE "StoreInventory"
        SET "onHand" = "onHand" - ${res.quantity},
            "reserved" = CASE WHEN "reserved" >= ${res.quantity} THEN "reserved" - ${res.quantity} ELSE 0 END
        WHERE "variantId" = ${res.variantId}
          AND "onHand" >= ${res.quantity}
      `;
      if (updated === 0) {
        return { ok: false, reason: "STOCK_CONFLICT" };
      }

      const inv = await tx.storeInventory.findUnique({
        where: { variantId: res.variantId },
      });
      if (inv) {
        await tx.storeInventoryMovement.create({
          data: {
            variantId: res.variantId,
            type: "SALE_DEDUCT",
            deltaOnHand: -res.quantity,
            deltaReserved: -res.quantity,
            onHandAfter: inv.onHand,
            reservedAfter: inv.reserved,
            orderId,
            reason: "Trừ tồn thực khi đơn được xác nhận thanh toán",
            actorId: actorId ?? null,
          },
        });
      }
    }
    return { ok: true };
  }

  // Reservations were expired or released before late payment arrived -> check real available stock
  const items = await tx.storeOrderItem.findMany({
    where: { orderId },
  });

  for (const item of items) {
    if (!item.variantId) {
      return { ok: false, reason: "STOCK_CONFLICT" };
    }
    const deducted = await tx.$executeRaw`
      UPDATE "StoreInventory"
      SET "onHand" = "onHand" - ${item.quantity}
      WHERE "variantId" = ${item.variantId}
        AND ("onHand" - "reserved") >= ${item.quantity}
    `;
    if (deducted === 0) {
      return { ok: false, reason: "STOCK_CONFLICT" };
    }
    const inv = await tx.storeInventory.findUnique({
      where: { variantId: item.variantId },
    });
    if (inv) {
      await tx.storeInventoryMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALE_DEDUCT",
          deltaOnHand: -item.quantity,
          deltaReserved: 0,
          onHandAfter: inv.onHand,
          reservedAfter: inv.reserved,
          orderId,
          reason: "Thanh toán muộn sau khi nhả giữ kho - trừ trực tiếp tồn khả dụng",
          actorId: actorId ?? null,
        },
      });
    }
  }

  return { ok: true };
}

export async function releaseOrderReservationsInTx(
  tx: PrismaTx,
  orderId: string,
  reason: string,
  actorId?: string | null,
): Promise<void> {
  const now = new Date();
  const activeReservations = await tx.storeStockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
  });

  for (const res of activeReservations) {
    const claim = await tx.storeStockReservation.updateMany({
      where: { id: res.id, status: "ACTIVE" },
      data: { status: "RELEASED", releasedAt: now },
    });
    if (claim.count === 0) continue;

    await tx.$executeRaw`
      UPDATE "StoreInventory"
      SET "reserved" = CASE WHEN "reserved" >= ${res.quantity} THEN "reserved" - ${res.quantity} ELSE 0 END
      WHERE "variantId" = ${res.variantId}
    `;

    const inv = await tx.storeInventory.findUnique({
      where: { variantId: res.variantId },
    });
    if (inv) {
      await tx.storeInventoryMovement.create({
        data: {
          variantId: res.variantId,
          type: "RELEASE",
          deltaOnHand: 0,
          deltaReserved: -res.quantity,
          onHandAfter: inv.onHand,
          reservedAfter: inv.reserved,
          orderId,
          reason,
          actorId: actorId ?? null,
        },
      });
    }
  }
}

export async function restockCommittedOrderInTx(
  tx: PrismaTx,
  orderId: string,
  reason: string,
  actorId?: string | null,
): Promise<void> {
  const committed = await tx.storeStockReservation.findMany({
    where: { orderId, status: "COMMITTED" },
  });
  const items =
    committed.length > 0
      ? committed.map((c) => ({ variantId: c.variantId, quantity: c.quantity }))
      : (await tx.storeOrderItem.findMany({ where: { orderId } }))
          .filter((i) => Boolean(i.variantId))
          .map((i) => ({ variantId: i.variantId as string, quantity: i.quantity }));

  for (const entry of items) {
    await tx.$executeRaw`
      UPDATE "StoreInventory"
      SET "onHand" = "onHand" + ${entry.quantity}
      WHERE "variantId" = ${entry.variantId}
    `;
    const inv = await tx.storeInventory.findUnique({
      where: { variantId: entry.variantId },
    });
    if (inv) {
      await tx.storeInventoryMovement.create({
        data: {
          variantId: entry.variantId,
          type: "RETURN_RESTOCK",
          deltaOnHand: entry.quantity,
          deltaReserved: 0,
          onHandAfter: inv.onHand,
          reservedAfter: inv.reserved,
          orderId,
          reason,
          actorId: actorId ?? null,
        },
      });
    }
  }
}

export async function adjustVariantInventory(params: {
  variantId: string;
  deltaOnHand: number;
  type: "IMPORT" | "ADJUST";
  reason: string;
  actorId?: string | null;
  lowStockThreshold?: number;
}) {
  const { variantId, deltaOnHand, type, reason, actorId, lowStockThreshold } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.storeInventory.findUnique({
      where: { variantId },
    });
    if (!existing) {
      if (deltaOnHand < 0) {
        throw new Error("CANNOT_ADJUST_BELOW_ZERO");
      }
      const created = await tx.storeInventory.create({
        data: {
          variantId,
          onHand: deltaOnHand,
          reserved: 0,
          lowStockThreshold: lowStockThreshold ?? 5,
        },
      });
      await tx.storeInventoryMovement.create({
        data: {
          variantId,
          type,
          deltaOnHand,
          deltaReserved: 0,
          onHandAfter: created.onHand,
          reservedAfter: 0,
          reason,
          actorId: actorId ?? null,
        },
      });
      return created;
    }

    const nextOnHand = existing.onHand + deltaOnHand;
    if (nextOnHand < existing.reserved || nextOnHand < 0) {
      throw new Error("CANNOT_REDUCE_BELOW_RESERVED");
    }

    const updated = await tx.storeInventory.update({
      where: { variantId },
      data: {
        onHand: nextOnHand,
        ...(typeof lowStockThreshold === "number" ? { lowStockThreshold } : {}),
      },
    });

    await tx.storeInventoryMovement.create({
      data: {
        variantId,
        type,
        deltaOnHand,
        deltaReserved: 0,
        onHandAfter: updated.onHand,
        reservedAfter: updated.reserved,
        reason,
        actorId: actorId ?? null,
      },
    });

    return updated;
  });
}

