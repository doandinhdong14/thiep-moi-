import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const patchUserSchema = z.object({
  action: z.enum(["UPDATE_ROLES", "UPDATE_STATUS", "ADJUST_CREDITS", "UPDATE_INFO"]),
  roles: z.array(z.enum(["ADMIN", "CREATOR", "AFFILIATE", "SHOP_OWNER", "SHOP_STAFF"])).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
  imageCredits: z.number().int().min(0).optional(),
  audioCredits: z.number().int().min(0).optional(),
  name: z.string().min(2).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(["ADMIN"]);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        roles: true,
        invitations: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalVnd: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        shopMemberships: {
          include: {
            shop: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
        affiliateProfile: true,
      },
    });

    if (!user) {
      return apiError("Không tìm thấy người dùng.", "NOT_FOUND", 404);
    }

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        status: user.status,
        locale: user.locale,
        imageCredits: user.imageCredits,
        audioCredits: user.audioCredits,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.roles.map((r) => r.role),
        roleDetails: user.roles,
        invitations: user.invitations,
        orders: user.orders,
        shops: user.shopMemberships.map((sm) => ({
          ...sm.shop,
          memberRole: sm.role,
        })),
        affiliate: user.affiliateProfile,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireRole(["ADMIN"]);
    const body = await req.json();
    const data = patchUserSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { roles: true },
    });

    if (!targetUser) {
      return apiError("Không tìm thấy người dùng mục tiêu.", "NOT_FOUND", 404);
    }

    // Security check: Admin cannot suspend or demote themselves
    if (targetUser.id === adminUser.id) {
      if (data.action === "UPDATE_STATUS" && data.status !== "ACTIVE") {
        return apiError("Bạn không thể tự khóa tài khoản quản trị của chính mình.", "FORBIDDEN_SELF_ACTION", 403);
      }
      if (data.action === "UPDATE_ROLES" && data.roles && !data.roles.includes("ADMIN")) {
        return apiError("Bạn không thể tự gỡ quyền Quản trị viên (ADMIN) của chính mình.", "FORBIDDEN_SELF_ACTION", 403);
      }
    }

    let updatedResult: any = null;

    if (data.action === "UPDATE_ROLES") {
      if (!data.roles) {
        return apiError("Danh sách quyền không được rỗng.", "BAD_REQUEST", 400);
      }

      const existingRoles = targetUser.roles.map((r) => r.role);
      const newRoles = data.roles;

      // Roles to remove
      const rolesToRemove = existingRoles.filter((r) => !newRoles.includes(r as any));
      // Roles to add
      const rolesToAdd = newRoles.filter((r) => !existingRoles.includes(r));

      await prisma.$transaction(async (tx) => {
        if (rolesToRemove.length > 0) {
          await tx.roleAssignment.deleteMany({
            where: {
              userId: targetUser.id,
              role: { in: rolesToRemove },
            },
          });
        }

        for (const role of rolesToAdd) {
          await tx.roleAssignment.create({
            data: {
              userId: targetUser.id,
              role,
              grantedBy: `ADMIN:${adminUser.email}`,
            },
          });
        }
      });

      await logAudit({
        actorId: adminUser.id,
        actorRole: "ADMIN",
        action: "ADMIN_UPDATE_USER_ROLES",
        resourceType: "User",
        resourceId: targetUser.id,
        beforeSummary: { roles: existingRoles },
        afterSummary: { roles: newRoles },
      });

      updatedResult = { roles: newRoles };
    } else if (data.action === "UPDATE_STATUS") {
      if (!data.status) {
        return apiError("Trạng thái không hợp lệ.", "BAD_REQUEST", 400);
      }

      await prisma.user.update({
        where: { id: targetUser.id },
        data: { status: data.status },
      });

      // If suspended or deactivated, revoke all user sessions immediately
      if (data.status !== "ACTIVE") {
        await prisma.session.deleteMany({
          where: { userId: targetUser.id },
        });
      }

      await logAudit({
        actorId: adminUser.id,
        actorRole: "ADMIN",
        action: "ADMIN_UPDATE_USER_STATUS",
        resourceType: "User",
        resourceId: targetUser.id,
        beforeSummary: { status: targetUser.status },
        afterSummary: { status: data.status },
      });

      updatedResult = { status: data.status };
    } else if (data.action === "ADJUST_CREDITS") {
      const newImageCredits = data.imageCredits !== undefined ? data.imageCredits : targetUser.imageCredits;
      const newAudioCredits = data.audioCredits !== undefined ? data.audioCredits : targetUser.audioCredits;

      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          imageCredits: newImageCredits,
          audioCredits: newAudioCredits,
        },
      });

      await logAudit({
        actorId: adminUser.id,
        actorRole: "ADMIN",
        action: "ADMIN_ADJUST_USER_CREDITS",
        resourceType: "User",
        resourceId: targetUser.id,
        beforeSummary: { imageCredits: targetUser.imageCredits, audioCredits: targetUser.audioCredits },
        afterSummary: { imageCredits: newImageCredits, audioCredits: newAudioCredits },
      });

      updatedResult = { imageCredits: newImageCredits, audioCredits: newAudioCredits };
    } else if (data.action === "UPDATE_INFO") {
      if (!data.name) {
        return apiError("Tên không hợp lệ.", "BAD_REQUEST", 400);
      }

      await prisma.user.update({
        where: { id: targetUser.id },
        data: { name: data.name },
      });

      await logAudit({
        actorId: adminUser.id,
        actorRole: "ADMIN",
        action: "ADMIN_UPDATE_USER_INFO",
        resourceType: "User",
        resourceId: targetUser.id,
        beforeSummary: { name: targetUser.name },
        afterSummary: { name: data.name },
      });

      updatedResult = { name: data.name };
    }

    return apiSuccess({
      message: "Cập nhật tài khoản thành công.",
      updated: updatedResult,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

