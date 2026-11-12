import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import {
  getShopSettings,
  isBankTransferConfigured,
  isPayOSGatewayAvailable,
} from "@/lib/shop/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireShopStaff();
    await releaseExpiredReservations().catch(() => 0);

    const settings = await getShopSettings();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      pendingPaymentOrders,
      reviewRequestedOrders,
      packingOrders,
      stockConflictOrders,
      paidRevenueAgg,
      activeProductCount,
      draftProductCount,
      allInventory,
      recentOrders,
      recentAudit,
    ] = await Promise.all([
      prisma.storeOrder.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.storeOrder.count({
        where: { status: "PENDING_PAYMENT" },
      }),
      prisma.storeOrder.count({
        where: { status: "PAYMENT_REVIEW_REQUESTED" },
      }),
      prisma.storeOrder.count({
        where: { status: { in: ["PAID", "PACKING", "READY_TO_SHIP"] } },
      }),
      prisma.storeOrder.count({
        where: { status: "STOCK_CONFLICT_REFUND_NEEDED" },
      }),
      prisma.storeOrder.aggregate({
        where: {
          paymentStatus: "PAID",
          status: {
            notIn: ["CANCELLED", "REFUNDED", "REFUND_PENDING_MANUAL", "EXPIRED"],
          },
        },
        _sum: { totalVnd: true },
        _count: { id: true },
      }),
      prisma.storeProduct.count({ where: { status: "ACTIVE" } }),
      prisma.storeProduct.count({ where: { status: "DRAFT" } }),
      prisma.storeInventory.findMany({
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true, status: true } },
            },
          },
        },
      }),
      prisma.storeOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          _count: { select: { giftUnits: true } },
        },
      }),
      prisma.storeAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const lowStockVariants = allInventory
      .filter((inv) => {
        const available = Math.max(0, inv.onHand - inv.reserved);
        return available <= inv.lowStockThreshold && inv.variant.product.status !== "ARCHIVED";
      })
      .map((inv) => ({
        variantId: inv.variantId,
        sku: inv.variant.sku,
        variantName: inv.variant.name,
        productName: inv.variant.product.name,
        productStatus: inv.variant.product.status,
        onHand: inv.onHand,
        reserved: inv.reserved,
        available: Math.max(0, inv.onHand - inv.reserved),
        lowStockThreshold: inv.lowStockThreshold,
      }));

    return apiSuccess({
      kpis: {
        ordersToday,
        pendingPaymentOrders,
        reviewRequestedOrders,
        packingOrders,
        stockConflictOrders,
        confirmedRevenueVnd: paidRevenueAgg._sum.totalVnd || 0,
        paidOrdersCount: paidRevenueAgg._count.id || 0,
        activeProductCount,
        draftProductCount,
        lowStockCount: lowStockVariants.length,
      },
      configurationStatus: {
        storeOpen: settings.storeOpen,
        bankTransferConfigured: isBankTransferConfigured(settings),
        payosConfigured: isPayOSGatewayAvailable(settings),
        codEnabled: settings.cod.enabled,
        shippingConfigured: settings.shipping.configured,
      },
      lowStockVariants: lowStockVariants.slice(0, 12),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        customerName: o.customerName,
        recipientName: o.recipientName,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        totalVnd: o.totalVnd,
        boxCount: o._count.giftUnits,
        createdAt: o.createdAt.toISOString(),
      })),
      recentAudit: recentAudit.map((a) => ({
        id: a.id,
        action: a.action,
        summary: a.summary,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

