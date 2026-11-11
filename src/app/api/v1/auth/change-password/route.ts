import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, getSessionToken, hashPassword, verifyPassword } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Bạn cần đăng nhập để đổi mật khẩu.", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return apiError("Tài khoản chưa được thiết lập mật khẩu.", "NO_PASSWORD_SET", 400);
    }

    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return apiError("Mật khẩu hiện tại không chính xác.", "INVALID_PASSWORD", 400);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Invalidate other sessions for security (keep current session)
    const currentToken = await getSessionToken();
    if (currentToken) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: currentToken },
        },
      });
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0] || "USER",
      action: "USER_CHANGE_PASSWORD",
      resourceType: "User",
      resourceId: user.id,
    });

    return apiSuccess({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    return handleApiError(err);
  }
}

