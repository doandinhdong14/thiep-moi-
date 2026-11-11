import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Họ và tên phải có ít nhất 2 ký tự").max(100, "Tên không được vượt quá 100 ký tự"),
  image: z.string().url("Đường dẫn ảnh đại diện không hợp lệ").optional().nullable(),
  locale: z.enum(["vi-VN", "en-US"]).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Bạn cần đăng nhập để thực hiện thao tác này.", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parsed = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name,
        ...(parsed.image !== undefined ? { image: parsed.image } : {}),
        ...(parsed.locale ? { locale: parsed.locale } : {}),
      },
      include: {
        roles: true,
      },
    });

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0] || "USER",
      action: "USER_UPDATE_PROFILE",
      resourceType: "User",
      resourceId: user.id,
      beforeSummary: { name: user.name },
      afterSummary: { name: updatedUser.name },
    });

    return apiSuccess({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        status: updatedUser.status,
        locale: updatedUser.locale,
        imageCredits: updatedUser.imageCredits,
        audioCredits: updatedUser.audioCredits,
        createdAt: updatedUser.createdAt,
        roles: updatedUser.roles.map((r) => r.role),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

