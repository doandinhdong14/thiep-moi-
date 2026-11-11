import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role")?.trim() || "";
    const statusFilter = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    if (roleFilter && roleFilter !== "ALL") {
      where.roles = {
        some: {
          role: roleFilter,
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          status: true,
          locale: true,
          imageCredits: true,
          audioCredits: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              role: true,
              grantedAt: true,
              grantedBy: true,
            },
          },
          _count: {
            select: {
              invitations: true,
              orders: true,
              shopMemberships: true,
            },
          },
        },
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      status: u.status,
      locale: u.locale,
      imageCredits: u.imageCredits,
      audioCredits: u.audioCredits,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      roles: u.roles.map((r) => r.role),
      roleDetails: u.roles,
      stats: {
        invitationsCount: u._count.invitations,
        ordersCount: u._count.orders,
        shopsCount: u._count.shopMemberships,
      },
    }));

    return apiSuccess({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

