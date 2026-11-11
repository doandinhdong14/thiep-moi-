import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireRole(["ADMIN"]);

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return apiError("Không tìm thấy người dùng.", "NOT_FOUND", 404);
    }

    let rawPassword = "";
    try {
      const body = await req.json();
      const parsed = resetPasswordSchema.parse(body);
      rawPassword = parsed.newPassword || "";
    } catch {
      // Body is empty or optional
    }

    if (!rawPassword) {
      // Generate a secure 12-char random alphanumeric password
      rawPassword = `Pass@${crypto.randomBytes(4).toString("hex")}!`;
    }

    const passwordHash = await hashPassword(rawPassword);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash },
    });

    // Revoke all existing sessions so user must log in with new password
    await prisma.session.deleteMany({
      where: { userId: targetUser.id },
    });

    await logAudit({
      actorId: adminUser.id,
      actorRole: "ADMIN",
      action: "ADMIN_RESET_PASSWORD",
      resourceType: "User",
      resourceId: targetUser.id,
    });

    return apiSuccess({
      message: `Đã đặt lại mật khẩu cho tài khoản ${targetUser.email}`,
      temporaryPassword: rawPassword,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

