import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { requireShopStaff } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { releaseExpiredReservations } from "@/lib/shop/inventory";
import { escapeCsvCell } from "@/lib/shop/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireShopStaff();
    await releaseExpiredReservations().catch(() => 0);

    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim() || "";
    const paymentMethod = url.searchParams.get("paymentMethod")?.trim() || "";
    const q = url.searchParams.get("q")?.trim() || "";
    const format = url.searchParams.get("format");

    const orders = await prisma.storeOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        ...(q
          ? {
              OR: [
                { orderCode: { contains: q.toUpperCase() } },
                { customerName: { contains: q } },
                { customerPhone: { contains: q } },
                { recipientName: { contains: q } },
                { recipientPhone: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        items: true,
        giftUnits: { orderBy: { unitIndex: "asc" } },
        shipments: { orderBy: { createdAt: "desc" }, take: 1 },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: format === "csv" ? 1000 : 120,
    });

    if (format === "csv") {
      const headers = [
        "MaDon",
        "TrangThai",
        "TrangThaiThanhToan",
        "PhuongThuc",
        "NguoiDat",
        "SDTDat",
        "NguoiNhan",
        "SDTNhan",
        "TinhThanh",
        "SoHop",
        "TongTienVND",
        "MaVanDon",
        "NgayTao",
      ];
      const rows = orders.map((o) => [
        escapeCsvCell(o.orderCode),
        escapeCsvCell(o.status),
        escapeCsvCell(o.paymentStatus),
        escapeCsvCell(o.paymentMethod),
        escapeCsvCell(o.customerName),
        escapeCsvCell(o.customerPhone),
        escapeCsvCell(o.recipientName),
        escapeCsvCell(o.recipientPhone),
        escapeCsvCell(o.provinceName),
        escapeCsvCell(o.giftUnits.length),
        escapeCsvCell(o.totalVnd),
        escapeCsvCell(o.shipments[0]?.trackingCode || ""),
        escapeCsvCell(o.createdAt.toISOString()),
      ]);
      const csv = [headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
      return new NextResponse(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="dingdonggift-orders.csv"`,
        },
      });
    }

    return apiSuccess(
      orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        recipientName: o.recipientName,
        recipientPhone: o.recipientPhone,
        provinceName: o.provinceName,
        subtotalVnd: o.subtotalVnd,
        shippingFeeVnd: o.shippingFeeVnd,
        totalVnd: o.totalVnd,
        needsStockResolution: o.needsStockResolution,
        boxCount: o.giftUnits.length,
        itemSummary: o.items.map((i) => `${i.productNameSnapshot} ×${i.quantity}`).join(", "),
        trackingCode: o.shipments[0]?.trackingCode || null,
        carrierName: o.shipments[0]?.carrierName || null,
        createdAt: o.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    return handleShopApiError(err);
  }
}

